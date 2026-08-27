# TypeScript 专题索引

这组文档把 TypeScript 当成 IssueFlow 的建模与边界工具，而不是孤立的语法清单。建议先完成 [主线第 05 章](../learning/05-typescript-roadmap.md)，再按以下顺序学习：

1. [从 C# 到 TypeScript](01-from-csharp-to-typescript.md)
2. [领域建模、联合类型与收窄](02-domain-modeling-and-narrowing.md)
3. [泛型、Utility Types 与 keyof](03-generics-utilities-and-keyof.md)
4. [unknown、Decoder 与运行时边界](04-runtime-boundaries.md)
5. [.NET 与 TypeScript Wire Contract](05-dotnet-wire-contracts.md)
6. [TypeScript Lab 实验手册](06-lab-workbook.md)

## 学习方法

每个概念都完成四种证据：

| 证据       | 问题                               |
| ---------- | ---------------------------------- |
| 编译成功例 | 哪些正确关系被保留？               |
| 编译失败例 | 哪些错误必须被拒绝？               |
| 运行时例   | 外部输入实际发生什么？             |
| 项目追踪   | 这个概念在哪个真实功能中承担职责？ |

运行基线：

```powershell
cd frontend
npm run typecheck
npm test -- src/features/typescript-lab
npm run dev
```

浏览器打开 `http://localhost:3000/labs/typescript`。可执行 Runner 已预编译和测试，不使用 `eval`，也不会修改产品 Issue 数据。

## 核心源码

- [领域类型](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/issues/types.ts)
- [Lab 运行时示例](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/examples.ts)
- [Lab 编译期负例](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/compile-time-examples.ts)
- [课程目录](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/catalog.ts)
- [Lab 页面](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/screens/TypeScriptLabPage.tsx)
- [运行时测试](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/examples.test.ts)

## 完成标准

- 不使用 `any` 绕过课程练习；
- 能解释每个 `as` 的证据来源；
- 能同时讨论编译期与运行时；
- 能把 C# DTO、JSON 和 TypeScript 类型对齐；
- 能新增一课并补齐编译、运行和页面测试。

[返回文档总索引](../README.md)
