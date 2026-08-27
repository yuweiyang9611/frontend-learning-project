# 08：服务端状态与 API

## 本章目标

本章学习 TanStack Query 如何管理“服务器拥有、客户端缓存”的数据。你将掌握 query key、staleTime、条件查询、分页、mutation、乐观更新、回滚和失效。

## 1. 服务端状态与 UI 状态不同

Issue 列表不是组件独占的事实：

- 它有远端权威来源；
- 多个页面可能读取；
- 会过期；
- 可能被其他请求修改；
- 需要处理 loading、error 和 retry。

这类数据由 Query Cache 管理。输入框、Modal 开关等瞬时交互仍留在 React State。

## 2. Query 的四个核心部分

```ts
useQuery({
  queryKey: ["issue", id],
  queryFn: () => issueflowApi.getIssue(id),
  enabled: validId,
});
```

- `queryKey`：缓存身份；
- `queryFn`：如何取得数据；
- `enabled`：何时允许请求；
- 返回状态：data、error、pending、fetching 等。

相同 key 必须代表相同数据。若 key 漏掉筛选参数，不同列表会错误共享结果；若 key 每次都包含不稳定对象，缓存命中会变差。

## 3. 项目的 key 结构

当前可见模式：

| 数据       | Key 示例              |
| ---------- | --------------------- |
| Issue 列表 | `['issues', query]`   |
| Board      | `['issues', 'board']` |
| 详情       | `['issue', id]`       |
| 成员       | `['members']`         |
| 评论       | `['comments', id]`    |
| 附件       | `['attachments', id]` |

[AppProviders.tsx](../../frontend/src/app/AppProviders.tsx) 还保留一个 `useIssueQueryKey`，当前页面没有统一使用它，key 分散在各 Screen 中。这是适合学习的重构点：建立 query-key factory，并用测试证明失效范围不变。

## 4. Fresh、Stale 与重新获取

全局配置中 `staleTime` 为 30 秒、查询 retry 为 1、窗口聚焦不自动刷新。

“stale”不等于“缓存已删除”：

- fresh：可直接使用且通常不重取；
- stale：仍可先显示，但在触发条件下可后台重取；
- inactive：没有组件订阅；
- garbage collected：超过回收时间后移除。

### 时间实验

先清空 Network：

1. 打开列表后立即离开再返回；
2. 约 20 秒后重复；
3. 超过 30 秒再重复；
4. 比较请求次数、旧数据显示和 loading/fetching 差异。

记录实际观察，不要把配置概念当成必然网络结果；触发机制也会影响是否重取。

## 5. 分页与 Infinite Query

[IssuesPage.tsx](../../frontend/src/screens/IssuesPage.tsx) 同时支持普通分页和 stream 模式：

- `useQuery`：每个 page 是一份完整响应；
- `useInfiniteQuery`：缓存多个 page，并计算下一页参数。

切换视图时 key 必须隔离，防止普通 `PagedResult` 与 InfiniteData 形状混用。分页响应的 `total`、`page`、`pageSize` 是 Contract 的一部分。

## 6. Mutation 的生命周期

写操作常见阶段：

1. `mutationFn` 发送请求；
2. `onMutate` 在请求前运行，可取消查询、保存快照和乐观更新；
3. `onError` 使用快照回滚；
4. `onSuccess` 处理已确认数据；
5. `onSettled` 无论成功失败都可重新失效。

## 7. 乐观更新不是“先改 UI”这么简单

[IssuesPage.tsx](../../frontend/src/screens/IssuesPage.tsx) 的状态更新要考虑：

- 多个 Issues 列表 key；
- Infinite Query 的所有页；
- 单个 Issue 详情 key；
- 请求中已有 refetch；
- 失败后的完整回滚；
- 最终与服务器重新同步。

安全步骤：

```text
cancel → snapshot → optimistic write → request
                             ├─ success → invalidate/refetch
                             └─ error   → rollback → notify → invalidate
```

如果只更新当前表格，不更新详情或 Board，用户会看到同一个 Issue 同时处于两个状态。

## 8. 并发风险

两个快速 mutation 可能都保存“之前的快照”。较早请求后失败时，盲目回滚可能覆盖较晚成功结果。

学习实验：

1. 给状态请求增加可控延迟；
2. 快速发出 A→B 和 B→C；
3. 让第一个最后失败；
4. 观察最终缓存；
5. 评估按 mutation ID、服务端版本或直接失效重取的策略。

课程项目不一定需要复杂并发控制，但必须知道简单快照的边界。

## 9. Error Contract

[issueflowApi.ts](../../frontend/src/api/issueflowApi.ts) 将失败响应归一为 `ApiError`：

- `message` 给页面或 Toast；
- `status` 允许区分 401/404/409；
- `errors` 给表单字段。

页面不应解析每个后端的任意错误字符串。后端应尽量输出 Problem Details，客户端在 API 层统一适配。

## 10. 实验：失败回滚

以 Board 状态更新为例：

1. 在测试中让 PATCH 返回 500；
2. 操作后立即断言卡片临时进入新列；
3. 等待失败；
4. 断言卡片回到原列；
5. 断言错误 Toast 出现；
6. 断言相关 key 被失效；
7. 再到列表和详情确认一致性。

测试不应靠固定等待 1 秒，而应等待可见状态或请求 Promise。

## 11. 重构练习：Key Factory

可以设计：

```ts
const issueKeys = {
  all: ["issues"] as const,
  list: (query: IssueQuery) => [...issueKeys.all, "list", query] as const,
  board: () => [...issueKeys.all, "board"] as const,
  detail: (id: number) => ["issue", id] as const,
};
```

实施前先列出现有 key 与所有 invalidate 调用；实施后运行列表、详情、Board 的集成测试，避免只通过 typecheck 就宣布完成。

## 常见误区

- Cache 是副本，不是数据库。
- Query key 不是随便起的标签，而是数据身份。
- invalidate 不一定立刻删除数据。
- 乐观更新必须有失败策略。
- loading 与 background fetching 应给予不同 UI。

## 本章验收

- [ ] 能为一个新 Endpoint 设计稳定 query key。
- [ ] 能解释 stale 与 cache 删除的差异。
- [ ] 能追踪普通分页与 Infinite Query 的数据形状。
- [ ] 能画出乐观更新与回滚流程。
- [ ] 能写出一次 500 失败的可见行为测试。

[上一章：路由、URL 状态与认证](07-routing-url-and-auth.md) · [下一章：表单、复杂交互与可访问性](09-forms-interactions-and-a11y.md)
