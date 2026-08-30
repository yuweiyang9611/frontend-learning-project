# 第 8 周：React 与 TypeScript——组件、状态、Effect 和可测试交互

前两周已经能建立领域类型并保护运行时边界。本周把这些能力放进 React：Props 是组件
Contract，State 表达交互记忆，事件仍来自浏览器边界，Effect 只负责与外部系统同步。

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

### 完整 120 分钟

| 时间    | 活动                                               | 产物            |
| ------- | -------------------------------------------------- | --------------- |
| 0–15    | 预测 event.target 与 currentTarget 的差异          | 预测笔记        |
| 15–35   | 学习 ChangeEvent、FormEvent、KeyboardEvent         | 事件类型表      |
| 35–65   | 阅读 `IssueForm.change`、submit 与 select handlers | 边界追踪        |
| 65–85   | 用 Testing Library 输入标题、标签和非法状态        | 运行记录        |
| 85–110  | 独立替换一个 `as IssueStatus`                      | guard、组件测试 |
| 110–120 | 复盘浏览器校验与领域校验的关系                     | 说明段落        |

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

### 验收证据

- [ ] handler 使用 currentTarget。
- [ ] forged status 和 assignee 输入不会进入领域 state。
- [ ] onSubmit 只收到完成解析和校验的 IssueInput。
- [ ] 浏览器 required/maxLength 不被当作唯一业务保护。

---

## Day 53：异步 UI、错误状态与 Context Contract {#day-53}

### 今日目标

使用判别联合表达异步界面，并理解 Context 应共享能力而非收纳所有状态。

### 完整 120 分钟

| 时间    | 活动                                            | 产物           |
| ------- | ----------------------------------------------- | -------------- |
| 0–15    | 写出 loading/error/data booleans 的非法组合     | 状态反例       |
| 15–35   | 复习 RemoteData，学习 Context value 与 Provider | 状态树         |
| 35–65   | 阅读 AppProviders 的 Auth/Theme/Toast           | Context 职责表 |
| 65–85   | 为四种 RemoteData 渲染测试                      | 组件测试       |
| 85–110  | 独立设计 IssueEditorState 与 reducer            | 类型和转换函数 |
| 110–120 | 判断哪些状态不应放 Context                      | 复盘记录       |

### 示例与负例

```ts
type IssueEditorState =
  | { state: "editing"; value: IssueInput }
  | { state: "submitting"; value: IssueInput }
  | { state: "saved"; issue: Issue }
  | { state: "failed"; value: IssueInput; message: string };

// @ts-expect-error saved 状态必须携带服务器返回的 issue
const badState: IssueEditorState = { state: "saved" };
```

运行实验应验证 loading 显示、失败消息、成功内容和重试按钮，而不是断言某个 state variable 的值。

### 独立任务

设计 reducer action：edit-field、submit、resolve、reject、reset。使用 `assertNever` 检查遗漏。
说明何时继续使用多个简单 useState 会比 reducer 更清楚。

### 验收证据

- [ ] UI 状态不存在互相矛盾组合。
- [ ] reducer 的 state/action 都有穷尽检查。
- [ ] Context value 不包含高频变化的 Issue 列表。
- [ ] 测试从用户可见结果验证每个异步状态。

---

## Day 54：Effect、Ref、cleanup 与外部系统 {#day-54}

### 今日目标

只在需要同步浏览器或外部系统时使用 Effect，并保证 setup/cleanup 对称。

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

## Day 55：Typed API 状态、Mutation 与失败恢复 {#day-55}

### 今日目标

在组件层保持 API 数据、mutation 参数、乐观快照和错误类型一致，为第 10 周缓存深入学习打基础。

### 完整 120 分钟

| 时间    | 活动                                           | 产物         |
| ------- | ---------------------------------------------- | ------------ |
| 0–15    | 画 Board 状态更新的成功/失败时间线             | mutation 图  |
| 15–35   | 学习 query data、variables、context 的类型角色 | 三者对照     |
| 35–65   | 阅读 BoardPage 和 IssueDetailPage 的 mutation  | 缓存触点表   |
| 65–90   | 模拟 500，观察 optimistic update 与 rollback   | 可见行为记录 |
| 90–110  | 独立为 rollback context 写明确类型和测试       | 类型与测试   |
| 110–120 | 记录静态 cache 类型不能证明 response 的原因    | 复盘段落     |

### 类型化快照

```ts
type MoveIssueVariables = {
  issue: Issue;
  status: IssueStatus;
};

type MoveIssueContext = {
  previous: PagedResult<Issue> | undefined;
};
```

### 编译期负例与运行实验

```ts
// @ts-expect-error status 必须来自 IssueStatus
const variables: MoveIssueVariables = {
  issue: seedIssues[0],
  status: "blocked",
};
```

500 实验必须看到：卡片先进入新列、失败后回旧列、错误 Toast 出现、相关 query 被失效。
不要用固定 sleep，等待可见状态或请求 Promise。

### 独立任务

为详情页状态更新写一份失败测试，并列出需要同步的 list、board、detail cache。暂时不实现复杂
并发策略，但说明两个 mutation 交错时旧快照可能覆盖新成功值。

### 验收证据

- [ ] mutation variables 和 context 没有隐式 any。
- [ ] 500 测试包含 optimistic、rollback、toast、invalidate。
- [ ] 错误显示来自 ApiError/ContractError 的受控信息。
- [ ] 能说明缓存泛型与网络 decoder 是两层保护。

---

## Day 56：周项目——可测试的 Issue 功能切片 {#day-56}

### 今日目标

独立交付一个小型 React 功能，从领域类型、边界解析到可访问交互和失败测试全部闭环。

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

推荐切片：“在 Issue 详情中安全修改状态”。必须包含：

1. 最小 Props Contract；
2. DOM string 经 `isIssueStatus` 后进入 mutation；
3. pending 状态禁用重复提交；
4. success 显示确认；
5. 500 时 rollback 并显示错误；
6. forged `blocked` 不触发请求；
7. 键盘可操作且 label/accessible name 明确；
8. 至少一个编译期负例、一个 parser unit test、三个组件行为测试。

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

[上一周：运行时边界与 Wire Contract](week-07-typescript-runtime-contracts.md) ·
[下一周：Router、认证与可访问表单](week-09-routing-forms-a11y.md) ·
[返回课程总览](./)
