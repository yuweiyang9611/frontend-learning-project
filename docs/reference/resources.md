# 官方资料索引

先做项目实验，再按遇到的问题查官方资料。不要把文档从第一页抄到最后一页。

## Web、HTML、CSS

- [MDN Learn Web Development](https://developer.mozilla.org/en-US/docs/Learn_web_development)
- [MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [MDN HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [MDN Forms](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms)
- [MDN CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [MDN Flexbox](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox)
- [MDN Grid](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

建议配合第 02、03、09 章，用 DevTools 验证每个概念。

## JavaScript 与浏览器 API

- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [MDN Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [MDN JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [MDN DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)
- [MDN Events](https://developer.mozilla.org/en-US/docs/Web/API/Event)
- [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [MDN URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- [MDN Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [MDN Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MDN FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

## TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript for OOP/C# programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html)

学习顺序应与 [TypeScript 专题](../typescript/) 配合，尤其要同时做运行时 Decoder。

## React、Router 与 Query

- [React Learn](https://react.dev/learn)
- [Thinking in React](https://react.dev/learn/thinking-in-react)
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
- [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [React Router](https://reactrouter.com/)
- [React Router Declarative Routing](https://reactrouter.com/start/declarative/routing)
- [TanStack Query React Docs](https://tanstack.com/query/latest/docs/framework/react)
- [Queries](https://tanstack.com/query/latest/docs/framework/react/guides/queries)
- [Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [Query Invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)

注意：项目还有 Vinext/Next 页面入口层，不能把 React Router 文档当成整个应用服务器路由说明。

## 测试

- [Vitest Guide](https://vitest.dev/guide/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about/)
- [user-event](https://testing-library.com/docs/user-event/intro/)
- [Playwright Introduction](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

阅读时把同一功能分别放进纯函数、组件和 E2E，比较它们能证明的边界。

## .NET、ASP.NET Core 与 EF Core

- [.NET releases and support](https://learn.microsoft.com/en-us/dotnet/core/releases-and-support)
- [ASP.NET Core APIs overview](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/apis?view=aspnetcore-10.0)
- [Minimal APIs](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis?view=aspnetcore-10.0)
- [ASP.NET Core OpenAPI](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/aspnetcore-openapi?view=aspnetcore-10.0)
- [EF Core](https://learn.microsoft.com/en-us/ef/core/)
- [SQLite provider](https://learn.microsoft.com/en-us/ef/core/providers/sqlite/)
- [EF Core Migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)
- [ASP.NET Core validation](https://learn.microsoft.com/en-us/aspnet/core/validation/overview?view=aspnetcore-10.0)
- [CORS](https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-10.0)
- [Identity API authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-api-authorization?view=aspnetcore-10.0)
- [File uploads](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/file-uploads?view=aspnetcore-10.0)
- [Integration tests](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0)

## Cloudflare 数据能力

- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)

平台部署细节可能变化；以仓库配置和平台当前官方文档为准，不把一次发布操作写成永久课程知识。

## 使用规则

读资料时记录：

1. 要解决的具体问题；
2. 官方文档中的关键约束；
3. IssueFlow 对应源码；
4. 最小实验；
5. 测试；
6. 与当前版本的差异。

[返回参考资料](../README.md)
