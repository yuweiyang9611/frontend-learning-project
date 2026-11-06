<script setup lang="ts">
// Run in the browser: a ```ts or ```js fence as the kit's code panel with 运行, 改一改再跑 and 复制,
// the output under it. config.mts emits one of these for every fence that run-code.mjs says can run.
// The lines are coloured from the prop with the same highlighter as the source panel, so the server
// render and the first client render match; the transpiler, the sandbox and the record are touched
// only after a click.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useData } from 'vitepress';
import { highlight } from './code-colors.mjs';
import { markVisit } from './course-record.mjs';
import { run as runInSandbox } from './run-code-browser.mjs';

const props = withDefaults(defineProps<{ code: string; lang?: string }>(), { lang: 'ts' });

const { page, site } = useData();
const language = computed(() => (props.lang === 'js' || props.lang === 'javascript' ? 'js' : 'ts'));
const label = computed(() => (language.value === 'js' ? 'JavaScript' : 'TypeScript'));
const source = computed(() => props.code.replace(/\r\n/g, '\n').replace(/\n$/, ''));
const lines = computed(() => highlight(source.value, 'typescript'));

const editing = ref(false);
const draft = ref('');
const running = ref(false);
const status = ref('');
const output = ref<{ state: 'running' | 'done' | 'wrong'; label: string; text: string } | null>(null);
const root = ref<HTMLElement | null>(null);
const editor = ref<HTMLTextAreaElement | null>(null);
let handle: ReturnType<typeof runInSandbox> | null = null;

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function mark(field: 'codeAt' | 'ranAt') {
  const store = storage();
  if (store) markVisit(store, page.value.relativePath, field);
}

function edit() {
  draft.value = source.value;
  editing.value = true;
  status.value = '这是副本，改完点运行；页面上的原文不会变。';
  mark('codeAt');
  requestAnimationFrame(() => editor.value?.focus());
}

function reset() {
  editing.value = false;
  draft.value = '';
  status.value = '已恢复原文。';
}

async function copy() {
  mark('codeAt');
  try {
    await navigator.clipboard.writeText(editing.value ? draft.value : source.value);
    status.value = '已复制';
  } catch {
    status.value = '无法访问剪贴板，请手动选中复制。';
  }
}

async function runCode() {
  if (handle || !root.value) return;
  running.value = true;
  status.value = '';
  output.value = { state: 'running', label: '运行中', text: '' };
  handle = runInSandbox({
    source: editing.value ? draft.value : source.value,
    language: language.value,
    base: site.value.base,
    host: root.value,
    onStage: (_name: string, stageLabel: string) => {
      status.value = `${stageLabel}中…`;
      if (output.value) output.value = { ...output.value, label: `${stageLabel}中` };
    },
  });
  const result = await handle.done;
  handle = null;
  running.value = false;
  const text = result.output.trimEnd();
  if (result.ok) {
    output.value = { state: 'done', label: `运行结果 · 浏览器内 ${label.value}${editing.value ? ' · 已改动的副本' : ''}`, text: text || '（没有输出）' };
    status.value = text ? '运行完成。' : '运行完成，这段代码没有打印任何内容；点「改一改再跑」加一行 console.log 看看。';
    mark('codeAt');
    mark('ranAt');
  } else {
    const heading = result.timedOut ? '运行超时' : result.stopped ? '已停止' : result.stage === 'compile' ? '转译失败' : result.stage === 'load' ? '无法加载转译器' : '运行失败';
    output.value = { state: 'wrong', label: heading, text: [text, result.error].filter(Boolean).join('\n') };
    status.value = result.timedOut ? '超时了。可以改代码后重新运行。' : result.stage === 'compile' ? '转译失败，看诊断里的行号。' : '';
  }
}

function stop() {
  handle?.stop();
}

onMounted(() => window.addEventListener('pagehide', stop));
onBeforeUnmount(() => {
  window.removeEventListener('pagehide', stop);
  stop();
});
</script>

<template>
  <div ref="root" class="nb-code fe-code" :data-lang="language">
    <div class="nb-code-tabs" role="tablist" aria-label="代码">
      <button class="nb-code-tab" type="button" role="tab" aria-selected="true" @click="mark('codeAt')">{{ label }}</button>
      <span class="nb-code-note">{{ lines.length }} 行 · 可在浏览器里运行</span>
    </div>
    <textarea v-if="editing" ref="editor" v-model="draft" class="nb-code-editor" spellcheck="false" :aria-label="`${label} 代码的可编辑副本`"></textarea>
    <pre v-else class="nb-code-view" tabindex="0" role="tabpanel"><code><div v-for="(segments, index) in lines" :key="index" class="nb-code-line" :data-line="index + 1"><span class="nb-code-text"><span v-for="(segment, position) in segments" :key="position" :class="segment.cls || undefined">{{ segment.text }}</span></span></div></code></pre>
    <div class="nb-code-actions">
      <button class="nb-button nb-button--solid fe-code-run" type="button" :disabled="running" @click="runCode">运行</button>
      <button v-if="!editing" class="nb-button fe-code-edit" type="button" @click="edit">改一改再跑</button>
      <button v-else class="nb-button fe-code-reset" type="button" @click="reset">恢复原文</button>
      <button class="nb-button fe-code-copy" type="button" @click="copy">复制</button>
      <button v-if="running" class="nb-button fe-code-stop" type="button" @click="stop">停止</button>
      <p class="nb-code-status" role="status" aria-live="polite">{{ status }}</p>
    </div>
    <div v-if="output" class="nb-code-output" :data-state="output.state">
      <p class="nb-code-output-label">{{ output.label }}</p>
      <pre tabindex="0">{{ output.text }}</pre>
    </div>
  </div>
</template>
