import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import LearningProgressTracker from "./LearningProgressTracker.vue";
import ReviewCenter from "./ReviewCenter.vue";
import WeeklyKnowledgeCheck from "./WeeklyKnowledgeCheck.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("LearningProgressTracker", LearningProgressTracker);
    app.component("ReviewCenter", ReviewCenter);
    app.component("WeeklyKnowledgeCheck", WeeklyKnowledgeCheck);
  },
} satisfies Theme;
