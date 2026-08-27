# 第 9 周：Router、URL、认证、表单与无障碍

本周把前八周学到的 React、类型和浏览器知识组合成一条可分享、可恢复、可用键盘完成的
用户流程。重点不是“页面能跳转”，而是 URL、历史记录、会话恢复、表单错误和焦点都能被
明确解释与测试。

## 本周成果

- 区分框架页面入口、React Router 页面路由和服务端 API 路由；
- 使用 path、search params 和 history 表达可分享状态；
- 验证动态参数，不向 API 发送 `NaN`、负数或超安全整数 ID；
- 理解前端受保护路由与服务端授权的边界；
- 完成保留输入、聚焦首错、阻止重复提交的 React 表单；
- 验证 Modal、Toast、移动抽屉和 Board 的完整键盘行为。

配套教材：[路由、URL 状态与认证](../learning/07-routing-url-and-auth.md)、
[表单、复杂交互与可访问性](../learning/09-forms-interactions-and-a11y.md)和
[源码追踪路线](../reference/source-traces.md)。

本周持续交付一个学习分支上的 `/settings/learning` 嵌套路由。它不接触真实凭据，
只用于练习路由、URL 表单状态、焦点和测试；完成学习后可以保留为课程页，也可以撤销。

---

## Day 57：画出两层页面路由与一层 API 路由

### 120 分钟任务

- **0–15：**不看源码，画出访问 `/issues/248` 后可能经过的三种“路由”。
- **15–40：**精读双层路由章节，给 Document 导航、客户端导航和 API 请求各写定义。
- **40–80：**从 `frontend/app` 追到 `IssueFlowApp.tsx`，再从 Screen 追到 `/api/issues/248`。
- **80–110：**为 `/settings/learning` 建立惰性加载 Screen、父级 Settings 导航和 Not Found 行为。
- **110–120：**保存路由树、相关文件路径、运行截图和一次测试结果。

### 概念与源码追踪

依次打开：

1. `frontend/app/page.tsx` 与 `frontend/app/[...path]/page.tsx`；
2. `frontend/src/app/IssueFlowApp.tsx`；
3. Settings 父布局及其 `Outlet`；
4. 任意 `frontend/app/api/**/route.ts`；
5. `frontend/src/api/issueflowApi.ts`。

在笔记中为每层填写“输入、输出、是否渲染 UI、运行位置”。不要把 React Router 的
`Route` 叫作服务端 Endpoint，也不要把 Route Handler 叫作页面组件。

### 实验

打开 DevTools Network，比较三次进入详情页：

1. 从列表点击链接；
2. 在详情页直接刷新；
3. 把详情 URL 粘贴到新标签页。

记录每次是否出现新的 Document 请求、何时加载 lazy chunk、何时发送 Issue API 请求。
用 Slow 3G 暂时观察路由级 fallback 与数据级 loading，完成记录后恢复网络设置。

### 独立任务

在学习分支添加 `/settings/learning`：

- 页面必须作为 Settings 的嵌套子路由，通过 `Outlet` 显示；
- Settings 导航出现可访问名称为“Learning”的链接；
- 当前项具有可感知的 active 状态；
- 直接刷新和新标签打开都能显示同一页面；
- 未知 `/settings/not-real` 不能静默显示另一个页面。

先写路由行为测试，再补最小页面，不在父布局复制第二份 Settings 导航。

### 当日证据

- 三层路由职责表和路由树；
- 三种导航方式的 Network 对照；
- `/settings/learning` 的最小 Git diff；
- 路由测试输出及页面截图。

### 当日验收

- [ ] 能解释客户端 Link 为什么通常不重新下载 Document。
- [ ] 能区分 lazy chunk loading 与 Query loading。
- [ ] 新子页复用 Settings Layout，而不是复制导航。
- [ ] 刷新深链接不会回到首页或产生 404。

---

## Day 58：让 URL 成为筛选状态的单一来源

### 120 分钟任务

- **0–15：**列出哪些页面状态应放 URL，哪些应留在 React State。
- **15–40：**学习 path params、search params、fragment、push、replace 和历史栈。
- **40–80：**追踪 `IssuesPage.tsx` 从 URL 解析 search/status/sort/page 的全过程。
- **80–110：**为学习页增加 `?focus=router|forms|keyboard`，实现解析、规范化和历史行为。
- **110–120：**用复制 URL、刷新、后退、前进四种方式保存证据。

### 概念与源码追踪

在 `IssuesPage.tsx` 中找出：

- 默认值何时从 URL 省略；
- 修改筛选后 page 如何复位；
- 搜索输入是否 debounce；
- 未知 status、sort 和负页码如何处理；
- 多个参数更新时是否丢失其他参数。

写一张决策表：可分享且决定资源视图的状态优先放 URL；只影响临时交互的输入、Modal
开关和焦点留在组件；服务端数据不复制进 URL 或普通 State。

### 实验

在 Issues 页面执行并记录：

```text
?status=open&page=2
?status=unknown&page=-1
?search=A%26B%2BC
?sortDirection=DESC
```

观察页面、规范化后的 URL、Network 查询参数和后退按钮。说明“回退默认值”与“向服务器
发送非法查询”哪一步发生；不要只写“页面正常”。

### 独立任务

为 `/settings/learning` 增加一个 Focus select：

- `focus` 仅接受 `router`、`forms`、`keyboard`；
- DOM 的 `select.value` 先经过 guard，不使用 `as FocusArea`；
- 默认 `router` 从 URL 省略；
- 明确选择时使用 push，高频文本输入使用 replace 或 debounce；
- 非法值规范化为默认值，并保留其他合法参数。

为合法值、非法值、刷新恢复和后退恢复各写一条测试。

### 当日证据

- 状态所有权决策表；
- 四个非法/边界 URL 的实际结果；
- guard、URL 更新与测试的 Git diff；
- 浏览器历史恢复录屏或逐步截图。

### 当日验收

- [ ] 复制 URL 到新标签能恢复同一 Focus。
- [ ] 未知值不会通过断言进入领域状态。
- [ ] 更新一个参数不会意外删除其他参数。
- [ ] 能解释何时使用 push、replace 和 debounce。

---

## Day 59：验证动态参数、会话恢复与返回路径

### 120 分钟任务

- **0–15：**写出 URL 中一个 Issue ID 的六种非法形式。
- **15–40：**学习 `useParams`、条件 Query、Auth `ready`、ProtectedRoute 和 return target。
- **40–80：**追踪未登录打开详情页到登录后返回原路径的调用链。
- **80–110：**为非法 ID 与登录返回路径补测试，并尝试常见 open redirect 输入。
- **110–120：**整理 URL 输入和安全边界表。

### 参数边界

至少验证：缺失、`not-a-number`、0、负数、小数、超安全整数和合法正整数。转换后的 number
仍需同时满足 `Number.isSafeInteger(id)` 与 `id > 0`。只有合法 ID 才允许 Query
`enabled: true`。

使用 Network 证明非法输入不会请求：

```text
/issues/not-a-number
/issues/0
/issues/1.5
/issues/9007199254740992
```

### 认证源码追踪

按顺序记录：

```text
URL
  → ProtectedRoute
  → AuthProvider.restoreSession
  → ready/session 分支
  → LoginPage
  → issueflowApi.login
  → 返回原 path + search
```

明确三件事：`ready=false` 不等于未登录；客户端重定向不是 HTTP 401；真正的写操作授权
必须发生在服务器端。

### 独立任务

建立路由矩阵测试：

- 未登录打开 `/issues/248?tab=activity`，登录后返回完整目标；
- 已登录打开 `/login`，进入 Dashboard；
- `/settings` 使用 replace 进入默认子页；
- 非法 Issue ID 不调用 API；
- 未知路径显示 Not Found；
- 若返回目标来自不可信字符串，拒绝 `//evil.example`、绝对 URL 和控制字符。

测试应断言 URL 和可见页面，不能只断言内部 navigate 函数被调用。

### 当日证据

- 七种 ID 输入的结果表；
- 登录恢复调用链；
- 路由矩阵测试输出；
- Network 中“非法 ID 零请求”的证据。

### 当日验收

- [ ] 不会因 `Number("abc")` 得到 NaN 后仍发请求。
- [ ] Session 恢复期间不闪现登录页。
- [ ] 登录返回保留 path 与 search。
- [ ] 能说明前端 ProtectedRoute 为什么不是授权边界。

---

## Day 60：构建保留输入并聚焦首错的 React 表单

### 120 分钟任务

- **0–15：**写出浏览器原生校验、客户端业务校验、服务端校验各自能保护什么。
- **15–40：**精读 `IssueForm.tsx` 的受控字段、验证、pending 与字段错误关系。
- **40–80：**运行空标题、超长标题、过去日期和重复标题四种失败实验。
- **80–110：**为 Learning 设置页实现受控表单、错误摘要和首错焦点。
- **110–120：**保存键盘操作、DOM 属性和组件测试证据。

### 源码追踪

从 `IssueFormPage.tsx` 追到：

```text
controlled input
  → validateIssue
  → mutation
  → POST/PATCH
  → ApiError.errors
  → field errors
  → focus first invalid field
```

在 Elements 中确认 label 的 `for`、控件 id、`aria-invalid`、`aria-describedby` 和错误文本
id 实际匹配。不要因为 JSX 中写过属性就假定最终 DOM 正确。

### 独立任务

在 `/settings/learning` 表单加入：

- 每日目标分钟数，必须是 30–240 的整数；
- Focus select，必须通过 Day 58 的 guard；
- 可选备注，最多 200 字符；
- Save pending 时防重复提交；
- 失败保留所有输入并聚焦第一个错误字段；
- 字段错误使用文字，不只靠红色；
- 成功后出现可访问的确认消息。

用一个可控的 Promise 模拟保存，不需要新增后端。组件测试覆盖连续点击 Save 只触发一次、
失败后保留输入、修复后清除错误关系。

### 当日证据

- 客户端/服务端校验分工表；
- 四种 IssueForm 失败的截图或测试记录；
- Learning 表单实现 diff；
- 首错焦点与防重复提交测试输出。

### 当日验收

- [ ] 每个字段都有可访问名称。
- [ ] 空提交后焦点到第一个无效字段。
- [ ] 服务端式失败不会清空用户输入。
- [ ] pending 不仅改变颜色，还改变可交互行为和可见文字。

---

## Day 61：完成 Modal、Toast 与焦点生命周期

### 120 分钟任务

- **0–15：**不看源码写出一个合格 Modal 从打开到关闭的全部焦点步骤。
- **15–40：**学习 dialog 命名、focus trap、Escape、焦点归还与 `aria-live`。
- **40–80：**追踪 `ui.tsx` Modal 和 `AppProviders.tsx` Toast 的真实实现。
- **80–110：**为 Learning 表单增加 Reset 确认 Modal 和保存/失败 Toast 测试。
- **110–120：**仅用键盘重复完整流程并记录焦点顺序。

### Modal 实验

从触发按钮开始逐项记录：

1. 打开前焦点在哪；
2. 打开后第一个焦点在哪；
3. Tab 与 Shift+Tab 是否留在 dialog；
4. Escape、Cancel、确认分别如何关闭；
5. pending 时是否允许关闭；
6. 关闭后是否回到原触发按钮；
7. 背景元素是否仍能被错误操作。

检查实际 DOM 的 `role="dialog"`、`aria-modal`、标题与描述关联。

### 独立任务

给 Learning 设置页增加 Reset：点击后打开复用的 Modal，确认才恢复默认值并规范化 URL。
成功和失败消息通过现有 Toast Provider 发布。测试至少覆盖：

- dialog 有可访问标题；
- Tab 正向、反向循环；
- Escape 关闭并归还焦点；
- 确认 reset 后 URL 与字段一致；
- Toast 的消息不是只靠颜色，并进入 live region；
- pending 时行为符合你写下的明确策略。

### 当日证据

- 焦点生命周期表；
- Accessibility Tree 中 dialog 名称截图；
- Modal 与 Toast 组件测试输出；
- 关闭前后 `document.activeElement` 的断言。

### 当日验收

- [ ] Modal 不是只有视觉遮罩的普通 div。
- [ ] 正向和反向 Tab 都无法逃到背景。
- [ ] 关闭后焦点返回触发器。
- [ ] 字段错误不只通过短暂 Toast 呈现。

---

## Day 62：让复杂交互在键盘、窄屏和减少动态效果下可用

### 120 分钟任务

- **0–15：**列出拖放、移动抽屉和动画对不同用户可能造成的障碍。
- **15–40：**学习键盘替代、`aria-expanded`、触控目标、对比度和 reduced motion。
- **40–80：**审计 `BoardPage.tsx` 与 `AppLayout.tsx` 的状态选择和移动抽屉。
- **80–110：**在 390/768/1024/1440px 完成键盘流程并修复一个可复现缺陷。
- **110–120：**整理视口、主题、焦点和 motion 证据矩阵。

### 必做流程

不使用鼠标：

1. 登录；
2. 打开移动导航并进入 Issues；
3. 搜索、筛选和排序；
4. 新建 Issue 并修复一次表单错误；
5. 在 Board 使用 status select 把 Issue 改为 Resolved；
6. 打开详情与删除确认 Modal；
7. 取消并确认焦点归还；
8. 登出。

同时检查抽屉按钮的 `aria-expanded`/`aria-controls`、导航后自动关闭、背景 Tab 边界、
Board 状态更改的 pending 和失败回滚。

### 独立任务

在系统或 DevTools 中启用 `prefers-reduced-motion: reduce`，比较 Modal、Toast、抽屉和
loading 反馈。若仓库仍缺少策略，写一个先失败的最小检查，再增加局部或全局规则；说明
为什么不能把所有持续时间简单设为 0 而导致状态反馈消失。

在四个视口和 light/dark 两主题复测 Learning 设置页。至少修复一个真实问题，例如焦点
被遮挡、按钮不可达、错误文字溢出或 focus ring 被裁切。

### 当日证据

- 完整键盘操作日志；
- 四视口 × 两主题矩阵；
- reduced-motion 前后证据；
- 一个“失败复现 → 最小测试 → 修复”的 Git diff。

### 当日验收

- [ ] Board 无需拖放也能完成相同状态变更。
- [ ] 移动抽屉的展开状态和控制目标可被辅助技术识别。
- [ ] 390px 不存在阻断任务的横向裁切。
- [ ] reduced motion 下 loading、成功和错误仍清楚可见。

---

## Day 63：交付可分享且键盘可用的完整流程

### 120 分钟任务

- **0–15：**闭卷画出 URL、Router、Auth、Form、Modal 和 Toast 的依赖图。
- **15–65：**不看逐步答案，完成 `/settings/learning` 的缺失行为并整理代码。
- **65–90：**运行路由、表单、焦点测试和一次关键浏览器流程。
- **90–108：**完成四视口、两主题、未登录、非法 URL 与失败保存验收。
- **108–120：**提交周交付说明、自评和未解决风险。

### 独立任务

关闭本周日课和自己的实现说明，从未登录的新浏览器上下文开始，独立完成：登录后进入
`/settings/learning`、通过 URL 恢复 Focus、制造并修复一次表单错误、保存、打开 Reset
Modal、取消、再次确认重置、后退恢复前一 URL，最后登出。全过程不得使用鼠标；记录每次
URL、焦点和可见状态。中途失败时先写出假设和证据，再回看相应日课。

### 可运行交付物

`/settings/learning` 必须具备：

- Settings 嵌套路由、导航当前项和可刷新深链接；
- `focus` 查询参数的 guard、默认省略、复制与历史恢复；
- 每日分钟、Focus、备注三个受控字段；
- 字段化错误、首错焦点、保留输入和 pending 防重入；
- Reset 确认 Modal、保存/错误 Toast；
- 键盘、窄屏、双主题和 reduced-motion 行为；
- 路由、组件、焦点测试及一条浏览器关键流程。

### 周交付证据

- 路由树和登录恢复调用链；
- URL/历史实验矩阵；
- 表单字段与错误 Contract 表；
- Modal 焦点生命周期；
- 四视口 × 两主题检查；
- 测试命令、通过输出和关键 Git diff；
- 一个仍存在的风险及下一步验证方法。

### 严格通过标准

- 闭卷依赖图不得把客户端 redirect 当成 HTTP 授权；
- 直接访问、刷新、复制、后退和前进均恢复正确页面状态；
- 非法 path/query 不发无意义请求，也不通过断言伪装成合法类型；
- 空提交聚焦首错，失败保留输入，连续提交不会产生重复保存；
- Modal 正反向 Tab、Escape 和焦点归还均有自动化证据；
- 只用键盘可完成登录、导航、编辑、重置和登出；
- 390、768、1024、1440px 与 light/dark 均无阻断问题；
- 相关测试、`npm run typecheck`、`npm run lint` 通过；
- 任一关键项失败，都不能进入第 10 周，应回到对应日课修复并重测。

[上一周：React 组件、状态与 Effect](week-08-react-typescript.md) ·
[下一周：Query 与服务端状态](week-10-query-server-state.md) ·
[返回课程总览](./)
