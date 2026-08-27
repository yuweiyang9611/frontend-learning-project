# 学习任务模板

复制本模板到自己的学习笔记或 Issue。不要把一次性实验记录堆进根 README。

## 任务

- 标题：
- 日期：
- 分支：
- 对应章节：
- 预计范围：

## 1. 问题

我要理解或改变什么？用可观察行为描述，不写“学习一下 TypeScript”这样的宽泛目标。

## 2. 前置证据

- 当前 URL/数据模式：
- 相关源码：
- 当前测试：
- 当前行为：
- Network/Console 证据：

## 3. 预测

- 我认为请求链是：
- 我认为类型检查会：
- 我认为运行时会：
- 我认为失败会显示：

## 4. Contract

### 输入

字段、类型、null/undefined/缺失、限制。

### 输出

成功 shape、状态码、缓存影响。

### 失败

400/401/404/409/500、网络、取消、并发。

## 5. 实现切片

- [ ] 类型/DTO
- [ ] decoder/validation
- [ ] persistence/migration
- [ ] endpoint/API client
- [ ] query/mutation/cache
- [ ] component/route
- [ ] accessibility/responsive
- [ ] docs

## 6. 测试计划

| 层              | 用例 | 证明什么 |
| --------------- | ---- | -------- |
| Type-level      |      |          |
| Unit            |      |          |
| Component       |      |          |
| API integration |      |          |
| E2E             |      |          |

## 7. 边界表

| 输入/故障 | 预期 | 实际 | 修复/结论 |
| --------- | ---- | ---- | --------- |
| 最小值    |      |      |           |
| 最大值    |      |      |           |
| null/缺失 |      |      |           |
| 非法 enum |      |      |           |
| 网络失败  |      |      |           |
| 并发      |      |      |           |

## 8. 手工验收

- [ ] 正常流程
- [ ] 键盘
- [ ] 焦点
- [ ] 错误恢复
- [ ] 390/768/1024/1440 视口
- [ ] light/dark/system
- [ ] 两种真实后端（若适用）

## 9. 质量门

```powershell
cd frontend
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

只运行与任务相关的最低层测试用于快速反馈；提交前运行适用的完整门禁。

## 10. 复盘

- 哪个预测错了？
- 哪个类型错误最有帮助？
- 哪个问题只有运行时能发现？
- 是否出现重复状态或 Contract 漂移？
- 如果换另一个后端，行为是否一致？
- 哪条测试最有诊断价值？
- 下次会提前做什么？

[返回参考资料](../README.md)
