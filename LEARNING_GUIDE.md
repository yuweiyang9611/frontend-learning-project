# IssueFlow 学习指导

这份指导用于把已经完成的 IssueFlow 当作一套可运行、可修改、可验证的前端教材。它不会重复
[`frontend_learning_project_detailed.md`](frontend_learning_project_detailed.md) 中的完整知识讲解，而是回答三个更实践的问题：

1. 应该按什么顺序阅读当前代码？
2. 每个知识点在项目中的入口在哪里？
3. 怎样通过修改和测试确认自己真正掌握了它？

目标读者是熟悉 C#、HTTP、数据库和后端工程，但正在系统学习浏览器、TypeScript 与 React 的开发者。

## 1. 学习原则

不要从第一行开始顺序阅读整个仓库，也不要只看代码不运行。每次学习都采用下面的闭环：

1. **运行**：先在浏览器中复现一个可见行为。
2. **观察**：用 DevTools 查看 DOM、CSS、Network、请求参数和响应。
3. **追踪**：从页面组件一路追到 Query、API 适配器和数据实现。
4. **修改**：只做一个范围明确的小改动。
5. **验证**：补测试并运行相关质量命令。
6. **复盘**：用自己的话解释状态放在哪里、为何重新渲染、失败时怎样恢复。

建议为练习创建独立 Git 分支，不要直接修改 `main`。一个练习只解决一个问题，并保持提交足够小，方便比较改动前后的行为。

## 2. 建立可工作的基线

### 2.1 环境

- Node.js 22.13 或更高版本
- npm 11 或更高版本
- .NET SDK 10
- Chrome 或 Edge
- Git

### 2.2 启动默认开发模式

```powershell
cd frontend
npm install
npm run dev
```

打开 <http://localhost:3000>，使用以下演示账号：

- Email：`demo@issueflow.dev`
- Password：`issueflow`

登录后至少完成一次完整操作：搜索 Issue、新建 Issue、编辑状态、在看板中拖动、添加评论、上传附件，再删除刚创建的 Issue。

### 2.3 先保存一次质量基线

```powershell
cd frontend
npx playwright install chromium # 首次运行 E2E 前执行一次
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

这些命令在开始学习时应该全部通过。以后若练习导致失败，就能确认失败来自自己的改动，而不是初始环境。

## 3. 理解三种数据模式

同一套 React 界面支持三种数据来源。学习时应明确自己正在使用哪一种：

| 模式         | 配置                                             | 数据位置                    | 适合学习                                  |
| ------------ | ------------------------------------------------ | --------------------------- | ----------------------------------------- |
| 浏览器演示   | `NEXT_PUBLIC_DEMO_MODE=local`                    | localStorage                | HTML/CSS、TypeScript、React 与快速实验    |
| 默认同源 API | 不设置额外变量                                   | 本地开发时的 D1/R2 兼容环境 | Route Handler、同源请求、SQL、对象存储    |
| .NET API     | `NEXT_PUBLIC_API_BASE_URL=http://localhost:5170` | SQLite 与本地上传目录       | 前后端契约、Cookie、CORS、Problem Details |

推荐先用浏览器演示模式隔离学习纯前端，再切回默认同源 API 学持久化，最后连接 .NET API 对照 HTTP Contract。不要一开始同时调试两个后端。

配置优先级需要特别注意：只要 `NEXT_PUBLIC_DEMO_MODE=local`，前端就会使用浏览器模拟数据，即使同时设置了 `NEXT_PUBLIC_API_BASE_URL`。连接 .NET API 前必须把 `NEXT_PUBLIC_DEMO_MODE` 清空。

开始纯前端阶段时，可复制示例配置并将 `NEXT_PUBLIC_DEMO_MODE` 设为 `local`：

```powershell
Copy-Item frontend/.env.example frontend/.env.local
# 编辑 frontend/.env.local：
# NEXT_PUBLIC_API_BASE_URL=
# NEXT_PUBLIC_DEMO_MODE=local
```

切回默认同源 API 时，将 `NEXT_PUBLIC_DEMO_MODE` 留空。修改环境变量后需要重新启动前端开发服务器。请求的主路径是：

```text
screen/component
  -> TanStack Query
  -> src/api/issueflowApi.ts
  -> /api/** 同源 Route Handler -> D1 / R2
     或 http://localhost:5170 -> .NET Minimal API -> SQLite / 文件存储
```

## 4. 先认识项目地图

| 目录或文件                          | 作用                              | 第一次阅读时关注什么                  |
| ----------------------------------- | --------------------------------- | ------------------------------------- |
| `frontend/src/app/IssueFlowApp.tsx` | 客户端应用入口和路由表            | 路由嵌套、懒加载、受保护路由          |
| `frontend/src/app/AppProviders.tsx` | Query、认证、主题和通知等全局能力 | Provider 边界以及状态所有权           |
| `frontend/src/screens/`             | 与路由对应的页面                  | 页面如何组织查询、交互和布局          |
| `frontend/src/features/issues/`     | Issue 领域类型、表单和复用组件    | 类型建模、校验、受控表单              |
| `frontend/src/components/ui.tsx`    | 通用 UI 原语                      | 可复用组件和可访问性约定              |
| `frontend/src/api/issueflowApi.ts`  | 前端数据访问边界                  | HTTP 与 localStorage 如何保持同一契约 |
| `frontend/app/api/`                 | 同源 API Route Handlers           | 请求校验、认证、D1/R2 调用            |
| `frontend/src/server/`              | 同源 API 的服务端逻辑             | 数据库初始化、授权、Problem Details   |
| `frontend/db/schema.ts`             | Drizzle 数据模型                  | 表、外键、唯一约束和索引              |
| `frontend/drizzle/`                 | 已检查的 SQL Migration            | schema 如何变成真实 SQL               |
| `frontend/e2e/`                     | Playwright 流程测试               | 从用户视角验证完整生命周期            |
| `backend/IssueFlow.Api/`            | .NET 10 标准后端                  | Endpoint、EF Core、Identity、安全上传 |
| `backend/IssueFlow.Api.Tests/`      | 后端集成测试                      | HTTP Contract 的可执行证明            |
| `.github/workflows/ci.yml`          | 持续集成                          | 本地质量门如何映射到远端 CI           |

当前仓库有三层“路由”，第一次阅读时不要混为一谈：

- `frontend/app/page.tsx` 与 `frontend/app/[...path]/page.tsx` 是 Vinext/Sites 页面入口。
- 产品内的导航和嵌套路由实际由 `IssueFlowApp.tsx` 中的 React Router 管理。
- `frontend/app/api/**` 是运行在服务端的 API Route Handlers，不是可见页面。

## 5. 推荐学习路线

路线按依赖关系排列。若每天投入 1～2 小时，可以在 6～8 周完成；若全职学习，可按阶段而不是按周推进。

### 阶段 0：浏览器和一次完整请求

**目标**：能说明浏览器加载页面、执行 JavaScript、发送请求和更新 DOM 的过程。

阅读顺序：

1. `frontend/app/page.tsx`
2. `frontend/src/app/IssueFlowApp.tsx`
3. `frontend/src/screens/LoginPage.tsx`
4. `frontend/src/api/issueflowApi.ts` 中的 `request`
5. `frontend/app/api/auth/login/route.ts`

练习：

- 在 Network 面板找到登录请求，记录方法、URL、状态码、请求体、响应体和 Cookie。
- 禁用 JavaScript 后重新打开页面，描述客户端应用为什么不能正常工作。
- 给不存在的 Issue ID 发请求，比较成功响应与 Problem Details 错误响应。

验收：不用看代码，画出“点击登录到进入 Dashboard”的时序图，并解释 `401`、`403`、`404` 的区别。

### 阶段 1：TypeScript 与领域模型

**目标**：用类型表达有效状态，把纯业务逻辑与 React 分开。

阅读顺序：

1. 在应用中打开 `/labs/typescript`，依次运行 12 个预编译课程
2. `frontend/src/features/typescript-lab/README.md`
3. `frontend/src/features/typescript-lab/examples.ts`
4. `frontend/src/features/typescript-lab/compile-time-examples.ts`
5. `frontend/src/features/issues/types.ts`
6. `frontend/src/data/seed.ts`
7. `frontend/src/features/issues/types.test.ts`
8. `frontend/src/api/issueflowApi.ts` 中的列表过滤和排序逻辑

重点理解：

- `IssueStatus`、`IssuePriority` 为什么适合使用字符串联合类型。
- `IssueInput`、`IssueUpdate`、`Issue` 为什么不是同一个类型。
- `buildIssueQuery` 为什么是纯函数，纯函数为什么更容易测试。
- `unknown`、类型收窄和泛型在 API 边界上的价值。
- 为什么 .NET `long` 只有在安全整数范围内才能直接映射为 JavaScript `number`。
- 为什么 `DateOnly` 日历日期不能和 `DateTimeOffset` 时间点使用同一套解析语义。
- `@ts-expect-error` 如何让“这段代码必须编译失败”也成为可执行验收。
- 为什么 TypeScript Lab 不提供 `eval` 式任意代码执行器，而是让示例参与项目的严格编译和测试。

练习：

- 比较客户端、D1 和 .NET 当前的 Tags 规则并记录差异；完成阶段 9 后再选择统一限制，同时修改三层 Contract 与测试，不要只改客户端。
- 新增一个纯函数，判断 Issue 是否在七天内到期。
- 故意把状态写成 `in-progress`，观察 TypeScript 在哪里阻止错误。
- 在 TypeScript Lab 中完成一个 Challenge：先写失败测试，再把 Runner 和课程目录一起扩展。

验收：`npm run typecheck` 和 `npm test` 通过；能解释“编译期类型安全不等于运行时输入可信”，并能指出
`unknown → type guard → narrowed value` 的完整边界。

### 阶段 2：React 组件、状态与表单

**目标**：理解组件、Props、State、派生值、受控表单和状态提升。

阅读顺序：

1. `frontend/src/features/issues/IssueForm.tsx`
2. `frontend/src/screens/IssueFormPage.tsx`
3. `frontend/src/features/issues/components.tsx`
4. `frontend/src/components/ui.tsx`
5. `frontend/src/features/issues/IssueForm.test.tsx`

重点问题：

- 哪些值属于服务端数据，哪些属于临时表单状态？
- 哪些值可以从现有状态计算，不应该额外保存？
- 表单错误为何与字段关联，提交失败后焦点应该去哪里？
- 组件何时应该拆分，何时拆分只会增加跳转成本？

练习：

- 给 Description 增加剩余字符提示，但不要保存第二份派生状态。
- 给 Due Date 增加“清除日期”操作，并用键盘完成操作。
- 为一个失败的提交补组件测试，确认输入内容不会丢失。

验收：能用 React DevTools 说明一次输入为何触发重新渲染，并能指出表单状态的唯一来源。

### 阶段 3：CSS、响应式设计与可访问性

**目标**：理解布局、设计变量、断点和键盘交互，而不是只让页面“看起来差不多”。

阅读顺序：

1. `frontend/app/globals.css`
2. `frontend/app/product.css`
3. `frontend/app/responsive.css`
4. `frontend/src/layouts/AppLayout.tsx`
5. `frontend/src/components/ui.tsx` 中的 Modal 和 Loading 状态
6. `frontend/src/app/AppProviders.tsx` 中的 Toast，以及 `components.tsx`、`AppLayout.tsx` 中的菜单

练习：

- 分别在 1440 px、768 px 和 390 px 宽度下检查 Issue 列表。
- 只用键盘完成登录、新建和删除操作。
- 用浏览器模拟 `prefers-color-scheme`，观察 System 主题。
- 临时删除一个 `aria-*` 关联，使用 Accessibility Tree 比较前后差异。

验收：页面在 200% 缩放下仍可操作；焦点可见；Modal 打开、关闭和焦点归还行为正确；移动端没有只能靠鼠标访问的功能。

### 阶段 4：路由、URL 状态与认证边界

**目标**：理解“页面状态”和“URL 状态”的区别，以及认证为何需要服务端共同参与。

阅读顺序：

1. `frontend/src/app/IssueFlowApp.tsx`
2. `frontend/src/layouts/AppLayout.tsx`
3. `frontend/src/screens/IssuesPage.tsx`
4. `frontend/src/screens/settings/SettingsLayout.tsx`
5. `frontend/src/app/AppProviders.tsx` 中的认证部分

重点理解：

- 搜索、过滤、排序和页码为什么放进 Query String。
- Nested Route 如何让设置页共享布局。
- `ProtectedRoute` 提升的是用户体验，不是后端授权替代品。
- 登录前访问受保护地址，成功登录后如何返回原位置。

练习：

- 复制一个带过滤条件的 `/issues?...` URL，在无痕窗口中验证状态可复现。
- 增加一个“已逾期”URL Filter，并补查询构建与浏览器历史测试。
- 为无效 Issue ID 和未知路由分别验证错误界面。

验收：浏览器前进、后退、刷新和分享 URL 后，界面状态均符合预期。

### 阶段 5：TanStack Query 与服务端状态

**目标**：区分客户端 UI 状态和服务端状态，掌握缓存、失效、分页与乐观更新。

阅读顺序：

1. `frontend/src/screens/IssuesPage.tsx`
2. `frontend/src/screens/IssueDetailPage.tsx`
3. `frontend/src/screens/BoardPage.tsx`
4. `frontend/src/api/issueflowApi.ts`

重点追踪：

- `queryKey` 如何描述缓存身份。
- 普通分页与 `useInfiniteQuery` 如何使用同一列表契约。
- 状态修改前如何保存旧缓存，失败时如何回滚。
- 为什么成功或结束时还要 `invalidateQueries`。
- 搜索防抖减少了什么成本，它没有解决什么问题。

练习：

- 在 DevTools 中把网络切到 Slow 3G，观察 Skeleton、提交中状态和乐观更新。
- 临时让 PATCH 返回错误，确认列表和看板会回滚到旧状态。
- 在分页控件获得 hover 或 focus 时预取下一页，并验证当前页不会出现额外 Loading。

验收：能解释一次看板拖动涉及哪些缓存、失败时恢复哪些值，以及为什么不能把服务端列表复制进普通 `useState` 长期维护。

### 阶段 6：HTTP、API Contract 与错误处理

**目标**：理解前端数据层怎样屏蔽不同后端，同时保留一致的成功和失败语义。

阅读顺序：

1. `frontend/src/api/issueflowApi.ts`
2. `frontend/src/server/problem.ts`
3. `frontend/app/api/issues/route.ts`
4. `frontend/app/api/issues/[id]/route.ts`
5. `frontend/src/server/issueflow-db.ts`
6. `frontend/src/server/auth.ts`

练习：

- 从 Network 中选一个 Issue 列表请求，逐字段追踪 Route Handler、数据库行和前端 Contract 的映射。
- 使用 DevTools 或 `.http` 文件发送无效 POST，记录 `400` 的字段错误。
- 尝试创建重复标题，追踪 `409` 如何转化为界面消息。
- 为一个新的可预期错误补前端处理和后端集成测试。

验收：能说明 `201`、`204`、`400`、`401`、`403`、`404`、`409` 各自对应的业务情况，并保证 UI 不依赖 D1 数据库行的内部结构。

### 阶段 7：高级交互——拖放、评论与附件

**目标**：把复杂交互拆成浏览器事件、状态变更、网络请求和错误恢复。

阅读顺序：

1. `frontend/src/screens/BoardPage.tsx`
2. `frontend/src/screens/IssueDetailPage.tsx`
3. `frontend/app/api/issues/[id]/comments/route.ts`
4. `frontend/app/api/issues/[id]/attachments/route.ts`
5. `frontend/app/api/attachments/[id]/route.ts`

练习：

- 在现有状态下拉框之外，为看板增加用方向键在相邻列间移动卡片的快捷操作。
- 分别上传允许和禁止的文件，比较浏览器校验与服务端校验。
- 观察附件对象 Key 与原始文件名为什么必须分开保存。
- 在上传中断时确认界面能恢复并给出可理解的错误。

验收：能解释为什么客户端的 5 MB 检查不能替代服务端限制，以及同源 API 如何使用大小、MIME、安全对象 Key 和下载 Header 建立服务端边界。

### 阶段 8：D1、R2 与生产数据适配

**目标**：理解边缘运行环境中的关系数据、对象存储、迁移和身份边界。

阅读顺序：

1. `frontend/db/schema.ts`
2. `frontend/drizzle/0000_lying_star_brand.sql`
3. `frontend/src/server/issueflow-db.ts`
4. `frontend/src/server/auth.ts`
5. `frontend/app/api/attachments/[id]/route.ts`

重点理解：

- D1 保存结构化元数据，R2 保存附件二进制内容。
- Migration 是可审核的版本历史，不能只依赖运行时自动建表。
- 外键、唯一约束、检查约束和索引各解决什么问题。
- 对象存储 Key 为什么不可预测，下载响应为什么设置 `nosniff`。
- 浏览器中的“已登录”界面为何不等于服务端已经授权写操作。

练习：

- 对照 Drizzle Schema 阅读 SQL 中的外键、`CHECK`、`NOCASE` 和索引。
- 从 Issue 筛选与排序 SQL 反推每个索引服务的查询。
- 创建 Issue 后重启浏览器，确认数据不是浏览器临时状态。
- 上传附件，分别追踪 D1 Metadata 与 R2 Object。

验收：能从 `schema.ts` 找到对应 SQL，解释 Issue、Comment、Attachment 的删除关系，并说明 D1 与 R2 为什么不能互相替代。

### 阶段 9：用同一前端对照 .NET 后端

**目标**：把已有后端经验映射为前端真正依赖的 Contract，而不是让 UI 知道数据库细节。

阅读顺序：

1. `backend/IssueFlow.Api/Program.cs`
2. `backend/IssueFlow.Api/Features/Issues/`
3. `backend/IssueFlow.Api/Data/AppDbContext.cs`
4. `backend/IssueFlow.Api/Data/SeedData.cs`
5. `backend/IssueFlow.Api/Features/Authentication/`
6. `backend/IssueFlow.Api.Tests/ApiContractTests.cs`

启动 .NET API：

```powershell
dotnet run --project backend/IssueFlow.Api
```

然后复制 `frontend/.env.example` 为 `frontend/.env.local`，设置：

```dotenv
NEXT_PUBLIC_DEMO_MODE=
NEXT_PUBLIC_API_BASE_URL=http://localhost:5170
```

练习：

- 对比同一列表请求在 D1 Route Handler 和 .NET Endpoint 中的响应，确认前端 Contract 相同。
- 依次复现匿名写入 `401`、不存在资源 `404`、校验错误 `400` 和重复标题 `409`。
- 对比两套上传边界；理解 .NET 为什么进一步检查扩展名、MIME 与文件签名。
- 新增一个 `/api/issues/stats` 只读 Endpoint，在 Dashboard 中展示真实统计，并同时补后端集成测试和前端查询状态。

验收：Cookie 登录、Credentialed CORS、分页、验证错误和上传都能通过浏览器工作；切换数据实现时页面组件不需要重写。

### 阶段 10：测试、质量门与 CI

**目标**：根据风险选择测试层级，让测试验证用户可观察行为而不是实现细节。

阅读顺序：

1. `frontend/src/features/issues/types.test.ts`
2. `frontend/src/features/issues/IssueForm.test.tsx`
3. `frontend/src/screens/IssuesPage.test.tsx`
4. `frontend/e2e/issue-lifecycle.spec.ts`
5. `backend/IssueFlow.Api.Tests/ApiContractTests.cs`
6. `.github/workflows/ci.yml`

测试层级：

| 层级        | 适合验证                   | 本项目示例                    |
| ----------- | -------------------------- | ----------------------------- |
| Unit        | 纯函数和边界条件           | 校验、Query String、Formatter |
| Component   | 组件对用户输入的反应       | IssueForm 必填和提交          |
| Integration | 多组件或真实 HTTP Contract | 搜索与 API 集成测试           |
| E2E         | 最关键的用户旅程           | 登录到 Issue 完整生命周期     |

练习：

- 先写一个失败测试，再实现“七天内到期”提示。
- 修改一个 API Contract，观察哪些测试最先指出破坏。
- 在本地运行与 CI 相同的命令，比较并修复环境差异。

验收：能为一个新需求说明为什么选择某个测试层级；所有质量命令通过；测试失败信息能直接指出行为差异。

## 6. 三条重点源码追踪路线

### 6.1 Issue 列表

```text
IssuesPage.tsx
  -> buildIssueQuery / URLSearchParams
  -> useQuery 或 useInfiniteQuery
  -> issueflowApi.listIssues
  -> app/api/issues/route.ts 或 .NET IssueEndpoints
  -> 分页结果
  -> 表格或移动卡片
```

检查点：搜索防抖、过滤组合、稳定排序、页码边界、空状态、错误状态和缓存 Key。

### 6.2 新建与编辑

```text
IssueFormPage.tsx
  -> IssueForm.tsx
  -> validateIssue
  -> useMutation
  -> POST/PATCH API
  -> 缓存失效
  -> 详情页或列表页
```

检查点：受控输入、客户端校验、服务端字段错误、重复标题、提交禁用和成功跳转。

### 6.3 看板状态变更

```text
原生 drag 事件
  -> BoardPage mutation
  -> 保存旧缓存
  -> 乐观更新列
  -> PATCH status
  -> 成功后重新确认，失败则回滚
```

检查点：拖动过程中的视觉反馈、并发修改、失败 Toast、键盘替代操作和列表/详情缓存一致性。

## 7. 推荐综合练习

按下面顺序完成，每项都应该包含代码、测试和一段简短复盘：

1. **Due Soon 标记**：七天内到期且未关闭的 Issue 显示提示；先写纯函数测试。
2. **保存筛选视图**：为一组 URL Filter 命名并保存；恢复视图、刷新、前进和后退后状态一致。
3. **Dashboard 真实统计**：新增后端统计 Contract，处理 Loading、Error 和 Empty。
4. **乐观更新故障实验**：模拟 PATCH 失败，证明列表、详情和看板都能恢复。
5. **附件可访问性**：补充上传进度、错误播报和键盘操作，并验证服务端仍做独立校验。
6. **回归测试**：把上述关键路径加入合适层级的测试，确保 CI 全部通过。

不要一次完成全部功能。每个练习遵循：先定义验收标准，再写最小测试，再实现，再重构。

## 8. 调试方法

遇到问题时按边界逐层缩小范围：

1. **浏览器**：Console 是否报错？元素是否存在？事件是否触发？
2. **React**：Props 和 State 是否符合预期？是否保存了多余派生状态？
3. **Query**：Query Key 是否变化？缓存是 stale、fetching 还是 error？
4. **Network**：方法、URL、Cookie、请求体、状态码、响应体是否正确？
5. **API**：错误是否使用准确的状态码和 Problem Details？
6. **数据层**：约束、索引、事务或对象 Key 是否符合预期？
7. **测试**：能否把问题缩小成一个稳定复现的自动化测试？

不要用增加随机延时、到处刷新 Query 或复制一份状态来掩盖竞态和所有权问题。

## 9. 每阶段复盘模板

完成一个阶段后，在自己的学习笔记中回答：

```text
本阶段完成了什么可观察行为？
数据的唯一来源在哪里？
用户操作触发了哪些事件和网络请求？
正常、加载、空、错误四种状态如何呈现？
键盘和窄屏下是否仍能完成操作？
哪一层测试最适合保护这个行为？为什么？
如果请求失败或并发发生，系统怎样恢复？
下一次会怎样把改动拆得更小？
```

如果不能不用术语堆砌地回答这些问题，就回到 DevTools 和测试重新观察一次。

## 10. 最终毕业标准

当你能够独立完成以下任务时，可以认为已经掌握了本项目覆盖的核心能力：

- 从设计需求拆出页面状态、URL 状态、服务端状态和持久化状态。
- 用 TypeScript 建立 UI 与 API 共同遵守的清晰 Contract。
- 实现包含 Loading、Empty、Error 和成功状态的 React 页面。
- 正确使用 Router、TanStack Query、Mutation、缓存失效与乐观回滚。
- 构建桌面与移动端均可用、键盘可操作的界面。
- 使用 DevTools 定位 DOM、CSS、请求、缓存和性能问题。
- 为纯逻辑、组件、HTTP Contract 和关键旅程选择合适测试层级。
- 让前端分别连接同源 D1/R2 API 与 .NET API，而不重写页面。
- 理解 Cookie、CORS、服务端授权、上传校验和错误状态码的边界。
- 在提交前运行完整质量门，并能读懂 GitHub Actions 失败日志。

更细的概念讲解、16 周原始路线、每章限制和官方资料索引，请继续查阅
[`frontend_learning_project_detailed.md`](frontend_learning_project_detailed.md)。
