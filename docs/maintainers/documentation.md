---
search: false
---

# 维护学习文档

## 1. 信息架构

文档按职责拆分：

- `docs/90-days`：13 周、91 天的执行主线、进度与考核；
- `docs/learning`：00–12 知识专题，供日课引用和复习；
- `docs/typescript`：可反复查阅的 TypeScript 专题；
- `docs/backend`：.NET 与双后端专题；
- `docs/reference`：需求、源码路线、术语、资料和模板；
- `docs/maintainers`：贡献者流程；
- `docs/archive`：历史设计，只读保存。

根 README 是项目入口，不承载完整课程。旧入口只做兼容导航。

## 2. 当前事实的来源

优先级：

1. 可运行源码、测试和配置；
2. `docs/reference/product-requirements.md`；
3. 当前学习章节；
4. 历史原始设计。

若文档与源码冲突，应先确认产品意图，再修正文档或实现。不能为了让旧稿“正确”而扭曲当前代码。

## 3. 章节模板

91 天课程的每周文件必须恰好包含 7 个连续 Day。每个 Day 至少包含：

1. 明确的 120 分钟任务分配；
2. 需要理解的问题或概念；
3. 源码追踪或可运行实验；
4. 关闭步骤说明后的独立变体；
5. 可以留存的测试、diff 或观察证据；
6. 验收问题与未通过时的补救动作。

知识专题至少包含：

1. 本章目标；
2. 前置知识；
3. 心智模型；
4. 真实源码链接；
5. 最小实验；
6. 故障/边界实验；
7. 测试；
8. 常见误区；
9. 验收问题；
10. 上一章/下一章。

专题可调整结构，但必须提供源码、实践和验收。

## 4. 写作规则

- 用“当前实现是……”而非空泛最佳实践；
- 明确“已实现”“建议练习”“生产还需要”；
- 命令标注执行目录；
- 环境变量说明优先级与重启要求；
- 代码片段只保留教学所需上下文；
- 不复制长源码，链接到真实文件；
- 不声称类型断言是运行时验证；
- 不声称客户端 Route Guard 是授权；
- 不声称两套 API 行为完全等价；
- 不写真实 Cookie、Token、个人邮箱或 Secret。

## 5. 链接

- `docs` 内课程页面使用相对链接；
- 指向 `docs` 之外源码的链接使用 GitHub `blob/main` 完整地址；
- 指向源码目录的链接使用 GitHub `tree/main` 完整地址；
- 目录名含特殊字符时 URL encode；
- 外部资料优先官方；
- 移动文档时保留旧入口兼容页；
- 新增文件后从最近索引链接，避免孤儿页；
- 不为每个重复概念复制同一段，链接唯一说明。

## 5a. 可运行的代码块与五步带子

学习站会把课程页里的 ```ts / ```js 代码块变成可以在浏览器里运行的面板（`.nb-code`，带 运行、改一改再跑、复制），
用 esbuild-wasm 转译后在 `sandbox="allow-scripts"` 的 iframe 里执行，5 秒超时，输出最多 64 KB。
规则在 `docs/.vitepress/theme/run-code.mjs`，构建时逐块判定，页面和带子读同一个判定：

- 可运行：纯 TypeScript 或 JavaScript，没有 `import` / `export` / `require`，不碰 DOM、存储和网络
  （`document`、`window`、`localStorage`、`fetch`），不是 TSX，不用 React，没有 `@ts-expect-error`
  （只转译不检查类型，负例无法在浏览器里报错），而且构建时在 Node 里空跑一次没有抛错、转译后不是只剩类型声明；
- 其余代码块保持原来的渲染；
- 信息串可以强制：````ts run```` 一定变成面板（跳过空跑），````ts no-run```` 一定不变。
  写负例、片段或依赖上下文变量的代码时用 `no-run`，想让读者改着玩的完整小程序用 `run`。

每一课（13 个周页、learning、typescript、backend 的章节页）顶部有一行五步带子（套件的 `.nb-steps`）：
读、看代码、跑、自测、记一笔。状态只从记录来，带子本身不能点勾：

- 读：打开过这一页（周页也算有任何一天的记录）；
- 看代码：点过面板的标签、改一改再跑或复制，或者跑过；没有面板的课画成虚线；
- 跑：在这一页跑成功过一次；
- 自测：这一周的闭卷测验每一题都答对过一次（周页以外是虚线）；
- 记一笔：这一周有一条不少于 20 字的当天复盘（周页以外是虚线）。

读、看代码、跑写在第三个本机记录 `issueflow:frontend-learning-project:visits:v1`
（`{ app, schemaVersion: 1, pages: { "typescript/01-…": { readAt, codeAt, ranAt } } }`，每个字段只写第一次）；
进度和复习记录的键和字段不变，首页的“接着做”读最早一个有“停在这里”的课。

## 6. 代码路径核对

文档合并前：

1. 检查所有 Markdown 相对链接；
2. 对源码链接确认文件存在；
3. 搜索旧路径；
4. 搜索已变化的课程数量/版本/端口；
5. 从一个全新读者入口点击到目标章节。

Windows 路径大小写不敏感，但 CI/部署环境可能敏感，链接大小写应与真实文件一致。

## 7. 历史存档

`docs/archive/original-curriculum` 是原始 6215 行设计的无损分段。规则：

- 不在 archive 中悄悄修正当前事实；
- 需要勘误时在存档索引写注释；
- 新日课进入 `90-days`，深入讲义进入 `learning/typescript/backend`；
- 根兼容页保留；
- 若再次拆分，验证拼接后内容逐字一致。

## 8. 格式与验证

现行文档使用 Prettier；历史原文分段不格式化，否则就不再是无损存档：

```powershell
cd frontend
npx prettier --check "../README.md" "../LEARNING_GUIDE.md" "../frontend_learning_project_detailed.md" "../docs/README.md" "../docs/90-days/**/*.md" "../docs/learning/**/*.md" "../docs/typescript/**/*.md" "../docs/backend/**/*.md" "../docs/reference/**/*.md" "../docs/maintainers/**/*.md" "../docs/archive/original-curriculum/README.md" "src/features/typescript-lab/README.md"
```

再运行仓库的链接/路径检查（若已加入脚本）和：

```powershell
npm ci
npx playwright install chromium
npm run docs:verify

git diff --check
rg -n "11 lessons|完全等价|纯 Vite SPA|Tailwind" README.md docs frontend/src/features/typescript-lab/README.md
```

`docs:verify` 会依次运行状态单元测试、课程与链接检查、生产构建，以及文档站的
Playwright + axe 浏览器测试。浏览器测试覆盖进度门槛与刷新、周测进入错题队列、
复习题键盘/单选组语义、浅色/深色主题和 360px 窄屏；首次运行前需要安装 Chromium。

命中不一定错误；要逐项判断语境。

## 9. 更新触发器

发生以下变化时必须检查文档：

- 路由或页面；
- 环境变量/数据模式；
- API 字段、status、错误码；
- TypeScript Lab 课程；
- package script 或运行版本；
- 上传规则；
- 测试数量/CI job；
- 部署平台；
- 已知双后端差异。

## 10. Review 清单

- [ ] 章节职责单一，未重新形成巨型文档。
- [ ] 91 天课程仍为 13 周、91 个连续 Day、每天明确 120 分钟。
- [ ] 从 `docs/README.md` 可找到。
- [ ] 上下章导航正确。
- [ ] 源码链接存在且大小写一致。
- [ ] 代码/命令与当前脚本一致。
- [ ] 已实现与练习建议分开。
- [ ] 没有个人信息或 Secret。
- [ ] archive 未被当成当前 truth。
- [ ] Markdown 格式和链接检查通过。
- [ ] `npm run docs:build` 无死链或 Markdown 编译错误。

[返回维护者索引](../README.md)
