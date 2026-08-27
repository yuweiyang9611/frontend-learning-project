# 07：路由、URL 状态与认证

## 本章目标

完成本章后，你应能解释 IssueFlow 的双层路由、嵌套路由、URL 状态和登录返回路径，并明确前端“保护页面”与服务端“授权请求”不是同一件事。

## 1. 两层路由的职责

当前应用不是单纯的 Vite SPA：

| 层                 | 入口                                                                                                                       | 职责                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Vinext/Next App 层 | [frontend/app](https://github.com/yuweiyang9611/frontend-learning-project/tree/main/frontend/app)                          | 框架页面入口、Metadata、API Routes、部署 |
| React Router 层    | [IssueFlowApp.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/app/IssueFlowApp.tsx) | 浏览器内业务导航、嵌套布局、URL 参数     |

[app/page.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/app/page.tsx)、[app/[...path]/page.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/app/%5B...path%5D/page.tsx) 等入口最终承载同一个客户端应用。用户点击 Router Link 时通常不会重新下载整页；直接刷新深链接则先经过框架入口。

### 实验：深链接

1. 在应用内点击进入 `/issues/248`；
2. 记录 Network 中的请求；
3. 直接刷新；
4. 新标签粘贴相同 URL；
5. 对比三种情况下 Document 请求和客户端 API 请求。

## 2. 路由表是产品信息架构

[IssueFlowApp.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/app/IssueFlowApp.tsx) 明确声明：

- `/login` 是公开页面；
- `/dashboard`、`/issues`、`/board` 等位于受保护 Layout 下；
- `/issues/:id` 和 `/issues/:id/edit` 使用动态段；
- `/settings` 通过 `Outlet` 嵌套子页面；
- 未匹配路径进入 Not Found。

路由顺序和布局嵌套表达“哪些页面共享导航、哪些页面需要会话、哪些页面有自己的子导航”。

## 3. 参数在边界处仍是字符串

`useParams().id` 的类型来自 URL，本质是 string 或 undefined。项目转换为 number 后，还会用安全整数与正数规则检查。

不要直接：

```ts
const id = Number(useParams().id);
fetchIssue(id);
```

而应区分：

- 缺失；
- `NaN`；
- 0 或负数；
- 小数；
- 超过 JavaScript 安全整数；
- 合法正整数。

只有合法 ID 才启用 Query。这样可避免向服务器发送 `/api/issues/NaN`。

## 4. URL 是筛选状态的单一来源

[IssuesPage.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/screens/IssuesPage.tsx) 用 `useSearchParams` 管理搜索、筛选、排序、分页和视图。

更新规则应考虑：

- 修改筛选后把 page 重置为 1；
- 默认值是否应从 URL 省略；
- 未知 status/sort 值如何回退；
- 空搜索如何删除参数；
- 多个参数更新是否应合并为一次历史记录。

`setSearchParams` 的 replace/push 选择会影响后退按钮。高频输入通常需要 debounce 或 replace，明确的筛选操作可以保留历史。

## 5. 嵌套路由与 Outlet

Settings Layout 渲染共同标题/导航，再通过 `Outlet` 放入 profile、account 或 appearance。父路由负责共同结构，子路由只负责自己的内容。

这比在每页复制设置导航更可维护，也让 URL 保留明确层级：

```text
/settings/profile
/settings/account
/settings/appearance
```

## 6. Lazy 与 Suspense

Screen 使用 `lazy` 加载，`Suspense` 提供页面 chunk 尚未准备好时的 fallback。它解决“代码还没到”的等待，不等同于 Query 的“数据还没到”。

因此可能有两种 Loading：

- 路由级：JavaScript chunk 正在加载；
- 页面级：组件已加载，但 API 数据尚未返回。

两者应有清楚但不过度闪烁的状态。

## 7. 受保护路由的真实边界

`ProtectedRoute` 等待 Auth Provider 恢复 Session；没有 Session 时导航到登录页，并把原路径放入 location state。登录成功后 [LoginPage.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/screens/LoginPage.tsx) 可返回原目标。

这只是前端体验层：

- 阻止用户看到不合适的页面；
- 保留登录前目标；
- 避免未恢复会话时闪烁。

真正的写操作安全必须由 API 的 `RequireAuthorization` 与 Cookie 会话保证。攻击者可以绕过前端直接发送 HTTP 请求。

## 8. 登录返回路径安全

返回目标只应是应用内相对路径。若未来从查询参数接收绝对 URL，必须防止 open redirect。验证思路：

- 只接受以单个 `/` 开头的本地路径；
- 拒绝 `//evil.example`、带协议的 URL 和控制字符；
- 无效时回到固定 Dashboard。

当前实现使用 Router location state，风险比任意外部字符串小，但仍应理解边界。

## 9. 路由实验矩阵

| 场景                                  | 预期                             |
| ------------------------------------- | -------------------------------- |
| 未登录打开 `/issues/248?tab=activity` | 到登录页并保留完整 path + search |
| 登录成功                              | 返回原目标                       |
| 已登录打开 `/login`                   | 转到 Dashboard                   |
| `/settings`                           | replace 到 profile               |
| `/issues/not-a-number`                | 不发无效详情请求，显示合理错误   |
| 未知路径                              | Not Found                        |
| 浏览器后退                            | 恢复前一 URL 与筛选              |

为每项同时观察 URL、history、Network 和焦点，不要只断言页面文字。

## 常见误区

- React Router 路由不是服务端 API 路由。
- 客户端 redirect 不是 HTTP 3xx，也不是授权。
- URL 参数总是可信输入，必须解析和守卫。
- Lazy Loading 不能代替数据 Loading。
- 把所有筛选留在组件 State 会破坏分享与历史导航。

## 本章验收

- [ ] 能画出 Vinext/Next 与 React Router 的职责边界。
- [ ] 能解释动态 ID 的所有非法输入。
- [ ] 能说明 location state 怎样实现登录后返回。
- [ ] 能证明客户端保护不能代替服务端授权。
- [ ] 能为 Settings 新增一个嵌套路由而不复制 Layout。

[上一章：React 组件与状态](06-react-components-and-state.md) · [下一章：服务端状态与 API](08-server-state-and-api.md)
