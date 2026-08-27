# TypeScript Lab

学习者请阅读：

- [TypeScript 专题索引](../../../../docs/typescript/README.md)
- [12 课实验手册](../../../../docs/typescript/06-lab-workbook.md)

维护者请阅读 [扩展 TypeScript Lab](../../../../docs/maintainers/typescript-lab.md)。

快速验证：

```powershell
cd frontend
npm run typecheck
npm test -- src/features/typescript-lab/examples.test.ts src/screens/TypeScriptLabPage.test.tsx
```

Runner 必须保持预编译、确定、无副作用；禁止 `eval`、`new Function`、API 调用和产品数据写入。
