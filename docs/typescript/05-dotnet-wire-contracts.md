# 05：.NET 与 TypeScript Wire Contract

## 本章目标

本章逐项对齐 C# DTO、JSON 和 TypeScript。重点不是“名字看起来一样”，而是数值范围、日期语义、枚举、null、PATCH presence 和错误响应。

核心文件：

- [.NET IssueContracts.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Features/Issues/IssueContracts.cs)
- [.NET IssueMapping.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Features/Issues/IssueMapping.cs)
- [TypeScript types.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/issues/types.ts)
- [TypeScript wire examples](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/examples.ts)

## 1. 契约表

| .NET               | JSON                  | TypeScript           | 风险                        |
| ------------------ | --------------------- | -------------------- | --------------------------- |
| `long`             | number                | `number`             | 仅安全到 2^53−1             |
| `IssueStatus`      | `"in_progress"`       | literal union        | casing/snake_case/整数 enum |
| `DateOnly?`        | `"YYYY-MM-DD"` / null | `string              | null`                       | 日历日不能随意转 UTC |
| `DateTimeOffset`   | ISO 8601              | `string`             | 必须带 Z 或 offset          |
| nullable DTO       | object / null         | `Member              | null`                       | null 与缺失不同      |
| `IReadOnlyList<T>` | array                 | `T[]` / readonly T[] | JSON 数组运行时可变         |
| `PagedResult<T>`   | object                | `PagedResult<T>`     | camelCase 与分页含义        |
| Validation Problem | errors dictionary     | `FieldErrors`        | key casing 和未知字段       |
| 204                | 空 body               | `Promise<void>`      | 不能调用 response.json      |

## 2. long 与 JavaScript number

JavaScript number 使用 IEEE-754 double。整数只在：

```text
-(2^53 - 1) 到 +(2^53 - 1)
```

范围内精确。检查：

```ts
Number.isSafeInteger(id) && id > 0;
```

`9007199254740992` 可能与相邻整数无法区分。若后端 ID 未来可能超过范围，应尽早在 wire 上改为 string：

```json
{ "id": "9223372036854775807" }
```

不要用 BigInt 直接 JSON.stringify；标准 JSON 没有 BigInt 类型，需要字符串协议。

## 3. DateOnly 是日历日

截止日期 `2026-09-15` 表示一个日历格，不是东京或 UTC 的瞬间。

错误做法：

```ts
new Date("2026-09-15").toISOString();
```

这会引入时区和 instant 语义。更稳妥：

- wire 保持 YYYY-MM-DD；
- decoder 验证是真实日期；
- UI 用本地化展示但保留原值提交；
- 比较“今天”时明确用户/业务时区。

项目 `isCalendarDate` 不仅用正则，还重建 UTC 日期验证 2 月 30 日等不可能日期。

## 4. DateTimeOffset 是 instant

createdAt/updatedAt 表示时间线上的时刻，应带 `Z` 或 `+09:00`：

```text
2026-08-27T09:00:00Z
2026-08-27T18:00:00+09:00
```

二者可表示同一 instant。展示时可本地化，排序时比较 instant。

没有 offset 的 `2026-08-27T09:00:00` 语义不明确，Lab decoder 会拒绝。

SQLite 路径将 DateTimeOffset 持久化为 Unix 毫秒，因此恢复时会统一到 UTC，并失去原 offset 与亚毫秒精度。Contract 应关心 instant 相等，而非原始文本完全相同。

## 5. Enum 字符串

.NET 必须明确 JSON enum 策略，前端期待：

```json
{ "status": "in_progress", "priority": "critical" }
```

测试应覆盖：

- 四个合法值；
- 大小写差异；
- `in-progress` vs `in_progress`；
- 未知 string；
- integer enum；
- 后端新增值而前端旧版本尚未认识。

对未知新值，是拒绝整个对象、显示 Unknown，还是保留 raw 值，需要产品决策。当前严格 union/decoder 选择拒绝。

## 6. Entity 不等于 DTO

.NET Entity 还可能包含：

- NormalizedTitle；
- TagsJson；
- 外键；
- 导航属性；
- 并发或存储细节。

响应 DTO 通过 Mapping 只暴露 Contract，并派生 `IF-{id}`。不要直接序列化 EF Entity，否则数据库演进会意外改变前端协议或形成引用循环。

## 7. PATCH presence

TypeScript：

```ts
type IssueUpdate = Partial<IssueInput>;
```

C# 后端使用能追踪属性是否出现的 PATCH DTO。关键三态：

| JSON                  | C# 意义         | TypeScript 构造        |
| --------------------- | --------------- | ---------------------- |
| `{}`                  | 不更新 assignee | `{}`                   |
| `{"assigneeId":null}` | 取消负责人      | `{ assigneeId: null }` |
| `{"assigneeId":2}`    | 设置为 2        | `{ assigneeId: 2 }`    |

对非 nullable title，`{"title":null}` 不是“没提供”，而是“提供了非法 null”。

## 8. camelCase 与命名

C# 属性常为 PascalCase，JSON 配置输出 camelCase，TypeScript 直接使用 camelCase。字段名是 wire contract，不应由 Entity 名字偶然决定。

错误字典的 key 也应与表单字段一致。若后端输出 `Title` 而前端读取 `title`，错误不会显示到正确字段。

## 9. Problem Details

客户端期望至少能读取：

```json
{
  "title": "Validation failed",
  "detail": "Please correct the highlighted fields.",
  "status": 400,
  "instance": "/api/issues",
  "traceId": "...",
  "errors": {
    "title": ["Title is required."]
  }
}
```

不同错误不一定都有 errors。客户端应：

- 优先 detail/title 作为消息；
- 保留 status；
- 字段错误仅在存在且形状正确时使用；
- 不向用户暴露敏感内部 exception；
- 日志可带 traceId 便于关联。

当前 `request<T>` 对错误体也用了断言，这是另一个可增加 decoder 的边界。

## 10. Contract 测试矩阵

对 .NET API 与同源 API 运行同一组黑盒测试：

1. 响应字段及 nullability；
2. 四个 enum 的 wire 值；
3. safe integer ID；
4. DateOnly 最小/闰日/非法日；
5. DateTimeOffset Z/正负 offset/缺 offset；
6. PATCH omitted/null/value；
7. 204 空 body；
8. 400/401/404/409/415 Problem；
9. 未知字段策略；
10. Tags 规范化。

测试发现差异后，选择统一实现或文档化差异，不能默默让 UI 依赖某一个偶然行为。

## 11. 演进策略

新增字段时：

- response 的可选新增字段通常较容易向后兼容；
- 删除/改名/改变 nullability 是破坏性变更；
- union 新成员可能让旧客户端 decoder 失败；
- ID 从 number 改 string 影响 URL、Query key、Map 和数据库；
- 日期语义变化比格式变化更危险。

在同一仓库中仍要做 Contract 迁移顺序，不能假设前后端总是同时发布。

## 本章验收

- [ ] 能解释 long 超 safe integer 的风险。
- [ ] 能区分 DateOnly 与 DateTimeOffset。
- [ ] 能证明 PATCH 的三态。
- [ ] 能从 Entity 追到 DTO、JSON 和 TypeScript。
- [ ] 能设计跨两种 API 的 Contract 测试表。

[上一章：unknown、Decoder 与运行时边界](04-runtime-boundaries.md) · [下一章：TypeScript Lab 实验手册](06-lab-workbook.md)
