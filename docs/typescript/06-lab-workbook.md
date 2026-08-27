# 06：TypeScript Lab 实验手册

## 本章目标

本手册对应 `/labs/typescript` 的 12 个可运行课程。每一课都要求先预测、再运行、改输入、读源码、补测试，避免只看结果。

## 1. 如何使用 Lab

启动：

```powershell
cd frontend
npm run dev
```

打开 `http://localhost:3000/labs/typescript`。课程选择保存在 URL，完成进度存于独立 localStorage，不会改变 Issue 产品数据。

每课记录：

1. 默认输入的预测；
2. 一个合法边界；
3. 一个非法边界；
4. 编译器能发现什么；
5. 运行时必须发现什么；
6. 对应生产源码；
7. 新增的测试。

## 2. 课程总表

| #   | 课程 ID                | 核心问题                      | 主要证据                      |
| --- | ---------------------- | ----------------------------- | ----------------------------- |
| 1   | `runtime-vs-types`     | 断言为何不验证 JSON           | decoder 拒绝畸形对象          |
| 2   | `structural-typing`    | 小形状为何可接收完整 Issue    | 两种结构都能 format           |
| 3   | `literal-unions`       | 常量如何生成 union 与穷尽映射 | 新状态触发编译错误            |
| 4   | `optional-null`        | 省略、null、value 怎样不同    | 三种 PATCH JSON               |
| 5   | `generics`             | 泛型如何保留 item 类型        | paginate/map/index            |
| 6   | `utility-types`        | 如何从领域模型派生视图/补丁   | Pick/Omit/Partial             |
| 7   | `keyof-fields`         | key 与 value 如何保持关联     | 错误字段值不编译              |
| 8   | `validation`           | decode 与业务校验如何分层     | JSON → patch → errors         |
| 9   | `query-builder`        | typed options 如何变 URL      | 默认省略、字符编码            |
| 10  | `array-pipeline`       | 如何无突变地筛选排序分页      | 源数组快照不变                |
| 11  | `wire-scalars`         | long/DateOnly/instant 的边界  | safe integer/日期 guard       |
| 12  | `unknown-state-errors` | 如何封闭 UI 与错误状态        | union + never + runtime range |

## 3. 第一课：TypeScript vs. runtime

默认 payload 应通过。依次修改：

- status 为 `blocked`；
- 删除 title；
- id 改成 string；
- assignee 只保留 id；
- JSON 写坏。

观察错误来自 JSON parse 还是 decoder。挑战：给 Preview 加 dueDate，复用 `isCalendarDate`，禁止 `as CalendarDate` 直接逃逸。

## 4. 第二课：Structural typing

比较完整 Issue 与只含 key/title 的 object。再试：

- 缺 title；
- title 为 number；
- 增加 debugOnly；
- 用 class 实例提供相同字段。

写一个 `cacheIdentity<T extends { id: number; updatedAt: string }>`，验证无需完整 Issue。

## 5. 第三课：Literal unions

运行合法和非法 status。随后在学习分支临时增加 `blocked`：

1. 修改常量；
2. 运行 typecheck；
3. 列出 `statusMeta`、switch、UI、后端的遗漏；
4. 补齐一部分观察错误消失；
5. 撤销或完整实现。

重点是影响传播，而不是只让 Lab 输出 blocked。

## 6. 第四课：Optional is not nullable

输入：

```text
keep
unassign
assign:2
assign:0
assign:Maya
```

对每项记录对象和 `JSON.stringify` 结果。挑战：为 dueDate 定义 keep/clear/set 三态，并与 C# PATCH DTO 对照。

## 7. 第五课：Generics

输入 `2,4`、`1,1`、`0,5`、`abc,2`。解释：

- 泛型为什么没有验证 page；
- paginate 怎样保护输入数组；
- mapPage 为什么需要 T 和 U；
- Map 的 value 如何保留 Member。

挑战：实现 `groupBy<T,K>` 并测试 symbol/string/number key。

## 8. 第六课：Utility types

对 `IssueSummary`、`IssueDraft`、`IssuePatch` 做 type-level 对照。然后：

- 尝试修改 Readonly；
- 修改嵌套 array，观察浅层限制；
- 给 applyPatch 传未知 key；
- 思考 Partial 是否允许空对象。

挑战：用 `expectTypeOf` 证明一个新视图类型，而不复制字段声明。

## 9. 第七课：keyof

输入：

```text
title=New title
description=A=B is preserved
priority=critical
priority=urgent
assigneeId=2
```

说明 runner 为什么只开放部分字段，以及 raw string 如何先被 guard。挑战：让配置决定 text/select/date 控件，但不要使用 any。

## 10. 第八课：Typed validation

至少测试：

```json
{}
{"title":"  "}
{"title":42}
{"status":"blocked"}
{"dueDate":"2000-01-01"}
{"dueDate":"2026-02-30"}
{"unknownField":true}
```

区分：

- wire shape 错误；
- 领域规则错误；
- 未知字段；
- 可接受的 partial override。

补充标题 99/100/101 的表驱动测试。

## 11. 第九课：Typed query builder

观察默认值不会进入 URL，特殊字符由 URLSearchParams 编码。测试：

- page 2；
- pageSize 101；
- status blocked；
- search 含 `&`、`+`、中文和空格；
- sortDirection 大写；
- unknown key。

挑战：新增 overdue boolean，从 unknown parser、IssueQuery、builder、URL 恢复一路贯通。

## 12. 第十课：Array pipeline

在运行前复制 source ID 顺序，运行后对比。测试相同排序值的稳定顺序、分页总数和搜索 tags。

注意：Lab 搜索包含 key/tags，而 .NET canonical API 当前只搜标题/描述，这是行为差异示例。

挑战：增加 assignee 过滤，并证明原 seed 数组 byte-for-byte 不变。

## 13. 第十一课：Wire scalars

输入矩阵：

| 值                   | 预期 |
| -------------------- | ---- |
| id 248               | 接受 |
| id 0/-1/1.5          | 拒绝 |
| id 9007199254740992  | 拒绝 |
| dueDate `2028-02-29` | 接受 |
| dueDate `2026-02-29` | 拒绝 |
| instant 带 Z/+09:00  | 接受 |
| instant 无 offset    | 拒绝 |

挑战：把 wire ID 设计成 string，列出 Query key、Router、Map、DTO 和数据库的迁移影响。

## 14. 第十二课：unknown/state/errors

输入 400、401、403、404、409、418、429、503，再输入 200、NaN、600。观察：

- 数值范围在运行时验证；
- 400 有/无 fields 产生不同 kind；
- switch 根据 kind 收窄；
- RemoteData 不允许矛盾组合。

挑战：为 RemoteData 增加 cancelled，故意先不改 describe 函数，让 assertNever 指出遗漏。

## 15. 三种测试

### 编译期

[compile-time-examples.ts](../../frontend/src/features/typescript-lab/compile-time-examples.ts) 用 `@ts-expect-error`。注释必须说明预期错误原因，避免把意外错误误认为成功。

### 运行时

[examples.test.ts](../../frontend/src/features/typescript-lab/examples.test.ts) 测 guard、decoder、pipeline 和 catalog。

### 页面/E2E

[TypeScriptLabPage.test.tsx](../../frontend/src/screens/TypeScriptLabPage.test.tsx) 测筛选、完成进度和可访问状态；[typescript-lab.spec.ts](../../frontend/e2e/typescript-lab.spec.ts) 测真实用户流程。

## 16. 新增第 13 课

推荐题目：“DOM select value 仍是 string”。

修改顺序：

1. 在 [examples.ts](../../frontend/src/features/typescript-lab/examples.ts) 写纯函数/guard；
2. 在 [catalog.ts](../../frontend/src/features/typescript-lab/catalog.ts) 加唯一 ID 和连续 order；
3. 在 compile-time 文件加正负例；
4. 在 examples test 加运行时边界；
5. 页面测试课程可检索、可运行、可完成；
6. E2E 只补关键用户路径；
7. 更新本手册与 [维护者指南](../maintainers/typescript-lab.md)；
8. 运行全部质量门。

不要让可编辑字符串通过 `eval` 执行。Runner 应是仓库中预编译、可审查、可测试的函数。

## 完成记录

- [ ] 12 课全部先预测后运行。
- [ ] 每课至少一个非法输入。
- [ ] 至少新增 6 个 runtime 边界测试。
- [ ] 至少新增 3 个 `@ts-expect-error` 负例。
- [ ] 完成一个类型驱动变更实验。
- [ ] 新增第 13 课并通过页面与类型检查。

[上一章：.NET 与 TypeScript Wire Contract](05-dotnet-wire-contracts.md) · [返回 TypeScript 索引](README.md)
