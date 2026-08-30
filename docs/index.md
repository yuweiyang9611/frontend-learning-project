---
layout: home
titleTemplate: false

hero:
  name: "IssueFlow 学习站"
  text: "用 91 天建立现代前端工程能力"
  tagline: "每天至少 2 小时，沿着真实 Issue Tracker 完成 182 小时课程、实验、周测与毕业项目。"
  actions:
    - theme: brand
      text: 开始 91 天课程
      link: /90-days/
    - theme: alt
      text: 第 1 天
      link: /90-days/week-01-foundations
    - theme: alt
      text: 复习中心
      link: /90-days/review-center
    - theme: alt
      text: 查看 GitHub
      link: https://github.com/yuweiyang9611/frontend-learning-project

features:
  - icon: "01"
    title: 对零前端经验友好
    details: 从浏览器、HTML、CSS 和 JavaScript 开始，逐步进入 TypeScript 与 React。
  - icon: "TS"
    title: TypeScript 深入学习
    details: 四周强化、九个专题、十二个可运行 Lab 与 24+ 道分级练习，覆盖编译期建模与运行时边界。
  - icon: "→"
    title: 源码驱动
    details: 每一章都连接到真实页面、组件、API、测试与持久化实现。
  - icon: "API"
    title: 双后端对照
    details: 比较 D1/R2 与 .NET/SQLite 的 Shape、Error 和 Behavioral Contract。
  - icon: "✓"
    title: 实验与验收
    details: 用每日目标检查、13 次闭卷周测、错题重练、间隔复习和口试完成反馈闭环。
  - icon: "CI"
    title: 工程质量
    details: 覆盖可访问性、响应式、Vitest、Playwright、.NET 集成测试与 CI。
---

## 推荐学习顺序

1. 打开 [91 天课程总览](90-days/)，准备学习日志并完成基线检查。
2. 每天按 120 分钟结构完成概念、源码、实验、独立任务与验收。
3. 每 7 天提交一个可运行作品，完成闭卷周测与口试；错题进入[间隔复习中心](90-days/review-center.md)。
4. 第 13 周完成跨前端、双后端与测试的毕业功能切片。

> 每次只学一章：运行 → 观察 → 追踪 → 修改 → 测试 → 复盘。

## 三条学习路径

| 你的情况        | 建议入口                                                          | 第一阶段成果                             |
| --------------- | ----------------------------------------------------------------- | ---------------------------------------- |
| 没有前端经验    | [从 91 天课程开始](90-days/)                                      | 每周交付一个可运行、可验收的学习作品     |
| 有 C#/.NET 经验 | [从 C# 到 TypeScript](typescript/01-from-csharp-to-typescript.md) | 能区分结构类型、运行时值与 Wire Contract |
| 已会基础前端    | [源码追踪路线](reference/source-traces.md)                        | 能沿页面、状态、API 和测试追踪完整功能   |

::: tip 不需要先读完整个仓库
先完成一个可观察的小实验，再追踪它经过的组件、类型、请求和测试。遇到陌生术语时使用右上角搜索或查阅[术语表](reference/glossary.md)。
:::

## 选择你的入口

- **第一次学习：**[91 天、182 小时完整课程](90-days/)
- **按主题复习：**[00–12 知识专题](learning/)
- **订正与间隔复习：**[错题与复习中心](90-days/review-center.md)
- **重点补类型系统：**[TypeScript 专题索引](typescript/)
- **理解 API 与持久化：**[后端对照专题](backend/)
- **按功能阅读源码：**[源码追踪路线](reference/source-traces.md)
- **查看完整功能边界：**[产品需求](reference/product-requirements.md)

## 学习时会用到什么

- **真实产品：**登录、Issue CRUD、评论、附件、看板、设置和 TypeScript Lab。
- **真实边界：**浏览器、React 状态、HTTP、D1/R2、.NET/SQLite 与文件上传。
- **真实质量门：**类型检查、单元测试、浏览器测试、后端集成测试和 CI。
- **可验证练习：**每章提供观察点、故障实验、常见误区与完成标准。

[查看全部课程与参考资料](README.md)
