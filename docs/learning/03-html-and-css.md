# 03：HTML 与 CSS

## 本章目标

本章不要求背标签和属性，而是建立两套判断能力：

1. HTML 是否准确表达内容与交互语义；
2. CSS 是否用可维护的规则完成布局、主题和响应式变化。

真实入口是 [globals.css](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/app/globals.css)、[product.css](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/app/product.css)、[responsive.css](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/app/responsive.css) 和 [learning.css](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/app/learning.css)。

## 1. HTML 是文档与交互 Contract

浏览器、键盘、屏幕阅读器、搜索引擎和测试工具都依赖最终 HTML。React JSX 只是生成 HTML/DOM 的方式。

优先选择语义元素：

| 意图       | 推荐                     | 不推荐的替代       |
| ---------- | ------------------------ | ------------------ |
| 执行动作   | `button`                 | 带点击事件的 `div` |
| 页面导航   | `a`/Router `Link`        | 用按钮模拟链接     |
| 表单字段名 | `label` 关联控件         | 只用 placeholder   |
| 主要区域   | `main`                   | 所有内容都放 `div` |
| 数据表     | `table`、`th`、`caption` | 用 Grid 假装表格   |
| 一组导航   | `nav`                    | 无语义容器         |

语义不是装饰。一个原生 `button` 自动获得键盘激活、焦点和 disabled 行为；用 `div` 重造这些能力既费力又容易遗漏。

## 2. 表单：名字、状态与错误

阅读 [IssueForm.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/issues/IssueForm.tsx)，逐个找出：

- label 怎样与 input/textarea/select 关联；
- 必填、无效和描述文本怎样关联；
- 错误信息何时出现；
- 提交中怎样阻止重复操作；
- 首个错误字段怎样获得焦点。

三个属性承担不同职责：

- `aria-invalid="true"` 告诉辅助技术当前值无效；
- `aria-describedby="title-error"` 把字段与解释文本关联；
- `disabled` 会改变交互和提交行为，不能仅靠颜色表达。

### 练习：用 DOM 验收表单

不要只看截图。在 Elements 面板选择 Title 字段：

1. 点击对应 label，焦点是否进入输入框；
2. 空提交后是否出现可访问的错误关系；
3. 错误是否靠文字表达，而非只有红色；
4. Tab 顺序是否符合视觉和任务顺序；
5. 修正后错误状态是否及时消失。

## 3. Cascade、Specificity 与源代码顺序

当两条规则都匹配同一元素时，浏览器综合考虑：

1. 来源和 `!important`；
2. 选择器 specificity；
3. 同等优先级下的源代码顺序；
4. 继承与初始值。

调试时不要立即增加 `!important`。在 Computed/Styles 中查看哪条规则被覆盖以及来源文件。长期堆高 specificity 会让每个后续修改都更困难。

项目通过多个 CSS 文件分工：

- `globals.css`：基础元素、颜色和通用规则；
- `product.css`：业务页面与组件外观；
- `responsive.css`：按视口调整布局；
- `learning.css`：TypeScript Lab 的专属表现。

## 4. Box Model 与尺寸

默认 Box Model 中，元素占用宽度约为：

`content + padding + border + margin`

全局使用 `box-sizing: border-box` 后，声明宽度包含 padding 与 border，更适合组件布局。溢出时按顺序检查：

1. 父容器的可用宽度；
2. 子元素是否有固定宽度或 `min-width`；
3. 长文本能否换行；
4. Grid/Flex 子项的默认最小尺寸；
5. 是否应该在局部容器上允许滚动。

不要用“到处加 `overflow: hidden`”掩盖问题；它可能裁掉焦点轮廓和内容。

## 5. Flex 与 Grid 的分工

- Flex 适合一维排列：工具栏、按钮组、头像与文字；
- Grid 适合二维区域：仪表板卡片、看板列、页面骨架；
- 普通文档流适合正文和表单纵向节奏。

一个判断方法：如果主要问题是“沿一条轴如何分配”，先想 Flex；如果需要同时控制行和列，先想 Grid。

### 实验

在 DevTools 临时关闭一条 `display: grid` 或 `display: flex` 规则，然后逐项恢复 `gap`、`align-items`、`minmax` 等属性。记录每个属性解决的具体约束，而不是只记录最终值。

## 6. Design Tokens 与主题

项目用 CSS 自定义属性表达颜色、边框、阴影和空间。主题 Provider 会在根元素设置 `data-theme`，CSS 再根据属性替换变量。

这种设计把职责分开：

- React 决定当前主题状态；
- DOM 暴露 `data-theme`；
- CSS 决定具体视觉值；
- 组件使用语义变量，而不是重复硬编码颜色。

新增颜色前先问：这是“品牌色”，还是“成功/危险/表面/文字”这样的语义？语义变量更容易支持深色主题与未来改版。

## 7. 响应式不是把桌面缩小

当前 [responsive.css](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/app/responsive.css) 主要使用 `max-width` 断点，因此是从完整桌面布局向较窄视口逐步适配，并不是严格的 mobile-first 实现。文档必须描述真实代码。

项目主要断点为 1180、940、760、520px。观察每个断点时回答：

- 哪个布局从多列变成单列；
- 哪些操作被折叠或换行；
- 表格如何处理横向空间；
- 看板是否仍能操作；
- 对话框、抽屉和表单是否保留可用触控目标。

### 实验矩阵

| 视口       | 重点页面           | 检查项                      |
| ---------- | ------------------ | --------------------------- |
| 1440 × 900 | Dashboard / Issues | 最大宽度、密度、空白        |
| 1024 × 768 | Board              | 列宽、滚动、工具栏          |
| 768 × 1024 | Issue Form         | 标签、按钮、错误信息        |
| 390 × 844  | 全流程             | 抽屉、表格替代、Modal、焦点 |

## 8. 动画与运动偏好

当前项目存在过渡和动画，但没有明显的 `prefers-reduced-motion` 全局策略。这不是应被文档隐藏的事实，而是很好的改进练习：

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

练习时先写一个能观察失败的检查，再加入规则并验证。是否使用全局策略或逐组件策略，应在记录中解释。

## 9. 源码追踪任务

选择 Issues、Board、TypeScript Lab 三页，各完成一张表：

| 可见区域         | React 组件   | className  | CSS 文件   | 小屏变化         |
| ---------------- | ------------ | ---------- | ---------- | ---------------- |
| 示例：列表工具栏 | `IssuesPage` | 从源码填写 | 从样式查找 | 从响应式规则填写 |

这会把“看起来像”变成可追踪证据。

## 常见误区

- class 名叫 `button` 不会自动获得按钮语义。
- placeholder 不是 label。
- 深色主题不是简单反转颜色。
- CSS 文件拆分不等于职责天然清楚，仍需避免互相覆盖。
- 响应式不仅是宽度，也包括输入方式、文字缩放与可访问性。

## 本章验收

- [ ] 能从 JSX 找到最终 HTML 语义。
- [ ] 能解释 label、错误文本和字段的关联。
- [ ] 能在 DevTools 找到一个被覆盖的 CSS 声明。
- [ ] 能说明项目是如何切换主题的。
- [ ] 能按四个视口完成页面检查并记录真实变化。
- [ ] 能解释当前实现为何不能称为严格 mobile-first。

[上一章：浏览器、URL、HTTP 与 DevTools](02-browser-and-web.md) · [下一章：JavaScript、DOM 与异步](04-javascript-dom-and-http.md)
