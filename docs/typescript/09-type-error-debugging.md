# 09：TypeScript 类型错误调试指南

类型错误不是“编译器不让代码运行”，而是某个值与程序声明的 Contract 不一致。有效调试的目标
不是让红线消失，而是找出：谁提供了实际类型、谁要求了目标类型、两者为何不同、运行时真正
需要什么。

本指南以 IssueFlow 的 strict 配置为基线。不要通过关闭 strict、扩大为 any、双重断言或删除
负例解决诊断。

## 一套可重复的排错流程

### 第 1 步：保存最小复现和完整诊断

先运行项目自己的命令：

```powershell
cd frontend
npm run typecheck
```

记录第一个相关错误的文件、行号、完整消息以及你刚做的改动。后续错误可能只是第一个类型关系
破坏后的连锁反应，不要从最后一个错误开始随机修改。

如果错误只出现在测试或构建，再分别运行：

```powershell
npm test -- path/to/target.test.ts
npm run build
```

### 第 2 步：翻译成“实际类型 → 期望类型”

把诊断改写成一句普通话：

```text
这里实际得到 string，调用方要求 IssueStatus。
这里实际可能是 undefined，组件却要求一定有 Issue。
这里实际是 unknown，代码却在读取 title。
```

如果无法写出这句话，先不要改代码。悬停查看变量、函数参数和返回值，也可以临时写类型别名：

```ts
type Actual = typeof rawStatus;
type Expected = IssueStatus;
```

### 第 3 步：定位类型从哪里变宽、变窄或丢失关系

沿值的来源向上追踪：

1. 是 literal 被扩大为 string 吗？
2. 是 `useState(null)` 或 `useState([])` 初值推断过窄吗？
3. 是一个函数返回 `unknown`、`T | undefined` 或 Promise 吗？
4. 是 `keyof` 与 value 的相关性被拆成两个独立 union 吗？
5. 是 JSON、URL、DOM、localStorage 等真实运行时边界吗？
6. 是后端 Contract 与前端声明发生漂移吗？

优先在类型第一次不准确的位置修复，而不是在最下游连续添加断言。

### 第 4 步：判断需要静态建模还是运行时证明

| 值的来源                 | 首选处理                                  |
| ------------------------ | ----------------------------------------- |
| 应用内部、编译器已知对象 | 调整 interface、union、generic 或函数签名 |
| `T                       | undefined`                                | 明确缺失策略、early return 或 fallback |
| DOM/URL string           | parser 或 guard                           |
| JSON/localStorage/HTTP   | unknown + Decoder                         |
| caught error             | `instanceof` / `typeof` 收窄              |
| 第三方声明确实错误       | 最小范围 adapter 或有证据的断言           |

“我知道它一定是”只有在能指向运行检查、库保证或不可表达的 API 约束时才算证据。

### 第 5 步：缩小为最小类型关系

删除无关 JSX、网络和状态管理，只保留产生错误的类型：

```ts
declare const input: IssueInput;

function setField<K extends keyof IssueInput>(key: K, value: IssueInput[K]) {}

setField("priority", input.priority);
```

若最小版本通过，错误来自外层推断或值的来源；若仍失败，问题在签名本身。

### 第 6 步：先加证明，再缩窄类型

对于 unknown/string 边界：

```ts
const raw = params.get("status");
if (!isIssueStatus(raw)) return;

// raw 在这里才是 IssueStatus
moveIssue(raw);
```

不要倒过来先断言为领域类型，再写永远不会失败的检查。

### 第 7 步：建立正例、负例与运行测试

一个完整修复至少需要：

- 编译成功例：合法关系继续成立；
- 编译失败例：原错误关系明确被拒绝；
- 运行边界例：外部畸形值得到安全行为；
- 回归测试：真实用户流程没有改变。

### 第 8 步：重新运行最小门禁，再运行扩大门禁

先运行目标 typecheck/test，确认诊断确实消失；再运行完整适用门禁。不要在尚未理解原因时一次
格式化或重构大量文件，否则 diff 会掩盖真正修复。

## 快速决策树

```text
看到类型错误
  ├─ 值来自 JSON/DOM/URL/storage？
  │    └─ 是 → 保持 unknown/string → guard/decoder → domain type
  ├─ 值可能缺失或为 null？
  │    └─ 是 → early return / fallback / 明确状态联合
  ├─ key 决定 value 类型？
  │    └─ 是 → K extends keyof T + T[K]
  ├─ 输入类型应该传播到输出？
  │    └─ 是 → generic，并写 expectTypeOf
  ├─ 多个互斥状态？
  │    └─ 是 → discriminated union + never
  └─ 只是库类型比实际 API 窄？
       └─ 先查声明与文档；必要时做最小 adapter/断言并补测试
```

## 常见错误 1：`string` 不能赋给 Literal Union

### 症状

```ts
declare const raw: string;

// Type 'string' is not assignable to type 'IssueStatus'
const status: IssueStatus = raw;
```

### 常见错误修法

```ts
const status = raw as IssueStatus;
```

这只改变编译器看法，`blocked` 仍会在运行时进入系统。

### 正确排查

- 若 raw 来自 DOM/URL/JSON：用 `isIssueStatus`；
- 若 raw 本应是内部常量：检查是否遗漏 `as const` 或类型被过早扩大；
- 若后端新增状态：这是 Contract 漂移，需要产品兼容策略。

### 证据

合法成员、相似非法拼写、空串和非 string 输入的 guard 测试。

## 常见错误 2：对象可能是 `undefined` 或 `null`

### 症状

```ts
const issue = issues.find((item) => item.id === id);
issue.title; // issue 可能为 undefined
```

### 排查

`find` 的未命中是正常返回，不是编译器误报。选择必须与产品行为一致：

```ts
if (!issue) return { kind: "not-found" };
return { kind: "found", issue };
```

### 常见误区

- `issue!.title` 把未命中变成运行崩溃；
- 随意给空对象 fallback，制造假的 Issue；
- 把 id 0 通过 truthiness 当成未提供，却没有明确 ID 规则。

## 常见错误 3：`unknown` 上不存在某属性

### 症状

```ts
declare const raw: unknown;
raw.title;
```

### 排查

先证明它是非 null、非 array 的 object，再检查字段：

```ts
if (isRecord(raw) && typeof raw.title === "string") {
  raw.title.trim();
}
```

若字段多、嵌套深或需要错误信息，改用 Decoder，而不是堆叠巨大 if。

## 常见错误 4：索引表达式是普通 string

### 症状

```ts
function label(key: string) {
  return statusLabels[key];
}
```

对象只保证存在 IssueStatus key，普通 string 可能是任意内容。

### 修复方向

- 若调用方本就应传领域值：参数改为 `IssueStatus`；
- 若 key 来自外部：先 guard；
- 若对象是真正动态字典：返回类型应考虑 undefined，或使用 Map。

不要简单加 `[key:string]:string`，这会虚构任意 key 都存在。

## 常见错误 5：Generic key/value 关系丢失

### 症状

```ts
function update<T>(current: T, key: keyof T, next: T[keyof T]) {}
```

对于 IssueInput，`next` 是所有字段值的 union，不再与具体 key 关联。

### 修复方向

引入单独 K：

```ts
function update<T, K extends keyof T>(current: T, key: K, next: T[K]) {}
```

用 `update(input,'priority',3)` 作为负例，确认关系真的被保留。

## 常见错误 6：泛型推断成过宽或过窄

### 过窄例

```tsx
const [selected, setSelected] = useState(null);
```

这里 state 可能只被推断为 null。若真实状态是 Issue 或 null，应在初始化处明确：

```tsx
const [selected, setSelected] = useState<Issue | null>(null);
```

### 过宽例

把参数先声明成 `Record<string, unknown>` 再传给泛型函数，可能已经丢失具体字段。尽量在最接近
原始值的位置保留准确类型。

### 证据

用 `expectTypeOf` 观察推断，不要依赖“编辑器看起来没红线”。

## 常见错误 7：判别联合成员属性不可访问

### 症状

```ts
function render(result: DecodeResult<Issue>) {
  return result.value.title;
}
```

失败成员没有 value。先检查判别字段：

```ts
if (!result.ok) return result.errors.join(", ");
return result.value.title;
```

### 常见误区

- 给失败成员也添加 `value?: T`；
- 使用 optional chaining 隐藏状态设计问题；
- 把 `ok` 单独解构后，在复杂控制流中丢失相关性。

## 常见错误 8：`never` 报错

### 症状

`assertNever(status)` 中 status 不再是 never。

### 含义

这通常是有价值的错误：union 新增成员，而当前 switch 尚未处理。检查所有成员，不要把参数改为
`never as never` 或删除 default。

如果你确认已经覆盖全部成员，检查判别字段是否被扩大成 string，或某个 case 拼写是否与 union 不同。

## 常见错误 9：Readonly 无法修改

### 症状

```ts
function sortIssues(issues: readonly Issue[]) {
  issues.sort(compareIssues);
}
```

### 修复方向

复制需要改变的层：

```ts
return [...issues].sort(compareIssues);
```

若要修改嵌套 tags，还需复制命中 Issue 和 tags。`Readonly<T>` 是浅层，不能只看到顶层通过就假定
深层完全不可变。

## 常见错误 10：Promise 与值类型不匹配

### 症状

```ts
const issue: Issue = issueflowApi.getIssue(id);
```

实际类型是 `Promise<Issue>`。决定调用位置应该 await、return Promise，还是由 React Query 管理。

常见误区是把函数返回类型改成 Issue，或断言 Promise 已完成。异步时序是运行语义，不能靠类型擦除。

## 常见错误 11：React Event 类型不匹配

### 症状

handler 声明为 input event，却传给 select；或使用 `event.target` 后无法访问预期属性。

### 排查

```ts
function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
  const raw = event.currentTarget.value;
}
```

`currentTarget` 是注册 handler 的元素；`target` 可能是冒泡路径中的内部节点。即使事件类型正确，
raw value 仍需要领域 parser。

## 常见错误 12：对象缺字段或多字段

### 症状

对象字面量直接传参时出现 missing/excess property error。

### 排查

- 缺字段：确认它应必填、optional，还是 DTO 与 Entity 混用了；
- 多字段：检查拼写，或让函数接收更合适的最小 shape；
- 变量间赋值能通过但直接字面量失败：这是额外属性检查，不代表结构类型随机失效。

不要通过给接口添加 `[key:string]:unknown` 隐藏拼写问题。

## 常见错误 13：`Partial<T>` 没有表达业务规则

### 症状

`IssueUpdate` 接受 `{}`，或调用方无法区分 omit/null/undefined。

这不是 Partial 的 bug。它只把属性变为 optional。解决方案可能是：

- `AtLeastOne<T>` 提升部分静态约束；
- intent union 表达动作；
- decoder 拒绝空 JSON；
- 服务端 PATCH DTO 使用 presence flags；
- domain validation 处理字段组合。

需要哪一层取决于规则在哪个信任边界生效。

## 常见错误 14：`@ts-expect-error` 未使用

### 症状

编译器报告 unused `@ts-expect-error`。

这是好事：下一行不再产生预期诊断。检查：

1. 类型改进后负例是否真的合法了；
2. 错误是否移动到另一行；
3. 是否不小心用 any/断言让错误消失；
4. 注释是否应该删除或换成新的负例。

不要改成 `@ts-ignore`。后者不会在错误消失时提醒你。

## 常见错误 15：Decoder 最后仍需要小范围断言

有时 TypeScript 无法从一组跨字段检查完整推导最终 object，项目可能在成功组装处使用小范围断言。

合格条件：

- 每个字段此前都有运行检查；
- 断言只包住已验证的单值或最终组装点；
- 无法通过构造 typed 局部变量更清楚地表达；
- 邻近测试覆盖断言所依赖的边界；
- 注释说明证据，不写“fix TypeScript error”。

不合格例子是函数开头 `const issue = raw as Issue`。

## 不要采用的“修复”

| 伪修复                | 为什么危险           | 首选替代                    |
| --------------------- | -------------------- | --------------------------- |
| 改成 any              | 错误会继续向下游传播 | unknown + narrowing         |
| `as unknown as T`     | 完全绕过兼容检查     | 重构签名或 decoder          |
| 非空断言 `!`          | 把缺失变成运行崩溃   | early return / 明确状态     |
| 扩大 union 为 string  | 拼写和遗漏不再可追踪 | guard + 保持封闭 union      |
| 给对象加 string index | 任意 key 看似都存在  | keyof、Map 或 decode        |
| 关闭 strict           | 全项目失去保护       | 修正首次不准确的类型        |
| `@ts-ignore`          | 错误消失后也不会提醒 | 有理由的 `@ts-expect-error` |
| 删除失败测试          | 丢失回归证据         | 修正 Contract 或预期        |

## 调试记录模板

```md
### 类型错误

- 文件与行：
- 完整诊断：
- 实际类型：
- 期望类型：
- 值的来源：内部 / DOM / URL / JSON / storage / API / third-party
- 第一次失去精度的位置：
- 运行时真实规则：
- 选择的修复：
- 为什么不用断言：
- 编译成功例：
- 编译失败例：
- 运行时边界测试：
- 回归命令与结果：
```

## 求助前的最小证据

若仍无法解决，至少准备：

1. 最小可复现类型和函数签名；
2. 完整错误文本，而不是“TS 报红”；
3. 当前 tsconfig 相关选项；
4. 期望合法和非法的两个调用；
5. 值是否来自运行时边界；
6. 已尝试方案及为何不正确；
7. 一个能验证修复的测试。

这些证据通常已经足以暴露根因。若需要更多练习，返回[练习题库](08-exercise-bank.md)；
需要选型时查看[模式手册](07-pattern-cookbook.md)。
