<script setup lang="ts">
// The thin filled band above a reading page under 90-days/: the week's hue, its eyebrow and a bar of the
// owner's own record. The server renders it with no record; the stored record applies once mounted and
// again whenever a component on the page writes one.
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue';
import { data as course } from './course.data.mjs';
import { RECORD_EVENT, pageBand, readRecords } from './course-record.mjs';

const props = defineProps<{ relativePath: string }>();

type Records = ReturnType<typeof readRecords>;

const records = shallowRef<Records>({ progress: null, review: null });

function refresh() {
  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  records.value = readRecords(storage);
}

onMounted(() => {
  refresh();
  window.addEventListener(RECORD_EVENT, refresh);
  window.addEventListener('storage', refresh);
});

onBeforeUnmount(() => {
  window.removeEventListener(RECORD_EVENT, refresh);
  window.removeEventListener('storage', refresh);
});

const band = computed(() => pageBand(props.relativePath, course.weeks, records.value));
const fraction = computed(() => (band.value && band.value.max > 0 ? band.value.value / band.value.max : 0));
</script>

<template>
  <div v-if="band" class="fe-band-wrap">
    <div class="fe-band" :data-hue="band.hue">
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
    </div>
  </div>
</template>
