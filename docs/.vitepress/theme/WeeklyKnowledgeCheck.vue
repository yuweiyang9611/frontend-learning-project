<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { withBase } from "vitepress";
import NbText from "./NbText";
import { scoreConcepts } from "./quiz-diagnostics.mjs";
import {
  conceptLabel,
  kindLabels,
  difficultyLabels,
  getWeeklyQuiz,
} from "./quiz-bank";
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
const conceptScores = computed(() =>
  scoreConcepts(quiz?.questions ?? [], answers),
);
const status = ref("");
const statusError = ref(false);
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

function optionState(questionId: string, correctIndex: number, index: number) {
  if (!submitted.value) return "";
  if (index === correctIndex) return "is-correct";
  return answers[questionId] === index ? "is-wrong" : "";
}

function submitQuiz() {
  if (!quiz) return;
  if (
    quiz.questions.some((question) => !Number.isInteger(answers[question.id]))
  ) {
    status.value = "请先回答全部问题；不确定时也要先作出预测。";
    statusError.value = true;
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
  statusError.value = false;
  status.value = `本周得分 ${score.value} / ${quiz.questions.length}；错题已进入复习中心。`;
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(next));
  } catch {
    status.value += "浏览器无法保存，请在本次会话内完成订正。";
  }
}
</script>

<template>
  <section
    v-if="quiz"
    class="knowledge-check"
    :aria-labelledby="`weekly-check-${week}`"
  >
    <h3 :id="`weekly-check-${week}`" class="knowledge-check__title">第 {{ week }} 周闭卷测验：<NbText :text="quiz.title" /></h3>
    <p class="knowledge-check__intro">先在不翻文档的情况下作答；提交后才显示解释和补救入口。</p>

    <fieldset
      v-for="(question, questionIndex) in quiz.questions"
      :key="question.id"
      class="fe-question"
    >
      <legend><NbText :text="`${questionIndex + 1}. ${question.prompt}`" /></legend>
      <p class="fe-question-meta">
        {{ kindLabels[question.kind] }} · <NbText :text="conceptLabel(question.conceptId)" /> ·
        {{ difficultyLabels[question.difficulty] }}
      </p>
      <pre v-if="question.code" class="quiz-code" tabindex="0"><code>{{ question.code }}</code></pre>
      <div class="fe-options">
        <label
          v-for="(choice, choiceIndex) in question.choices"
          :key="choice"
          class="fe-option"
          :class="optionState(question.id, question.correctIndex, choiceIndex)"
        >
          <input
            v-model.number="answers[question.id]"
            type="radio"
            :name="question.id"
            :value="choiceIndex"
            :disabled="submitted"
          />
          <span><NbText :text="choice" /></span>
          <span v-if="optionState(question.id, question.correctIndex, choiceIndex) === 'is-correct'" class="fe-verdict">正确</span>
          <span v-else-if="optionState(question.id, question.correctIndex, choiceIndex) === 'is-wrong'" class="fe-verdict">你的选择</span>
        </label>
      </div>
      <div
        v-if="submitted"
        class="fe-feedback"
        :class="answers[question.id] === question.correctIndex ? 'knowledge-check__correct' : 'knowledge-check__incorrect'"
        role="status"
      >
        <strong>{{ answers[question.id] === question.correctIndex ? "正确" : "需要复习" }}</strong>
        <p><NbText :text="question.explanation" /></p>
        <details>
          <summary>查看各选项解释</summary>
          <ul class="fe-plain-rows">
            <li v-for="(reason, index) in question.choiceExplanations" :key="index">
              <span><strong><NbText :text="question.choices[index]" /></strong><NbText :text="'：' + reason" /></span>
            </li>
          </ul>
        </details>
        <a v-if="answers[question.id] !== question.correctIndex" :href="withBase(question.remediation)">回到对应课程</a>
      </div>
    </fieldset>

    <button v-if="!submitted" type="button" class="nb-button nb-button--solid fe-submit" @click="submitQuiz">提交本周测验</button>
    <p class="knowledge-check__status" :class="{ 'is-error': statusError }" aria-live="polite">{{ status }}</p>

    <section v-if="submitted" class="knowledge-check__diagnosis" :aria-labelledby="`weekly-diagnosis-${week}`">
      <h4 :id="`weekly-diagnosis-${week}`">本周概念诊断</h4>
      <ul class="fe-plain-rows">
        <li v-for="row in conceptScores" :key="row.conceptId">
          <span><NbText :text="conceptLabel(row.conceptId)" /></span>
          <span class="fe-plain-rows-state" :class="{ 'is-done': row.correct === row.total }">{{ row.correct }} / {{ row.total }}</span>
        </li>
      </ul>
    </section>
    <details class="knowledge-check__oral">
      <summary>本周口试 / 代码审查</summary>
      <p><NbText :text="quiz.reviewPrompt" /></p>
      <h4>合格答案必须包含</h4>
      <ul>
        <li v-for="item in quiz.rubric" :key="item"><NbText :text="item" /></li>
      </ul>
    </details>
    <p class="knowledge-check__review-link">
      <a :href="withBase('/90-days/review-center.html')">打开错题与间隔复习中心</a>
    </p>
  </section>
</template>
