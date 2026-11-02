<script setup lang="ts">
// The kit's theme.js builds this control after `.nb-nav` on DOMContentLoaded. Here the head is rendered
// by Vue, and a node inserted before hydration would be dropped as a mismatch, so the site renders the
// same markup itself and the head's nav uses `.fe-nav` instead of `.nb-nav`.
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { chooseScheme } from './theme-sync.mjs';

// Unknown on the server, so both words render unpressed until the page is mounted.
const current = ref<'light' | 'dark' | null>(null);
let observer: MutationObserver | undefined;

onMounted(() => {
  const root = document.documentElement;
  const read = () => {
    current.value = root.dataset.theme === 'dark' ? 'dark' : 'light';
  };
  read();
  observer = new MutationObserver(read);
  observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
});

onBeforeUnmount(() => observer?.disconnect());

function choose(scheme: 'light' | 'dark') {
  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  chooseScheme(document.documentElement, storage, scheme);
}
</script>

<template>
  <div class="nb-theme" role="group" aria-label="配色方案">
    <button type="button" data-scheme="light" :aria-pressed="current === 'light' ? 'true' : 'false'" @click="choose('light')">白天</button>
    <button type="button" data-scheme="dark" :aria-pressed="current === 'dark' ? 'true' : 'false'" @click="choose('dark')">晚上</button>
  </div>
</template>
