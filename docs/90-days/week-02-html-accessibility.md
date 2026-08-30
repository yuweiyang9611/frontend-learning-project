# 第 2 周：语义 HTML、表单与可访问性

本周不使用 React。目标是先学会用浏览器原生能力表达结构、输入和状态。周末你将完成
一个无需 CSS 也能按合理顺序阅读、仅用键盘即可填写的 Issue 创建页。

## 本周成果

- 使用 landmark、heading、list、button、link 和 form control 表达语义；
- 理解 accessible name、label、description、focus 与键盘顺序；
- 区分客户端约束、业务校验和服务端校验；
- 使用原生表单完成提交、错误定位和成功反馈；
- 对照 IssueFlow 找出语义正确与需要改进的地方。

配套教材：[HTML 与 CSS](../learning/03-html-and-css.md)、
[表单、复杂交互与可访问性](../learning/09-forms-interactions-and-a11y.md)。

---

## Day 08：文档骨架与语义层级 {#day-08}

### 120 分钟任务

- **0–15：**不查资料写出 `div`、`main`、`section`、`article` 的区别。
- **15–40：**阅读 HTML 教材的语义结构部分，检查 IssueFlow 页面 landmark。
- **40–80：**在仓库根运行 `npm run learn:create -- --day 08`，从可恢复 starter 完成
  header/nav/main/aside/footer、活动报名表与一个信息 article；不得用可点击 div 代替控件。
- **80–110：**删除 CSS，仅根据阅读顺序和标题层级改进结构。
- **110–120：**用文档大纲记录每个区域“是什么”，而不是“长什么样”。

### 精讲

`section` 不是“带间距的 div”。当一组内容有自己的主题，通常应有可感知标题；
`article` 表示可以独立理解或复用的内容；`nav` 只用于主要导航集合。语义元素的
价值是建立结构 Contract，使键盘用户、读屏软件、搜索引擎和自动化测试得到一致信息。

### 实验

```html
<main>
  <h1>Issues</h1>
  <section aria-labelledby="open-issues-title">
    <h2 id="open-issues-title">Open issues</h2>
    <article>
      <h3>ISS-248 · Fix keyboard focus</h3>
      <p>Priority: High</p>
    </article>
  </section>
</main>
```

把所有语义元素替换为 `div`，比较浏览器 Accessibility tree 或辅助功能面板。

### 当日验收

- [ ] 页面只有一个描述整体主题的 `h1`。
- [ ] 标题层级不为视觉大小而跳级。
- [ ] 每个 landmark 有明确职责，重复 landmark 有可区分名称。
- [ ] 能解释为什么语义错误不能只靠 CSS 修复。

---

## Day 09：文本、链接、按钮、列表与媒体 {#day-09}

### 120 分钟任务

- **0–15：**列出“导航到另一个位置”和“改变当前状态”的五个例子。
- **15–40：**研究 link 与 button 的默认键盘行为、URL 语义和禁用状态。
- **40–80：**把 Issue 摘要写成列表，每项含标题链接、状态、负责人和标签。
- **80–110：**故意交换 link/button，再用键盘和复制链接功能证明问题。
- **110–120：**整理元素选择决策表。

### 决策规则

| 用户意图        | 首选元素                  | 原因                             |
| --------------- | ------------------------- | -------------------------------- |
| 打开 Issue 详情 | `a href`                  | 有可分享、可复制、可新开页的 URL |
| 删除 Issue      | `button`                  | 触发动作，不产生导航位置         |
| 切换筛选条件    | button、checkbox 或 radio | 由交互语义决定                   |
| 展示标签集合    | `ul`/`li`                 | 是同类项目集合                   |
| 展示装饰图标    | CSS 或空 alt 图片         | 不应重复可见文字                 |

### 独立任务

制作两个版本的 Issue 行：一个整个卡片都是链接，一个只有标题是链接。比较内部按钮、
文字选择、焦点顺序与点击目标，写出你选择最终方案的依据。

### 当日验收

- [ ] 不用无 `href` 的 `a` 模拟按钮。
- [ ] 图标按钮有可访问名称。
- [ ] 图片 alt 描述用途，不以“图片”开头。
- [ ] 能解释 disabled 与 `aria-disabled` 的行为差异。

---

## Day 10：表单控件、Label 与输入 Contract {#day-10}

### 120 分钟任务

- **0–15：**写下浏览器提交表单时每个字段如何获得名字和值。
- **15–40：**阅读表单章节，检查 IssueFlow 的 IssueForm 字段。
- **40–80：**实现 title、description、priority、status、assignee、due date。
- **80–110：**用键盘完整填写；检查 FormData 中的 name/value。
- **110–120：**记录每个字段的类型、必填性和帮助文字。

### 表单骨架

```html
<form id="issue-form">
  <div>
    <label for="title">Title</label>
    <input id="title" name="title" required minlength="3" maxlength="100" />
    <p id="title-help">Use a short, unique description.</p>
  </div>

  <fieldset>
    <legend>Priority</legend>
    <label><input type="radio" name="priority" value="low" /> Low</label>
    <label><input type="radio" name="priority" value="medium" /> Medium</label>
    <label><input type="radio" name="priority" value="high" /> High</label>
  </fieldset>

  <button type="submit">Create issue</button>
</form>
```

为帮助文字增加 `aria-describedby`，在 Accessibility tree 中确认输入框同时拥有 name
和 description。

### 独立任务

把 visible label 暂时删掉，只保留 placeholder。尝试输入后判断字段含义，再解释
placeholder 为什么不能承担 label 的长期职责。

### 当日验收

- [ ] 每个 control 都有程序可关联的 label。
- [ ] 同组 radio 使用 fieldset/legend。
- [ ] submit 与普通 button 的 type 明确。
- [ ] 能通过 FormData 解释 `name` 属性的作用。

---

## Day 11：约束校验、业务规则与错误恢复 {#day-11}

### 120 分钟任务

- **0–15：**把“标题不能为空”“标题必须唯一”“用户必须登录”分到不同校验层。
- **15–40：**研究 required、minlength、pattern 和 Constraint Validation API。
- **40–80：**为练习表单实现提交后错误摘要与字段错误。
- **80–110：**测试空值、过长值、重复标题模拟和网络失败模拟。
- **110–120：**记录每种失败的所有者与恢复方式。

### 三层校验

1. **输入约束：**格式、长度、必填，可在浏览器立即反馈；
2. **领域规则：**例如标题唯一，需要查询当前数据或服务端；
3. **授权与信任边界：**必须由服务端验证，前端只能改善体验。

错误消息必须回答：哪里错了、为什么、怎样修复。失败后保留用户已经输入的合法内容，
不要清空整个表单。

### 零基础说明：浏览器校验不是业务授权

`required`、`minlength` 和 `pattern` 描述的是控件约束。用户通过提交按钮提交时，浏览器会
先运行 Constraint Validation；`input.validity` 给出失败原因，`checkValidity()` 只返回结果，
`reportValidity()` 还会请求浏览器显示提示。它们能快速反馈，却不能证明请求可信：用户可以
删除属性、给 form 加 `novalidate`、直接调用 API，或构造完全不经过页面的 HTTP 请求。

自定义错误摘要时仍要保留控件语义。字段失败后设置 `aria-invalid="true"`，通过
`aria-describedby` 指向稳定的错误元素 id；摘要本身应有标题、可聚焦，并包含回到字段的
链接。不要一边依赖浏览器默认气泡，一边又隐藏所有错误，导致键盘用户不知道焦点在哪里。

### 独立任务

提交三个错误字段。让焦点移动到错误摘要，并让摘要链接回对应控件。随后只修复一个字段，
确认另外两个错误仍可感知。

### 可执行故障与变体实验

依次做四次实验，每次记录提交事件是否发生、焦点位置、DOM 属性、错误文字和输入是否保留：

1. 在 Elements 中临时删除 title 的 `required`，提交空标题；
2. 给 form 临时增加 `novalidate`，证明客户端代码仍需自行检查；
3. 模拟服务端返回“标题已存在”的 409，将错误放回 title，而不是只弹通用消息；
4. 开启 Offline 模拟无 HTTP status 的网络失败，保留全部字段并提供重试入口。

再加入一个合法边界：title 恰好达到最大长度时可提交，多一个字符时显示具体限制。若使用
`setCustomValidity`，修正字段后必须清空旧消息，否则控件会一直保持 invalid。

### 当日证据

- 一张“输入约束 / 领域规则 / 授权边界”表，至少各含两个例子；
- 四个故障实验的实际结果，不只写预期；
- 错误摘要、字段 id、`aria-invalid`、`aria-describedby` 的 DOM 截图；
- 修复前后的键盘焦点顺序；
- 一个最大长度边界的可重复断言。

### 当日验收

- [ ] 错误不只靠红色表达。
- [ ] 错误文字与对应输入建立关联。
- [ ] 提交失败后输入内容仍在。
- [ ] 不把前端 required 当成安全边界。

---

## Day 12：键盘、焦点与状态播报 {#day-12}

### 120 分钟任务

- **0–15：**不用鼠标完成 IssueFlow 登录和新建流程，记录阻塞点。
- **15–40：**学习焦点顺序、focus-visible、dialog 与 live region。
- **40–80：**为练习页增加跳到正文、清晰焦点样式和状态消息。
- **80–110：**模拟 modal：打开、初始焦点、Tab 循环、Escape、焦点返回。
- **110–120：**写一份键盘测试清单。

### 焦点原则

- 正常页面优先使用 DOM 顺序，不用正数 `tabindex` 重排；
- 动态错误出现后，只有在能帮助恢复时才移动焦点；
- modal 关闭后，把焦点还给触发按钮；
- 保存成功等非阻塞消息使用合适的 live region；
- focus ring 是导航信息，不应因视觉偏好被移除。

### 独立任务

仅用 Tab、Shift+Tab、Enter、Space、Escape 完成：打开表单 → 触发错误 → 修复 →
提交 → 关闭成功提示。记录每一步当前焦点元素。

### 当日验收

- [ ] 页面不需要鼠标也能完成核心任务。
- [ ] 焦点不会进入隐藏区域。
- [ ] 状态变化既有视觉反馈，也有程序可感知反馈。
- [ ] 支持 `prefers-reduced-motion` 的用户不会被强制动画干扰。

---

## Day 13：构建无框架 Issue 创建页 {#day-13}

### 120 分钟任务

- **0–10：**列出页面 Contract：字段、状态、失败和成功。
- **10–25：**画语义结构与焦点流程。
- **25–80：**独立实现 HTML 和少量原生 JavaScript，不复制当天示例。
- **80–105：**用键盘、FormData、非法输入和模拟失败验收。
- **105–120：**对照 IssueFlow 的真实 IssueForm，记录框架解决和未解决的问题。

### 必须包含

- 页面标题、返回链接和主内容 landmark；
- title、description、priority、status、assignee、due date；
- 字段帮助文字、错误摘要和字段错误；
- submitting、success、failure 三种可感知状态；
- 取消动作和提交动作语义正确；
- 提交后输出结构化对象，但不调用真实 API。

### 禁止

- 用 `div onclick` 代替 button；
- 用 placeholder 代替 label；
- 用 `innerHTML` 拼接用户输入；
- 用颜色作为唯一状态；
- 失败后重置所有字段。

### 当日验收

- [ ] 关闭 CSS 后，内容和操作顺序仍合理。
- [ ] 仅用键盘可完成提交与错误恢复。
- [ ] 输出对象字段与表单 name 对齐。
- [ ] 能指出哪些规则仍必须由服务端验证。

---

## Day 14：语义与无障碍周测 {#day-14}

### 120 分钟任务

- **0–20：**闭卷解释 landmark、heading、accessible name、focus、validation。
- **20–50：**审计昨天的页面，列出至少 10 个检查项。
- **50–85：**与 IssueFlow 一个真实表单对照，记录三项优点和三项改进建议。
- **85–105：**修复最高优先级问题并复测。
- **105–120：**整理周交付物和补救计划。

### 闭卷独立任务

关闭前六天的步骤说明，从一个空 HTML 文件开始重建最小 Issue 新建页。页面必须包含跳到
主内容链接、页面标题、表单说明、title/description/priority/due date 字段、Save 与 Cancel，
以及可聚焦的错误摘要。不得复制昨天的 DOM；完成后才与旧版本 diff，说明遗漏来自哪个心智
模型，而不是只补标签。

在 30 分钟内完成可用版本，随后用 15 分钟只靠键盘完成：进入页面、跳过导航、填写、制造
两个错误、从摘要回到字段、修复、提交和取消。剩余时间按 120 分钟表完成真实项目对照和
最高优先级修复。

### 故障卡与审计方法

随机抽取至少三张故障卡，在 DevTools 中制造后再定位：

- `label for` 指向不存在的 id；
- 两个输入使用重复 id；
- Save 没写 `type="submit"`，或 Cancel 意外提交表单；
- 错误元素 id 与 `aria-describedby` 拼写不同；
- 把执行动作的 button 换成可点击 div；
- 删除页面唯一 `h1` 或跳过标题层级；
- 将焦点样式完全移除；
- 错误只用颜色表达。

检查顺序固定为：文档结构 → 控件名称 → 键盘顺序 → 表单与错误关系 → 动态焦点 → 失败恢复。
先在 Elements/Accessibility 中找到证据，再改源码；不要靠添加 ARIA 掩盖错误的原生元素。

### 验收证据

- 空文件重建后的 HTML 和与旧版本的差异说明；
- 至少 10 项审计表，每项有 pass/fail、DOM 证据和修复位置；
- 三张故障卡的“症状 → 定位 → 修复 → 复测”记录；
- 完整键盘路径与每次焦点位置；
- 一个修复前失败、修复后通过的自动断言或可重复手工步骤。

### 周交付物

`week-02-semantic-form.md`：

- 页面信息架构；
- link/button 与表单元素决策表；
- 输入 Contract；
- 三层校验矩阵；
- 键盘操作记录；
- 修复前后对比；
- 仍未解决的问题。

### 通过标准

- 语义结构检查至少 9/10；
- 核心流程不使用鼠标即可完成；
- 每个错误都能定位到字段并保留合法输入；
- 能解释客户端校验为什么不能替代服务端；
- 未通过时重做 Day 10、11、12 的独立任务。

[上一周：环境与 Web 地图](week-01-foundations.md) ·
[下一周：CSS 与响应式](week-03-css-responsive.md) ·
[返回课程总览](./)
