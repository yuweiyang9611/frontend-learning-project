# TypeScript 27 题可运行工作台

1. 在 manifest.json 找到题号并先写预测。
2. 在 workbench.ts 中只替换该题的 todo 函数。
3. 运行 npm run exercise:test -- B01。
4. 红灯时按 manifest 的 1–4 级提示逐级使用；记录最高等级。
5. 通过后运行 npm run exercise:verify，确认 27 题参考 Contract 和编译负例仍为绿。
6. 最后查看 reference.ts，并换一个输入重新实现，避免背答案。

每题至少有三个运行时契约；compile-time-checks.ts 由 tsc 验证负例。CI 默认验证参考实现，
不会因为尚未完成的 workbench 题目阻塞仓库。
