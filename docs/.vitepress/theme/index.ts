import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import LearningProgressTracker from "./LearningProgressTracker.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("LearningProgressTracker", LearningProgressTracker);
  },
} satisfies Theme;
