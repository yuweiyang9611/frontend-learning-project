## B.11 DTO 与 Entity 必须分离

至少：

```text
CreateIssueRequest
UpdateIssueRequest
IssueResponse
IssueListItemResponse
```

例如：

```csharp
public sealed record CreateIssueRequest(
    string Title,
    string? Description,
    IssuePriority Priority,
    long? AssigneeId,
    DateOnly? DueDate);
```

Response：

```csharp
public sealed record IssueResponse(
    long Id,
    string Title,
    string Description,
    IssueStatus Status,
    IssuePriority Priority,
    MemberSummary? Assignee,
    DateOnly? DueDate,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
```

必须建立：

```text
Database Entity
      ≠
HTTP API Contract
```

这种意识。

---

## B.12 REST Status Code 约定

| 操作 | 成功 | 常见失败 |
|---|---|---|
| GET List | 200 | 400 |
| GET Detail | 200 | 404 |
| POST | 201 | 400 / 401 |
| PATCH | 200 | 400 / 401 / 404 |
| DELETE | 204 | 401 / 404 |

POST 推荐返回：

```text
201 Created
Location Header
创建后的 IssueResponse
```

PATCH 本课程统一使用：

```text
200 + 更新后的 IssueResponse
```

这样更方便前端练 Mutation。

---

## B.13 Task B7：服务器分页

Request：

```http
GET /api/issues?page=1&pageSize=20
```

Response：

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 87
}
```

Contract：

```csharp
public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int Total);
```

规则：

```text
page >= 1
1 <= pageSize <= 100

默认：
page = 1
pageSize = 20
```

EF Core：

```text
CountAsync
OrderBy
Skip
Take
ToListAsync
```

注意：

> 分页前必须有稳定排序。

---

## B.14 Task B8：Search / Filter / Sort

最终：

```http
GET /api/issues
    ?page=1
    &pageSize=20
    &search=login
    &status=open
    &priority=high
    &assigneeId=2
    &sortBy=createdAt
    &sortDirection=desc
```

Search：

```text
Title
Description
```

Filter：

```text
status
priority
assigneeId
```

Sort 白名单：

```text
createdAt
updatedAt
title
priority
status
```

不要把用户的 `sortBy` 直接拼进 SQL。

这一阶段要建立完整链路：

```text
Browser URL
   ↓
URLSearchParams
   ↓
HTTP Query String
   ↓
ASP.NET Core Parameter Binding
   ↓
LINQ
   ↓
SQL
   ↓
JSON
   ↓
React
```

---

## B.15 Task B9：.NET 10 Minimal API Validation

.NET 10 提供 Minimal API 内置 Validation。

注册：

```csharp
builder.Services.AddValidation();
```

Request 使用 DataAnnotations：

```csharp
public sealed record CreateIssueRequest(
    [property: Required]
    [property: StringLength(120, MinimumLength = 1)]
    string Title,

    [property: StringLength(5000)]
    string? Description,

    IssuePriority Priority,
    long? AssigneeId,
    DateOnly? DueDate);
```

失败：

```http
400 Bad Request
```

前端不能只显示：

```text
Request failed
```

而应该将字段错误映射到：

```text
Title
Description
DueDate
```

对应输入框。

官方：

- Validation  
  https://learn.microsoft.com/en-us/aspnet/core/validation/overview?view=aspnetcore-10.0
- ASP.NET Core .NET 10 新功能  
  https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0?view=aspnetcore-10.0

---

## B.16 Problem Details

注册：

```csharp
builder.Services.AddProblemDetails();
```

目标是让错误格式稳定。

例如：

```json
{
  "type": "...",
  "title": "Validation error",
  "status": 400,
  "detail": "...",
  "instance": "..."
}
```

前端因此可以建立统一：

```typescript
ApiError
```

并约定：

```text
400 → 表单或输入错误
401 → 未登录
403 → 无权限
404 → Not Found
409 → Conflict
500 → 通用错误
```

.NET 10 Minimal API Validation 可以和 `IProblemDetailsService` 配合。

官方：

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/responses?view=aspnetcore-10.0

---

## B.17 Task B10：CORS

开发时：

```text
Frontend:
http://localhost:5173

Backend:
https://localhost:<port>
```

Origin 不同，因此会遇到真实 CORS。

示例：

```csharp
const string FrontendPolicy = "Frontend";

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
```

然后：

```csharp
app.UseCors(FrontendPolicy);
```

必须理解：

```text
scheme
host
port
```

共同决定 Origin。

不要把 CORS 理解为 Authentication。

也不要因为开发方便就把：

```text
AllowAnyOrigin
```

直接带入生产配置。

官方：

https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-10.0

---

## B.18 Member API

前端 Create/Edit Issue 需要 Assignee 下拉框，因此加入：

```http
GET /api/members
GET /api/members/{id}
```

Response：

```json
[
  {
    "id": 1,
    "displayName": "Alice",
    "email": "alice@example.com",
    "avatarUrl": null
  }
]
```

此时 `Member` 只是业务成员，不要为了做一个 Select 就提前引入完整认证。

---

## B.19 第一次前后端联调验收

Chrome/Edge DevTools Network 必须检查：

```text
Request URL
Method
Status
Request Headers
Response Headers
Payload
Response
Timing
```

逐项验证：

```text
GET List     → 200
GET Detail   → 200
Not Found    → 404
POST         → 201
Validation   → 400
PATCH        → 200
DELETE       → 204
```

建议故意暂时关闭 CORS，观察浏览器错误，然后恢复。

---

## B.20 backend-v1：冻结点

完成：

```text
Health
OpenAPI
SQLite
Migration
Seed
CRUD
Pagination
Search
Filter
Sort
Validation
ProblemDetails
CORS
Member API
```

之后创建：

```text
Git Tag: backend-v1
```

从这里开始，TypeScript / React / Router / TanStack Query 主学习阶段：

> 后端原则上只修 Bug，不随意重新设计 Contract。

---

