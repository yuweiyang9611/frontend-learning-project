# 04：unknown、Decoder 与运行时边界

## 本章目标

本章回答：“TypeScript 已经通过了，为什么运行时仍会坏？”你将从 JSON、URL、DOM、localStorage 和错误对象这些边界出发，写出能产生证据的 Decoder。

## 1. 边界清单

进入应用的外部值包括：

- `response.json()`；
- `JSON.parse(localStorageValue)`；
- URL path/query；
- 表单与 select 的 string；
- 上传文件元数据；
- `catch (error)`；
- 第三方库回调；
- 环境变量。

它们都不因为 TypeScript 类型声明而可信。

## 2. 当前生产 client 的教学张力

[issueflowApi.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/api/issueflowApi.ts) 当前写法：

```ts
async function request<T>(...): Promise<T> {
  // ...
  return response.json() as Promise<T>;
}
```

泛型让调用方获得良好类型，但运行时完全信任响应。它适合展示“类型化 client”与“已验证数据”不是同义词。

Lab 的 [decodeIssuePreview](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/examples.ts) 则把 JSON 作为 unknown，逐字段证明后返回。改进生产边界时，应让 `request` 接受 decoder，或在每个 endpoint 响应后调用 schema/decoder。

## 3. Decoder 的基本形状

项目用判别联合表示结果：

```ts
type DecodeResult<T> =
  | { ok: true; value: T; notes: readonly string[] }
  | { ok: false; error: string; notes: readonly string[] };
```

Decoder 是：

```ts
type Decoder<T> = (value: unknown) => DecodeResult<T>;
```

它做三件事：

1. 检查运行时形状；
2. 将错误保留为数据，而不是任意 throw；
3. 成功时把 unknown 收窄为 T。

## 4. 从 object 开始

`typeof null === 'object'`，数组也是 object，所以项目先定义：

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
```

进入分支后可以读取 `value.title`，但字段仍是 unknown，必须继续检查。

## 5. 字段逐项验证

Issue Preview 至少检查：

- id：正的 safe integer；
- key：匹配 `IF-<正整数>`；
- title：非空 string；
- status/priority：通过 union guard；
- assignee：null 或含 displayName 的 object。

注意“检查了 object”不等于嵌套字段安全。

错误策略可选：

- fail fast：发现第一个错误立即返回；
- accumulate：收集所有字段错误后返回。

Lab 采用 accumulate，便于学习；高风险或超大输入可考虑尽早终止。

## 6. Decoder 与领域校验不同

输入要经过两层：

```text
unknown
  → wire decoder（字段类型/JSON 形状）
  → typed value
  → domain validation（标题长度、日期不能过去等）
  → accepted domain input
```

例如 title 为 200 字符：

- 它是合法 string，所以通过 wire decoder；
- 它违反 100 字符业务规则，所以被 `validateIssue` 拒绝。

把两层分开能得到更准确错误，也便于复用。

## 7. Unknown key 策略

[decodeIssueInputPatch](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/examples.ts) 拒绝未知字段。API 演进时有三种策略：

- strict：未知字段失败，适合写入和安全敏感输入；
- strip：忽略未知字段，适合某些向前兼容读取；
- preserve：保留扩展字段，适合代理或开放模型。

不能无意识决定。写操作若静默忽略拼错字段，客户端可能以为修改成功。

## 8. 数组与嵌套对象

检查 tags：

```ts
if (
  Array.isArray(value.tags) &&
  value.tags.every((tag) => typeof tag === "string")
) {
  patch.tags = value.tags;
}
```

这只证明元素是 string，仍未处理：

- 最大数量；
- 每个长度；
- 去重；
- 大小写；
- 空字符串；
- 总 payload 大小。

这些属于业务或资源限制。

## 9. 解析 JSON 的错误

`JSON.parse` 自身会 throw，且成功结果仍是未知：

```ts
function decodeJson<T>(source: string, decoder: Decoder<T>): DecodeResult<T> {
  try {
    return decoder(JSON.parse(source) as unknown);
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid JSON",
      notes: [],
    };
  }
}
```

解析成功只证明语法是 JSON，不证明领域形状。

## 10. 一个可演进的 request

概念设计：

```ts
async function request<T>(
  path: string,
  decode: Decoder<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) throw await decodeProblem(response);
  if (response.status === 204) {
    throw new Error("Use a dedicated no-content request");
  }
  const result = decode(await response.json());
  if (!result.ok) throw new ContractError(path, result.error);
  return result.value;
}
```

真实实现还要决定：

- 204 如何类型化；
- decoder 错误是否记录 response sample；
- 日志怎样避免泄露个人信息；
- 是否区分网络、HTTP、JSON syntax 和 Contract 错误；
- 大响应和取消如何处理。

## 11. 类型断言的合格证据

断言不是永远禁止，但应能回答“为什么成立”：

- DOM API 的类型缺陷，但先有运行时条件；
- 库定义比真实能力更窄；
- decoder 已逐字段检查，最终组装时帮助编译器；
- test fixture 有单独验证。

“为了消除红线”不是证据。优先缩小断言范围，并为它附近的边界写测试。

## 12. Fuzz/表驱动练习

为 `decodeIssuePreview` 至少覆盖：

| 输入                              | 预期       |
| --------------------------------- | ---------- |
| null / array / string             | 非 object  |
| id 0、负数、小数、超 safe integer | 拒绝       |
| key `IF-0`、`issue-1`             | 拒绝       |
| 空/空白 title                     | 拒绝       |
| 未知 status/priority              | 拒绝       |
| assignee null                     | 接受       |
| assignee 缺 displayName           | 拒绝       |
| 多余字段                          | 按明确策略 |

再用 property-based/fuzz 工具扩展是可选项；先把领域边界表写清。

## 本章验收

- [ ] 能列出至少五个运行时边界。
- [ ] 能解释生产 `request<T>` 当前信任了什么。
- [ ] 能区分 wire decode 与 domain validation。
- [ ] 能设计 strict/strip/preserve 策略。
- [ ] 能写一个无 any 的 Decoder 和表驱动测试。

[上一章：泛型、Utility Types 与 keyof](03-generics-utilities-and-keyof.md) · [下一章：.NET 与 TypeScript Wire Contract](05-dotnet-wire-contracts.md)
