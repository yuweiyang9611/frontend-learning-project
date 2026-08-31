# 00：开始之前

[学习路线索引](./) · 下一章：[项目地图与数据模式](01-project-map-and-data-modes.md)

## 本章目标

完成本章后，你应当拥有一个可重复的学习基线：

- 知道需要哪些运行环境；
- 能启动默认前端与同源 API；
- 能使用演示账号完成一次 Issue 生命周期；
- 能运行前端格式、Lint、类型检查、单元测试、构建和 E2E，并知道 .NET 门禁从 Day 71 开始；
- 会为每个练习创建小分支和小提交。

## 为什么先建立基线

学习项目最常见的问题不是“不会写代码”，而是不知道错误来自原项目、运行环境还是自己的改动。基线的作用类似后端项目中的健康检查和回归套件：开始练习前全部为绿，练习后出现的红灯才有诊断价值。

不要一上来同时修改前端、D1 和 .NET 后端。先证明仓库原始状态可运行，再一次只改变一个边界。

## 环境要求

- Node.js 22.13 或更高版本；
- npm 11 或更高版本；
- .NET SDK 10（Day 01–70 可暂未安装，进入 Day 71 前必须补齐）；
- Chrome 或 Edge；
- Git。

检查版本：

```powershell
node --version
npm --version
git --version
npm run learn:check -- --day 01

# Day 01–70 可选；未安装时 learn:check 显示 WARN，不会阻断前端课程
dotnet --version
```

Node、npm 或 Git 不满足要求时先修复环境，不要通过删除 lockfile 或随意降级依赖绕过问题。
.NET SDK 10 在前 70 天只显示提醒；最迟在 Day 71 开始前运行
`npm run learn:check -- --day 71`，此时缺失或版本不符会成为硬失败。

### 第一次安装与 PATH 恢复

1. Windows 使用 Node.js、Git 和 .NET 官方安装器；macOS 可使用官方安装器或同一个可信包管理器。
   零基础学习者可以先装 Node.js 与 Git，把 .NET SDK 安排在第 10 周结束前。
2. 安装时保留“加入 PATH”选项，结束后关闭全部终端再重新打开。
3. 在仓库根目录运行 `npm run learn:check -- --day 01`。脚本只诊断版本，不会修改或自动安装系统软件；
   此时 .NET 缺失只会显示 `WARN`。
4. 如果显示 “not found”，先用 `where.exe node`（Windows）或 `command -v node`（macOS/Linux）
   确认路径；不要复制别人的绝对用户目录。
5. 克隆仓库后先运行根目录 `npm ci`，再运行 `npm --prefix frontend ci`。lockfile 安装失败时
   保存完整错误，先检查 Node 版本、代理和当前目录，不要删除 lockfile。

推荐使用 VS Code 或其他能显示 TypeScript 诊断、集成终端和 Git diff 的编辑器。第一次启动前，
确认终端当前目录以 `frontend-learning-project` 结尾，并运行：

```powershell
npm run learn:check
npm run learn:create -- --day 08
npm run learn:start
```

浏览器打开终端打印的 `127.0.0.1` 地址。支架只绑定本机，不要把开发服务器暴露到局域网、
公网隧道或共享机器。工作区已存在时创建器会拒绝覆盖；先保存或重命名旧目录再继续。

`learn:create` 也认识后期课程。例如 `npm run learn:create -- --day 71` 会同时生成当天的前端
Contract 测试和 xUnit 红灯支架；Day 80/90 会生成 Playwright 支架，Day 83 会生成最小权限
workflow 支架。生成器只创建缺失文件，已经存在的学习者文件会原样保留。想先查看将创建什么，运行：

```powershell
npm run learn:create -- --day 71 --dry-run
```

支架中的 `LEARNING_TODO` 是有意保留的失败点。先运行 `npm run learn:day -- 71`，确认失败原因
指向当天任务，再用自己的断言和证据替换它；不要仅删除标记让检查变绿。

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

前三条后端命令从 Day 71 起才是必做门禁。前 70 天若尚未安装 .NET，不要把 `WARN` 当成
前端实验失败；记录安装计划并继续当天的 HTML、CSS、JavaScript、TypeScript 或 React 任务。

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
