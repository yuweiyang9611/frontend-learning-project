# 源码追踪路线

本文提供“从可见行为到数据层”的固定追踪路线。不要一次打开整个仓库；先选一个用户动作，顺着调用走完。

## 1. 应用启动与受保护路由

```text
浏览器 URL
  → frontend/app 页面入口
  → IssueFlowApp
  → BrowserRouter
  → AppProviders
  → AuthProvider.restoreSession
  → ProtectedRoute
  → AppLayout + Screen
```

源码：

1. [app/layout.tsx](../../frontend/app/layout.tsx)
2. [app/page.tsx](../../frontend/app/page.tsx)
3. [app/[...path]/page.tsx](../../frontend/app/%5B...path%5D/page.tsx)
4. [IssueFlowApp.tsx](../../frontend/src/app/IssueFlowApp.tsx)
5. [AppProviders.tsx](../../frontend/src/app/AppProviders.tsx)
6. [AppLayout.tsx](../../frontend/src/layouts/AppLayout.tsx)

观察点：

- 服务端/框架入口与客户端 Router 的分界；
- `useSyncExternalStore` 挂载边界；
- lazy/Suspense；
- Session 尚未恢复与确认未登录的区别；
- 登录前 path + search 如何保留。

## 2. 登录

```text
LoginPage form
  → useAuth.login
  → issueflowApi.login
  → POST /api/auth/login
  → Cookie / Session response
  → AuthProvider state
  → navigate original target
```

前端：

- [LoginPage.tsx](../../frontend/src/screens/LoginPage.tsx)
- [AppProviders.tsx](../../frontend/src/app/AppProviders.tsx)
- [issueflowApi.ts](../../frontend/src/api/issueflowApi.ts)

同源：

- [login route](../../frontend/app/api/auth/login/route.ts)
- [server auth](../../frontend/src/server/auth.ts)

.NET：

- [AuthEndpoints.cs](../../backend/IssueFlow.Api/Features/Authentication/AuthEndpoints.cs)
- [ApplicationUser.cs](../../backend/IssueFlow.Api/Models/ApplicationUser.cs)

检查：错误 status、Set-Cookie、credentials include、localStorage profile、返回目标。

## 3. Issue 列表

```text
IssuesPage
  → useSearchParams
  → parsed IssueQuery
  → queryKey ['issues', query]
  → issueflowApi.listIssues
  → buildIssueQuery
  → GET /api/issues?...
  → PagedResult<Issue>
  → Query Cache
  → IssueTable / mobile cards
```

前端：

- [IssuesPage.tsx](../../frontend/src/screens/IssuesPage.tsx)
- [types.ts](../../frontend/src/features/issues/types.ts)
- [components.tsx](../../frontend/src/features/issues/components.tsx)
- [issueflowApi.ts](../../frontend/src/api/issueflowApi.ts)

同源：

- [issues route](../../frontend/app/api/issues/route.ts)
- [issueflow-db.ts](../../frontend/src/server/issueflow-db.ts)

.NET：

- [IssueEndpoints.cs](../../backend/IssueFlow.Api/Features/Issues/IssueEndpoints.cs)
- [IssueContracts.cs](../../backend/IssueFlow.Api/Features/Issues/IssueContracts.cs)
- [IssueMapping.cs](../../backend/IssueFlow.Api/Features/Issues/IssueMapping.cs)

检查：URL 默认值、debounce、query key、page vs infinite shape、稳定排序、搜索范围差异。

## 4. 新建/编辑 Issue

```text
IssueFormPage
  → members/issue Query
  → IssueForm controlled state
  → validateIssue
  → mutation
  → createIssue/updateIssue
  → POST/PATCH
  → ApiError or Issue
  → cache set/invalidate
  → navigate/toast/focus
```

前端：

- [IssueFormPage.tsx](../../frontend/src/screens/IssueFormPage.tsx)
- [IssueForm.tsx](../../frontend/src/features/issues/IssueForm.tsx)
- [types.ts](../../frontend/src/features/issues/types.ts)

.NET：

- [IssueValidation.cs](../../backend/IssueFlow.Api/Features/Issues/IssueValidation.cs)
- [IssueEndpoints.cs](../../backend/IssueFlow.Api/Features/Issues/IssueEndpoints.cs)

检查：

- create 与 edit 初始值；
- 客户端和服务端验证；
- 409 标题冲突；
- PATCH 属性 presence；
- 首错焦点；
- pending 防重复；
- 成功后的详情与列表缓存。

## 5. 列表状态乐观更新

```text
status select
  → mutation.onMutate
  → cancel matching queries
  → snapshot list(s) + detail
  → optimistic cache write
  → PATCH request
  ├─ error → rollback + toast
  └─ settled → invalidate lists/detail
```

源码：

- [IssuesPage.tsx](../../frontend/src/screens/IssuesPage.tsx)
- [BoardPage.tsx](../../frontend/src/screens/BoardPage.tsx)
- [IssueDetailPage.tsx](../../frontend/src/screens/IssueDetailPage.tsx)

检查：普通/Infinite/Board/Detail 各缓存是否一致；并发 mutation 是否会被旧快照覆盖。

## 6. Board 拖放

```text
dragStart(issue)
  → overStatus
  → drop(target status)
  → update mutation
  → optimistic board cache
  → API
  → rollback/invalidate
```

同时追踪 status select 的键盘替代。只验证拖鼠标不够。

源码：

- [BoardPage.tsx](../../frontend/src/screens/BoardPage.tsx)
- [components.tsx](../../frontend/src/features/issues/components.tsx)

## 7. Issue 详情、评论和附件

```text
/issues/:id
  → parse and validate id
  → parallel issue/comments/attachments Queries
  → detail sections
  → comment/upload mutations
  → child cache invalidation
```

前端：

- [IssueDetailPage.tsx](../../frontend/src/screens/IssueDetailPage.tsx)
- [issueflowApi.ts](../../frontend/src/api/issueflowApi.ts)

.NET：

- [CommentEndpoints.cs](../../backend/IssueFlow.Api/Features/Comments/CommentEndpoints.cs)
- [AttachmentEndpoints.cs](../../backend/IssueFlow.Api/Features/Attachments/AttachmentEndpoints.cs)
- [AttachmentFilePolicy.cs](../../backend/IssueFlow.Api/Features/Attachments/AttachmentFilePolicy.cs)
- [AttachmentStorage.cs](../../backend/IssueFlow.Api/Infrastructure/AttachmentStorage.cs)

检查：enabled guard、独立错误状态、FormData、5 MB、伪造文件、下载 URL、删除清理。

## 8. Modal 与 Toast

```text
delete trigger
  → open state
  → Modal saves previous focus
  → focus first control
  → Tab trap / Escape
  → mutation
  → Toast aria-live
  → close and restore focus
```

源码：

- [ui.tsx](../../frontend/src/components/ui.tsx)
- [AppProviders.tsx](../../frontend/src/app/AppProviders.tsx)

检查：dialog naming、焦点循环、关闭方式、pending、防背景误操作、toast 文本。

## 9. 主题

```text
stored theme/system
  → ThemeProvider state
  → matchMedia
  → resolvedTheme
  → documentElement data-theme + colorScheme
  → CSS custom properties
```

源码：

- [AppProviders.tsx](../../frontend/src/app/AppProviders.tsx)
- [globals.css](../../frontend/app/globals.css)
- [product.css](../../frontend/app/product.css)

检查：初始闪烁、系统变化监听 cleanup、三种选项、两个主题对比度。

## 10. TypeScript Lab

```text
URL lesson id
  → findLesson/filterLessons
  → TypeScriptLabPage
  → precompiled lesson.run
  → ExampleResult
  → output aria-live
  → progress localStorage
```

源码：

- [catalog.ts](../../frontend/src/features/typescript-lab/catalog.ts)
- [examples.ts](../../frontend/src/features/typescript-lab/examples.ts)
- [compile-time-examples.ts](../../frontend/src/features/typescript-lab/compile-time-examples.ts)
- [TypeScriptLabPage.tsx](../../frontend/src/screens/TypeScriptLabPage.tsx)

检查：输入从 string/JSON 到 unknown、decoder、Runner 无副作用、URL/进度分离。

## 11. 每次追踪的记录模板

| 层          | 文件/函数 | 输入 | 输出 | 失败 |
| ----------- | --------- | ---- | ---- | ---- |
| UI event    |           |      |      |      |
| React state |           |      |      |      |
| Query       |           |      |      |      |
| API client  |           |      |      |      |
| HTTP        |           |      |      |      |
| Server      |           |      |      |      |
| Storage     |           |      |      |      |
| UI feedback |           |      |      |      |

完成一条链后，再去看旁支。这样更容易形成因果模型。

[返回参考资料](../README.md)
