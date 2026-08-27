# 前端学习项目：后端工程师向前端开发转型路线（详细版）

> 项目名称：**IssueFlow**
>
> 项目形式：使用同一个 Issue Tracker 项目，从原生 HTML/CSS/JavaScript 开始，逐步重构为 TypeScript + React + React Router + TanStack Query，并最终加入测试、工程化、性能与部署。
>
> 适用对象：已有后端开发经验，但没有系统学习过前端开发的人。

---

# 目录

1. [项目目标](#1-项目目标)
2. [学习者画像与已有能力映射](#2-学习者画像与已有能力映射)
3. [为什么使用“同一项目连续重构”](#3-为什么使用同一项目连续重构)
4. [资料使用原则](#4-资料使用原则)
5. [开发环境](#5-开发环境)
6. [IssueFlow 最终需求](#6-issueflow-最终需求)
7. [整体学习路线](#7-整体学习路线)
8. [后端配套轨道：.NET 10 IssueFlow API](#b-后端配套轨道net-10-issueflow-api)
8. [Chapter 00：浏览器与 Web 基础](#8-chapter-00浏览器与-web-基础)
9. [Chapter 01：HTML](#9-chapter-01html)
10. [Chapter 02：CSS 基础与布局](#10-chapter-02css-基础与布局)
11. [Chapter 03：JavaScript 语言基础](#11-chapter-03javascript-语言基础)
12. [Chapter 04：DOM 与浏览器事件](#12-chapter-04dom-与浏览器事件)
13. [Chapter 05：HTTP、Fetch 与浏览器数据](#13-chapter-05httpfetch-与浏览器数据)
14. [Chapter 06：TypeScript](#14-chapter-06typescript)
15. [Chapter 07：React 基础](#15-chapter-07react-基础)
16. [Chapter 08：React 状态设计](#16-chapter-08react-状态设计)
17. [Chapter 09：React Router](#17-chapter-09react-router)
18. [Chapter 10：Server State 与 TanStack Query](#18-chapter-10server-state-与-tanstack-query)
19. [Chapter 11：表单、可访问性与交互](#19-chapter-11表单可访问性与交互)
20. [Chapter 12：响应式设计](#20-chapter-12响应式设计)
21. [Chapter 13：测试](#21-chapter-13测试)
22. [Chapter 14：工程化与部署](#22-chapter-14工程化与部署)
23. [Chapter 15：进阶功能](#23-chapter-15进阶功能)
24. [推荐项目目录结构](#24-推荐项目目录结构)
25. [推荐 16 周学习计划](#25-推荐-16-周学习计划)
26. [每个 Task 的标准模板](#26-每个-task-的标准模板)
27. [禁止技术表](#27-禁止技术表)
28. [最终验收标准](#28-最终验收标准)
29. [官方资料总表](#29-官方资料总表)

---

# 1. 项目目标

本项目不是一个“React 教程”，也不是一个“前端框架速成项目”。

最终目标是让一个已经有后端经验的人建立完整的前端思维：

```text
浏览器
  ↓
HTML
  ↓
DOM
  ↓
CSS Layout
  ↓
JavaScript
  ↓
Browser API
  ↓
HTTP / Fetch
  ↓
TypeScript
  ↓
Component
  ↓
React
  ↓
State
  ↓
Routing
  ↓
Server State
  ↓
Form
  ↓
Responsive
  ↓
Testing
  ↓
Build / CI / Deploy
```

完成后应该能够独立开发一个中等规模的 SPA 前端项目，并且知道：

- 为什么这样写；
- 浏览器发生了什么；
- React 帮自己解决了什么；
- 某个第三方库为什么有必要；
- 什么问题应该由浏览器解决；
- 什么问题应该由 React 解决；
- 什么问题应该由后端解决。

---

# 2. 学习者画像与已有能力映射

有后端经验的人并不是从零开始。

例如已经熟悉：

| 后端经验 | 前端对应知识 |
|---|---|
| HTTP | Fetch / Browser Request |
| REST API | API Client |
| DTO | TypeScript Interface |
| Entity | UI Model |
| Controller | Event Handler |
| Service | Hooks / API Layer |
| Dependency Injection | Component Dependency / Context |
| Server State | Server State / Query Cache |
| Request 生命周期 | UI Render 生命周期 |
| 后端 Routing | SPA Routing |
| Validation | Form Validation |
| Authentication | Token / Cookie / Session |
| Logging | DevTools / Console |
| Integration Test | Component / E2E Test |
| Async / Await | Browser Async Programming |

因此不需要重新学习“什么是变量”“什么是函数”。

真正需要补齐的是：

```text
浏览器模型
DOM
CSS
事件模型
前端状态
UI Rendering
Component
Responsive Design
Accessibility
Browser Storage
前端构建工具
前端测试
```

---

# 3. 为什么使用“同一项目连续重构”

不推荐下面这种学习方式：

```text
HTML → 做个人主页

CSS → 做 Landing Page

JavaScript → 做计算器

TypeScript → 做 Todo

React → 再做一个 Todo

Router → 做博客

Query → 再做一个后台系统
```

问题在于：

- 每次都要重新理解业务；
- 知识之间联系弱；
- 不容易感受到框架解决了什么问题；
- 最后容易变成“学过很多教程，但不会独立开发”。

本项目采用：

```text
IssueFlow HTML
      ↓
IssueFlow CSS
      ↓
IssueFlow JavaScript
      ↓
IssueFlow + REST API
      ↓
IssueFlow TypeScript
      ↓
IssueFlow React
      ↓
IssueFlow Router
      ↓
IssueFlow TanStack Query
      ↓
IssueFlow Testing
      ↓
IssueFlow Production
```

学习重点始终是：

> 新技术到底解决了上一阶段的什么问题？

---

# 4. 资料使用原则

本项目优先使用官方资料，不把视频教程或博客作为主要知识来源。

资料分为三级：

## A：必读

真正需要从头阅读、做练习的文档。

例如：

- MDN Learn Web Development
- TypeScript Handbook
- React Learn

## B：开发时查阅

不需要全部背下来，需要知道“它在哪里”。

例如：

- HTML Element Reference
- CSS Property Reference
- React API Reference
- Web API Reference

## C：深入参考

了解即可。

例如：

- WHATWG HTML Living Standard
- ECMAScript Specification
- WCAG Specification

学习方法应该是：

```text
先读 A
 ↓
做任务
 ↓
遇到问题查 B
 ↓
真正需要研究规范时再看 C
```

不要尝试把所有官方手册从头到尾背下来。

---

# 5. 开发环境

建议准备：

```text
VS Code

Chrome 或 Edge

Node.js

npm / pnpm

Git

GitHub
```

浏览器开发者工具必须贯穿整个项目。

---

## 推荐 VS Code 扩展

最开始只需要：

```text
ESLint
Prettier
```

React 阶段再根据需要添加其他扩展。

不要在一开始安装大量“自动生成代码”的插件。

---

## 官方资料

### Node.js

https://nodejs.org/

### npm

https://docs.npmjs.com/

### Git

https://git-scm.com/doc

### Chrome DevTools

https://developer.chrome.com/docs/devtools/

---

# 6. IssueFlow 最终需求

IssueFlow 是一个简化版 Jira / GitHub Issues。

---

## 6.1 核心实体

```typescript
Issue
```

字段：

```text
id
title
description
status
priority
assignee
tags
dueDate
createdAt
updatedAt
```

---

## 6.2 Issue Status

```text
Open
In Progress
Resolved
Closed
```

---

## 6.3 Priority

```text
Low
Medium
High
Critical
```

---

## 6.4 页面

最终至少包含：

```text
/login

/dashboard

/issues

/issues/new

/issues/:id

/issues/:id/edit

/board

/users

/settings
```

---

## 6.5 功能

### Issue

- 创建
- 查看
- 修改
- 删除
- 搜索
- 过滤
- 排序
- 分页

### UI

- Sidebar
- Header
- Table
- Card
- Modal
- Dropdown
- Toast
- Loading
- Skeleton
- Empty State
- Error State

### 高级

- Dark Mode
- Kanban
- Drag & Drop
- Infinite Scroll
- Optimistic Update
- File Upload
- Comments

---

# 7. 整体学习路线

```text
Chapter 00
Web / Browser 基础
       │
       ▼
Chapter 01
HTML
       │
       ▼
Chapter 02
CSS
       │
       ▼
Chapter 03
JavaScript
       │
       ▼
Chapter 04
DOM / Event
       │
       ▼
Chapter 05
HTTP / Fetch
       │
       ▼
Chapter 06
TypeScript
       │
       ▼
Chapter 07
React
       │
       ▼
Chapter 08
React State
       │
       ▼
Chapter 09
React Router
       │
       ▼
Chapter 10
TanStack Query
       │
       ▼
Chapter 11
Form / Accessibility
       │
       ▼
Chapter 12
Responsive
       │
       ▼
Chapter 13
Testing
       │
       ▼
Chapter 14
Engineering / Deploy
       │
       ▼
Chapter 15
Advanced
```

---


