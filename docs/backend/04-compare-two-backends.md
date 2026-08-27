# 04：双后端对照实验

## 本章目标

本章用同一前端 Contract 对照 .NET/SQLite 与同源 D1/R2。目标不是证明它们“完全相同”，而是把共享形状、有意差异和实现缺口分别记录。

## 1. 实验拓扑

### 同源 D1/R2

```powershell
cd frontend
Remove-Item Env:NEXT_PUBLIC_API_BASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:NEXT_PUBLIC_DEMO_MODE -ErrorAction SilentlyContinue
npm run dev
```

浏览器请求 `http://localhost:3000/api/...`。

### .NET/SQLite

终端 A：

```powershell
dotnet run --project backend/IssueFlow.Api
```

前端 `.env.local` 设置：

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:5170
NEXT_PUBLIC_DEMO_MODE=
```

重启前端。浏览器请求 `http://localhost:5170/api/...`。

### localStorage

```dotenv
NEXT_PUBLIC_DEMO_MODE=local
```

这是教学模拟，不纳入两个真实后端的一致性承诺。

## 2. 三层 Contract

| 层       | 比较内容                             |
| -------- | ------------------------------------ |
| Shape    | JSON 字段、类型、null、分页 envelope |
| Error    | 状态码、Problem Details、字段错误    |
| Behavior | 搜索、排序、默认、规范化、并发       |

Shape 一样不代表 behavior 一样；页面能渲染也不代表错误 Contract 一致。

## 3. 当前已知差异

| 场景                  | .NET              | 同源 D1          | 决策任务           |
| --------------------- | ----------------- | ---------------- | ------------------ |
| 非法 page/status/sort | 400               | 部分回退默认     | 是否统一严格拒绝   |
| search                | title/description | 还含 key         | 定义产品搜索范围   |
| 空 PATCH              | 400               | 可接受并更新时间 | 是否禁止无效写     |
| 非 nullable null      | 明确 400          | 部分按缺省       | 统一 presence 解析 |
| tags                  | 小写、去重        | 修剪、过滤       | 定义规范化         |
| 上传深度验证          | MIME/扩展/签名    | 主要 MIME/大小   | 平台能力与风险策略 |

将这些写进测试 TODO，不能在总览中声称完全等价。

## 4. 黑盒测试表

对两个 Base URL 运行相同请求：

### 读取

- 默认列表；
- page/pageSize 边界；
- search 标题、描述、key；
- status/priority/assignee；
- 五个 sort field 与两个 direction；
- 已知/未知 ID；
- comments/attachments。

### 写入

- 匿名请求；
- 合法 create；
- 空/过长 title；
- 重复 title；
- partial PATCH；
- omitted/null/value；
- 空 PATCH；
- delete 后读取；
- comment 空 body；
- 合法/非法 upload。

### Wire

- camelCase；
- enum string；
- null；
- safe integer；
- DateOnly；
- offset timestamp；
- 204 empty body；
- Problem Details。

## 5. 可重复测试夹具

每个后端应拥有隔离数据库和对象存储：

- 固定 seed；
- 唯一测试 run ID；
- 不依赖测试执行顺序；
- 写操作后清理；
- 时间使用固定 clock 或容忍范围；
- 不使用真实账户/邮箱/文件；
- 失败输出不泄露 Cookie。

同一 suite 可把 Base URL、登录方式和 reset fixture 作为 adapter 注入。

## 6. 比较报告模板

```markdown
## Case: empty PATCH

- Request: PATCH /api/issues/1 with {}
- Expected contract:
- .NET result:
- D1 result:
- Difference class: shape / error / behavior
- Product decision:
- Implementation tasks:
- Regression tests:
```

每个差异都需要“产品决定”，而不是自动以某一边为正确。当前课程以 .NET 为 canonical 是学习约定，仍可通过明确决策修改。

## 7. 前端适配原则

前端不应在每个 Screen 写后端分支。差异应：

1. 尽量在后端统一；
2. 无法统一时在 API adapter 层归一；
3. 仍不同则通过明确 feature capability 表达；
4. 禁止靠错误字符串猜后端类型。

UI 只依赖稳定的 `issueflowApi` 和领域 Contract。

## 8. 建议修复顺序

1. 错误状态码和 Problem Details；
2. PATCH null/presence；
3. 查询拒绝与默认值；
4. 搜索范围；
5. tags 规范化；
6. 上传安全差异；
7. 性能与分页排序。

先修可能导致数据错误或安全误判的差异，再修体验差异。

## 9. 毕业实验

选择 Dashboard Summary Endpoint：

- 先写独立 Response DTO；
- .NET 用 EF 聚合；
- D1 用 SQL 聚合；
- TypeScript 用 decoder；
- 同一黑盒 suite 跑两遍；
- 页面只写一个 Query；
- 文档列出任何有意差异。

## 本章验收

- [ ] 能切换并证明当前真实数据路径。
- [ ] 能把差异分类为 shape/error/behavior。
- [ ] 能复现表中的五项已知差异。
- [ ] 能设计可复用的黑盒 suite。
- [ ] 能让前端不出现后端类型分支。

[上一章：认证、Problem Details 与上传安全](03-auth-errors-and-uploads.md) · [返回后端索引](README.md)
