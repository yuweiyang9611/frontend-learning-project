# 第 6 周：TypeScript 领域建模、泛型与类型变换

第 5 周建立了 TypeScript 的基础心智模型。本周开始用类型表达 IssueFlow 的业务规则：
状态不能互相矛盾，字段名必须与字段值保持关联，通用函数必须保留输入与输出的关系。

本周不是背诵高级语法。每天都要回答两个问题：这个类型排除了哪种错误？运行时仍需要检查什么？

## 本周成果

- 用判别联合表达 Issue 状态、异步状态和操作意图；
- 用 `never` 让新增领域成员产生可追踪的编译任务；
- 理解泛型的类型推断、约束及其运行时擦除；
- 使用 `keyof`、indexed access 保持字段名与字段值的关系；
- 正确使用 `Pick`、`Omit`、`Partial`、`Record`、`Readonly`；
- 完成一个不修改输入的 Issue 投影、分组、排序和分页模块。

配套阅读：[领域建模、联合类型与收窄](../typescript/02-domain-modeling-and-narrowing.md)、
[泛型、Utility Types 与 keyof](../typescript/03-generics-utilities-and-keyof.md)、
[TypeScript 模式手册](../typescript/07-pattern-cookbook.md)。

---

## Day 36：判别联合——让非法状态难以表达 {#day-36}

### 今日目标

把多个可能互相冲突的 boolean 改成一个封闭的状态集合，并学会通过判别字段读取正确数据。

### 完整 120 分钟

| 时间    | 活动                                                    | 产物                    |
| ------- | ------------------------------------------------------- | ----------------------- |
| 0–15    | 写出 loading、data、error 三个独立变量能组成的矛盾状态  | 至少 3 个非法组合       |
| 15–40   | 阅读 `RemoteData<T>`、`AssignmentIntent` 和判别联合章节 | 状态转换图              |
| 40–70   | 写合法状态、编译期负例和按 `state` 收窄的 formatter     | 1 个 `.ts` 实验         |
| 70–90   | 运行 Lab `unknown-state-errors` 和 `optional-null`      | 合法/非法输入记录       |
| 90–110  | 独立设计保存 Issue 的状态联合                           | 类型、render 函数、测试 |
| 110–120 | 复盘哪些错误被类型消除、哪些仍需运行检查                | 当日日志                |

### 概念与源码

阅读 `frontend/src/features/typescript-lab/examples.ts` 中的 `RemoteData<T>`：

```ts
type RemoteData<T> =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; data: T }
  | { state: "error"; message: string };
```

判别字段 `state` 既是运行时值，也是编译器收窄依据。它不能阻止服务器返回畸形 JSON，
但能阻止应用内部构造 `success` 却没有 `data` 的对象。

### 编译期负例与运行实验

```ts
// @ts-expect-error error 状态不能携带 success 才有的 data
const impossible: RemoteData<Issue[]> = {
  state: "error",
  message: "Request failed",
  data: [],
};
```

在 Lab 输入 400、404、503，记录 `ApiFailure` 分类与显示文案。再分别调用
`describeRemoteData` 的 idle/loading/success/error 分支。

### 独立任务

设计 `SaveIssueState`：idle、validating、submitting、success、validation-error、network-error。
明确哪些状态携带 field errors，哪些状态携带已保存 Issue。不得用 `isLoading`、`hasError`
等并列 boolean 代替。

### 验收证据

- [ ] 保存状态不存在 `success` 且同时携带 error 的表达方式。
- [ ] 每个 union 成员都有一个成功构造例。
- [ ] 至少两个非法构造由 `@ts-expect-error` 证明。
- [ ] 一份状态图标出允许和禁止的转换。

---

## Day 37：穷尽检查、never 与类型驱动变更 {#day-37}

### 今日目标

让领域模型新增成员时，编译器主动指出遗漏的映射和分支。

### 完整 120 分钟

| 时间    | 活动                                                | 产物         |
| ------- | --------------------------------------------------- | ------------ |
| 0–15    | 预测给 IssueStatus 增加 `blocked` 后哪些地方会变化  | 影响清单初稿 |
| 15–35   | 学习 `never`、完整 Record、`satisfies`              | 概念对照表   |
| 35–65   | 阅读 `nextIssueStatus`、`statusMeta`、`assertNever` | 源码批注     |
| 65–90   | 在学习分支临时加入 `blocked` 并运行 typecheck       | 原始诊断记录 |
| 90–110  | 独立补齐一个纯 TypeScript 状态机，不改后端          | 状态机与测试 |
| 110–120 | 撤销临时领域变更，分类编译器发现与未发现项          | 复盘表       |

### 概念与源码

```ts
function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}

function nextStatus(status: IssueStatus): IssueStatus {
  switch (status) {
    case "open":
      return "in_progress";
    case "in_progress":
      return "resolved";
    case "resolved":
      return "closed";
    case "closed":
      return "open";
    default:
      return assertNever(status);
  }
}
```

`never` 检查的是当前静态 union 是否已穷尽。数据库 migration、后端 enum、CSS 列宽和文档
不会自动进入 TypeScript 的分析范围，仍需人工影响清单。

### 编译期负例与运行实验

临时加入 `blocked` 后先不要修错，保存以下证据：缺失的 `Record` key、未覆盖的 switch、
受影响的测试。随后只在一个独立实验类型中补齐，避免把半成品状态留进产品。

```ts
type DemoStatus = IssueStatus | "blocked";

// @ts-expect-error 缺少 blocked 对应的标签
const demoLabels: Record<DemoStatus, string> = statusLabels;
```

### 独立任务

为 `SaveIssueState` 写穷尽的 `describeSaveState`。增加 `cancelled`，先保存编译错误，再补齐
显示文案和测试。

### 验收证据

- [ ] `blocked` 影响清单包含常量、映射、switch、UI、API、C#、持久化和测试。
- [ ] 保存一次新增 union 成员产生的真实编译诊断。
- [ ] `describeSaveState` 对每个状态有测试。
- [ ] 临时 `blocked` 已撤销，工作区没有半实现功能。

---

## Day 38：泛型——保留输入与输出的关系 {#day-38}

### 今日目标

理解泛型不是“把类型写得更复杂”，而是让调用方传入的具体类型能传播到返回值。

### 完整 120 分钟

| 时间    | 活动                                                 | 产物           |
| ------- | ---------------------------------------------------- | -------------- |
| 0–15    | 比较 `first(any[])`、`first(unknown[])`、`first<T>`  | 三种返回类型表 |
| 15–40   | 阅读 `PagedResult<T>`、`paginate<T>`、`mapPage<T,U>` | T/U 关系图     |
| 40–70   | 写成功例、错误赋值和 `expectTypeOf`                  | 类型测试       |
| 70–90   | 运行 Lab `generics` 的四组分页输入                   | 输出边界表     |
| 90–110  | 独立实现 first、last、mapPage                        | 实现与单测     |
| 110–120 | 解释泛型为何没有验证 page/pageSize                   | 复盘段落       |

### 概念与源码

```ts
function mapPage<T, U>(
  page: PagedResult<T>,
  project: (item: T) => U,
): PagedResult<U> {
  return { ...page, items: page.items.map(project) };
}
```

如果输入是 `PagedResult<Member>`，projection 返回 string，结果就是 `PagedResult<string>`。
若把 T、U 都写成 T，会错误地禁止这种合法转换。

### 编译期负例与运行实验

```ts
const issuePage = paginate(seedIssues, 1, 5);

// @ts-expect-error Issue page 不是 Member page
const memberPage: PagedResult<Member> = issuePage;
```

Lab 依次输入 `2,4`、`1,1`、`0,5`、`abc,2`。说明为什么数字类型不能表达正整数、
最大 page size 或数据总页数。

### 独立任务

实现 `mapPage` 后再实现 `pluckPage(page, key)`。要求返回字段值的精确类型，例如
`pluckPage(issuePage, 'status')` 为 `PagedResult<IssueStatus>`。

### 验收证据

- [ ] `expectTypeOf` 证明 Member → string 的投影关系。
- [ ] 原分页对象和 items 没有被修改。
- [ ] 非法 page 输入有明确运行策略和测试。
- [ ] 能说明泛型在 JavaScript 运行时不存在。

---

## Day 39：泛型约束、最小能力与 Map {#day-39}

### 今日目标

只要求算法真正需要的属性，同时理解约束不是运行时校验。

### 完整 120 分钟

| 时间    | 活动                                          | 产物        |
| ------- | --------------------------------------------- | ----------- |
| 0–15    | 写出 indexById 最少需要什么                   | 最小 shape  |
| 15–35   | 学习 `extends` constraint、PropertyKey、Map   | 概念笔记    |
| 35–65   | 阅读并测试 `indexById<T extends {id:number}>` | 成功/失败例 |
| 65–85   | 实验重复 id、空数组、负 id 和 string id       | 运行结果表  |
| 85–110  | 独立实现通用 groupBy                          | 实现和测试  |
| 110–120 | 对比约束、guard、业务不变量                   | 三层表      |

### 编译期负例

```ts
indexById([{ id: 1, title: "Valid" }]);

// @ts-expect-error 缺少 numeric id
indexById([{ key: "IF-1" }]);

// @ts-expect-error string id 不满足约束
indexById([{ id: "1", title: "Wrong wire value" }]);
```

这些负例只说明输入的静态结构。`id: -1`、重复 id 都仍满足 `{id:number}`，必须由运行逻辑
或调用前 decoder 处理。

### 独立任务

实现：

```ts
function groupBy<T, K extends PropertyKey>(
  items: readonly T[],
  keyOf: (item: T) => K,
): Map<K, T[]>;
```

测试空数组、重复 string key、number key、symbol key，并证明 source 未变化。

### 验收证据

- [ ] groupBy 无 `any` 和双重断言。
- [ ] 至少 4 个运行测试和 2 个编译负例。
- [ ] 记录 Map 重复 key 与 `indexById` 覆盖旧值的行为。
- [ ] 能解释“constraint 是能力要求，不是数据验证”。

---

## Day 40：keyof 与 indexed access——绑定字段和值 {#day-40}

### 今日目标

避免字段名和值分别成为两个无关联的 union，建立 `K → T[K]` 关系。

### 完整 120 分钟

| 时间    | 活动                                            | 产物         |
| ------- | ----------------------------------------------- | ------------ |
| 0–15    | 列出 `keyof IssueInput` 和每个字段的 value 类型 | 字段类型表   |
| 15–40   | 学习 keyof、indexed access、generic inference   | 推断过程笔记 |
| 40–65   | 阅读 `updateField` 与 `IssueForm.change`        | 源码追踪     |
| 65–85   | 运行 Lab `keyof-fields`，尝试合法和非法输入     | Runner 记录  |
| 85–110  | 独立实现 pluck、updateField 和测试              | 小型工具模块 |
| 110–120 | 解释 `T[K]` 与 `T[keyof T]`                     | 反例说明     |

### 示例与负例

```ts
function updateField<T extends object, K extends keyof T>(
  value: T,
  key: K,
  next: T[K],
): T {
  return { ...value, [key]: next };
}

updateField(input, "priority", "critical");

// @ts-expect-error priority 不能接收 number
updateField(input, "priority", 3);

// @ts-expect-error IssueInput 没有 severity 字段
updateField(input, "severity", "high");
```

### 运行实验与独立任务

Lab 输入 `title=New title`、`description=A=B is preserved`、`priority=critical`、
`priority=urgent`、`assigneeId=2`。解释 Runner 为什么只开放少数字段：原始文本必须先解析，
不能只靠泛型变成任意 `IssueInput[K]`。

独立实现 `pluckPage(page, key)`，覆盖 title、status、assignee 三种值形状。

### 验收证据

- [ ] 编译器拒绝错误 key 和错误 value。
- [ ] `description=A=B` 没有错误截断。
- [ ] `expectTypeOf` 证明 pluck 后的精确 item 类型。
- [ ] 能说明运行时字符串为何仍需 parser/guard。

---

## Day 41：Utility Types、映射类型与类型设计边界 {#day-41}

### 今日目标

从真实领域模型派生视图、补丁和错误映射，同时识别过度抽象。

### 完整 120 分钟

| 时间    | 活动                                                  | 产物     |
| ------- | ----------------------------------------------------- | -------- |
| 0–15    | 不查资料写出 Pick/Omit/Partial/Record/Readonly 的用途 | 自测表   |
| 15–40   | 阅读 IssueSummary、IssuePatch、TypedFieldErrors       | 源码批注 |
| 40–70   | 写每种 Utility Type 的成功与失败例                    | 类型练习 |
| 70–90   | 运行 Lab `utility-types` 并观察 shallow readonly      | 运行记录 |
| 90–110  | 独立设计内部校验错误类型与 wire 错误类型              | 对照设计 |
| 110–120 | 判断一个 mapped type 是否值得保留                     | 决策记录 |

### 示例与负例

```ts
type IssueSummary = Pick<Issue, "id" | "key" | "title" | "status" | "priority">;

type InternalErrors = Partial<Record<keyof IssueInput, readonly string[]>>;

declare const snapshot: Readonly<IssueSummary>;

// @ts-expect-error 快照顶层字段不可修改
snapshot.title = "Changed";

// @ts-expect-error 完整映射不能遗漏 closed
const labels: Record<IssueStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};
```

产品的 `FieldErrors` 保留 string index signature，因为外部 Problem Details 可能含未来字段；组件内部
错误则可更严格。这是边界选择，不是“哪个类型更高级”。

### 独立任务

派生 `IssueCreateDraft`、`IssueSummary`、`IssueSnapshot`，并设计 `AtLeastOne<IssueUpdate>`。
写一段说明：该类型为何仍不能阻止网络 JSON `{}`，当前未开启 `exactOptionalPropertyTypes`
又会留下什么缺口。

### 验收证据

- [ ] 至少 5 个 Utility Type 有真实 IssueFlow 用途。
- [ ] 有 `expectTypeOf` 证明，而非只靠肉眼看声明。
- [ ] 运行实验展示 readonly 的浅层限制。
- [ ] 能解释内部严格错误表与外部开放错误表的不同策略。

---

## Day 42：周项目——Issue 投影与状态工具箱 {#day-42}

### 今日目标

把本周能力组合成一个小而完整、可以独立测试的模块。

### 完整 120 分钟

| 时间    | 活动                                                       | 产物               |
| ------- | ---------------------------------------------------------- | ------------------ |
| 0–15    | 闭卷画出 union、generic、constraint、keyof、utility 的关系 | 概念图             |
| 15–30   | 写周项目 Contract 和边界表                                 | 输入/输出/失败说明 |
| 30–75   | 实现 filter、stable sort、project、group、paginate         | 工具模块           |
| 75–95   | 写编译期负例和 runtime tests                               | 测试集             |
| 95–110  | 对照 `runIssuePipeline` 和 `mockList` 找差异               | 源码追踪报告       |
| 110–120 | 运行质量检查并做周复盘                                     | 命令输出与结论     |

### 周交付物

完成一个 `IssueProjection` 工具箱，要求：

1. 输入为 `readonly Issue[]`；
2. query 使用已有 `IssueStatus`、`IssuePriority`、`IssueSort`；
3. 排序相同时保持原顺序；
4. 输出为 `PagedResult<IssueSummary>`；
5. 可按 status 分组成 `Map<IssueStatus, IssueSummary[]>`；
6. 不改变 seed 数据；
7. 非法运行输入在进入工具箱前被拒绝。

至少覆盖：空输入、无匹配、重复排序值、第二页、超出页数、每个状态、非法 sort、错误 patch value。

### 过关标准

- [ ] 累计至少 14 个有原因的编译期负例。
- [ ] 周项目至少 10 个运行时测试。
- [ ] 使用 `expectTypeOf` 证明两个泛型关系。
- [ ] `npm run typecheck` 和相关 Vitest 通过。
- [ ] 没有 `any`、`as unknown as` 或通过断言压掉错误。
- [ ] 能逐项解释类型保证、运行保证及仍未覆盖的业务规则。

未过关时，优先重做 Day 38～41；不要通过放宽为 string、object 或 any 继续下一周。

[上一周：TypeScript 基础](week-05-typescript-foundations.md) ·
[下一周：运行时边界与 Wire Contract](week-07-typescript-runtime-contracts.md) ·
[返回课程总览](./)
