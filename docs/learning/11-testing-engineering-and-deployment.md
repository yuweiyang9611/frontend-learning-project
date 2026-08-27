# 11：测试、调试、CI 与构建

## 本章目标

本章建立一条可重复的质量链：格式 → 静态检查 → 单元/组件测试 → API 集成测试 → 构建 → E2E → CI。你还会学习如何根据失败层级定位问题，而不是反复重跑。

## 1. 质量门的分工

| 检查              | 主要发现                                   |
| ----------------- | ------------------------------------------ |
| Prettier          | 排版差异                                   |
| ESLint            | 可疑代码、Hook 和项目规则                  |
| `tsc --noEmit`    | 编译期 Contract 不一致                     |
| Vitest 纯函数测试 | 边界输入和领域规则                         |
| Testing Library   | 用户可观察的组件行为                       |
| .NET 集成测试     | HTTP、EF、Identity、文件和 Problem Details |
| Build             | 框架编译、模块边界和生产产物               |
| Playwright        | 真实浏览器中的关键用户流程                 |

一种测试不应承担所有职责。E2E 很有信心但较慢，纯函数测试很快但无法证明浏览器流程。

## 2. 前端命令

在仓库根目录：

```powershell
cd frontend
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

首次运行 Playwright 可能需要：

```powershell
npx playwright install chromium
```

不应因为 E2E 慢就跳过所有前置检查。typecheck 或单测失败时，先修复更靠近原因的一层。

## 3. 后端命令

在仓库根目录：

```powershell
dotnet build IssueFlow.slnx
dotnet test IssueFlow.slnx
dotnet format IssueFlow.slnx --verify-no-changes
```

[ApiContractTests.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api.Tests/ApiContractTests.cs) 使用测试工厂、临时 SQLite 和隔离附件目录验证真实 HTTP 边界。

## 4. 测试层级示例

以“标题为空”为例：

- 纯函数：[types.test.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/issues/types.test.ts) 验证 `validateIssue`；
- 组件：[IssueForm.test.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/issues/IssueForm.test.tsx) 验证错误显示与焦点；
- API：[ApiContractTests.cs](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/backend/IssueFlow.Api.Tests/ApiContractTests.cs) 验证字段化 400；
- E2E：只在它是关键流程且前几层不能覆盖集成风险时加入。

同一规则在多层出现不是一定重复：每层证明不同边界。但不要在每层枚举相同几十个输入。

## 5. TypeScript 的两类测试

### 编译期

[compile-time-examples.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/compile-time-examples.ts) 用 `@ts-expect-error` 证明某些代码必须被拒绝。若未来代码不再报错，TypeScript 会让测试文件失败。

### 运行时

[examples.test.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/examples.test.ts) 验证 guard、decoder、错误联合、日期和安全整数。TypeScript 不能替代这些测试，因为输入在运行时才出现。

## 6. Testing Library 原则

优先按用户可感知语义查找：

1. role + accessible name；
2. label；
3. 可见文本；
4. test id 作为最后选择。

测试“用户点击 Save 后出现错误并聚焦 Title”，比测试内部 `setErrors` 被调用更稳定。

异步断言使用 `findBy...` 或 `waitFor`；固定 sleep 会让测试慢且易抖动。

## 7. Playwright 与失败证据

现有 [issue-lifecycle.spec.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/e2e/issue-lifecycle.spec.ts) 和 [typescript-lab.spec.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/e2e/typescript-lab.spec.ts) 覆盖关键用户流程。配置会为失败保留 screenshot/trace。

失败时：

1. 查看首个失败步骤；
2. 打开 trace 的 DOM、Network 和 Console；
3. 判断是 selector、等待、应用逻辑还是环境；
4. 在更低测试层添加最小复现；
5. 修复后只运行相关测试，再运行完整门禁。

## 8. 系统化调试顺序

```text
复现条件
  → URL/环境变量
  → Console 首个错误
  → Network 请求与响应
  → API Contract
  → Query Cache / React State
  → DOM / 焦点 / CSS
  → 最小回归测试
```

保存 bug 证据至少包括：操作、预期、实际、数据模式、URL、状态码、错误体和最小复现。

## 9. CI

[ci.yml](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/.github/workflows/ci.yml) 在 push 和 pull request 上执行前端、后端与 E2E 质量门。CI 的价值是：

- 在干净环境复现；
- 防止本机未跟踪依赖或环境掩盖问题；
- 让提交对应明确的验证结果；
- 为协作提供共同门槛。

本地通过仍可能 CI 失败，例如大小写路径、未提交文件、不同 Node/.NET 版本或服务启动竞争。

## 10. Build 与部署概念

`npm run dev` 优化反馈速度，`npm run build` 验证生产编译和路由产物。构建成功不代表运行时 API、Cookie、D1/R2 binding 或环境变量正确。

部署前应逐项确认：

- 环境变量属于构建时还是运行时；
- API Base URL 和 Origin；
- D1/R2 binding 名；
- migration 是否已应用；
- Secret 没有进入客户端 bundle；
- 健康检查和回滚方案；
- 发布后关键 smoke test。

本章讲部署验证方法，不把某个平台当前按钮流程当成永久知识。

## 11. 推荐新增测试

1. 乐观更新并发与失败回滚；
2. Modal Tab 循环和焦点归还；
3. 移动抽屉的焦点边界；
4. reduced-motion；
5. PATCH omitted/null/value；
6. 两套真实 API 的黑盒 Contract suite；
7. 登录—session—logout Cookie 生命周期；
8. decoder 拒绝畸形 Issue。

## 本章验收

- [ ] 能为一个规则选择最低成本且有效的测试层。
- [ ] 能区分编译期负例与运行时边界测试。
- [ ] 能从 Playwright trace 定位首个失败。
- [ ] 能解释 Build 成功为何不等于部署可用。
- [ ] 能按顺序运行本地质量门并阅读 CI。

[上一章：持久化、双后端与安全边界](10-persistence-backends-and-security.md) · [下一章：综合练习与毕业标准](12-capstone-and-graduation.md)
