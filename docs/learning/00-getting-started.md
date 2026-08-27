# 00：开始之前

[学习路线索引](./) · 下一章：[项目地图与数据模式](01-project-map-and-data-modes.md)

## 本章目标

完成本章后，你应当拥有一个可重复的学习基线：

- 知道需要哪些运行环境；
- 能启动默认前端与同源 API；
- 能使用演示账号完成一次 Issue 生命周期；
- 能运行格式、Lint、类型检查、单元测试、构建、E2E 和 .NET 测试；
- 会为每个练习创建小分支和小提交。

## 为什么先建立基线

学习项目最常见的问题不是“不会写代码”，而是不知道错误来自原项目、运行环境还是自己的改动。基线的作用类似后端项目中的健康检查和回归套件：开始练习前全部为绿，练习后出现的红灯才有诊断价值。

不要一上来同时修改前端、D1 和 .NET 后端。先证明仓库原始状态可运行，再一次只改变一个边界。

## 环境要求

- Node.js 22.13 或更高版本；
- npm 11 或更高版本；
- .NET SDK 10；
- Chrome 或 Edge；
- Git。

检查版本：

```powershell
node --version
npm --version
dotnet --version
git --version
```

如果版本不满足要求，先升级环境，不要通过删除 lockfile 或随意降级依赖绕过问题。

## 启动默认模式

```powershell
cd frontend
npm install
npm run dev
```

打开 <http://localhost:3000>，使用：

- Email：`demo@issueflow.dev`
- Password：`issueflow`

本地开发服务器输出中的 Sites 测试身份和产品演示账号是两个概念。产品登录仍通过登录页完成。

## 第一次完整操作

按顺序完成：

1. 登录；
2. 在 Issue 列表搜索一个关键词；
3. 新建一条 Issue；
4. 编辑标题或优先级；
5. 在看板改变状态；
6. 添加一条评论；
7. 上传一个允许的附件；
8. 删除刚创建的 Issue。

每一步都打开 DevTools 的 Network 面板。先观察，不急着读代码。记录：

- 请求方法与 URL；
- 请求体；
- 响应状态；
- 响应 JSON 或空响应；
- 是否包含 Cookie；
- 页面何时出现 Loading、成功或错误反馈。

## 保存质量基线

首次运行 E2E 前安装 Chromium：

```powershell
cd frontend
npx playwright install chromium
```

前端质量门：

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

后端质量门：

```powershell
cd ..
dotnet build IssueFlow.slnx
dotnet test IssueFlow.slnx
dotnet format IssueFlow.slnx --verify-no-changes
```

这些命令的职责不同：

| 命令           | 保护的风险                    |
| -------------- | ----------------------------- |
| Format         | 无意义格式差异和不可读代码    |
| Lint           | 可疑模式、Hook 规则、无效写法 |
| Typecheck      | 编译期 Contract 不一致        |
| Unit/Component | 逻辑边界和用户交互            |
| Build          | 模块边界、服务端/客户端打包   |
| E2E            | 浏览器中的关键用户旅程        |
| .NET Test      | 后端 HTTP Contract 与安全边界 |

## 学习分支约定

```powershell
git switch -c learning/due-soon
```

一个分支只做一个实验。推荐提交顺序：

1. `test: describe due-soon behavior`
2. `feat: show due-soon badge`
3. `docs: record due-soon findings`

不要把格式化整个仓库、依赖升级和功能练习放在同一个提交中。

## 常见错误

- 开发服务器仍在运行旧环境变量；修改 `.env.local` 后没有重启。
- 一次启动两套后端，却不知道请求实际去了哪里。
- E2E 失败后只重试，不阅读第一个失败断言。
- 为了“修好”测试而改断言，却没有确认产品行为。
- 在 `main` 上做所有实验，无法比较或撤销。

## 本章验收

不看本文，回答：

1. Typecheck 通过为什么不能证明网络 JSON 可信？
2. Build 与 E2E 分别能发现什么问题？
3. 一个练习导致失败时，你如何证明不是初始环境问题？
4. 为什么建议一个练习一个分支？

能够重新执行完整质量门并解释每个命令的作用后，再进入下一章。

下一章：[01：项目地图与数据模式](01-project-map-and-data-modes.md)
