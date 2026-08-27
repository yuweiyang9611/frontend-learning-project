# 后端对照专题

IssueFlow 是前端学习项目，但理解 HTTP Contract 需要看见服务器端真实约束。本专题以 `backend/IssueFlow.Api` 的 .NET 10 API 作为 canonical 行为主线，再与同源 D1/R2 实现对照。

学习顺序：

1. [Minimal API 与 HTTP Contract](01-minimal-api-and-contracts.md)
2. [EF Core、SQLite 与数据建模](02-ef-core-and-data.md)
3. [认证、Problem Details 与上传安全](03-auth-errors-and-uploads.md)
4. [双后端对照实验](04-compare-two-backends.md)

运行：

```powershell
dotnet restore IssueFlow.slnx
dotnet run --project backend/IssueFlow.Api
```

默认 API：`http://localhost:5170`；Development OpenAPI：`http://localhost:5170/openapi/v1.json`。

所有会改变数据库或附件的破坏性实验，都应使用测试工厂或独立临时路径，不要污染日常 `issueflow.db` 和 `uploads`。

[返回文档总索引](../README.md)
