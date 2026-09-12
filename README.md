# IssueFlow

IssueFlow 是一个面向前端学习的完整 Issue Tracker。项目使用 React 19 + TypeScript 构建产品界面，包含 Router、TanStack Query、表单、乐观更新、响应式与可访问性交互，并提供 D1/R2 同源 API 和 .NET 10 + SQLite API 两种真实数据实现。

![IssueFlow — Move work forward](frontend/public/og.png)

GitHub：<https://github.com/yuweiyang9611/frontend-learning-project>

在线学习站：<https://yuweiyang9611.github.io/frontend-learning-project/>

## 从哪里开始

- 零基础完整课程：[91 天、182 小时学习计划](https://yuweiyang9611.github.io/frontend-learning-project/90-days/)
- 在线阅读：[IssueFlow 学习站](https://yuweiyang9611.github.io/frontend-learning-project/)
- 错题复习：[间隔复习中心](https://yuweiyang9611.github.io/frontend-learning-project/90-days/review-center.html)
- 第一次运行：[00：开始之前](docs/learning/00-getting-started.md)
- 完整课程：[学习文档总索引](docs/README.md)
- 知识专题：[00–12 专题索引](docs/learning/README.md)
- TypeScript 重点：[TypeScript 专题](docs/typescript/README.md)
- .NET/D1 对照：[后端专题](docs/backend/README.md)
- 按功能找代码：[源码追踪路线](docs/reference/source-traces.md)
- 当前功能边界：[产品需求](docs/reference/product-requirements.md)

原始 6215 行设计稿已按主题无损拆分到 [历史存档](docs/archive/original-curriculum/README.md)，不会与当前实现说明混写。

## 已实现

- 13 周、91 天、每天 120 分钟主动学习的零基础课程、进度日志、13 次闭卷周测、错题间隔复习与毕业量表；
- 登录、Dashboard、Issue CRUD、详情、评论、附件、Users、Settings；
- 搜索、筛选、稳定排序、分页与 Infinite Query；
- Kanban 拖放、键盘状态选择、乐观更新与失败回滚；
- Dark/System/Light 主题、响应式导航、Modal、Toast、Skeleton；
- TypeScript 强化：4 周日课、9 篇专题、12 个浏览器 Lab、27 道可执行练习、逐题类型验收与排错手册；
- React 入门工作区：Day 50–56 逐日完成 Props、State、DOM parser、异步四态、Effect 和普通异步保存；
- D1/R2、Drizzle migration、同源 Route Handlers；
- .NET 10 Minimal API、EF Core SQLite、Identity Cookie、OpenAPI、Problem Details；
- Vitest、Testing Library、Playwright、.NET 集成测试和 GitHub Actions。

## 环境

- Node.js 22.13+（CI 使用 Node.js 24）
- npm 11+
- .NET SDK 10（第 1–10 周可暂缓，第 11 周双后端学习前必须安装）

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

## 工作区统计、设置与数据升级

Dashboard 和 Team 使用 `GET /api/workspace/overview` 统计全部 Issue；Board 每列独立按 25 条加载，并显示已加载数与总数。并发移动按卡片恢复失败状态；保存成功但刷新失败时保留已确认结果，并提供重试。

Profile 可保存显示名，登录邮箱由身份提供方管理。Account 可保存三项通知偏好并导出已保存的资料与偏好；**目前没有邮件投递服务**。三种数据模式提供相同行为，local 模式的设置仅存于当前浏览器。

新增接口在两套后端保持相同契约：

| 接口 | 用途 |
| --- | --- |
| `GET /api/workspace/overview` | 全量统计、成员工作量、最近六条 Issue 与 Team focus |
| `GET /api/me/settings` | 当前登录会话资料和通知偏好 |
| `PATCH /api/me/profile` | 提交 `{ "displayName": "新显示名" }`，返回更新后的 Session |
| `PUT /api/me/preferences` | 提交完整的 `assigned`、`mentions`、`digest` 布尔值 |

三个 `/api/me` 接口需要登录，默认通知偏好为 `true/true/false`。显示名去除首尾空白后为 1–100 字符；资料接口不接受邮箱、角色或其他用户 ID。

D1 结构由 `frontend/db/schema.ts` 与提交的 Drizzle SQL 迁移管理，请求处理不会再建表。首次启动需要构建生成本地 D1 配置，`npm run dev` 和 `npm run preview` 会自动执行本地迁移；也可手动运行：

```powershell
cd frontend
npm run build
npm run db:migrate:local
npm run db:test
npm run test:coverage:workspace
```

本地默认数据目录是 `frontend/.wrangler/state`。通过 `ISSUEFLOW_D1_PERSIST_TO` 切换目录时，迁移与预览必须使用同一个值；浏览器测试与双后端契约测试使用隔离数据库。已知旧库会保留数据并登记迁移基线，未知结构或迁移校验值不符时停止，不自动删除数据库。Seed 完成标记保证清空 Issue 后重启不会重新插入示例任务。

.NET 新增 `20260911234526_UserNotificationPreferences` 迁移，继续使用 EF Core。在仓库根目录执行 `dotnet ef database update --project backend/IssueFlow.Api` 可将配置的本地 SQLite 升级到最新结构。D1 新增迁移为 `0001_workspace_settings.sql`。

已经应用的 SQL 迁移及其元数据不可修改。线上升级应先备份、应用追加迁移，再启用新代码；回退代码不自动回退数据库。本次改进不要求自动发布或执行远端迁移。

周测现为 **13 周 × 12 题 = 156 题**，每周保留原 3 题并新增阅读预测、错误定位、应用变式各 3 题；提交后显示逐选项解释和概念诊断。原题 ID、答案及本地复习记录保持兼容。
