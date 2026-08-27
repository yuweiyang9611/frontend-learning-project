# 10：持久化、双后端与安全边界

## 本章目标

本章把同一个 React UI 连接到三种数据路径，并区分“JSON 形状相似”与“行为完全相同”。你还会理解 D1/R2、SQLite/EF Core、认证 Cookie、上传和 CORS 的边界。

## 1. 三种数据路径

```text
React UI
  └─ issueflowApi
      ├─ NEXT_PUBLIC_DEMO_MODE=local
      │    └─ 浏览器 localStorage（教学演示）
      ├─ NEXT_PUBLIC_API_BASE_URL 为空
      │    └─ frontend/app/api → D1 / R2（同源）
      └─ NEXT_PUBLIC_API_BASE_URL=http://localhost:5170
           └─ .NET 10 Minimal API → EF Core / SQLite / 文件系统
```

选择逻辑位于 [issueflowApi.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/api/issueflowApi.ts)，环境变量示例位于 [frontend/.env.example](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/.env.example)。

## 2. Shape Contract 与 Behavioral Contract

三条路径都尽量向前端提供 `Issue`、`PagedResult<Issue>`、`ApiError` 所需的主要 JSON 形状，但不能声称行为完全等价。

当前值得学习的差异：

| 场景                    | .NET canonical API | 同源 D1 / local              |
| ----------------------- | ------------------ | ---------------------------- |
| 非法 query              | 返回字段化 400     | 部分值回退默认               |
| Search                  | 标题与描述         | 还包含 Issue key             |
| 空 PATCH                | 返回 400           | 同源实现目前可接受并更新时间 |
| 非 nullable 字段为 null | 已提供但非法       | 部分场景按缺省处理           |
| Tags                    | 小写并去重         | 主要修剪和过滤               |

因此要分别考虑：

- Shape Contract：字段名、类型、nullability；
- Error Contract：状态码、Problem Details、字段错误；
- Behavioral Contract：搜索、默认值、规范化和并发规则。

课程以后端 .NET 实现作为 canonical 行为主线，并用 [双后端对照实验](../backend/04-compare-two-backends.md) 明确差异。

## 3. D1 与 R2 路径

同源 Route Handlers 位于 [frontend/app/api](https://github.com/yuweiyang9611/frontend-learning-project/tree/main/frontend/app/api)，数据库逻辑位于 [issueflow-db.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/server/issueflow-db.ts)。

- D1 保存结构化 Issue、成员、评论和附件元数据；
- R2 保存附件字节；
- [frontend/db](https://github.com/yuweiyang9611/frontend-learning-project/tree/main/frontend/db) 定义 Drizzle schema；
- [frontend/drizzle](https://github.com/yuweiyang9611/frontend-learning-project/tree/main/frontend/drizzle) 保存可审查 SQL migration；
- 同源请求避免开发时跨域配置；
- 写操作依赖平台身份或受限的本地演示会话。

数据库记录与对象存储必须协同：上传字节成功但元数据失败时要清理对象；删除 Issue 时也要考虑附件对象。

## 4. .NET 与 SQLite 路径

[Program.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Program.cs) 注册 EF Core、Identity、Problem Details、CORS 和 Endpoint 模块。领域 Endpoint 位于 [Features](https://github.com/yuweiyang9611/frontend-learning-project/tree/main/backend/IssueFlow.Api/Features)。

- SQLite 适合单机课程和集成测试；
- EF Core Migration 保存 schema 演进；
- Identity Cookie 是授权依据；
- 附件字节存文件系统，数据库保存元数据；
- Development 暴露 OpenAPI；
- 自动 Seed 提供可重复练习数据。

深入学习见 [后端专题索引](../backend/)。

## 5. 认证与授权

前端 localStorage 中的 Session 只是显示资料缓存。真实 .NET 写操作依赖 HttpOnly Identity Cookie：

```text
登录成功 → Set-Cookie → 浏览器保存
请求 credentials: include → 浏览器携带 Cookie
服务端认证 → Endpoint RequireAuthorization
```

客户端 Route Guard 可以被绕过，因此不是安全边界。D1/Sites 路径使用平台身份 Header 或严格限制在 loopback 的演示会话，也必须在服务端判断。

## 6. CORS 不是认证，也不是 CSRF

当前端 3000 端口访问 .NET 5170 端口时属于不同 Origin。Credentialed CORS 要求：

- 服务端显式允许前端 Origin；
- 允许 credentials；
- 客户端设置 `credentials: 'include'`；
- preflight 能通过；
- 中间件顺序正确。

CORS 是浏览器读取跨源响应的策略，不会替你认证用户，也不能独立防御 CSRF。curl 不执行浏览器 CORS，因此 curl 成功不能证明浏览器一定成功。

## 7. 上传边界

文件名、Content-Type 和扩展名都来自不可信输入。.NET 路径进一步检查：

- 最大 5 MB；
- 允许的 MIME 和扩展名；
- 文件签名；
- 随机存储名；
- 路径是否仍位于存储根目录；
- 下载时 `nosniff`；
- 失败时清理部分写入。

生产系统还应考虑病毒扫描、配额、审计、对象生命周期和备份。

## 8. 持久化实验

### A. 切换三模式

对同一个 `GET /api/issues?page=1&pageSize=5`，分别记录：

- Request URL 与 Remote Address；
- Cookie/Header；
- 数据实际保存位置；
- 重启前后是否保留；
- 非法 query 的响应。

### B. PATCH 三态

对 assignee 分别发送：省略、null、有效 ID。再对 title 发送 null 和空字符串，比较三种实现。

### C. 上传失败清理

使用隔离测试存储制造“文件写入后数据库失败”，确认没有孤儿文件。不要在日常 `uploads` 目录直接做破坏实验。

## 9. 生产与课程的边界

课程中的自动 migration、演示账户、SQLite 单文件和本地附件目录有利于学习与复现，不应原样视为大型生产部署方案。生产环境通常还要设计：

- 独立迁移步骤和回滚；
- Secret 管理与密钥轮换；
- 多实例共享数据库/对象存储；
- 限流、审计与告警；
- 备份恢复；
- CSRF 和内容安全策略评估。

## 本章验收

- [ ] 能根据环境变量判断当前数据路径。
- [ ] 能区分 shape、error 和 behavioral contract。
- [ ] 能解释 localStorage Session 为何不是授权。
- [ ] 能解释 credentialed CORS 的四个必要条件。
- [ ] 能设计不会污染日常数据库的上传失败实验。

[上一章：表单、复杂交互与可访问性](09-forms-interactions-and-a11y.md) · [下一章：测试、调试、CI 与构建](11-testing-engineering-and-deployment.md)
