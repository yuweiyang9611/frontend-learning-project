# 21. Chapter 13：测试

测试分层学习。

不要一开始追求 100% Coverage。

---

# 21.1 Unit Test

工具：

```text
Vitest
```

适合：

```text
formatter
validator
utility
pure function
```

例如：

```typescript
formatPriority()

validateIssue()

buildIssueQuery()
```

---

## Task 13.1

测试：

```typescript
buildIssueQuery({
    page: 2,
    status: "open"
});
```

得到：

```text
?page=2&status=open
```

---

# 21.2 Component Test

工具：

```text
React Testing Library
```

原则：

> 尽量从用户如何使用页面的角度测试，而不是测试组件内部实现细节。

重点学习：

```text
getByRole
getByLabelText
getByText
findBy...
userEvent
```

---

## Task 13.2：IssueForm

测试：

```text
用户没有输入 Title
 ↓
点击 Submit
 ↓
显示错误
```

---

# 21.3 Integration Test

例如：

```text
Search Input
 ↓
输入 login
 ↓
Issue List 更新
```

---

# 21.4 E2E

工具：

```text
Playwright
```

测试：

```text
Login
 ↓
Issue List
 ↓
Create Issue
 ↓
Edit Issue
 ↓
Delete Issue
```

---

## Task 13.3：完整 Create Issue

Playwright：

```text
打开 /issues
点击 Create
填写表单
提交
检查新 Issue 出现在列表
```

---

## 验收

能够解释：

- Unit Test；
- Integration Test；
- Component Test；
- E2E；
- Mock；
- 为什么不要测试实现细节。

---

## 官方资料

### Vitest

https://vitest.dev/guide/

### Writing Tests

https://vitest.dev/guide/learn/writing-tests

### React Testing Library

https://testing-library.com/docs/react-testing-library/intro/

### Testing Library Queries

https://testing-library.com/docs/queries/about/

### User Event

https://testing-library.com/docs/user-event/intro/

### Playwright

https://playwright.dev/docs/intro

### Playwright Best Practices

https://playwright.dev/docs/best-practices

---

# 22. Chapter 14：工程化与部署

---

## 22.1 Vite

理解：

```text
Development Server
HMR
Build
Preview
```

命令：

```bash
npm run dev

npm run build

npm run preview
```

---

## 22.2 ESLint

目标：

```text
发现潜在错误
统一代码规则
```

不是：

```text
单纯格式化代码
```

---

## 22.3 Prettier

目标：

```text
自动统一代码格式
```

因此：

```text
ESLint ≠ Prettier
```

---

## 22.4 Environment Variables

理解：

```text
Development
Test
Production
```

以及：

```text
前端环境变量最终可能进入客户端 Bundle
```

因此：

> 不要把真正的 Secret 放进前端环境变量。

---

## 22.5 Production Build

至少观察：

```text
dist/
```

里面有什么。

理解：

```text
source
 ↓
build
 ↓
static assets
```

---

## 22.6 CI

GitHub Actions：

```text
push
 ↓
install
 ↓
lint
 ↓
test
 ↓
build
```

---

## 示例流程

```yaml
checkout
  ↓
setup node
  ↓
npm ci
  ↓
npm run lint
  ↓
npm test
  ↓
npm run build
```

---

## 22.7 Docker

Docker 不是前端学习重点。

放在最后。

理解：

```text
Build React
 ↓
dist
 ↓
Nginx / Static Server
```

即可。

---

## 官方资料

### Vite

https://vite.dev/guide/

### Building for Production

https://vite.dev/guide/build

### ESLint

https://eslint.org/docs/latest/use/getting-started

### Prettier

https://prettier.io/docs/

### GitHub Actions

https://docs.github.com/en/actions

### Docker Get Started

https://docs.docker.com/get-started/

---

# 23. Chapter 15：进阶功能

完成核心课程后再做。

---

## 23.1 Dark Mode

学习：

```text
CSS Variables
localStorage
prefers-color-scheme
```

---

## 23.2 Debounce Search

例如：

```text
用户输入
 ↓
等待 300ms
 ↓
调用 Search API
```

理解 debounce。

---

## 23.3 Infinite Scroll

学习：

```text
IntersectionObserver
```

官方：

https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API

---

## 23.4 Kanban

增加：

```text
Open
In Progress
Resolved
Closed
```

Column。

---

## 23.5 Drag & Drop

先理解浏览器 Drag API。

之后再考虑成熟库。

---

## 23.6 File Upload

学习：

```text
<input type="file">
File
FormData
multipart/form-data
```

官方：

https://developer.mozilla.org/en-US/docs/Web/API/FormData

---

## 23.7 Performance

学习：

```text
lazy loading
code splitting
memoization
network waterfall
bundle size
```

但不要过早：

```text
useMemo everywhere
useCallback everywhere
```

先发现真实性能问题，再优化。

---

# 24. 推荐项目目录结构

---

## Vanilla 阶段

```text
issueflow/
│
├── index.html
├── issues.html
├── issue-detail.html
├── create-issue.html
│
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── layout.css
│   └── components.css
│
└── js/
    ├── api.js
    ├── issues.js
    ├── dom.js
    └── main.js
```

---

## TypeScript 阶段

```text
src/
│
├── api/
│   └── issues.ts
│
├── models/
│   └── issue.ts
│
├── ui/
│   └── issue-table.ts
│
├── utils/
│   └── query.ts
│
└── main.ts
```

---

## React 阶段

```text
src/
│
├── api/
│   ├── client.ts
│   └── issues.ts
│
├── components/
│   ├── Button/
│   ├── Modal/
│   ├── StatusBadge/
│   └── IssueTable/
│
├── features/
│   └── issues/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── types/
│       └── utils/
│
├── layouts/
│   └── AppLayout.tsx
│
├── pages/
│   ├── DashboardPage.tsx
│   └── SettingsPage.tsx
│
├── router/
│   └── router.tsx
│
├── styles/
│   ├── global.css
│   └── variables.css
│
├── App.tsx
└── main.tsx
```

注意：

> 不要为了“架构漂亮”一开始就创建几十个空文件夹。

目录结构应该随着项目复杂度增长。

---

