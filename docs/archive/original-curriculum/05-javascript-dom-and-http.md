# 11. Chapter 03：JavaScript 语言基础

本章暂时不要 React。

---

## 11.1 变量

```javascript
const
let
```

原则：

默认：

```javascript
const
```

确实需要重新赋值时：

```javascript
let
```

---

## 11.2 数据类型

学习：

```text
string
number
boolean
null
undefined
object
symbol
bigint
```

---

## 11.3 Object

```javascript
const issue = {
    id: 1,
    title: "Login failed",
    status: "open"
};
```

---

## 11.4 Array

重点：

```javascript
map()
filter()
find()
some()
every()
reduce()
sort()
```

这些方法以后在 React 中大量使用。

---

## Task 3.1：过滤 Issue

```javascript
const result = issues.filter(issue =>
    issue.status === "open"
);
```

---

## Task 3.2：搜索 Issue

要求：

```text
search("login")
```

返回 title 包含 login 的 Issue。

---

## 11.5 Function

学习：

```javascript
function foo() {}

const foo = () => {};
```

理解：

- 参数；
- 返回值；
- Closure；
- Callback。

---

## 11.6 Destructuring

```javascript
const { id, title, status } = issue;
```

---

## 11.7 Spread

```javascript
const newIssue = {
    ...issue,
    status: "closed"
};
```

这是 React State 更新的重要基础。

---

## 11.8 Module

```javascript
export
import
```

例如：

```javascript
export function filterIssues() {}
```

```javascript
import { filterIssues } from "./issues.js";
```

---

## 11.9 Promise / Async Await

理解：

```javascript
Promise
then
catch
finally
async
await
```

---

## Task 3.3：模拟异步函数

```javascript
async function loadIssues() {
    // ...
}
```

练习：

- success；
- error；
- try/catch；
- finally。

---

## 验收

能够解释：

- JavaScript 是动态类型语言是什么意思；
- `null` 和 `undefined`；
- Object 引用；
- `map` 和 `forEach`；
- `map` 和 `filter`；
- Spread 是浅拷贝还是深拷贝；
- Promise 的状态；
- async function 返回什么。

---

## 官方资料

### MDN JavaScript Guide

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide

### JavaScript Reference

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference

### Promise

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises

### JavaScript Modules

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules

---

# 12. Chapter 04：DOM 与浏览器事件

这一章是理解前端的重要分水岭。

---

## 12.1 DOM

理解：

```text
HTML
 ↓ 浏览器解析
DOM Tree
```

例如：

```html
<body>
    <main>
        <button>Create</button>
    </main>
</body>
```

形成类似：

```text
Document
└── html
    └── body
        └── main
            └── button
```

---

## 12.2 查找 DOM

学习：

```javascript
document.querySelector()
document.querySelectorAll()
document.getElementById()
```

---

## 12.3 修改 DOM

```javascript
textContent
classList
setAttribute
append
remove
createElement
```

---

## Task 4.1：动态 Issue Table

禁止：

```javascript
table.innerHTML = hugeString;
```

第一轮要求使用：

```javascript
createElement()
append()
textContent
```

目的是理解 DOM API。

---

## 12.4 Event

学习：

```javascript
addEventListener()
```

事件：

```text
click
input
change
submit
keydown
```

---

## 12.5 Event Object

```javascript
event.target
event.currentTarget
preventDefault()
```

---

## 12.6 Event Bubbling

需要理解：

```text
Capture
Target
Bubble
```

---

## Task 4.2：Issue Search

输入：

```text
login
```

立即过滤 Issue。

---

## Task 4.3：Create Issue Modal

要求：

- 点击 Create 打开；
- 点击 Close 关闭；
- ESC 关闭；
- 点击遮罩关闭；
- Modal 内点击不能错误关闭。

---

## Task 4.4：Delete

点击 Delete。

要求：

```text
确认
 ↓
删除 DOM
 ↓
显示反馈
```

---

## 验收

能够解释：

- DOM 是什么；
- DOM Node 和 HTML String 区别；
- Event Bubbling；
- `target` 和 `currentTarget`；
- 为什么需要 `preventDefault()`；
- Event Delegation 是什么。

---

## 官方资料

### DOM

https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model

### Document

https://developer.mozilla.org/en-US/docs/Web/API/Document

### Event

https://developer.mozilla.org/en-US/docs/Web/API/Event

### EventTarget.addEventListener

https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener

### Event Bubbling

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling

---

# 13. Chapter 05：HTTP、Fetch 与浏览器数据

这一阶段才正式连接后端。

---

## 13.1 推荐后端策略

后端只提供简单稳定 API。

例如：

```http
GET /api/issues

GET /api/issues/{id}

POST /api/issues

PATCH /api/issues/{id}

DELETE /api/issues/{id}
```

然后：

> 冻结后端。

不要继续花时间优化后端架构。

---

## 13.2 Query

```http
GET /api/issues?page=1
                &pageSize=20
                &status=open
                &priority=high
                &search=login
                &sort=createdAt
```

---

## 13.3 Response

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 235
}
```

---

## 13.4 Fetch

```javascript
const response = await fetch("/api/issues");

if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
}

const data = await response.json();
```

重点：

> Fetch 在收到 HTTP 404/500 时并不会自动因为 HTTP Status 而 reject Promise。

因此必须检查：

```javascript
response.ok
```

---

## 13.5 UI State

每个 API 页面必须有：

```text
Idle
Loading
Success
Empty
Error
```

例如：

```text
          ┌── Success + Data
Loading ──┤
          ├── Success + Empty
          │
          └── Error
```

---

## Task 5.1：Issue List API

实现：

```text
Loading
 ↓
GET /api/issues
 ↓
Success / Error
```

---

## Task 5.2：Pagination

分页状态进入 URL：

```text
/issues?page=3
```

而不是只存在某个 JavaScript 变量中。

---

## Task 5.3：Filter

```text
/issues?status=open&priority=high
```

---

## 13.6 URLSearchParams

学习：

```javascript
new URLSearchParams()
```

---

## 13.7 LocalStorage

学习：

```javascript
localStorage.setItem()
localStorage.getItem()
localStorage.removeItem()
```

可用于：

```text
Theme
简单 UI Preference
```

不要随便把敏感 Token 放入 LocalStorage。

---

## 13.8 Cookie

至少理解：

```text
Cookie
HttpOnly
Secure
SameSite
```

即使后端已经熟悉 Cookie，也需要从浏览器视角重新理解。

---

## 13.9 CORS

需要理解：

```text
Origin

http://localhost:5173
和
http://localhost:5000

是不同 Origin
```

---

## DevTools 任务

在 Network 面板观察：

```text
Request URL
Method
Headers
Payload
Response
Status
Timing
```

---

## 官方资料

### Fetch API

https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

### Using Fetch

https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

### URLSearchParams

https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams

### Web Storage API

https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API

### Cookies

https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies

### CORS

https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

---

