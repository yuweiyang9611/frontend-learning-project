<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useData, useRoute, withBase } from 'vitepress';
import { VPNavBarSearch } from 'vitepress/theme-without-fonts';
import CourseHome from './CourseHome.vue';
import NbText from './NbText';
import PageBand from './PageBand.vue';
import SchemeControl from './SchemeControl.vue';
import { isActiveNav, isCurrentPage, neighbours, sidebarFor } from './site-nav.mjs';

type NavItem = { text: string; link: string; activeMatch?: string };
type SidebarItem = { text: string; link?: string; items?: SidebarItem[] };

const { site, theme, page, frontmatter } = useData();
const route = useRoute();

const isHome = computed(() => frontmatter.value.layout === 'home');
const nav = computed<NavItem[]>(() => theme.value.nav ?? []);
const groups = computed<SidebarItem[]>(() => (page.value.isNotFound ? [] : sidebarFor(theme.value.sidebar, page.value.relativePath)));
const headers = computed(() => (frontmatter.value.outline === false ? [] : (page.value.headers ?? []).filter((header) => header.level === 2)));
const around = computed(() => neighbours(groups.value, page.value.relativePath));
const editLink = computed(() =>
  theme.value.editLink && page.value.filePath ? theme.value.editLink.pattern.replace(':path', page.value.filePath) : '',
);
// A fixed time zone keeps the server and the browser on the same date, so hydration matches.
const updated = computed(() =>
  page.value.lastUpdated
    ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', dateStyle: 'long' }).format(new Date(page.value.lastUpdated))
    : '',
);

/** Config links have no extension; the site is built without clean URLs. */
function href(link: string) {
  if (/^https?:/.test(link)) return link;
  const [path, hash] = link.split('#');
  const file = path.endsWith('/') || /\.[a-z]+$/i.test(path) ? path : `${path}.html`;
  return withBase(file) + (hash ? `#${hash}` : '');
}

function external(link: string) {
  return /^https?:/.test(link);
}

const navOpen = ref(false);
const contentsOpen = ref(false);

// The contents mark where the reader is: the page, or once a section heading has passed under the
// running head, that section.
const location = ref('');
let frame = 0;

function updateLocation() {
  frame = 0;
  const head = document.querySelector('.nb-head');
  const offset = (head instanceof HTMLElement ? head.offsetHeight : 52) + 16;
  let current = '';
  for (const header of headers.value) {
    const target = document.getElementById(header.slug);
    if (!target) continue;
    if (target.getBoundingClientRect().top <= offset) current = header.slug;
    else break;
  }
  location.value = current;
}

function onScroll() {
  if (!frame) frame = requestAnimationFrame(updateLocation);
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  updateLocation();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  if (frame) cancelAnimationFrame(frame);
});

watch(
  () => route.path,
  () => {
    navOpen.value = false;
    contentsOpen.value = false;
    location.value = '';
    nextTick(updateLocation);
  },
);
</script>

<template>
  <a class="skip-link" href="#main">跳到正文</a>
  <header class="nb-head fe-head">
    <a class="nb-brand" :href="withBase('/')">{{ site.title }}</a>
    <button
      class="nb-nav-toggle"
      type="button"
      :aria-expanded="navOpen ? 'true' : 'false'"
      aria-controls="site-nav"
      @click="navOpen = !navOpen"
    >
      菜单
    </button>
    <nav id="site-nav" class="fe-nav nb-nav--collapsible" :class="{ open: navOpen }" aria-label="主导航">
      <a
        v-for="item in nav"
        :key="item.link"
        :href="href(item.link)"
        :aria-current="!external(item.link) && isActiveNav(item, page.relativePath) ? (isCurrentPage(item.link, page.relativePath) ? 'page' : 'true') : undefined"
        >{{ item.text }}</a
      >
      <VPNavBarSearch class="fe-search" />
      <a :href="theme.socialLinks?.[0]?.link">GitHub</a>
      <a href="https://yuweiyang9611.github.io/">全部项目</a>
    </nav>
    <SchemeControl />
  </header>

  <main id="main" class="fe-main" tabindex="-1">
    <CourseHome v-if="isHome && !page.isNotFound" />

    <section v-else-if="page.isNotFound" class="fe-lost" aria-labelledby="lost-title">
      <h1 id="lost-title">这一页不存在</h1>
      <p>地址可能写错了，或者页面已经改名。可以从下面重新进入课程。</p>
      <ul class="fe-lost-links">
        <li><a :href="withBase('/')">课程首页</a></li>
        <li><a :href="withBase('/90-days/')">91 天课程总览</a></li>
        <li><a :href="withBase('/90-days/progress-and-journal.html')">进度与日志</a></li>
      </ul>
    </section>

    <div v-else class="fe-doc" :class="{ 'fe-doc--single': groups.length === 0 }">
      <PageBand :relative-path="page.relativePath" />
      <nav v-if="groups.length" class="fe-contents" :class="{ open: contentsOpen }" aria-label="本节目录">
        <div class="fe-contents-head">
          <p class="fe-contents-title">本节目录</p>
          <button
            class="fe-contents-toggle"
            type="button"
            :aria-expanded="contentsOpen ? 'true' : 'false'"
            aria-controls="fe-contents-list"
            @click="contentsOpen = !contentsOpen"
          >
            {{ contentsOpen ? '收起目录' : '展开目录' }}
          </button>
        </div>
        <div id="fe-contents-list" class="fe-contents-list">
          <section v-for="group in groups" :key="group.text" class="fe-contents-group">
            <p class="fe-contents-group-title"><NbText :text="group.text" /></p>
            <ol>
              <li v-for="item in group.items" :key="item.link">
                <a
                  :href="href(item.link ?? '')"
                  :aria-current="isCurrentPage(item.link ?? '', page.relativePath) ? 'page' : undefined"
                  :class="{ 'is-passed': isCurrentPage(item.link ?? '', page.relativePath) && location }"
                  ><NbText :text="item.text"
                /></a>
                <ol v-if="isCurrentPage(item.link ?? '', page.relativePath) && headers.length" class="fe-contents-sections">
                  <li v-for="header in headers" :key="header.slug">
                    <a :href="header.link" :aria-current="location === header.slug ? 'location' : undefined"
                      ><NbText :text="header.title"
                    /></a>
                  </li>
                </ol>
              </li>
            </ol>
          </section>
        </div>
      </nav>

      <article class="fe-article">
        <Content class="fe-prose" />
        <footer class="fe-doc-footer">
          <nav v-if="around.prev || around.next" class="fe-pager" aria-label="上一页和下一页">
            <a v-if="around.prev" class="fe-pager-prev" :href="href(around.prev.link)">上一页：<NbText :text="around.prev.text" /></a>
            <a v-if="around.next" class="fe-pager-next" :href="href(around.next.link)">下一页：<NbText :text="around.next.text" /></a>
          </nav>
          <p class="fe-doc-meta">
            <a v-if="editLink" :href="editLink">{{ theme.editLink.text }}</a>
            <span v-if="updated">{{ theme.lastUpdated?.text ?? '最后更新' }} {{ updated }}</span>
          </p>
        </footer>
      </article>
    </div>
  </main>

  <footer class="fe-footer">
    <p><NbText :text="theme.footer?.message ?? ''" /></p>
  </footer>
</template>
