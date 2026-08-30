<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { withBase } from "vitepress";
import { getWeeklyQuiz } from "./quiz-bank";
import {
  REVIEW_STORAGE_KEY,
  createReviewState,
  decodeReviewState,
  recordReviewAnswer,
} from "./review-state.mjs";

const props = defineProps<{ week: number }>();
const quiz = getWeeklyQuiz(props.week);
const answers = reactive<Record<string, number>>({});
const submitted = ref(false);
const status = ref("");
const reviewState = ref(createReviewState());

const score = computed(
  () =>
    quiz?.questions.filter(
      (question) => answers[question.id] === question.correctIndex,
    ).length ?? 0,
);

onMounted(() => {
  try {
    reviewState.value = decodeReviewState(
      JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) ?? "null"),
    );
  } catch {
    reviewState.value = createReviewState();
  }
});

function submitQuiz() {
  if (!quiz) return;
  if (
    quiz.questions.some((question) => !Number.isInteger(answers[question.id]))
  ) {
    status.value = "请先回答全部问题；不确定时也要先作出预测。";
    return;
  }
  const answeredAt = new Date().toISOString();
  let next = reviewState.value;
  for (const question of quiz.questions) {
    next = recordReviewAnswer(
      next,
      question.id,
      answers[question.id] === question.correctIndex,
      answeredAt,
    );
  }
  reviewState.value = next;
  submitted.value = true;
  status.value = `本周得分 ${score.value} / ${quiz.questions.length}；错题已进入复习中心。`;
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(next));
  } catch {
    status.value += " 浏览器无法保存，请在本次会话内完成订正。";
  }
}
</script>

<template>
  <section
    v-if="quiz"
    class="knowledge-check"
    :aria-labelledby="`weekly-check-${week}`"
  >
    <header>
      <p class="knowledge-check__eyebrow">闭卷回忆 · 第 {{ week }} 周</p>
      <h2 :id="`weekly-check-${week}`">{{ quiz.title }}</h2>
      <p>先在不翻文档的情况下作答；提交后才显示解释和补救入口。</p>
    </header>

    <fieldset
      v-for="(question, questionIndex) in quiz.questions"
      :key="question.id"
    >
      <legend>{{ questionIndex + 1 }}. {{ question.prompt }}</legend>
      <label v-for="(choice, choiceIndex) in question.choices" :key="choice">
        <input
          v-model.number="answers[question.id]"
          type="radio"
          :name="question.id"
          :value="choiceIndex"
          :disabled="submitted"
        />
        {{ choice }}
      </label>
      <div
        v-if="submitted"
        :class="
          answers[question.id] === question.correctIndex
            ? 'knowledge-check__correct'
            : 'knowledge-check__incorrect'
        "
        role="status"
      >
        <strong>{{
          answers[question.id] === question.correctIndex ? "正确" : "需要复习"
        }}</strong>
        <p>{{ question.explanation }}</p>
        <a
          v-if="answers[question.id] !== question.correctIndex"
          :href="withBase(question.remediation)"
          >回到对应课程</a
        >
      </div>
    </fieldset>

    <button v-if="!submitted" type="button" @click="submitQuiz">
      提交本周测验
    </button>
    <p class="knowledge-check__status" aria-live="polite">{{ status }}</p>

    <details>
      <summary>本周口试 / 代码审查</summary>
      <p>{{ quiz.reviewPrompt }}</p>
      <h3>合格答案必须包含</h3>
      <ul>
        <li v-for="item in quiz.rubric" :key="item">{{ item }}</li>
      </ul>
    </details>
    <p>
      <a :href="withBase('/90-days/review-center.html')"
        >打开错题与间隔复习中心</a
      >
    </p>
  </section>
</template>
