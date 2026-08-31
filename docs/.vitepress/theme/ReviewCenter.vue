<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { withBase } from 'vitepress';
import { getQuizQuestion, weeklyQuizzes, type QuizQuestion } from './quiz-bank';
import {
  REVIEW_STORAGE_KEY,
  createReviewState,
  decodeReviewState,
  questionNeedsReview,
  recordReviewAnswer,
  reviewSummary,
} from './review-state.mjs';

const state = ref(createReviewState());
const selected = ref<number | null>(null);
const status = ref('');
const now = ref(new Date().toISOString());

onMounted(() => {
  try {
    state.value = decodeReviewState(JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) ?? 'null'));
  } catch {
    state.value = createReviewState();
  }
});

const summary = computed(() => reviewSummary(state.value, now.value));
const candidates = computed(() =>
  Object.keys(state.value.records)
    .filter((id) => questionNeedsReview(state.value, id, now.value))
    .map((id) => getQuizQuestion(id))
    .filter((question): question is QuizQuestion => Boolean(question)),
);
const current = computed(() => candidates.value[0]);

function answerCurrent() {
  if (!current.value || selected.value === null) {
    status.value = '请先选择答案。';
    return;
  }
  const correct = selected.value === current.value.correctIndex;
  state.value = recordReviewAnswer(state.value, current.value.id, correct);
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state.value));
  } catch {
    status.value = '结果只保存在当前页面内存。';
  }
  status.value = correct ? '回答正确；该题已安排下一次间隔复习。' : '仍需订正；请读解释后重新作答。';
  selected.value = null;
  now.value = new Date().toISOString();
}

function exportReview() {
  const blob = new Blob([JSON.stringify(state.value, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'issueflow-review-' + new Date().toISOString().slice(0, 10) + '.json';
  link.click();
  URL.revokeObjectURL(url);
  status.value = '复习记录已导出；分享前请检查文件内容。';
}

function resetReview() {
  if (!window.confirm('确定清空这台设备上的周测与错题记录吗？')) return;
  state.value = createReviewState();
  selected.value = null;
  try {
    localStorage.removeItem(REVIEW_STORAGE_KEY);
  } catch {
    // The in-memory state has still been reset.
  }
  status.value = '本设备复习记录已清空。';
}
</script>

<template>
  <section class="review-center" aria-labelledby="review-center-title">
    <header>
      <p class="knowledge-check__eyebrow">本设备 · 本地保存</p>
      <h2 id="review-center-title">错题与间隔复习</h2>
      <p>答错后立即进入错题队列；答对后按 1、3、7、14、30 天重新出现。</p>
    </header>
    <dl class="review-center__summary">
      <div>
        <dt>已作答</dt>
        <dd>{{ summary.attempted }}</dd>
      </div>
      <div>
        <dt>当前错题</dt>
        <dd>{{ summary.incorrect }}</dd>
      </div>
      <div>
        <dt>现在到期</dt>
        <dd>{{ summary.due }}</dd>
      </div>
    </dl>
    <div class="review-center__actions">
      <button type="button" @click="exportReview">导出复习 JSON</button>
      <button type="button" class="danger" @click="resetReview">清空本机复习</button>
    </div>

    <fieldset v-if="current" class="review-center__card">
      <legend>{{ current.prompt }}</legend>
      <label v-for="(choice, index) in current.choices" :key="choice">
        <input v-model.number="selected" type="radio" name="review-answer" :value="index" />
        {{ choice }}
      </label>
      <button type="button" @click="answerCurrent">提交复习答案</button>
      <details>
        <summary>需要提示</summary>
        <p>{{ current.explanation }}</p>
        <a :href="withBase(current.remediation)">回到课程</a>
      </details>
    </fieldset>
    <p v-else>当前没有到期错题。完成每周测验后，复习计划会显示在这里。</p>
    <p aria-live="polite">{{ status }}</p>

    <details>
      <summary>13 周测验入口</summary>
      <ol>
        <li v-for="quiz in weeklyQuizzes" :key="quiz.week">
          <a
            :href="
              withBase(
                `/90-days/week-${String(quiz.week).padStart(2, '0')}-${['foundations', 'html-accessibility', 'css-responsive', 'javascript-dom-async', 'typescript-foundations', 'typescript-modeling-generics', 'typescript-runtime-contracts', 'react-typescript', 'routing-forms-a11y', 'query-server-state', 'backends-security', 'testing-debugging-ci', 'capstone'][quiz.week - 1]}.html`,
              )
            "
            >第 {{ quiz.week }} 周：{{ quiz.title }}</a
          >
        </li>
      </ol>
    </details>
  </section>
</template>
