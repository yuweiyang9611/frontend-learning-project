# 第 5 周：TypeScript 基础与 JavaScript 运行时

从本周开始进入四周 TypeScript 强化阶段。你已经学过 JavaScript，因此能清楚区分：
类型检查发生在开发阶段，真实浏览器输入仍需要运行时验证。

## 本周成果

- 解释 TypeScript 编译、推断、诊断、擦除与 strict 模式；
- 为函数、对象、数组、回调和异步结果写准确类型；
- 区分 optional、undefined、null 与缺失属性；
- 从常量派生 literal union，并用 satisfies 检查映射；
- 使用 unknown 和 honest guard 保护边界，拒绝 any 污染；
- 完成 TypeScript Lab 1～4 与至少 10 个编译期负例。

配套教材：[TypeScript 学习路线](../learning/05-typescript-roadmap.md)、
[从 C# 到 TypeScript](../typescript/01-from-csharp-to-typescript.md)。

---

## Day 29：编译器、类型擦除与第一条诊断

### 120 分钟任务

- **0–15：**预测 interface、type annotation 在浏览器运行时是否存在。
- **15–40：**检查 `frontend/tsconfig.json`，理解 strict、noEmit 与 include。
- **40–80：**运行 typecheck，创建成功例和三个预期失败例。
- **80–110：**运行 Lab 1，输入合法与畸形 JSON，比较断言和 decoder。
- **110–120：**画“TS 源码 → 检查 → JS → 浏览器 → 外部输入”图。

### 成功与负例

```ts
function issueCountLabel(count: number): string {
  return `${count} issues`;
}

issueCountLabel(12);

// @ts-expect-error count 必须是 number
issueCountLabel("12");
```

`@ts-expect-error` 不是关闭检查。它声明“下一行必须产生预期错误”；若未来不再报错，
编译器会反过来提醒你删除或修正这个负例。

### 运行时实验

JSON 中的 `status: "blocked"` 可以进入 JavaScript，即使 `IssueStatus` 没有该成员。
比较：

```ts
const asserted = JSON.parse(source) as Issue;
const decoded = decodeIssue(JSON.parse(source));
```

第一行是开发者承诺，第二行才产生运行证据。

### 独立任务

关闭本页示例，在 TypeScript Lab 的学习分支新建一个隔离实验，定义最小
`IssuePreview`（`id`、`title`、`status`）和 `formatIssuePreview`。完成以下步骤：

1. 写一个合法调用，以及“id 为 string”“缺 title”“status 为未知值”三个
   `@ts-expect-error`；每条注释必须写明预期被拒绝的关系；
2. 临时修正其中一条错误，确认 TypeScript 报告“未使用的 `@ts-expect-error`”，证明它不是
   静默关闭检查；
3. 用 `JSON.parse` 分别读入合法对象、`{"id":"1"}`、缺 title 和未知 status；
4. 先用 `as IssuePreview` 运行，记录哪一个输入编译通过却产生错误输出或异常；
5. 移除无证据断言，从 `unknown` 开始写最小 guard/decoder，返回 success/error 判别联合；
6. 为四个 JSON 输入写运行时测试，再运行 typecheck 与对应测试。

实验代码不得使用 `any`、双重断言或 catch 后吞掉错误。最后检查构建后的 JavaScript 或 Lab
运行行为，指出 interface、union 和 annotation 中哪些内容已经被擦除；再说明 guard 的条件
为什么仍留在运行时。

### 故障与验收证据

- 三个编译期负例及各自的诊断文本；
- 一次“未使用 `@ts-expect-error`”诊断；
- 四个相同 JSON 在 assertion 与 decoder 路径下的结果对照；
- decoder 成功/失败联合及四个运行时测试；
- `npm run typecheck` 与相关测试的通过输出；
- 一张“编译器能证明 / 运行时必须验证”两列表。

### 当日验收

- [ ] 能解释 `tsc --noEmit` 为什么不生成文件。
- [ ] 至少保存三个带原因的 `@ts-expect-error`。
- [ ] 记录一个“编译通过、运行时失败”的输入。
- [ ] 不声称 TypeScript 自动验证 JSON。

---

## Day 30：对象、函数、数组与结构类型

### 120 分钟任务

- **0–15：**预测一个完整 Issue 能否传给只需要 key/title 的函数。
- **15–40：**学习 object shape、interface/type、function、tuple 与 readonly array。
- **40–80：**完成 Lab 2，写最小 shape 和完整 shape 成功例。
- **80–110：**实现标题提取、查找和映射函数及测试。
- **110–120：**写出结构类型与名义类型的对照。

### 示例

```ts
type IssueHeadingSource = {
  key: string;
  title: string;
};

function getIssueHeading(issue: IssueHeadingSource): string {
  return `${issue.key} · ${issue.title}`;
}

const fullIssue: Issue = getSeedIssue();
getIssueHeading(fullIssue);

// @ts-expect-error 缺少 title
getIssueHeading({ key: "ISS-248" });
```

结构兼容让函数只依赖它真正需要的能力。不要为了复用把函数参数写成完整 `Issue`。

### 独立任务

实现：

```ts
function findIssueByKey(
  issues: readonly Issue[],
  key: string,
): Issue | undefined;
```

覆盖命中、未命中、空数组和大小写策略。解释返回 `undefined` 而不是抛错的理由。

### 当日验收

- [ ] 能区分声明函数输入与运行时检查输入。
- [ ] readonly 输入不被 push/sort。
- [ ] 对象字面量拼错字段会产生编译诊断。
- [ ] 函数参数使用最小必要 shape。

---

## Day 31：Optional、Undefined、Null 与 PATCH 三态

### 120 分钟任务

- **0–15：**预测 `JSON.stringify({a: undefined, b: null})`。
- **15–40：**学习 `?`、`T | undefined`、`T | null`、缺失属性。
- **40–80：**运行 Lab 4，对照 assignee keep/clear/set。
- **80–110：**定义明确的 DueDateIntent 并转为 IssueUpdate。
- **110–120：**提交三态 JSON 对照表。

### 三态建模

```ts
type AssigneeIntent =
  { kind: "keep" } | { kind: "clear" } | { kind: "set"; memberId: number };

function toAssigneePatch(intent: AssigneeIntent): IssueUpdate {
  switch (intent.kind) {
    case "keep":
      return {};
    case "clear":
      return { assigneeId: null };
    case "set":
      return { assigneeId: intent.memberId };
  }
}
```

这比 `number | null | undefined` 更明确：每个值表达的动作有名字，并可扩展校验。

### 独立任务

分别构造 `{}`、`{ assigneeId: undefined }`、`{ assigneeId: null }`、
`{ assigneeId: 2 }`，记录类型、序列化 JSON 和服务端可能看到的结果。

### 当日验收

- [ ] 能区分缺失、undefined 与 null。
- [ ] 不用 truthiness 判断合法 ID。
- [ ] keep/clear/set 三态都有测试。
- [ ] 能解释当前 tsconfig 是否开启 exactOptionalPropertyTypes。

---

## Day 32：Literal Union、as const 与 satisfies

### 120 分钟任务

- **0–15：**预测 `const status = "open"` 与 `let status = "open"` 的推断差异。
- **15–40：**学习 widening、readonly tuple、indexed access 与 satisfies。
- **40–80：**完成 Lab 3，从状态常量派生 union。
- **80–110：**在学习分支临时增加 blocked，记录编译器暴露的影响面。
- **110–120：**撤销实验并整理类型驱动变更清单。

### 单一来源

```ts
export const ISSUE_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

const statusLabels = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
} satisfies Record<IssueStatus, string>;
```

`satisfies` 检查映射完整，同时保留对象值的精确推断；直接写宽类型注解可能丢失信息。

### 独立任务

为 priority 建立常量、union、label、排序权重和 guard。临时删除一个映射成员，保存
编译器错误作为证据。

### 当日验收

- [ ] 状态类型由运行时常量派生，而非重复两份字符串。
- [ ] 完整映射漏 key 会报错。
- [ ] 新增 blocked 的影响清单包含 UI、switch、API、数据库/后端和测试。
- [ ] 不用普通 `string` 代替有限领域集合。

---

## Day 33：any、unknown 与 Honest Guard

### 120 分钟任务

- **0–15：**分别写出 any 和 unknown 能做什么。
- **15–40：**学习 unknown 的收窄方法和类型 predicate 的信任边界。
- **40–80：**实现 isRecord、isIssueStatus、isPositiveIntegerId。
- **80–110：**故意写一个不诚实 guard，让测试揭穿它。
- **110–120：**审计一处断言，写明证据是否充分。

### Guard

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIssueStatus(value: unknown): value is IssueStatus {
  return (
    typeof value === "string" &&
    ISSUE_STATUSES.some((status) => status === value)
  );
}
```

predicate 的返回类型是程序员对编译器的承诺。编译器不会证明实现诚实，所以 guard
必须用合法值、错误类型、null、array 和相似非法字符串测试。

### 独立任务

实现 `isIssuePriority`，表驱动测试至少包含：
`"low"`、`"critical"`、`"urgent"`、`""`、3、null、[]、{}。

### 当日验收

- [ ] 新代码没有 any。
- [ ] catch 变量按 unknown 处理。
- [ ] guard 测试包含容易误判的相似值。
- [ ] 断言旁能指出运行证据，或已改为 guard/decoder。

---

## Day 34：Readonly、不可变更新与浅约束

### 120 分钟任务

- **0–15：**预测 readonly 是否会冻结运行时对象。
- **15–40：**学习 Readonly、ReadonlyArray、as const 与 Object.freeze 的差异。
- **40–80：**把第 4 周 pipeline 输入改为 readonly，修复所有修改操作。
- **80–110：**实现结构共享的状态更新，并测试引用变化。
- **110–120：**记录“编译期只读”和“运行时不可变”边界。

### 示例

```ts
function updateStatus(
  issues: readonly Issue[],
  id: number,
  status: IssueStatus,
): readonly Issue[] {
  return issues.map((issue) =>
    issue.id === id ? { ...issue, status } : issue,
  );
}
```

测试不只断言新状态，还应确认：

- 输入数组内容不变；
- 命中对象引用改变；
- 未命中对象引用保持；
- 嵌套数组若被修改，需要单独复制。

### 独立任务

给 Issue 加一个 readonly tags 数组，尝试 push、sort 和直接索引赋值。再写安全的
`addTag`，处理重复、空白和大小写策略。

### 当日验收

- [ ] 能说明 readonly 是浅层、编译期约束。
- [ ] 不用 `as Issue[]` 逃避只读错误。
- [ ] 更新函数有结构共享测试。
- [ ] seed 在实验前后序列化结果一致。

---

## Day 35：TypeScript 基础周项目

### 120 分钟任务

- **0–15：**闭卷解释推断、擦除、结构类型、null、union、unknown、readonly。
- **15–60：**实现 `normalizeIssueInput(raw: unknown)` 的基础版本。
- **60–85：**整理至少 10 个编译期负例和 12 个运行输入。
- **85–105：**运行 Lab 1～4、typecheck 与相关测试。
- **105–120：**写“TypeScript 能证明什么、不能证明什么”。

### 项目要求

`normalizeIssueInput` 需要：

- 确认输入是 record；
- title/description 是 string；
- status/priority 经过 guard；
- assigneeId 为 null 或正整数；
- 不修改输入；
- 返回判别联合 success/error，而不是抛出普通字符串。

### 通过标准

- Lab 1～4 每课至少一个合法和一个非法输入；
- 至少 10 个有原因的 `@ts-expect-error`；
- 至少 12 个运行时边界用例；
- `npm run typecheck` 与对应测试通过；
- 不用 any、双重断言或 JSON 深复制；
- 能口头解释断言、guard、decoder 的证据强度。

[上一周：JavaScript、DOM 与异步](week-04-javascript-dom-async.md) ·
[下一周：TypeScript 建模与泛型](week-06-typescript-modeling-generics.md) ·
[返回课程总览](./)
