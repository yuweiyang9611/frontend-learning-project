# 第 4 周：JavaScript、DOM、模块与异步

本周先用原生 JavaScript 建立语言与浏览器 API 的心智模型，再进入 TypeScript。
周末交付一个能加载、筛选、创建和显示错误的 Vanilla Issue 列表。

## 本周成果

- 理解值、引用、相等、类型转换与 truthiness；
- 使用纯函数、闭包、数组方法和不可变更新处理数据；
- 安全读取与更新 DOM，理解事件传播和委托；
- 用 ES module 拆分职责并设计显式接口；
- 使用 Promise、Fetch、AbortController 和错误状态完成请求生命周期。

配套教材：[JavaScript、DOM 与异步](../learning/04-javascript-dom-and-http.md)。

---

## Day 22：值、类型、相等与转换 {#day-22}

开始前在仓库根运行 `npm run learn:create -- --day 22`、`npm run learn:start`。支架提供
model/view/api/main 四个模块以及成功、404、500、延迟 fixture；用
`npm run learn:test:web -- --day 22` 验证 `learning-work/day-22` 中你的纯逻辑和 HTTP 错误边界；
`npm run learn:day -- 22` 会自动传入当天编号并生成待人工复核的证据报告。

### 120 分钟任务

- **0–15：**预测十个 `typeof`、`===`、truthy/falsy 表达式。
- **15–40：**精读 primitive/reference、null/undefined、显式转换。
- **40–80：**在 Console 验证预测，并为错误预测写解释。
- **80–110：**实现 URL 查询参数到 Issue 过滤值的转换。
- **110–120：**建立“外部 string → 领域值”的检查清单。

### 实验

```js
const rawPage = new URLSearchParams("?page=02").get("page");
const page = Number(rawPage);

console.log({ rawPage, page, isInteger: Number.isInteger(page) });
console.log(Boolean("false"), Boolean(""), null === undefined);
```

DOM input、URLSearchParams 和 JSON 字段不因“看起来像数字”就自动成为可信 number。
转换后仍需检查范围、整数性和 NaN。

### 独立任务

实现 `parsePositivePage(raw)`：输入 `string | null`，只接受 1 以上整数，否则返回 1。
覆盖 `null`、空字符串、`"2"`、`"2.5"`、`"-1"`、`"abc"`。

### 当日验收

- [ ] 使用 `===`，并能解释例外是否真的需要宽松相等。
- [ ] 不把 `typeof null` 误认为对象存在证据。
- [ ] 转换与验证是两个步骤。
- [ ] 能说明 primitive 赋值与对象引用赋值的差异。

---

## Day 23：函数、作用域、闭包与依赖 {#day-23}

### 120 分钟任务

- **0–15：**预测 var/let/const 与函数作用域的四个例子。
- **15–40：**学习 lexical scope、closure、参数、返回值和副作用。
- **40–80：**把一段混合 DOM/过滤/请求代码拆成纯函数与边界函数。
- **80–110：**用闭包实现可配置的 Issue key formatter。
- **110–120：**标记每个函数读取和修改的外部状态。

### 实验

```js
function createIssueKeyFormatter(prefix) {
  let lastId = 0;

  return function formatIssueKey(id) {
    lastId = id;
    return `${prefix}-${String(id).padStart(3, "0")}`;
  };
}

const formatKey = createIssueKeyFormatter("ISS");
```

闭包让函数保留创建时的词法环境；这既可封装状态，也可能隐藏难以测试的可变依赖。
练习把 `lastId` 删除，比较纯函数版本的可预测性。

### 独立任务

为 `filterIssues(issues, query)` 写无副作用版本。调用前后比较输入数组与每个对象引用，
证明函数没有排序或修改原数组。

### 当日验收

- [ ] 能画出变量从哪个 scope 解析。
- [ ] 函数名描述结果或动作，不使用含糊缩写。
- [ ] 纯函数不读取当前 DOM、时间或随机数。
- [ ] 能指出闭包保存状态的收益和风险。

---

## Day 24：对象、数组、解构与不可变更新 {#day-24}

### 120 分钟任务

- **0–15：**预测 spread 是深复制还是浅复制。
- **15–40：**学习 map/filter/reduce/find/some/every、解构与引用共享。
- **40–80：**实现 Issue 搜索、状态筛选、稳定排序和分页 pipeline。
- **80–110：**实现单条 Issue 状态更新，不修改 seed。
- **110–120：**记录每一步输入/输出 shape 与复杂度。

### Pipeline

```js
function listIssues(source, query) {
  return source
    .filter((issue) => !query.status || issue.status === query.status)
    .filter((issue) =>
      issue.title.toLowerCase().includes(query.search.toLowerCase()),
    )
    .toSorted((left, right) => left.id - right.id)
    .slice((query.page - 1) * query.pageSize, query.page * query.pageSize);
}
```

若运行环境不支持 `toSorted`，先复制再 sort：`[...source].sort(...)`。不要为了“不可变”
机械复制所有对象；识别真正发生更新的路径。

### 独立任务

实现 `updateIssueStatus(source, id, status)`，要求：

- 未命中的数组可以返回原引用或新引用，但必须说明选择；
- 命中的 Issue 返回新对象；
- 其他 Issue 保持原对象引用；
- 原数组序列化结果不变。

### 当日验收

- [ ] 知道 sort/reverse/splice 会修改原数组。
- [ ] 不用 JSON stringify/parse 充当通用深复制。
- [ ] 过滤、排序、分页顺序有明确产品含义。
- [ ] 测试同时验证结果与输入未被修改。

---

## Day 25：DOM、事件传播与委托 {#day-25}

### 120 分钟任务

- **0–15：**写下 event target 与 currentTarget 的猜测。
- **15–40：**学习 DOM query、createElement、textContent、capture/bubble。
- **40–80：**把 Issue 数组渲染为 DOM，并为状态按钮添加事件。
- **80–110：**改为容器事件委托，处理动态新增项。
- **110–120：**画出点击从 window 到 button 再冒泡的路径。

### 安全渲染

```js
function createIssueItem(issue) {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.href = `/issues/${encodeURIComponent(issue.id)}`;
  link.textContent = issue.title;
  item.append(link);
  return item;
}
```

用户内容使用 `textContent`，不要进入 `innerHTML`。事件委托时使用
`event.target.closest("[data-action]")`，并确认元素仍在当前容器内。

### 独立任务

动态新增一条 Issue 后无需重新绑定事件也能切换状态。随后在按钮内加入图标 span，
证明 target 可能不是 button，修复选择逻辑。

### 当日验收

- [ ] 能区分 target/currentTarget。
- [ ] 知道 preventDefault 与 stopPropagation 分别改变什么。
- [ ] 动态内容不使用用户字符串拼 HTML。
- [ ] 事件监听器有明确注册与清理策略。

---

## Day 26：ES Modules、错误与可测试边界 {#day-26}

### 120 分钟任务

- **0–15：**列出当前 Vanilla 页面中数据、DOM、请求混在一起的地方。
- **15–40：**学习 named/default export、模块作用域、循环依赖和错误传播。
- **40–80：**拆出 `model.js`、`view.js`、`api.js`、`main.js`。
- **80–110：**为 model 纯函数写最小测试或 Console assertion。
- **110–120：**画出模块依赖方向。

### 边界设计

`model.js` 不应读取 DOM；`view.js` 不应知道 API base；`api.js` 不应直接弹 toast。
`main.js` 负责组合。错误应携带可判断信息，而不是每层捕获后只输出
`"Something went wrong"`。

### 独立任务

让 `api.js` 接受注入的 `fetchImpl`，用一个返回固定 Response 的假实现测试成功和
失败，不发真实网络请求。

### 当日验收

- [ ] 模块没有通过全局变量共享可变状态。
- [ ] import 方向不循环。
- [ ] 边界函数返回调用者可以判断的结果或抛出有上下文的错误。
- [ ] 测试纯函数无需启动浏览器页面。

---

## Day 27：Promise、Fetch、取消与竞态 {#day-27}

### 120 分钟任务

- **0–15：**预测同步日志、microtask 和 timer 的执行顺序。
- **15–40：**学习 Promise 状态、async/await、Fetch 成功条件和 AbortController。
- **40–80：**实现 loading/success/empty/error 四态的 Issue 加载。
- **80–110：**快速切换搜索条件，制造旧请求覆盖新结果的竞态并修复。
- **110–120：**记录请求生命周期状态图。

### Fetch 边界

```js
async function fetchJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}
```

Fetch 只在网络层失败时 reject；HTTP 404/500 仍需要检查 `response.ok`。JSON parse
也可能失败。取消不是通用错误提示，应识别 AbortError 并避免覆盖新状态。

### 独立任务

实现 debounced search：新输入取消旧 timer 和旧请求。测试输入 A 后迅速输入 B，
即使 A 最后返回，页面也不能展示 A 的结果。

### 当日验收

- [ ] loading、empty、error、success 不互相矛盾。
- [ ] 检查 HTTP status，而非只依赖 catch。
- [ ] 旧请求不能覆盖新查询。
- [ ] finally 不会错误清除另一个仍进行中的请求状态。

---

## Day 28：Vanilla Issue 列表交付 {#day-28}

### 120 分钟任务

- **0–10：**写功能和状态清单。
- **10–70：**独立组合模块，完成加载、搜索、筛选、创建和错误显示。
- **70–95：**测试纯函数、DOM 交互、网络失败、竞态和空状态。
- **95–110：**对照 IssueFlow React 实现，列出相同问题与框架抽象。
- **110–120：**周测与复盘。

### 必须交付

- 结构化 Issue seed；
- 纯函数过滤/排序/分页；
- 安全 DOM 渲染；
- 事件委托；
- 模块边界；
- 请求 loading/error/empty/success；
- AbortController 或 request identity 防竞态；
- 至少 8 个可重复断言。

### 周测

闭卷解释：

1. `null`、`undefined` 和缺失字段；
2. 引用共享如何导致隐藏修改；
3. closure 保存了什么；
4. target/currentTarget；
5. innerHTML 风险；
6. module boundary；
7. Fetch 为什么 404 不自动 reject；
8. microtask 与 timer 顺序；
9. 请求取消与错误的差异；
10. 为什么状态不能只用一个 `isLoading`。

### 通过标准

- 十题至少 8 题正确；
- 所有输入数组保持不变；
- 特殊字符标题作为文本显示；
- 快速搜索不出现旧结果闪回；
- 网络失败可重试且不丢当前筛选；
- 能指出进入 TypeScript 后最希望编译器阻止的三类错误。

## 本周闭卷测验与口试

<ClientOnly>
  <WeeklyKnowledgeCheck :week="4" />
</ClientOnly>

[上一周：CSS 与响应式](week-03-css-responsive.md) ·
[下一周：TypeScript 基础](week-05-typescript-foundations.md) ·
[返回课程总览](./)
