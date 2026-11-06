<script setup lang="ts">
// The band above a lesson page: on a week page the week's hue, its eyebrow and a bar of the owner's own
// record, with the loop band (the kit's .nb-steps) under them; on the other lesson pages the loop band
// alone; on the two record pages the bar alone. The server renders it with no record, so every step is
// pending; the stored record applies once mounted and again whenever a component on the page writes
// one. Opening a lesson page writes its read mark.
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
import { withBase } from 'vitepress';
import { data as course } from './course.data.mjs';
import { RECORD_EVENT, lessonFor, lessonSteps, markVisit, pageBand, readRecords } from './course-record.mjs';

const props = defineProps<{ relativePath: string }>();

type Records = ReturnType<typeof readRecords> | null;

const records = shallowRef<Records>(null);

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function refresh() {
  records.value = readRecords(storage());
}

function visit() {
  if (!lesson.value) return;
  const store = storage();
  if (store) markVisit(store, props.relativePath, 'readAt');
}

onMounted(() => {
  window.addEventListener(RECORD_EVENT, refresh);
  window.addEventListener('storage', refresh);
  refresh();
  visit();
});

onBeforeUnmount(() => {
  window.removeEventListener(RECORD_EVENT, refresh);
  window.removeEventListener('storage', refresh);
});

watch(() => props.relativePath, visit);

const band = computed(() => pageBand(props.relativePath, course.weeks, records.value ?? { progress: null, review: null, visits: null }));
const lesson = computed(() => lessonFor(course, props.relativePath));
const steps = computed(() => (lesson.value ? lessonSteps(lesson.value, course, records.value) : null));
const fraction = computed(() => (band.value && band.value.max > 0 ? band.value.value / band.value.max : 0));
const stepHref = (href: string) => (href.startsWith('#') ? href : withBase(href));
</script>

<template>
  <div v-if="band || steps" class="fe-band-wrap">
    <div v-if="band" class="fe-band" :data-hue="band.hue">
      <p class="fe-band-eyebrow">{{ band.eyebrow }}</p>
      <div class="fe-band-progress">
        <span class="fe-band-note">{{ band.note }}</span>
        <div
          class="nb-bar nb-bar--on-fill"
          role="progressbar"
          :aria-label="band.label"
          aria-valuemin="0"
          :aria-valuemax="band.max"
          :aria-valuenow="band.value"
          :style="{ '--nb-fraction': String(fraction) }"
        >
          <span></span>
        </div>
      </div>
      <ol v-if="steps" class="nb-steps nb-steps--on-fill fe-steps" aria-label="这一课的五步">
        <li v-for="entry in steps" :key="entry.step" :data-step="entry.step" :data-state="entry.state">
          <a v-if="entry.href" :href="stepHref(entry.href)">{{ entry.label }}</a>
          <span v-else>{{ entry.label }}</span>
          <span v-if="entry.count" class="nb-steps-count">{{ entry.count }}</span>
        </li>
      </ol>
    </div>
    <ol v-else-if="steps" class="nb-steps fe-steps" aria-label="这一课的五步">
      <li v-for="entry in steps" :key="entry.step" :data-step="entry.step" :data-state="entry.state">
        <a v-if="entry.href" :href="stepHref(entry.href)">{{ entry.label }}</a>
        <span v-else>{{ entry.label }}</span>
        <span v-if="entry.count" class="nb-steps-count">{{ entry.count }}</span>
      </li>
    </ol>
  </div>
</template>
