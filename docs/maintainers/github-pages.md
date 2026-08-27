# GitHub Pages 发布与维护

本页说明 IssueFlow 学习站怎样从拆分后的 Markdown 构建并发布。它属于维护者文档，不是前端主线课程。

## 1. 发布边界

GitHub Pages 只发布静态学习文档，不运行 IssueFlow 产品本身，也不承载 D1/R2、R2
附件或 .NET API。产品运行方式仍以[第 00 章](../learning/00-getting-started.md)和[数据模式说明](../learning/01-project-map-and-data-modes.md)为准。

| 内容               | 位置                                               | 是否发布到 Pages           |
| ------------------ | -------------------------------------------------- | -------------------------- |
| 现行课程           | `docs/learning`、`docs/typescript`、`docs/backend` | 是                         |
| 参考资料           | `docs/reference`                                   | 是                         |
| 维护说明           | `docs/maintainers`                                 | 是，但不放在主导航         |
| 原始设计索引       | `docs/archive/original-curriculum/README.md`       | 是                         |
| 10 个无损历史分段  | `docs/archive/original-curriculum/0*.md`           | 否，改为链接 GitHub 原文件 |
| 产品源码和构建产物 | `frontend`、`backend`                              | 否                         |

历史分段被排除，是因为它们必须逐字保留，而且包含拆分前的跨章节锚点。这样既不修改历史证据，也不会让旧材料污染现行课程的全文搜索。

## 2. 本地运行

在仓库根目录安装学习站依赖：

```powershell
npm install
npm run docs:dev
```

终端会给出本地地址。项目站配置了
`/frontend-learning-project/` 基础路径，因此测试链接时必须保留这个路径。

执行与 GitHub Pages 相同的生产构建：

```powershell
npm ci
npm run docs:build
npm run docs:preview
```

静态产物只会写入 `docs/.vitepress/dist`，它已被 Git 忽略，不应提交。

## 3. 信息架构

- `docs/index.md` 是在线首页；
- `learning/README.md`、`typescript/README.md` 与 `backend/README.md`
  通过 VitePress rewrite 映射为各目录首页；
- `docs/.vitepress/config.mts` 维护顶部导航、分区侧栏、中文搜索和上一页/下一页；
- `docs/.vitepress/theme/custom.css` 只调整品牌变量、排版、表格和移动端体验；
- `frontend/public/favicon.svg` 与 `frontend/public/og.png` 被复用为站点品牌资源。

不要再创建一个巨型 Markdown 入口。新增知识应放入职责明确的章节，并从最近的专题索引和侧边栏各链接一次。

## 4. 链接规则

VitePress 的内容根是 `docs`。因此：

- 课程之间继续使用相对 Markdown 链接；
- 指向 `frontend`、`backend`、`.github` 或仓库根文件时，使用完整的 GitHub
  `blob/main` 地址；
- 指向目录时使用 `tree/main` 地址；
- 不用 `ignoreDeadLinks: true` 掩盖错误；
- 改名或移动章节后，要同时检查正文导航、侧边栏与索引页。

生产构建会验证站内链接。源码链接由 GitHub 打开，使仓库 Markdown 阅读和 Pages
在线阅读得到一致结果。

## 5. 自动发布

`.github/workflows/pages.yml` 在以下情况运行：

1. `main` 上与学习站有关的文件发生变化；
2. 维护者从 Actions 页面手动触发。

工作流先用固定 lockfile 安装依赖并执行 `npm run docs:build`，然后只上传
`docs/.vitepress/dist`。部署 job 使用 GitHub Pages environment，并只获得
`pages: write` 与 `id-token: write` 所需权限。

普通 CI 也构建学习站，因此 Pull Request 会在合并前发现 Markdown 解析和站内死链。

## 6. 基础路径与地址

仓库项目页地址是：

<https://yuweiyang9611.github.io/frontend-learning-project/>

对应配置必须保持：

```ts
base: "/frontend-learning-project/";
```

只有迁移到用户主页仓库或自定义域名时，才把 `base` 改成 `/`。修改后要测试首页、深层章节、搜索结果、Logo 和社交分享图。

## 7. 发布检查

- [ ] `npm ci` 使用已提交的 `package-lock.json`。
- [ ] `npm run docs:build` 成功。
- [ ] 首页、学习路线、TypeScript、后端和参考侧边栏均可打开。
- [ ] 搜索“数据模式”“Problem Details”“TypeScript Lab”能找到预期章节。
- [ ] 源码链接打开 GitHub 中的真实文件。
- [ ] 浅色、深色和窄屏布局可读。
- [ ] Actions 中 Pages deployment 成功。
- [ ] 线上首页和一个深层 URL 返回 HTTP 200。

## 8. 故障排查

### 首页有样式，深层链接 404

先检查 `base` 是否仍是仓库名路径，再确认 Markdown 链接指向站内文档而不是构建产物。

### 构建报告 dead link

不要全局忽略。找到报错页面：课程目标应保留为相对链接；源码目标应改为 GitHub
完整地址；已排除的历史原稿也应链接到 GitHub。

### GitHub Pages 工作流没有触发

确认变更路径在 workflow 的 `paths` 列表中，或手动运行工作流。首次发布还要确认
仓库 Settings → Pages 的 Build and deployment source 为 GitHub Actions。

### 回滚

学习站是静态产物。回滚导致问题的提交并推送到 `main`，工作流会重新构建和部署。
不要手工修改 `gh-pages` 分支，也不要提交 `dist`。

## 9. 公开内容检查

GitHub Pages 是公开站点。文档中只允许演示账号和本地地址，不写真实 Cookie、Token、
Secret、个人邮箱或内部服务地址。发布前仍应执行仓库的 Secret/个人信息检查。

[返回文档总索引](../README.md)
