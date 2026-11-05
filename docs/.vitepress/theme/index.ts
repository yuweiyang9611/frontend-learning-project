// The default theme stays for its search, code-block and badge behaviour; the layout and every visible
// style come from the shared notebook kit. Stylesheet order: default theme, kit, site.
import DefaultTheme from "vitepress/theme-without-fonts";
import { useData, type Theme } from "vitepress";
import { onMounted, watch } from "vue";
import { bridgeIsDark } from "./theme-sync.mjs";
import "./kit/notebook.css";
import "./custom.css";
import NotebookLayout from "./NotebookLayout.vue";
import LearningProgressTracker from "./LearningProgressTracker.vue";
import ReviewCenter from "./ReviewCenter.vue";
import SourceBrowser from "./SourceBrowser.vue";
import SourcePanel from "./SourcePanel.vue";
import WeeklyKnowledgeCheck from "./WeeklyKnowledgeCheck.vue";

export default {
  extends: DefaultTheme,
  Layout: NotebookLayout,
  setup() {
    const { isDark } = useData();
    onMounted(() => bridgeIsDark(isDark, document.documentElement, watch));
  },
  enhanceApp({ app }) {
    app.component("LearningProgressTracker", LearningProgressTracker);
    app.component("ReviewCenter", ReviewCenter);
    app.component("SourceBrowser", SourceBrowser);
    app.component("SourcePanel", SourcePanel);
    app.component("WeeklyKnowledgeCheck", WeeklyKnowledgeCheck);
  },
} satisfies Theme;
