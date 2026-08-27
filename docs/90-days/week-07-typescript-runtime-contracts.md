# 第 7 周：TypeScript 运行时边界与 Wire Contract

TypeScript 类型在编译后会被擦除。HTTP、JSON、URL、DOM、localStorage、环境变量和异常对象
不会因为写了 interface 就自动可信。本周建立一条明确的数据管线：

```text
unknown → parse → wire decode → typed value → domain validation → application
```

## 本周成果

- 找出 IssueFlow 中所有主要运行时输入边界；
- 编写可组合、无 `any` 的 Decoder；
- 区分 JSON 语法、wire shape、领域规则和 HTTP 失败；
- 验证数组、嵌套对象、日期、ID、枚举和错误响应；
- 对齐 C# DTO、JSON 与 TypeScript 类型；
- 为一个真实 Issue endpoint 建立 decoder 驱动的 API 边界。

配套阅读：[unknown、Decoder 与运行时边界](../typescript/04-runtime-boundaries.md)、
[.NET 与 TypeScript Wire Contract](../typescript/05-dotnet-wire-contracts.md)、
[TypeScript 错误调试指南](../typescript/09-type-error-debugging.md)。

---

## Day 43：边界审计——类型从哪里开始不可信

### 今日目标

把仓库中的外部输入逐一定位，并给当前信任方式分级。

### 完整 120 分钟

| 时间    | 活动                                                      | 产物           |
| ------- | --------------------------------------------------------- | -------------- |
| 0–15    | 写出浏览器应用至少 6 个外部输入源                         | 边界清单       |
| 15–35   | 复习 any、unknown、assertion、guard、decoder              | 证据强度阶梯   |
| 35–65   | 搜索 JSON.parse、response.json、DOM cast、URL、env、catch | 源码位置表     |
| 65–85   | 运行 Lab `runtime-vs-types` 的畸形 payload                | 失败记录       |
| 85–110  | 独立审计 `issueflowApi.ts` 的所有断言                     | 风险与改进建议 |
| 110–120 | 选定本周要保护的 endpoint                                 | 范围声明       |

### 概念与源码

重点阅读：

- `request<T>()`：`response.json() as Promise<T>`；
- `readDatabase()`：localStorage JSON 被断言为 `LocalDatabase`；
- `getStoredSession()`：保存的 Session 被直接断言；
- `IssueForm`、`BoardPage`：select string 被断言为领域 union；
- `TypeScriptLabPage.readProgress()`：先转 unknown，再过滤内容。

把每个位置标为：无检查、局部 guard、完整 decoder、业务 validation。

### 编译期负例与运行实验

```ts
declare const raw: unknown;

// @ts-expect-error unknown 未被证明为 object
raw.title;
```

分别给 Lab 输入：JSON 语法错误、合法 JSON string、array、缺字段 object、合法 Issue preview。
记录失败发生在 parse 还是 decode。

### 独立任务

为选定 endpoint 写 Contract 表：HTTP method、path、成功状态、204、成功 body、错误 body、
nullability、枚举、ID、日期和未知字段策略。

### 验收证据

- [ ] 审计表至少包含 HTTP、localStorage、URL、DOM、catch、env 六类边界。
- [ ] 每个断言都有“证据来源”或“待改进”结论。
- [ ] 能解释泛型 `T` 为什么不是运行验证。
- [ ] 本周 endpoint 范围明确，不能临时扩成全部 API。

---

## Day 44：Decoder 协议与第一个对象 Decoder

### 今日目标

把 unknown 转成带成功或失败证据的结果，避免返回半验证对象。

### 完整 120 分钟

| 时间    | 活动                                      | 产物             |
| ------- | ----------------------------------------- | ---------------- |
| 0–15    | 预测 typeof 对 null、array、object 的结果 | 预测表           |
| 15–40   | 学习 DecodeResult、Decoder、isRecord      | 类型定义与流程图 |
| 40–75   | 逐字段阅读 `decodeIssuePreview`           | 字段验证表       |
| 75–95   | 输入六类对象并观察累积错误                | Runner 记录      |
| 95–110  | 独立实现 `decodeMemberPreview`            | decoder 与测试   |
| 110–120 | 审查断言是否位于验证之后                  | 断言证据记录     |

### Decoder 基本形状

```ts
type DecodeResult<T> =
  { ok: true; value: T } | { ok: false; errors: readonly string[] };

type Decoder<T> = (value: unknown, path?: string) => DecodeResult<T>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
```

成功分支中的 T 必须来自每个字段的运行检查。泛型声明本身不能把 unknown 变成 T。

### 编译期负例与运行实验

```ts
function unsafeDecode(value: unknown): DecodeResult<IssuePreview> {
  // @ts-expect-error unknown 仍不能作为 IssuePreview
  return { ok: true, value };
}
```

测试 null、[]、`"issue"`、`{id:'248'}`、缺 displayName 的 assignee、合法 Member。

### 独立任务

`decodeMemberPreview` 至少检查正整数 id、非空 displayName、合法 email string、avatarUrl 的
null/string 两态。采用 accumulate 策略，错误包含字段路径。

### 验收证据

- [ ] decoder 无 `any` 和无证据的领域断言。
- [ ] null 与 array 不会误判为 record。
- [ ] 至少 6 个运行输入，其中 2 个成功、4 个失败。
- [ ] 成功分支的 value 能被 `expectTypeOf` 识别。

---

## Day 45：组合 Decoder、数组与嵌套错误路径

### 今日目标

避免为每个 DTO 重写同样的检查，并让错误能定位到 `items[2].assignee.displayName`。

### 完整 120 分钟

| 时间    | 活动                                                 | 产物         |
| ------- | ---------------------------------------------------- | ------------ |
| 0–15    | 列出 tags、assignee、PagedResult 的嵌套层级          | 数据树       |
| 15–40   | 学习 primitive、nullable、array、object decoder 组合 | 组合图       |
| 40–70   | 实现 decodeString、decodeNullable、decodeArray       | 三个组合器   |
| 70–90   | 对混合数组运行 fail-fast 与 accumulate               | 行为对照     |
| 90–110  | 独立实现 `decodePagedResult(decodeItem)`             | 泛型 decoder |
| 110–120 | 复盘错误路径和大输入成本                             | 策略说明     |

### 核心模式

```ts
function decodeArray<T>(itemDecoder: Decoder<T>): Decoder<readonly T[]> {
  return (value, path = "$") => {
    if (!Array.isArray(value)) {
      return { ok: false, errors: [`${path} must be an array`] };
    }

    const items: T[] = [];
    const errors: string[] = [];
    value.forEach((item, index) => {
      const result = itemDecoder(item, `${path}[${index}]`);
      if (result.ok) items.push(result.value);
      else errors.push(...result.errors);
    });

    return errors.length ? { ok: false, errors } : { ok: true, value: items };
  };
}
```

### 编译期负例与运行实验

```ts
declare const rawTags: unknown;

// @ts-expect-error unknown 未证明为数组
rawTags.every((tag) => typeof tag === "string");
```

运行输入包含：items 不是 array、第二项 id 错误、assignee 为 null、assignee 缺字段、total 为
string、空 page。比较错误能否精确指出元素位置。

### 独立任务

完成 `decodePagedResult(decodeIssuePreview)`。不要把 page/pageSize/total 只检查成 number；还要明确
是否允许 0、负数、小数和超 safe integer。

### 验收证据

- [ ] 一个 item 错误不会被误报成整个 response 不是 object。
- [ ] 错误包含完整字段路径。
- [ ] 空 items 合法；畸形元素失败。
- [ ] 能说明 accumulate 与 fail-fast 的适用场景。

---

## Day 46：Wire Decode、领域 Validation 与未知字段策略

### 今日目标

区分“字段类型正确”和“业务允许”，并为 unknown key 做明确决策。

### 完整 120 分钟

| 时间    | 活动                                               | 产物                     |
| ------- | -------------------------------------------------- | ------------------------ |
| 0–15    | 给 101 字标题判断应在哪层失败                      | 预测与理由               |
| 15–35   | 阅读 `decodeIssueInputPatch`、`validateIssue`      | 两层职责表               |
| 35–65   | 运行 Lab `validation` 的输入矩阵                   | parse/decode/validate 表 |
| 65–85   | 实验 strict、strip、preserve 三种 unknown key 策略 | 行为对照                 |
| 85–110  | 独立补标题和日期边界测试                           | 表驱动测试               |
| 110–120 | 写出写入与读取 Contract 的策略差别                 | 决策记录                 |

### 分层管线

```text
JSON 文本
  → JSON.parse：语法是否成立
  → Decoder：字段和 wire shape 是否成立
  → validateIssue：长度、过去日期等业务规则
  → Endpoint：权限、冲突和持久化规则
```

### 编译期负例与运行实验

```ts
declare const raw: unknown;

// @ts-expect-error 领域 validator 只接收完成解码的 IssueInput
validateIssue(raw);
```

至少运行：`{title:42}`、空白 title、99/100/101 字 title、2 月 30 日、过去日期、
`{unknownField:true}`。为每个输入标注失败层。

### 独立任务

为写入 patch 选择 strict 策略；为响应新增字段讨论 strict 与 strip 的兼容性。写一个测试证明
拼错 `assigneId` 不会被静默当成成功更新。

### 验收证据

- [ ] 99、100、101 字标题有表驱动测试。
- [ ] wire 类型错误与业务规则错误使用不同描述。
- [ ] unknown key 策略被代码和测试共同表达。
- [ ] 能解释为什么前后端都必须验证。

---

## Day 47：浏览器边界——URL、DOM 与 localStorage

### 今日目标

把浏览器 API 返回的 string/unknown 安全地转成领域值，并设计损坏数据的恢复行为。

### 完整 120 分钟

| 时间    | 活动                                                   | 产物         |
| ------- | ------------------------------------------------------ | ------------ |
| 0–15    | 列出 URL、select、number input、storage 的真实返回类型 | 边界表       |
| 15–35   | 阅读 IssuesPage 参数解析和 `readProgress`              | 源码批注     |
| 35–65   | 运行 query-builder 的编码与非法枚举实验                | URL 输入矩阵 |
| 65–85   | 向 select 伪造 blocked，向 storage 注入损坏 JSON       | 运行记录     |
| 85–110  | 独立实现 parsePositiveId 和 decodeProgress             | 工具与测试   |
| 110–120 | 定义损坏 storage 的恢复策略                            | 决策日志     |

### 示例与负例

```ts
const rawStatus = params.get("status");
const status = isIssueStatus(rawStatus) ? rawStatus : undefined;

// @ts-expect-error URL 参数仍是 string | null
const unsafeStatus: IssueStatus = params.get("status");
```

`<select>` 的 value 永远是 string。选项由 `ISSUE_STATUSES` 生成会降低正常交互出错概率，
但脚本、测试或未来 DOM 改动仍能产生非法值。

### 独立任务

给 progress decoder 输入：无值、坏 JSON、object、混合 array、未知 lesson ID、合法 ID。
返回只包含当前 catalog 中的 string ID。再为 URL page 测试空、0、负数、小数、极大值。

### 验收证据

- [ ] 特殊搜索文本 `&`、`+`、空格和中文可往返。
- [ ] forged select value 不进入领域 state。
- [ ] 损坏 progress 不导致页面崩溃。
- [ ] 无 truthiness 代替正整数验证。

---

## Day 48：.NET、JSON 与 TypeScript Wire Contract

### 今日目标

逐字段对齐 C# DTO、JSON 和 TypeScript，理解同名类型仍可能具有不同数值或时间语义。

### 完整 120 分钟

| 时间    | 活动                                                | 产物              |
| ------- | --------------------------------------------------- | ----------------- |
| 0–15    | 预测 C# long、DateOnly、DateTimeOffset 的 JSON 形状 | 预测表            |
| 15–40   | 阅读 IssueContracts.cs 与 TS types.ts               | 三列 Contract 表  |
| 40–65   | 运行 Lab `wire-scalars` 的 ID/日期/instant 矩阵     | 运行证据          |
| 65–85   | 对照 PATCH DTO 的 Has* 属性和 TS Partial            | presence 表       |
| 85–110  | 阅读 ApiContractTests 的 400/404/409/204 用例       | Contract 测试地图 |
| 110–120 | 写出一个兼容演进策略                                | 决策记录          |

### 关键差异

- C# `long` 只有在 `Number.isSafeInteger` 范围内才能安全映射为 number；
- `DateOnly` 是日历格，不是 UTC instant；
- `DateTimeOffset` 必须带 `Z` 或 offset；
- enum 的 casing、snake_case 和整数表示必须由 wire 约定；
- PATCH 的省略、null、value 是三个不同动作；
- 204 没有 JSON body；Problem Details 不保证总有 field errors。

### 编译期负例与运行实验

```ts
declare const unchecked: string;

// @ts-expect-error 普通 string 尚未通过 CalendarDate decoder
const date: CalendarDate = unchecked;

// @ts-expect-error null 不是合法 title 更新
const patch: IssueUpdate = { title: null };
```

测试 ID 0、1.5、`Number.MAX_SAFE_INTEGER + 1`；日期 2028-02-29、2026-02-29；
instant 带 Z、+09:00、无 offset；PATCH `{}`、null、value。

### 独立任务

完成 `.NET → JSON → TypeScript → runtime check` 表，至少包含 Issue、Member、PagedResult、
Problem Details、204。再说明若 ID 改为 string，会影响 Router、Query key、Map、DTO 和数据库的哪些位置。

### 验收证据

- [ ] 至少 12 个 wire scalar 输入有实际结果。
- [ ] 能解释两个文本不同但表示同一 instant 的时间戳。
- [ ] PATCH 三态与 C# Has* 标志逐项对应。
- [ ] Contract 表不把 Entity 当作公开 DTO。

---

## Day 49：周项目——Decoder 驱动的 API 边界

### 今日目标

为一个真实 endpoint 建立从 HTTP 到 typed value 的完整防线，不一次性重写全部 API。

### 完整 120 分钟

| 时间    | 活动                                          | 产物             |
| ------- | --------------------------------------------- | ---------------- |
| 0–15    | 重读 Day 43 的 endpoint Contract              | 最终范围         |
| 15–30   | 设计 request、requestVoid、ContractError 接口 | 接口草图         |
| 30–70   | 接入一个 endpoint decoder                     | 纵向实现         |
| 70–95   | 测合法 200、畸形 200、404、非 JSON、204       | API adapter 测试 |
| 95–110  | 运行 typecheck、Vitest 和适用 Contract tests  | 命令输出         |
| 110–120 | 写迁移清单和失败复盘                          | 周总结           |

### 推荐接口

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

不要继续使用 `undefined as T` 处理 204。使用单独的 `requestVoid`，或让 endpoint specification
明确区分 body/no-body。

### 周交付物

选择 `GET /api/issues/{id}` 或 `GET /api/members` 中一个，交付：

1. 成功 body decoder；
2. Problem Details decoder；
3. typed ContractError；
4. request 与 no-content 策略；
5. 合法和畸形 response 测试；
6. 剩余 endpoint 的渐进迁移顺序。

### 过关标准

- [ ] 选定 endpoint 不再用 `response.json() as Promise<T>` 取得信任。
- [ ] 畸形 200 被分类为 Contract 错误，而不是渲染时崩溃。
- [ ] 404、HTML 500、无效 JSON、网络失败有不同证据。
- [ ] decoder 和 adapter 测试至少 15 个运行用例。
- [ ] 没有记录完整敏感 response 作为错误日志。
- [ ] typecheck、相关 Vitest 和适用的 .NET Contract 测试通过。

未过关时，先缩小到一个简单 DTO，不要通过恢复泛型断言绕开问题。

[上一周：领域建模与泛型](week-06-typescript-modeling-generics.md) ·
[下一周：React 与 TypeScript](week-08-react-typescript.md) ·
[返回课程总览](./)
