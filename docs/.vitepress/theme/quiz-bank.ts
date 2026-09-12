export interface QuizQuestion {
  id: string;
  kind: "concept" | "reading" | "debugging" | "transfer";
  conceptId: string;
  difficulty: "foundation" | "application" | "analysis";
  choiceExplanations: string[];
  code?: string;
  language?: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  remediation: string;
}

export interface WeeklyQuiz {
  week: number;
  title: string;
  reviewPrompt: string;
  rubric: string[];
  questions: QuizQuestion[];
}

const modules = import.meta.glob("../../90-days/data/quizzes/week-*.json", {
  eager: true,
  import: "default",
}) as Record<string, WeeklyQuiz>;

export const weeklyQuizzes = Object.values(modules).sort(
  (left, right) => left.week - right.week,
);

export function getWeeklyQuiz(week: number): WeeklyQuiz | undefined {
  return weeklyQuizzes.find((quiz) => quiz.week === week);
}

export function getQuizQuestion(questionId: string): QuizQuestion | undefined {
  return weeklyQuizzes
    .flatMap((quiz) => quiz.questions)
    .find((question) => question.id === questionId);
}

export const kindLabels = {
  concept: "概念回忆",
  reading: "阅读与预测",
  debugging: "错误定位",
  transfer: "应用变式",
};
export const difficultyLabels = {
  foundation: "基础",
  application: "应用",
  analysis: "分析",
};
const conceptLabels: Record<string, string> = {
  "web.environment": "浏览器与运行环境",
  "html.semantic": "HTML 语义与可访问性",
  "css.responsive": "CSS 与响应式布局",
  "javascript.dom": "DOM、事件与异步",
  "typescript.core": "TypeScript 基础",
  "typescript.modeling": "领域建模与泛型",
  "typescript.runtime": "运行时契约",
  "react.state": "React 组件与状态",
  "forms.a11y": "路由、表单与焦点",
  "query.core": "查询与缓存",
  "query.mutation": "异步修改",
  "query.rollback": "乐观更新与回滚",
  "backend.dual": "双后端与持久化",
  "security.boundary": "身份与安全边界",
  "testing.core": "测试与调试",
  "testing.ci": "持续集成",
  "capstone.delivery": "毕业项目与交付",
};
export const conceptLabel = (id: string) => conceptLabels[id] ?? id;
