# 维护学习文档

## 1. 信息架构

文档按职责拆分：

- `docs/learning`：00–12 顺序主线；
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

顺序章节至少包含：

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

- 同仓库文件使用相对链接；
- 目录名含特殊字符时 URL encode；
- 外部资料优先官方；
- 移动文档时保留旧入口兼容页；
- 新增文件后从最近索引链接，避免孤儿页；
- 不为每个重复概念复制同一段，链接唯一说明。

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
- 新课程内容进入 learning/typescript/backend；
- 根兼容页保留；
- 若再次拆分，验证拼接后内容逐字一致。

## 8. 格式与验证

现行文档使用 Prettier；历史原文分段不格式化，否则就不再是无损存档：

```powershell
cd frontend
npx prettier --check "../README.md" "../LEARNING_GUIDE.md" "../frontend_learning_project_detailed.md" "../docs/README.md" "../docs/learning/**/*.md" "../docs/typescript/**/*.md" "../docs/backend/**/*.md" "../docs/reference/**/*.md" "../docs/maintainers/**/*.md" "../docs/archive/original-curriculum/README.md" "src/features/typescript-lab/README.md"
```

再运行仓库的链接/路径检查（若已加入脚本）和：

```powershell
git diff --check
rg -n "11 lessons|完全等价|纯 Vite SPA|Tailwind" README.md docs frontend/src/features/typescript-lab/README.md
```

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
- [ ] 从 `docs/README.md` 可找到。
- [ ] 上下章导航正确。
- [ ] 源码链接存在且大小写一致。
- [ ] 代码/命令与当前脚本一致。
- [ ] 已实现与练习建议分开。
- [ ] 没有个人信息或 Secret。
- [ ] archive 未被当成当前 truth。
- [ ] Markdown 格式和链接检查通过。

[返回维护者索引](../README.md)
