# 02：领域建模、联合类型与收窄

## 本章目标

本章用 Issue 状态、优先级、远程数据和 API 错误说明如何让“非法状态难以表达”，以及如何把不可信输入收窄为领域值。

## 1. 从运行时常量派生 union

[types.ts](../../frontend/src/features/issues/types.ts) 使用：

```ts
export const ISSUE_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];
```

推导步骤：

1. 没有 `as const` 时，数组元素通常扩大为 string；
2. `as const` 保留每个 literal 并使 tuple readonly；
3. `typeof ISSUE_STATUSES` 得到 tuple 类型；
4. `[number]` 取所有数字索引对应的元素 union。

最终类型是 `'open' | 'in_progress' | 'resolved' | 'closed'`。

## 2. satisfies：检查但保留精确信息

```ts
const statusLabels = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
} as const satisfies Record<IssueStatus, string>;
```

`satisfies` 会检查 key 完整且值兼容，同时保留对象自身的精确类型。与两种写法对比：

- `: Record<IssueStatus, string>`：变量被标为较宽的目标类型；
- `as Record<IssueStatus, string>`：断言可能掩盖证据不足；
- `satisfies ...`：验证兼容性但不把表达式粗暴改型。

实验：删掉 `closed` 或拼成 `close`，观察错误位置。

## 3. Type Guard

URL、select、JSON 中的值首先是 string/unknown：

```ts
function isIssueStatus(value: unknown): value is IssueStatus {
  return (
    typeof value === "string" &&
    (ISSUE_STATUSES as readonly string[]).includes(value)
  );
}
```

返回类型 `value is IssueStatus` 是 predicate。只有函数运行并返回 true 后，调用处才获得收窄。

Guard 必须与实现一致。下面是错误 guard：

```ts
function isIssueStatus(value: unknown): value is IssueStatus {
  return typeof value === "string"; // 承诺过强
}
```

编译器信任 predicate，所以 guard 自身必须有边界测试。

## 4. 控制流收窄

TypeScript 会利用：

- `typeof`；
- `instanceof`；
- `in`；
- 相等判断；
- 自定义 predicate；
- 判别字段；
- early return。

```ts
function readMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown failure";
}
```

小而早的 guard 能减少嵌套，让后续代码在更窄类型下运行。

## 5. 判别联合

远程数据不应由多个互相矛盾的 boolean 表示：

```ts
type RemoteData<T> =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; data: T }
  | { state: "error"; message: string };
```

这样无法表达 `isLoading=true` 同时 `data` 与 `error` 都存在的混乱状态。读取 `state` 后，其他字段自动收窄。

同样，AssignmentIntent 表达 PATCH 三态：

```ts
type AssignmentIntent =
  | { kind: "keep" }
  | { kind: "unassign" }
  | { kind: "assign"; memberId: number };
```

## 6. never 与穷尽检查

`never` 表示不可能出现的值：

```ts
function assertNever(value: never): never {
  throw new Error("Unhandled value: " + String(value));
}

function next(status: IssueStatus): IssueStatus {
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

给 union 新增 `blocked` 后，default 中的 status 不再是 never，编译器会指出遗漏。这个模式把领域扩展变成可追踪任务。

## 7. Template Literal Type

`IssueKey` 可近似表达：

```ts
type IssueKey = `IF-${number}`;
```

但这仍是编译期近似，不能保证正整数、无小数或来自真实 Issue。项目用正则 `/^IF-[1-9]\d*$/` 完成运行时验证。

类型与验证器是互补关系。

## 8. 类型驱动变更

给状态增加 `blocked`，按错误完成影响图：

```text
ISSUE_STATUSES
  ├─ IssueStatus
  ├─ statusLabels / statusMeta
  ├─ switch / assertNever
  ├─ 排序权重
  ├─ 表单 select
  ├─ Board 列
  ├─ C# enum + JSON
  ├─ D1 schema/校验
  └─ tests/fixtures
```

TypeScript 只能发现静态可见的遗漏；数据库 migration、后端行为和 CSS 列宽仍需人为检查。

## 9. 反模式

### 用断言代替验证

```ts
const status = event.currentTarget.value as IssueStatus;
```

DOM value 仍可被脚本或未来选项改变。更安全的是调用 `isIssueStatus`，失败时忽略或报告。

### 过宽 string

若 status 定义成 string，拼写错误会传播到 Query、CSS 和后端。

### 过度品牌化

每个 string 都品牌化会增加转换噪声。品牌适合结构相同但语义不同且边界重要的值。

## 10. 练习

### A. RemoteData

增加 `refreshing` 状态，决定是否携带旧 data，并补齐 `describeRemoteData`。解释为何不是简单 `loading=true`。

### B. API Failure

阅读 [examples.ts](../../frontend/src/features/typescript-lab/examples.ts) 的 `ApiFailure`，给 429 增加明确分支和 retryAfter，更新穷尽 switch 与测试。

### C. DOM Guard

找出表单或 Board 中一个 `as IssueStatus`，用 guard 替换，补一个无效 DOM 值的测试。

## 本章验收

- [ ] 能从 readonly tuple 推导 union。
- [ ] 能解释 satisfies 与 annotation/assertion。
- [ ] 能写并测试一个 honest type guard。
- [ ] 能用判别联合消除矛盾状态。
- [ ] 能用 never 让新增 union 成员产生编译任务。

[上一章：从 C# 到 TypeScript](01-from-csharp-to-typescript.md) · [下一章：泛型、Utility Types 与 keyof](03-generics-utilities-and-keyof.md)
