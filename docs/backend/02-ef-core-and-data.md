# 02：EF Core、SQLite 与数据建模

## 本章目标

本章从 [AppDbContext.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Data/AppDbContext.cs) 理解关系、约束、转换、Migration、Seed 和查询执行，并明确 SQLite 作为课程数据库的权衡。

## 1. DbContext 的职责

`AppDbContext` 继承 `IdentityDbContext<ApplicationUser>`，同时承载 Identity 表和 IssueFlow 业务表。它配置：

- Entity key；
- required/optional；
- 长度；
- 唯一约束和索引；
- 关系与删除行为；
- enum 和 DateTimeOffset 转换。

TypeScript interface 不会创建数据库约束。前端、API validation 和 schema 是不同防线。

## 2. 关系与删除行为

关键关系：

- Issue → Reporter：必需，删除 Member 时 Restrict；
- Issue → Assignee：可选，删除 Member 时 SetNull；
- Comment → Author：必需，Restrict；
- Issue → Comments/Attachments：删除 Issue 时 Cascade。

删除策略表达业务：

- 历史作者不能因成员删除而消失；
- 负责人离开时 Issue 可以变成未分配；
- Issue 删除后子资源不应孤立。

还要处理附件物理文件，因为数据库 Cascade 只删除记录。

## 3. 唯一标题

应用先用 NormalizedTitle 检查重复，数据库再用唯一约束兜底。

为什么需要两层：

```text
Request A check → no row
Request B check → no row
Request A insert
Request B insert → unique constraint
```

只有预检查会产生 race。捕获 SQLite constraint error 并返回 409，才能保持 HTTP Contract。

## 4. Tags JSON 的权衡

Tags 存为 JSON 文本，简化课程模型，但代价包括：

- 数据库难以索引单个 tag；
- 查询/约束能力弱；
- 更新通常替换整个集合；
- 不适合复杂 tag 统计。

若需求增长，应考虑 Tags 表与多对多关系。不要把教学简化描述成通用最佳实践。

## 5. DateTimeOffset 转换

SQLite 没有完整的 DateTimeOffset 类型。当前转换为 Unix 毫秒：

- 存储可稳定排序；
- 恢复统一为 UTC；
- 原始 offset 丢失；
- 亚毫秒精度丢失。

若测试直接比较输入原文本与输出原文本，可能错误失败。应比较 instant 或明确序列化规则。

## 6. Migration

Migration 位于 [Migrations](https://github.com/yuweiyang9611/frontend-learning-project/tree/main/backend/IssueFlow.Api/Migrations)。它是 schema 版本历史，不应只修改 Model 后删除旧数据库绕过迁移。

课程流程：

1. 修改 Entity/DbContext；
2. 生成 migration；
3. 审查 Up/Down 和 SQL 意图；
4. 对全新库应用；
5. 对已有旧版本库升级；
6. 运行集成测试；
7. 检查回滚/备份策略。

应用启动自动迁移适合课程环境；生产通常使用独立、受控迁移步骤。

## 7. Seed

[SeedData.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Data/SeedData.cs) 提供固定成员、72 条 Issue、评论、附件元数据和 Identity 演示用户。

好的 Seed 应：

- 可重复；
- 再运行不重复插入；
- 关键 ID 和时间稳定；
- 覆盖不同状态、优先级和负责人；
- 不包含真实个人资料或生产密码。

使用固定时间锚点能让排序、分页和测试稳定。

## 8. IQueryable

列表查询先构造 `IQueryable`，条件组合后才由 Count/ToList 执行 SQL：

```text
base query
  → search filters
  → status/priority/assignee
  → CountAsync
  → OrderBy + ThenBy(id)
  → Skip + Take
  → ToListAsync
```

`AsNoTracking` 适合只读查询，减少变更追踪成本。`Include` 加载关联对象，但要注意笛卡尔膨胀和不必要字段。

## 9. 稳定排序

分页必须有稳定顺序。若许多 Issue 的 priority 相同，只按 priority 排序可能跨请求顺序不稳定。加入 ID 等唯一 tie-break：

```text
ORDER BY priority DESC, id DESC
```

测试应构造相同主排序值，验证翻页没有重复或遗漏。

## 10. SQL 观察实验

在 Development 开启现有 EF 日志，分别执行：

1. 无筛选 page 1；
2. status + priority；
3. search；
4. assignee；
5. 按 updatedAt；
6. page 3。

记录生成 SQL、参数、COUNT、LIMIT/OFFSET 和查询次数。不要把敏感数据复制进文档。

## 11. 隔离实验数据库

迁移/删除/并发练习用测试工厂或独立临时 SQLite：

- 每次测试唯一路径；
- 测试后清理；
- 上传目录也隔离；
- 不复用开发数据库；
- 禁止并行测试共享同一文件。

[IssueFlowApiFactory.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api.Tests/IssueFlowApiFactory.cs) 是参考。

## 本章验收

- [ ] 能解释四种删除行为的业务原因。
- [ ] 能说明预检查加唯一约束为何都需要。
- [ ] 能陈述 Tags JSON 的取舍。
- [ ] 能解释 Unix 毫秒转换损失的信息。
- [ ] 能从查询参数追到 SQL 与稳定排序。

[上一章：Minimal API 与 HTTP Contract](01-minimal-api-and-contracts.md) · [下一章：认证、Problem Details 与上传安全](03-auth-errors-and-uploads.md)

## 12. D1 与 .NET 的升级路径

D1 使用 Drizzle schema 和追加 SQL 迁移，运行时只处理数据。执行 `npm run db:generate` 后必须审查生成的 SQL；尤其不能直接执行可能级联删除子资源的父表重建。当前追加迁移保留已有 Issue 表中的枚举 CHECK，通过索引统一标题和成员邮箱的大小写唯一性，并新增设置表与 Seed 标记表。

本地命令 `npm run db:migrate:local` 在 `_issueflow_migrations` 记录文件名和 SHA-256；只接受已知初始结构的旧库基线。空库、已迁移库和旧运行时建表库都由 `npm run db:test` 验证。应用启动按 `app_metadata.seed-v1` 识别已完成 Seed，不以 Issue 数量是否为零决定补种。

.NET 继续使用 EF Core migrations，通知偏好绑定 Identity 用户 ID。Profile 更新在事务中同步 Identity 显示名与关联成员资料；D1 则使用 Sites 稳定用户 ID，loopback 演示使用独立身份键。HTTP 请求不接受目标用户 ID，也不能修改邮箱和角色。

升级前备份 SQLite/D1 及附件存储。迁移成功后才启用依赖新表的代码；失败时保留现场并检查迁移记录，不修改已应用的历史文件。生产恢复需使用明确的兼容修复或备份恢复步骤，不能假定代码回退会撤销数据变更。

测试宿主在服务解析时读取数据库配置，避免多个测试误用输出目录中的同一个 SQLite 文件。
