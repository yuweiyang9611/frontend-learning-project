# IssueFlow

IssueFlow 是一个面向前端学习的完整 Issue Tracker。项目使用 React 19 + TypeScript 构建产品界面，包含 Router、TanStack Query、表单、乐观更新、响应式与可访问性交互，并提供 D1/R2 同源 API 和 .NET 10 + SQLite API 两种真实数据实现。

![IssueFlow — Move work forward](frontend/public/og.png)

GitHub：<https://github.com/yuweiyang9611/frontend-learning-project>

在线学习站：<https://yuweiyang9611.github.io/frontend-learning-project/>

## 从哪里开始

- 零基础完整课程：[91 天、182 小时学习计划](https://yuweiyang9611.github.io/frontend-learning-project/90-days/)
- 在线阅读：[IssueFlow 学习站](https://yuweiyang9611.github.io/frontend-learning-project/)
- 第一次运行：[00：开始之前](docs/learning/00-getting-started.md)
- 完整课程：[学习文档总索引](docs/README.md)
- 知识专题：[00–12 专题索引](docs/learning/README.md)
- TypeScript 重点：[TypeScript 专题](docs/typescript/README.md)
- .NET/D1 对照：[后端专题](docs/backend/README.md)
- 按功能找代码：[源码追踪路线](docs/reference/source-traces.md)
- 当前功能边界：[产品需求](docs/reference/product-requirements.md)

原始 6215 行设计稿已按主题无损拆分到 [历史存档](docs/archive/original-curriculum/README.md)，不会与当前实现说明混写。

## 已实现

- 13 周、91 天、每天 120 分钟的零基础课程、进度日志、阶段考核与毕业量表；
- 登录、Dashboard、Issue CRUD、详情、评论、附件、Users、Settings；
- 搜索、筛选、稳定排序、分页与 Infinite Query；
- Kanban 拖放、键盘状态选择、乐观更新与失败回滚；
- Dark/System/Light 主题、响应式导航、Modal、Toast、Skeleton；
- TypeScript 强化：4 周日课、9 篇专题、12 个真实 Lab、24+ 道分级练习与排错手册；
- D1/R2、Drizzle migration、同源 Route Handlers；
- .NET 10 Minimal API、EF Core SQLite、Identity Cookie、OpenAPI、Problem Details；
- Vitest、Testing Library、Playwright、.NET 集成测试和 GitHub Actions。

## 环境

- Node.js 22.13+（CI 使用 Node.js 24）
- npm 11+
- .NET SDK 10

## 快速启动

默认同源模式：

```powershell
cd frontend
npm install
npm run dev
```

打开 <http://localhost:3000>：

- Email：`demo@issueflow.dev`
- Password：`issueflow`

TypeScript Lab：<http://localhost:3000/labs/typescript>

## 数据模式

| 模式             | 配置                                             | 数据位置          |
| ---------------- | ------------------------------------------------ | ----------------- |
| 同源 API（默认） | 两个变量都留空                                   | D1/R2 兼容环境    |
| .NET API         | `NEXT_PUBLIC_API_BASE_URL=http://localhost:5170` | SQLite + 文件目录 |
| 浏览器演示       | `NEXT_PUBLIC_DEMO_MODE=local`                    | localStorage      |

local 模式优先级最高，仅用于教学。详细切换方法见 [项目地图与数据模式](docs/learning/01-project-map-and-data-modes.md)。

启动 .NET：

```powershell
dotnet restore IssueFlow.slnx
dotnet run --project backend/IssueFlow.Api
```

API 默认地址：<http://localhost:5170>；Development OpenAPI：<http://localhost:5170/openapi/v1.json>。

## 验证

```powershell
cd frontend
npm run format:check
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

各测试层的职责与调试顺序见 [测试、调试、CI 与构建](docs/learning/11-testing-engineering-and-deployment.md)。

## 本地预览学习站

学习站使用仓库根目录的 VitePress 配置。91 天日课在 `docs/90-days`，深入专题则
分别保存在 `docs/learning`、`docs/typescript`、`docs/backend` 与 `docs/reference`：

```powershell
npm install
npm run docs:dev
```

构建静态站点：

```powershell
npm run docs:build
```

发布规则和故障排查见 [GitHub Pages 发布说明](docs/maintainers/github-pages.md)。
