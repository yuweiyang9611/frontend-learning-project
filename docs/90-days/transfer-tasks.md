# 阶段迁移任务：离开 IssueFlow 再做一次

迁移任务使用全新领域验证真正理解。每题限时 45–60 分钟，禁止复制 IssueFlow 的状态名、
类型和测试数据。每题必须留下一个正常输入、一个边界输入、一个失败输入以及对应证据。

## W4：活动报名表 {#w04-event-registration}

实现姓名、邮箱、场次和无障碍需求字段。要求语义化 label/fieldset、320px 响应式布局、
键盘提交、错误摘要和修正后的焦点恢复。失败变体由验收者临时给出一个新场次值。

## W7：库存批次 Decoder {#w07-inventory-batch}

设计 `perishable | durable | digital` 判别联合；易腐批次必须携带真实日历日期
`expiresOn`。输入始终先视为 `unknown`，同时覆盖闰日、未知 kind、缺字段和多错误收集。

## W10：阅读清单 Query {#w10-reading-list}

`owner + filter + page` 组成缓存身份。实现 archive mutation 的乐观更新、500 回滚和两次
乱序请求保护；测试不得使用固定 sleep。验收者会提供正文未出现的 owner/filter 组合。

## W11：预约系统 Contract {#w11-appointment-contract}

定义预约创建与修改 Contract：`note` 允许省略和显式 `null`，重复时段返回 409，
匿名与越权分别返回 401/403。使用同一 corpus 对至少两个 adapter 运行，并核对 Problem
Details，不允许根据后端名称跳过断言。

## W12：陌生回归缺陷 {#w12-unseen-regression}

给出一个与 IssueFlow 无关的图书借阅小组件：快速切换读者时，较慢的旧请求会覆盖新读者结果。
先写一个能稳定复现乱序响应的失败测试，再定位请求身份与状态提交边界，提交最小修复，并把同一测试接入 CI。
验收者会更换延迟顺序和读者 ID，测试不得依赖固定 `sleep` 或页面文本快照。

## 统一验收

- 每题至少 3 个确定性用例，且一个输入不在正文示例中；
- 能解释输入边界、内部模型、输出和失败恢复；
- 证据写入 `learning-evidence/day-NN/`，不得包含凭据或真实个人信息；
- 使用 4 级提示后，必须关闭提示再完成一个变化后的输入。
