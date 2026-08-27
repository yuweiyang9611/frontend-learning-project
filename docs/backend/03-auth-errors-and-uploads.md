# 03：认证、Problem Details 与上传安全

## 本章目标

本章把 Identity Cookie、CORS、Problem Details 与文件上传放进一条请求链，理解哪些检查属于浏览器体验，哪些属于服务器安全边界。

## 1. Identity 与领域 Member

[ApplicationUser.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Models/ApplicationUser.cs) 是 Identity 用户；[Member.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Models/Member.cs) 是 IssueFlow 领域成员。二者通过 MemberId 连接，但不是同一概念。

- Identity 管理登录标识、密码 hash、锁定和角色；
- Member 管理显示名、头像、团队角色和 Issue 关系。

不要把密码字段加入 Member，也不要向前端返回 Identity 内部字段。

## 2. Cookie 生命周期

```text
POST login
  → SignInManager 验证
  → Set-Cookie(HttpOnly ...)
  → browser stores cookie
  → later request credentials: include
  → authentication middleware
  → RequireAuthorization endpoint
```

GET session 返回适合前端的 Session DTO；POST logout 失效 Cookie。

前端 localStorage 中的 Session Profile 可用于 UI 快速显示，但用户可修改，服务端不能据此授权。

## 3. 401 不应重定向 HTML

传统 Cookie auth 对未登录请求可能 302 到登录页。API 需要 JSON Problem Details 401/403，前端才能稳定处理。Program 自定义 Cookie events：

- 未登录：401；
- 已登录但无权限：403；
- body 为 Problem Details；
- 不返回 HTML 登录页面。

## 4. Credentialed CORS

跨端口开发时：

- 服务端只允许配置的 frontend origin；
- `AllowCredentials`；
- 客户端 `credentials: 'include'`；
- OPTIONS preflight 正确；
- CORS 位于正确中间件位置。

不允许用 `AllowAnyOrigin` 与 credentials 组合。Origin 必须完整匹配 scheme、host、port。

CORS 不等于 CSRF。生产部署仍需根据 SameSite、Origin/Referer、token 或其他策略完成 CSRF 评估。

## 5. Problem Details

[Program.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Program.cs) 统一增加 instance 和 traceId；[Contracts.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Features/Common/Contracts.cs) 构造领域错误。

错误层次：

| 情况           | 响应                        |
| -------------- | --------------------------- |
| Query/字段验证 | Validation Problem + errors |
| 未认证/无权限  | 401/403 Problem             |
| 资源不存在     | 404 Problem                 |
| 唯一冲突       | 409 Problem                 |
| 媒体类型       | 415 Problem                 |
| 未处理异常     | 500 Problem，不泄露内部细节 |

前端 [ApiError](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/api/issueflowApi.ts) 保留 message/status/errors。

## 6. 触发错误实验

用集成测试分别产生 400、401、403、404、409、415 和一个受控 500，记录：

- Content-Type；
- status/title/detail；
- instance；
- traceId；
- errors 是否存在；
- 客户端显示在字段、页面还是 Toast。

不要为了测试 500 在共享开发库中破坏 schema。

## 7. 文件上传的信任边界

[AttachmentFilePolicy.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Features/Attachments/AttachmentFilePolicy.cs) 与 [AttachmentStorage.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api/Infrastructure/AttachmentStorage.cs) 共同处理：

- 5 MB 大小；
- 允许 MIME；
- 扩展名；
- 文件签名；
- 不可预测存储名；
- 路径必须位于存储根；
- 下载 `nosniff`；
- Range；
- IO/数据库失败时清理。

原始文件名只用于显示/下载元数据，不能直接作为磁盘路径。

## 8. MIME、扩展名与签名

三者都可被伪造，但组合检查能阻止常见伪装：

- `report.pdf.exe`；
- Content-Type 写 PDF 但内容不是 PDF；
- PNG 扩展名配文本；
- 空文件；
- 超大文件。

高风险生产系统还需恶意软件扫描、内容转码、隔离区和异步审核。

## 9. 数据库与文件系统一致性

上传跨越两个存储：

```text
validate
  → write temp/final file
  → insert attachment row
  ├─ success
  └─ DB failure → delete written file
```

删除 Issue 后数据库可 Cascade 附件记录，但物理文件需要应用清理。集成测试应检查两边。

## 10. 测试矩阵

| 测试                | 关键断言                         |
| ------------------- | -------------------------------- |
| 匿名 POST issue     | 401 JSON，不是 302               |
| 登录→session→logout | Cookie 建立和失效                |
| 不允许 Origin       | 浏览器不能读取 credentialed 响应 |
| 合法 TXT/PNG/PDF    | 201、元数据、下载                |
| 超 5 MB             | 400                              |
| 不支持 MIME         | 415                              |
| 伪造 PDF            | 拒绝                             |
| Range               | 正确部分内容/headers             |
| 删除 Issue          | DB rows 和物理文件都清理         |

锁定策略测试使用隔离用户和数据库，避免锁住演示账户。

## 11. 生产检查

- HTTPS 与 Secure Cookie；
- SameSite/CSRF；
- 登录限流；
- 密码和 Secret 管理；
- 审计与 trace 关联；
- 上传配额和扫描；
- 存储根权限；
- 文件备份与孤儿清理；
- 错误日志脱敏。

## 本章验收

- [ ] 能区分 ApplicationUser 与 Member。
- [ ] 能画出 Cookie 认证链。
- [ ] 能解释 API 401 为何不应 302。
- [ ] 能列出文件上传的至少六个检查。
- [ ] 能设计同时验证数据库和物理文件的测试。

[上一章：EF Core、SQLite 与数据建模](02-ef-core-and-data.md) · [下一章：双后端对照实验](04-compare-two-backends.md)
