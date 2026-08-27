# 03：泛型、Utility Types 与 keyof

## 本章目标

泛型的目标是保留输入与输出之间的关系，而不是把所有函数写得抽象。本章从分页、索引、表单更新和错误映射出发，解释什么时候值得使用泛型。

## 1. 泛型保留关系

```ts
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}
```

传入 Member[]，结果是 Member | undefined；传入 Issue[]，结果是 Issue | undefined。若改成 unknown[]，关系会丢失；若改成 any[]，检查会被关闭。

## 2. `PagedResult<T>`

[types.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/issues/types.ts) 定义：

```ts
interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
```

一个 map 函数可以改变 item 类型但保留分页元数据：

```ts
function mapPage<T, U>(
  page: PagedResult<T>,
  project: (item: T) => U,
): PagedResult<U> {
  return { ...page, items: page.items.map(project) };
}
```

这里 T 与 U 分别表示输入元素和输出元素；若都写 T，就错误限制了投影。

## 3. Generic Constraint

索引函数只需要 id：

```ts
function indexById<T extends { id: number }>(
  items: readonly T[],
): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
}
```

Constraint 表达最小能力，而不是要求完整 Issue。返回 Map 仍保留额外字段。

约束不进行运行时验证。外部 JSON 中 id 是字符串时，调用前必须 decoder。

## 4. keyof 与 indexed access

`keyof IssueInput` 得到字段名 union。`IssueInput[K]` 得到某个 key 对应的 value 类型：

```ts
function updateField<T extends object, K extends keyof T>(
  value: T,
  key: K,
  next: T[K],
): T {
  return { ...value, [key]: next };
}

updateField(input, "priority", "critical");
// updateField(input, 'priority', 3); // 编译错误
```

K 连接了第二和第三参数。如果把 next 写成 `T[keyof T]`，它会成为所有字段值的 union，错误的 key/value 组合可能通过。

## 5. React DOM 事件类型

事件类型应匹配元素：

```ts
function readText(event: React.ChangeEvent<HTMLInputElement>) {
  return event.currentTarget.value;
}

function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
}
```

优先用 `currentTarget`：它是注册处理器的元素，类型更稳定；`target` 可能是事件冒泡路径中的内部元素。

注意 select.value 永远是 string。即使 options 来自 IssueStatus，也不能自动得到 union，仍应 guard。

## 6. Pick 与 Omit

```ts
type IssueSummary = Pick<Issue, "id" | "key" | "title" | "status" | "priority">;

type IssueCreateDraft = Omit<IssueInput, "status" | "priority">;
```

优点是源类型变化可传播；风险是过度依赖巨大实体会让 UI 类型随无关变化摇摆。有明确 wire contract 时，独立 DTO 可能更清楚。

## 7. Partial

`Partial<IssueInput>` 让所有属性可选，适合 PATCH 的基础静态形状：

```ts
type IssueUpdate = Partial<IssueInput>;
```

但 Partial 没有表达：

- 空 PATCH 是否允许；
- 某些字段是否只读；
- null 与省略的业务含义；
- 至少一个字段；
- 字段组合约束。

这些需要更精确类型、decoder 和服务端验证。不要把 Utility Type 当成业务规则。

## 8. Record

`Record<K, V>` 适合有限 key 的完整映射：

```ts
const priorityWeight = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
} satisfies Record<IssuePriority, number>;
```

若 K 是任意 string，Record 会给人“任何 key 都存在”的错觉。动态字典读取仍可能得到 undefined，可考虑 `noUncheckedIndexedAccess` 或 Map。

## 9. Readonly

`Readonly<IssueSummary>` 和 `readonly Issue[]` 表达“不应修改”。它们是浅层：

```ts
type Snapshot = Readonly<{
  issue: Issue;
  tags: string[];
}>;
```

Snapshot 的顶层属性不能重新赋值，但嵌套 issue/tags 仍可能可变。需要深 readonly 时要明确工具类型和成本，运行时仍不自动冻结。

## 10. Typed Error Map

```ts
type TypedFieldErrors<T extends object> = Partial<
  Record<keyof T, readonly string[]>
>;
```

这能防止拼错已知字段，但服务端 Problem Details 可能包含跨字段或未来字段，所以产品的 `FieldErrors` 还保留 string index signature。选择取决于边界：

- 组件内部校验可严格；
- 外部错误 Contract 需要容忍未知 key 或先 decode。

## 11. 条件类型与过度抽象

可以用 conditional/mapped type 建立字段配置，但若读者难以理解、错误消息巨大或运行时仍需大量分支，就可能不值得。

判断标准：

- 是否真的重复至少两三次；
- 泛型是否保留有价值的关系；
- 调用方是否比手写更清楚；
- 错误是否出现在调用处；
- 是否有测试证明运行时逻辑。

## 12. 练习

### A. groupBy

实现：

```ts
function groupBy<T, K extends PropertyKey>(
  items: readonly T[],
  keyOf: (item: T) => K,
): Map<K, T[]> {
  // implementation
}
```

要求不修改输入，并测试空数组、重复 key 与 symbol key。

### B. 至少一个 PATCH 字段

尝试定义 `AtLeastOne<T>`，然后回答：它能否阻止运行时 JSON `{}`？为什么服务端仍需检查？

### C. FieldConfig

为 title、priority、dueDate 建立 key/value 关联的配置。不要用 any；若设计过于复杂，记录一个更简单的判别联合方案。

## 本章验收

- [ ] 能解释 T、U 各自保留的关系。
- [ ] 能写最小 generic constraint。
- [ ] 能说明 `T[K]` 与 `T[keyof T]` 的差异。
- [ ] 能指出 Partial 未表达的 PATCH 规则。
- [ ] 能选择 Record、Map 或普通对象。
- [ ] 能说明 readonly 的浅层与运行时边界。

[上一章：领域建模、联合类型与收窄](02-domain-modeling-and-narrowing.md) · [下一章：unknown、Decoder 与运行时边界](04-runtime-boundaries.md)
