# 01：项目地图与数据模式

上一章：[开始之前](00-getting-started.md) · 下一章：[浏览器与 Web](02-browser-and-web.md)

## 本章目标

- 分清框架页面入口、React Router 和 API Route Handler；
- 理解同一 React 界面如何连接三种数据实现；
- 能从一个屏幕组件追踪到数据存储；
- 知道环境变量的优先级和适用学习阶段。

## 三层“路由”不是一回事

IssueFlow 同时存在三种路由：

1. `frontend/app/page.tsx` 与 `frontend/app/[...path]/page.tsx`：Vinext/Sites 页面入口，负责把 HTTP 页面请求交给应用。
2. `frontend/src/app/IssueFlowApp.tsx`：React Router 的产品内路由，决定 Dashboard、Issues、Board、Settings 和 Lab 渲染哪个屏幕。
3. `frontend/app/api/**`：服务端 Route Handlers，处理 JSON、认证、数据库和文件，不渲染可见页面。

后端工程类比：

| 前端概念          | 可类比的后端概念       | 关键差异                 |
| ----------------- | ---------------------- | ------------------------ |
| 页面入口          | Host / Middleware 入口 | 会输出 HTML 与客户端引用 |
| React Router      | 应用内状态机           | 导航通常不重新加载整页   |
| API Route Handler | Minimal API Endpoint   | 运行在服务端环境         |

## 项目地图

| 路径                                | 职责                     | 第一次阅读重点                      |
| ----------------------------------- | ------------------------ | ----------------------------------- |
| `frontend/src/app/IssueFlowApp.tsx` | 路由表和保护边界         | Lazy Route、Nested Route            |
| `frontend/src/app/AppProviders.tsx` | Query、认证、主题、Toast | 全局状态所有权                      |
| `frontend/src/screens/`             | 路由屏幕                 | 查询、Mutation、页面状态            |
| `frontend/src/features/issues/`     | Issue 领域模块           | 类型、表单、复用组件                |
| `frontend/src/components/ui.tsx`    | UI 原语                  | Modal、Loading、错误与可访问性      |
| `frontend/src/api/issueflowApi.ts`  | 数据访问边界             | local 与 HTTP 实现如何共用 Contract |
| `frontend/app/api/`                 | 同源 API                 | 请求到服务端的入口                  |
| `frontend/src/server/`              | 同源服务逻辑             | D1、R2、认证、Problem Details       |
| `frontend/db/schema.ts`             | Drizzle Schema           | 表、索引、约束                      |
| `backend/IssueFlow.Api/`            | .NET API                 | Endpoint、EF Core、Identity         |
| `frontend/e2e/`                     | 浏览器旅程               | 用户可观察行为                      |

完整索引见 [源码追踪路线](../reference/source-traces.md)。

## 三种数据模式

| 模式         | 配置                                             | 数据位置          | 最适合学习                    |
| ------------ | ------------------------------------------------ | ----------------- | ----------------------------- |
| 浏览器演示   | `NEXT_PUBLIC_DEMO_MODE=local`                    | localStorage      | TypeScript、React、快速实验   |
| 默认同源 API | 不设置额外变量                                   | D1/R2 兼容环境    | Route Handler、SQL、对象存储  |
| .NET API     | `NEXT_PUBLIC_API_BASE_URL=http://localhost:5170` | SQLite 与上传目录 | Cookie、CORS、Problem Details |

优先级：只要 `NEXT_PUBLIC_DEMO_MODE=local`，前端就使用浏览器模拟数据，即使同时设置了 `NEXT_PUBLIC_API_BASE_URL`。

## 推荐学习顺序

### 纯前端阶段

```dotenv
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_DEMO_MODE=local
```

此时把注意力放在组件、状态和类型上。数据会保存在浏览器 localStorage，不能把它误认为服务器持久化。

### 同源 API 阶段

```dotenv
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_DEMO_MODE=
```

学习 Route Handler、D1、R2 和同源 Cookie。刷新或换页面后数据仍由服务端提供。

### .NET 对照阶段

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:5170
NEXT_PUBLIC_DEMO_MODE=
```

另一个终端启动：

```powershell
dotnet run --project backend/IssueFlow.Api
```

修改环境变量后必须重启前端开发服务器。

## 一条请求的完整路径

```text
IssuesPage
  -> TanStack Query
  -> issueflowApi.listIssues
  -> 同源 /api/issues -> Route Handler -> D1
     或 .NET /api/issues -> Minimal API -> EF Core -> SQLite
  -> PagedResult<Issue>
  -> Table / Mobile Cards
```

关键架构决定是：屏幕依赖 `Issue` 和 `PagedResult<Issue>`，不依赖 D1 行、EF Entity 或 localStorage 内部对象。数据实现可以替换，UI Contract 不应随之改变。

## 实验

1. 在三种模式中分别打开 Issue 列表，记录 Network 请求和持久化位置。
2. 搜索 `NEXT_PUBLIC_DEMO_MODE`，找到模式选择发生在哪一层。
3. 从 `IssuesPage.tsx` 追踪到 `issueflowApi.listIssues`，再分别追踪同源与 .NET 实现。
4. 给三张架构图标出“浏览器进程”“服务端进程”“持久化存储”。

## 常见错误

- 把 React Router Route 当成服务端 Endpoint。
- 认为 ProtectedRoute 已完成安全授权。
- localStorage 模式工作，就断定真实 API Contract 正确。
- 让页面直接读取数据库字段名，导致后端切换时重写 UI。
- 同时调试三种模式，无法判断错误边界。

## 本章验收

1. 为什么 `/issues` 既可能是浏览器中的路由，又会触发 `/api/issues`？
2. 三种模式中，哪一种完全没有真实服务端持久化？
3. 为什么前端组件不应该知道 EF Entity？
4. 设置两个环境变量时，哪个优先？

下一章：[02：浏览器、URL、HTTP 与 DevTools](02-browser-and-web.md)
