# 08：TypeScript 练习题库

本题库用于 91 天路线第 5～8 周，也可单独训练。共 27 题，分为基础、应用和进阶三级。
题目正文不直接展示整套答案；仓库现在提供独立 workbench、每题至少 3 个运行时 Contract、
编译期负例、四级提示和单独的 reference。先完成再查看参考实现，完成一道题必须同时留下
编译期和运行时证据。

## 可运行工作台

进入 `frontend` 后：

```powershell
npm run exercise:test -- B01
npm run exercise:verify
```

第一次运行 B01 应当红灯，因为 [workbench.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/exercises/typescript/workbench.ts)
仍是 TODO。只替换当前题函数，再运行同一命令。题目、关注点和四级提示位于
[manifest.json](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/exercises/typescript/manifest.json)，
确定性输入位于 [contracts.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/exercises/typescript/contracts.ts)。
通过后才对照 [reference.ts](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/exercises/typescript/reference.ts)，
然后关闭参考实现，用一个变化后的输入再做一次。

四级提示含义：

1. 诊断问题，不指出位置；
2. 指向类型关系或符号；
3. 给伪代码和一个输入；
4. 给最小补丁思路；使用后必须完成一个无提示迁移输入。

## 使用规则

1. 先写预测，不要先看提示；
2. 编译期负例使用带原因的 `@ts-expect-error`；
3. runtime 输入从正常、边界、错误三类各选至少一个；
4. 不用 `any`、双重断言或关闭 strict 消除诊断；
5. 每题记录“类型保证了什么、运行时还需保证什么”。

建议把实验放在个人学习分支。快速反馈命令：

```powershell
cd frontend
npm run typecheck
npm test -- src/features/typescript-lab/examples.test.ts
```

## Level 1：基础题

### B01：推断与显式标注

- **目标：**理解 `const`、`let`、函数参数和返回值的推断差异。
- **起始接口或输入：**`const initial = 'open'`、`let current = 'open'`、一个返回状态标签的函数。
- **陷阱：**以为所有字符串变量都会保留 `'open'` literal；给每个局部变量添加多余 annotation。
- **证据：**用 `expectTypeOf` 记录三种推断；添加一个错误参数的 `@ts-expect-error`；运行函数输出。
- **提示：**先观察变量是否还会被重新赋值，再比较 `as const` 与普通 annotation。

### B02：最小结构输入

- **目标：**让函数只依赖 `key` 和 `title`，而不是完整 Issue。
- **起始接口或输入：**`Issue`、`{ key: string; title: string }`、`seedIssues[0]`。
- **陷阱：**参数直接写成 `Issue`；误以为对象必须显式 `implements` 某个 interface。
- **证据：**完整 Issue 和最小 object 都成功；缺 title 和 title 为 number 被编译器拒绝；运行时输出相同格式。
- **提示：**先写函数真正读取的属性，再决定用 interface、type 或 `Pick`。

### B03：Optional、null 与缺失

- **目标：**解释 PATCH 中 keep、clear、set 三种动作。
- **起始接口或输入：**`IssueUpdate` 与 `assigneeId: number | null`。
- **陷阱：**把 `{assigneeId:undefined}` 与 `{assigneeId:null}` 当成相同 JSON；用 truthiness 判断 ID。
- **证据：**构造四个对象并记录 `JSON.stringify`；至少一个非可选字段接收 undefined 的编译负例。
- **提示：**同时观察内存对象的 key 和序列化后的字符串。

### B04：从 Tuple 派生 Union

- **目标：**从运行时状态列表派生 IssueStatus。
- **起始接口或输入：**`['open','in_progress','resolved','closed']`。
- **陷阱：**另外手写一份 union；遗漏 `as const`；把结果扩大成 string。
- **证据：**`'blocked'` 编译失败；合法状态可用于 select；运行时数组仍可被 guard 使用。
- **提示：**先查看 `(typeof values)[number]` 的推断结果。

### B05：完整状态映射

- **目标：**为每个状态建立 label 与 order。
- **起始接口或输入：**`IssueStatus` 与 `Record<IssueStatus, {label:string;order:number}>`。
- **陷阱：**用 `as Record` 掩盖缺失 key；把 key 写成普通 string。
- **证据：**删一个 key 和拼错一个 key 均产生诊断；运行测试比较对象 keys 与状态 tuple。
- **提示：**使用 `satisfies`，观察它与类型 annotation 保留推断的差别。

### B06：诚实的状态 Guard

- **目标：**把 unknown 收窄为 IssueStatus。
- **起始接口或输入：**`ISSUE_STATUSES` 和输入集合 `open`、`blocked`、3、null、[]、{}。
- **陷阱：**只检查 `typeof value === 'string'`；在函数外直接断言。
- **证据：**表驱动测试至少 8 项；成功分支中 value 被识别为 IssueStatus；非法值全部 false。
- **提示：**运行时常量是合法成员的单一来源。

### B07：Readonly 输入与不可变更新

- **目标：**更新 Issue status 而不修改 source array。
- **起始接口或输入：**`readonly Issue[]`、issue id、新 status。
- **陷阱：**原地 sort/push；只复制数组却修改其中原对象；用断言移除 readonly。
- **证据：**编译器拒绝 push；测试 source 快照不变、命中对象引用改变、未命中引用保持。
- **提示：**先用 map 找命中项，再只展开真正变化的对象。

### B08：catch 中的 unknown

- **目标：**从任意 thrown value 得到安全显示文案。
- **起始接口或输入：**Error、string、number、null、`new ApiError(...)`。
- **陷阱：**直接读取 `error.message`；把所有错误都显示成内部 stack。
- **证据：**直接访问 unknown 的编译负例；五种 thrown value 的运行测试；敏感信息不进入 UI。
- **提示：**按最具体到最一般的顺序使用 `instanceof` 和 `typeof`。

### B09：RemoteData 判别联合

- **目标：**表达 idle、loading、success、error 四种互斥状态。
- **起始接口或输入：**`Issue[]`、loading 文案、error message。
- **陷阱：**所有字段都写成 optional；保留额外的 isLoading boolean。
- **证据：**四种合法构造；两个非法构造负例；render 函数的四个运行测试。
- **提示：**每个成员只携带该状态真正拥有的数据。

## Level 2：应用题

### A01：通用分页器

- **目标：**实现 `paginate<T>` 并保留 item 类型。
- **起始接口或输入：**`readonly T[]`、page、pageSize、`PagedResult<T>`。
- **陷阱：**返回 `unknown[]`；修改输入；忘记 page 0、NaN 和小数策略。
- **证据：**Issue、Member 两种调用的 `expectTypeOf`；至少 6 个运行边界；source 不变。
- **提示：**类型只能约束 number，正整数和范围要在实现中处理。

### A02：分页映射

- **目标：**把 `PagedResult<T>` 映射为 `PagedResult<U>`。
- **起始接口或输入：**Member page 和 `(member) => member.displayName`。
- **陷阱：**只使用一个类型参数；丢失 page/pageSize/total；修改原 items。
- **证据：**输出精确为 string page；元数据不变；输入 page 深层内容不变。
- **提示：**T 与 U 分别代表映射前后元素，不代表分页容器。

### A03：最小约束索引

- **目标：**实现 `indexById<T extends {id:number}>`。
- **起始接口或输入：**Issue、Member、简化对象、缺 id 对象、string id 对象。
- **陷阱：**约束成完整 Issue；认为 constraint 检查唯一或正整数。
- **证据：**两个编译负例；重复 id 的运行行为；返回 Map value 保留额外字段。
- **提示：**把结构能力与业务规则分成两栏。

### A04：通用 groupBy

- **目标：**使用 `K extends PropertyKey` 分组并保留 item 类型。
- **起始接口或输入：**Issues 按 status、Members 按 role、对象按 symbol key。
- **陷阱：**返回 `Record<string, any[]>`；忽略 number/symbol key；修改输入。
- **证据：**三种 key 类型、空数组、重复 key 测试；`expectTypeOf` 证明 value 类型。
- **提示：**Map 比普通 object 更直接支持完整 PropertyKey。

### A05：类型安全字段更新器

- **目标：**保持 field name 与 field value 的相关性。
- **起始接口或输入：**`IssueInput`、title、priority、assigneeId。
- **陷阱：**next 写成 `T[keyof T]`；让 DOM raw string 直接进入 updater。
- **证据：**三个正确更新和三个 key/value 负例；更新后 source 不变。
- **提示：**让 K 同时出现在第二参数和第三参数中。

### A06：视图与错误类型派生

- **目标：**用 Utility Types 派生 IssueSummary、IssueDraft、InternalErrors。
- **起始接口或输入：**`Issue`、`IssueInput`、`FieldErrors`。
- **陷阱：**复制字段声明；认为 `Readonly` 深冻结；外部错误强行限制为已知 key。
- **证据：**三个 `expectTypeOf`；Readonly mutation 负例；嵌套数组的运行实验。
- **提示：**内部数据和 wire 数据可能需要不同开放程度。

### A07：至少一个字段的 PATCH

- **目标：**尝试定义 `AtLeastOne<T>`，并分析其边界。
- **起始接口或输入：**`IssueUpdate = Partial<IssueInput>`、`{}`、`{title:'x'}`、`{title:undefined}`。
- **陷阱：**把类型工具当成运行时验证；忽略 exactOptionalPropertyTypes 当前未开启。
- **证据：**空对象的编译预期；合法单字段 patch；运行时 `{}` decoder；限制说明。
- **提示：**Mapped type 可以对每个 key 生成“这个 key 必填、其余可选”的 union。

### A08：IssuePreview Decoder

- **目标：**从 unknown 解码最小 Issue preview。
- **起始接口或输入：**id、key、title、status、priority、nullable assignee。
- **陷阱：**只检查顶层 object；先断言后检查；漏掉 `typeof null === 'object'`。
- **证据：**null、array、错误 id、错误 key、空 title、非法 union、合法对象测试。
- **提示：**先用 isRecord，再逐字段检查；成功对象只使用已经证明的字段。

### A09：数组 Decoder 与错误路径

- **目标：**实现 `decodeArray<T>`，错误能定位到元素索引。
- **起始接口或输入：**`[validIssue, invalidIssue, validIssue]`。
- **陷阱：**遇到错误仍返回部分成功数组；错误只写“invalid”；混淆 fail-fast 与 accumulate。
- **证据：**空数组、非数组、单错、多错测试；错误含 `$[1].status` 等路径。
- **提示：**先收集成功值和错误，最后依据 errors 是否为空决定结果分支。

## Level 3：进阶题

### C01：PagedResult Decoder

- **目标：**组合 generic item decoder，验证完整分页响应。
- **起始接口或输入：**`decodePagedResult(decodeIssuePreview)` 与 page/pageSize/total。
- **陷阱：**数字只检查 `typeof number`；items 错误丢失路径；total 小于 items.length 未决策。
- **证据：**至少 10 个响应矩阵；成功值为 `PagedResult<IssuePreview>`；每项规则有说明。
- **提示：**先写分页元数据的不变量表，再编码，不要边写边猜规则。

### C02：Decode 与 Domain Validation 分层

- **目标：**让 wire shape 错误和业务错误分别报告。
- **起始接口或输入：**`decodeIssueInputPatch`、`validateIssue`、99/100/101 字 title。
- **陷阱：**decoder 拒绝所有业务不合法值；validator 接收 unknown；同一错误重复两次。
- **证据：**每个输入标注 parse/decode/validate 层；表驱动测试；错误文案不同。
- **提示：**先问“它是不是 string”，再问“这个 string 是否符合业务规则”。

### C03：Query Parser 与 Builder 往返

- **目标：**安全解析 URL query，并生成可分享 URL。
- **起始接口或输入：**page、pageSize、search、status、priority、sortBy、sortDirection。
- **陷阱：**`Number('')` 变成 0；非法 enum 被断言；忘记 `&`、`+`、中文编码。
- **证据：**合法输入 round-trip；非法值策略；默认值不进入 URL；至少 12 个案例。
- **提示：**先定义 canonical defaults，再分别写 parse 与 serialize。

### C04：localStorage Progress Decoder

- **目标：**恢复 TypeScript Lab 进度且容忍损坏或过期数据。
- **起始接口或输入：**null、坏 JSON、object、混合 array、未知 lesson ID、合法 ID。
- **陷阱：**`JSON.parse(...) as string[]`；一个坏 item 导致全部崩溃；保留已删除 lesson。
- **证据：**页面不崩溃；只返回 catalog 中的 string ID；损坏策略有测试和说明。
- **提示：**先证明 array，再逐项过滤类型和 membership。

### C05：安全 ID、DateOnly 与 Instant

- **目标：**解码 C# long、DateOnly、DateTimeOffset 的 JSON 表示。
- **起始接口或输入：**ID 0/1.5/MAX_SAFE+1；闰日；Z/+09:00/无 offset。
- **陷阱：**只用正则验证日期；把 DateOnly 转 UTC；认为所有 long 都适合 number。
- **证据：**至少 12 个 scalar 测试；branded type 编译负例；Contract 风险表。
- **提示：**格式通过后重建 UTC 日期核对年月日；instant 必须明确 offset。

### C06：Problem Details Decoder 与错误分类

- **目标：**区分 validation、401、403、404、409、其他 4xx、5xx、network、cancelled、contract。
- **起始接口或输入：**status number、title/detail、可选 errors、非 JSON body。
- **陷阱：**假定 errors 总存在；任意 status 进入封闭 union；向用户显示内部 exception。
- **证据：**400 有/无 errors、404、418、503、HTML 500、AbortError 测试；穷尽 formatter。
- **提示：**HTTP status 范围本身也要运行验证；wire problem 先 decoder 再分类。

### C07：Decoder 驱动 Request 与 204

- **目标：**让调用者必须提供成功 response decoder，并单独处理 no-content。
- **起始接口或输入：**`{status, body, decode}` response adapter、fake responses、一个简单 endpoint。
- **陷阱：**继续 `as Promise<T>`；对 204 调 json；所有失败都包装成同一种 Error。
- **工作台 Contract：**合法 200 的值必须来自 decoder；畸形 200 返回 `contract-error`；
  204 与非 2xx 使用会主动抛错的 decoder，证明该 decoder 没有被调用。
- **纵向扩展证据：**迁移一个真实 endpoint 后，再补无效 JSON、404 Problem、HTML 500 和网络失败测试。
- **提示：**先按 204、非 2xx、需要解码的 2xx 分支；不要让 raw body 成为泛型返回值。

### C08：安全 React Select

- **目标：**移除一处 `event.target.value as IssueStatus`。
- **起始接口或输入：**`{current, raw}` 的纯 transition，再接 IssueForm 或 Board 的 status select。
- **陷阱：**只改成 `currentTarget.value as ...`；因为 options typed 就省略 guard；非法值静默进入 mutation。
- **证据：**合法 change 同时产生新 state 和 request effect；forged `blocked` 保留 current 且
  `request: null`；编译器拒绝 raw string 直接成为 `IssueStatus`。
- **提示：**先让纯函数返回 `state/request/error`，Contract 通过后再把效果接到组件 handler。

### C09：乐观更新与 Typed Rollback

- **目标：**类型化 mutation variables/context，并验证失败回滚。
- **起始接口或输入：**BoardPage 的 `PagedResult<Issue>` cache、状态 mutation、500 response。
- **陷阱：**只返回最终数组；快照类型是 unknown；失败后忘记 invalidate；固定 sleep 测试。
- **工作台 Contract：**成功返回 `snapshot → optimistic → invalidate`；失败返回
  `snapshot → optimistic → rollback → invalidate`；每个事件携带 typed items 或 query key。
- **纵向扩展证据：**组件测试再观察 optimistic move、失败 toast、rollback 和最终 refetch；
  并发失败覆盖更晚成功的问题记录为后续约束。
- **提示：**先返回 discriminated event array 固定顺序，再把每个事件映射到 Query 生命周期回调。

## 分级完成标准

### 基础通过

- 完成 B01～B09 中至少 7 题；
- 至少 12 个编译期负例；
- 能解释类型擦除、unknown、union 和 readonly。

### 应用通过

- 完成 A01～A09 中至少 7 题；
- 至少 20 个 runtime 边界测试；
- 没有 any、双重断言或通过放宽类型规避问题。

### 进阶通过

- 完成 C01～C09 中至少 6 题；
- 至少一个真实 endpoint 或 React handler 完成纵向改进；
- typecheck、相关单元/组件/Contract 测试均通过；
- 能清楚说明未解决的兼容性和并发风险。

卡在诊断时不要立即加断言，按[类型错误调试指南](09-type-error-debugging.md)逐步缩小问题。
