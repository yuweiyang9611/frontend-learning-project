## B.21 Authentication 应该最后一些再加入

加入顺序：

```text
CRUD
 ↓
Pagination
 ↓
Filter / Search
 ↓
TypeScript
 ↓
React
 ↓
Router
 ↓
TanStack Query
 ↓
Forms
 ↓
Authentication
```

因为认证会同时引入：

```text
Cookie
401
403
Credentials
CORS
Current User
Protected Route
Authorization
CSRF
```

过早加入会干扰前端基础学习。

---

## B.22 Task B11：ASP.NET Core Identity

认证阶段推荐：

```text
ASP.NET Core Identity
+
EF Core
+
Cookie Authentication
```

ASP.NET Core 官方面向 SPA 的 Identity API 文档推荐浏览器应用优先考虑 Cookie，因为 Cookie 默认由浏览器管理，不需要把认证凭据暴露给 JavaScript。

安装：

```bash
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
```

用户：

```csharp
public sealed class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = "";
}
```

概念配置：

```csharp
builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>()
    .AddEntityFrameworkStores<AppDbContext>();
```

映射：

```csharp
app.MapIdentityApi<ApplicationUser>();
```

具体实现以当前 .NET 10 Identity 官方文档为准。

官方：

https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-api-authorization?view=aspnetcore-10.0

---

## B.23 Protected API

至少保护：

```text
POST Issue
PATCH Issue
DELETE Issue
POST Comment
Upload
```

例如：

```csharp
issues.MapPost("/", ...)
    .RequireAuthorization();
```

前端学习：

```text
Login
  ↓
Cookie
  ↓
Current User
  ↓
Protected Route
  ↓
Protected API
```

必须强调：

> 前端 Route Guard 只能控制 UI 导航，真正的数据安全必须由后端 Authorization 保证。

---

## B.24 401 与 403

必须区分：

```text
401
```

通常表示请求没有有效认证身份。

```text
403
```

表示已经识别身份，但没有权限。

.NET 10 还有一个很适合教学的变化：对框架识别为 API 的 Endpoint，Cookie Authentication 在认证/授权失败时返回更符合 API 使用方式的 401/403，而不是把请求重定向到 HTML 登录页。

官方：

https://learn.microsoft.com/en-us/aspnet/core/security/authentication/api-endpoint-auth?view=aspnetcore-10.0

---

## B.25 Cookie Auth 与前端 Fetch

跨 Origin 开发时，前端通常需要：

```javascript
fetch(url, {
    credentials: "include"
});
```

服务器 CORS Policy 需要明确允许前端 Origin，并根据认证方案配置 Credentials。

认证阶段必须学习：

```text
HttpOnly
Secure
SameSite
AllowCredentials
credentials: include
CSRF
```

不要把：

```text
HttpOnly Cookie
```

误认为已经自动解决所有 Web 安全问题。

---

## B.26 Task B12：Comment API

React/TanStack Query 已掌握后再加入：

```http
GET    /api/issues/{issueId}/comments
POST   /api/issues/{issueId}/comments
DELETE /api/issues/{issueId}/comments/{commentId}
```

Comment：

```text
Id
IssueId
Author
Body
CreatedAt
```

前端训练：

```text
Nested Resource
List Rendering
Mutation
Cache Invalidation
Empty State
Timestamp
```

---

## B.27 Task B13：File Upload

Endpoint：

```http
POST /api/issues/{issueId}/attachments
```

Content-Type：

```text
multipart/form-data
```

ASP.NET Core 可以使用：

```text
IFormFile
```

Attachment Metadata：

```text
Id
IssueId
OriginalFileName
StoredFileName
ContentType
Size
CreatedAt
```

开发文件可以存：

```text
uploads/
```

至少做到：

- 不直接信任客户端文件名；
- 使用服务器端唯一文件名；
- 设置大小限制；
- 限制文件类型；
- 防止路径穿越；
- 不把任意上传文件当成可执行内容。

前端学习：

```text
File
FormData
multipart/form-data
Upload State
Upload Error
```

官方：

https://learn.microsoft.com/en-us/aspnet/core/mvc/models/file-uploads?view=aspnetcore-10.0

---

## B.28 Task B14：Backend Integration Test

创建：

```bash
dotnet new xunit -n IssueFlow.Api.Tests -f net10.0
```

加入引用：

```bash
dotnet add backend/IssueFlow.Api.Tests/IssueFlow.Api.Tests.csproj \
    reference backend/IssueFlow.Api/IssueFlow.Api.csproj
```

测试支持：

```bash
dotnet add backend/IssueFlow.Api.Tests/IssueFlow.Api.Tests.csproj \
    package Microsoft.AspNetCore.Mvc.Testing
```

第一组测试：

```text
GET /api/health               → 200
GET /api/issues               → 200
GET unknown issue             → 404
POST invalid issue            → 400
POST valid issue              → 201
PATCH existing issue          → 200
DELETE existing issue         → 204
```

认证后增加：

```text
Anonymous POST                → 401
Authenticated POST            → 201
```

目的不是追求巨大后端测试覆盖率，而是：

> 保证前端依赖的 API Contract 稳定。

官方：

https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0

---

## B.29 时间与日期 Contract

建议：

```text
CreatedAt
UpdatedAt
```

后端使用：

```text
DateTimeOffset
```

HTTP：

```text
ISO 8601
```

例如：

```text
2026-08-26T10:15:00Z
```

前端根据用户时区显示。

`DueDate` 如果只有“哪一天”的业务含义：

```text
DateOnly
```

API：

```text
2026-09-10
```

---

## B.30 Async 与 CancellationToken

数据库 I/O 使用：

```text
ToListAsync
FirstOrDefaultAsync
SaveChangesAsync
```

Handler 可以接收：

```csharp
CancellationToken cancellationToken
```

并传给 EF Core：

```csharp
await db.Issues
    .ToListAsync(cancellationToken);
```

不要使用：

```csharp
Task.Run(() => db...)
```

去包装 EF Core I/O。

---

## B.31 后端日志

使用：

```text
ILogger<T>
```

至少记录：

```text
Unhandled Exception
关键业务失败
文件上传失败
必要的认证诊断
```

不要记录：

```text
Password
Cookie
Access Token
Refresh Token
敏感用户信息
```

---

## B.32 本课程后端明确不做什么

除非以后单独开后端架构课程，否则不加入：

```text
Microservices
Kafka
RabbitMQ
MassTransit
Event Sourcing
复杂 CQRS
复杂 DDD
Redis Cluster
Kubernetes
GraphQL
gRPC
ElasticSearch
MediatR
为了包装 EF Core 而创建的 Repository + UnitOfWork
```

判断标准：

> 这个技术是否直接帮助当前前端学习目标？

如果答案是否定的，就先不加入。

---

## B.33 前后端最终映射

| 阶段 | 前端 | 后端 |
|---|---|---|
| 1 | HTML | 无 |
| 2 | CSS | 无 |
| 3 | JavaScript | Fake Data |
| 4 | DOM/Event | Fake Data |
| 5 | Fetch/HTTP | Health + OpenAPI |
| 6 | HTTP/CORS | EF Core + SQLite |
| 7 | TypeScript | CRUD + Seed |
| 8 | React | Pagination/Search/Filter |
| 9 | React State | Validation + ProblemDetails |
| 10 | Router | CORS + Contract Freeze |
| 11 | TanStack Query | backend-v1 固定 |
| 12 | Form | 服务端 Validation |
| 13 | Responsive | 无新增 |
| 14 | Testing | Integration Tests |
| 15 | Auth | ASP.NET Core Identity |
| 16 | Advanced | Comment / Upload |
| Final | Build / Deploy | API Production Config |

---

## B.34 推荐后端 Git Tag

```text
backend-b0-health
backend-b1-openapi
backend-b2-efcore
backend-b3-crud
backend-b4-query
backend-b5-validation
backend-b6-cors
backend-v1
backend-auth
backend-comments
backend-upload
backend-tests
```

---

## B.35 后端最终验收

### 基础

```text
.NET 10
Minimal APIs
OpenAPI
```

### 数据

```text
EF Core 10
SQLite
Migration
Seed
```

### REST

```text
GET
POST
PATCH
DELETE
```

### Query

```text
Pagination
Search
Filter
Sort
```

### Error

```text
Validation
ProblemDetails
400 / 404
```

### Browser Integration

```text
CORS
Cookie Credentials（认证阶段）
```

### Security

```text
Authentication
Authorization
401 / 403
Cookie / CSRF 基础
Upload 安全
```

### Testing

```text
Integration Test
```

最终理想状态：

```text
前端开发者
    ↓
查 OpenAPI
    ↓
调用稳定 API
    ↓
不需要频繁修改后端
```

后端在这个项目中的角色就是：

> **真实、稳定、足够完整，但不抢走前端学习主线。**

---

## B.36 .NET 10 后端官方资料总表

### .NET 10

https://learn.microsoft.com/en-us/dotnet/core/releases-and-support

https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/overview

### ASP.NET Core 10 APIs

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/apis?view=aspnetcore-10.0

### Minimal APIs

https://learn.microsoft.com/en-us/aspnet/core/tutorials/min-web-api?view=aspnetcore-10.0

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis?view=aspnetcore-10.0

### OpenAPI

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/overview?view=aspnetcore-10.0

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/aspnetcore-openapi?view=aspnetcore-10.0

### EF Core 10

https://learn.microsoft.com/en-us/ef/core/

https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-10.0/whatsnew

https://learn.microsoft.com/en-us/ef/core/providers/sqlite/

https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/

### Validation

https://learn.microsoft.com/en-us/aspnet/core/validation/overview?view=aspnetcore-10.0

### CORS

https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-10.0

### Authentication / Identity

https://learn.microsoft.com/en-us/aspnet/core/security/authentication/?view=aspnetcore-10.0

https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-api-authorization?view=aspnetcore-10.0

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/security?view=aspnetcore-10.0

### File Upload

https://learn.microsoft.com/en-us/aspnet/core/mvc/models/file-uploads?view=aspnetcore-10.0

### Integration Tests

https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0

---


