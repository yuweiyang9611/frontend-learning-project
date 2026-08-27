# 14. Chapter 06：TypeScript

对于有 C# / Java 等强类型语言背景的人，本章通常会比较容易。

但不要因为熟悉类型系统，就忽略 TypeScript 与 JavaScript 的关系。

TypeScript 是：

```text
JavaScript
+
Static Type Checking
```

而不是：

```text
运行在浏览器里的另一种独立语言
```

---

## 14.1 官方推荐阅读

尤其推荐：

### TypeScript for Java/C# Programmers

https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html

### TypeScript Handbook

https://www.typescriptlang.org/docs/handbook/intro.html

中文入口：

https://www.typescriptlang.org/zh/docs/handbook/

---

## 14.2 Vite

从这一阶段开始可以使用：

```text
Vite + Vanilla TypeScript
```

创建：

```bash
npm create vite@latest
```

选择：

```text
Vanilla
TypeScript
```

---

## 14.3 Interface

```typescript
interface Issue {
    id: number;
    title: string;
    description: string;
}
```

---

## 14.4 Union

```typescript
type IssueStatus =
    | "open"
    | "in_progress"
    | "resolved"
    | "closed";
```

很多情况下比 enum 更自然。

---

## 14.5 Generic

```typescript
interface PageResult<T> {
    items: T[];
    page: number;
    total: number;
}
```

---

## 14.6 Utility Types

必须使用：

```text
Partial
Pick
Omit
Record
Readonly
```

---

## 14.7 Narrowing

例如：

```typescript
function print(value: string | number) {
    if (typeof value === "string") {
        console.log(value.toUpperCase());
    } else {
        console.log(value.toFixed(2));
    }
}
```

---

## 14.8 Discriminated Union

非常推荐练习：

```typescript
type ApiState<T> =
    | {
        status: "loading";
    }
    | {
        status: "success";
        data: T;
    }
    | {
        status: "error";
        error: Error;
    };
```

这比：

```typescript
loading: boolean
data?: T
error?: Error
```

更容易避免非法状态组合。

---

## Task 6.1：整个 JS 项目迁移到 TS

要求：

- Issue Model 有类型；
- API Response 有类型；
- DOM Element 有类型；
- Event Handler 有类型；
- 禁止大量 `any`。

---

## 本章禁止

```text
React
大量 any
as unknown as ...
为消除报错而随意强转
```

---

## 验收

能够解释：

- TypeScript 和 JavaScript 的关系；
- interface 和 type；
- union；
- narrowing；
- generic；
- `unknown` 和 `any`；
- `never`；
- structural typing；
- TS 类型是否存在于浏览器运行时。

---

## 官方资料

### TypeScript Documentation

https://www.typescriptlang.org/docs/

### Handbook

https://www.typescriptlang.org/docs/handbook/intro.html

### Everyday Types

https://www.typescriptlang.org/docs/handbook/2/everyday-types.html

### Narrowing

https://www.typescriptlang.org/docs/handbook/2/narrowing.html

### Generics

https://www.typescriptlang.org/docs/handbook/2/generics.html

### Utility Types

https://www.typescriptlang.org/docs/handbook/utility-types.html

### Vite

https://vite.dev/guide/

---

# 15. Chapter 07：React 基础

到这里才开始 React。

建议重新创建：

```text
Vite
React
TypeScript
```

然后重写 IssueFlow。

---

## 15.1 React 学习路线

官方 React 文档应该按：

```text
Quick Start
 ↓
Describing the UI
 ↓
Adding Interactivity
 ↓
Managing State
 ↓
Escape Hatches
```

学习。

官方：

https://react.dev/learn

中文：

https://zh-hans.react.dev/learn

---

## 15.2 Component

```tsx
function StatusBadge() {
    return <span>Open</span>;
}
```

理解：

> Component 本质上是描述 UI 的 JavaScript/TypeScript 函数。

---

## 15.3 Props

```tsx
interface Props {
    status: IssueStatus;
}

function StatusBadge({ status }: Props) {
    return <span>{status}</span>;
}
```

---

## 15.4 List Rendering

```tsx
issues.map(issue => (
    <IssueRow
        key={issue.id}
        issue={issue}
    />
))
```

重点理解：

```text
key
```

不要只记：

> React 要求写 key。

需要知道它与组件身份和列表 reconciliation 有关。

---

## 15.5 Conditional Rendering

```tsx
if (loading) {
    return <Loading />;
}
```

```tsx
return issues.length === 0
    ? <EmptyState />
    : <IssueTable />;
```

---

## 15.6 Event

```tsx
<button onClick={handleCreate}>
    Create Issue
</button>
```

---

## 15.7 State

```tsx
const [search, setSearch] = useState("");
```

核心模型：

```text
State
 ↓
Render
 ↓
UI
 ↓
User Event
 ↓
State Change
 ↓
Render
```

---

## Task 7.1：组件拆分

将：

```text
IssuesPage
```

拆为：

```text
IssuesPage
│
├── PageHeader
├── IssueFilters
├── IssueTable
│   └── IssueRow
└── Pagination
```

---

## Task 7.2：Search

```tsx
const [search, setSearch] = useState("");
```

实现客户端过滤。

---

## Task 7.3：Modal

使用 React State 实现。

比较：

```text
Vanilla JS DOM 操作
vs
React Declarative Rendering
```

---

## 本章暂时禁止

```text
Redux
Zustand
TanStack Query
React Hook Form
大型 UI Library
```

---

## 验收

能够回答：

- Component 是什么；
- Props 是什么；
- State 是什么；
- Props 和 State 区别；
- 为什么不能直接修改 State；
- React 为什么重新 Render；
- Render 是否等于浏览器重新加载整个页面；
- key 的作用。

---

## 官方资料

### React Learn

https://react.dev/learn

### Quick Start

https://react.dev/learn

### Thinking in React

https://react.dev/learn/thinking-in-react

### State: A Component's Memory

https://react.dev/learn/state-a-components-memory

### Rendering Lists

https://react.dev/learn/rendering-lists

### Responding to Events

https://react.dev/learn/responding-to-events

---

# 16. Chapter 08：React 状态设计

这章比“学会 useState”更重要。

很多 React 项目的复杂度，本质上来自状态设计。

---

## 16.1 状态分类

把项目状态分类：

```text
Local UI State
Server State
URL State
Form State
Global Client State
```

例如：

| 数据 | 类型 |
|---|---|
| Modal 是否打开 | Local UI State |
| 当前 Issue 列表 | Server State |
| 当前 page | URL State |
| 创建 Issue 输入值 | Form State |
| Theme | Global / Persistent UI State |

不要把所有东西都丢进 Redux。

---

## 16.2 Single Source of Truth

同一个状态不要重复保存。

错误：

```text
selectedIssue
selectedIssueId
selectedIssueTitle
selectedIssueStatus
```

如果后面的内容都可以从前面的数据计算得到，就不一定应该成为独立 State。

---

## 16.3 Derived State

例如：

```tsx
const filteredIssues = issues.filter(...);
```

通常不要再：

```tsx
const [filteredIssues, setFilteredIssues] = useState([]);
```

---

## 16.4 Lifting State Up

理解：

```text
Parent
  ↓ props
Child A
Child B
```

两个 Child 需要共享状态时：

```text
把状态移动到最近公共 Parent
```

---

## 16.5 Effect

学习：

```tsx
useEffect()
```

但必须同时学习：

> 什么情况下不需要 Effect。

---

## 重要官方文章

### Synchronizing with Effects

https://react.dev/learn/synchronizing-with-effects

### You Might Not Need an Effect

https://react.dev/learn/you-might-not-need-an-effect

这两篇非常重要。

---

## Task 8.1：删除不必要 Effect

找出可以通过：

```text
render
derived value
event handler
```

完成的逻辑。

不要滥用：

```tsx
useEffect()
```

---

## Task 8.2：共享 Filter State

```text
Search
Status
Priority
```

由 `IssuesPage` 管理。

子组件只接收 Props。

---

## 验收

能够回答：

- 什么数据应该成为 State；
- 什么数据不应该成为 State；
- Derived State；
- Lifting State Up；
- Effect 的用途；
- 为什么 Effect 容易被滥用；
- Local State 和 Server State 的区别。

---

## 官方资料

### Managing State

https://react.dev/learn/managing-state

### Choosing the State Structure

https://react.dev/learn/choosing-the-state-structure

### Sharing State Between Components

https://react.dev/learn/sharing-state-between-components

### Preserving and Resetting State

https://react.dev/learn/preserving-and-resetting-state

---

