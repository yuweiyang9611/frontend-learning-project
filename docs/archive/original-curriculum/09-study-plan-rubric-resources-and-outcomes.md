# 25. 推荐 16 周学习计划

假设：

```text
每周 10～15 小时
```

已有后端经验。

---

## Week 1

```text
Browser
HTTP
DevTools
HTML
```

输出：

```text
静态 Login / Issue List / Detail
```

---

## Week 2～3

```text
CSS
Box Model
Flexbox
Grid
```

输出：

```text
Desktop 后台界面
```

---

## Week 4～5

```text
JavaScript
Array
Object
Function
Module
Promise
```

输出：

```text
纯 JS IssueFlow
```

---

## Week 6

```text
DOM
Events
Modal
Search
Filter
```

---

## Week 7

```text
Fetch
HTTP
CORS
URL
Storage
```

输出：

```text
前后端连接
```

---

## Week 8

```text
TypeScript
Vite
```

输出：

```text
Vanilla TS IssueFlow
```

---

## Week 9～10

```text
React
Component
Props
State
Event
```

输出：

```text
React IssueFlow
```

---

## Week 11

```text
State Design
Effect
Router
```

---

## Week 12

```text
TanStack Query
```

---

## Week 13

```text
Form
Validation
Accessibility
```

---

## Week 14

```text
Responsive
Mobile
```

---

## Week 15

```text
Vitest
Testing Library
Playwright
```

---

## Week 16

```text
ESLint
Prettier
CI
Build
Deploy
```

---

# 26. 每个 Task 的标准模板

每个练习任务都应该使用固定格式。

---

## Task X.Y：任务名称

### 背景

说明：

```text
为什么现在需要这个功能。
```

### 学习目标

例如：

```text
理解 Flexbox 的主轴与交叉轴。
```

### 需求

例如：

```text
使用 Flexbox 创建 Sidebar + Content。
```

### 技术限制

例如：

```text
禁止 Grid。
禁止 Bootstrap。
禁止 Tailwind。
```

### 验收标准

例如：

```text
Sidebar 宽度 240px。

Content 自动占据剩余宽度。

窗口缩小时不能产生水平溢出。
```

### DevTools 检查

例如：

```text
使用 Elements 查看 Sidebar Computed Width。
```

### 思考题

例如：

```text
flex: 1 到底是什么意思？

为什么 Content 可能需要 min-width: 0？

如果把 Sidebar 改成 position: fixed 会发生什么？
```

### 官方资料

放 1～3 个本 Task 真正需要阅读的官方链接。

---

# 27. 禁止技术表

为了避免框架提前隐藏底层知识：

| 阶段 | 禁止 |
|---|---|
| HTML | JS Framework、UI Library |
| CSS | Tailwind、Bootstrap、Ant Design |
| JavaScript | React、Vue、jQuery |
| DOM | React |
| API | Axios（先学习 fetch） |
| TypeScript | React、大量 `any` |
| React 基础 | Redux、Zustand、TanStack Query |
| State | Redux First |
| Query | 用 Global Store 替代所有 Server State |
| Form 初级 | Form Library |
| Testing | 只写 Snapshot |
| Final | 无硬性限制 |

---

# 28. 最终验收标准

完成项目后，应当能够独立解释以下问题。

---

## Browser

```text
浏览器拿到 HTML 后大概发生什么？
DOM 是什么？
HTTP Request 在哪里观察？
Cookie 和 LocalStorage 区别？
CORS 为什么发生？
```

---

## HTML

```text
Semantic HTML 是什么？
为什么 form 要使用 label？
button 默认类型有什么影响？
```

---

## CSS

```text
Box Model 是什么？
Flex 和 Grid 有什么区别？
position absolute 相对于谁定位？
Responsive Design 如何实现？
```

---

## JavaScript

```text
Closure 是什么？
Promise 是什么？
async/await 如何工作？
map/filter/reduce 区别？
```

---

## DOM

```text
DOM Node 是什么？
Event Bubbling 是什么？
target 与 currentTarget 区别？
```

---

## TypeScript

```text
TS 和 JS 关系？
unknown 与 any？
Union？
Narrowing？
Generic？
Discriminated Union？
```

---

## React

```text
Component？
Props？
State？
Render？
为什么不能直接修改 State？
key 有什么作用？
Effect 什么时候需要？
Effect 什么时候不应该使用？
```

---

## Architecture

```text
Local State
Server State
URL State
Form State
Global State
```

分别应该放在哪里？

---

## Query

```text
Query Key？
Cache？
Stale？
Invalidation？
Mutation？
Optimistic Update？
```

---

## Testing

```text
Unit Test？
Component Test？
Integration Test？
E2E？
```

---

## Production

```text
Vite build 做什么？
dist 是什么？
ESLint 和 Prettier 区别？
前端环境变量为什么不能存 Secret？
CI 应该执行哪些检查？
```

---

# 29. 官方资料总表

以下资料建议加入浏览器书签。

---

## Web 基础

### MDN Learn Web Development

**优先级：A**

https://developer.mozilla.org/en-US/docs/Learn_web_development

适合：

```text
HTML
CSS
JavaScript
Responsive
Forms
Accessibility
```

---

## HTML

### MDN HTML

**优先级：A/B**

https://developer.mozilla.org/en-US/docs/Web/HTML

中文：

https://developer.mozilla.org/zh-CN/docs/Web/HTML

### WHATWG HTML Living Standard

**优先级：C**

https://html.spec.whatwg.org/

---

## CSS

### MDN CSS

**优先级：A/B**

https://developer.mozilla.org/en-US/docs/Web/CSS

### CSS Layout

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout

### Flexbox

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox

### Grid

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids

### Responsive Design

https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design

---

## JavaScript

### MDN JavaScript Guide

**优先级：A**

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide

### JavaScript Reference

**优先级：B**

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference

### Promise

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises

---

## DOM / Web API

### DOM

https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model

### Fetch

https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

### Web APIs

https://developer.mozilla.org/en-US/docs/Web/API

---

## TypeScript

### TypeScript Handbook

**优先级：A**

https://www.typescriptlang.org/docs/handbook/intro.html

### 中文文档

https://www.typescriptlang.org/zh/docs/handbook/

### TypeScript for Java/C# Programmers

**有 C#/Java 经验的人优先阅读**

https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html

---

## Vite

### Vite Guide

**优先级：A/B**

https://vite.dev/guide/

重点：

```text
Getting Started
Features
Static Asset Handling
Environment Variables
Build
```

---

## React

### React Learn

**优先级：A**

https://react.dev/learn

中文：

https://zh-hans.react.dev/learn

### React API Reference

**优先级：B**

https://react.dev/reference/react

推荐重点：

```text
Thinking in React
State
Sharing State
Managing State
Effects
You Might Not Need an Effect
```

---

## React Router

### Official Documentation

**优先级：A/B**

https://reactrouter.com/

### Routing

https://reactrouter.com/start/declarative/routing

---

## TanStack Query

### React Query Documentation

**优先级：A/B**

https://tanstack.com/query/latest/docs/framework/react

重点：

```text
Overview
Quick Start
Queries
Mutations
Query Keys
Invalidation
Caching
Optimistic Updates
```

---

## Forms

### MDN Forms

https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms

### React Hook Form

进阶阶段：

https://react-hook-form.com/

---

## Accessibility

### MDN Accessibility

https://developer.mozilla.org/en-US/docs/Web/Accessibility

### W3C WAI

https://www.w3.org/WAI/

### ARIA Authoring Practices

https://www.w3.org/WAI/ARIA/apg/

---

## Chrome DevTools

### Chrome DevTools

**优先级：A**

https://developer.chrome.com/docs/devtools/

尤其要学习：

```text
Elements
Console
Network
Application
Performance
```

---

## Testing

### Vitest

https://vitest.dev/guide/

### React Testing Library

https://testing-library.com/docs/react-testing-library/intro/

### Playwright

https://playwright.dev/docs/intro

---

## Code Quality

### ESLint

https://eslint.org/docs/latest/use/getting-started

### Prettier

https://prettier.io/docs/

---

## CI

### GitHub Actions

https://docs.github.com/en/actions

---

## Docker

### Docker Get Started

https://docs.docker.com/get-started/

---

# 30. 推荐官方资料阅读顺序

不要按工具数量同时学习。

推荐：

```text
1. MDN Learn Web Development
      ↓
2. MDN HTML
      ↓
3. MDN CSS Layout
      ↓
4. MDN JavaScript Guide
      ↓
5. DOM / Event / Fetch
      ↓
6. TypeScript Handbook
      ↓
7. Vite Guide
      ↓
8. React Learn
      ↓
9. React Router
      ↓
10. TanStack Query
      ↓
11. Testing Library / Vitest
      ↓
12. Playwright
```

其中最核心的四套资料是：

```text
MDN
TypeScript Handbook
React Learn
Chrome DevTools Documentation
```

第三方中文教程可以作为辅助，但建议：

> 遇到 API、语义、行为、版本差异问题时，优先回到官方文档确认。

---

# 31. 最终项目成果

最终 Git 仓库建议能够展示完整演进过程：

```text
tag/html-static

tag/css-layout

tag/vanilla-js

tag/rest-api

tag/typescript

tag/react-basic

tag/react-router

tag/tanstack-query

tag/testing

tag/production
```

也可以使用 branch。

推荐使用 Git Tag，因为更适合展示课程阶段。

最终 README 应包含：

```text
项目简介

技术栈

项目截图

功能

架构

安装

运行

测试

Build

学习阶段

技术决策说明
```

---

# 32. 项目真正完成的判断标准

不是：

```text
页面看起来像 Jira
```

也不是：

```text
用了 React
```

而是学习者可以独立面对一个新的前端需求，例如：

> “做一个客户管理系统的客户列表、筛选、详情和编辑页面。”

然后能够自己完成：

```text
分析 UI
 ↓
设计 HTML
 ↓
选择 CSS Layout
 ↓
拆 Component
 ↓
定义 Type
 ↓
设计 State
 ↓
设计 URL
 ↓
调用 API
 ↓
处理 Loading/Error/Empty
 ↓
处理 Form
 ↓
处理 Responsive
 ↓
补测试
 ↓
Build
```

这时才可以认为：

> 已经从“有后端经验但不会前端”进入“可以独立进行现代前端开发”的阶段。
