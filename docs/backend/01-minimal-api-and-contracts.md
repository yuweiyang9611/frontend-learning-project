# 01：Minimal API 与 HTTP Contract

## 本章目标

本章从 [Program.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Program.cs) 启动过程追踪到 Issues Endpoint，理解服务注册、中间件、路由绑定、DTO、状态码和 PATCH 语义。

## 1. 启动过程

ASP.NET Core 应用分两阶段：

### 注册服务

`builder.Services` 配置依赖注入：

- Problem Details；
- OpenAPI；
- EF Core SQLite；
- ASP.NET Core Identity；
- Cookie 行为；
- CORS；
- 附件存储等应用服务。

### 组装请求管线

`app.Use...` 与 `app.Map...` 决定请求经过哪些中间件和最终 Endpoint。顺序会影响异常、HTTPS、CORS、认证和授权。

把“注册服务”和“执行中间件”混为一谈，会导致“明明 AddCors 了为什么浏览器仍失败”之类问题。

## 2. 模块化 Endpoint

领域路由分别位于：

- [IssueEndpoints.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Features/Issues/IssueEndpoints.cs)
- [MemberEndpoints.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Features/Members/MemberEndpoints.cs)
- [CommentEndpoints.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Features/Comments/CommentEndpoints.cs)
- [AttachmentEndpoints.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Features/Attachments/AttachmentEndpoints.cs)
- [AuthEndpoints.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Features/Authentication/AuthEndpoints.cs)

Program 负责横切配置，Feature 文件负责资源行为。这样比把所有 Lambda 塞进 Program 更容易阅读和测试。

## 3. HTTP 资源矩阵

| 方法     | 路径                                    | 成功           | 写操作认证 |
| -------- | --------------------------------------- | -------------- | ---------- |
| GET      | `/api/issues`                           | 200 + page     | 否         |
| GET      | `/api/issues/{id}`                      | 200            | 否         |
| POST     | `/api/issues`                           | 201 + Location | 是         |
| PATCH    | `/api/issues/{id}`                      | 200            | 是         |
| DELETE   | `/api/issues/{id}`                      | 204            | 是         |
| GET/POST | `/api/issues/{id}/comments`             | 200/201        | POST 是    |
| DELETE   | `/api/issues/{id}/comments/{commentId}` | 204            | 是         |
| GET/POST | `/api/issues/{id}/attachments`          | 200/201        | POST 是    |
| GET      | `/api/attachments/{id}`                 | 文件           | 否         |
| POST     | `/api/auth/login`                       | 200            | 否         |
| GET      | `/api/auth/session`                     | 200            | 是         |
| POST     | `/api/auth/logout`                      | 204            | 会话相关   |

`Produces*` 元数据让 OpenAPI 描述可能响应，但实际行为仍需测试。

## 4. 参数绑定

Minimal API 可从不同来源绑定：

- Route：`{id:long}`；
- Query：page、status、sortBy；
- JSON Body：Create/Patch request；
- Form：`IFormFile`；
- DI：`AppDbContext`、`UserManager`；
- Cancellation：`CancellationToken`。

不要因为参数“自动绑定”就省略验证。绑定失败与业务验证都应返回稳定的 Problem Details。

## 5. Entity、Request、Response 分离

Issue 的层次：

```text
JSON Request
  → CreateIssueRequest / UpdateIssueRequest
  → validation
  → Issue Entity + relations
  → IssueMapping
  → IssueResponse
  → camelCase JSON
```

Entity 可能包含 NormalizedTitle、TagsJson 和导航属性，这些不应泄露给前端。Response 可以派生 `IF-{id}` 并只暴露稳定字段。

## 6. 查询 Contract

列表支持 page、pageSize、search、status、priority、assigneeId、sortBy、sortDirection。

服务端必须验证：

- page ≥ 1；
- pageSize 1–100；
- search 长度；
- enum/string 值；
- assignee ID；
- sort field 与方向。

非法查询返回字段化 400，不应默默变成另一条合法查询。前端才能区分用户输入错误和空数据。

## 7. PATCH presence

普通 nullable 属性难以单独表示“没出现”和“出现为 null”。后端 Update DTO 追踪 presence：

| JSON                    | 行为                            |
| ----------------------- | ------------------------------- |
| `{}`                    | 当前 canonical API 拒绝空 patch |
| `{"status":"resolved"}` | 只更新 status                   |
| `{"assigneeId":null}`   | 清除 assignee                   |
| `{"assigneeId":2}`      | 设置 assignee                   |
| `{"title":null}`        | 已提供非法 null，返回 400       |

前端 `undefined` 属性会被 JSON.stringify 省略，因此不要把 undefined 和 null 当同义词。

## 8. 状态码与 Location

- POST 创建资源返回 201，并用 Location 指向新资源；
- DELETE 成功返回 204，无响应体；
- 验证失败 400；
- 未登录 401；
- 找不到 404；
- 标题冲突 409；
- 媒体类型不支持 415。

客户端 `request<void>` 对 204 特别处理，否则调用 `response.json()` 会失败。

## 9. 练习：从 OpenAPI 反查源码

1. 启动 Development API；
2. 打开 `/openapi/v1.json`；
3. 选 POST issues，记录 request schema 和响应；
4. 在 Endpoint 找到 route 与 Produces；
5. 在 Contracts 找 DTO；
6. 在 Validation 找规则；
7. 在 Mapping 找 response；
8. 用集成测试验证 201、400、401、409。

## 10. 复盘

- DI 参数与 HTTP 参数怎样区分？
- 为什么 Entity 不能直接作为 API response？
- Produces 元数据和自动化测试各证明什么？
- 空 PATCH 为什么是业务规则而非仅类型问题？
- CancellationToken 应向哪些数据库/IO 调用传播？

[后端索引](README.md) · [下一章：EF Core、SQLite 与数据建模](02-ef-core-and-data.md)
