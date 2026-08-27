# 02：浏览器、URL、HTTP 与 DevTools

## 本章目标

学完本章后，你应该能解释一次页面访问经过了哪些环节，并能用浏览器开发者工具回答：

- 当前页面的 URL 由哪些部分组成；
- 哪些文件来自页面入口，哪些数据来自 API；
- 请求为什么得到 200、400、401、404 或 500；
- Cookie、`localStorage` 和 React 内存状态各自保存什么；
- “页面没有更新”到底是路由、请求、缓存还是渲染问题。

前置：完成 [01：项目地图与数据模式](01-project-map-and-data-modes.md)，并让前端运行在 `http://localhost:3000`。

## 1. URL 不只是地址

以列表页为例：

```text
http://localhost:3000/issues?status=open&page=2#results
└─scheme─┘ └────host────┘└path─┘└────query─────┘└fragment┘
```

- `http` 是协议；
- `localhost` 是主机名，`3000` 是端口；
- `/issues` 决定显示哪个业务页面；
- `status=open&page=2` 是可以复制、收藏、前进后退的筛选状态；
- `#results` 只在浏览器端定位，不会作为 HTTP 请求路径发送给服务器。

IssueFlow 在 [IssuesPage.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/screens/IssuesPage.tsx) 中通过 React Router 读取和更新查询参数。把筛选条件放在 URL，而不是只放在组件状态中，意味着刷新后条件仍在，也可以把同一个视图发给别人。

### 实验：观察 URL 状态

1. 登录后打开 `/issues`。
2. 依次改变搜索、状态、排序和分页。
3. 复制地址到新标签页，确认筛选能恢复。
4. 使用浏览器后退和前进，观察页面是否回到历史筛选。
5. 手工写入非法值，例如 `?status=unknown&page=-1`，查看界面的守卫和回退。

不要只记录“能用”。在学习笔记中写出：哪个参数变化、哪个组件读取它、是否触发新请求、非法值如何处理。

## 2. 从导航到画面

首次输入 URL 时，简化链路如下：

1. 浏览器向应用服务器请求页面。
2. Vinext/Next 入口从 [app/layout.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/app/layout.tsx)、[app/page.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/app/page.tsx) 或 catch-all 页面建立外壳。
3. 浏览器下载 JavaScript 和 CSS。
4. [IssueFlowApp.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/app/IssueFlowApp.tsx) 挂载 React Router。
5. Router 根据路径选择 Screen。
6. Screen 通过 TanStack Query 调用 [issueflowApi.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/api/issueflowApi.ts)。
7. API 返回 JSON，Query 更新缓存，React 重新计算 UI 并提交 DOM 变化。

这里有两个容易混淆的“路由”：

- `frontend/app` 决定应用入口、页面外壳与部署框架行为；
- `frontend/src/app/IssueFlowApp.tsx` 中的 React Router 决定登录后的业务导航。

二者不是重复代码，而是不同层次。第 07 章会完整追踪深链接和受保护路由。

## 3. HTTP 请求与响应

一个请求至少包含方法、URL、Headers 和可选 Body：

| 目的       | 方法与路径               | 常见成功码 |
| ---------- | ------------------------ | ---------- |
| 获取列表   | `GET /api/issues`        | 200        |
| 创建 Issue | `POST /api/issues`       | 201        |
| 局部更新   | `PATCH /api/issues/248`  | 200        |
| 删除       | `DELETE /api/issues/248` | 204        |
| 登录       | `POST /api/auth/login`   | 200        |

状态码是机器可读的结果类别：

- 2xx：服务器接受并完成操作；
- 400：输入或查询参数不符合 Contract；
- 401：没有有效会话；
- 404：资源不存在；
- 409：请求与当前资源状态冲突，例如标题重复；
- 415：上传媒体类型不受支持；
- 500：服务端出现未处理故障。

Fetch 有一个重要特性：收到 400 或 500 时，Promise 通常仍会 fulfilled。客户端必须检查 `response.ok`。项目的 [request 函数](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/api/issueflowApi.ts) 会把失败响应转换为 `ApiError`。

## 4. JSON 只是文本，类型不会随请求传输

TypeScript 的 `Issue` 接口不会进入网络包。线上实际传输的是 JSON：

```json
{
  "id": 248,
  "key": "IF-248",
  "status": "in_progress",
  "assignee": null
}
```

`response.json() as Promise<Issue>` 只是在编译期告诉 TypeScript “请相信它”。如果服务器返回 `{"id":"oops"}`，断言不会修复数据，也不会自动抛错。第 05 章与 TypeScript 专题会用 Decoder 对比这个边界。

## 5. Cookie、localStorage 与内存状态

| 位置                | 项目中的用途                           | 生命周期           | 风险提示                      |
| ------------------- | -------------------------------------- | ------------------ | ----------------------------- |
| HttpOnly Cookie     | .NET 登录授权                          | 由服务端设置和失效 | JS 不能读取，但请求可自动携带 |
| `localStorage`      | 演示数据、主题、Lab 进度、会话 UI 缓存 | 关闭浏览器后仍在   | 用户可修改，不能作为授权依据  |
| TanStack Query 缓存 | 服务端数据的客户端副本                 | 当前页面会话为主   | 会过期、失效或被回滚          |
| React State         | 输入框、弹窗等瞬时 UI                  | 组件/页面生命周期  | 刷新后通常消失                |
| URL                 | 搜索、筛选、分页等可分享状态           | 浏览器历史         | 不应放密码和秘密              |

“存在哪里”是架构选择。可分享且影响资源视图的状态优先考虑 URL；服务器拥有的数据交给 Query；临时交互交给组件 State；授权由服务端 Cookie 判断。

## 6. DevTools 的固定排查顺序

### Network

1. 勾选 Preserve log。
2. 按 Fetch/XHR 筛选。
3. 查看 Request URL、Method、Status。
4. 展开 Query String Parameters 或 Request Payload。
5. 查看 Response/Preview 是否符合预期。
6. 检查 Timing，区分“请求慢”和“渲染慢”。

### Console

关注首个错误，而不是最后一串连锁错误。复制错误文本前先记录发生操作、URL 和数据模式。

### Application

查看 Cookies 和 Local Storage。切换本地演示模式后，搜索 `issueflow-demo-db-v3`；使用真实 .NET 后端时，确认 Cookie 是否随请求发送，但不要把 Cookie 值写进仓库。

### Elements 与 Accessibility

查看实际 DOM、计算样式、可访问名称和焦点位置。React 组件名不是浏览器最终接收的语义；最终必须落成正确的 `button`、`label`、`dialog` 等元素或角色。

## 7. 故障注入练习

依次制造并记录：

1. 在 URL 中输入不存在的 Issue ID；
2. 在 DevTools 中切换 Offline 后刷新列表；
3. 删除会话 Cookie，再尝试写操作；
4. 临时把 API Base URL 指向错误端口；
5. 在本地模式中破坏 `issueflow-demo-db-v3` 的 JSON；
6. 输入一个过去的截止日期并提交。

每次都按“可见症状 → Network → 响应 Contract → React/Query 状态 → 修复位置”记录。不要随机改代码直到错误消失。

## 常见误区

- Network 显示 200，不代表返回字段一定正确。
- 前端跳转到登录页是用户体验，不是服务端授权。
- CORS 报错不等于服务器没收到请求。
- 清空 Query 缓存不等于清空数据库。
- 页面刷新与客户端路由导航的执行路径并不完全相同。

## 本章验收

- [ ] 能画出“URL → 页面入口 → Router → Screen → Query → API → DOM”链路。
- [ ] 能在 Network 中找到一次列表请求及其查询参数。
- [ ] 能解释为什么 Fetch 要主动检查 `response.ok`。
- [ ] 能区分 Cookie、localStorage、Query Cache、React State 和 URL。
- [ ] 能用固定顺序定位一个人为制造的失败。

[上一章：项目地图与数据模式](01-project-map-and-data-modes.md) · [下一章：HTML 与 CSS](03-html-and-css.md)
