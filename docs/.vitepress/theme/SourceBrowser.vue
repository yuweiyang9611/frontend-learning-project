<script setup lang="ts">
// The source page: one bundled file in the panel with its siblings under it, or a directory listing,
// chosen by ?path= or ?dir=. Client only: the choice lives in the query string, which the server render
// cannot see, and VitePress keeps the same page component when only the query changes, so the browser
// re-reads the location after each route change.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useData, useRouter, withBase } from 'vitepress';
import SourcePanel from './SourcePanel.vue';
import { SOURCE_ASSET_PATH, directoryEntries, encodeSourcePath, fileName, parseLineRange, siblingFiles } from './source-links.mjs';

type IndexFile = { path: string; bytes: number; lines: number };
type SourceIndex = { version: number; revision: string; repository: string; blobBase: string; files: IndexFile[] };

const { theme } = useData();
const router = useRouter();
const page = computed<string>(() => theme.value.source?.page ?? '/reference/source');

const index = ref<SourceIndex | null>(null);
const error = ref('');
const requestedPath = ref('');
const requestedDir = ref('');
const marks = ref<Array<[number, number]>>([]);
const panel = ref<InstanceType<typeof SourcePanel> | null>(null);

function readLocation() {
  const url = new URL(location.href);
  requestedPath.value = (url.searchParams.get('path') ?? '').replace(/^\/+|\/+$/g, '');
  requestedDir.value = (url.searchParams.get('dir') ?? '').replace(/^\/+|\/+$/g, '');
  const range = parseLineRange(url.hash);
  marks.value = range ? [range] : [];
}

function href(path: string, directory = false) {
  return `${withBase(`${page.value}.html`)}?${directory ? 'dir' : 'path'}=${encodeSourcePath(path)}`;
}

const file = computed(() => index.value?.files.find((item) => item.path === requestedPath.value) ?? null);
const listing = computed(() => (index.value && !requestedPath.value ? directoryEntries(index.value.files, requestedDir.value) : []));
const listingFiles = computed(() => listing.value.reduce((total, entry) => total + entry.files, 0));
const siblings = computed(() => (index.value && file.value ? siblingFiles(index.value.files, file.value.path) : []));
const crumbs = computed(() => {
  const target = requestedPath.value || requestedDir.value;
  const parts = target ? target.split('/') : [];
  return parts.map((part, position) => ({
    text: part,
    href: href(parts.slice(0, position + 1).join('/'), true),
    last: position === parts.length - 1 && Boolean(requestedPath.value),
  }));
});
const revision = computed(() => index.value?.revision.slice(0, 7) ?? '');
const kilobytes = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

function onLoaded() {
  if (marks.value.length) panel.value?.scrollToLine(marks.value[0][0]);
}

let previousAfterRoute: typeof router.onAfterRouteChanged;
onMounted(async () => {
  readLocation();
  window.addEventListener('popstate', readLocation);
  window.addEventListener('hashchange', readLocation);
  previousAfterRoute = router.onAfterRouteChanged;
  router.onAfterRouteChanged = async (to) => {
    await previousAfterRoute?.(to);
    readLocation();
  };
  try {
    const response = await fetch(withBase(`${SOURCE_ASSET_PATH}index.json`));
    if (!response.ok) throw new Error(`无法读取源码索引（${response.status}）`);
    index.value = (await response.json()) as SourceIndex;
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : '无法读取源码索引';
  }
});
onBeforeUnmount(() => {
  window.removeEventListener('popstate', readLocation);
  window.removeEventListener('hashchange', readLocation);
  router.onAfterRouteChanged = previousAfterRoute;
});
</script>

<template>
  <div class="fe-source-browser">
    <p class="fe-source-crumbs">
      <a :href="href('', true)">源码</a>
      <template v-for="crumb in crumbs" :key="crumb.href + crumb.text">
        <span class="fe-source-crumb-sep" aria-hidden="true"> / </span>
        <span v-if="crumb.last" class="fe-source-crumb-here">{{ crumb.text }}</span>
        <a v-else :href="crumb.href">{{ crumb.text }}</a>
      </template>
    </p>

    <p v-if="error" class="fe-source-note" role="alert">{{ error }}</p>
    <p v-else-if="!index" class="fe-source-note">正在读取源码索引…</p>

    <template v-else-if="requestedPath">
      <template v-if="file">
        <h2 class="fe-source-title">{{ fileName(file.path) }}</h2>
        <p class="fe-source-note">{{ file.path }} · {{ file.lines }} 行 · {{ kilobytes(file.bytes) }} · 仓库提交 {{ revision }}</p>
        <SourcePanel ref="panel" :key="file.path" :files="[file.path]" :marked="marks" anchors height="calc(100vh - 16rem)" @loaded="onLoaded" />
        <section v-if="siblings.length" class="fe-source-siblings" aria-label="同目录文件">
          <h3>同目录</h3>
          <ul>
            <li v-for="sibling in siblings" :key="sibling.path"><a :href="href(sibling.path)">{{ sibling.name }}</a></li>
          </ul>
        </section>
      </template>
      <template v-else>
        <h2 class="fe-source-title">没有这个文件</h2>
        <p class="fe-source-note">{{ requestedPath }} 不在站内的源码包里，可能不是课程用到的文件。下面是源码包的根目录。</p>
        <ol class="fe-source-rows">
          <li v-for="entry in directoryEntries(index.files, '')" :key="entry.path" class="nb-entry fe-source-row">
            <a :href="href(entry.path, entry.directory)">{{ entry.name }}{{ entry.directory ? '/' : '' }}</a>
            <span>{{ entry.directory ? `${entry.files} 个文件 · ${entry.lines} 行` : `${entry.lines} 行 · ${kilobytes(entry.bytes)}` }}</span>
          </li>
        </ol>
      </template>
    </template>

    <template v-else>
      <h2 v-if="requestedDir" class="fe-source-title">{{ fileName(requestedDir) }}/</h2>
      <p class="fe-source-note">
        <template v-if="requestedDir">{{ requestedDir }} · </template>{{ listingFiles }} 个文件 · 仓库提交 {{ revision }}
      </p>
      <p v-if="!listing.length" class="fe-source-note">没有这个目录。</p>
      <ol v-else class="fe-source-rows">
        <li v-for="entry in listing" :key="entry.path" class="nb-entry fe-source-row">
          <a :href="href(entry.path, entry.directory)">{{ entry.name }}{{ entry.directory ? '/' : '' }}</a>
          <span>{{ entry.directory ? `${entry.files} 个文件 · ${entry.lines} 行` : `${entry.lines} 行 · ${kilobytes(entry.bytes)}` }}</span>
        </li>
      </ol>
    </template>
  </div>
</template>
