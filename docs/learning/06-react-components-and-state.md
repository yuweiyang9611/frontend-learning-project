# 06：React 组件与状态

## 本章目标

本章解决一个核心问题：每一份状态应该由谁拥有？完成后，你应能区分 Props、局部 State、Context、派生值、服务端缓存和 Effect，并能解释一次渲染为什么发生。

## 1. 组件是“状态到 UI”的映射

可以先把组件理解成：

```text
UI = render(props, state, context)
```

渲染应尽量保持纯：相同输入应产生相同描述，不要在渲染阶段写 localStorage、发请求或修改外部对象。真正的副作用放在事件处理器或 Effect 中。

项目按职责拆分：

- [screens](https://github.com/yuweiyang9611/frontend-learning-project/tree/main/frontend/src/screens)：与路由对应，组合查询和业务动作；
- [features/issues](https://github.com/yuweiyang9611/frontend-learning-project/tree/main/frontend/src/features/issues)：Issue 领域类型、表单和列表组件；
- [components/ui.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/components/ui.tsx)：跨页面的 UI 原语；
- [layouts/AppLayout.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/layouts/AppLayout.tsx)：长期存在的应用外壳；
- [app/AppProviders.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/app/AppProviders.tsx)：跨树共享的基础能力。

## 2. Props、State 与 Context

### Props

父组件传入的只读输入。组件不应修改 props 指向的对象。适合明确、局部的依赖，例如 `IssueForm` 接收初始值、成员、提交函数和 pending 状态。

### State

组件随交互变化并需要重新渲染的私有记忆，例如输入值、Modal 开关和移动抽屉状态。

### Context

跨越多层组件共享且相对稳定的能力。项目用 Context 提供：

- 认证 Session 和登录/登出；
- 当前主题和切换函数；
- Toast 发布函数。

Context 不是所有状态的默认容器。频繁变化的大列表放进单一 Context 会扩大重渲染范围；服务端数据由 TanStack Query 管理更合适。

## 3. 状态所有权决策表

| 状态                   | 推荐所有者                    | 项目示例                        |
| ---------------------- | ----------------------------- | ------------------------------- |
| 输入框当前文本         | 最近的表单组件                | `IssueForm`                     |
| 当前筛选/分页          | URL                           | `IssuesPage`                    |
| Issue 列表响应         | Query Cache                   | `useQuery` / `useInfiniteQuery` |
| 当前用户               | Auth Provider + 服务端会话    | `AuthProvider`                  |
| 主题偏好               | Theme Provider + localStorage | `ThemeProvider`                 |
| Modal 是否打开         | 触发它的页面/组件             | 删除确认                        |
| 从 issues 统计出的数量 | 渲染时派生                    | `DashboardPage`                 |

如果一个值能完全由现有 props/state 计算，就先派生，不要再存一份。重复状态会产生同步问题。

## 4. 派生状态

[DashboardPage.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/screens/DashboardPage.tsx) 从 Issue 列表计算指标、焦点 Issue 和相关成员。这些值不需要自己的 `useState`，因为源数据变化时可以重新计算。

只有当计算昂贵且输入稳定时才考虑 `useMemo`。`useMemo` 是性能提示，不是语义保证，也不用于修复副作用。

### 练习

选择一个可由其他状态计算的值：

1. 写出它的唯一数据来源；
2. 删除重复 `useState`；
3. 在渲染中计算；
4. 用测试证明 UI 仍随源数据变化；
5. 只有测量到性能问题时再引入 memoization。

## 5. Effect 是与外部系统同步

Effect 的典型用途：

- 监听系统深色模式；
- 把解析后的主题写到 document；
- 恢复服务端 Session；
- 订阅键盘或媒体查询事件；
- 在打开/关闭交互后管理焦点。

阅读 [AppProviders.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/app/AppProviders.tsx) 的主题 Effect：

1. 创建 `matchMedia` 对象；
2. 注册 change 监听器；
3. 返回 cleanup 移除监听器。

依赖变化或组件卸载时 cleanup 会执行。漏掉 cleanup 会造成重复监听、内存泄漏或卸载后更新。

### 不需要 Effect 的场景

- 根据 props 计算显示文本；
- 响应按钮点击保存；
- 把一个 state 复制到另一个 state；
- 仅仅为了“代码执行一次”。

事件导致的副作用优先放事件处理器；渲染导致的派生值直接计算。

## 6. Provider 组合与初始化

[AppProviders.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/app/AppProviders.tsx) 的层次是：

```text
QueryClientProvider
  ThemeProvider
    ToastProvider
      AuthProvider
        Routes
```

`QueryClient` 通过 `useState` 只创建一次，避免每次渲染清空缓存。Auth Provider 用 `ready` 区分“尚未恢复会话”和“确认未登录”，否则页面会先闪到登录页。

## 7. Ref 与焦点

`useRef` 保存不会因为变化而自动触发渲染的值：

- DOM 节点引用；
- 上次获得焦点的元素；
- 定时器或递增 ID；
- 跨渲染但不用于 UI 的可变数据。

[ui.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/components/ui.tsx) 的 Modal 保存之前焦点、打开后聚焦首个元素、拦截 Tab 循环并在关闭后归还焦点。这是“DOM 外部系统”与 React 状态协作的典型案例。

## 8. Strict Mode 思维

开发环境可能通过额外执行暴露不纯渲染或不完整 cleanup。不要用“只执行一次”的假设依赖偶然行为。Effect 应做到：

- setup 可以安全再次执行；
- cleanup 完整撤销上一次 setup；
- 异步结果在卸载后不再提交状态。

Auth Provider 使用 `active` 标志避免恢复请求完成后更新已卸载组件。

## 9. 实验：状态分类审计

在 `IssueFormPage`、`IssuesPage`、`AppLayout` 各找出所有 `useState`、`useRef`、`useEffect`：

| 变量             | 当前机制 | 真正所有者 | 是否派生 | 生命周期        |
| ---------------- | -------- | ---------- | -------- | --------------- |
| 示例：mobileOpen | useState | AppLayout  | 否       | Layout 挂载期间 |

对每个 Effect 再回答“它在同步哪个外部系统？”如果回答不出来，尝试改成派生值或事件处理。

## 10. 测试建议

- State：从用户操作断言可见结果，不测试 Hook 实现细节；
- Context：用最小消费者验证 Provider 的行为；
- Effect：验证监听器清理、焦点或 document 属性；
- 异步：用可观察的 loading/error/success 状态等待，不用固定 sleep；
- Ref：测试焦点变化，而不是读取 ref。

## 常见误区

- setState 不会立即改变当前闭包中的变量。
- Context 不等于全局状态万能方案。
- Effect 不是“组件生命周期回调”的一一翻译。
- key 决定组件身份，不应使用会变化或不唯一的值。
- Props readonly 是设计约束，展开对象也只是浅复制。

## 本章验收

- [ ] 能为一个新状态选择 Props、State、Context、URL 或 Query。
- [ ] 能指出一个派生值并解释为何不存入 State。
- [ ] 能解释 Auth Provider 中 `ready` 的作用。
- [ ] 能检查一个 Effect 的 setup/cleanup 对称性。
- [ ] 能只用可见行为测试焦点归还。

[上一章：TypeScript 学习路线](05-typescript-roadmap.md) · [下一章：路由、URL 状态与认证](07-routing-url-and-auth.md)
