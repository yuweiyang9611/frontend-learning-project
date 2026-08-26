# IssueFlow

IssueFlow 是一个面向前端学习的完整 Issue Tracker。它以 React + TypeScript 为产品界面，同时提供两个真实数据实现：可直接发布到 Sites 的 D1/R2 同源 API，以及设计文档要求的 .NET 10 + SQLite 标准后端。

![IssueFlow — Move work forward](frontend/public/og.png)

GitHub 仓库：<https://github.com/yuweiyang9611/frontend-learning-project>

想把成品作为教材逐步学习，请从 [IssueFlow 学习指导](LEARNING_GUIDE.md) 开始；完整的原始课程设计与知识说明见
[frontend_learning_project_detailed.md](frontend_learning_project_detailed.md)。

## 已实现功能

- 登录、仪表盘、Issue 列表/新建/详情/编辑、Kanban、团队与设置完整路由
- Issue CRUD、300 ms 搜索防抖、过滤、稳定排序、分页与 Infinite Scroll
- 桌面表格和移动卡片、原生拖放、乐观更新与失败回滚
- 评论、附件上传/下载、5 MB 与文件类型限制
- Dark/System/Light 主题、列表密度、URL 状态、Toast、Modal、Skeleton、Empty/Error State
- 可访问表单校验、焦点管理、键盘快捷键与响应式导航
- D1 持久化、R2 文件存储、Drizzle 迁移与 Sites 平台身份
- .NET 10 Minimal API、EF Core 10 SQLite、Identity Cookie、OpenAPI 3.1、Problem Details
- Vitest、Testing Library、Playwright 和 .NET 集成测试

## 项目结构

```text
.
├─ frontend/                     React 19 + TypeScript + Vinext/Sites
│  ├─ app/                       页面入口、API Route Handlers、元数据
│  ├─ db/                        Drizzle D1 schema
│  ├─ drizzle/                   已检查的 SQL migration
│  ├─ src/                       组件、界面、查询、状态与数据契约
│  └─ e2e/                       Playwright 生命周期测试
├─ backend/
│  ├─ IssueFlow.Api/             .NET 10 Minimal API
│  └─ IssueFlow.Api.Tests/       API 集成测试
├─ IssueFlow.slnx                .NET 10 根解决方案入口
└─ frontend_learning_project_detailed.md
```

前端默认请求同源 `/api/**`，因此 Sites 发布版直接使用 D1/R2。设置 `NEXT_PUBLIC_API_BASE_URL=http://localhost:5170` 后，同一套界面会改用 .NET API；设置 `NEXT_PUBLIC_DEMO_MODE=local` 可运行仅供教学的浏览器本地演示。

## 环境要求

- Node.js 22.13+（CI 使用 Node.js 24）
- npm 11+
- .NET SDK 10

## 启动前端与 Sites API

```powershell
cd frontend
npm install
npm run dev
```

打开 <http://localhost:3000>。本地 Sites 开发环境会提供测试身份；登录页的本地演示凭据为：

- Email：`demo@issueflow.dev`
- Password：`issueflow`

D1 表会在第一次 API 请求时安全初始化，正式 SQL migration 保存在 `frontend/drizzle/`。R2 绑定名为 `UPLOADS`，D1 绑定名为 `DB`。

## 启动 .NET 后端

```powershell
dotnet restore IssueFlow.slnx
dotnet run --project backend/IssueFlow.Api
```

API 默认地址为 <http://localhost:5170>。首次启动会应用 EF Core Migration、创建 SQLite 数据库，并写入 8 名成员、72 条 Issue、评论、附件和 Identity 演示账户。

让前端使用 .NET API：

```powershell
Copy-Item frontend/.env.example frontend/.env.local
# 在 frontend/.env.local 中设置：
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5170
cd frontend
npm run dev
```

OpenAPI 文档：<http://localhost:5170/openapi/v1.json>

健康检查：<http://localhost:5170/api/health>

## 验证

```powershell
cd frontend
npx playwright install chromium
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e

cd ..
dotnet build IssueFlow.slnx
dotnet test IssueFlow.slnx
dotnet format IssueFlow.slnx --verify-no-changes
```

GitHub Actions 会在 push 和 pull request 时执行前端 lint/typecheck/test/build、后端 build/test/format，以及 Chromium E2E 生命周期测试。

## API 与安全决策

- 两套真实 API 的写操作均要求已认证身份；Sites 使用平台提供的认证用户 Header，.NET 使用 HttpOnly Identity Cookie。显式 local 模式仅用于浏览器学习演示。
- Sites 本地演示会话只允许 loopback 主机，并用 D1 中的 SHA-256 Token Hash 校验；跨源写请求会被拒绝。
- .NET CORS 仅允许配置的前端源并携带凭据。
- Sites 上传校验大小和 MIME；.NET 还会校验扩展名与文件签名。两者都使用不可预测对象 Key，下载强制 `nosniff`。
- SQLite/D1 为常用状态、优先级、负责人、更新时间、评论和附件查询建立索引，并运行 `PRAGMA optimize`。
- localStorage 用于主题、密度、非敏感 Session Profile 和显式浏览器演示；默认产品数据保存在 D1/R2 或 .NET SQLite。

## 学习路线对应

1. React/TypeScript 组件、受控表单和 React Router URL 状态
2. TanStack Query 缓存、乐观更新、分页与 Infinite Query
3. 原生 DnD、响应式 UI、可访问 Modal 与键盘交互
4. D1/R2、SQL Migration、同源 API 与对象存储
5. .NET Minimal API、EF Core、Identity、测试与 CI

建议先按 [IssueFlow 学习指导](LEARNING_GUIDE.md) 运行、追踪并修改当前实现；详细需求与设计依据见
[frontend_learning_project_detailed.md](frontend_learning_project_detailed.md)。
