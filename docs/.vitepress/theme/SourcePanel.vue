<script setup lang="ts">
// Source read in place: the kit's .nb-code panel on a bundled file. The tabs, the actions row and the
// <noscript> links render on the server; the lines are fetched from the bundle after the page mounts,
// so the server render and the first client render match. A port of the C# course's source-panel.js.
import { computed, onMounted, ref, watch } from 'vue';
import { useData, withBase } from 'vitepress';
import { markVisit } from './course-record.mjs';
import { highlight, languageFor, lineHtml } from './code-colors.mjs';
import { SOURCE_ASSET_PATH, encodeSourcePath, fileName } from './source-links.mjs';

type FileSpec = string | { path: string; label?: string };

const props = withDefaults(
  defineProps<{
    files: FileSpec[];
    active?: string;
    /** Line ranges to mark, inclusive, for example [[5, 9]]. */
    marked?: Array<[number, number]>;
    /** Give each line an id (L5): for the one panel on the source page, so a hash can land on a line. */
    anchors?: boolean;
    height?: string;
  }>(),
  { active: undefined, marked: () => [], anchors: false, height: undefined },
);

const emit = defineEmits<{ loaded: [path: string, lines: number] }>();

const { theme, page } = useData();
const blobBase = computed<string>(() => theme.value.source?.blobBase ?? '');

const list = computed(() =>
  props.files.map((file) => (typeof file === 'string' ? { path: file, label: fileName(file) } : { path: file.path, label: file.label ?? fileName(file.path) })),
);
const current = ref(props.active ?? list.value[0]?.path ?? '');
const lines = ref<string[]>([]);
const status = ref('');
const note = ref('');
const githubHref = computed(() => (blobBase.value && current.value ? blobBase.value + encodeSourcePath(current.value) : undefined));
const noscriptHtml = computed(() => {
  const links = list.value.map((file) => `<a href="${blobBase.value}${encodeSourcePath(file.path)}">${file.label}</a>`).join('、');
  return `<p class="nb-code-noscript">浏览源码需要 JavaScript。在 GitHub 打开：${links}</p>`;
});

// One fetch per file per page, shared by every panel that shows it.
const cache = new Map<string, Promise<string>>();
function load(path: string) {
  let pending = cache.get(path);
  if (!pending) {
    pending = fetch(withBase(`${SOURCE_ASSET_PATH}${encodeSourcePath(path)}.txt`)).then((response) => {
      if (!response.ok) throw new Error(`无法读取 ${path}（${response.status}）`);
      return response.text();
    });
    cache.set(path, pending);
  }
  return pending;
}

function isMarked(line: number) {
  return props.marked.some(([from, to]) => line >= from && line <= to);
}

async function select(path: string) {
  if (!list.value.some((file) => file.path === path)) return;
  current.value = path;
  status.value = '';
  try {
    const text = await load(path);
    if (current.value !== path) return;
    lines.value = highlight(text, languageFor(path)).map(lineHtml);
    note.value = `${lines.value.length} 行`;
    emit('loaded', path, lines.value.length);
  } catch (error) {
    if (current.value !== path) return;
    lines.value = [];
    note.value = '';
    status.value = `${error instanceof Error ? error.message : '无法读取文件'}。可以在 GitHub 打开这个文件。`;
  }
}

/** A click on a tab: the panel was opened by hand, which the loop band's 看代码 step reads. */
function open(path: string) {
  try {
    markVisit(window.localStorage, page.value.relativePath, 'codeAt');
  } catch {
    // Without storage the band simply stays where it is.
  }
  return select(path);
}

async function copy() {
  if (!current.value) return;
  try {
    await navigator.clipboard.writeText(await load(current.value));
    status.value = `已复制 ${fileName(current.value)}`;
  } catch {
    status.value = '无法访问剪贴板，请手动选中复制。';
  }
}

const view = ref<HTMLElement | null>(null);
function scrollToLine(line: number) {
  const target = view.value?.querySelector<HTMLElement>(`[data-line="${line}"]`);
  const container = view.value;
  if (!target || !container) return;
  container.scrollTop = Math.max(0, target.offsetTop - container.clientHeight / 2);
}

onMounted(() => select(current.value));
watch(
  () => props.active,
  (active) => {
    if (active && active !== current.value) select(active);
  },
);

defineExpose({ select, scrollToLine, load, current });
</script>

<template>
  <div class="nb-code fe-source" :data-file="current">
    <div class="nb-code-tabs" role="tablist" aria-label="文件">
      <button
        v-for="file in list"
        :key="file.path"
        class="nb-code-tab"
        type="button"
        role="tab"
        :aria-selected="file.path === current ? 'true' : 'false'"
        :data-path="file.path"
        :title="file.path"
        @click="open(file.path)"
      >
        {{ file.label }}
      </button>
      <span class="nb-code-note">{{ note }}</span>
    </div>
    <pre ref="view" class="nb-code-view" tabindex="0" role="tabpanel" :style="height ? `--nb-code-height: ${height}` : undefined"><code><div v-for="(html, index) in lines" :key="index" class="nb-code-line" :data-line="index + 1" :id="anchors ? `L${index + 1}` : undefined" :data-marked="isMarked(index + 1) ? '' : undefined"><span class="nb-code-text" v-html="html"></span></div></code></pre>
    <div class="nb-code-actions">
      <button class="nb-button" type="button" @click="copy">复制</button>
      <a v-if="githubHref" class="nb-code-link" :href="githubHref">在 GitHub 打开</a>
      <p class="nb-code-status" role="status" aria-live="polite">{{ status }}</p>
    </div>
    <noscript v-html="noscriptHtml"></noscript>
  </div>
</template>
