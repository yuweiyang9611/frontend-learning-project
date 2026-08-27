# B. 后端配套轨道：.NET 10 IssueFlow API

这一部分是 **IssueFlow 前端学习项目的配套后端**，不是另一套以架构为中心的后端课程。

固定技术栈：

```text
.NET 10
ASP.NET Core 10
Minimal APIs
Entity Framework Core 10
SQLite
ASP.NET Core Identity（认证阶段再加入）
Microsoft.AspNetCore.OpenApi
xUnit
Microsoft.AspNetCore.Mvc.Testing
```

核心原则：

> 后端要足够真实，让前端能够学习 HTTP、CORS、分页、错误处理、认证、文件上传和测试；同时又要足够简单，不能把这个项目重新变成后端架构练习。

.NET 10 是 LTS；EF Core 10 同样是 LTS，并以 .NET 10 为目标框架。

官方资料：

- .NET 版本与支持  
  https://learn.microsoft.com/en-us/dotnet/core/releases-and-support
- ASP.NET Core API 概述  
  https://learn.microsoft.com/en-us/aspnet/core/fundamentals/apis?view=aspnetcore-10.0
- Minimal APIs 快速参考  
  https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis?view=aspnetcore-10.0
- EF Core 10  
  https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-10.0/whatsnew

---

## B.1 后端什么时候出现

前端前几个阶段不要使用真实后端。

| 前端阶段 | 后端状态 | 目的 |
|---|---|---|
| HTML | 无 | 只学页面语义 |
| CSS | 无 | 只学布局 |
| JavaScript | JS 内存假数据 | 只学语言 |
| DOM / Event | JS 内存假数据 | 只学浏览器模型 |
| Fetch / HTTP | 开始 .NET 10 API | 第一次真实联调 |
| TypeScript | 使用同一 API | 建立类型化 API Contract |
| React | 使用同一 API | 后端基本冻结 |
| React Router | 使用同一 API | URL 与资源路由配合 |
| TanStack Query | 使用同一 API | 缓存、Mutation、Invalidation |
| Form | 加服务端 Validation | 两端验证 |
| Auth | 加 ASP.NET Core Identity | Cookie、401、403 |
| Upload | 加 Attachment API | multipart/form-data |
| Testing | 加后端 Integration Test | 稳定 Contract |
| Production | 完整 API | 部署 |

重要规则：

> 当 `backend-v1` 完成后，React 主学习阶段原则上不再随意修改 API Contract。

---

## B.2 为什么选择 Minimal APIs

ASP.NET Core 支持：

```text
Minimal APIs
Controller-based APIs
```

这个项目推荐：

```text
Minimal APIs
```

因为课程目标是前端。

```text
更少样板代码
    ↓
更快得到稳定 REST API
    ↓
更多时间用于 Browser / JavaScript / React
```

Minimal APIs 依然足以覆盖：

- Routing
- Parameter Binding
- Dependency Injection
- Validation
- Authentication / Authorization
- CORS
- OpenAPI
- EF Core
- Integration Testing

Microsoft 当前 ASP.NET Core 文档也把 Minimal APIs 作为新 HTTP API 项目的推荐方案。

官方：

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/apis?view=aspnetcore-10.0

---

## B.3 最终仓库结构

```text
IssueFlow/
│
├── frontend/
│   ├── package.json
│   └── src/
│
├── backend/
│   ├── IssueFlow.Api/
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   │
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs
│   │   │   └── SeedData.cs
│   │   │
│   │   ├── Models/
│   │   │   ├── Issue.cs
│   │   │   ├── Member.cs
│   │   │   ├── Comment.cs
│   │   │   └── Attachment.cs
│   │   │
│   │   ├── Features/
│   │   │   ├── Issues/
│   │   │   │   ├── IssueEndpoints.cs
│   │   │   │   └── IssueContracts.cs
│   │   │   ├── Members/
│   │   │   ├── Comments/
│   │   │   └── Attachments/
│   │   ├── Migrations/
│   │   └── IssueFlow.Api.http
│   │
│   └── IssueFlow.Api.Tests/
│
├── IssueFlow.sln
└── README.md
```

不要一开始创建：

```text
Domain
Application
Infrastructure
CQRS
MediatR
Repository
UnitOfWork
EventBus
Microservices
```

这个项目建议直接使用 EF Core `DbContext`。

---

## B.4 Task B0：创建 .NET 10 API

### 创建 Solution

```bash
dotnet new sln -n IssueFlow
```

创建 API：

```bash
dotnet new webapi -n IssueFlow.Api -f net10.0
```

项目目标框架：

```xml
<TargetFramework>net10.0</TargetFramework>
```

加入 Solution：

```bash
dotnet sln IssueFlow.sln add backend/IssueFlow.Api/IssueFlow.Api.csproj
```

### 第一个 Endpoint

```csharp
var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/api/health", () =>
    Results.Ok(new { status = "ok" }));

app.Run();
```

测试：

```http
GET /api/health
```

期望：

```text
200 OK
```

### 本阶段禁止

```text
数据库
Identity
JWT
Redis
Docker
MediatR
Repository Pattern
```

### 官方资料

https://learn.microsoft.com/en-us/aspnet/core/tutorials/min-web-api?view=aspnetcore-10.0

---

## B.5 Task B1：OpenAPI

.NET 10 使用 ASP.NET Core 第一方 OpenAPI 支持。

```bash
dotnet add package Microsoft.AspNetCore.OpenApi
```

注册：

```csharp
builder.Services.AddOpenApi();
```

Development：

```csharp
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
```

默认文档：

```text
/openapi/v1.json
```

.NET 10 内置 OpenAPI 文档生成默认使用 OpenAPI 3.1。

这一阶段开始形成：

```text
Backend Contract
       ↓
Frontend TypeScript Type
```

前端不应该靠猜测知道：

```text
URL
Method
Request
Response
Status Code
```

官方：

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/aspnetcore-openapi?view=aspnetcore-10.0

---

## B.6 Task B2：EF Core 10 + SQLite

安装：

```bash
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
```

EF CLI：

```bash
dotnet tool install --global dotnet-ef
```

已经安装则：

```bash
dotnet tool update --global dotnet-ef
```

Connection String：

```json
{
  "ConnectionStrings": {
    "Default": "Data Source=issueflow.db"
  }
}
```

DbContext：

```csharp
public sealed class AppDbContext(
    DbContextOptions<AppDbContext> options)
    : DbContext(options)
{
    public DbSet<Issue> Issues => Set<Issue>();
    public DbSet<Member> Members => Set<Member>();
}
```

注册：

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString =
        builder.Configuration.GetConnectionString("Default");

    options.UseSqlite(connectionString);
});
```

官方：

- EF Core  
  https://learn.microsoft.com/en-us/ef/core/
- SQLite Provider  
  https://learn.microsoft.com/en-us/ef/core/providers/sqlite/

---

## B.7 Task B3：第一版实体

第一版只做：

```text
Issue
Member
```

不要立刻加入 Comment、Attachment、Project、Team。

### Issue

```csharp
public sealed class Issue
{
    public long Id { get; set; }
    public required string Title { get; set; }
    public string Description { get; set; } = "";
    public IssueStatus Status { get; set; }
    public IssuePriority Priority { get; set; }

    public long? AssigneeId { get; set; }
    public Member? Assignee { get; set; }

    public DateOnly? DueDate { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
```

### Status

```csharp
public enum IssueStatus
{
    Open,
    InProgress,
    Resolved,
    Closed
}
```

### Priority

```csharp
public enum IssuePriority
{
    Low,
    Medium,
    High,
    Critical
}
```

### Member

```csharp
public sealed class Member
{
    public long Id { get; set; }
    public required string DisplayName { get; set; }
    public required string Email { get; set; }
    public string? AvatarUrl { get; set; }
}
```

HTTP JSON 推荐输出字符串 Enum：

```json
{
  "status": "open",
  "priority": "high"
}
```

而不是：

```json
{
  "status": 0,
  "priority": 2
}
```

这样前端 TypeScript Contract 更清晰。

---

## B.8 Task B4：EF Core Migration

第一次：

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

必须打开 `Migrations/` 查看：

```text
Up()
Down()
ModelSnapshot
```

理解：

```text
C# Model
    ↓
Migration
    ↓
Database Schema
```

以后模型变化：

```text
修改模型
   ↓
dotnet ef migrations add <Name>
   ↓
dotnet ef database update
```

官方：

https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/

---

## B.9 Task B5：Seed Data

为了让前端能真正训练：

```text
Pagination
Search
Filter
Sort
Empty Result
```

Seed：

```text
Member: 5～10
Issue: 50～100
```

Issue 数据应覆盖：

```text
Open
InProgress
Resolved
Closed

Low
Medium
High
Critical

有 Assignee
无 Assignee

有 DueDate
无 DueDate
```

不要只放 3 条测试数据。

---

## B.10 Task B6：Issue CRUD

API：

```http
GET    /api/issues
GET    /api/issues/{id}
POST   /api/issues
PATCH  /api/issues/{id}
DELETE /api/issues/{id}
```

推荐 Route Group：

```csharp
var issues = app.MapGroup("/api/issues");

issues.MapGet("/", ...);
issues.MapGet("/{id:long}", ...);
issues.MapPost("/", ...);
issues.MapPatch("/{id:long}", ...);
issues.MapDelete("/{id:long}", ...);
```

Endpoint 增多后移到：

```text
Features/Issues/IssueEndpoints.cs
```

---

