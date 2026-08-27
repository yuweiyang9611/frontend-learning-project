# 术语表

本表解释 IssueFlow 文档中的含义。定义以“在本项目中如何使用”为主，不替代标准规范。

## Web 与浏览器

| 术语           | 在本项目中的含义                                                              |
| -------------- | ----------------------------------------------------------------------------- |
| URL            | scheme、host、port、path、query、fragment 组成的资源定位；筛选/分页进入 query |
| Origin         | scheme + host + port；3000 与 5170 是不同 Origin                              |
| HTTP           | UI 与 API 的请求/响应协议                                                     |
| Header         | 请求/响应元数据，如 Content-Type、Cookie、Origin                              |
| Status Code    | 200/201/204/400/401/404/409/415/500 等机器可读结果                            |
| JSON           | wire 上的文本数据格式，不携带 TypeScript 类型                                 |
| Cookie         | 浏览器按规则保存并携带的小型 HTTP 状态；.NET auth 使用 HttpOnly Cookie        |
| CORS           | 浏览器对跨 Origin 响应读取的策略，不是认证或 CSRF 防护                        |
| Preflight      | 浏览器在某些跨源请求前发出的 OPTIONS 检查                                     |
| DOM            | 浏览器实际维护的文档对象树，React 最终更新它                                  |
| Event bubbling | 事件从目标向祖先传播的阶段                                                    |
| localStorage   | 可持久字符串键值存储；用户可修改，不能作为授权                                |
| SPA            | 客户端导航时主要更新当前文档的应用模式                                        |
| Deep link      | 可直接刷新/分享的内部页面 URL                                                 |

## HTML、CSS 与可访问性

| 术语              | 含义                                             |
| ----------------- | ------------------------------------------------ |
| Semantic HTML     | 用 button、nav、main、table 等表达真实意图       |
| Accessible name   | 辅助技术用来识别控件的名称                       |
| ARIA              | 补充语义/状态的属性；不能替代正确原生行为        |
| Focus trap        | Modal 打开时 Tab 留在对话框内部                  |
| Focus restoration | 对话框/抽屉关闭后焦点回触发器                    |
| Live region       | `aria-live` 动态播报 Toast/Lab 输出              |
| Cascade           | CSS 来源、优先级、specificity 和顺序共同决定结果 |
| Design token      | 用 CSS variable 表达语义颜色、间距、阴影等       |
| Breakpoint        | 响应式规则切换的视口条件                         |
| Reduced motion    | 用户请求减少非必要运动的系统偏好                 |

## JavaScript 与 TypeScript

| 术语                | 含义                                                |
| ------------------- | --------------------------------------------------- |
| Closure             | 函数记住创建时可见变量的机制                        |
| Promise             | 未来完成/失败的异步结果                             |
| Microtask           | Promise continuation 等在当前 task 后优先处理的队列 |
| Immutability        | 更新时创建新对象/数组，便于观察与回滚               |
| Type erasure        | TypeScript 类型不会进入运行时 JavaScript            |
| Structural typing   | 根据成员形状而非显式 implements 判断兼容            |
| Literal union       | `'open'                                             | 'closed'` 这样的有限值集合 |
| Narrowing           | 通过运行时条件把宽类型缩小                          |
| Type guard          | 返回 `value is T` 并真正检查运行时值的函数          |
| Decoder             | 将 unknown 验证并转换成 typed value 的边界函数      |
| Type assertion      | `as T`；只改变编译器视角，不验证值                  |
| `unknown`           | 必须收窄后才能使用的安全顶层类型                    |
| `any`               | 基本关闭类型检查并向下游传播                        |
| Generic             | 用类型参数保留输入/输出关系                         |
| `keyof`             | 对象类型所有属性名的 union                          |
| Indexed access      | `T[K]`，取得 key 对应的 value 类型                  |
| Utility Type        | Pick/Omit/Partial/Record/Readonly 等类型变换        |
| Discriminated union | 用共同 literal 字段区分各合法状态                   |
| `never`             | 不可能存在的值，用于穷尽检查                        |
| Branded type        | 给结构相同的值添加编译期语义标记                    |
| Safe integer        | JavaScript 可精确表示的整数范围内的值               |

## React 与 Router

| 术语          | 含义                                     |
| ------------- | ---------------------------------------- |
| Component     | 根据 props/state/context 描述 UI 的函数  |
| Props         | 父组件传入的只读输入                     |
| State         | 组件需要记住并触发渲染的值               |
| Derived state | 可由其他输入计算的值，通常不单独存储     |
| Effect        | 与浏览器/网络订阅等外部系统同步的机制    |
| Cleanup       | Effect 重跑或卸载时撤销监听/订阅         |
| Ref           | 保存 DOM 或不触发渲染的可变值            |
| Context       | 跨组件层共享主题、认证、Toast 等能力     |
| Provider      | 向子树提供 Context/Query client 的组件   |
| Suspense      | 路由 lazy chunk 尚未准备时显示 fallback  |
| Nested route  | 父 Layout 通过 Outlet 承载子页面         |
| Route guard   | 前端导航体验；不能代替 API authorization |
| URL state     | 搜索、筛选、分页等由 URL 作为真源的状态  |

## Query、API 与后端

| 术语                 | 含义                                            |
| -------------------- | ----------------------------------------------- |
| Server state         | 服务器拥有、客户端缓存的异步数据                |
| Query key            | TanStack Query 中缓存数据的稳定身份             |
| Stale                | 数据允许重新获取，不等于缓存已删除              |
| Invalidation         | 标记相关 Query 过期并按条件重取                 |
| Mutation             | 创建、更新、删除等写操作                        |
| Optimistic update    | 响应前先更新缓存，并准备失败回滚                |
| Snapshot             | 乐观更新前保存的缓存副本                        |
| Problem Details      | 标准化 HTTP 错误对象，含 title/detail/status 等 |
| DTO                  | 专为请求/响应定义的数据结构，不等同 Entity      |
| Wire Contract        | 实际跨 HTTP 传输的字段、格式和语义              |
| Shape Contract       | 字段名、类型与 nullability                      |
| Behavioral Contract  | 搜索、默认、规范化、并发等行为                  |
| Minimal API          | ASP.NET Core 的轻量 Endpoint 编程模型           |
| Dependency Injection | 框架创建并向 Endpoint 提供服务                  |
| Middleware           | 请求到 Endpoint 前后的管线组件                  |
| EF Core              | .NET 对关系数据库的 ORM                         |
| Migration            | 数据库 schema 的版本化变化                      |
| Seed                 | 可重复初始化的课程数据                          |
| D1                   | 同源 API 使用的 SQL 持久化                      |
| R2                   | 同源 API 使用的附件对象存储                     |
| SQLite               | .NET 课程后端的单文件关系数据库                 |
| Identity             | .NET 用户、密码、Cookie 与角色框架              |
| Authentication       | 确认“是谁”                                      |
| Authorization        | 判断“能做什么”                                  |
| CSRF                 | 利用浏览器自动携带凭据发起跨站写请求的攻击类别  |

## 测试与工程

| 术语             | 含义                                              |
| ---------------- | ------------------------------------------------- |
| Unit test        | 小型纯函数/模块的快速测试                         |
| Component test   | 在 DOM 环境验证组件用户行为                       |
| Integration test | 用真实 HTTP/DB 等组合验证边界                     |
| E2E              | 在真实浏览器走关键用户流程                        |
| Contract test    | 对请求/响应协议执行可复用黑盒检查                 |
| Type-level test  | 用 `@ts-expect-error` / expectTypeOf 验证编译关系 |
| CI               | 在干净环境自动运行质量门                          |
| Build            | 生成生产产物并验证框架/模块集成                   |
| Regression test  | 固化已发现故障，防止再次出现                      |

[返回参考资料](../README.md)
