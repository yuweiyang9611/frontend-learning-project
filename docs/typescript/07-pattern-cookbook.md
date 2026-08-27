# 07：TypeScript 模式手册

本手册不是语法速查表，而是一组可以在 IssueFlow 中反复使用的建模模式。每个模式都回答：

1. 它解决什么问题；
2. 最小写法是什么；
3. 何时适合使用；
4. 常见误用是什么；
5. 应留下什么编译期或运行时证据。

初学者不需要一次记住全部模式。遇到真实问题时从“我要保留什么关系”或“这个值来自哪个边界”
出发，再回来选择模式。

## 1. 从运行时常量派生 Literal Union

### 问题

状态既要在运行时生成 select 选项，也要在编译期限制合法字符串。手写两份列表容易漂移。

### 模式

```ts
export const ISSUE_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];
```

`as const` 保留每个字符串 literal，并把数组推断为 readonly tuple；`[number]` 取得所有元素
类型的 union。

### 适用

- JSON 中直接使用可读字符串的 enum-like 值；
- 同一集合还要用于选项、guard、测试或文档；
- 集合数量有限且由前端明确掌握。

### 常见误区

- 同时手写 tuple 和另一个 union；
- 为了省事把领域值写成普通 `string`；
- 认为 tuple 会自动验证服务器响应；
- 无差别改用 TypeScript `enum`，却没有考虑 JSON 表示。

### 证据

新增一个临时状态，观察 union、映射和 switch 的编译影响；用 guard 测试未知 string 被拒绝。

## 2. 用 `satisfies` 检查完整映射

### 问题

每个 IssueStatus 都需要标签和排序信息，但又希望保留对象值的精确推断。

### 模式

```ts
const statusMeta = {
  open: { label: "Open", order: 0 },
  in_progress: { label: "In progress", order: 1 },
  resolved: { label: "Resolved", order: 2 },
  closed: { label: "Closed", order: 3 },
} as const satisfies Record<IssueStatus, { label: string; order: number }>;
```

### 适用

- 有限 union 到标签、颜色、权重或 handler 的完整映射；
- 既要检查 shape，又想保留 literal 信息；
- 希望新增 union 成员时立即得到编译任务。

### 常见误区

- 写 `as Record<...>`，把缺 key 的对象强行断言成完整映射；
- 对任意 string key 使用 `Record<string,V>`，误以为读取一定存在；
- 用 `satisfies` 后便认为运行时 JSON 也被验证。

### 证据

临时删除 `closed` 或增加拼错的 `close`，保存 TypeScript 诊断。运行测试还应验证对象 key
与 `ISSUE_STATUSES` 一致。

## 3. Honest Type Guard

### 问题

URL、DOM 和 JSON 提供的是 string/unknown，必须在运行时证明它属于领域 union。

### 模式

```ts
function isOneOf<const Values extends readonly string[]>(
  values: Values,
  value: unknown,
): value is Values[number] {
  return (
    typeof value === "string" && (values as readonly string[]).includes(value)
  );
}

const isIssueStatus = (value: unknown): value is IssueStatus =>
  isOneOf(ISSUE_STATUSES, value);
```

这里的小范围 widening 只服务于 `includes`，没有把外部 value 断言成 IssueStatus。

### 适用

- 简单 primitive union；
- DOM select、URL query、配置字符串；
- 需要在多个边界复用同一检查。

### 常见误区

```ts
function isIssueStatus(value: unknown): value is IssueStatus {
  return typeof value === "string"; // 承诺过强
}
```

编译器信任 predicate，不会证明实现诚实。复杂 object 应使用 decoder，而不是一个巨大 boolean guard。

### 证据

至少测试合法成员、相似拼写、空串、number、null、array 和 object。

## 4. 判别联合表达互斥状态

### 问题

`isLoading`、`data`、`error` 三个独立值可以表达互相矛盾的 UI。

### 模式

```ts
type RemoteData<T> =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; data: T }
  | { state: "error"; message: string };
```

判别字段是运行时真实存在的 string。检查 `state` 后，其余字段会自动收窄。

### 适用

- 异步 UI 状态；
- workflow/state machine；
- 命令意图，如 keep/clear/set；
- 多种错误类别，每类携带不同数据。

### 常见误区

- 每个成员都放所有可选字段，重新制造非法组合；
- 使用太多相互重叠的 tag；
- 把服务器任意 string 未经验证地当作判别字段。

### 证据

为每个成员写合法构造和渲染测试，再写至少两个 `@ts-expect-error` 非法组合。

## 5. `never` 穷尽检查

### 问题

新增 union 成员后，旧 switch 可能静默落入 default，造成某些页面没有处理新状态。

### 模式

```ts
function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}

function describeStatus(status: IssueStatus): string {
  switch (status) {
    case "open":
      return "Ready for work";
    case "in_progress":
      return "Work is active";
    case "resolved":
      return "Solution delivered";
    case "closed":
      return "Archived";
    default:
      return assertNever(status);
  }
}
```

### 适用

- 封闭 union 的 switch；
- reducer action；
- 页面状态、API 错误或状态机转换。

### 常见误区

- 参数本身是 string，导致 default 永远不是 never；
- 在 default 直接返回空字符串，隐藏遗漏；
- 认为穷尽检查能发现数据库、CSS 或后端遗漏。

### 证据

临时给 union 增加成员，确认 `assertNever` 调用处产生错误；补齐后运行每个分支测试。

## 6. 泛型保留输入与输出关系

### 问题

分页逻辑可用于 Issue、Member 和 Comment，但不能丢失具体 item 类型。

### 模式

```ts
function mapPage<T, U>(
  page: PagedResult<T>,
  project: (item: T) => U,
): PagedResult<U> {
  return { ...page, items: page.items.map(project) };
}
```

T 表示输入元素，U 表示输出元素。泛型的价值在于关系，而不是少写几个类型名。

### 适用

- collection transform；
- page/result/container 保留结构，仅改变内部值；
- caller 的具体类型应传播到返回值。

### 常见误区

- 全部写成 `any`，表面通用却关闭检查；
- 全部写成 `unknown`，导致关系丢失；
- 无关系的函数也强行加多个类型参数；
- 认为 T 在运行时可用于 `instanceof T`。

### 证据

用 `expectTypeOf` 证明 Member page 映射后是 string page，并测试分页元数据和输入不变。

## 7. Generic Constraint 表达最小能力

### 问题

索引函数只需要 id，不应依赖完整 Issue。

### 模式

```ts
function indexById<T extends { id: number }>(
  items: readonly T[],
): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
}
```

### 适用

- 算法只需要少量结构能力；
- 返回值仍要保留输入的其他字段；
- 希望函数可复用于多个领域模型。

### 常见误区

- constraint 写成完整实体，限制复用；
- 认为约束验证了 id 为正数、唯一或 safe integer；
- 用 `{[key:string]: any}` 作为万能约束。

### 证据

编译期拒绝缺 id 和 string id；运行测试重复、负数和超 safe integer，明确额外规则所在层。

## 8. `keyof` + `T[K]` 绑定字段和值

### 问题

通用表单更新器不能允许 `priority` 接收 number，也不能允许拼错字段名。

### 模式

```ts
function updateField<T extends object, K extends keyof T>(
  current: T,
  key: K,
  next: T[K],
): T {
  return { ...current, [key]: next };
}
```

K 由第二参数推断，第三参数必须匹配该字段的精确类型。

### 适用

- typed form updater；
- pluck/select field；
- 配置项的 key 与 parser 返回值需要关联。

### 常见误区

```ts
function badUpdate<T>(key: keyof T, next: T[keyof T]) {}
```

这里 key 与 next 是两个独立 union，错误组合可能通过。另一个误区是把 DOM raw string 直接交给
泛型 updater；泛型不负责解析。

### 证据

编译器拒绝错误 key/value；运行时 parser 测试证明原始字符串先被检查。

## 9. Utility Types 派生明确视图

### 问题

列表只需要 Issue 的一部分字段，PATCH 允许部分字段，错误表按字段名索引。

### 模式

```ts
type IssueSummary = Pick<Issue, "id" | "key" | "title" | "status" | "priority">;

type IssuePatch = Partial<IssueInput>;
type IssueSnapshot = Readonly<IssueSummary>;
type InternalErrors = Partial<Record<keyof IssueInput, readonly string[]>>;
```

### 适用

- 源模型稳定且派生类型确实与其同步；
- 投影、内部 patch、完整 mapping；
- 避免复制一组相同字段声明。

### 常见误区

- 认为 `Partial` 表达了至少一个字段、null 语义或跨字段规则；
- 从巨大实体 Pick，导致 UI 随无关后端变化震荡；
- 认为 Readonly 会深度冻结运行时对象；
- 对未知外部 error key 使用过度封闭类型且不 decode。

### 证据

使用 `expectTypeOf` 验证派生关系；用运行实验展示 Readonly 的浅层和 `Partial` 接受空对象。

## 10. Optional/Nullable Intent Union

### 问题

PATCH 中省略字段、发送 null 和发送 value 是三个不同动作，单独的 `number | null | undefined`
不容易表达调用意图。

### 模式

```ts
type AssignmentIntent =
  | { kind: "keep" }
  | { kind: "unassign" }
  | { kind: "assign"; memberId: number };

function toAssignmentPatch(intent: AssignmentIntent): IssueUpdate {
  switch (intent.kind) {
    case "keep":
      return {};
    case "unassign":
      return { assigneeId: null };
    case "assign":
      return { assigneeId: intent.memberId };
    default:
      return assertNever(intent);
  }
}
```

### 适用

- PATCH presence；
- clear/reset/replace 命令；
- 相同 primitive 值有不同业务动作。

### 常见误区

- 用 truthiness 区分 ID，导致 0 等值被意外处理；
- 发送 `{field:undefined}` 却以为服务器会看到字段；
- 用 `Partial` 替代服务端的 presence tracking。

### 证据

保存 `{}`、null、value 的对象和 JSON.stringify 结果，并与 C# `HasAssigneeId` 对照。

## 11. Typed Error Map：内部严格、外部宽容

### 问题

内部校验希望字段拼写受检查，外部 Problem Details 又可能包含未来或跨字段 key。

### 模式

```ts
type TypedFieldErrors<T extends object> = Partial<
  Record<keyof T, readonly string[]>
>;

interface WireFieldErrors {
  [field: string]: string[] | undefined;
}
```

### 适用

- `TypedFieldErrors<IssueInput>` 用于内部 validator；
- decoder 完成之后的 wire error dictionary；
- 表单字段与错误提示关联。

### 常见误区

- 直接断言外部 errors 为严格 map；
- 使用 `Record<string,string[]>` 后假定任意读取都存在；
- 不处理 PascalCase/camelCase 漂移；
- 把 form-level error 强行塞进某个字段。

### 证据

编译期证明拼错内部字段被拒绝；运行测试 unknown key、空数组、非 string 元素和 form-level error。

## 12. Decoder 结果联合

### 问题

外部 unknown 既可能成功，也可能包含多个可展示的字段错误。

### 模式

```ts
type DecodeResult<T> =
  { ok: true; value: T } | { ok: false; errors: readonly string[] };

type Decoder<T> = (value: unknown) => DecodeResult<T>;
```

### 适用

- HTTP response、localStorage、URL configuration；
- 希望错误作为数据返回而非任意 throw；
- 需要组合 primitive、array 和 object decoder。

### 常见误区

- 返回 success 前只检查顶层 object；
- 在 decoder 内先 `as T` 再“验证”；
- 混合 wire shape 和业务 validation；
- 错误没有 path，嵌套对象难以定位。

### 证据

表驱动覆盖 null、array、缺字段、错误字段、合法值；成功类型由 `expectTypeOf` 证明。

## 13. Branded Type 记录已验证的 Wire Scalar

### 问题

普通 string 无法区分日历日、instant 和任意文本，但它们在 JSON 中都是 string。

### 模式

```ts
declare const calendarDateBrand: unique symbol;

type CalendarDate = string & {
  readonly [calendarDateBrand]: true;
};

function isCalendarDate(value: unknown): value is CalendarDate {
  // 格式检查后还要验证真实年月日
  return typeof value === "string" && isRealDate(value);
}
```

### 适用

- 结构相同但语义确实不同的边界值；
- 值经过集中 decoder 后要在应用内部携带验证证据；
- 错用会产生显著业务问题，例如 DateOnly 与 instant。

### 常见误区

- 给每个 string 都加品牌；
- 直接 `value as CalendarDate`；
- 认为品牌在运行时存在；
- 只用正则接受 2 月 30 日。

### 证据

普通 string 的编译负例；闰日、非法日、年份边界和时区实验。

## 14. Decoder 驱动的 Generic Request

### 问题

`request<T>()` 可以让调用方任意选择 T，却没有验证服务器响应。

### 模式

```ts
async function request<T>(
  path: string,
  decode: Decoder<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) throw await decodeProblem(response);

  const raw: unknown = await response.json();
  const result = decode(raw);
  if (!result.ok) throw new ContractError(path, result.errors);
  return result.value;
}
```

### 适用

- 类型安全要求高的 HTTP client；
- 后端与前端可能独立部署；
- 需要尽早发现 Contract drift。

### 常见误区

- 把 response JSON 直接断言成 T；
- 对 204 调用 json，或用 `undefined as T`；
- 把非 JSON 500 与 Contract 错误混为一类；
- 错误日志记录完整敏感 payload。

### 证据

测试合法 200、畸形 200、204、JSON syntax error、Problem Details、HTML 500、network error。

## 15. React Select 的 Parser Boundary

### 问题

`HTMLSelectElement.value` 永远是 string，即使 option 来自 typed tuple。

### 模式

```tsx
<select
  value={value.status}
  onChange={(event) => {
    const raw = event.currentTarget.value;
    if (isIssueStatus(raw)) {
      change("status", raw);
    }
  }}
>
  {ISSUE_STATUSES.map((status) => (
    <option key={status} value={status}>
      {statusLabels[status]}
    </option>
  ))}
</select>
```

### 适用

- select、radio group、dataset 和 URL-backed form；
- 任何 DOM primitive 要进入领域 state 的位置。

### 常见误区

- `event.target.value as IssueStatus`；
- 因为选项是受控的就省略边界测试；
- number input 直接 `Number(value)` 后不检查 NaN、整数和范围。

### 证据

组件测试伪造 `blocked`，确认不会触发 state update 或 mutation；再测试所有合法成员。

## 16. Query Key Factory 保留缓存身份

### 问题

list、stream、board、detail 使用散落数组时，遗漏参数或失效范围容易不一致。

### 模式

```ts
const issueKeys = {
  all: ["issues"] as const,
  list: (query: Readonly<IssueQuery>) =>
    [...issueKeys.all, "list", query] as const,
  board: () => [...issueKeys.all, "board"] as const,
  detail: (id: number) => ["issue", id] as const,
};
```

### 适用

- 多页面共享同一服务端资源；
- 需要精确 invalidate、snapshot 或 optimistic update；
- query 参数组成稳定的缓存身份。

### 常见误区

- key 漏掉筛选条件；
- list 和 infinite data 共用相同 key；
- 每次生成含不稳定值的对象；
- 认为 typed key 能验证缓存中的网络数据。

### 证据

列出现有查询和所有 invalidate；测试不同 query 产生不同 key、同内容产生等价稳定 key。

## 选择模式的最短路径

| 你遇到的问题              | 先考虑                             |
| ------------------------- | ---------------------------------- |
| 有限字符串集合            | runtime tuple → literal union      |
| 每个 union 成员都需配置   | `satisfies Record`                 |
| 互斥状态                  | discriminated union                |
| 新成员不能被静默遗漏      | `never` exhaustive check           |
| 输入类型应传播到输出      | generic                            |
| 算法只需少数字段          | generic constraint / minimal shape |
| 字段名决定字段值类型      | `K extends keyof T` + `T[K]`       |
| 从已有模型派生视图        | `Pick` / `Omit` / mapped type      |
| 外部 unknown 进入应用     | guard 或 Decoder                   |
| 相同 primitive 有不同语义 | validated branded type             |
| DOM string 进入领域 state | parser/guard boundary              |
| HTTP 泛型只是假定 shape   | decoder-driven request             |

完成模式练习后进入[练习题库](08-exercise-bank.md)，遇到难懂诊断时使用
[类型错误调试指南](09-type-error-debugging.md)。
