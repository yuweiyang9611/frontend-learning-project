# 第 3 周：CSS、布局、响应式与设计系统

本周从“为什么这个规则生效”开始，而不是背属性清单。最终交付一个在窄屏、中屏和宽屏
都可用的 Issue 列表，并能用 DevTools 解释 cascade、尺寸和布局来源。

## 本周成果

- 使用 cascade、specificity、inheritance 和 source order 定位样式；
- 准确计算 content-box、border-box、margin collapse 与 overflow；
- 使用 Flexbox 和 Grid 解决不同方向的布局问题；
- 从内容约束推导断点，不为某台设备写死样式；
- 用 CSS custom properties 建立主题和组件变量。

配套教材：[HTML 与 CSS](../learning/03-html-and-css.md)。

---

## Day 15：Cascade、Specificity 与继承 {#day-15}

开始前在仓库根运行 `npm run learn:create -- --day 15`。该快照保留第 2 周语义基线，让你只观察
Cascade、响应式和焦点；目标目录已存在时脚本会拒绝覆盖。

### 120 分钟任务

- **0–15：**预测四条冲突规则中哪条获胜，并写下理由。
- **15–40：**阅读 cascade 层、origin、importance、specificity、source order。
- **40–80：**在 DevTools Styles/Computed 中追踪 IssueFlow 一个按钮的最终颜色。
- **80–110：**删除一个过度具体选择器，用类和变量重写。
- **110–120：**整理“样式不生效”的固定排查顺序。

### 实验

```css
button {
  color: navy;
}

.toolbar button {
  color: teal;
}

.danger {
  color: crimson;
}

#issue-actions .danger {
  color: maroon;
}
```

不要只说“最后一条赢”。依次比较 origin、important、layer、specificity、scope/proximity
和 source order。然后在 DevTools 中禁用规则，观察继承值与 CSS variable 的来源。

### 独立任务

找到项目中一个 `!important` 或高 specificity 场景；若没有，自己制造。设计一个
不依赖继续提高 specificity 的修复，并写明权衡。

### 当日验收

- [ ] 能从 Computed 跳回最终声明。
- [ ] 不用盲目追加 `!important`。
- [ ] 能区分继承属性与默认不继承属性。
- [ ] 排查记录包含被覆盖规则，而非只写最终值。

---

## Day 16：Box Model、尺寸单位与 Overflow {#day-16}

### 120 分钟任务

- **0–15：**手算一个 300px content-box 加 padding/border 后的总宽度。
- **15–40：**学习 box-sizing、min/max、百分比、rem、vw 与 intrinsic size。
- **40–80：**在 Layout 面板测量 Issue card、输入框和侧栏。
- **80–110：**制造长标题、长 URL 和大表格，逐项修复 overflow。
- **110–120：**记录每种单位的使用理由。

### 核心规则

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

.issue-title {
  overflow-wrap: anywhere;
}

.table-region {
  max-inline-size: 100%;
  overflow-x: auto;
}
```

`width: 100%` 不保证元素不溢出：padding、min-content、不可换行文本、Grid/Flex
默认最小尺寸都可能继续撑开容器。修复前先在 DevTools 找到真正超出边界的盒子。

### 独立任务

把页面根字体改为 125%，再测试布局。若某些控件重叠，判断是固定像素、行高还是容器
约束问题；不要通过缩小字体掩盖。

### 当日验收

- [ ] 能计算 border-box 与 content-box。
- [ ] 200% 缩放时核心内容仍可访问。
- [ ] 长文本不会让页面产生整体横向滚动。
- [ ] 能解释何时用 rem、百分比、fr、ch 和 px。

---

## Day 17：Flexbox 的一维布局 {#day-17}

### 120 分钟任务

- **0–15：**画出 main axis、cross axis、container 和 item。
- **15–40：**研究 flex-basis、grow、shrink、gap、alignment 与 min-width。
- **40–80：**实现工具栏、标签行和按钮组。
- **80–110：**测试 320px 宽度、长中文标题和按钮文案放大。
- **110–120：**写出三个“不是 space-between 问题”的案例。

### 实验

```css
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.toolbar__search {
  flex: 1 1 18rem;
  min-width: 0;
}

.toolbar__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 0.5rem;
}
```

修改 `flex-basis`、删除 `min-width: 0`、禁止 wrap，分别观察溢出来源。

### 独立任务

实现 Issue 卡片头部：标题占剩余空间，priority/status 不被压扁，窄屏时元数据换行。
不能通过固定标题宽度解决。

### 当日验收

- [ ] 能解释 grow/shrink 是怎样分配剩余或不足空间的。
- [ ] 不用 margin hack 模拟 gap。
- [ ] 窄屏换行顺序仍符合阅读逻辑。
- [ ] DOM 顺序未为了视觉排列而破坏键盘/读屏顺序。

---

## Day 18：Grid 的二维布局 {#day-18}

### 120 分钟任务

- **0–15：**写出一个适合 Grid、一个适合 Flexbox 的项目场景。
- **15–40：**学习 explicit/implicit grid、minmax、auto-fit 与命名区域。
- **40–80：**构建 Dashboard 指标区和两栏内容布局。
- **80–110：**用相同内容分别实现 Flex/Grid，比较规则复杂度。
- **110–120：**记录选择布局算法的判断问题。

### 实验

```css
.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
  gap: 1rem;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
  gap: 1.5rem;
}
```

观察为什么 `minmax(0, 1fr)` 能防止主内容的 min-content 撑开整个 Grid。

### 独立任务

建立一个 Board 三列布局：宽屏三列，窄屏水平滚动或单列。写出你选择滚动还是重排的
产品理由，并保证每列标题与 Issue 数量可感知。

### 当日验收

- [ ] 能区分 Grid track 与 Grid item。
- [ ] 使用 minmax/auto-fit 而不是枚举所有屏幕宽度。
- [ ] 不用 Grid 视觉重排破坏 DOM 顺序。
- [ ] 解释为何某处选择 Grid 而非 Flex。

---

## Day 19：响应式、Container 与内容断点 {#day-19}

### 120 分钟任务

- **0–15：**写下你认为 mobile-first 的含义。
- **15–40：**研究 media query、container query、logical properties 和触控目标。
- **40–80：**从 320px 开始实现 Issue 列表，再逐步增加可用空间。
- **80–110：**测试 320/768/1280px、200% 缩放和横竖屏。
- **110–120：**为每个断点记录“内容为何在这里失败”。

### 原则

断点来自内容，而不是设备品牌。当导航开始拥挤、表格无法比较或表单行过长时才调整。
窄屏不是删除功能的理由；可以改变排列、密度和揭示方式，但核心任务仍应可完成。

### 零基础说明：Media 与 Container 解决不同问题

Media query 观察浏览器视口，适合改变整页导航或页面骨架；container query 观察组件实际获得
的内联尺寸，适合同一个 Issue 筛选栏同时出现在宽主栏和窄侧栏。`@media (min-width: ...)`
不代表自动 mobile-first：必须先写无需查询的窄屏基础规则，再在空间增加时增强。

Logical properties 用内容方向表达布局，例如 `margin-inline`、`padding-block`、
`border-inline-start`。它们不能自动完成国际化，却能避免把“左边”误当成所有书写方向的
“开始侧”。200% 缩放也不是简单缩小截图：可用 CSS 像素减少，文字换行和控件高度改变，
因此必须用真实缩放重复任务。

先给承载筛选栏的容器加名字和内联尺寸上下文，再逐步增强组件：

```css
.issue-toolbar-shell {
  container-type: inline-size;
  container-name: issue-toolbar;
}

.issue-toolbar {
  display: grid;
  gap: var(--space-3);
}

@container issue-toolbar (min-width: 42rem) {
  .issue-toolbar {
    grid-template-columns: minmax(14rem, 1fr) auto auto;
    align-items: end;
  }
}
```

不支持或不需要 container query 时仍应有可用基础布局；增强规则不能成为访问核心操作的唯一
路径。

### 独立任务

为筛选栏实现：

- 窄屏：搜索独占一行，筛选控件按需要换行；
- 中屏：搜索与常用筛选同排；
- 宽屏：额外显示排序与视图切换。

所有控件触控区域至少约 44×44px，标签不能只剩不明确图标。

### 可执行故障与变体实验

逐项制造并修复，每次用 DevTools 标出导致问题的具体声明：

1. 给工具栏子项设置 `min-width: 48rem`，在 320px 观察横向滚动并找出最小宽度来源；
2. 使用一段 80 字符无空格标题，处理溢出但不能裁掉文本或 focus ring；
3. 把文字按钮缩成只有图标，检查 accessible name 和约 44×44px 触控区域；
4. 用 CSS `order` 把 Save 放到视觉最前，比较视觉顺序与 Tab/DOM 顺序；
5. 将页面缩放到 200%，打开抽屉或筛选栏，检查是否形成横向加纵向的双滚动陷阱；
6. 把同一筛选组件放进宽主栏和 28rem 容器，证明 container query 响应容器而非设备名称。

断点调整前先截图失败点并记录内容宽度，调整后从断点前后各取一个宽度复测，避免只在刚好
匹配的像素通过。

### 当日证据

- 320/768/1280px、200% 缩放、横竖屏的矩阵；
- 每个断点对应的具体内容失败，而不是设备型号；
- media query 与 container query 各一个实际使用理由；
- 六个故障/变体中至少四个的修复前后截图和 Computed 证据；
- 键盘顺序、accessible name、触控目标和横向 overflow 检查结果。

### 当日验收

- [ ] 断点说明基于内容压力。
- [ ] 页面没有依赖 hover 才能发现的核心操作。
- [ ] 使用 logical properties 支持不同书写方向的思维。
- [ ] 缩放后没有双向滚动陷阱。

---

## Day 20：设计变量、主题与组件状态 {#day-20}

### 120 分钟任务

- **0–15：**列出页面中重复出现的颜色、间距、圆角和阴影。
- **15–40：**检查 IssueFlow CSS variables、light/dark/system 主题。
- **40–80：**为练习页建立 primitive、semantic、component 三层 token。
- **80–110：**实现 hover/focus/active/disabled/error/success 状态并测对比度。
- **110–120：**记录哪些 token 表达数值，哪些表达意图。

### Token 分层

```css
:root {
  --violet-600: #6155d9;
  --surface: #ffffff;
  --text: #1d1d24;
  --action-primary: var(--violet-600);
  --space-2: 0.5rem;
  --radius-control: 0.5rem;
}

[data-theme="dark"] {
  --surface: #17171d;
  --text: #f4f2ff;
}
```

组件引用 `--action-primary` 比引用 `--violet-600` 更能表达意图。主题切换时优先修改
semantic token，不在每个组件重复写 dark selector。

### 独立任务

为 priority/status 设计样式，但状态不能只靠颜色。加入文字、图形或边框差异，并在
亮/暗主题分别检查普通、hover 和 focus。

### 当日验收

- [ ] token 命名能表达层级和意图。
- [ ] 系统主题变化不会造成不可读组合。
- [ ] focus 与 hover 都有独立状态。
- [ ] 禁用状态仍可读，且与 pending 状态不混淆。

---

## Day 21：响应式页面交付与周测 {#day-21}

### 120 分钟任务

- **0–15：**闭卷解释 cascade、box、Flex、Grid、断点和 token。
- **15–65：**独立完成响应式 Issue 列表：导航、筛选、卡片/表格、分页。
- **65–90：**执行宽度、缩放、主题、长内容和键盘测试。
- **90–110：**用 DevTools 解释三个最终样式的来源。
- **110–120：**整理证据并安排补救。

### 必测矩阵

| 维度 | 场景                                  |
| ---- | ------------------------------------- |
| 宽度 | 320、768、1280px                      |
| 字体 | 100%、125%、200%                      |
| 内容 | 超长标题、20 个标签、无负责人、空列表 |
| 主题 | light、dark、system                   |
| 输入 | 键盘、触控大小、hover 不可用          |
| 状态 | loading、error、empty、success        |

### 周交付物

- 响应式 Issue 列表；
- 断点选择记录；
- 组件 token 表；
- 三个 cascade 调试案例；
- 测试矩阵结果；
- 一段“为什么这里用 Grid/Flex”的设计说明。

### 通过标准

- 三个目标宽度均可完成搜索、筛选、打开 Issue；
- 200% 缩放不丢核心内容；
- 无整体横向滚动，必要区域可局部滚动；
- 亮暗主题关键文本和焦点清晰；
- 能在 DevTools 中证明最终尺寸和颜色来自哪里。

[上一周：语义 HTML 与可访问性](week-02-html-accessibility.md) ·
[下一周：JavaScript、DOM 与异步](week-04-javascript-dom-async.md) ·
[返回课程总览](./)
