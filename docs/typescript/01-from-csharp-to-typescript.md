# 01：从 C# 到 TypeScript

## 本章目标

如果你熟悉 C#，TypeScript 语法会很亲切，但两者的类型系统和运行时模型并不相同。本章用 IssueFlow 解释最容易误判的差异。

## 1. 编译产物不同

C# 编译后的程序集仍保留大量运行时类型信息；TypeScript 通常被擦除为 JavaScript：

```ts
interface IssueHeading {
  key: string;
  title: string;
}

function heading(issue: IssueHeading) {
  return issue.key + " · " + issue.title;
}
```

运行时没有 `IssueHeading` 构造器或自动验证器。接口不能用于 `instanceof`，网络响应也不会因为标注接口而被检查。

心智模型：

```text
TypeScript source
  ├─ type checker → diagnostics
  └─ transpile    → JavaScript → browser runtime
```

## 2. 结构类型与名义类型

C# 类/接口兼容通常依赖显式声明；TypeScript 主要看结构：

```ts
type HasHeading = { key: string; title: string };

function formatHeading(value: HasHeading) {
  return value.key + " · " + value.title;
}

formatHeading({ key: "IF-9", title: "Small shape", debug: true });
```

对象具有所需字段就能使用，不需要 `implements HasHeading`。这使小接口和组合很自然，也意味着两个业务含义不同但结构相同的值可能意外兼容。

需要区分语义时可引入 branded type，但品牌仍只是编译期标记，必须在运行时验证后才赋予：

```ts
declare const issueKeyBrand: unique symbol;
type IssueKey = string & { readonly [issueKeyBrand]: true };
```

## 3. interface 与 type

二者都能描述对象：

```ts
interface Member {
  id: number;
  displayName: string;
}

type IssueStatus = "open" | "in_progress" | "resolved" | "closed";
type Assignment = Member | null;
```

常见选择：

- 可扩展的对象形状：`interface` 清楚；
- union、intersection、tuple、映射和别名：`type` 必须或更自然；
- 团队一致性比教条更重要。

接口声明可合并，type alias 不会。这一差异在扩展第三方声明时有用，但不应随意依赖全局合并。

## 4. null、undefined 与缺失

C# nullable reference types 主要区分可能为 null；JavaScript 还常见 undefined 和属性缺失。

```ts
type IssueUpdate = Partial<IssueInput>;

const keep = {};
const alsoKeep = { assigneeId: undefined };
const unassign = { assigneeId: null };
```

JSON.stringify 会省略对象属性中的 undefined，保留 null。对 PATCH 来说：

- 缺失：保持旧值；
- null：明确清除；
- value：明确替换。

即使 TypeScript 关闭或开启 `exactOptionalPropertyTypes` 会改变内存中的赋值检查，JSON 序列化语义仍需单独理解。

## 5. any 与 unknown

`any` 会让类型错误向下游扩散：

```ts
const raw: any = JSON.parse(source);
raw.assignee.displayName.toUpperCase(); // 编译器全部放行
```

`unknown` 要求先证明：

```ts
const raw: unknown = JSON.parse(source);

if (isRecord(raw) && typeof raw.title === "string") {
  raw.title.toUpperCase();
}
```

C# 类比可以理解为接收 `object`/`JsonElement` 后逐步检查，而不是直接把动态输入当作已验证 DTO。

在 `catch` 中错误也应视为 unknown：

```ts
try {
  await save();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown failure";
}
```

## 6. readonly 不等于运行时不可变

`Readonly<T>` 和 readonly array 阻止一部分编译期写操作：

```ts
function paginate<T>(items: readonly T[]) {
  return items.slice(0, 10);
}
```

但：

- 不自动深度 readonly；
- 不会调用 `Object.freeze`；
- JavaScript 或断言仍可能修改对象；
- 从网络重新得到的值也没有冻结。

Readonly 的价值是表达函数不应修改输入的 Contract。

## 7. enum 与 literal union

C# enum 有独立运行时表示；TypeScript 常用 string literal union：

```ts
const ISSUE_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
type IssueStatus = (typeof ISSUE_STATUSES)[number];
```

优点：

- JSON 值就是可读字符串；
- 常量数组可用于运行时 guard；
- 可从一个源派生类型；
- `Record<IssueStatus, ...>` 可检查映射是否完整。

后端仍需配置 JSON enum 字符串策略，并拒绝不期望的整数表示。

## 8. 泛型的相似与差异

`PagedResult<T>` 与 C# 泛型非常接近：都保留 item 类型关系。但 TypeScript 泛型在运行时被擦除，不能写“如果 T 是 Issue 就怎样”。

```ts
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}
```

若运行时需要区分，必须传入 decoder、predicate 或显式 tag。

## 9. 对象字面量额外属性检查

把对象字面量直接传给函数时，TypeScript 会执行额外属性检查；先放进变量后，结构兼容规则可能接受额外字段。这不是“类型系统忽然失效”，而是针对字面量拼写错误的额外保护。

实验：

```ts
type Heading = { key: string; title: string };
declare function show(value: Heading): void;

// 直接传递时观察额外属性诊断
// show({ key: 'IF-1', title: 'A', debugOnly: true });

const value = { key: "IF-1", title: "A", debugOnly: true };
show(value);
```

## 10. C# → TypeScript 快速对照

| C#                     | TypeScript                  | 关键差异                         |
| ---------------------- | --------------------------- | -------------------------------- |
| `record IssueDto`      | `interface Issue`           | TS 类型运行时擦除                |
| `enum IssueStatus`     | literal union               | JSON 字符串需双方约定            |
| `long`                 | `number`                    | 超过 safe integer 会失真         |
| `DateOnly?`            | `string                     | null`                            | 必须验证 YYYY-MM-DD |
| `DateTimeOffset`       | `string`                    | 必须验证带 offset 的 ISO instant |
| `Dictionary<K,V>`      | `Record<K,V>` / Map         | Record key 受 JS 属性规则限制    |
| `IReadOnlyList<T>`     | `readonly T[]`              | 主要是浅层编译期限制             |
| `object` / JsonElement | `unknown`                   | 都需要检查后使用                 |
| DTO validation         | decoder + domain validation | 类型标注本身不验证               |

## 实验

1. 在 [compile-time-examples.ts](../../frontend/src/features/typescript-lab/compile-time-examples.ts) 增加一个结构兼容成功例。
2. 再增加一个 `@ts-expect-error`，证明错误字段类型被拒绝。
3. 在 [examples.test.ts](../../frontend/src/features/typescript-lab/examples.test.ts) 给同样输入写运行时检查。
4. 解释为什么前两个测试不能替代第三个。

## 本章验收

- [ ] 能解释类型擦除。
- [ ] 能举例说明结构类型。
- [ ] 能区分 optional、undefined、null 和缺失。
- [ ] 能说明为何外部输入从 unknown 开始。
- [ ] 能列出 C# long、DateOnly 和 DateTimeOffset 的前端风险。

[上一页：TypeScript 索引](README.md) · [下一章：领域建模、联合类型与收窄](02-domain-modeling-and-narrowing.md)
