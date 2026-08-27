# 12：综合练习与毕业标准

## 本章目标

毕业不是“读完文档”，而是能独立完成一个小型跨层功能，并用源码、测试和调试证据说明它为何正确。本章给出递进练习、综合项目、验收量表和复盘方法。

## 1. 四级练习

### Level 1：观察

不改代码，只追踪：

- URL 怎样变成 Query；
- 一个 Issue 怎样从 JSON 变成表格行；
- 登录怎样恢复；
- 失败怎样成为字段错误或 Toast。

产物：调用链图、Network 记录和五个复盘问题。

### Level 2：局部修改

只改一个边界：

- 新增一个状态标签显示；
- 给表单新增客户端规则；
- 增加一个 TypeScript guard；
- 补一条 responsive 或 reduced-motion 规则。

产物：实现、最低成本测试、手工验收。

### Level 3：纵向切片

跨越 UI、Contract 和一个后端：

- 增加筛选参数；
- 新增 Issue 字段；
- 新增统计 Endpoint；
- 为评论增加编辑。

产物：migration/DTO/type/API client/UI/测试/文档。

### Level 4：双实现一致性

把同一功能同时实现于 .NET 和同源 D1/R2，并写黑盒 Contract 测试，明确允许的差异。

## 2. 推荐毕业项目：Dashboard 统计

实现一个独立统计 Endpoint，而不是在前端下载全部 Issue 后计算。

### 里程碑 A：定义 Contract

先写例子：

```json
{
  "open": 18,
  "inProgress": 7,
  "overdue": 3,
  "unassigned": 5,
  "updatedAt": "2026-08-27T12:00:00Z"
}
```

明确：

- 每个数字的定义；
- closed 是否参与 overdue；
- 日期以哪个时区判断；
- 空数据库结果；
- 是否需要认证；
- 缓存多久。

### 里程碑 B：.NET

1. 定义 Response DTO；
2. 用 EF Core 聚合而非返回 Entity；
3. 注册 Minimal API Endpoint；
4. 添加成功与错误元数据；
5. 用测试工厂验证空数据、正常数据和日期边界。

### 里程碑 C：TypeScript

1. 定义 `DashboardSummary`；
2. 为 JSON 边界写 decoder，而不是只用断言；
3. 增加 API client 方法；
4. 设计稳定 query key；
5. 测试畸形数字和日期。

### 里程碑 D：React

1. 展示 loading、empty、error、success；
2. 区分背景刷新和首次加载；
3. 提供可访问的统计名称；
4. 小屏不丢信息；
5. 不重复存储可派生状态。

### 里程碑 E：D1/R2 同源 API

实现同样 Shape Contract，运行同一黑盒用例。若 SQLite 和 D1 日期能力产生差异，在文档中写清行为规则，不要让前端猜测。

### 里程碑 F：质量门

- typecheck；
- 纯函数/decoder 测试；
- React 组件测试；
- .NET API 集成测试；
- 同源 API 测试；
- 一条关键 E2E；
- build 和 CI。

## 3. 备选综合练习

| 练习         | 前端重点             | 后端重点              | 风险点        |
| ------------ | -------------------- | --------------------- | ------------- |
| Blocked 状态 | union、映射、Board   | enum、migration/query | 两后端同步    |
| 评论编辑     | 表单、乐观更新       | ownership、PATCH      | 并发与权限    |
| 多负责人     | 复杂表单、cache      | 多对多关系            | Contract 演进 |
| 保存的筛选器 | URL、表单、Query key | 用户偏好持久化        | 默认值/迁移   |
| 活动时间线   | 判别联合、渲染       | 审计事件              | 顺序与分页    |

先选能在一到三次学习会话完成的最小纵向切片。

## 4. 开发顺序

```text
行为例子
  → Wire Contract
  → 失败与边界表
  → 最低层测试
  → 后端实现
  → API client / decoder
  → Query
  → UI / a11y / responsive
  → 集成和 E2E
  → 文档与复盘
```

这不是要求机械瀑布开发，而是避免先做漂亮 UI，最后才发现数据模型无法表达需求。

## 5. Code Review 自检

### Contract

- null、undefined、缺失字段是否有明确含义；
- 枚举、日期和整数跨语言是否安全；
- 错误是否结构化；
- 两个后端差异是否有意且记录。

### React

- 状态是否由正确层拥有；
- 是否保存了可派生值；
- Effect 是否有真实外部同步和 cleanup；
- loading/error/empty/success 是否完整。

### Query

- key 是否包含所有输入；
- mutation 是否更新所有相关视图；
- 失败能否回滚；
- 并发会不会覆盖更新。

### HTML/CSS/a11y

- 使用正确语义；
- 键盘可完成；
- 焦点进入和归还有设计；
- 四个视口可用；
- 主题、对比度和 motion 偏好已检查。

### 安全与数据

- 服务端重新验证所有输入；
- 写操作要求授权；
- 文件和路径不可信；
- migration、清理和回滚可说明；
- 没有 Secret 或个人信息进入提交。

## 6. 毕业量表

每项 0–2 分：0 未完成，1 能运行但解释/边界不足，2 有证据且能解释。

| 维度       | 2 分标准                           |
| ---------- | ---------------------------------- |
| Web 基础   | 能从 URL/HTTP 追到 DOM             |
| TypeScript | 编译期建模与运行时 decoder 都完整  |
| React      | 状态所有权和 Effect 合理           |
| Query      | 缓存、失效、失败与并发有策略       |
| Contract   | .NET/JSON/TS null、日期、数值对齐  |
| 后端       | DTO、验证、持久化和错误边界清楚    |
| 测试       | 每层测试目标明确，CI 通过          |
| 交互       | 键盘、焦点、响应式和失败恢复可用   |
| 安全       | 认证、授权、上传和 Secret 边界正确 |
| 表达       | 文档能让另一位学习者复现           |

建议至少 16/20，且 TypeScript、Contract、安全三项不能为 0。

## 7. 复盘问题

完成后写下：

1. 最先被错误假设影响的是哪一层；
2. 哪个 TypeScript 错误帮你发现了跨层遗漏；
3. 哪个问题只能靠运行时测试发现；
4. 两个后端哪里行为不同，是否应该统一；
5. 如果再做一次，会先定义哪个 Contract；
6. 哪个测试最有诊断价值；
7. 生产环境还缺什么。

## 本章验收

- [ ] 独立完成一个 Level 3 或 Level 4 练习。
- [ ] 能提供行为例子、测试、CI 和手工验收证据。
- [ ] 能解释至少一个 TypeScript 运行时边界。
- [ ] 能说明一个双后端差异。
- [ ] 能按量表自评并写出下一步学习计划。

[上一章：测试、调试、CI 与构建](11-testing-engineering-and-deployment.md) · [返回学习路线](./)
