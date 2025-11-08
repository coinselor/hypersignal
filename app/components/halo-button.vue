<script setup lang="ts">
import type { HTMLAttributes } from "vue";

import { motion } from "motion-v";

type Props = {
  class?: HTMLAttributes["class"];
};

const props = defineProps<Props>();
const emit = defineEmits(["click"]);
</script>

<template>
  <motion.div
    id="halo-button"
    :class="props.class"
    :initial="{ opacity: 0, y: -4, scale: 0.98 }"
    :animate="{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 32, mass: 0.6 } }"
    :while-hover="{ scale: 1.015 }"
    :while-tap="{ scale: 0.985 }"
  >
    <div class="aurora-glow" />
    <div class="outer-ring" />
    <div class="outer-ring" />
    <div class="outer-ring" />

    <div class="inner-glow" />

    <div class="main-border" />

    <div id="button-wrapper">
      <button
        type="button"
        class="halo-btn"
        @click="emit('click')"
      >
        <slot />
      </button>
    </div>
  </motion.div>
</template>

<style scoped>
#halo-button {
  position: relative;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

#button-wrapper {
  position: relative;
  z-index: 1;
}

.halo-btn {
  position: relative;
  background-color: #010201;
  border: none;
  min-width: 260px;
  height: 56px;
  border-radius: 10px;
  color: white;
  padding: 0 32px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
}

.halo-btn:focus {
  outline: none;
}

.inner-glow,
.main-border,
.outer-ring,
.aurora-glow {
  max-height: 70px;
  max-width: 314px;
  height: 100%;
  width: 100%;
  position: absolute;
  overflow: hidden;
  z-index: -1;
  border-radius: 12px;
  filter: blur(3px);
}

.inner-glow {
  max-height: 63px;
  max-width: 307px;
  border-radius: 10px;
  filter: blur(2px);
}

.inner-glow::before {
  content: "";
  z-index: -2;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(83deg);
  position: absolute;
  width: 600px;
  height: 600px;
  background-repeat: no-repeat;
  background-position: 0 0;
  filter: brightness(1.4);
  background-image: conic-gradient(
    rgba(0, 0, 0, 0) 0%,
    #3b82f6,
    rgba(0, 0, 0, 0) 8%,
    rgba(0, 0, 0, 0) 50%,
    #84cc16,
    rgba(0, 0, 0, 0) 58%
  );
  transition: all 2s;
}

.main-border {
  max-height: 59px;
  max-width: 303px;
  border-radius: 11px;
  filter: blur(0.5px);
}

.main-border::before {
  content: "";
  z-index: -2;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(70deg);
  position: absolute;
  width: 600px;
  height: 600px;
  filter: brightness(1.3);
  background-repeat: no-repeat;
  background-position: 0 0;
  background-image: conic-gradient(#1c191c, #3b82f6 5%, #1c191c 14%, #1c191c 50%, #84cc16 60%, #1c191c 64%);
  transition: all 2s;
}

.outer-ring {
  max-height: 65px;
  max-width: 312px;
}

.outer-ring::before {
  content: "";
  z-index: -2;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(82deg);
  position: absolute;
  width: 600px;
  height: 600px;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-image: conic-gradient(
    rgba(0, 0, 0, 0),
    #22d3ee,
    rgba(0, 0, 0, 0) 10%,
    rgba(0, 0, 0, 0) 50%,
    #84cc16,
    rgba(0, 0, 0, 0) 60%
  );
  transition: all 2s;
}

.aurora-glow {
  overflow: hidden;
  filter: blur(30px);
  opacity: 0.4;
  max-height: 130px;
  max-width: 354px;
}

.aurora-glow::before {
  content: "";
  z-index: -2;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(60deg);
  position: absolute;
  width: 999px;
  height: 999px;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-image: conic-gradient(#000, #0ea5e9 5%, #000 38%, #000 50%, #84cc16 60%, #000 87%);
  transition: all 2s;
}

/* Hover effects */
#halo-button:hover > .outer-ring::before {
  transform: translate(-50%, -50%) rotate(-98deg);
}

#halo-button:hover > .aurora-glow::before {
  transform: translate(-50%, -50%) rotate(-120deg);
}

#halo-button:hover > .inner-glow::before {
  transform: translate(-50%, -50%) rotate(-97deg);
}

#halo-button:hover > .main-border::before {
  transform: translate(-50%, -50%) rotate(-110deg);
}
</style>
