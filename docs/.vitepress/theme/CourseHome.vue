<script setup lang="ts">
// The opening screen as a dashboard: the masthead with the owner's own figures, one dark banner for the
// day to continue beside the command that checks it, then the 13 weeks as cards whose heads carry the
// phase's hue and a progress ring, then the record and reference pages as cards without rings.
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { withBase } from 'vitepress';
import { data as course } from './course.data.mjs';
import { RECORD_EVENT, RECORD_HUE, continueLesson, courseState, createVisits, readRecords, reviewState, weekCheck, weekPhase } from './course-record.mjs';
import NbText from './NbText';

type Records = ReturnType<typeof readRecords>;

// The server has no record, so the first render offers week 1's first step; the stored records apply
// once mounted and again when a page writes one.
const records = shallowRef<Records>({ progress: null, review: null, visits: createVisits() });
const copied = ref(false);

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

const state = computed(() => courseState(course.weeks, records.value.progress));
const review = computed(() => reviewState(records.value.review));
const next = computed(() => state.value.next);
const command = computed(() => `npm run learn:day -- ${next.value.day}`);
const evidence = computed(() => `learning-evidence/day-${String(next.value.day).padStart(2, '0')}/report.json`);
const hours = computed(() => (state.value.minutes / 60).toFixed(1));
const fraction = computed(() => state.value.completed / state.value.total);
// 接着做: the earliest lesson whose loop band has a step marked 停在这里, read by the same rule as the
// band on the page. Without any record it is week 1's first step, and nothing is marked as stopped.
const loop = computed(() => continueLesson(course, records.value));
const hasRecord = computed(
  () => state.value.started || Object.keys(records.value.visits?.pages ?? {}).length > 0 || Object.keys(records.value.review?.records ?? {}).length > 0,
);
const continueHref = computed(() => {
  if (!loop.value) return withBase(next.value.link);
  const { lesson, step } = loop.value;
  return withBase(step.href.startsWith('#') ? `${lesson.link}${step.href === '#main' ? '' : step.href}` : step.href);
});
const continueTitle = computed(() =>
  loop.value ? (loop.value.lesson.week ? `第 ${loop.value.lesson.week} 周 · ${loop.value.lesson.title}` : loop.value.lesson.title) : '',
);
// The week the owner is in: the week of the lesson to continue once there is a record, none before it.
const currentWeek = computed(() => (hasRecord.value ? (loop.value?.lesson.week ?? next.value.week) : null));

const weeks = computed(() =>
  course.weeks.map((week, index) => {
    const counts = state.value.weeks[index];
    const check = weekCheck(records.value.review, week.week);
    const done = new Set((records.value.progress?.days ?? []).filter((day) => day.completed).map((day) => day.day));
    const weekFraction = counts.completed / counts.total;
    return {
      ...week,
      phase: weekPhase(week.week),
      completed: counts.completed,
      fraction: weekFraction,
      percent: `${Math.round(weekFraction * 100)}%`,
      done: counts.completed === counts.total,
      stopped: hasRecord.value && loop.value?.lesson.week === week.week,
      nextDay: week.days.find((day) => !done.has(day.day)) ?? null,
      check,
    };
  }),
);

const shelf = computed(() => [
  {
    kind: '记录',
    hue: RECORD_HUE,
    title: '进度与日志',
    link: '/90-days/progress-and-journal.html',
    note: '每天记下主动学习分钟、证据链接和复盘，三项达标才能勾选完成。',
    state: state.value.started ? `${state.value.completed} / ${state.value.total} 天` : '还没有记录',
  },
  {
    kind: '记录',
    hue: RECORD_HUE,
    title: '错题与间隔复习',
    link: '/90-days/review-center.html',
    note: '周测答错的题立即进入队列，答对后按 1、3、7、14、30 天再出现。',
    state: review.value ? `${review.value.incorrect} 题待订正 · ${review.value.due} 题到期` : '还没有周测记录',
  },
  {
    kind: '方法',
    hue: 'green',
    title: '怎样学习每天 2 小时',
    link: '/90-days/how-to-study.html',
    note: '120 分钟怎样分配、什么才算验收证据、卡住时的 15 分钟协议。',
    state: '',
  },
  {
    kind: '方法',
    hue: 'green',
    title: '考核、检查点与毕业标准',
    link: '/90-days/assessments.html',
    note: '每周 20 分量表、W4 到 W12 的五个阶段检查点和 100 分毕业量表。',
    state: '',
  },
  {
    kind: '专题',
    hue: 'cyan',
    title: '知识专题 00–12',
    link: '/learning/',
    note: '配合日课的知识主线：浏览器、HTML 与 CSS、React、API、测试。',
    state: `${course.pages.learning} 章`,
  },
  {
    kind: '专题',
    hue: 'cyan',
    title: 'TypeScript 专题',
    link: '/typescript/',
    note: '从 C# 到 TypeScript、领域建模、运行时边界和类型错误排查。',
    state: `${course.pages.typescript} 篇`,
  },
  {
    kind: '专题',
    hue: 'cyan',
    title: '后端对照',
    link: '/backend/',
    note: 'Minimal API、EF Core、认证与上传，以及两套后端的 Contract 对照。',
    state: `${course.pages.backend} 篇`,
  },
  {
    kind: '参考',
    hue: 'purple',
    title: '源码追踪与参考资料',
    link: '/reference/source-traces.html',
    note: '源码追踪路线、产品需求、术语表、官方资料、练习模板和站内源码。',
    state: `${course.pages.reference} 篇`,
  },
  {
    kind: '参考',
    hue: 'purple',
    title: '全部课程与参考资料',
    link: '/README.html',
    note: '整个教材目录，包括维护者文档和原始课程设计存档。',
    state: '',
  },
]);

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(command.value);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 2000);
  } catch {
    copied.value = false;
  }
}
</script>

<template>
  <div class="fe-home">
    <div class="fe-masthead">
      <div>
        <h1 id="home-title">IssueFlow 91 天前端课程</h1>
        <!-- The old opening page's anchors still land on the matching part of this screen. -->
        <p id="学习时会用到什么" class="fe-masthead-note">13 周、91 天，每天 120 分钟主动学习，共 182 小时。记录只存在这台设备的浏览器里。</p>
      </div>
      <dl class="fe-stats" aria-label="学习概况">
        <div class="nb-stat" data-hue="green">
          <dd>{{ state.completed }}</dd>
          <dt>天已完成</dt>
        </div>
        <div class="nb-stat" data-hue="cyan">
          <dd>{{ currentWeek ? `第 ${currentWeek} 周` : '还没开始' }}</dd>
          <dt>当前周</dt>
        </div>
        <div class="nb-stat" data-hue="blue">
          <dd>{{ state.lastCompleted || '还没有' }}</dd>
          <dt>上次记录</dt>
        </div>
      </dl>
    </div>

    <section class="fe-desk" aria-labelledby="resume-label">
      <div class="fe-resume nb-banner" :class="{ 'has-record': hasRecord }">
        <div class="fe-resume-text">
          <p class="nb-banner-eyebrow" id="resume-label">接着做</p>
          <p class="nb-banner-title">
            <a class="fe-continue" :class="{ 'has-record': hasRecord }" :href="continueHref" :data-step="loop?.step.step">
              <template v-if="loop"><NbText :text="continueTitle" /> · {{ loop.step.label }}</template>
              <template v-else>每一课的五步都做完了：回到第 91 天</template>
            </a>
          </p>
          <p v-if="state.started" class="nb-banner-note fe-record-line">
            <span>{{ state.completed }} / {{ state.total }} 天</span> · <span>主动学习 {{ hours }} 小时</span
            ><template v-if="state.lastCompleted"> · <span>最近完成：{{ state.lastCompleted }}</span></template
            ><template v-if="!state.finished"> · <a class="fe-next-day" :href="withBase(next.link)">下一天：第 {{ next.day }} 天</a></template>
          </p>
          <p v-else class="nb-banner-note fe-record-line">这个浏览器里还没有学习记录，从第 1 周的第 1 天开始；学完后在进度与日志里记下分钟、证据和复盘。</p>
          <div
            class="fe-track nb-bar nb-bar--on-fill"
            role="progressbar"
            aria-label="91 天课程进度"
            aria-valuemin="0"
            :aria-valuemax="state.total"
            :aria-valuenow="state.completed"
            :style="{ '--nb-fraction': String(fraction) }"
          >
            <span></span>
          </div>
        </div>
        <a class="nb-button nb-button--solid fe-resume-go" :href="continueHref">{{ hasRecord ? '继续学习' : '开始第 1 周' }}</a>
      </div>

      <aside class="fe-run" aria-labelledby="run-title">
        <h2 id="run-title" class="fe-run-label">第 {{ next.day }} 天的验收命令</h2>
        <pre class="fe-command" tabindex="0"><code>{{ command }}</code></pre>
        <button class="fe-text-action" type="button" @click="copyCommand">{{ copied ? '已复制' : '复制命令' }}</button>
        <p class="fe-run-note">在仓库根目录运行，结果写入 <code>{{ evidence }}</code>。</p>
      </aside>
    </section>

    <section id="推荐学习顺序" class="fe-section" aria-labelledby="weeks-title">
      <div class="fe-section-head">
        <h2 id="weeks-title">13 周</h2>
        <p>按依赖顺序排列，每周 7 天，最后一天做闭卷周测和复盘。</p>
      </div>
      <ol class="fe-register fe-weeks nb-grid" aria-describedby="weeks-title">
        <li
          v-for="week in weeks"
          :key="week.week"
          class="fe-week nb-card"
          :data-hue="week.phase.hue"
          :data-record="week.done ? 'done' : undefined"
          :aria-current="week.stopped ? 'step' : undefined"
          :style="{ '--nb-fraction': String(week.fraction) }"
        >
          <div class="nb-card-head">
            <div>
              <p class="nb-card-eyebrow">第 {{ week.week }} 周 · {{ week.phase.word }}</p>
              <h3><a :href="withBase(week.link)"><NbText :text="week.title" /></a></h3>
            </div>
            <div class="nb-ring" role="img" :aria-label="`完成 ${week.percent}`" :style="{ '--nb-fraction': String(week.fraction) }">
              <span>{{ week.percent }}</span>
            </div>
          </div>
          <div class="nb-card-body">
            <p v-if="week.stopped" class="nb-stopped">停在这里</p>
            <p><NbText :text="week.deliverable" /></p>
            <div class="nb-card-meta">
              <span class="fe-week-state" :class="{ 'is-done': week.done }">{{ week.completed }} / {{ week.days.length }} 天</span>
              <span v-if="week.check" class="fe-week-check">周测 {{ week.check.correct }} / {{ week.check.answered }} 题正确</span>
              <span v-else-if="week.nextDay" class="fe-week-next">下一天：第 {{ week.nextDay.day }} 天</span>
              <span v-else class="fe-week-next">本周完成</span>
            </div>
          </div>
        </li>
      </ol>
    </section>

    <section id="选择你的入口" class="fe-section" aria-labelledby="shelf-title">
      <div class="fe-section-head">
        <h2 id="shelf-title">记录与资料</h2>
        <p>进度和复习只存在这台设备的浏览器里，可以导出 JSON 备份。</p>
      </div>
      <ul class="fe-shelf nb-grid">
        <li v-for="item in shelf" :key="item.link" class="fe-shelf-card nb-card" :data-hue="item.hue">
          <div class="nb-card-head">
            <div>
              <p class="nb-card-eyebrow">{{ item.kind }}</p>
              <h3><a :href="withBase(item.link)">{{ item.title }}</a></h3>
            </div>
          </div>
          <div class="nb-card-body">
            <p>{{ item.note }}</p>
            <div v-if="item.state" class="nb-card-meta"><span>{{ item.state }}</span></div>
          </div>
        </li>
      </ul>
    </section>

    <section class="fe-section" aria-labelledby="三条学习路径">
      <div class="fe-section-head">
        <h2 id="三条学习路径">三条学习路径</h2>
        <p>按已有经验选第一站，之后都回到 91 天课程。</p>
      </div>
      <ul class="fe-paths">
        <li class="fe-row">
          <span class="fe-row-key">没有前端经验</span>
          <h3 class="fe-row-title"><a :href="withBase('/90-days/')">从 91 天课程开始</a></h3>
          <p class="fe-row-note">每周交付一个可运行、可验收的学习作品。</p>
        </li>
        <li class="fe-row">
          <span class="fe-row-key">有 C#/.NET 经验</span>
          <h3 class="fe-row-title"><a :href="withBase('/typescript/01-from-csharp-to-typescript.html')">从 C# 到 TypeScript</a></h3>
          <p class="fe-row-note">能区分结构类型、运行时值与 Wire Contract。</p>
        </li>
        <li class="fe-row">
          <span class="fe-row-key">已会基础前端</span>
          <h3 class="fe-row-title"><a :href="withBase('/reference/source-traces.html')">源码追踪路线</a></h3>
          <p class="fe-row-note">能沿页面、状态、API 和测试追踪完整功能。</p>
        </li>
      </ul>
    </section>
  </div>
</template>
