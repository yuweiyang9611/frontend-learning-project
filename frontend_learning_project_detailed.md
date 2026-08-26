# 前端学习项目：后端工程师向前端开发转型路线（详细版）

> 项目名称：**IssueFlow**
>
> 项目形式：使用同一个 Issue Tracker 项目，从原生 HTML/CSS/JavaScript 开始，逐步重构为 TypeScript + React + React Router + TanStack Query，并最终加入测试、工程化、性能与部署。
>
> 适用对象：已有后端开发经验，但没有系统学习过前端开发的人。

---

# 目录

1. [项目目标](#1-项目目标)
2. [学习者画像与已有能力映射](#2-学习者画像与已有能力映射)
3. [为什么使用“同一项目连续重构”](#3-为什么使用同一项目连续重构)
4. [资料使用原则](#4-资料使用原则)
5. [开发环境](#5-开发环境)
6. [IssueFlow 最终需求](#6-issueflow-最终需求)
7. [整体学习路线](#7-整体学习路线)
8. [后端配套轨道：.NET 10 IssueFlow API](#b-后端配套轨道net-10-issueflow-api)
8. [Chapter 00：浏览器与 Web 基础](#8-chapter-00浏览器与-web-基础)
9. [Chapter 01：HTML](#9-chapter-01html)
10. [Chapter 02：CSS 基础与布局](#10-chapter-02css-基础与布局)
11. [Chapter 03：JavaScript 语言基础](#11-chapter-03javascript-语言基础)
12. [Chapter 04：DOM 与浏览器事件](#12-chapter-04dom-与浏览器事件)
13. [Chapter 05：HTTP、Fetch 与浏览器数据](#13-chapter-05httpfetch-与浏览器数据)
14. [Chapter 06：TypeScript](#14-chapter-06typescript)
15. [Chapter 07：React 基础](#15-chapter-07react-基础)
16. [Chapter 08：React 状态设计](#16-chapter-08react-状态设计)
17. [Chapter 09：React Router](#17-chapter-09react-router)
18. [Chapter 10：Server State 与 TanStack Query](#18-chapter-10server-state-与-tanstack-query)
19. [Chapter 11：表单、可访问性与交互](#19-chapter-11表单可访问性与交互)
20. [Chapter 12：响应式设计](#20-chapter-12响应式设计)
21. [Chapter 13：测试](#21-chapter-13测试)
22. [Chapter 14：工程化与部署](#22-chapter-14工程化与部署)
23. [Chapter 15：进阶功能](#23-chapter-15进阶功能)
24. [推荐项目目录结构](#24-推荐项目目录结构)
25. [推荐 16 周学习计划](#25-推荐-16-周学习计划)
26. [每个 Task 的标准模板](#26-每个-task-的标准模板)
27. [禁止技术表](#27-禁止技术表)
28. [最终验收标准](#28-最终验收标准)
29. [官方资料总表](#29-官方资料总表)

---

# 1. 项目目标

本项目不是一个“React 教程”，也不是一个“前端框架速成项目”。

最终目标是让一个已经有后端经验的人建立完整的前端思维：

```text
浏览器
  ↓
HTML
  ↓
DOM
  ↓
CSS Layout
  ↓
JavaScript
  ↓
Browser API
  ↓
HTTP / Fetch
  ↓
TypeScript
  ↓
Component
  ↓
React
  ↓
State
  ↓
Routing
  ↓
Server State
  ↓
Form
  ↓
Responsive
  ↓
Testing
  ↓
Build / CI / Deploy
```

完成后应该能够独立开发一个中等规模的 SPA 前端项目，并且知道：

- 为什么这样写；
- 浏览器发生了什么；
- React 帮自己解决了什么；
- 某个第三方库为什么有必要；
- 什么问题应该由浏览器解决；
- 什么问题应该由 React 解决；
- 什么问题应该由后端解决。

---

# 2. 学习者画像与已有能力映射

有后端经验的人并不是从零开始。

例如已经熟悉：

| 后端经验 | 前端对应知识 |
|---|---|
| HTTP | Fetch / Browser Request |
| REST API | API Client |
| DTO | TypeScript Interface |
| Entity | UI Model |
| Controller | Event Handler |
| Service | Hooks / API Layer |
| Dependency Injection | Component Dependency / Context |
| Server State | Server State / Query Cache |
| Request 生命周期 | UI Render 生命周期 |
| 后端 Routing | SPA Routing |
| Validation | Form Validation |
| Authentication | Token / Cookie / Session |
| Logging | DevTools / Console |
| Integration Test | Component / E2E Test |
| Async / Await | Browser Async Programming |

因此不需要重新学习“什么是变量”“什么是函数”。

真正需要补齐的是：

```text
浏览器模型
DOM
CSS
事件模型
前端状态
UI Rendering
Component
Responsive Design
Accessibility
Browser Storage
前端构建工具
前端测试
```

---

# 3. 为什么使用“同一项目连续重构”

不推荐下面这种学习方式：

```text
HTML → 做个人主页

CSS → 做 Landing Page

JavaScript → 做计算器

TypeScript → 做 Todo

React → 再做一个 Todo

Router → 做博客

Query → 再做一个后台系统
```

问题在于：

- 每次都要重新理解业务；
- 知识之间联系弱；
- 不容易感受到框架解决了什么问题；
- 最后容易变成“学过很多教程，但不会独立开发”。

本项目采用：

```text
IssueFlow HTML
      ↓
IssueFlow CSS
      ↓
IssueFlow JavaScript
      ↓
IssueFlow + REST API
      ↓
IssueFlow TypeScript
      ↓
IssueFlow React
      ↓
IssueFlow Router
      ↓
IssueFlow TanStack Query
      ↓
IssueFlow Testing
      ↓
IssueFlow Production
```

学习重点始终是：

> 新技术到底解决了上一阶段的什么问题？

---

# 4. 资料使用原则

本项目优先使用官方资料，不把视频教程或博客作为主要知识来源。

资料分为三级：

## A：必读

真正需要从头阅读、做练习的文档。

例如：

- MDN Learn Web Development
- TypeScript Handbook
- React Learn

## B：开发时查阅

不需要全部背下来，需要知道“它在哪里”。

例如：

- HTML Element Reference
- CSS Property Reference
- React API Reference
- Web API Reference

## C：深入参考

了解即可。

例如：

- WHATWG HTML Living Standard
- ECMAScript Specification
- WCAG Specification

学习方法应该是：

```text
先读 A
 ↓
做任务
 ↓
遇到问题查 B
 ↓
真正需要研究规范时再看 C
```

不要尝试把所有官方手册从头到尾背下来。

---

# 5. 开发环境

建议准备：

```text
VS Code

Chrome 或 Edge

Node.js

npm / pnpm

Git

GitHub
```

浏览器开发者工具必须贯穿整个项目。

---

## 推荐 VS Code 扩展

最开始只需要：

```text
ESLint
Prettier
```

React 阶段再根据需要添加其他扩展。

不要在一开始安装大量“自动生成代码”的插件。

---

## 官方资料

### Node.js

https://nodejs.org/

### npm

https://docs.npmjs.com/

### Git

https://git-scm.com/doc

### Chrome DevTools

https://developer.chrome.com/docs/devtools/

---

# 6. IssueFlow 最终需求

IssueFlow 是一个简化版 Jira / GitHub Issues。

---

## 6.1 核心实体

```typescript
Issue
```

字段：

```text
id
title
description
status
priority
assignee
tags
dueDate
createdAt
updatedAt
```

---

## 6.2 Issue Status

```text
Open
In Progress
Resolved
Closed
```

---

## 6.3 Priority

```text
Low
Medium
High
Critical
```

---

## 6.4 页面

最终至少包含：

```text
/login

/dashboard

/issues

/issues/new

/issues/:id

/issues/:id/edit

/board

/users

/settings
```

---

## 6.5 功能

### Issue

- 创建
- 查看
- 修改
- 删除
- 搜索
- 过滤
- 排序
- 分页

### UI

- Sidebar
- Header
- Table
- Card
- Modal
- Dropdown
- Toast
- Loading
- Skeleton
- Empty State
- Error State

### 高级

- Dark Mode
- Kanban
- Drag & Drop
- Infinite Scroll
- Optimistic Update
- File Upload
- Comments

---

# 7. 整体学习路线

```text
Chapter 00
Web / Browser 基础
       │
       ▼
Chapter 01
HTML
       │
       ▼
Chapter 02
CSS
       │
       ▼
Chapter 03
JavaScript
       │
       ▼
Chapter 04
DOM / Event
       │
       ▼
Chapter 05
HTTP / Fetch
       │
       ▼
Chapter 06
TypeScript
       │
       ▼
Chapter 07
React
       │
       ▼
Chapter 08
React State
       │
       ▼
Chapter 09
React Router
       │
       ▼
Chapter 10
TanStack Query
       │
       ▼
Chapter 11
Form / Accessibility
       │
       ▼
Chapter 12
Responsive
       │
       ▼
Chapter 13
Testing
       │
       ▼
Chapter 14
Engineering / Deploy
       │
       ▼
Chapter 15
Advanced
```

---


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


# 8. Chapter 00：浏览器与 Web 基础

## 目标

在写页面之前先回答：

```text
浏览器到底是什么？
URL 是什么？
HTTP 请求什么时候发生？
HTML 从哪里来？
CSS 怎么被加载？
JavaScript 在哪里运行？
DOM 是什么？
```

---

## 必须理解

### URL

```text
https://example.com/issues?page=2
│      │           │       │
scheme host        path    query
```

### 浏览器访问网站的大概流程

```text
输入 URL
   ↓
DNS
   ↓
建立连接
   ↓
HTTP Request
   ↓
HTTP Response
   ↓
HTML
   ↓
解析 HTML
   ↓
DOM
   ↓
加载 CSS / JS / Image
   ↓
Layout
   ↓
Paint
```

这一阶段不要求深入浏览器引擎内部。

只需要建立整体模型。

---

## Task 0.1：使用 DevTools 查看网站

打开任意网站。

观察：

```text
Elements
Network
Console
Application
```

要求找到：

- HTML；
- CSS；
- JavaScript 文件；
- 图片请求；
- HTTP Status；
- Response Headers。

---

## Task 0.2：观察一次 HTTP 请求

在 Network 中记录：

```text
Request URL
Request Method
Status Code
Content-Type
Response
Timing
```

---

## 官方资料

### MDN：Web 开发学习入口

https://developer.mozilla.org/en-US/docs/Learn_web_development

### MDN：HTTP

https://developer.mozilla.org/en-US/docs/Web/HTTP

### Chrome DevTools

https://developer.chrome.com/docs/devtools/

### Network 面板

https://developer.chrome.com/docs/devtools/network/

---

# 9. Chapter 01：HTML

## 阶段目标

不写 JavaScript。

不追求漂亮。

只做：

> 正确的页面结构。

---

## 9.1 必须掌握

### 文档结构

```html
<!doctype html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">
    <title>IssueFlow</title>
</head>
<body>
</body>
</html>
```

---

## 9.2 Semantic HTML

需要理解：

```html
<header>
<nav>
<main>
<section>
<article>
<aside>
<footer>
```

问题不是：

> 能不能全部用 div？

而是：

> 为什么不应该全部使用 div？

---

## 9.3 表单

必须练习：

```html
<form>
<label>
<input>
<textarea>
<select>
<option>
<button>
```

并理解：

```text
name
value
type
required
disabled
placeholder
autocomplete
```

---

## 9.4 Table

Issue List 使用：

```html
<table>
<thead>
<tbody>
<tr>
<th>
<td>
```

不要一开始用大量 `div` 模拟 table。

---

## Task 1.1：Login Page

制作：

```text
Email
Password
Login
```

验收：

- `label` 与 `input` 正确关联；
- Password 使用正确 input type；
- 使用 form；
- Button 类型正确。

---

## Task 1.2：Issue List

制作静态列表：

```text
ID
Title
Status
Priority
Assignee
Created At
```

至少 10 条假数据。

---

## Task 1.3：Issue Detail

制作：

```text
Title
Status
Priority
Description
Assignee
Created Time
Updated Time
```

---

## Task 1.4：Create Issue

创建静态表单。

---

## 本章禁止

```text
React
Vue
Bootstrap
Tailwind
Ant Design
Material UI
JavaScript
```

---

## 验收

能够解释：

- HTML 是什么；
- DOM 和 HTML 是否完全相同；
- `div` 和 `section` 的区别；
- 为什么 form 需要 label；
- button 默认行为；
- `GET` form 与 `POST` form 的区别。

---

## 官方资料

### MDN HTML

https://developer.mozilla.org/en-US/docs/Web/HTML

中文：

https://developer.mozilla.org/zh-CN/docs/Web/HTML

### MDN：Structuring content with HTML

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content

### HTML Element Reference

https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements

### HTML Forms

https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms

### WHATWG HTML Living Standard

深入参考：

https://html.spec.whatwg.org/

---

# 10. Chapter 02：CSS 基础与布局

CSS 是后端开发者最容易低估的部分之一。

本章不要跳过。

---

## 10.1 Cascade

理解：

```text
Cascade
Specificity
Inheritance
```

---

## 10.2 Box Model

必须能解释：

```text
content
padding
border
margin
```

并理解：

```css
box-sizing: border-box;
```

---

## 10.3 Display

学习：

```css
display: block;
display: inline;
display: inline-block;
display: flex;
display: grid;
display: none;
```

---

## 10.4 Position

学习：

```text
static
relative
absolute
fixed
sticky
```

重点理解 containing block。

---

## 10.5 Flexbox

Flexbox 主要用于一维布局。

需要掌握：

```css
display: flex;

flex-direction
justify-content
align-items
gap

flex-grow
flex-shrink
flex-basis

flex-wrap
```

---

## Task 2.1：Header

使用 Flexbox：

```text
IssueFlow                     Avatar
```

---

## Task 2.2：Sidebar

制作：

```text
Dashboard
Issues
Board
Users
Settings
```

---

## 10.6 Grid

Grid 适合二维布局。

学习：

```css
display: grid;

grid-template-columns
grid-template-rows
gap
grid-column
grid-row
```

---

## Task 2.3：整体后台布局

```text
┌───────────────────────────────────┐
│ Header                            │
├──────────┬────────────────────────┤
│ Sidebar  │ Main                   │
│          │                        │
│          │                        │
└──────────┴────────────────────────┘
```

可以尝试：

```css
grid-template-columns: 240px 1fr;
```

---

## 10.7 CSS Variables

```css
:root {
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
}
```

先理解 CSS Variables。

不要急着引入 Design System。

---

## Task 2.4：建立最小 Design Tokens

定义：

```text
spacing
font size
border radius
shadow
```

---

## 本章禁止

```text
Bootstrap
Tailwind
Ant Design
Material UI
CSS-in-JS
```

---

## 验收

能够回答：

- 为什么元素会溢出？
- width: 100% 为什么有时超过父容器？
- Flex 主轴是什么？
- `justify-content` 和 `align-items` 有什么不同？
- Flex 和 Grid 什么时候使用？
- `position: absolute` 相对于谁定位？
- 为什么设置 `min-width: 0` 有时能解决 Flex 溢出？

---

## 官方资料

### MDN CSS

https://developer.mozilla.org/en-US/docs/Web/CSS

### CSS Layout

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout

### Flexbox

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox

### Grid

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids

### Responsive Design

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design

### CSS Reference

https://developer.mozilla.org/en-US/docs/Web/CSS/Reference

---

# 11. Chapter 03：JavaScript 语言基础

本章暂时不要 React。

---

## 11.1 变量

```javascript
const
let
```

原则：

默认：

```javascript
const
```

确实需要重新赋值时：

```javascript
let
```

---

## 11.2 数据类型

学习：

```text
string
number
boolean
null
undefined
object
symbol
bigint
```

---

## 11.3 Object

```javascript
const issue = {
    id: 1,
    title: "Login failed",
    status: "open"
};
```

---

## 11.4 Array

重点：

```javascript
map()
filter()
find()
some()
every()
reduce()
sort()
```

这些方法以后在 React 中大量使用。

---

## Task 3.1：过滤 Issue

```javascript
const result = issues.filter(issue =>
    issue.status === "open"
);
```

---

## Task 3.2：搜索 Issue

要求：

```text
search("login")
```

返回 title 包含 login 的 Issue。

---

## 11.5 Function

学习：

```javascript
function foo() {}

const foo = () => {};
```

理解：

- 参数；
- 返回值；
- Closure；
- Callback。

---

## 11.6 Destructuring

```javascript
const { id, title, status } = issue;
```

---

## 11.7 Spread

```javascript
const newIssue = {
    ...issue,
    status: "closed"
};
```

这是 React State 更新的重要基础。

---

## 11.8 Module

```javascript
export
import
```

例如：

```javascript
export function filterIssues() {}
```

```javascript
import { filterIssues } from "./issues.js";
```

---

## 11.9 Promise / Async Await

理解：

```javascript
Promise
then
catch
finally
async
await
```

---

## Task 3.3：模拟异步函数

```javascript
async function loadIssues() {
    // ...
}
```

练习：

- success；
- error；
- try/catch；
- finally。

---

## 验收

能够解释：

- JavaScript 是动态类型语言是什么意思；
- `null` 和 `undefined`；
- Object 引用；
- `map` 和 `forEach`；
- `map` 和 `filter`；
- Spread 是浅拷贝还是深拷贝；
- Promise 的状态；
- async function 返回什么。

---

## 官方资料

### MDN JavaScript Guide

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide

### JavaScript Reference

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference

### Promise

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises

### JavaScript Modules

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules

---

# 12. Chapter 04：DOM 与浏览器事件

这一章是理解前端的重要分水岭。

---

## 12.1 DOM

理解：

```text
HTML
 ↓ 浏览器解析
DOM Tree
```

例如：

```html
<body>
    <main>
        <button>Create</button>
    </main>
</body>
```

形成类似：

```text
Document
└── html
    └── body
        └── main
            └── button
```

---

## 12.2 查找 DOM

学习：

```javascript
document.querySelector()
document.querySelectorAll()
document.getElementById()
```

---

## 12.3 修改 DOM

```javascript
textContent
classList
setAttribute
append
remove
createElement
```

---

## Task 4.1：动态 Issue Table

禁止：

```javascript
table.innerHTML = hugeString;
```

第一轮要求使用：

```javascript
createElement()
append()
textContent
```

目的是理解 DOM API。

---

## 12.4 Event

学习：

```javascript
addEventListener()
```

事件：

```text
click
input
change
submit
keydown
```

---

## 12.5 Event Object

```javascript
event.target
event.currentTarget
preventDefault()
```

---

## 12.6 Event Bubbling

需要理解：

```text
Capture
Target
Bubble
```

---

## Task 4.2：Issue Search

输入：

```text
login
```

立即过滤 Issue。

---

## Task 4.3：Create Issue Modal

要求：

- 点击 Create 打开；
- 点击 Close 关闭；
- ESC 关闭；
- 点击遮罩关闭；
- Modal 内点击不能错误关闭。

---

## Task 4.4：Delete

点击 Delete。

要求：

```text
确认
 ↓
删除 DOM
 ↓
显示反馈
```

---

## 验收

能够解释：

- DOM 是什么；
- DOM Node 和 HTML String 区别；
- Event Bubbling；
- `target` 和 `currentTarget`；
- 为什么需要 `preventDefault()`；
- Event Delegation 是什么。

---

## 官方资料

### DOM

https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model

### Document

https://developer.mozilla.org/en-US/docs/Web/API/Document

### Event

https://developer.mozilla.org/en-US/docs/Web/API/Event

### EventTarget.addEventListener

https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener

### Event Bubbling

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling

---

# 13. Chapter 05：HTTP、Fetch 与浏览器数据

这一阶段才正式连接后端。

---

## 13.1 推荐后端策略

后端只提供简单稳定 API。

例如：

```http
GET /api/issues

GET /api/issues/{id}

POST /api/issues

PATCH /api/issues/{id}

DELETE /api/issues/{id}
```

然后：

> 冻结后端。

不要继续花时间优化后端架构。

---

## 13.2 Query

```http
GET /api/issues?page=1
                &pageSize=20
                &status=open
                &priority=high
                &search=login
                &sort=createdAt
```

---

## 13.3 Response

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 235
}
```

---

## 13.4 Fetch

```javascript
const response = await fetch("/api/issues");

if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
}

const data = await response.json();
```

重点：

> Fetch 在收到 HTTP 404/500 时并不会自动因为 HTTP Status 而 reject Promise。

因此必须检查：

```javascript
response.ok
```

---

## 13.5 UI State

每个 API 页面必须有：

```text
Idle
Loading
Success
Empty
Error
```

例如：

```text
          ┌── Success + Data
Loading ──┤
          ├── Success + Empty
          │
          └── Error
```

---

## Task 5.1：Issue List API

实现：

```text
Loading
 ↓
GET /api/issues
 ↓
Success / Error
```

---

## Task 5.2：Pagination

分页状态进入 URL：

```text
/issues?page=3
```

而不是只存在某个 JavaScript 变量中。

---

## Task 5.3：Filter

```text
/issues?status=open&priority=high
```

---

## 13.6 URLSearchParams

学习：

```javascript
new URLSearchParams()
```

---

## 13.7 LocalStorage

学习：

```javascript
localStorage.setItem()
localStorage.getItem()
localStorage.removeItem()
```

可用于：

```text
Theme
简单 UI Preference
```

不要随便把敏感 Token 放入 LocalStorage。

---

## 13.8 Cookie

至少理解：

```text
Cookie
HttpOnly
Secure
SameSite
```

即使后端已经熟悉 Cookie，也需要从浏览器视角重新理解。

---

## 13.9 CORS

需要理解：

```text
Origin

http://localhost:5173
和
http://localhost:5000

是不同 Origin
```

---

## DevTools 任务

在 Network 面板观察：

```text
Request URL
Method
Headers
Payload
Response
Status
Timing
```

---

## 官方资料

### Fetch API

https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

### Using Fetch

https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

### URLSearchParams

https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams

### Web Storage API

https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API

### Cookies

https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies

### CORS

https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

---

# 14. Chapter 06：TypeScript

对于有 C# / Java 等强类型语言背景的人，本章通常会比较容易。

但不要因为熟悉类型系统，就忽略 TypeScript 与 JavaScript 的关系。

TypeScript 是：

```text
JavaScript
+
Static Type Checking
```

而不是：

```text
运行在浏览器里的另一种独立语言
```

---

## 14.1 官方推荐阅读

尤其推荐：

### TypeScript for Java/C# Programmers

https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html

### TypeScript Handbook

https://www.typescriptlang.org/docs/handbook/intro.html

中文入口：

https://www.typescriptlang.org/zh/docs/handbook/

---

## 14.2 Vite

从这一阶段开始可以使用：

```text
Vite + Vanilla TypeScript
```

创建：

```bash
npm create vite@latest
```

选择：

```text
Vanilla
TypeScript
```

---

## 14.3 Interface

```typescript
interface Issue {
    id: number;
    title: string;
    description: string;
}
```

---

## 14.4 Union

```typescript
type IssueStatus =
    | "open"
    | "in_progress"
    | "resolved"
    | "closed";
```

很多情况下比 enum 更自然。

---

## 14.5 Generic

```typescript
interface PageResult<T> {
    items: T[];
    page: number;
    total: number;
}
```

---

## 14.6 Utility Types

必须使用：

```text
Partial
Pick
Omit
Record
Readonly
```

---

## 14.7 Narrowing

例如：

```typescript
function print(value: string | number) {
    if (typeof value === "string") {
        console.log(value.toUpperCase());
    } else {
        console.log(value.toFixed(2));
    }
}
```

---

## 14.8 Discriminated Union

非常推荐练习：

```typescript
type ApiState<T> =
    | {
        status: "loading";
    }
    | {
        status: "success";
        data: T;
    }
    | {
        status: "error";
        error: Error;
    };
```

这比：

```typescript
loading: boolean
data?: T
error?: Error
```

更容易避免非法状态组合。

---

## Task 6.1：整个 JS 项目迁移到 TS

要求：

- Issue Model 有类型；
- API Response 有类型；
- DOM Element 有类型；
- Event Handler 有类型；
- 禁止大量 `any`。

---

## 本章禁止

```text
React
大量 any
as unknown as ...
为消除报错而随意强转
```

---

## 验收

能够解释：

- TypeScript 和 JavaScript 的关系；
- interface 和 type；
- union；
- narrowing；
- generic；
- `unknown` 和 `any`；
- `never`；
- structural typing；
- TS 类型是否存在于浏览器运行时。

---

## 官方资料

### TypeScript Documentation

https://www.typescriptlang.org/docs/

### Handbook

https://www.typescriptlang.org/docs/handbook/intro.html

### Everyday Types

https://www.typescriptlang.org/docs/handbook/2/everyday-types.html

### Narrowing

https://www.typescriptlang.org/docs/handbook/2/narrowing.html

### Generics

https://www.typescriptlang.org/docs/handbook/2/generics.html

### Utility Types

https://www.typescriptlang.org/docs/handbook/utility-types.html

### Vite

https://vite.dev/guide/

---

# 15. Chapter 07：React 基础

到这里才开始 React。

建议重新创建：

```text
Vite
React
TypeScript
```

然后重写 IssueFlow。

---

## 15.1 React 学习路线

官方 React 文档应该按：

```text
Quick Start
 ↓
Describing the UI
 ↓
Adding Interactivity
 ↓
Managing State
 ↓
Escape Hatches
```

学习。

官方：

https://react.dev/learn

中文：

https://zh-hans.react.dev/learn

---

## 15.2 Component

```tsx
function StatusBadge() {
    return <span>Open</span>;
}
```

理解：

> Component 本质上是描述 UI 的 JavaScript/TypeScript 函数。

---

## 15.3 Props

```tsx
interface Props {
    status: IssueStatus;
}

function StatusBadge({ status }: Props) {
    return <span>{status}</span>;
}
```

---

## 15.4 List Rendering

```tsx
issues.map(issue => (
    <IssueRow
        key={issue.id}
        issue={issue}
    />
))
```

重点理解：

```text
key
```

不要只记：

> React 要求写 key。

需要知道它与组件身份和列表 reconciliation 有关。

---

## 15.5 Conditional Rendering

```tsx
if (loading) {
    return <Loading />;
}
```

```tsx
return issues.length === 0
    ? <EmptyState />
    : <IssueTable />;
```

---

## 15.6 Event

```tsx
<button onClick={handleCreate}>
    Create Issue
</button>
```

---

## 15.7 State

```tsx
const [search, setSearch] = useState("");
```

核心模型：

```text
State
 ↓
Render
 ↓
UI
 ↓
User Event
 ↓
State Change
 ↓
Render
```

---

## Task 7.1：组件拆分

将：

```text
IssuesPage
```

拆为：

```text
IssuesPage
│
├── PageHeader
├── IssueFilters
├── IssueTable
│   └── IssueRow
└── Pagination
```

---

## Task 7.2：Search

```tsx
const [search, setSearch] = useState("");
```

实现客户端过滤。

---

## Task 7.3：Modal

使用 React State 实现。

比较：

```text
Vanilla JS DOM 操作
vs
React Declarative Rendering
```

---

## 本章暂时禁止

```text
Redux
Zustand
TanStack Query
React Hook Form
大型 UI Library
```

---

## 验收

能够回答：

- Component 是什么；
- Props 是什么；
- State 是什么；
- Props 和 State 区别；
- 为什么不能直接修改 State；
- React 为什么重新 Render；
- Render 是否等于浏览器重新加载整个页面；
- key 的作用。

---

## 官方资料

### React Learn

https://react.dev/learn

### Quick Start

https://react.dev/learn

### Thinking in React

https://react.dev/learn/thinking-in-react

### State: A Component's Memory

https://react.dev/learn/state-a-components-memory

### Rendering Lists

https://react.dev/learn/rendering-lists

### Responding to Events

https://react.dev/learn/responding-to-events

---

# 16. Chapter 08：React 状态设计

这章比“学会 useState”更重要。

很多 React 项目的复杂度，本质上来自状态设计。

---

## 16.1 状态分类

把项目状态分类：

```text
Local UI State
Server State
URL State
Form State
Global Client State
```

例如：

| 数据 | 类型 |
|---|---|
| Modal 是否打开 | Local UI State |
| 当前 Issue 列表 | Server State |
| 当前 page | URL State |
| 创建 Issue 输入值 | Form State |
| Theme | Global / Persistent UI State |

不要把所有东西都丢进 Redux。

---

## 16.2 Single Source of Truth

同一个状态不要重复保存。

错误：

```text
selectedIssue
selectedIssueId
selectedIssueTitle
selectedIssueStatus
```

如果后面的内容都可以从前面的数据计算得到，就不一定应该成为独立 State。

---

## 16.3 Derived State

例如：

```tsx
const filteredIssues = issues.filter(...);
```

通常不要再：

```tsx
const [filteredIssues, setFilteredIssues] = useState([]);
```

---

## 16.4 Lifting State Up

理解：

```text
Parent
  ↓ props
Child A
Child B
```

两个 Child 需要共享状态时：

```text
把状态移动到最近公共 Parent
```

---

## 16.5 Effect

学习：

```tsx
useEffect()
```

但必须同时学习：

> 什么情况下不需要 Effect。

---

## 重要官方文章

### Synchronizing with Effects

https://react.dev/learn/synchronizing-with-effects

### You Might Not Need an Effect

https://react.dev/learn/you-might-not-need-an-effect

这两篇非常重要。

---

## Task 8.1：删除不必要 Effect

找出可以通过：

```text
render
derived value
event handler
```

完成的逻辑。

不要滥用：

```tsx
useEffect()
```

---

## Task 8.2：共享 Filter State

```text
Search
Status
Priority
```

由 `IssuesPage` 管理。

子组件只接收 Props。

---

## 验收

能够回答：

- 什么数据应该成为 State；
- 什么数据不应该成为 State；
- Derived State；
- Lifting State Up；
- Effect 的用途；
- 为什么 Effect 容易被滥用；
- Local State 和 Server State 的区别。

---

## 官方资料

### Managing State

https://react.dev/learn/managing-state

### Choosing the State Structure

https://react.dev/learn/choosing-the-state-structure

### Sharing State Between Components

https://react.dev/learn/sharing-state-between-components

### Preserving and Resetting State

https://react.dev/learn/preserving-and-resetting-state

---

# 17. Chapter 09：React Router

本章开始建立真正 SPA。

---

## 17.1 路由

实现：

```text
/login

/dashboard

/issues

/issues/new

/issues/:id

/issues/:id/edit

/board

/settings
```

---

## 17.2 重点

学习：

```text
BrowserRouter
Routes
Route
Link
NavLink
Outlet
useParams
useNavigate
```

---

## 17.3 Nested Route

例如：

```text
/settings/profile
/settings/account
/settings/appearance
```

---

## 17.4 URL State

Filter：

```text
/issues?page=2&status=open
```

应该可以：

- 刷新后保留；
- 分享 URL；
- 前进后退正常工作。

这就是为什么很多“页面状态”应该进入 URL。

---

## Task 9.1：Issue Detail Route

```text
/issues/:id
```

使用 route param 加载 Issue。

---

## Task 9.2：Search Params

实现：

```text
/issues?page=3&status=open&priority=high
```

---

## 验收

能够回答：

- Server Routing；
- Client Routing；
- SPA；
- History API；
- URL Param；
- Query Param；
- 为什么 URL 可以成为 State。

---

## 官方资料

### React Router

https://reactrouter.com/

### Declarative Routing

https://reactrouter.com/start/declarative/routing

### BrowserRouter

https://reactrouter.com/api/declarative-routers/BrowserRouter

---

# 18. Chapter 10：Server State 与 TanStack Query

先保留之前的：

```tsx
useState
+
useEffect
+
fetch
```

实现。

然后才加入 TanStack Query。

这样才能真正理解库的意义。

---

## 18.1 Server State 的特点

Server State：

```text
不属于浏览器
可能过期
可以被其他用户修改
需要重新获取
需要缓存
可能需要重试
```

因此：

```text
Server State != 普通 UI State
```

---

## 18.2 Query

```tsx
useQuery()
```

概念：

```text
queryKey
queryFn
isPending
error
data
```

---

## 18.3 Mutation

```tsx
useMutation()
```

用于：

```text
Create
Update
Delete
```

---

## 18.4 Invalidation

例如：

```text
Create Issue
     ↓
POST /issues
     ↓
Success
     ↓
invalidate issues query
     ↓
refetch
```

---

## 18.5 Cache

理解：

```text
fresh
stale
cache
refetch
```

---

## 18.6 Optimistic Update

例如：

```text
点击 Status
 ↓
UI 先变
 ↓
发送 API
 ↓
Success
```

如果失败：

```text
rollback
```

---

## Task 10.1：Issue List Query

将手工：

```text
loading
error
data
```

改为 Query。

---

## Task 10.2：Create Mutation

创建成功后：

```text
invalidateQueries
```

---

## Task 10.3：Delete Mutation

要求：

- Disable Button；
- Loading；
- Error；
- Success Feedback。

---

## Task 10.4：Optimistic Status

实现状态快速切换。

---

## 验收

能够回答：

- Client State 和 Server State；
- Query Key；
- Cache；
- Stale；
- Refetch；
- Mutation；
- Invalidation；
- Optimistic Update。

---

## 官方资料

### TanStack Query React

https://tanstack.com/query/latest/docs/framework/react

### Overview

https://tanstack.com/query/latest/docs/framework/react/overview

### Quick Start

https://tanstack.com/query/latest/docs/framework/react/quick-start

### Query

https://tanstack.com/query/latest/docs/framework/react/guides/queries

### Mutation

https://tanstack.com/query/latest/docs/framework/react/guides/mutations

### Query Invalidation

https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation

---

# 19. Chapter 11：表单、可访问性与交互

表单是企业前端中非常重要的一部分。

---

## 19.1 第一阶段：手写 Controlled Form

先不要 React Hook Form。

```tsx
const [title, setTitle] = useState("");
```

---

## 19.2 Validation

需要区分：

```text
HTML Validation
Client Validation
Server Validation
```

---

## Create Issue

字段：

```text
Title
Description
Status
Priority
Assignee
Tags
Due Date
```

---

## Validation

例如：

```text
Title Required
Title <= 100
Description <= 5000
DueDate >= Today
```

---

## 19.3 Server Error

后端返回：

```json
{
  "errors": {
    "title": [
      "Title already exists"
    ]
  }
}
```

前端需要显示到具体字段。

---

## 19.4 Submit State

至少：

```text
Idle
Submitting
Success
Error
```

提交中：

```text
Disable Submit
防止重复提交
```

---

## 19.5 Accessibility

至少掌握：

```text
semantic HTML
label
keyboard
focus
aria
contrast
```

注意：

> ARIA 不是替代正确 HTML 的工具。

能用原生 HTML 时优先原生 HTML。

---

## Task 11.1：全键盘操作

IssueFlow 的主要页面不使用鼠标也能完成：

```text
Tab
Shift + Tab
Enter
Escape
```

---

## Task 11.2：Modal Focus

Modal 打开时：

- 焦点进入 Modal；
- ESC 关闭；
- 关闭后焦点回到触发 Button。

---

## 可选：再引入 Form Library

当手写表单变得明显复杂后，再学习：

```text
React Hook Form
```

官方：

https://react-hook-form.com/

---

## 官方资料

### MDN Forms

https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms

### Constraint Validation

https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation

### Accessibility

https://developer.mozilla.org/en-US/docs/Web/Accessibility

### WAI

https://www.w3.org/WAI/

### ARIA Authoring Practices Guide

https://www.w3.org/WAI/ARIA/apg/

---

# 20. Chapter 12：响应式设计

不要把响应式理解为：

```text
手机宽度时把所有东西缩小
```

真正目标是：

> 同一信息在不同屏幕上采用不同布局。

---

## 20.1 Desktop

```text
Sidebar
+
Table
```

---

## 20.2 Tablet

```text
Collapsed Sidebar
+
Table
```

---

## 20.3 Mobile

Table 可能改成：

```text
Issue Card
Issue Card
Issue Card
```

---

## 20.4 Mobile First

建议学习：

```css
/* mobile */

@media (min-width: 768px) {
    /* tablet */
}

@media (min-width: 1024px) {
    /* desktop */
}
```

不要机械依赖某几个固定设备宽度。

根据：

> 内容什么时候开始不好看？

决定 breakpoint。

---

## Task 12.1：Issue List Responsive

Desktop：

```text
Table
```

Mobile：

```text
Card List
```

---

## Task 12.2：Sidebar

Desktop：

```text
Always visible
```

Mobile：

```text
Drawer
```

---

## 验收

能够回答：

- Responsive Design；
- Mobile First；
- Media Query；
- Breakpoint；
- Flex/Grid 在响应式中的作用；
- 为什么不应该针对每一款手机写 CSS。

---

## 官方资料

### MDN Responsive Design

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design

### Media Queries

https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries

---

# 21. Chapter 13：测试

测试分层学习。

不要一开始追求 100% Coverage。

---

# 21.1 Unit Test

工具：

```text
Vitest
```

适合：

```text
formatter
validator
utility
pure function
```

例如：

```typescript
formatPriority()

validateIssue()

buildIssueQuery()
```

---

## Task 13.1

测试：

```typescript
buildIssueQuery({
    page: 2,
    status: "open"
});
```

得到：

```text
?page=2&status=open
```

---

# 21.2 Component Test

工具：

```text
React Testing Library
```

原则：

> 尽量从用户如何使用页面的角度测试，而不是测试组件内部实现细节。

重点学习：

```text
getByRole
getByLabelText
getByText
findBy...
userEvent
```

---

## Task 13.2：IssueForm

测试：

```text
用户没有输入 Title
 ↓
点击 Submit
 ↓
显示错误
```

---

# 21.3 Integration Test

例如：

```text
Search Input
 ↓
输入 login
 ↓
Issue List 更新
```

---

# 21.4 E2E

工具：

```text
Playwright
```

测试：

```text
Login
 ↓
Issue List
 ↓
Create Issue
 ↓
Edit Issue
 ↓
Delete Issue
```

---

## Task 13.3：完整 Create Issue

Playwright：

```text
打开 /issues
点击 Create
填写表单
提交
检查新 Issue 出现在列表
```

---

## 验收

能够解释：

- Unit Test；
- Integration Test；
- Component Test；
- E2E；
- Mock；
- 为什么不要测试实现细节。

---

## 官方资料

### Vitest

https://vitest.dev/guide/

### Writing Tests

https://vitest.dev/guide/learn/writing-tests

### React Testing Library

https://testing-library.com/docs/react-testing-library/intro/

### Testing Library Queries

https://testing-library.com/docs/queries/about/

### User Event

https://testing-library.com/docs/user-event/intro/

### Playwright

https://playwright.dev/docs/intro

### Playwright Best Practices

https://playwright.dev/docs/best-practices

---

# 22. Chapter 14：工程化与部署

---

## 22.1 Vite

理解：

```text
Development Server
HMR
Build
Preview
```

命令：

```bash
npm run dev

npm run build

npm run preview
```

---

## 22.2 ESLint

目标：

```text
发现潜在错误
统一代码规则
```

不是：

```text
单纯格式化代码
```

---

## 22.3 Prettier

目标：

```text
自动统一代码格式
```

因此：

```text
ESLint ≠ Prettier
```

---

## 22.4 Environment Variables

理解：

```text
Development
Test
Production
```

以及：

```text
前端环境变量最终可能进入客户端 Bundle
```

因此：

> 不要把真正的 Secret 放进前端环境变量。

---

## 22.5 Production Build

至少观察：

```text
dist/
```

里面有什么。

理解：

```text
source
 ↓
build
 ↓
static assets
```

---

## 22.6 CI

GitHub Actions：

```text
push
 ↓
install
 ↓
lint
 ↓
test
 ↓
build
```

---

## 示例流程

```yaml
checkout
  ↓
setup node
  ↓
npm ci
  ↓
npm run lint
  ↓
npm test
  ↓
npm run build
```

---

## 22.7 Docker

Docker 不是前端学习重点。

放在最后。

理解：

```text
Build React
 ↓
dist
 ↓
Nginx / Static Server
```

即可。

---

## 官方资料

### Vite

https://vite.dev/guide/

### Building for Production

https://vite.dev/guide/build

### ESLint

https://eslint.org/docs/latest/use/getting-started

### Prettier

https://prettier.io/docs/

### GitHub Actions

https://docs.github.com/en/actions

### Docker Get Started

https://docs.docker.com/get-started/

---

# 23. Chapter 15：进阶功能

完成核心课程后再做。

---

## 23.1 Dark Mode

学习：

```text
CSS Variables
localStorage
prefers-color-scheme
```

---

## 23.2 Debounce Search

例如：

```text
用户输入
 ↓
等待 300ms
 ↓
调用 Search API
```

理解 debounce。

---

## 23.3 Infinite Scroll

学习：

```text
IntersectionObserver
```

官方：

https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API

---

## 23.4 Kanban

增加：

```text
Open
In Progress
Resolved
Closed
```

Column。

---

## 23.5 Drag & Drop

先理解浏览器 Drag API。

之后再考虑成熟库。

---

## 23.6 File Upload

学习：

```text
<input type="file">
File
FormData
multipart/form-data
```

官方：

https://developer.mozilla.org/en-US/docs/Web/API/FormData

---

## 23.7 Performance

学习：

```text
lazy loading
code splitting
memoization
network waterfall
bundle size
```

但不要过早：

```text
useMemo everywhere
useCallback everywhere
```

先发现真实性能问题，再优化。

---

# 24. 推荐项目目录结构

---

## Vanilla 阶段

```text
issueflow/
│
├── index.html
├── issues.html
├── issue-detail.html
├── create-issue.html
│
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── layout.css
│   └── components.css
│
└── js/
    ├── api.js
    ├── issues.js
    ├── dom.js
    └── main.js
```

---

## TypeScript 阶段

```text
src/
│
├── api/
│   └── issues.ts
│
├── models/
│   └── issue.ts
│
├── ui/
│   └── issue-table.ts
│
├── utils/
│   └── query.ts
│
└── main.ts
```

---

## React 阶段

```text
src/
│
├── api/
│   ├── client.ts
│   └── issues.ts
│
├── components/
│   ├── Button/
│   ├── Modal/
│   ├── StatusBadge/
│   └── IssueTable/
│
├── features/
│   └── issues/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── types/
│       └── utils/
│
├── layouts/
│   └── AppLayout.tsx
│
├── pages/
│   ├── DashboardPage.tsx
│   └── SettingsPage.tsx
│
├── router/
│   └── router.tsx
│
├── styles/
│   ├── global.css
│   └── variables.css
│
├── App.tsx
└── main.tsx
```

注意：

> 不要为了“架构漂亮”一开始就创建几十个空文件夹。

目录结构应该随着项目复杂度增长。

---

# 25. 推荐 16 周学习计划

假设：

```text
每周 10～15 小时
```

已有后端经验。

---

## Week 1

```text
Browser
HTTP
DevTools
HTML
```

输出：

```text
静态 Login / Issue List / Detail
```

---

## Week 2～3

```text
CSS
Box Model
Flexbox
Grid
```

输出：

```text
Desktop 后台界面
```

---

## Week 4～5

```text
JavaScript
Array
Object
Function
Module
Promise
```

输出：

```text
纯 JS IssueFlow
```

---

## Week 6

```text
DOM
Events
Modal
Search
Filter
```

---

## Week 7

```text
Fetch
HTTP
CORS
URL
Storage
```

输出：

```text
前后端连接
```

---

## Week 8

```text
TypeScript
Vite
```

输出：

```text
Vanilla TS IssueFlow
```

---

## Week 9～10

```text
React
Component
Props
State
Event
```

输出：

```text
React IssueFlow
```

---

## Week 11

```text
State Design
Effect
Router
```

---

## Week 12

```text
TanStack Query
```

---

## Week 13

```text
Form
Validation
Accessibility
```

---

## Week 14

```text
Responsive
Mobile
```

---

## Week 15

```text
Vitest
Testing Library
Playwright
```

---

## Week 16

```text
ESLint
Prettier
CI
Build
Deploy
```

---

# 26. 每个 Task 的标准模板

每个练习任务都应该使用固定格式。

---

## Task X.Y：任务名称

### 背景

说明：

```text
为什么现在需要这个功能。
```

### 学习目标

例如：

```text
理解 Flexbox 的主轴与交叉轴。
```

### 需求

例如：

```text
使用 Flexbox 创建 Sidebar + Content。
```

### 技术限制

例如：

```text
禁止 Grid。
禁止 Bootstrap。
禁止 Tailwind。
```

### 验收标准

例如：

```text
Sidebar 宽度 240px。

Content 自动占据剩余宽度。

窗口缩小时不能产生水平溢出。
```

### DevTools 检查

例如：

```text
使用 Elements 查看 Sidebar Computed Width。
```

### 思考题

例如：

```text
flex: 1 到底是什么意思？

为什么 Content 可能需要 min-width: 0？

如果把 Sidebar 改成 position: fixed 会发生什么？
```

### 官方资料

放 1～3 个本 Task 真正需要阅读的官方链接。

---

# 27. 禁止技术表

为了避免框架提前隐藏底层知识：

| 阶段 | 禁止 |
|---|---|
| HTML | JS Framework、UI Library |
| CSS | Tailwind、Bootstrap、Ant Design |
| JavaScript | React、Vue、jQuery |
| DOM | React |
| API | Axios（先学习 fetch） |
| TypeScript | React、大量 `any` |
| React 基础 | Redux、Zustand、TanStack Query |
| State | Redux First |
| Query | 用 Global Store 替代所有 Server State |
| Form 初级 | Form Library |
| Testing | 只写 Snapshot |
| Final | 无硬性限制 |

---

# 28. 最终验收标准

完成项目后，应当能够独立解释以下问题。

---

## Browser

```text
浏览器拿到 HTML 后大概发生什么？
DOM 是什么？
HTTP Request 在哪里观察？
Cookie 和 LocalStorage 区别？
CORS 为什么发生？
```

---

## HTML

```text
Semantic HTML 是什么？
为什么 form 要使用 label？
button 默认类型有什么影响？
```

---

## CSS

```text
Box Model 是什么？
Flex 和 Grid 有什么区别？
position absolute 相对于谁定位？
Responsive Design 如何实现？
```

---

## JavaScript

```text
Closure 是什么？
Promise 是什么？
async/await 如何工作？
map/filter/reduce 区别？
```

---

## DOM

```text
DOM Node 是什么？
Event Bubbling 是什么？
target 与 currentTarget 区别？
```

---

## TypeScript

```text
TS 和 JS 关系？
unknown 与 any？
Union？
Narrowing？
Generic？
Discriminated Union？
```

---

## React

```text
Component？
Props？
State？
Render？
为什么不能直接修改 State？
key 有什么作用？
Effect 什么时候需要？
Effect 什么时候不应该使用？
```

---

## Architecture

```text
Local State
Server State
URL State
Form State
Global State
```

分别应该放在哪里？

---

## Query

```text
Query Key？
Cache？
Stale？
Invalidation？
Mutation？
Optimistic Update？
```

---

## Testing

```text
Unit Test？
Component Test？
Integration Test？
E2E？
```

---

## Production

```text
Vite build 做什么？
dist 是什么？
ESLint 和 Prettier 区别？
前端环境变量为什么不能存 Secret？
CI 应该执行哪些检查？
```

---

# 29. 官方资料总表

以下资料建议加入浏览器书签。

---

## Web 基础

### MDN Learn Web Development

**优先级：A**

https://developer.mozilla.org/en-US/docs/Learn_web_development

适合：

```text
HTML
CSS
JavaScript
Responsive
Forms
Accessibility
```

---

## HTML

### MDN HTML

**优先级：A/B**

https://developer.mozilla.org/en-US/docs/Web/HTML

中文：

https://developer.mozilla.org/zh-CN/docs/Web/HTML

### WHATWG HTML Living Standard

**优先级：C**

https://html.spec.whatwg.org/

---

## CSS

### MDN CSS

**优先级：A/B**

https://developer.mozilla.org/en-US/docs/Web/CSS

### CSS Layout

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout

### Flexbox

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox

### Grid

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids

### Responsive Design

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design

---

## JavaScript

### MDN JavaScript Guide

**优先级：A**

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide

### JavaScript Reference

**优先级：B**

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference

### Promise

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises

---

## DOM / Web API

### DOM

https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model

### Fetch

https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

### Web APIs

https://developer.mozilla.org/en-US/docs/Web/API

---

## TypeScript

### TypeScript Handbook

**优先级：A**

https://www.typescriptlang.org/docs/handbook/intro.html

### 中文文档

https://www.typescriptlang.org/zh/docs/handbook/

### TypeScript for Java/C# Programmers

**有 C#/Java 经验的人优先阅读**

https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html

---

## Vite

### Vite Guide

**优先级：A/B**

https://vite.dev/guide/

重点：

```text
Getting Started
Features
Static Asset Handling
Environment Variables
Build
```

---

## React

### React Learn

**优先级：A**

https://react.dev/learn

中文：

https://zh-hans.react.dev/learn

### React API Reference

**优先级：B**

https://react.dev/reference/react

推荐重点：

```text
Thinking in React
State
Sharing State
Managing State
Effects
You Might Not Need an Effect
```

---

## React Router

### Official Documentation

**优先级：A/B**

https://reactrouter.com/

### Routing

https://reactrouter.com/start/declarative/routing

---

## TanStack Query

### React Query Documentation

**优先级：A/B**

https://tanstack.com/query/latest/docs/framework/react

重点：

```text
Overview
Quick Start
Queries
Mutations
Query Keys
Invalidation
Caching
Optimistic Updates
```

---

## Forms

### MDN Forms

https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms

### React Hook Form

进阶阶段：

https://react-hook-form.com/

---

## Accessibility

### MDN Accessibility

https://developer.mozilla.org/en-US/docs/Web/Accessibility

### W3C WAI

https://www.w3.org/WAI/

### ARIA Authoring Practices

https://www.w3.org/WAI/ARIA/apg/

---

## Chrome DevTools

### Chrome DevTools

**优先级：A**

https://developer.chrome.com/docs/devtools/

尤其要学习：

```text
Elements
Console
Network
Application
Performance
```

---

## Testing

### Vitest

https://vitest.dev/guide/

### React Testing Library

https://testing-library.com/docs/react-testing-library/intro/

### Playwright

https://playwright.dev/docs/intro

---

## Code Quality

### ESLint

https://eslint.org/docs/latest/use/getting-started

### Prettier

https://prettier.io/docs/

---

## CI

### GitHub Actions

https://docs.github.com/en/actions

---

## Docker

### Docker Get Started

https://docs.docker.com/get-started/

---

# 30. 推荐官方资料阅读顺序

不要按工具数量同时学习。

推荐：

```text
1. MDN Learn Web Development
      ↓
2. MDN HTML
      ↓
3. MDN CSS Layout
      ↓
4. MDN JavaScript Guide
      ↓
5. DOM / Event / Fetch
      ↓
6. TypeScript Handbook
      ↓
7. Vite Guide
      ↓
8. React Learn
      ↓
9. React Router
      ↓
10. TanStack Query
      ↓
11. Testing Library / Vitest
      ↓
12. Playwright
```

其中最核心的四套资料是：

```text
MDN
TypeScript Handbook
React Learn
Chrome DevTools Documentation
```

第三方中文教程可以作为辅助，但建议：

> 遇到 API、语义、行为、版本差异问题时，优先回到官方文档确认。

---

# 31. 最终项目成果

最终 Git 仓库建议能够展示完整演进过程：

```text
tag/html-static

tag/css-layout

tag/vanilla-js

tag/rest-api

tag/typescript

tag/react-basic

tag/react-router

tag/tanstack-query

tag/testing

tag/production
```

也可以使用 branch。

推荐使用 Git Tag，因为更适合展示课程阶段。

最终 README 应包含：

```text
项目简介

技术栈

项目截图

功能

架构

安装

运行

测试

Build

学习阶段

技术决策说明
```

---

# 32. 项目真正完成的判断标准

不是：

```text
页面看起来像 Jira
```

也不是：

```text
用了 React
```

而是学习者可以独立面对一个新的前端需求，例如：

> “做一个客户管理系统的客户列表、筛选、详情和编辑页面。”

然后能够自己完成：

```text
分析 UI
 ↓
设计 HTML
 ↓
选择 CSS Layout
 ↓
拆 Component
 ↓
定义 Type
 ↓
设计 State
 ↓
设计 URL
 ↓
调用 API
 ↓
处理 Loading/Error/Empty
 ↓
处理 Form
 ↓
处理 Responsive
 ↓
补测试
 ↓
Build
```

这时才可以认为：

> 已经从“有后端经验但不会前端”进入“可以独立进行现代前端开发”的阶段。
