# 17. Chapter 09：React Router

本章开始建立真正 SPA。

---

## 17.1 路由

实现：

```text
/login

/dashboard

/issues

/issues/new

/issues/:id

/issues/:id/edit

/board

/settings
```

---

## 17.2 重点

学习：

```text
BrowserRouter
Routes
Route
Link
NavLink
Outlet
useParams
useNavigate
```

---

## 17.3 Nested Route

例如：

```text
/settings/profile
/settings/account
/settings/appearance
```

---

## 17.4 URL State

Filter：

```text
/issues?page=2&status=open
```

应该可以：

- 刷新后保留；
- 分享 URL；
- 前进后退正常工作。

这就是为什么很多“页面状态”应该进入 URL。

---

## Task 9.1：Issue Detail Route

```text
/issues/:id
```

使用 route param 加载 Issue。

---

## Task 9.2：Search Params

实现：

```text
/issues?page=3&status=open&priority=high
```

---

## 验收

能够回答：

- Server Routing；
- Client Routing；
- SPA；
- History API；
- URL Param；
- Query Param；
- 为什么 URL 可以成为 State。

---

## 官方资料

### React Router

https://reactrouter.com/

### Declarative Routing

https://reactrouter.com/start/declarative/routing

### BrowserRouter

https://reactrouter.com/api/declarative-routers/BrowserRouter

---

# 18. Chapter 10：Server State 与 TanStack Query

先保留之前的：

```tsx
useState
+
useEffect
+
fetch
```

实现。

然后才加入 TanStack Query。

这样才能真正理解库的意义。

---

## 18.1 Server State 的特点

Server State：

```text
不属于浏览器
可能过期
可以被其他用户修改
需要重新获取
需要缓存
可能需要重试
```

因此：

```text
Server State != 普通 UI State
```

---

## 18.2 Query

```tsx
useQuery()
```

概念：

```text
queryKey
queryFn
isPending
error
data
```

---

## 18.3 Mutation

```tsx
useMutation()
```

用于：

```text
Create
Update
Delete
```

---

## 18.4 Invalidation

例如：

```text
Create Issue
     ↓
POST /issues
     ↓
Success
     ↓
invalidate issues query
     ↓
refetch
```

---

## 18.5 Cache

理解：

```text
fresh
stale
cache
refetch
```

---

## 18.6 Optimistic Update

例如：

```text
点击 Status
 ↓
UI 先变
 ↓
发送 API
 ↓
Success
```

如果失败：

```text
rollback
```

---

## Task 10.1：Issue List Query

将手工：

```text
loading
error
data
```

改为 Query。

---

## Task 10.2：Create Mutation

创建成功后：

```text
invalidateQueries
```

---

## Task 10.3：Delete Mutation

要求：

- Disable Button；
- Loading；
- Error；
- Success Feedback。

---

## Task 10.4：Optimistic Status

实现状态快速切换。

---

## 验收

能够回答：

- Client State 和 Server State；
- Query Key；
- Cache；
- Stale；
- Refetch；
- Mutation；
- Invalidation；
- Optimistic Update。

---

## 官方资料

### TanStack Query React

https://tanstack.com/query/latest/docs/framework/react

### Overview

https://tanstack.com/query/latest/docs/framework/react/overview

### Quick Start

https://tanstack.com/query/latest/docs/framework/react/quick-start

### Query

https://tanstack.com/query/latest/docs/framework/react/guides/queries

### Mutation

https://tanstack.com/query/latest/docs/framework/react/guides/mutations

### Query Invalidation

https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation

---

# 19. Chapter 11：表单、可访问性与交互

表单是企业前端中非常重要的一部分。

---

## 19.1 第一阶段：手写 Controlled Form

先不要 React Hook Form。

```tsx
const [title, setTitle] = useState("");
```

---

## 19.2 Validation

需要区分：

```text
HTML Validation
Client Validation
Server Validation
```

---

## Create Issue

字段：

```text
Title
Description
Status
Priority
Assignee
Tags
Due Date
```

---

## Validation

例如：

```text
Title Required
Title <= 100
Description <= 5000
DueDate >= Today
```

---

## 19.3 Server Error

后端返回：

```json
{
  "errors": {
    "title": [
      "Title already exists"
    ]
  }
}
```

前端需要显示到具体字段。

---

## 19.4 Submit State

至少：

```text
Idle
Submitting
Success
Error
```

提交中：

```text
Disable Submit
防止重复提交
```

---

## 19.5 Accessibility

至少掌握：

```text
semantic HTML
label
keyboard
focus
aria
contrast
```

注意：

> ARIA 不是替代正确 HTML 的工具。

能用原生 HTML 时优先原生 HTML。

---

## Task 11.1：全键盘操作

IssueFlow 的主要页面不使用鼠标也能完成：

```text
Tab
Shift + Tab
Enter
Escape
```

---

## Task 11.2：Modal Focus

Modal 打开时：

- 焦点进入 Modal；
- ESC 关闭；
- 关闭后焦点回到触发 Button。

---

## 可选：再引入 Form Library

当手写表单变得明显复杂后，再学习：

```text
React Hook Form
```

官方：

https://react-hook-form.com/

---

## 官方资料

### MDN Forms

https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms

### Constraint Validation

https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation

### Accessibility

https://developer.mozilla.org/en-US/docs/Web/Accessibility

### WAI

https://www.w3.org/WAI/

### ARIA Authoring Practices Guide

https://www.w3.org/WAI/ARIA/apg/

---

# 20. Chapter 12：响应式设计

不要把响应式理解为：

```text
手机宽度时把所有东西缩小
```

真正目标是：

> 同一信息在不同屏幕上采用不同布局。

---

## 20.1 Desktop

```text
Sidebar
+
Table
```

---

## 20.2 Tablet

```text
Collapsed Sidebar
+
Table
```

---

## 20.3 Mobile

Table 可能改成：

```text
Issue Card
Issue Card
Issue Card
```

---

## 20.4 Mobile First

建议学习：

```css
/* mobile */

@media (min-width: 768px) {
    /* tablet */
}

@media (min-width: 1024px) {
    /* desktop */
}
```

不要机械依赖某几个固定设备宽度。

根据：

> 内容什么时候开始不好看？

决定 breakpoint。

---

## Task 12.1：Issue List Responsive

Desktop：

```text
Table
```

Mobile：

```text
Card List
```

---

## Task 12.2：Sidebar

Desktop：

```text
Always visible
```

Mobile：

```text
Drawer
```

---

## 验收

能够回答：

- Responsive Design；
- Mobile First；
- Media Query；
- Breakpoint；
- Flex/Grid 在响应式中的作用；
- 为什么不应该针对每一款手机写 CSS。

---

## 官方资料

### MDN Responsive Design

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design

### Media Queries

https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries

---

