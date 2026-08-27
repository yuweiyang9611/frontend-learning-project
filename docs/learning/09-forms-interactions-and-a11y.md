# 09：表单、复杂交互与可访问性

## 本章目标

本章把“能点击”提升为“在正常、错误、键盘和窄屏条件下都能完成任务”。重点包括受控表单、客户端/服务端校验、焦点管理、Modal、Toast、拖放替代方案和文件上传。

## 1. 受控表单

[IssueForm.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/issues/IssueForm.tsx) 让 React State 成为字段值来源。输入事件更新 State，value 再回到控件。

优点：

- 可以统一规范化标签；
- 容易显示字符数和条件 UI；
- 客户端校验能直接读取完整模型；
- 新建和编辑可复用同一表单。

代价是每次输入都会渲染，需要正确拆分组件和状态，不应盲目把所有字段提升到应用顶层。

## 2. 泛型字段更新器

字段更新器可以用 `keyof` 保持 key 与 value 关联。重点不是把类型写得“很高级”，而是防止给 `dueDate` 传数组、给 `tags` 传字符串等错误。

详细推导见 [泛型、Utility Types 与 keyof](../typescript/03-generics-utilities-and-keyof.md)。

## 3. 客户端与服务端校验

客户端校验提供即时反馈，服务端校验建立可信边界。二者不能互相替代。

项目规则包括：

- 标题必填且不超过 100 字符；
- 描述不超过 5000 字符；
- 截止日期不能早于今天；
- 重复标题可能返回 409；
- 负责人必须存在；
- 上传限制类型、大小和内容特征。

服务端返回字段错误后，页面通过 `ApiError.errors` 合并到表单。应保留用户已输入的值，而不是因为失败清空表单。

## 4. 错误后的焦点

提交失败时，[IssueForm.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/issues/IssueForm.tsx) 找到第一个错误字段并聚焦。这样键盘和屏幕阅读器用户能直接开始修复。

验收顺序：

1. 错误摘要或字段错误出现；
2. 焦点移到第一个错误字段；
3. 字段具有 `aria-invalid`；
4. 字段通过 `aria-describedby` 关联错误；
5. 修复后错误关系清除；
6. 再提交不会重复触发。

## 5. Modal 的完整行为

[ui.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/components/ui.tsx) 的 Modal 不只是一块遮罩。一个合格对话框至少需要：

- `role="dialog"` 和 `aria-modal="true"`；
- 可访问标题与可选描述；
- 打开后焦点进入；
- Tab/Shift+Tab 留在对话框；
- Escape 关闭；
- 关闭后焦点回到原触发器；
- 背景不应误操作；
- pending 时明确哪些关闭路径可用。

只检查视觉居中会漏掉大部分功能。

## 6. Toast 与动态消息

Toast 容器用 `aria-live="polite"` 播报新增消息。成功、错误和信息应同时用文字与图标表达，不能只依赖颜色。

Toast 适合短暂、非阻塞反馈；字段校验不能只放 Toast，因为消息消失后用户不知道哪个字段要修。

## 7. 拖放必须有键盘替代

[BoardPage.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/screens/BoardPage.tsx) 支持拖动卡片，也提供 status select 作为键盘替代。拖放不是唯一操作路径，因为：

- 键盘用户无法使用指针拖动；
- 触控和精细动作可能困难；
- 拖放状态不容易被辅助技术理解；
- 自动化测试更难稳定表达。

### 验收

只用键盘把一个 Issue 从 Open 改为 Resolved，确认：

- 可以到达控件；
- 当前状态有可访问名称；
- pending 可见；
- 成功或失败被播报；
- 失败时回滚。

## 8. 移动抽屉

[AppLayout.tsx](https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/layouts/AppLayout.tsx) 管理菜单按钮、抽屉关闭和焦点归还。审计时检查：

- 按钮有 `aria-expanded` 和 `aria-controls`；
- 打开后焦点位置合理；
- Escape 和关闭按钮可用；
- 路由导航后抽屉关闭；
- 关闭后焦点回菜单按钮；
- 背景是否仍可 Tab 到达。

当前实现可以作为进一步增加完整 focus trap/inert 背景的练习，不要在文档中把未实现能力写成已完成。

## 9. 上传交互

前端先提供可理解的文件选择和错误反馈，但安全判断最终由服务端完成。

测试矩阵：

| 文件                  | 预期                 |
| --------------------- | -------------------- |
| 合法 PNG/JPEG/PDF/TXT | 上传成功并显示元数据 |
| 超过 5 MB             | 清晰拒绝             |
| 扩展名伪装的 PDF      | 服务端按内容拒绝     |
| 空文件                | 拒绝或明确策略       |
| 网络中断              | 保留页面和重试机会   |

FormData 请求不能手工固定 multipart boundary，浏览器会生成。

## 10. Reduced Motion 与对比度

第 03 章指出当前缺少明显的 reduced-motion 全局规则。改进时：

1. 在系统中启用减少动态效果；
2. 记录当前动画；
3. 增加媒体查询；
4. 验证反馈仍清楚，不能把 loading/pending 指示一并消掉；
5. 检查 light/dark 两种主题对比度。

## 11. 端到端键盘任务

不用鼠标完成：

1. 登录；
2. 打开 Issues；
3. 搜索并排序；
4. 新建 Issue；
5. 修复一次校验错误；
6. 在 Board 修改状态；
7. 打开详情、评论并删除；
8. 打开和关闭确认 Modal；
9. 登出。

记录每次 Tab 后的焦点、动态播报和不可达点。发现问题后先写最小自动化或复现步骤，再修复。

## 常见误区

- ARIA 不能修复错误的键盘行为。
- disabled 与 aria-disabled 的行为不同。
- 颜色和 placeholder 不能独立承担信息。
- 拖放成功不代表所有人都能完成操作。
- 客户端文件类型检查不是安全边界。

## 本章验收

- [ ] 能解释客户端与服务端校验分工。
- [ ] 能验证首个错误字段焦点。
- [ ] 能列出 Modal 的完整焦点生命周期。
- [ ] 能用键盘替代拖放完成状态更新。
- [ ] 能为上传写出成功、伪造、过大和网络失败测试。

[上一章：服务端状态与 API](08-server-state-and-api.md) · [下一章：持久化、双后端与安全边界](10-persistence-backends-and-security.md)
