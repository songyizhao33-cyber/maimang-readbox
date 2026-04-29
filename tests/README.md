# Tests

## 测试策略

本项目采用分层测试策略:

1. **单元测试**: 测试独立函数和组件
2. **集成测试**: 测试 API 端点和数据库交互
3. **E2E 测试**: 测试完整用户流程

## 测试工具 (待配置)

- **单元测试**: Vitest + React Testing Library
- **E2E 测试**: Playwright
- **API 测试**: Supertest

## 运行测试 (待实现)

```bash
pnpm test          # 运行所有测试
pnpm test:unit     # 运行单元测试
pnpm test:e2e      # 运行 E2E 测试
pnpm test:coverage # 生成覆盖率报告
```

## 测试覆盖率目标

- 核心业务逻辑: 80%+
- API 端点: 70%+
- UI 组件: 60%+

## 当前状态

⏳ 测试框架尚未配置,这是后续任务之一。