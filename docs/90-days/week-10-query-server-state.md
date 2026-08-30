# 第 10 周：TanStack Query、缓存与服务端状态

本周学习“服务器拥有、浏览器缓存”的数据怎样进入 React。你会用 Network、源码和测试
证明 query key、fresh/stale、分页、Mutation、失效、乐观更新与回滚的行为，而不是把
TanStack Query 当成会自动保持一切一致的黑盒。

## 本周成果

- 区分 React UI State、URL State、Session 和 Query Cache；
- 为列表、详情、Board、评论和附件设计稳定缓存身份；
- 观察 fresh、stale、background fetching 与 cache removal 的差异；
- 隔离普通分页和 Infinite Query 的不同数据形状；
- 完成 Mutation 的成功、失败、取消、失效与重试闭环；
- 在跨列表、详情和 Board 的乐观更新失败后完整回滚；
- 交付统一的 Issue Query Key Factory 与回归测试。

配套教材：[服务端状态与 API](../learning/08-server-state-and-api.md)和
[源码追踪路线](../reference/source-traces.md)中的 Issue 列表、乐观更新、详情路线。

::: warning 实验数据
失败、延迟与并发实验优先使用测试替身或 local 模式。不要为了制造 500 修改共享数据库，
也不要让教学测试依赖固定 `sleep`。
:::

---

## Day 64：区分 UI State、URL State 与 Server State {#day-64}

### 120 分钟任务

- **0–15：**把 Issues 页能看到的状态按“谁拥有”分类，不打开源码。
- **15–40：**学习服务端状态为何会过期、共享、失败并被其他请求修改。
- **40–80：**审计 `IssuesPage.tsx`、`IssueDetailPage.tsx` 和 `AppProviders.tsx` 的状态来源。
- **80–110：**删除一个仅为同步而存在的重复状态，或写测试证明当前分类合理。
- **110–120：**提交状态所有权表和一次渲染/请求时间线。

### 状态所有权审计

至少为这些值填写“来源、所有者、生命周期、更新方式、可否分享”：

| 值                   | 候选所有者                    |
| -------------------- | ----------------------------- |
| 搜索与筛选           | URL                           |
| Issue 列表           | Query Cache                   |
| 当前输入文字         | 最近的表单组件                |
| 当前用户             | Auth Provider + 服务端会话    |
| 主题偏好             | Theme Provider + localStorage |
| 删除 Modal 开关      | 触发它的页面或组件            |
| 从 issues 计算的数量 | 渲染时派生                    |

在 React DevTools 或临时日志中观察：输入框变化、URL 变化、Query 返回和 Modal 打开分别
触发哪些渲染。日志实验完成后撤销，不把调试输出提交到产品代码。

### 源码追踪

选择列表加载，写出完整链：

```text
URL query
  → parsed IssueQuery
  → queryKey
  → queryFn
  → issueflowApi.listIssues
  → HTTP/local adapter
  → PagedResult<Issue>
  → Query Cache
  → table/mobile cards
```

给每一层写清输入、输出与失败。特别说明 Query Cache 是远端数据副本，不是数据库。

### 独立任务

在 `IssueFormPage`、`IssuesPage`、`IssueDetailPage` 中各找一项 State 或派生值，判断是否
属于正确所有者。选择一项完成最小重构，或如果都合理，补一条行为测试证明它无需复制进
另一个 State。不能用“为了性能”作为没有测量的理由。

### 当日证据

- 至少 10 行状态所有权表；
- 一条 URL 到 DOM 的数据链；
- 一次重构 diff 或防回归测试；
- 操作前后请求次数和渲染观察。

### 当日验收

- [ ] 不把 Query data 再复制进 `useState` 后手工同步。
- [ ] 可分享筛选仍由 URL 拥有。
- [ ] 派生数据没有自己的写入入口。
- [ ] 能解释 Query Cache 与数据库事实的区别。

---

## Day 65：设计稳定 Query Key 与条件查询 {#day-65}

### 120 分钟任务

- **0–15：**预测缺少 page/status 的 key 会造成什么可见错误。
- **15–40：**学习 query key 的身份语义、结构化输入、规范化和 `enabled`。
- **40–80：**搜索项目所有 `queryKey`、`invalidateQueries`、`setQueryData` 和 `setQueriesData`。
- **80–110：**写 key inventory，并为详情 ID 和列表查询补身份测试。
- **110–120：**记录一个“相同数据同 key、不同数据不同 key”的证明。

### Key Inventory

使用 `rg` 搜索而不是凭记忆：

```powershell
rg -n "queryKey|invalidateQueries|setQueryData|setQueriesData" frontend/src
```

为每个 key 填写：

| 消费者 | 当前 key   | 决定数据的输入          | 返回 shape         | 谁会失效它 |
| ------ | ---------- | ----------------------- | ------------------ | ---------- |
| 列表   | 从源码填写 | page/search/filter/sort | PagedResult        | 从源码填写 |
| Stream | 从源码填写 | query + pages           | InfiniteData       | 从源码填写 |
| Board  | 从源码填写 | board scope             | Issue[]/实际 shape | 从源码填写 |
| 详情   | 从源码填写 | id                      | Issue              | 从源码填写 |

不能仅因数组文字“看起来不同”就认为安全；要验证所有数据身份输入都进入 key，且同一数据
不会因默认值表现不同生成无意义的两个缓存。

### 条件 Query 实验

对 `/issues/not-a-number`、`/issues/0`、`/issues/1.5` 和合法 ID 观察 Network。先解析并
验证 ID，再把合法性传给 `enabled`。不要让 `queryFn` 收到 NaN 后才抛错。

### 独立任务

只设计并测试 Query Key Factory 的接口，今天先不全量替换：

```ts
const issueKeys = {
  all: ["issues"] as const,
  lists: () => [...issueKeys.all, "list"] as const,
  list: (query: NormalizedIssueQuery) => [...issueKeys.lists(), query] as const,
  board: () => [...issueKeys.all, "board"] as const,
  detail: (id: number) => [...issueKeys.all, "detail", id] as const,
};
```

根据真实源码调整 shape。测试至少证明：默认值规范化前后是否应该同 key、page 变化必然
不同 key、status 变化必然不同 key、list 与 board/detail 不碰撞。

### 当日证据

- 完整 key inventory；
- 非法 ID 零请求的 Network 或 mock 调用证据；
- Factory 接口草案和身份测试；
- 一个当前 key 风险或确认无风险的解释。

### 当日验收

- [ ] 相同 key 只代表相同数据和相同 shape。
- [ ] key 包含所有会改变响应的输入。
- [ ] 非法 ID 在请求前被拦截。
- [ ] 没有把每次新建的随机值或时间放进 key。

---

## Day 66：观察 Fresh、Stale、Fetching 与缓存回收 {#day-66}

### 120 分钟任务

- **0–15：**预测 fresh、stale、inactive、removed 四个词的差异。
- **15–40：**阅读全局 Query 配置，记录 staleTime、retry 和 refetch 触发条件。
- **40–80：**完成 0 秒、20 秒、超过 30 秒的导航时间实验。
- **80–110：**用可控测试验证首次 loading 与后台 fetching 的不同 UI。
- **110–120：**整理时间线、Network 请求数和错误预测。

### 时间实验

先记录 `AppProviders.tsx` 的真实配置，不要套用网上默认值。清空 Network 后执行：

1. 打开 Issues 列表，记录首次 pending；
2. 立即离开再返回；
3. 等约 20 秒再离开返回；
4. 超过项目 staleTime 后再返回；
5. 让页面失去焦点再回来；
6. 手工触发一次 mutation/invalidation。

每次记录：旧数据是否仍显示、是否出现全屏 loading、是否后台 fetching、是否发请求、请求
失败时保留什么。等待时间只用于观察真实配置；120 分钟内其他部分必须是主动实验和测试。

### 概念边界

- stale 不等于删除；
- fetching 不等于没有 data；
- inactive 不等于已回收；
- invalidate 不等于立刻清空 UI；
- retry 会影响看到错误的时间，但不能修复无效 Contract。

### 独立任务

为一个已有 Query 写可控 deferred Promise 测试：首次进入显示 loading；已有数据时触发
refetch，应保留内容并显示非阻塞刷新提示；失败后保留或替换旧数据的策略必须有明确断言。
测试通过 Promise resolve/reject 推进，不使用固定毫秒 sleep。

### 当日证据

- 配置值与触发条件表；
- 至少四次导航的时间/请求矩阵；
- 首次 loading 与 background fetching 测试；
- 一个与初始预测不同的结果及原因。

### 当日验收

- [ ] 能解释 stale 数据为什么仍可显示。
- [ ] 后台刷新不会把已有内容替换成空白全屏 loading。
- [ ] 测试不依赖真实 30 秒等待。
- [ ] 能指出实际 refetch 是由哪个触发条件造成。

---

## Day 67：隔离分页与 Infinite Query 的数据形状 {#day-67}

### 120 分钟任务

- **0–15：**画出 `PagedResult<Issue>` 与 `InfiniteData<PagedResult<Issue>>` 的 shape。
- **15–40：**学习稳定分页、pageParam、next page、total 与 view 切换。
- **40–80：**追踪 Issues 普通分页和 stream 模式的 key、queryFn 与渲染路径。
- **80–110：**完成翻页、切换 view、筛选复位和最后一页边界测试。
- **110–120：**提交缓存 shape 图与请求序列。

### 源码与实验

从 URL 的 page/view 参数开始，追踪：

```text
普通分页：query → GET page N → PagedResult
stream：initialPageParam → pages[] → getNextPageParam → flattened items
```

在 Network 中执行：

- page 1 → page 2 → 后退；
- table → stream → table；
- 已在 page 3 时改变 status；
- 加载最后一页后再次请求；
- 连续快速点击 Load more。

检查是否重复、遗漏、错误复用缓存或重复请求。稳定分页还依赖服务端唯一 tie-break，不能只靠
前端去重掩盖后端排序问题。

### 独立任务

写测试证明：

1. 普通列表和 Infinite 列表不共享不兼容 shape；
2. 筛选变化后 page 回到 1，旧筛选数据不冒充新结果；
3. `getNextPageParam` 在最后一页返回停止信号；
4. 多页合并保持服务器顺序；
5. 同一个 Issue 不因错误页参数被重复追加。

测试 fixture 至少包含相同主排序值的记录，以暴露不稳定排序。

### 当日证据

- 两种缓存 shape 图；
- 五种浏览器操作的请求序列；
- 分页/Infinite 边界测试输出；
- 一个服务端稳定排序依赖说明。

### 当日验收

- [ ] 不给 `PagedResult` 和 `InfiniteData` 使用同一个 key。
- [ ] filter 变化后页码和结果同步变化。
- [ ] 最后一页不继续无界请求。
- [ ] 能解释 total、page、pageSize 都是 Contract 的一部分。

---

## Day 68：完成 Mutation、失效与结构化错误闭环 {#day-68}

### 120 分钟任务

- **0–15：**按顺序写出 Mutation 的五个生命周期阶段。
- **15–40：**学习 mutationFn、onMutate、onError、onSuccess、onSettled 的职责。
- **40–80：**追踪创建、编辑、评论中各一条 Mutation 到 ApiError 和 cache 更新。
- **80–110：**为 400、401、404、409、500 与网络失败建立 UI 行为测试。
- **110–120：**整理错误放在字段、页面或 Toast 的决策表。

### 源码追踪

选择 `IssueFormPage` 的保存操作，逐层记录：

```text
submit
  → client validation
  → mutationFn
  → issueflowApi.create/updateIssue
  → HTTP success / Problem Details / network failure
  → cache set/invalidate
  → navigate / field errors / toast
```

对每次 `invalidateQueries` 问：它要重新确认哪份服务端事实？对每次 `setQueryData` 问：
写入的数据是服务器确认结果，还是客户端预测？不要用“全部 invalidate”代替理解影响范围。

### 独立任务

用 mock API 为表单或评论 Mutation 覆盖：

- 400 且带 fields：显示字段错误并聚焦；
- 401：显示会话相关反馈，不伪装为字段错误；
- 404：资源已不存在；
- 409：保留输入并解释冲突；
- 500：提供重试路径；
- 网络失败：没有 HTTP status，当前页面不丢失。

断言用户可见结果和相关 Query 是否失效，不直接断言 TanStack Query 私有内部实现。

### 当日证据

- 保存操作全链路；
- status → 呈现位置决策表；
- 六类失败的组件测试；
- 每个 cache 写入/失效的业务理由。

### 当日验收

- [ ] 400/409 的字段信息不会只显示成通用 Toast。
- [ ] 网络失败与 HTTP 500 被区分。
- [ ] Mutation 成功后相关页面最终看到服务器事实。
- [ ] 不通过解析任意错误字符串判断后端类型。

---

## Day 69：实现跨视图乐观更新、失败回滚与并发实验 {#day-69}

### 120 分钟任务

- **0–15：**不看文档写出 `cancel → snapshot → write → rollback/invalidate` 流程。
- **15–40：**精读列表与 Board 的 onMutate/onError/onSettled 实现。
- **40–80：**让 PATCH 可控地返回 500，观察列表、Board、详情和 Toast。
- **80–110：**制造 A→B、B→C 两次 mutation 的乱序完成，选择并实现安全策略。
- **110–120：**画时间线并记录策略边界。

### 失败回滚实验

以 Open → Resolved 为例，测试必须按可观察顺序证明：

1. 请求完成前卡片临时进入 Resolved；
2. 当前相关查询已取消，保存了哪些快照；
3. 500 后卡片返回 Open；
4. 列表、Board 和详情没有互相矛盾；
5. 错误 Toast 出现；
6. 最终失效或 refetch 与服务器重新同步。

快照必须保持原数据，不得在乐观写入时原地修改快照引用。

### 并发实验

构造：

```text
Mutation A: open → in_progress，最后失败
Mutation B: in_progress → resolved，先成功
```

观察 A 的旧快照回滚是否覆盖 B。选择一种适合当前项目的策略并写理由：序列化同一资源写入、
mutation token/version、只在仍匹配预测值时回滚，或失败后立即以服务器 refetch 为准。
不需要堆叠复杂抽象，但不能假装并发不存在。

### 独立任务

为 Board 或列表写一条真实组件/集成测试，使用 deferred Promise 精确控制两个请求完成顺序。
断言最终状态、Toast、失效范围和其他未修改 Issue 的引用/内容。

### 当日证据

- 乐观更新数据流图；
- 500 回滚逐帧断言；
- 两次 mutation 乱序时间线；
- 选定并发策略、实现 diff 和限制说明。

### 当日验收

- [ ] 乐观更新前先取消可能覆盖它的查询。
- [ ] 快照没有被后续写入修改。
- [ ] 失败回滚覆盖所有相关视图。
- [ ] 乱序请求不会静默留下错误最终状态。

---

## Day 70：交付统一 Query Key Factory 与服务端状态闭环 {#day-70}

### 120 分钟任务

- **0–15：**闭卷解释 key、fresh/stale、分页 shape、Mutation 和 rollback。
- **15–65：**根据 Day 65 inventory 完成 factory，并逐处迁移读取、写入和失效调用。
- **65–92：**运行 key、分页、错误和乐观回滚测试，修复影响范围遗漏。
- **92–108：**在浏览器完成列表 → 详情 → Board → 失败 → 恢复的 smoke test。
- **108–120：**整理周交付证据、自评和已知并发限制。

### 独立任务

关闭本周步骤说明，从空 Query Cache 开始独立演示：加载列表、切换筛选和分页、进入详情、
在 Board 发起一次成功状态更新，再用测试替身发起一次 500 和一次乱序并发更新。仅根据
Network、可见 UI 和测试失败定位遗漏，不直接改断言迁就实现。最终说明每一次请求使用的
key、缓存写入、失效和回滚路径。

### 可运行交付物

统一的 Issue Query Key Factory 必须：

- 为 all、lists、list、stream、board、detail、comments、attachments 提供明确层级；
- 把所有改变数据身份的输入纳入 key；
- 对默认 query 做一致规范化；
- 隔离普通分页和 InfiniteData shape；
- 让精准失效和全 Issue 范围失效都可表达；
- 替换当前相关 Screen 中散落的 key；
- 不改变已有 API Contract 或可见行为。

若真实项目结构不适合上述命名，可调整名称，但交付说明必须逐项证明同样能力。

### 周交付证据

- 重构前后的 key inventory；
- factory API 与设计理由；
- fresh/stale 时间实验矩阵；
- 普通/Infinite shape 图；
- 六类 Mutation 错误测试；
- 500 回滚和并发乱序测试；
- Network smoke test、Git diff 和质量命令输出。

### 严格通过标准

- 同一规范化 query 产生等价 key，不同 page/filter/sort 产生不同 key；
- list、stream、board、detail 不发生 shape 碰撞；
- 非法详情 ID 不执行 queryFn；
- 首次 loading 与 background fetching 有不同且可访问的表现；
- 分页/Infinite 在筛选变化、最后一页、快速加载下无重复或遗漏；
- 400/401/404/409/500/网络失败均有正确用户反馈；
- 500 后列表、Board、详情完整回滚，随后与服务器同步；
- 至少一个乱序并发用例有自动化测试和明确策略；
- 测试不使用固定 sleep，相关测试、`npm run typecheck`、`npm run lint` 通过；
- 任一一致性或回滚项失败，都不能进入第 11 周。

完成质量命令后，使用 [W10 阶段检查点](assessments.md#w10-检查点能否管理服务端状态与并发恢复)
和 [阅读清单迁移题](transfer-tasks.md#w10阅读清单-query) 验证你能否离开 IssueFlow 复现同样能力。

[上一周：Router、表单与无障碍](week-09-routing-forms-a11y.md) ·
[下一周：双后端与安全边界](week-11-backends-security.md) ·
[返回课程总览](./)
