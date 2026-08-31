# 第 8 周：React 与 TypeScript——组件、状态、Effect 和可测试交互

前两周已经能建立领域类型并保护运行时边界。本周把这些能力放进 React：Props 是组件
Contract，State 表达交互记忆，事件仍来自浏览器边界，Effect 只负责与外部系统同步。

::: info 本周的学习坡度
Day 50–56 只完成“组件 → 本地状态 → DOM 边界 → 异步四态 → Effect → 普通异步保存”
这条链路。Context/reducer 只做识别，不作为本周必交；TanStack Query cache、乐观更新和
rollback 明确留到第 10 周。每天先在隔离 workbench 过关，再阅读 IssueFlow 真实源码。
:::

## 本周成果

- 为组件 Props、children、callback 和 DOM event 写准确类型；
- 根据状态真正所有者选择 Props、State、Context、URL 或服务端缓存；
- 用判别联合表达异步 UI，避免互相矛盾的 boolean；
- 写不依赖断言的受控表单和 select parser；
- 理解 Effect 的 setup/cleanup 与 Ref 的非渲染状态；
- 使用 Testing Library 从用户可见行为验证一个 Issue 功能切片。

配套阅读：[React 组件与状态](../learning/06-react-components-and-state.md)、
[TypeScript 模式手册](../typescript/07-pattern-cookbook.md)、
[TypeScript 练习题库](../typescript/08-exercise-bank.md)。

---

## Day 50：TSX、组件 Props 与最小依赖 {#day-50}

### 今日目标

把组件视为有输入 Contract 的函数，只要求真正需要的字段。

当天工作区：`npm run exercise:react -- 50`。初始失败是课程支架，不要修改测试绕过。

### 完整 120 分钟

| 时间    | 活动                                              | 产物         |
| ------- | ------------------------------------------------- | ------------ |
| 0–15    | 写出组件与普通函数的相同点和不同点                | 对照表       |
| 15–35   | 学习 JSX、Props、children、callback、ReactNode    | 概念笔记     |
| 35–65   | 阅读 `features/issues/components.tsx` 和 `ui.tsx` | Props 依赖图 |
| 65–85   | 写组件成功例和错误 props 负例                     | 类型实验     |
| 85–110  | 独立提取 `IssueHeading` 与 `StatusSummary`        | 组件和测试   |
| 110–120 | 检查组件是否依赖完整 Issue                        | 复盘记录     |

### Props Contract

```tsx
type IssueHeadingProps = Pick<Issue, "key" | "title" | "status">;

function IssueHeading({ key, title, status }: IssueHeadingProps) {
  return (
    <h2>
      {key} · {title} · {statusLabels[status]}
    </h2>
  );
}
```

若组件只显示三个字段，就不应接收完整 Issue。更小的 Contract 更容易复用、测试，也减少无关
领域字段变化带来的连锁修改。

### 编译期负例与运行实验

```tsx
// @ts-expect-error 缺少 status
<IssueHeading key="IF-1" title="Missing status" />;

// @ts-expect-error blocked 不是当前 IssueStatus
<IssueHeading key="IF-1" title="Invalid" status="blocked" />;
```

用 Testing Library 分别渲染最小 props 和从真实 seed Issue 取出的 props，断言可见 heading。

### 独立任务

提取一个 `MemberIdentity` 组件，只依赖显示姓名、initials 和可空 avatarUrl。明确图片加载失败
是否属于 Props Contract，还是组件内部运行行为。

### 验收证据

- [ ] 组件不接收未使用的完整实体。
- [ ] callback 参数和返回值有明确类型。
- [ ] 至少两个错误 props 被编译器拒绝。
- [ ] 测试断言用户可见文本或 accessible name，不读取组件内部变量。

---

## Day 51：State 推断、状态所有权与派生值 {#day-51}

### 今日目标

避免错误的初始值推断和重复状态，能说明每份 state 为什么存在于当前组件。

当天工作区：`npm run exercise:react -- 51`。

### 完整 120 分钟

| 时间    | 活动                                              | 产物          |
| ------- | ------------------------------------------------- | ------------- |
| 0–15    | 列出 IssueForm 和 Dashboard 的可见状态            | 状态清单      |
| 15–40   | 学习 `useState` 推断、functional update、派生值   | 所有权决策表  |
| 40–65   | 审计 IssueForm、DashboardPage、AppLayout 的 state | 源码批注      |
| 65–85   | 实验 null 初值、数组初值和 stale closure          | 编译/运行记录 |
| 85–110  | 独立删除一个可派生的重复 state 示例               | 重构与测试    |
| 110–120 | 写明 Props/State/Context/URL/Cache 的选择理由     | 决策日志      |

### 推断陷阱

```tsx
const [selected, setSelected] = useState<Issue | null>(null);

// 如果省略泛型，selected 只会被推断成 null
const [tooNarrow, setTooNarrow] = useState(null);

// @ts-expect-error setTooNarrow 当前只接受 null
setTooNarrow(seedIssues[0]);
```

空数组也可能推断得过窄。不要用随意断言修复，应给出准确元素类型或从已有 typed 数据初始化。

### 运行实验与独立任务

连续调用两次计数更新，比较 `setCount(count + 1)` 和 `setCount(current => current + 1)`。
随后从一组 issues 派生 open count、critical count 和最近更新时间，不再存三份额外 state。

### 验收证据

- [ ] 每个 state 都有唯一所有者和生命周期说明。
- [ ] 至少删除一个可以直接计算的重复 state 实验。
- [ ] functional update 测试证明连续更新不会丢失。
- [ ] 能解释 useMemo 是性能提示，不是状态正确性工具。

---

## Day 52：DOM 事件、受控表单与安全 select {#day-52}

### 今日目标

正确标注 form/input/select 事件，并把 DOM string 经过 parser/guard 后才写入领域 state。

当天工作区：`npm run exercise:react -- 52`。

### 完整 120 分钟

| 时间    | 活动                                               | 产物            |
| ------- | -------------------------------------------------- | --------------- |
| 0–15    | 预测 event.target 与 currentTarget 的差异          | 预测笔记        |
| 15–35   | 学习 ChangeEvent、FormEvent、KeyboardEvent         | 事件类型表      |
| 35–65   | 阅读 `IssueForm.change`、submit 与 select handlers | 边界追踪        |
| 65–85   | 用 Testing Library 输入标题、标签和非法状态        | 运行记录        |
| 85–100  | 独立替换一个 `as IssueStatus`                      | guard、组件测试 |
| 100–120 | 完成 React Day 52 工作台与 TypeScript 挑战 `C08`   | 两组运行证据    |

### 安全 handler

```tsx
function readStatus(raw: string): IssueStatus | null {
  return isIssueStatus(raw) ? raw : null;
}

<select
  value={value.status}
  onChange={(event) => {
    const next = readStatus(event.currentTarget.value);
    if (next) change("status", next);
  }}
/>;
```

### 编译期负例与运行实验

```ts
declare const event: React.ChangeEvent<HTMLSelectElement>;

// @ts-expect-error select.value 是 string，不是 IssueStatus
change("status", event.currentTarget.value);

// @ts-expect-error priority 不接收数字
change("priority", 3);
```

测试中向 select 触发 `{ target: { value: 'blocked' } }`。原来的断言写法可能让非法值进入
state；guard 版本必须保持原状态或显示明确错误。

### 独立任务

为 assigneeId 编写 parser：空字符串 → null，正 safe integer → number，0/负数/小数/普通文本
→ failure。把 parser 测试与组件测试分开。

挑战 `C08` 要把合法与伪造的 DOM string 都输入安全 select 状态转换；非法值必须保留旧状态，
并明确返回“不得提交请求”的结果。不要用 `as IssueStatus` 让测试假装输入可信。

### 验收证据

- [ ] handler 使用 currentTarget。
- [ ] forged status 和 assignee 输入不会进入领域 state。
- [ ] onSubmit 只收到完成解析和校验的 IssueInput。
- [ ] 浏览器 required/maxLength 不被当作唯一业务保护。

---

## Day 53：异步 UI、组件组合与状态提升 {#day-53}

### 今日目标

使用判别联合表达异步界面；通过组件组合和状态提升共享最小能力，不急于引入全局 Context。

当天工作区：`npm run exercise:react -- 53`。

### 完整 120 分钟

| 时间    | 活动                                            | 产物           |
| ------- | ----------------------------------------------- | -------------- |
| 0–15    | 写出 loading/error/data booleans 的非法组合     | 状态反例       |
| 15–35   | 复习 RemoteData，学习组合与状态提升             | 状态树         |
| 35–60   | 阅读一个页面的 loading/empty/error/success 分支 | 可见状态表     |
| 60–85   | 为四种 RemoteData 渲染和 retry 写行为测试       | 组件测试       |
| 85–110  | 独立拆分 RemoteIssuesPanel 并提升唯一共享 state | 组件与数据流图 |
| 110–120 | 判断 Props、children 或 Context 的最小选择      | 复盘记录       |

### 示例与负例

```ts
type RemoteIssues =
  | { state: "loading" }
  | { state: "empty" }
  | { state: "success"; issues: readonly IssuePreview[] }
  | { state: "error"; message: string; retry: () => void };

// @ts-expect-error success 状态必须携带已验证的 issues
const badState: RemoteIssues = { state: "success" };
```

运行实验应验证 loading 显示、失败消息、成功内容和重试按钮，而不是断言某个 state variable 的值。

### 独立任务

把四态渲染拆成纯显示组件，由父组件持有 state。失败分支必须通过 callback 重试，子组件
不能自行复制请求状态。写出“何时 Props/children 已足够，何时才值得 Context”的判断。

### 验收证据

- [ ] UI 状态不存在互相矛盾组合。
- [ ] switch 分支有穷尽检查。
- [ ] 共享状态只有一个所有者，没有父子两份副本。
- [ ] 测试从用户可见结果验证每个异步状态。

Context 和 reducer 会在学习者已经能维护局部数据流后再作为选型题出现，本周不要求为了
“使用高级 Hook”把简单状态改写成 reducer。

---

## Day 54：Effect、Ref、cleanup 与外部系统 {#day-54}

### 今日目标

只在需要同步浏览器或外部系统时使用 Effect，并保证 setup/cleanup 对称。

当天工作区：`npm run exercise:react -- 54`。

### 完整 120 分钟

| 时间    | 活动                                          | 产物       |
| ------- | --------------------------------------------- | ---------- |
| 0–15    | 对 8 个场景判断是否需要 Effect                | 判断表     |
| 15–40   | 学习 Effect 依赖、cleanup、Ref 和 Strict Mode | 生命周期图 |
| 40–70   | 阅读 AppProviders 主题 Effect、Modal 焦点逻辑 | 源码追踪   |
| 70–90   | 测试监听器注册/移除和焦点归还                 | 运行证据   |
| 90–110  | 独立实现 Escape 关闭或媒体查询同步            | 组件与测试 |
| 110–120 | 审计一个不必要 Effect                         | 重构建议   |

### 类型与资源清理

```tsx
const dialogRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [onClose]);
```

### 编译期负例与运行实验

```ts
const inputRef = useRef<HTMLInputElement>(null);

// @ts-expect-error current 在挂载前可能是 null
inputRef.current.focus();
```

运行中反复挂载/卸载组件，统计 listener 是否重复；打开 Modal 前保存焦点，关闭后验证焦点归还。

### 独立任务

选一个现有 Effect，回答“它在同步哪个外部系统”。若答不出，做一个实验版重构：改成派生值
或事件 handler，并用行为测试证明结果不变。

### 验收证据

- [ ] setup 与 cleanup 操作完全对称。
- [ ] Ref null 状态被正常处理，不用非空断言逃避。
- [ ] 测试验证 listener 数量或焦点，不测试 Hook 实现细节。
- [ ] 能解释开发环境重复执行如何暴露不纯逻辑。

---

## Day 55：Typed 异步保存、Pending 与失败恢复 {#day-55}

### 今日目标

先完成普通异步保存的 pending、success、error 与 retry，再为第 10 周 cache/乐观更新打基础。

当天工作区：`npm run exercise:react -- 55`。

### 完整 120 分钟

| 时间    | 活动                                      | 产物          |
| ------- | ----------------------------------------- | ------------- |
| 0–15    | 画点击保存到成功/失败的时间线             | 状态图        |
| 15–35   | 为 save callback、参数和错误结果写类型    | 函数 Contract |
| 35–60   | 阅读一个普通异步提交与 ApiError 显示路径  | 调用链        |
| 60–85   | 测试 pending 禁用、成功确认和失败恢复     | 可见行为记录  |
| 85–110  | 独立实现 SaveStatusButton，不进行乐观写入 | 组件与测试    |
| 110–120 | 解释为什么本周先等待服务器确认            | 复盘段落      |

### 类型化快照

```ts
type SaveStatus = (next: IssueStatus) => Promise<void>;

type SaveState =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved" }
  | { state: "error"; message: string };
```

### 编译期负例与运行实验

```ts
declare const saveStatus: SaveStatus;

// @ts-expect-error blocked 不是 IssueStatus
saveStatus("blocked");
```

失败实验必须看到：按钮从 pending 恢复可用、受控错误出现、原状态保持不变、可以再次提交。
不要用固定 sleep，等待可见状态或请求 Promise。本日不要求 cache snapshot、optimistic write
或 rollback；这些在 Day 68–69 用完整 Query 心智模型学习。

### 独立任务

为普通保存按钮写成功和失败测试。失败后再次点击并成功，证明组件不是进入永久 disabled。
最后列出如果未来加入乐观更新，还必须解决的 cache identity、rollback 和并发问题。

### 验收证据

- [ ] save 参数、返回 Promise 和错误状态没有隐式 any。
- [ ] 500 测试包含 pending、恢复可用、错误与重试成功。
- [ ] 错误显示来自 ApiError/ContractError 的受控信息。
- [ ] 能说明为什么乐观缓存需要额外快照和并发设计。

---

## Day 56：周项目——可测试的 Issue 功能切片 {#day-56}

### 今日目标

独立交付一个小型 React 功能，从领域类型、边界解析到可访问交互和失败测试全部闭环。

当天工作区：`npm run exercise:react -- 56`。

### 完整 120 分钟

| 时间    | 活动                                          | 产物       |
| ------- | --------------------------------------------- | ---------- |
| 0–15    | 选择切片并写用户可见验收标准                  | 功能范围   |
| 15–30   | 设计 Props、State、event parser、API Contract | 数据流图   |
| 30–75   | 独立实现组件和交互                            | 功能代码   |
| 75–100  | 写成功、非法输入和服务失败测试                | 组件测试集 |
| 100–112 | 运行 typecheck、Vitest 和适用 E2E             | 命令输出   |
| 112–120 | 复盘类型、运行时和可访问性证据                | 周总结     |

### 周交付物

推荐切片：“使用注入的 async save callback 安全修改状态”。本周先在隔离 workbench 完成，
不直接改 Query cache。必须包含：

1. 最小 Props Contract；
2. DOM string 经 `isIssueStatus` 后进入 mutation；
3. pending 状态禁用重复提交；
4. success 显示确认；
5. 500 时保持原值、恢复可用并显示错误；
6. forged `blocked` 不触发请求；
7. 键盘可操作且 label/accessible name 明确；
8. 至少一个编译期负例、一个 parser unit test、三个组件行为测试。

第 10 周再把同一组件接入 TanStack Query，并增加 optimistic、snapshot、rollback 和并发证据。

也可以选择评论新增或负责人选择，但不得同时扩大到多个页面。

### 过关标准

- [ ] Day 50～56 每天均有完整学习记录。
- [ ] 功能没有新增 `any`、非空断言或无证据的领域 cast。
- [ ] Props 使用最小所需 shape。
- [ ] State 没有可由现有值直接计算的重复副本。
- [ ] Effect 只用于明确的外部系统并有 cleanup。
- [ ] 正常、非法输入、异步失败都由可见行为测试覆盖。
- [ ] `npm run typecheck`、相关 Vitest 和目标 E2E 通过。

未过关时先缩小组件职责，不要通过把 Props/State 改成 object、string 或 any 消除诊断。

## 本周闭卷测验与口试

<ClientOnly>
  <WeeklyKnowledgeCheck :week="8" />
</ClientOnly>

[上一周：运行时边界与 Wire Contract](week-07-typescript-runtime-contracts.md) ·
[下一周：Router、认证与可访问表单](week-09-routing-forms-a11y.md) ·
[返回课程总览](./)
