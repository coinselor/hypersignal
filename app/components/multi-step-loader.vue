<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";

type Step = {
  text: string;
  afterText?: string;
  async?: boolean;
  duration?: number;
  action?: () => void | Promise<void>;
};
type Props = {
  steps: Step[];
  loading?: boolean;
  defaultDuration?: number;
  preventClose?: boolean;
};
const props = withDefaults(defineProps<Props>(), {
  loading: false,
  defaultDuration: 1500,
  preventClose: false,
});

const emit = defineEmits<{
  stateChange: [number];
  complete: [];
  close: [];
}>();

const currentState = ref(0);
const stepStartTime = ref(Date.now());
const isLastStepComplete = ref(false);
let currentTimer: any = null;

async function executeStepAction(step: Step) {
  if (typeof step.action === "function") {
    await step.action();
  }
}

async function proceedToNextStep() {
  const currentStep = props.steps[currentState.value];
  if (!currentStep)
    return;
  await executeStepAction(currentStep);
  if (currentState.value < props.steps.length - 1) {
    currentState.value++;
    stepStartTime.value = Date.now();
    emit("stateChange", currentState.value);
    processCurrentStep();
  }
  else {
    isLastStepComplete.value = true;
    emit("complete");
  }
}

async function processCurrentStep() {
  if (currentTimer) {
    clearTimeout(currentTimer);
  }
  const currentStep = props.steps[currentState.value];
  if (!currentStep)
    return;
  const duration = currentStep.duration || props.defaultDuration;
  if (!currentStep.async) {
    currentTimer = setTimeout(() => {
      proceedToNextStep();
    }, duration);
  }
}

function close() {
  emit("close");
}

onUnmounted(() => {
  if (currentTimer) {
    clearTimeout(currentTimer);
  }
});

watch(
  () => props.steps[currentState.value]?.async,
  async (isAsync, oldIsAsync) => {
    if (isAsync === false && oldIsAsync === true) {
      const currentStep = props.steps[currentState.value];
      if (!currentStep)
        return;
      const duration = currentStep.duration || props.defaultDuration;
      currentTimer = setTimeout(() => {
        proceedToNextStep();
      }, duration);
    }
  },
);

watch(
  () => props.loading,
  (newLoading) => {
    if (newLoading) {
      currentState.value = 0;
      stepStartTime.value = Date.now();
      isLastStepComplete.value = false;
      processCurrentStep();
    }
    else if (currentTimer) {
      clearTimeout(currentTimer);
    }
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="loading && steps.length > 0"
        class="fixed inset-0 z-120 flex size-full items-center justify-center backdrop-blur-2xl"
      >
        <button
          v-show="!preventClose"
          class="absolute right-4 top-4 z-130 inline-flex h-9 w-9 items-center justify-center rounded-md bg-neutral-900 text-white ring-offset-background transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          size="sm"
          @click="close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div class="relative h-96">
          <div class="relative mx-auto mt-40 flex max-w-xl flex-col justify-start">
            <div
              v-for="(step, index) in steps"
              :key="index"
            >
              <div
                v-if="step"
                class="mb-4 flex items-center gap-2 text-left transition-all duration-300 ease-in-out"
                :style="{ opacity: index === currentState ? 1 : Math.max(1 - Math.abs(index - currentState) * 0.2, 0), transform: `translateY(${-(currentState * 40)}px)` }"
              >
                <svg
                  v-if="index < currentState || (index === steps.length - 1 && index === currentState && isLastStepComplete)"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="size-6 text-primary"
                >
                  <path
                    fill-rule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                    clip-rule="evenodd"
                  />
                </svg>
                <svg
                  v-else-if="index === currentState && (!isLastStepComplete || index !== steps.length - 1)"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="size-6 animate-spin text-primary"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z"
                    clip-rule="evenodd"
                  />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-6 text-black opacity-50 dark:text-white"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <div class="flex flex-col">
                  <span class="text-lg text-black dark:text-white" :class="{ 'opacity-50': index > currentState }">{{ step.text }}</span>
                  <Transition
                    enter-active-class="transition-all duration-300"
                    enter-from-class="opacity-0 -translate-y-1"
                    enter-to-class="opacity-100 translate-y-0"
                  >
                    <span v-if="step.afterText && (index < currentState || (index === steps.length - 1 && index === currentState && isLastStepComplete))" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ step.afterText }}</span>
                  </Transition>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="absolute inset-x-0 bottom-0 -z-1 h-full bg-white bg-linear-to-t mask-[radial-gradient(900px_at_center,white_30%,transparent)] dark:bg-black" />
      </div>
    </Transition>
  </Teleport>
</template>
