# IssueFlow 当前产品需求

## 1. 文档用途

本文描述仓库当前已经实现并需要持续保留的产品能力，是学习章节讨论“为什么这样设计”的需求基线。历史设想见 [原始课程设计存档](../archive/original-curriculum/README.md)，不能用历史稿覆盖当前源码事实。

## 2. 产品目标

IssueFlow 是一个用于学习现代前端工程的 Issue Tracker。学习者应能在同一产品中练习：

- Web、HTML、CSS、JavaScript 与 TypeScript；
- React、Router、表单和复杂交互；
- TanStack Query、HTTP Contract 与错误处理；
- D1/R2 同源后端和 .NET/SQLite 后端；
- 测试、CI、可访问性和安全边界。

它既要像真实产品可操作，也要让每条调用链可阅读、可实验、可测试。

## 3. 用户与会话

### 必须

- 用户能在登录页输入凭据；
- 登录成功进入 Dashboard；
  -直接访问受保护页面时，登录后返回原目标；
- 刷新后可恢复有效服务器会话；
- 登出后受保护页面不可继续使用；
- 未认证 API 写操作返回 JSON 401，而不是 HTML redirect；
- UI 缓存的 Session 资料不能成为服务端授权依据。

### 数据模式

- 同源 D1/R2：使用平台身份或仅 loopback 可用的开发会话；
- .NET：使用 HttpOnly Identity Cookie；
- localStorage：显式教学演示，不承诺安全授权。

## 4. Dashboard

- 展示 Issue 统计、状态/优先级分布和近期工作；
- 显示可理解的 loading、empty、error、success；
- 统计由当前数据源提供或计算，不能保存冲突副本；
- 桌面、平板和手机视口可阅读；
- 重要图形信息同时有文字。

## 5. Issue 列表

- 搜索；
- 状态、优先级、负责人筛选；
- createdAt、updatedAt、title、priority、status 排序；
- asc/desc；
- 分页；
- stream/infinite loading 模式；
- 查询状态可通过 URL 分享和恢复；
- 搜索输入防抖；
- 桌面表格、窄屏可用表示；
- loading skeleton、空结果与错误重试；
- 从列表可进入详情、编辑、删除和状态更新。

分页必须稳定；修改筛选时页码应回到合理值。

## 6. Issue 新建与编辑

字段：

- title；
- description；
- status；
- priority；
- assignee；
- tags；
- dueDate。

规则：

- title 必填、最多 100 字符；
- description 最多 5000 字符；
- dueDate 不能早于今天；
- 重复标题可返回 409；
- assignee 必须存在或为 null；
- tags 按后端 Contract 规范化；
- 失败保留输入并聚焦首个字段错误；
- pending 防止重复提交；
- 成功更新 Query Cache 并导航到合理页面。

## 7. Issue 详情

- 展示完整领域信息；
- 修改状态；
- 编辑与删除；
- 查看、新增和删除评论；
- 查看、上传和下载附件；
- 各子资源有独立 loading/error；
- 删除需要确认；
- 写操作失败可恢复并有反馈；
- 非法/不存在 ID 有明确状态且不发出 NaN 请求。

## 8. Board

- 按四种状态分列；
- 支持拖放改状态；
- 同时提供键盘可操作的状态选择；
- 乐观更新；
- 失败回滚并通知；
- 列表、详情与 Board 最终一致；
- 小屏仍能访问所有卡片和操作。

## 9. Users 与 Settings

- Users 展示成员、角色和工作负载；
- Settings 使用嵌套路由；
- Profile、Account、Appearance 可独立导航；
- 主题支持 system/light/dark；
- 用户偏好不得与安全凭据混存；
- 设置导航具备可访问名称与当前项状态。

## 10. TypeScript Lab

- 路径 `/labs/typescript`；
- 至少 12 个与真实 IssueFlow Contract 相关的课程；
- 可按搜索和 category 筛选；
- 当前课程写入 URL；
- 进度存本地且与产品数据隔离；
- Runner 是预编译纯函数，不使用 eval；
- 每课明确概念、C# 对照、生产路径、输入、输出和挑战；
- 同时有编译期负例、运行时测试和页面/E2E；
- 可访问进度、状态播报和焦点。

## 11. API Contract

主要资源：

- Session；
- Member；
- Issue；
- PagedResult；
- Comment；
- Attachment；
- Problem Details / FieldErrors。

必须明确：

- camelCase 字段；
- string enum；
- nullability；
- 日期格式；
- safe integer；
- 204 空响应；
- PATCH omitted/null/value；
- 400/401/404/409/415。

两套真实后端共享主要 Shape Contract，但当前不保证全部 Behavioral Contract 相同。差异见 [双后端对照实验](../backend/04-compare-two-backends.md)。

## 12. 数据与上传

### D1/R2

- D1 保存结构化数据和附件元数据；
- R2 保存文件；
- schema 与 SQL migration 可审查；
- 写操作认证；
- 跨源写请求按策略拒绝。

### .NET/SQLite

- EF Core Migration；
- 确定性 Seed；
- Identity Cookie；
- SQLite 数据；
- 文件系统附件；
- Problem Details；
- OpenAPI Development 文档。

### 上传

- 最大 5 MB；
- PNG、JPEG、PDF、text；
- 服务端验证；
- 不可预测存储 key/name；
- 下载 `nosniff`；
- 防路径穿越；
- 失败/删除清理。

## 13. 非功能需求

### 可访问性

- 原生语义优先；
- 键盘完成关键流程；
- 表单 label/error 关联；
- Modal focus trap 与焦点归还；
- 动态消息播报；
- 不只靠颜色；
- reduced-motion 作为当前改进项。

### 响应式

- 至少覆盖 1440、1024、768、390 宽度；
- 无不可恢复内容裁切；
- 操作目标可用；
- 表格和 Board 在窄屏有明确策略。

### 质量

- format、lint、typecheck；
- 单元/组件测试；
- .NET API 集成测试；
- build；
- Playwright 关键流程；
- GitHub Actions 全部通过。

## 14. 明确的非目标

当前课程不声称已经提供：

- 大规模多租户生产架构；
- 实时协作/WebSocket；
- 完整权限矩阵；
- 病毒扫描和企业 DLP；
- 全文搜索服务；
- 离线同步冲突解决；
- 所有浏览器/设备自动化覆盖；
- 两个后端所有行为完全一致。

这些可以作为高级扩展，但不能写进“已实现”清单。

## 15. 功能验收格式

每项需求至少有：

1. 正常路径；
2. 输入/网络/权限失败；
3. keyboard/focus；
4. narrow viewport；
5. Contract 测试或组件测试；
6. 对应源码链接；
7. CI 结果。

[返回参考资料](../README.md)
