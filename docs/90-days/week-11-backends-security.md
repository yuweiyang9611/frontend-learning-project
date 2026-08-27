# 第 11 周：双后端、持久化与安全边界

本周从前端依赖的 HTTP Contract 出发，对照 .NET/SQLite 与同源 D1/R2。目标不是七天内
成为后端专家，而是能读懂请求如何被绑定、验证、持久化和拒绝，并用同一组黑盒用例证明
两种真实后端的共同点与差异。

## 本周成果

- 在 Network、进程和存储三处证明当前实际数据路径；
- 区分 Shape、Error 与 Behavioral Contract；
- 从 ASP.NET Core Program、Minimal API Endpoint 追到 DTO 和响应；
- 理解 SQL/EF Core 的关系、唯一约束、Migration、Seed 与稳定分页；
- 从同源 Route Handler 追到 D1 记录和 R2 附件对象；
- 解释 Cookie、授权、Credentialed CORS、CSRF 和 Problem Details 的边界；
- 用隔离存储验证上传拒绝、失败清理和双后端 Contract 差异。

配套教材：[持久化、双后端与安全边界](../learning/10-persistence-backends-and-security.md)、
[后端对照专题](../backend/)、[.NET 与 TypeScript Wire Contract](../typescript/05-dotnet-wire-contracts.md)
和[产品需求](../reference/product-requirements.md)。

::: danger 数据安全规则
所有 create、delete、migration、并发和上传破坏实验必须使用测试工厂、临时 SQLite、
本地 D1 测试实例或唯一测试数据。禁止针对已部署站点、共享数据库、日常 `issueflow.db`
和日常 `uploads` 目录运行清理或破坏用例。
:::

---

## Day 71：证明三种数据路径并定义 Contract 层次

### 120 分钟任务

- **0–15：**不看文档，画出 local、同源 D1/R2、.NET/SQLite 三条请求路径。
- **15–40：**学习 API adapter、数据所有权和 Shape/Error/Behavior 三层 Contract。
- **40–80：**至少运行 local 与一个真实后端，记录 URL、Cookie、进程和持久化位置。
- **80–110：**对同一列表请求建立三模式对照，并复现一个已知行为差异。
- **110–120：**提交路径证据和 Contract 分类表。

### 数据路径实验

先检查 `.env.example` 和 `issueflowApi.ts` 的真实选择顺序，再运行实验。每次修改公开环境变量
后重启前端服务器，不依赖旧进程。

| 证据               | local               | 同源 D1/R2       | .NET/SQLite     |
| ------------------ | ------------------- | ---------------- | --------------- |
| Request URL        | 实测                | 实测             | 实测            |
| 是否产生 HTTP 请求 | 实测                | 实测             | 实测            |
| 服务进程           | 浏览器              | 前端服务端运行时 | .NET 进程       |
| 结构化数据位置     | localStorage        | D1               | SQLite          |
| 附件字节位置       | 浏览器模拟/实际策略 | R2               | 文件系统        |
| 授权证据           | 演示身份            | 平台/本地策略    | Identity Cookie |

使用 Network 的 Remote Address、Request URL 和 Cookie，再结合 Application 面板及服务器
日志证明，而不是只根据页面外观猜后端。

### 三层 Contract

- **Shape：**字段名、JSON 类型、nullability、分页 envelope；
- **Error：**状态码、Problem Details、字段 errors、204 空 body；
- **Behavior：**搜索范围、默认值、规范化、排序和并发规则。

同一个表格能渲染只证明部分 Shape 相容，不能证明错误与行为一致。

### 独立任务

对 `GET /api/issues?page=1&pageSize=5` 和一个非法 query，在三模式中记录结果。至少复现
“非法 query”“search 范围”“空 PATCH”“非 nullable null”“tags 规范化”中的一项差异，
按三层 Contract 分类，并写出需要产品决定的问题。

### 当日证据

- 三条真实路径图和环境变量值；
- Network、进程、存储三类证据；
- 同一请求三模式结果表；
- 一个差异报告，含分类与产品决策问题。

### 当日验收

- [ ] 能证明而不是猜测当前使用哪个后端。
- [ ] 不把 localStorage 模式纳入真实后端一致性承诺。
- [ ] 能给差异标注 shape、error 或 behavior。
- [ ] 切换变量后确认开发服务器已重启。

---

## Day 72：从 Program 读懂 Minimal API 与 HTTP Contract

### 120 分钟任务

- **0–15：**写下你认为服务注册、中间件和 Endpoint 各发生在什么时候。
- **15–40：**学习阅读 C# record/class、泛型、async/await、Lambda 和依赖注入所需的最小语法。
- **40–80：**从 `Program.cs` 追到 `IssueEndpoints.cs`、Request、Validation 和 Response Mapping。
- **80–110：**使用 OpenAPI 与集成测试验证一个 GET、POST、PATCH 和 DELETE Contract。
- **110–120：**提交资源矩阵和启动管线图。

### 零后端经验阅读桥

今天不要求写复杂 C#。先识别：

- `builder.Services.Add...` 注册之后可能被注入的能力；
- `app.Use...` 按顺序组装请求管线；
- `app.Map...` 把 HTTP 方法和路径绑定到处理器；
- 方法参数可能来自 route、query、JSON body、form、DI 或 CancellationToken；
- `Task<T>`/`await` 表示异步结果，不等于启动新线程；
- Request、Entity、Response 是不同类型和职责。

### 源码追踪

从 `backend/IssueFlow.Api/Program.cs` 开始，完成：

```text
service registration
  → middleware order
  → MapIssueEndpoints
  → route/query/body binding
  → validation
  → EF operation
  → IssueMapping
  → typed result + status code
```

然后打开 Development OpenAPI，选择 POST Issue，对照 request schema、201、400、401、409
元数据及真实集成测试。`Produces` 描述可能响应，测试才证明实际行为。

### 独立任务

为 Issues 建立资源矩阵，至少包含 method、path、输入来源、成功 status/body、失败 status、
是否需要认证。再为以下行为补或定位现有集成测试：

- POST 成功为 201 且有 Location；
- 空标题为字段化 400；
- 匿名写入为 JSON 401 而非 302 HTML；
- PATCH omitted/null/value；
- DELETE 成功为 204 且 response body 为空。

若测试已存在，增加一个有价值的边界，而不是复制同一断言。

### 当日证据

- 最小 C# 阅读词汇表；
- Program/Endpoint 管线图；
- Issues 资源矩阵；
- OpenAPI 与实际测试的对照结果。

### 当日验收

- [ ] 能区分 AddCors 与 UseCors、服务注册与请求执行。
- [ ] Entity 没有被直接当成稳定 API Response。
- [ ] 能解释 201 Location 与 204 空 body。
- [ ] 能指出一个参数来自 HTTP、一个来自 DI。

---

## Day 73：用 SQL 与 EF Core 理解关系、Migration 和稳定分页

### 120 分钟任务

- **0–15：**画出 Issue、Member、Comment、Attachment 的关系及删除预期。
- **15–40：**学习 SELECT/WHERE/ORDER BY/LIMIT/OFFSET、主键、外键、索引和唯一约束。
- **40–80：**追踪 `AppDbContext`、Migration、Seed 与列表 IQueryable 到生成 SQL。
- **80–110：**在隔离 SQLite 中验证唯一冲突、删除行为和稳定分页。
- **110–120：**提交 schema 图、SQL 记录和测试结果。

### 数据模型追踪

打开：

- `backend/IssueFlow.Api/Data/AppDbContext.cs`；
- `backend/IssueFlow.Api/Migrations`；
- `backend/IssueFlow.Api/Data/SeedData.cs`；
- Issue Entity、Mapping 与列表 Endpoint；
- `backend/IssueFlow.Api.Tests/IssueFlowApiFactory.cs`。

为每个关系写清 required/optional 与删除行为。数据库 Cascade 只能删除附件记录，不能自动
删除文件系统中的字节；这会在 Day 76 单独验证。

### SQL 观察实验

在 Development 日志或测试日志中观察：

1. 默认 page 1；
2. status + priority；
3. search；
4. assignee；
5. updatedAt 排序；
6. page 3。

标出 COUNT、WHERE 参数、ORDER BY、唯一 tie-break、LIMIT 与 OFFSET。若多个 Issue 的主排序
值相同而没有唯一 tie-break，翻页可能重复或遗漏。

### 独立任务

使用测试工厂的临时 SQLite，完成两项测试：

1. 两个请求使用同一 normalized title，证明预检查提供友好反馈、唯一约束兜底竞态并映射
   为 409；
2. 创建多条相同主排序值记录，连续取两页，证明没有重复或遗漏。

不要删除或复制日常数据库来“重置”实验。

### 当日证据

- 关系与删除行为图；
- 一个 Migration 的 Up/Down 意图；
- 六种查询的 SQL 观察表；
- 唯一冲突和稳定分页测试输出。

### 当日验收

- [ ] 能解释为什么前置重复检查不能替代唯一索引。
- [ ] 分页排序包含唯一 tie-break。
- [ ] 知道 Tags JSON 难以单独索引和约束的代价。
- [ ] 实验使用隔离数据库且测试结束可清理。

---

## Day 74：从同源 Route Handler 追到 D1 与 R2

### 120 分钟任务

- **0–15：**预测同源 API 为何不需要浏览器跨 Origin 读取权限。
- **15–40：**学习 Route Handler、D1 SQL、Drizzle schema/migration 与 R2 对象的职责。
- **40–80：**从 `frontend/app/api/issues` 追到 server 数据函数、D1 schema 和响应。
- **80–110：**对照 .NET 实现运行相同 GET/非法 query/PATCH 用例并记录差异。
- **110–120：**提交同源请求链和一个差异的根因定位。

### 源码追踪

从浏览器请求开始：

```text
IssuesPage
  → issueflowApi
  → /api/issues Route Handler
  → auth / parse / validation
  → issueflow-db.ts
  → D1 SQL
  → response JSON
```

再追踪一次附件：metadata 进入 D1，bytes 进入 R2。记录 schema 与 migration 文件的位置，
并说明前端 TypeScript interface 为什么不会创建数据库约束。

### 对照实验

向同源与 .NET 分别发送：

- 合法 page 1；
- `page=0`、未知 status 或未知 sort；
- search 命中 Issue key 但不命中 title/description；
- 空 `{}` PATCH；
- `{"assigneeId":null}`；
- tags 带重复、空白和大小写差异。

保存 method、URL、request、status、response 和数据副作用。不要自动宣布 .NET 一定是产品最终
答案；课程把它视为 canonical 是当前约定，差异仍需要显式产品决定。

### 独立任务

选一个差异，从 UI 一直追到两个服务器的解析/验证位置，写根因报告：

```text
可见行为 → API adapter → 同源实现 → .NET 实现
         → 差异层次 → 产品决定 → 两边修复/适配位置 → 回归测试
```

如果提出修复，前端 Screen 不得出现 `if (backend === ...)`；优先统一后端或在 API adapter
归一。

### 当日证据

- 同源 Issue 与附件请求链；
- D1 schema/migration 对应字段；
- 六类双后端请求对照；
- 一个差异根因与建议修复层。

### 当日验收

- [ ] 能解释同源不等于不需要认证。
- [ ] 能区分 D1 结构化记录和 R2 文件字节。
- [ ] 不让 Screen 解析后端专属错误字符串。
- [ ] 差异报告包含可重复 request，而不是只写结论。

---

## Day 75：验证 Cookie、授权、CORS、CSRF 与 Problem Details

### 120 分钟任务

- **0–15：**分别写出认证、授权、CORS、CSRF 的一句话定义。
- **15–40：**学习 Identity Cookie 生命周期、中间件顺序和结构化错误。
- **40–80：**在浏览器追踪 login → session → authenticated write → logout。
- **80–110：**用隔离测试产生 400/401/403/404/409/415 和受控 500。
- **110–120：**提交 Cookie 请求链、错误矩阵与安全边界说明。

### Cookie 与授权实验

在 .NET 模式观察：

1. POST login 的 request 与 `Set-Cookie`；
2. Application 面板中的 HttpOnly/SameSite/Secure 等实际属性；
3. GET session 和写请求是否携带 Cookie；
4. 删除 Cookie 后的匿名写请求；
5. logout 后原 Cookie 是否仍可恢复 session；
6. 前端 localStorage Session 字段被手工修改后，服务端是否因此授权。

不要把 Cookie 值、密码或真实身份信息复制进笔记和提交。

### CORS 与 CSRF

当前端 3000 访问 .NET 5170 时，记录 Origin、preflight、允许 Origin 和 credentials。
说明：CORS 决定浏览器脚本能否读取跨源响应，不负责证明用户身份；curl/服务器端请求不执行
浏览器 CORS；允许 credentials 也不自动解决 CSRF。

### 独立任务

在集成测试中产生并验证：

| 状态 | 必须断言                        |
| ---- | ------------------------------- |
| 400  | Validation Problem、字段 errors |
| 401  | JSON Problem，不是 302/HTML     |
| 403  | 已认证但无权限的稳定响应        |
| 404  | 资源与 instance                 |
| 409  | 冲突而非通用 500                |
| 415  | 不支持媒体类型                  |
| 500  | 不泄露内部异常，保留 traceId    |

再说明错误应显示在字段、页面还是 Toast，以及客户端 decoder 如何处理没有 `errors` 的 Problem。

### 当日证据

- 去敏后的 Cookie 生命周期截图/表；
- credentialed CORS 四个必要条件；
- 七种错误的 Content-Type 和 body shape；
- localStorage 身份伪造无法获得服务端授权的证据。

### 当日验收

- [ ] 不把客户端 Session Profile 当成授权凭据。
- [ ] 匿名 API 请求返回 401 JSON，不重定向 HTML。
- [ ] 不使用 AllowAnyOrigin 与 credentials 的危险组合。
- [ ] 能解释 CORS 与 CSRF 为什么不能互相替代。

---

## Day 76：把文件上传当作不可信输入与跨存储事务

### 120 分钟任务

- **0–15：**列出文件名、扩展名、Content-Type 和文件内容中哪些可以信任。
- **15–40：**学习 multipart、大小限制、MIME、签名、随机存储名、路径与 `nosniff`。
- **40–80：**追踪前端 FormData、Attachment Endpoint、FilePolicy、Storage 和 metadata insert。
- **80–110：**在隔离目录运行合法、伪造、过大、空文件、DB 失败和删除清理测试。
- **110–120：**提交上传威胁模型和数据库/文件系统一致性结果。

### 上传调用链

```text
file input
  → FormData（浏览器生成 multipart boundary）
  → POST attachment
  → auth + size/MIME/extension/signature validation
  → random storage name within root
  → write bytes
  → insert metadata
  ├─ success
  └─ DB failure → delete written file
```

原始文件名只作为显示/下载 metadata，不能拼进磁盘路径。前端的 `accept` 属性是用户体验，
不是服务端安全边界。

### 隔离测试矩阵

至少覆盖：

- 合法 TXT、PNG、JPEG、PDF；
- 超过 5 MB；
- 不支持 MIME；
- `.pdf` 扩展名但内容不是 PDF；
- PNG Content-Type 配文本内容；
- 空文件；
- 包含 `../` 或绝对路径特征的原始文件名；
- 文件已写入后数据库失败；
- 删除 Issue 后附件 row 与物理文件；
- 下载响应的 Content-Type、Content-Disposition、`nosniff`，若支持则验证 Range。

每次使用测试工厂产生唯一临时根目录；测试后只清理该明确目录。

### 独立任务

选择“数据库写失败”或“删除 Issue”场景，先写一个会失败的集成测试，同时断言数据库和
文件系统。修复或确认当前实现后再次运行。仅断言 HTTP status 不足以证明没有孤儿文件。

### 当日证据

- 上传信任边界图；
- 至少 10 行测试矩阵及实际结果；
- 临时数据库/附件根路径和清理证据；
- 一个跨存储失败测试的前后结果。

### 当日验收

- [ ] 不手工设置 multipart boundary。
- [ ] 不依赖扩展名或 Content-Type 单一检查。
- [ ] 存储名不可由原始文件名控制。
- [ ] DB 失败和资源删除后没有孤儿测试文件。

---

## Day 77：交付双后端黑盒 Contract Suite 与差异报告

### 120 分钟任务

- **0–15：**闭卷画出 React 到两种真实后端及各自存储的拓扑。
- **15–65：**完成可切换 Base URL/Adapter 的黑盒 suite，并运行核心用例。
- **65–90：**归类结果，复现至少五项已知差异并写产品决定。
- **90–108：**运行后端、前端相关测试与质量门，确认隔离数据已清理。
- **108–120：**完成对照报告、自评和进入测试工程周的风险清单。

### 独立任务

关闭后端专题文档，只保留自己的 suite。从两个干净、隔离的 fixture 启动 .NET 与同源
实现，独立完成登录、列表、创建、PATCH 三态、删除、错误和上传核心流程。遇到差异时先用
原始 request/response 归类，再定位源码；不得通过在测试中判断后端名称来跳过失败。结束后
证明数据库记录、Cookie 日志和临时附件均已按隔离策略处理。

### 可运行交付物

同一组用例必须能针对 .NET/SQLite 与同源 D1/R2 执行。允许 Adapter 处理 Base URL、登录和
fixture reset，但业务断言不能复制成两套互不相关的测试。至少包含 18 个 case：

#### 读取 6 项

1. 默认列表与分页 envelope；
2. page/pageSize 边界；
3. search 标题、描述和 key；
4. status/priority/assignee 筛选；
5. sort direction 与稳定 tie-break；
6. 已知/未知 ID 及子资源读取。

#### 写入 6 项

1. 匿名写入；
2. 合法 create、201 与 Location；
3. 空/过长/重复 title；
4. PATCH omitted/null/value 与空 PATCH；
5. comment 空 body 与合法 comment；
6. delete 204 及删除后读取。

#### Wire、安全与上传 6 项

1. camelCase 与 string enum；
2. safe integer ID；
3. DateOnly 与带 offset instant；
4. Problem Details/FieldErrors；
5. 204 empty body；
6. 合法、过大、伪造上传及失败清理。

如果某实现暂时不支持同样 fixture，测试应明确标记能力和原因，不能悄悄跳过或改成永远通过。

### 差异报告

每项差异使用同一格式：

```markdown
## Case

- Request:
- Expected product contract:
- .NET result:
- D1 result:
- Difference: shape / error / behavior
- Product decision:
- Implementation location:
- Regression tests:
```

至少复现并处理文档列出的五项：非法 query、search 范围、空 PATCH、非 nullable null、tags
规范化；上传验证差异作为第六项加分但不能被隐藏。

### 周交付证据

- 三模式路径证明；
- .NET 请求管线和 D1/R2 请求链；
- schema/关系图与 SQL 稳定分页记录；
- Cookie/CORS/Problem Details 矩阵；
- 上传威胁模型与清理测试；
- 18 项 suite 的两后端结果；
- 差异报告、产品决定、测试输出和隔离数据清理记录。

### 严格通过标准

- 能通过 Network、进程和存储同时证明当前后端；
- Suite 真正复用业务用例，只把环境差异放进 Adapter；
- 至少 18 项核心 case 有可检查结果，不以手工“看起来正常”代替；
- 所有差异均分类并有产品决定，不声称两后端完全等价；
- 前端 Screen 不出现按后端名称分支或解析专属错误字符串；
- 未认证写入为结构化 401，PATCH 三态和 204 空 body 有测试；
- 上传测试同时检查 HTTP、数据库记录和物理/对象存储结果；
- 所有破坏实验使用隔离 fixture，结束后无残留测试数据与文件；
- `dotnet test IssueFlow.slnx`、相关前端测试、typecheck 与 lint 通过；
- 任一安全、隔离或 Contract 项失败，都不能进入第 12 周。

[上一周：Query 与服务端状态](week-10-query-server-state.md) ·
[下一周：测试、调试、CI 与部署](week-12-testing-debugging-ci.md) ·
[返回课程总览](./)
