# 05：TypeScript 学习路线

## 本章目标

本章是 TypeScript 主线导航。它不把所有知识塞进一个超长章节，而是告诉你应按什么顺序学习六个专题，并把每个概念连接到项目中的真实代码。

前置：理解 JavaScript 对象、模块、Promise 和 JSON。TypeScript 是 JavaScript 的静态分析工具，不是替代 JavaScript 的独立运行时。

## 1. 先建立正确心智模型

TypeScript 能在运行前发现一类不一致：

```ts
const status: IssueStatus = "finished"; // 编译错误
```

但它不会自动验证网络数据：

```ts
const issue = (await response.json()) as Issue;
```

第二行的 `as Issue` 是开发者承诺，不是运行时检查。学习路线必须同时覆盖：

- 编译期建模：联合类型、泛型、Utility Types、穷尽检查；
- 运行时边界：`unknown`、type guard、decoder、日期与整数；
- 跨语言 Contract：C# DTO、JSON 和 TypeScript 类型如何对齐。

## 2. 六个专题的顺序

| 顺序 | 专题                                                                     | 完成标志                                    |
| ---- | ------------------------------------------------------------------------ | ------------------------------------------- |
| 1    | [从 C# 到 TypeScript](../typescript/01-from-csharp-to-typescript.md)     | 能区分结构类型、名义类型与类型擦除          |
| 2    | [领域建模与收窄](../typescript/02-domain-modeling-and-narrowing.md)      | 能从常量派生 union 并穷尽处理               |
| 3    | [泛型与 Utility Types](../typescript/03-generics-utilities-and-keyof.md) | 能解释 `PagedResult<T>`、`Partial`、`keyof` |
| 4    | [运行时边界](../typescript/04-runtime-boundaries.md)                     | 能把 `unknown` 安全解码为领域类型           |
| 5    | [.NET Wire Contract](../typescript/05-dotnet-wire-contracts.md)          | 能列出日期、枚举、null 与数值风险           |
| 6    | [Lab 实验手册](../typescript/06-lab-workbook.md)                         | 能完成 12 课并新增一课                      |

不要只顺序阅读。每完成一个专题，都回到 `/labs/typescript` 运行相应课程，再打开源码修改一个例子。

## 3. 当前源码地图

| 文件                                                                                                                                                           | 学习价值                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [types.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/issues/types.ts)                                         | 常量派生 union、领域接口、泛型、Partial、guard |
| [examples.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/examples.ts)                           | 可执行的运行时示例                             |
| [compile-time-examples.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/compile-time-examples.ts) | 编译成功与 `@ts-expect-error` 负例             |
| [catalog.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/catalog.ts)                             | 类型化课程目录与 runner 连接                   |
| [TypeScriptLabPage.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/screens/TypeScriptLabPage.tsx)                       | 泛型、DOM 事件、URL 与进度状态的 UI 组合       |
| [examples.test.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/examples.test.ts)                 | 运行时边界测试                                 |
| [typescript-lab.spec.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/e2e/typescript-lab.spec.ts)                             | 用户视角的课程流程                             |

## 4. 12 课建议节奏

现有 Lab 的课程目录由 [catalog.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/catalog.ts) 定义。学习时每课执行四步：

1. 先不运行，预测 Output；
2. 打开 Implementation，逐个标注输入类型和输出类型；
3. 运行示例，用实际输出修正心智模型；
4. 去测试文件补一个边界用例。

建议分三轮：

- 第一轮：literal union、`as const`、`satisfies`、类型收窄；
- 第二轮：泛型、Utility Types、`keyof` 和 indexed access；
- 第三轮：`unknown`、decoder、日期、safe integer 与 C# 互操作。

课程具体映射和练习见 [Lab 实验手册](../typescript/06-lab-workbook.md)。

## 5. 类型驱动变更实验

临时给 `ISSUE_STATUSES` 增加 `'blocked'`：

```ts
export const ISSUE_STATUSES = [
  "open",
  "in_progress",
  "blocked",
  "resolved",
  "closed",
] as const;
```

然后运行：

```powershell
cd frontend
npm run typecheck
```

记录所有错误并分类：

- 标签映射缺少新 key；
- UI 分支没有覆盖；
- 排序权重没有定义；
- API/数据库 Contract 尚未同步；
- 测试 fixture 不完整。

这个实验的目标不是把编译错误压掉，而是体验一个领域变化如何通过类型系统传播。完成记录后撤销临时变更，或者把它发展成完整功能并同步所有后端。

## 6. 类型断言审计

运行：

```powershell
rg -n "\bas\s+|as const|satisfies|@ts-expect-error" frontend/src
```

对每个 `as SomeType` 提问：

1. 输入是否来自 DOM、JSON、localStorage 或 URL；
2. 这里是否真的验证了值；
3. 是否已有 `isIssueStatus` 一类 guard；
4. 错误值进入系统后会在哪里爆炸；
5. 能否用收窄、decoder 或更好的 API 消除断言。

不是所有断言都错误，但边界处的无证据断言应受到最高关注。

## 7. 学习产物

在自己的学习分支中维护一份实验记录，每项包含：

- 问题与预测；
- 最小代码；
- 编译期结果；
- 运行时结果；
- 测试；
- 对项目设计的影响。

可以复制 [练习任务模板](../reference/task-template.md)，不要直接把临时实验日志混进产品 README。

## 常见误区

- interface 不会让 JSON 自动符合接口。
- `any` 不是“灵活的 unknown”，它会关闭检查传播。
- `Partial<T>` 只让属性可选，不会表达所有 PATCH 业务语义。
- `readonly` 主要是编译期限制，不会自动 `Object.freeze`。
- C# `long` 并不总能安全放进 JavaScript `number`。

## 本章验收

- [ ] 能说明 TypeScript 的能力边界。
- [ ] 能从 `as const` 数组推导 literal union。
- [ ] 能解释 `satisfies` 与普通类型断言的差异。
- [ ] 能指出生产 API client 当前信任 JSON 的位置。
- [ ] 能按顺序进入六个专题并完成至少一个边界实验。

[上一章：JavaScript、DOM 与异步](04-javascript-dom-and-http.md) · [下一章：React 组件与状态](06-react-components-and-state.md)
