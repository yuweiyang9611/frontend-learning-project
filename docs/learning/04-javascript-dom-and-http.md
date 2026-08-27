# 04：JavaScript、DOM 与异步

## 本章目标

本章把 JavaScript 语法放进 IssueFlow 的真实事件链中。完成后，你应该能从一次点击追到事件处理器、异步请求、状态更新和 DOM 提交，并能解释闭包、不可变更新与 Promise 的作用。

## 1. 值、引用与不可变更新

原始值如 string、number、boolean 按值使用；object、array 和 function 通过引用关联。React 和 TanStack Query 常依赖引用变化判断“数据是否更新”。

错误思路：

```ts
issue.status = "resolved";
return issue;
```

更容易被状态系统观察的写法：

```ts
return { ...issue, status: "resolved" };
```

第二种写法创建新对象。它不意味着任何嵌套值都自动深拷贝；展开运算符只复制当前一层。

### 练习

阅读 [BoardPage.tsx](../../frontend/src/screens/BoardPage.tsx) 的乐观更新，标出：

- 哪些数组是新数组；
- 哪些 Issue 是新对象；
- 失败时保存了什么快照；
- 为什么直接修改 Query Cache 中的旧对象会增加回滚难度。

## 2. 数组方法表达数据管道

Issue 列表大量使用：

- `filter`：保留满足条件的项；
- `map`：把领域对象转换成 UI 节点或新对象；
- `find`：寻找单个成员或 Issue；
- `some`：判断是否存在匹配项；
- `sort`：原地排序，使用前要特别留意副作用。

当数据来自缓存时，先复制再排序：

```ts
const sorted = [...issues].sort(compareIssues);
```

否则可能改变其他组件共享的同一个数组。

## 3. 模块与依赖边界

ES Module 的 `import`/`export` 不只是组织文件，还表达依赖方向。项目大致遵循：

```text
screens → features/components → api/types
                       ↘ data（本地演示）
```

如果底层 `types.ts` 反向导入 Screen，就会形成难以理解的环。新增功能时优先让领域类型和纯函数保持低依赖。

TypeScript 中 `import type` 表明只需要编译期类型，构建后的 JavaScript 不应产生对应运行时导入。

## 4. 闭包：事件处理器为何记得旧值

函数会捕获创建时可见的变量。React 每次渲染都创建新的值和处理器，因此异步回调可能读到旧快照。

典型场景：

```ts
setCount(count + 1);
setCount(count + 1);
```

两次都可能基于同一个 `count`。依赖前一状态时使用函数式更新：

```ts
setCount((current) => current + 1);
```

阅读 [AppProviders.tsx](../../frontend/src/app/AppProviders.tsx) 中 Toast 的 `dismiss` 与 `toast`，观察 `useCallback`、函数式更新和定时器如何协作。

## 5. Event Loop、Promise 与 async/await

`await` 不会阻塞整个浏览器线程；它暂停当前 async 函数，把后续工作安排到 Promise 完成之后。用户界面仍可绘制和响应其他事件。

一次保存操作可拆为：

1. submit 事件进入调用栈；
2. 校验同步完成；
3. 发起 Fetch；
4. 当前函数让出执行；
5. 浏览器处理网络和其他事件；
6. Promise settle；
7. mutation 回调更新缓存和 Toast；
8. React 批量提交 UI。

### 错误处理

只有你能够处理或补充上下文的层才应该 catch。吞掉错误会让 UI 永远停在错误的 pending 状态。项目用 `ApiError` 保留 HTTP status 和字段错误，表单再决定如何呈现。

## 6. DOM 事件与 React 事件

事件通常经历 capture、target、bubble。React 提供跨浏览器一致的事件对象，但最终仍依赖 DOM 规则。

要区分：

- `event.preventDefault()`：取消浏览器默认行为，如表单导航；
- `event.stopPropagation()`：阻止继续传播；
- `disabled`：控件本身不可交互；
- 判断 pending 后提前 return：业务层防重入。

不应为了“修复一个点击”到处 stopPropagation。先画出元素嵌套与事件路径。

## 7. Fetch 与序列化

[issueflowApi.ts](../../frontend/src/api/issueflowApi.ts) 统一处理：

- API Base URL；
- `credentials: 'include'`；
- JSON Content-Type；
- FormData 时让浏览器生成 multipart boundary；
- 非 2xx 的 Problem Details；
- 204 空响应。

两个重要边界：

1. `JSON.stringify` 会省略值为 `undefined` 的对象属性，但会保留 `null`；
2. response body 只能消费一次，解析 JSON 也可能失败。

这直接影响 PATCH：

| JavaScript 对象             | 发送的 JSON           | 典型含义       |
| --------------------------- | --------------------- | -------------- |
| `{}`                        | `{}`                  | 没有提供字段   |
| `{ assigneeId: undefined }` | `{}`                  | 省略，保持原值 |
| `{ assigneeId: null }`      | `{"assigneeId":null}` | 明确取消负责人 |
| `{ assigneeId: 2 }`         | `{"assigneeId":2}`    | 设置负责人     |

## 8. 浏览器存储

本地模式通过 localStorage 保存模拟数据库。存储只接受字符串，所以会经历 stringify/parse。它没有事务、授权、跨用户隔离或服务端可信性。

阅读 [issueflowApi.ts](../../frontend/src/api/issueflowApi.ts) 的 `readDatabase`：

- 第一次如何 seed；
- JSON 损坏时如何恢复；
- clone 为什么通过 JSON 往返实现；
- 这种 clone 会丢失哪些 JavaScript 类型。

答案至少应提到 Date、Map、Set、undefined、循环引用和大整数边界。

## 9. 三个小实验

### A. 事件顺序

给 Modal 的外层、内容区和按钮临时添加日志，观察 capture/bubble。完成记录后撤销日志。

### B. Promise 顺序

在控制台运行同步日志、`queueMicrotask`、resolved Promise 和 `setTimeout(..., 0)`，预测再验证顺序。解释 microtask 与 task 的区别。

### C. PATCH 序列化

在不提交真实修改的测试中，对 `undefined`、`null`、空字符串分别执行 stringify，写出服务端能观察到的差异。

## 10. 从点击追踪源码

选择“把 Issue 移到 Resolved”操作：

1. 从按钮或 select 找到 handler；
2. 找到 mutation function；
3. 找到 `issueflowApi.updateIssue`；
4. 在 Network 找到 PATCH；
5. 找到 Query 的乐观缓存更新；
6. 找到失败回滚和成功失效；
7. 找到最终 DOM 与 Toast。

若中间一步说不清，就不要跳到下一步。

## 常见误区

- `const` 只禁止变量重新赋值，不会让对象自动不可变。
- `async` 函数一定返回 Promise。
- TypeScript 类型在 JSON 中不存在。
- `sort` 会修改原数组。
- localStorage 成功写入不等于后端保存成功。

## 本章验收

- [ ] 能解释浅拷贝和引用相等。
- [ ] 能识别一个 stale closure 风险。
- [ ] 能画出保存操作的异步时间线。
- [ ] 能解释 `undefined` 与 `null` 对 PATCH 的不同影响。
- [ ] 能从 UI 事件追到 API 和缓存更新。

[上一章：HTML 与 CSS](03-html-and-css.md) · [下一章：TypeScript 学习路线](05-typescript-roadmap.md)
