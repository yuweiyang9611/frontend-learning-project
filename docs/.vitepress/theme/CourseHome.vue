<script setup lang="ts">
// The opening screen: the way back to the stopped day first, beside the command that checks it, then the
// 13 weeks as a register with the record line, then the record pages and the reference shelves.
import { computed, onMounted, ref, shallowRef } from 'vue';
import { withBase } from 'vitepress';
import { data as course } from './course.data.mjs';
import { courseState, readRecords, reviewState, weekCheck } from './course-record.mjs';
import NbText from './NbText';

type Records = ReturnType<typeof readRecords>;

// The server has no record, so the first render offers day 1; the stored record applies once mounted.
const records = shallowRef<Records>({ progress: null, review: null });
const copied = ref(false);

onMounted(() => {
  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  records.value = readRecords(storage);
});

const state = computed(() => courseState(course.weeks, records.value.progress));
const review = computed(() => reviewState(records.value.review));
const next = computed(() => state.value.next);
const command = computed(() => `npm run learn:day -- ${next.value.day}`);
const evidence = computed(() => `learning-evidence/day-${String(next.value.day).padStart(2, '0')}/report.json`);
const hours = computed(() => (state.value.minutes / 60).toFixed(1));

const weeks = computed(() =>
  course.weeks.map((week, index) => {
    const counts = state.value.weeks[index];
    const check = weekCheck(records.value.review, week.week);
    return {
      ...week,
      completed: counts.completed,
      fraction: counts.completed / counts.total,
      done: counts.completed === counts.total,
      stopped: state.value.stoppedWeek === week.week,
      check,
    };
  }),
);

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
    <section class="fe-desk" aria-labelledby="home-title">
      <div class="fe-desk-record">
        <h1 id="home-title">IssueFlow 91 天前端课程</h1>
        <a class="fe-continue" :class="{ 'has-record': state.started }" :href="withBase(next.link)">
          <template v-if="state.finished">已完成全部 91 天：回到第 91 天</template>
          <template v-else-if="state.started">接着做：第 {{ next.day }} 天 · <NbText :text="next.title" /></template>
          <template v-else>从第 1 天开始：<NbText :text="next.title" /></template>
        </a>
        <div
          class="fe-track"
          role="progressbar"
          aria-label="91 天课程进度"
          aria-valuemin="0"
          :aria-valuemax="state.total"
          :aria-valuenow="state.completed"
          :style="{ '--nb-fraction': String(state.completed / state.total) }"
        >
          <span></span>
        </div>
        <p v-if="state.started" class="fe-record-line">
          <span><strong>{{ state.completed }} / {{ state.total }} 天</strong>已完成</span> ·
          <span>主动学习 {{ hours }} 小时</span><template v-if="state.lastCompleted"> · <span>最近完成：{{ state.lastCompleted }}</span></template>
        </p>
        <p v-else class="fe-record-line">本设备还没有学习记录。每天学完后，在<a :href="withBase('/90-days/progress-and-journal.html')">进度与日志</a>里记下分钟、证据和复盘。</p>
        <!-- The old opening page's anchors still land on the matching part of this screen. -->
        <p id="学习时会用到什么" class="fe-course-note">13 周、91 天，每天至少 120 分钟主动学习，共 182 小时。每天先预测、读概念、追源码、做实验，再独立完成变体并留下证据。</p>
      </div>

      <aside class="fe-run" aria-labelledby="run-title">
        <h2 id="run-title" class="fe-run-label">第 {{ next.day }} 天的验收命令</h2>
        <pre class="fe-command" tabindex="0"><code>{{ command }}</code></pre>
        <button class="fe-text-action" type="button" @click="copyCommand">{{ copied ? '已复制' : '复制命令' }}</button>
        <p class="fe-run-note">
          在仓库根目录运行。它跑当天的检查，把结果写入 <code>{{ evidence }}</code>。先按<a :href="withBase(next.link)">当天的页面</a>完成实验和独立变体。
        </p>
      </aside>
    </section>

    <section id="推荐学习顺序" class="fe-section" aria-labelledby="weeks-title">
      <div class="fe-section-head">
        <h2 id="weeks-title">13 周</h2>
        <p>按依赖顺序排列，每周 7 天，最后一天做闭卷周测和复盘。</p>
      </div>
      <ol class="fe-register" aria-describedby="weeks-title">
        <li
          v-for="week in weeks"
          :key="week.week"
          class="fe-row fe-week nb-entry"
          :data-record="week.done ? 'done' : undefined"
          :aria-current="week.stopped ? 'step' : undefined"
          :style="{ '--nb-fraction': String(week.fraction) }"
        >
          <span class="fe-row-key">第 {{ week.week }} 周</span>
          <h3 class="fe-row-title"><a :href="withBase(week.link)"><NbText :text="week.title" /></a></h3>
          <span v-if="week.stopped" class="nb-stopped">停在这里</span>
          <p class="fe-row-note"><NbText :text="week.deliverable" /></p>
          <p class="fe-row-state" :class="{ 'is-done': week.done }">
            <span>{{ week.completed }} / {{ week.days.length }} 天</span>
            <span v-if="week.check" class="fe-row-check">周测 {{ week.check.correct }} / {{ week.check.answered }} 题正确</span>
          </p>
        </li>
      </ol>
    </section>

    <section id="选择你的入口" class="fe-section" aria-labelledby="shelf-title">
      <div class="fe-section-head">
        <h2 id="shelf-title">记录与资料</h2>
        <p>进度和复习只存在这台设备的浏览器里，可以导出 JSON 备份。</p>
      </div>
      <ul class="fe-register fe-shelf">
        <li class="fe-row">
          <span class="fe-row-key">记录</span>
          <h3 class="fe-row-title"><a :href="withBase('/90-days/progress-and-journal.html')">进度与日志</a></h3>
          <p class="fe-row-note">每天的主动学习分钟、证据链接和复盘，三项达标才能勾选完成。</p>
          <p class="fe-row-state">{{ state.started ? `${state.completed} / ${state.total} 天` : '还没有记录' }}</p>
        </li>
        <li class="fe-row">
          <span class="fe-row-key">记录</span>
          <h3 class="fe-row-title"><a :href="withBase('/90-days/review-center.html')">错题与间隔复习</a></h3>
          <p class="fe-row-note">周测答错的题立即进入队列，答对后按 1、3、7、14、30 天再出现。</p>
          <p class="fe-row-state">
            <template v-if="review">{{ review.incorrect }} 题待订正 · {{ review.due }} 题到期</template>
            <template v-else>还没有周测记录</template>
          </p>
        </li>
        <li class="fe-row">
          <span class="fe-row-key">方法</span>
          <h3 class="fe-row-title"><a :href="withBase('/90-days/how-to-study.html')">怎样学习每天 2 小时</a></h3>
          <p class="fe-row-note">120 分钟怎样分配、什么才算验收证据、卡住时的 15 分钟协议。</p>
        </li>
        <li class="fe-row">
          <span class="fe-row-key">方法</span>
          <h3 class="fe-row-title"><a :href="withBase('/90-days/assessments.html')">考核、检查点与毕业标准</a></h3>
          <p class="fe-row-note">每周 20 分量表、W4 到 W12 的五个阶段检查点和 100 分毕业量表。</p>
        </li>
        <li class="fe-row">
          <span class="fe-row-key">专题</span>
          <h3 class="fe-row-title"><a :href="withBase('/learning/')">知识专题 00–12</a></h3>
          <p class="fe-row-note">配合日课的知识主线：浏览器、HTML 与 CSS、React、API、测试。</p>
          <p class="fe-row-state">{{ course.pages.learning }} 章</p>
        </li>
        <li class="fe-row">
          <span class="fe-row-key">专题</span>
          <h3 class="fe-row-title"><a :href="withBase('/typescript/')">TypeScript 专题</a></h3>
          <p class="fe-row-note">从 C# 到 TypeScript、领域建模、运行时边界和类型错误排查。</p>
          <p class="fe-row-state">{{ course.pages.typescript }} 篇</p>
        </li>
        <li class="fe-row">
          <span class="fe-row-key">专题</span>
          <h3 class="fe-row-title"><a :href="withBase('/backend/')">后端对照</a></h3>
          <p class="fe-row-note">Minimal API、EF Core、认证与上传，以及两套后端的 Contract 对照。</p>
          <p class="fe-row-state">{{ course.pages.backend }} 篇</p>
        </li>
        <li class="fe-row">
          <span class="fe-row-key">参考</span>
          <h3 class="fe-row-title"><a :href="withBase('/reference/source-traces.html')">源码追踪与参考资料</a></h3>
          <p class="fe-row-note">源码追踪路线、产品需求、术语表、官方资料和练习模板。</p>
          <p class="fe-row-state">{{ course.pages.reference }} 篇</p>
        </li>
        <li class="fe-row">
          <span class="fe-row-key">参考</span>
          <h3 class="fe-row-title"><a :href="withBase('/README.html')">全部课程与参考资料</a></h3>
          <p class="fe-row-note">整个教材目录，包括维护者文档和原始课程设计存档。</p>
        </li>
      </ul>
    </section>

    <section class="fe-section" aria-labelledby="三条学习路径">
      <div class="fe-section-head">
        <h2 id="三条学习路径">三条学习路径</h2>
        <p>按已有经验选第一站，之后都回到 91 天课程。</p>
      </div>
      <ul class="fe-register fe-shelf">
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
