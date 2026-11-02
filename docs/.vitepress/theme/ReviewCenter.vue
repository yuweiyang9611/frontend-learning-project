<script setup lang="ts">
import { reviewConcepts } from "./quiz-diagnostics.mjs";
import { computed, onMounted, ref } from "vue";
import { withBase } from "vitepress";
import NbText from "./NbText";
import {
  conceptLabel,
  kindLabels,
  difficultyLabels,
  getQuizQuestion,
  weeklyQuizzes,
  type QuizQuestion,
} from "./quiz-bank";
import {
  REVIEW_STORAGE_KEY,
  createReviewState,
  decodeReviewState,
  questionNeedsReview,
  recordReviewAnswer,
  reviewSummary,
} from "./review-state.mjs";

const weekPages = [
  "foundations",
  "html-accessibility",
  "css-responsive",
  "javascript-dom-async",
  "typescript-foundations",
  "typescript-modeling-generics",
  "typescript-runtime-contracts",
  "react-typescript",
  "routing-forms-a11y",
  "query-server-state",
  "backends-security",
  "testing-debugging-ci",
  "capstone",
];

const state = ref(createReviewState());
const selected = ref<number | null>(null);
const status = ref("");
const statusError = ref(false);
const now = ref(new Date().toISOString());

onMounted(() => {
  try {
    state.value = decodeReviewState(
      JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) ?? "null"),
    );
  } catch {
    state.value = createReviewState();
  }
});

const conceptSummary = computed(() =>
  reviewConcepts(
    weeklyQuizzes.flatMap((q) => q.questions),
    state.value,
    now.value,
  ),
);
const summary = computed(() => reviewSummary(state.value, now.value));
const candidates = computed(() =>
  Object.keys(state.value.records)
    .filter((id) => questionNeedsReview(state.value, id, now.value))
    .map((id) => getQuizQuestion(id))
    .filter((question): question is QuizQuestion => Boolean(question)),
);
const current = computed(() => candidates.value[0]);

function weekLink(week: number) {
  return withBase(`/90-days/week-${String(week).padStart(2, "0")}-${weekPages[week - 1]}.html`);
}

function answerCurrent() {
  if (!current.value || selected.value === null) {
    status.value = "请先选择答案。";
    statusError.value = true;
    return;
  }
  const correct = selected.value === current.value.correctIndex;
  state.value = recordReviewAnswer(state.value, current.value.id, correct);
  statusError.value = !correct;
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state.value));
  } catch {
    status.value = "结果只保存在当前页面内存。";
  }
  status.value = correct
    ? "回答正确；该题已安排下一次间隔复习。"
    : "仍需订正；请读解释后重新作答。";
  selected.value = null;
  now.value = new Date().toISOString();
}

function exportReview() {
  const blob = new Blob([JSON.stringify(state.value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    "issueflow-review-" + new Date().toISOString().slice(0, 10) + ".json";
  link.click();
  URL.revokeObjectURL(url);
  status.value = "复习记录已导出；分享前请检查文件内容。";
  statusError.value = false;
}

function resetReview() {
  if (!window.confirm("确定清空这台设备上的周测与错题记录吗？")) return;
  state.value = createReviewState();
  selected.value = null;
  try {
    localStorage.removeItem(REVIEW_STORAGE_KEY);
  } catch {
    // The in-memory state has still been reset.
  }
  status.value = "本设备复习记录已清空。";
  statusError.value = false;
}
</script>

<template>
  <section class="review-center" aria-labelledby="review-center-title">
    <div class="review-center__head">
      <h2 id="review-center-title">错题与间隔复习</h2>
      <dl v-if="summary.attempted" class="fe-counts">
        <div><dt>现在到期</dt><dd>{{ summary.due }}</dd></div>
        <div><dt>当前错题</dt><dd>{{ summary.incorrect }}</dd></div>
        <div><dt>已作答</dt><dd>{{ summary.attempted }}</dd></div>
      </dl>
    </div>
    <p class="review-center__intro">答错后立即进入错题队列；答对后按 1、3、7、14、30 天重新出现。记录只保存在这台设备的浏览器里。</p>

    <div class="review-center__actions">
      <button type="button" class="fe-text-action is-record" @click="exportReview">导出复习 JSON</button>
      <button type="button" class="fe-text-action is-danger" @click="resetReview">清空本机复习</button>
    </div>

    <section v-if="conceptSummary.length" class="review-center__concepts" aria-labelledby="review-concepts-title">
      <h3 id="review-concepts-title">薄弱概念</h3>
      <ul class="fe-plain-rows">
        <li v-for="row in conceptSummary" :key="row.conceptId">
          <span><NbText :text="conceptLabel(row.conceptId)" /></span>
          <span class="fe-plain-rows-state">{{ row.incorrect }} 道错题 · {{ row.due }} 道到期</span>
        </li>
      </ul>
    </section>

    <fieldset v-if="current" class="review-center__card fe-question">
      <legend><NbText :text="current.prompt" /></legend>
      <p class="fe-question-meta">
        {{ kindLabels[current.kind] }} · <NbText :text="conceptLabel(current.conceptId)" /> ·
        {{ difficultyLabels[current.difficulty] }}
      </p>
      <pre v-if="current.code" class="quiz-code" tabindex="0"><code>{{ current.code }}</code></pre>
      <div class="fe-options">
        <label v-for="(choice, index) in current.choices" :key="choice" class="fe-option">
          <input v-model.number="selected" type="radio" name="review-answer" :value="index" />
          <span><NbText :text="choice" /></span>
        </label>
      </div>
      <button type="button" class="nb-button nb-button--solid fe-submit" @click="answerCurrent">提交复习答案</button>
      <details class="fe-hint">
        <summary>需要提示</summary>
        <p><NbText :text="current.explanation" /></p>
        <ul class="fe-plain-rows">
          <li v-for="(reason, index) in current.choiceExplanations" :key="index">
            <span><strong><NbText :text="current.choices[index]" /></strong><NbText :text="'：' + reason" /></span>
          </li>
        </ul>
        <a :href="withBase(current.remediation)">回到课程</a>
      </details>
    </fieldset>
    <p v-else class="review-center__empty">当前没有到期错题。完成每周测验后，复习计划会显示在这里。</p>
    <p class="review-center__status" :class="{ 'is-error': statusError }" aria-live="polite">{{ status }}</p>

    <details class="review-center__quizzes">
      <summary>13 周测验入口</summary>
      <ol class="fe-plain-rows">
        <li v-for="quiz in weeklyQuizzes" :key="quiz.week">
          <a :href="weekLink(quiz.week)">第 {{ quiz.week }} 周：<NbText :text="quiz.title" /></a>
        </li>
      </ol>
    </details>
  </section>
</template>
