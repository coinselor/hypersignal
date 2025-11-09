<script setup lang="ts">
import type { NostrSigner } from "@nostrify/nostrify";
import type { NostrEvent } from "nostr-tools";

import { z } from "zod";

import { createHyperSignalEvent } from "../../models/events";
import { useFeed } from "../composables/use-feed";
import { ensureAuthForSpecialRelays } from "../composables/use-nostr-pool";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "signalCreated": [];
}>();

const toast = useToast();
const { user } = useCurrentUser();
const { isAuthorized } = useAuthorization();
const pool = useNostrPool();
const { refreshFeed } = useFeed();

// Multi-step wizard state
const currentStep = ref(1);
const signalType = ref<"upgrade" | "reboot" | null>(null);

// Form data
const formData = ref({
  version: "",
  hash: "",
  network: "hqz",
  content: "",
  genesisUrl: "",
  requiredBy: "",
});

// Validation errors
const errors = ref<Record<string, string>>({});

// Event preview
const eventDraft = ref<Omit<NostrEvent, "id" | "sig"> | null>(null);

// Loading states
const isPublishing = ref(false);
const authLoading = ref(false);
const loaderSteps = ref<{ text: string; async?: boolean }[]>([]);
let authAbort: AbortController | null = null;

function onAuthOverlayClose() {
  try {
    authAbort?.abort();
  }
  catch {}
  finally {
    authLoading.value = false;
  }
}

function setLoaderMessage(message: string) {
  loaderSteps.value = [{ text: message, async: true }];
}

// Validation schemas
const hexSchema = z.string().regex(/^[0-9a-f]+$/, "Must contain only hexadecimal characters");
const urlSchema = z.string().url("Must be a valid URL");
const timestampSchema = z.string().regex(/^\d+$/, "Must be a valid timestamp");

// Reset form
function resetForm() {
  currentStep.value = 1;
  signalType.value = null;
  formData.value = {
    version: "",
    hash: "",
    network: "hqz",
    content: "",
    genesisUrl: "",
    requiredBy: Math.floor(Date.now() / 1000).toString(),
  };
  errors.value = {};
  eventDraft.value = null;
  isPublishing.value = false;
}

// Step navigation
function goToStep(step: number) {
  currentStep.value = step;
}

function selectSignalType(type: "upgrade" | "reboot") {
  signalType.value = type;
  // Pre-populate timestamp for reboot
  if (type === "reboot" && !formData.value.requiredBy) {
    formData.value.requiredBy = Math.floor(Date.now() / 1000).toString();
  }
  goToStep(2);
}

// Validation
function validateField(field: string, value: string): string | null {
  try {
    switch (field) {
      case "hash":
        hexSchema.parse(value);
        break;
      case "genesisUrl":
        if (signalType.value === "reboot" && !value) {
          return "Genesis URL is required for reboot";
        }
        if (value) {
          urlSchema.parse(value);
        }
        break;
      case "requiredBy":
        if (signalType.value === "reboot" && !value) {
          return "Required by timestamp is required for reboot";
        }
        if (value) {
          timestampSchema.parse(value);
        }
        break;
      case "version":
      case "network":
        if (!value.trim()) {
          return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        }
        break;
    }
    return null;
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0].message;
    }
    return "Invalid value";
  }
}

function validateForm(): boolean {
  errors.value = {};
  let isValid = true;

  // Validate required fields
  const requiredFields = ["version", "hash", "network"];
  if (signalType.value === "reboot") {
    requiredFields.push("genesisUrl", "requiredBy");
  }

  for (const field of requiredFields) {
    const value = formData.value[field as keyof typeof formData.value];
    const error = validateField(field, value);
    if (error) {
      errors.value[field] = error;
      isValid = false;
    }
  }

  return isValid;
}

// Generate event preview
function generatePreview() {
  if (!validateForm()) {
    return;
  }

  if (!user.value) {
    toast.add({
      title: "Authentication Required",
      description: "Please log in to create a signal",
      color: "error",
    });
    return;
  }

  if (user.value.pubkey && !isAuthorized(user.value.pubkey)) {
    toast.add({
      title: "Unauthorized",
      description: "You are not authorized to create signals",
      color: "error",
    });
    return;
  }

  try {
    eventDraft.value = createHyperSignalEvent({
      pubkey: user.value.pubkey,
      version: formData.value.version,
      hash: formData.value.hash,
      network: formData.value.network,
      action: signalType.value!,
      content: formData.value.content,
      genesisUrl: signalType.value === "reboot" ? formData.value.genesisUrl : undefined,
      requiredBy: signalType.value === "reboot" ? formData.value.requiredBy : undefined,
    });

    goToStep(3);
  }
  catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to create event draft",
      color: "error",
    });
  }
}

// Sign and publish
async function signAndPublish() {
  if (!eventDraft.value || !user.value) {
    return;
  }

  isPublishing.value = true;

  try {
    // Pre-authenticate special relays with multi-step loader
    authLoading.value = true;
    authAbort = new AbortController();
    setLoaderMessage("Awaiting event signatures…");
    await ensureAuthForSpecialRelays({ signal: authAbort.signal });

    // Check if extension is available (for browser extension login)
    const windowNostr = (globalThis as unknown as { nostr?: NostrSigner }).nostr;
    if (user.value.method === "extension" && !windowNostr) {
      throw new Error("Please install a NIP-07 compatible Nostr extension");
    }

    // Sign the event (convert to plain object to avoid DataCloneError with browser extension)
    const plainEvent = JSON.parse(JSON.stringify(eventDraft.value));
    const signedEvent = await user.value.signer.signEvent(plainEvent);

    // Publish to special relays
    const _publishResult = await pool.event(signedEvent);

    toast.add({
      title: "HyperSignal Sent!",
      description: `${signalType.value === "upgrade" ? "Upgrade" : "Reboot"} signal published successfully`,
      color: "success",
    });

    refreshFeed();
    emit("signalCreated");
    emit("update:open", false);
    resetForm();
  }
  catch (error) {
    console.error("Error signing/publishing event:", error);

    let errorMessage = "Failed to sign and publish signal";
    if (error instanceof Error) {
      if (error.message.includes("User rejected")) {
        errorMessage = "Signature rejected. Please try again.";
        goToStep(3); // Return to preview
      }
      else if (error.message.includes("extension")) {
        errorMessage = error.message;
      }
      else {
        errorMessage = error.message;
      }
    }

    toast.add({
      title: "Error",
      description: errorMessage,
      color: "error",
    });
  }
  finally {
    isPublishing.value = false;
    authLoading.value = false;
    authAbort = null;
  }
}

// Watch for open prop changes
watch(() => props.open, (newValue) => {
  if (newValue) {
    resetForm();
  }
});
</script>

<template>
  <UModal
    :open="open"
    title="Send HyperSignal"
    :description="currentStep === 1 ? 'Choose the type of signal to send to HyperQube nodes.' : undefined"
    @update:open="$emit('update:open', $event)"
  >
    <template #body>
      <!-- Step 1: Signal Type Selection -->
      <div v-if="currentStep === 1" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <button
            type="button"
            class="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
            @click="selectSignalType('upgrade')"
          >
            <div class="flex items-center gap-3 justify-center">
              <UIcon name="i-lucide-arrow-up-circle" class="text-3xl" />
              <h4 class="font-semibold text-lg">
                Upgrade
              </h4>
            </div>
          </button>

          <button
            type="button"
            class="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
            @click="selectSignalType('reboot')"
          >
            <div class="flex items-center gap-3 justify-center">
              <UIcon name="i-lucide-refresh-cw" class="text-3xl" />
              <h4 class="font-semibold text-lg">
                Reboot
              </h4>
            </div>
          </button>
        </div>
      </div>

      <!-- Step 2: Form Fields -->
      <div v-else-if="currentStep === 2" class="space-y-4">
        <div class="flex items-center justify-center gap-2 mb-4">
          <UBadge color="primary" variant="soft">
            {{ signalType === 'upgrade' ? 'Upgrade' : 'Reboot' }}
          </UBadge>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Version <span class="text-lime-500">*</span></label>
          <UInput
            v-model="formData.version"
            placeholder="1.0.0"
            size="md"
            class="w-full"
            @blur="errors.version = validateField('version', formData.version) || ''"
          />
          <p v-if="errors.version" class="mt-1 text-sm text-red-500">
            {{ errors.version }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Hash <span class="text-lime-500">*</span></label>
          <UInput
            v-model="formData.hash"
            placeholder="a1b2c3d4..."
            size="md"
            class="w-full"
            @blur="errors.hash = validateField('hash', formData.hash) || ''"
          />
          <p v-if="errors.hash" class="mt-1 text-sm text-red-500">
            {{ errors.hash }}
          </p>
          <p class="mt-1 text-xs text-gray-500">
            Hexadecimal hash of the software
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Network <span class="text-lime-500">*</span></label>
          <UInput
            v-model="formData.network"
            placeholder="hqz"
            size="md"
            class="w-full"
            @blur="errors.network = validateField('network', formData.network) || ''"
          />
          <p v-if="errors.network" class="mt-1 text-sm text-red-500">
            {{ errors.network }}
          </p>
        </div>

        <!-- Reboot-specific fields -->
        <template v-if="signalType === 'reboot'">
          <div>
            <label class="block text-sm font-medium mb-1">Genesis URL <span class="text-lime-500">*</span></label>
            <UInput
              v-model="formData.genesisUrl"
              type="url"
              placeholder="https://..."
              size="md"
              class="w-full"
              @blur="errors.genesisUrl = validateField('genesisUrl', formData.genesisUrl) || ''"
            />
            <p v-if="errors.genesisUrl" class="mt-1 text-sm text-red-500">
              {{ errors.genesisUrl }}
            </p>
            <p class="mt-1 text-xs text-gray-500">
              URL to the genesis configuration
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Required By <span class="text-lime-500">*</span></label>
            <UInput
              v-model="formData.requiredBy"
              placeholder="1704067200"
              size="md"
              class="w-full"
              @blur="errors.requiredBy = validateField('requiredBy', formData.requiredBy) || ''"
            />
            <p v-if="errors.requiredBy" class="mt-1 text-sm text-red-500">
              {{ errors.requiredBy }}
            </p>
            <p class="mt-1 text-xs text-gray-500">
              Unix timestamp when reboot must complete
            </p>
          </div>
        </template>

        <div>
          <label class="block text-sm font-medium mb-1">Content (optional)</label>
          <UTextarea
            v-model="formData.content"
            placeholder="Optional message..."
            :rows="3"
            class="w-full"
          />
          <p class="mt-1 text-xs text-gray-500">
            Additional information or notes
          </p>
        </div>
      </div>

      <!-- Step 3: Preview -->
      <div v-else-if="currentStep === 3 && eventDraft" class="space-y-4">
        <div class="flex items-center gap-2 mb-4">
          <UIcon name="i-lucide-eye" class="text-zinc-400" />
          <h4 class="font-semibold">
            Preview Event
          </h4>
        </div>

        <CodePreview label="">
          <!-- Preview slot: formatted event details -->
          <div class="w-full space-y-3 text-sm">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-zinc-500 dark:text-zinc-400">Kind:</span>
              <UBadge color="primary" variant="soft">
                {{ eventDraft.kind }}
              </UBadge>
            </div>
            <div>
              <div class="font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                Tags:
              </div>
              <div class="space-y-1">
                <div v-for="(tag, index) in eventDraft.tags" :key="index" class="flex items-start gap-2 font-mono text-xs">
                  <span class="text-lime-600 dark:text-lime-400">[{{ index }}]</span>
                  <span class="text-zinc-700 dark:text-zinc-300">{{ JSON.stringify(tag) }}</span>
                </div>
              </div>
            </div>
            <div v-if="eventDraft.content">
              <div class="font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                Content:
              </div>
              <p class="text-zinc-700 dark:text-zinc-300 italic">
                {{ eventDraft.content }}
              </p>
            </div>
          </div>
        </CodePreview>

        <UAlert
          icon="i-lucide-info"
          color="primary"
          variant="soft"
          title="Ready to sign"
          description="Review the event above, then click 'Sign Event' to request signature from your Nostr extension."
        />
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <!-- Back button -->
        <UButton
          v-if="currentStep > 1"
          color="neutral"
          variant="ghost"
          @click="goToStep(currentStep - 1)"
        >
          Back
        </UButton>
        <div v-else />

        <!-- Next/Action buttons -->
        <div class="flex items-center gap-2">
          <UButton
            v-if="currentStep === 2"
            color="primary"
            @click="generatePreview"
          >
            Preview
          </UButton>

          <UButton
            v-if="currentStep === 3"
            color="primary"
            :loading="isPublishing"
            @click="signAndPublish"
          >
            {{ isPublishing ? 'Publishing...' : 'Sign Event' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
  <MultiStepLoader :steps="loaderSteps" :loading="authLoading" @close="onAuthOverlayClose" />
</template>
