# 8. Chapter 00：浏览器与 Web 基础

## 目标

在写页面之前先回答：

```text
浏览器到底是什么？
URL 是什么？
HTTP 请求什么时候发生？
HTML 从哪里来？
CSS 怎么被加载？
JavaScript 在哪里运行？
DOM 是什么？
```

---

## 必须理解

### URL

```text
https://example.com/issues?page=2
│      │           │       │
scheme host        path    query
```

### 浏览器访问网站的大概流程

```text
输入 URL
   ↓
DNS
   ↓
建立连接
   ↓
HTTP Request
   ↓
HTTP Response
   ↓
HTML
   ↓
解析 HTML
   ↓
DOM
   ↓
加载 CSS / JS / Image
   ↓
Layout
   ↓
Paint
```

这一阶段不要求深入浏览器引擎内部。

只需要建立整体模型。

---

## Task 0.1：使用 DevTools 查看网站

打开任意网站。

观察：

```text
Elements
Network
Console
Application
```

要求找到：

- HTML；
- CSS；
- JavaScript 文件；
- 图片请求；
- HTTP Status；
- Response Headers。

---

## Task 0.2：观察一次 HTTP 请求

在 Network 中记录：

```text
Request URL
Request Method
Status Code
Content-Type
Response
Timing
```

---

## 官方资料

### MDN：Web 开发学习入口

https://developer.mozilla.org/en-US/docs/Learn_web_development

### MDN：HTTP

https://developer.mozilla.org/en-US/docs/Web/HTTP

### Chrome DevTools

https://developer.chrome.com/docs/devtools/

### Network 面板

https://developer.chrome.com/docs/devtools/network/

---

# 9. Chapter 01：HTML

## 阶段目标

不写 JavaScript。

不追求漂亮。

只做：

> 正确的页面结构。

---

## 9.1 必须掌握

### 文档结构

```html
<!doctype html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">
    <title>IssueFlow</title>
</head>
<body>
</body>
</html>
```

---

## 9.2 Semantic HTML

需要理解：

```html
<header>
<nav>
<main>
<section>
<article>
<aside>
<footer>
```

问题不是：

> 能不能全部用 div？

而是：

> 为什么不应该全部使用 div？

---

## 9.3 表单

必须练习：

```html
<form>
<label>
<input>
<textarea>
<select>
<option>
<button>
```

并理解：

```text
name
value
type
required
disabled
placeholder
autocomplete
```

---

## 9.4 Table

Issue List 使用：

```html
<table>
<thead>
<tbody>
<tr>
<th>
<td>
```

不要一开始用大量 `div` 模拟 table。

---

## Task 1.1：Login Page

制作：

```text
Email
Password
Login
```

验收：

- `label` 与 `input` 正确关联；
- Password 使用正确 input type；
- 使用 form；
- Button 类型正确。

---

## Task 1.2：Issue List

制作静态列表：

```text
ID
Title
Status
Priority
Assignee
Created At
```

至少 10 条假数据。

---

## Task 1.3：Issue Detail

制作：

```text
Title
Status
Priority
Description
Assignee
Created Time
Updated Time
```

---

## Task 1.4：Create Issue

创建静态表单。

---

## 本章禁止

```text
React
Vue
Bootstrap
Tailwind
Ant Design
Material UI
JavaScript
```

---

## 验收

能够解释：

- HTML 是什么；
- DOM 和 HTML 是否完全相同；
- `div` 和 `section` 的区别；
- 为什么 form 需要 label；
- button 默认行为；
- `GET` form 与 `POST` form 的区别。

---

## 官方资料

### MDN HTML

https://developer.mozilla.org/en-US/docs/Web/HTML

中文：

https://developer.mozilla.org/zh-CN/docs/Web/HTML

### MDN：Structuring content with HTML

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content

### HTML Element Reference

https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements

### HTML Forms

https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms

### WHATWG HTML Living Standard

深入参考：

https://html.spec.whatwg.org/

---

# 10. Chapter 02：CSS 基础与布局

CSS 是后端开发者最容易低估的部分之一。

本章不要跳过。

---

## 10.1 Cascade

理解：

```text
Cascade
Specificity
Inheritance
```

---

## 10.2 Box Model

必须能解释：

```text
content
padding
border
margin
```

并理解：

```css
box-sizing: border-box;
```

---

## 10.3 Display

学习：

```css
display: block;
display: inline;
display: inline-block;
display: flex;
display: grid;
display: none;
```

---

## 10.4 Position

学习：

```text
static
relative
absolute
fixed
sticky
```

重点理解 containing block。

---

## 10.5 Flexbox

Flexbox 主要用于一维布局。

需要掌握：

```css
display: flex;

flex-direction
justify-content
align-items
gap

flex-grow
flex-shrink
flex-basis

flex-wrap
```

---

## Task 2.1：Header

使用 Flexbox：

```text
IssueFlow                     Avatar
```

---

## Task 2.2：Sidebar

制作：

```text
Dashboard
Issues
Board
Users
Settings
```

---

## 10.6 Grid

Grid 适合二维布局。

学习：

```css
display: grid;

grid-template-columns
grid-template-rows
gap
grid-column
grid-row
```

---

## Task 2.3：整体后台布局

```text
┌───────────────────────────────────┐
│ Header                            │
├──────────┬────────────────────────┤
│ Sidebar  │ Main                   │
│          │                        │
│          │                        │
└──────────┴────────────────────────┘
```

可以尝试：

```css
grid-template-columns: 240px 1fr;
```

---

## 10.7 CSS Variables

```css
:root {
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
}
```

先理解 CSS Variables。

不要急着引入 Design System。

---

## Task 2.4：建立最小 Design Tokens

定义：

```text
spacing
font size
border radius
shadow
```

---

## 本章禁止

```text
Bootstrap
Tailwind
Ant Design
Material UI
CSS-in-JS
```

---

## 验收

能够回答：

- 为什么元素会溢出？
- width: 100% 为什么有时超过父容器？
- Flex 主轴是什么？
- `justify-content` 和 `align-items` 有什么不同？
- Flex 和 Grid 什么时候使用？
- `position: absolute` 相对于谁定位？
- 为什么设置 `min-width: 0` 有时能解决 Flex 溢出？

---

## 官方资料

### MDN CSS

https://developer.mozilla.org/en-US/docs/Web/CSS

### CSS Layout

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout

### Flexbox

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox

### Grid

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids

### Responsive Design

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design

### CSS Reference

https://developer.mozilla.org/en-US/docs/Web/CSS/Reference

---

