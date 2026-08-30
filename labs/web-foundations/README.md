# Web Foundations 可运行支架

三个快照让零经验学习者从相同、可恢复的基线开始：

- Day 08：语义 HTML 与表单；
- Day 15：CSS、响应式和焦点；
- Day 22：JavaScript 模块、DOM、Fetch 与确定性测试。

`npm run learn:create -- --day NN` 会复制快照且绝不覆盖现有工作。`npm run learn:start`
启动静态站和成功、404、500、延迟 API fixture；
`npm run learn:test:web -- --day NN` 验证 `learning-work` 中你的作品，而不是不可变的参考快照。
仓库维护者可用 `npm run learn:test:web:baseline` 检查 Day 22 支架自身。
