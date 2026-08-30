export interface QuizQuestion {
  id: string;
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
