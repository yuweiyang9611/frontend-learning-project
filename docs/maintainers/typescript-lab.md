---
search: false
---

# 维护 TypeScript Lab

## 1. 设计原则

`/labs/typescript` 使用真实 IssueFlow 领域模型教学，但不是自由代码执行器：

- Runner 是普通 TypeScript，参与 strict typecheck；
- 页面代码块是聚焦概念的节选，真实实现位于源码；
- 负例用 `@ts-expect-error`，由 `tsc` 检查；
- 外部输入从 unknown 开始；
- Runner 同步、确定、无副作用；
- 禁止 `eval`、`new Function`、API 请求和产品数据写入；
- 学习进度使用独立 localStorage key；
- 每课有 C# 对照、生产路径、挑战和测试。

## 2. 文件职责

| 文件                                                                                                                                                           | 职责                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| [examples.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/examples.ts)                           | 教学类型、纯函数、decoder、Runner 依赖 |
| [compile-time-examples.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/compile-time-examples.ts) | 必须编译失败的负例                     |
| [catalog.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/catalog.ts)                             | 课程文案、顺序、输入和 run 连接        |
| [examples.test.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/examples.test.ts)                 | 运行时与 type-level 断言               |
| [TypeScriptLabPage.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/screens/TypeScriptLabPage.tsx)                       | 可访问交互 UI                          |
| [TypeScriptLabPage.test.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/screens/TypeScriptLabPage.test.tsx)             | URL、筛选、runner、进度                |
| [typescript-lab.spec.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/e2e/typescript-lab.spec.ts)                             | 真实浏览器主流程                       |
| [learning.css](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/app/learning.css)                                                 | Lab 视觉与响应式                       |

## 3. Lesson Contract

每个 `TypeScriptLesson` 需要：

- 永久唯一 `id`；
- 连续 `order`；
- 清楚 title/category/level/check；
- 一句话 summary；
- 准确 C# bridge，不声称两种类型系统相同；
- 真实 productionPath；
- concepts；
- 只展示必要内容的 code；
- 能被完成的 challenge；
- inputMode/label/hint/default；
- 不 throw 的确定性 run。

删除或改 lesson ID 会影响已保存 URL/进度。优先保留 ID，只更新展示信息。

## 4. 新增课程流程

1. 在 `examples.ts` 写可独立测试的纯函数。
2. 为正常、边界、非法输入写 runtime test。
3. 若主题是编译器行为，在 compile-time 文件加正例和 `@ts-expect-error`。
4. 在 catalog 加课程，使用下一个连续 order。
5. default input 必须安全运行且输出确定。
6. 页面测试可搜索、选择、运行、完成和恢复 URL。
7. 只有关键用户流程才增加 E2E。
8. 更新 [Lab 实验手册](../typescript/06-lab-workbook.md) 和课程数量。
9. 运行完整质量门。

## 5. 负例规则

`@ts-expect-error` 上方或同一行应说明预期原因：

```ts
// @ts-expect-error A priority field cannot receive a number.
updateField(input, "priority", 3);
```

避免：

- 一行包含多个可能错误；
- 用 `@ts-ignore`；
- 依赖版本偶然的错误文字；
- 负例引入运行时执行；
- 为通过 typecheck 把值改 any。

## 6. Runtime 规则

Runner 应：

- 对 string/JSON 输入先 parse/guard；
- 返回 `LabRunResult`，不让常见坏输入逃逸为 throw；
- 不依赖当前时间或随机值，除非注入；
- 不读取/写入 Query Cache；
- 不调用真实 API；
- 不修改 seed；
- 输出可序列化、可阅读；
- Notes 解释类型边界，而非重复 Output。

## 7. 可访问性

- 输入有 label 和 hint 关联；
- Output 使用 polite live region；
- 课程链接有 current 状态；
- 完成按钮使用 pressed 状态；
- 进度条有 min/max/now；
- URL 切换后标题获得合理焦点；
- 搜索/分类过滤后空状态清楚；
- 代码复制按钮有可访问名称。

## 8. 测试命令

```powershell
cd frontend
npm run typecheck
npm test -- src/features/typescript-lab/examples.test.ts src/screens/TypeScriptLabPage.test.tsx
npm run test:e2e -- e2e/typescript-lab.spec.ts
npm run lint
npm run build
```

测试重点：

- ID 唯一、order 连续；
- 每个 default runner 不 throw；
- decoder 边界；
- 源数组不变；
- `@ts-expect-error` 仍真的是错误；
- URL lesson/filter；
- localStorage 进度隔离；
- 键盘和状态播报。

## 9. Review 清单

- [ ] 使用真实 IssueFlow Contract，不是无关 toy。
- [ ] 编译期与运行时结论分开。
- [ ] 没有 any/eval/network/product writes。
- [ ] C# 类比注明关键差异。
- [ ] 可见 snippet 与真实实现不矛盾。
- [ ] challenge 可在合理范围完成。
- [ ] 边界测试先于 UI 测试。
- [ ] 文档和课程总数更新。

[返回维护者索引](../README.md)
