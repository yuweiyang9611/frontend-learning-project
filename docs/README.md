# IssueFlow 学习文档

这里是 IssueFlow 的教材入口。文档按“先理解浏览器，再理解类型与 React，最后连接数据层和工程质量”的依赖顺序组织，不需要一次读完整个仓库。

在线版本：<https://yuweiyang9611.github.io/frontend-learning-project/>

如果你是第一次学习，请从 [00：开始之前](learning/00-getting-started.md) 顺序阅读。每章都包含：

- 本章目标与前置知识；
- 为什么项目采用当前设计；
- 对应的真实源码入口；
- 可以在浏览器或测试中完成的实验；
- 常见误区与验收问题；
- 上一章和下一章导航。

## 顺序学习路线

| 顺序 | 章节                                                                         | 你会解决的问题                                       |
| ---- | ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| 00   | [开始之前](learning/00-getting-started.md)                                   | 怎样建立可重复的运行、测试和 Git 基线？              |
| 01   | [项目地图与数据模式](learning/01-project-map-and-data-modes.md)              | 页面、客户端路由、API 路由和三套数据实现是什么关系？ |
| 02   | [浏览器、URL、HTTP 与 DevTools](learning/02-browser-and-web.md)              | 从输入 URL 到 React 更新 DOM，浏览器实际做了什么？   |
| 03   | [HTML 与 CSS](learning/03-html-and-css.md)                                   | 语义、布局、设计变量、响应式规则如何落到 IssueFlow？ |
| 04   | [JavaScript、DOM 与异步](learning/04-javascript-dom-and-http.md)             | 事件、闭包、模块、Promise 与 Fetch 怎样支撑交互？    |
| 05   | [TypeScript 学习路线](learning/05-typescript-roadmap.md)                     | 如何从 C# 思维过渡到结构类型和运行时边界？           |
| 06   | [React 组件与状态](learning/06-react-components-and-state.md)                | Props、State、派生值、Effect 和状态所有权如何划分？  |
| 07   | [路由、URL 状态与认证](learning/07-routing-url-and-auth.md)                  | 哪些状态应进入 URL，前端保护为何不能代替后端授权？   |
| 08   | [服务端状态与 API](learning/08-server-state-and-api.md)                      | Query、Mutation、缓存、分页和乐观更新如何配合？      |
| 09   | [表单、复杂交互与可访问性](learning/09-forms-interactions-and-a11y.md)       | 怎样实现键盘可用且失败可恢复的产品交互？             |
| 10   | [持久化、双后端与安全边界](learning/10-persistence-backends-and-security.md) | D1/R2 和 .NET/SQLite 如何遵守同一前端 Contract？     |
| 11   | [测试、调试、CI 与构建](learning/11-testing-engineering-and-deployment.md)   | 应该在哪一层测试，怎样从失败日志定位边界？           |
| 12   | [综合练习与毕业标准](learning/12-capstone-and-graduation.md)                 | 如何独立完成一个跨前后端功能并证明质量？             |

## TypeScript 专题

TypeScript 内容单独拆成一组可反复查阅的专题：

1. [从 C# 到 TypeScript](typescript/01-from-csharp-to-typescript.md)
2. [领域建模、联合类型与收窄](typescript/02-domain-modeling-and-narrowing.md)
3. [泛型、Utility Types 与 keyof](typescript/03-generics-utilities-and-keyof.md)
4. [unknown、Decoder 与运行时边界](typescript/04-runtime-boundaries.md)
5. [.NET 与 TypeScript Wire Contract](typescript/05-dotnet-wire-contracts.md)
6. [TypeScript Lab 实验手册](typescript/06-lab-workbook.md)

## 后端对照专题

- [Minimal API 与 HTTP Contract](backend/01-minimal-api-and-contracts.md)
- [EF Core、SQLite 与数据建模](backend/02-ef-core-and-data.md)
- [认证、Problem Details 与上传安全](backend/03-auth-errors-and-uploads.md)
- [双后端对照实验](backend/04-compare-two-backends.md)

## 参考资料

- [产品需求](reference/product-requirements.md)
- [源码追踪路线](reference/source-traces.md)
- [术语表](reference/glossary.md)
- [官方资料索引](reference/resources.md)
- [练习任务模板](reference/task-template.md)
- [原始课程设计存档](archive/original-curriculum/README.md)

## 维护者文档

- [扩展 TypeScript Lab](maintainers/typescript-lab.md)
- [维护文档结构](maintainers/documentation.md)
- [发布 GitHub Pages](maintainers/github-pages.md)

旧入口
[LEARNING_GUIDE.md](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/LEARNING_GUIDE.md)
和
[frontend_learning_project_detailed.md](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend_learning_project_detailed.md)
会保留为兼容导航页，新内容以本目录为准。
