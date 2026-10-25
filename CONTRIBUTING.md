# Contributing to Smart Capture

Thank you for your interest in contributing to Smart Capture!

## Code Quality Standards

1. **TypeScript Strictness**: No implicit `any`. All props, domain models, and API responses must be strongly typed.
2. **Mobile First**: All camera UI controls must be tested for touch usability, bright-sunlight contrast, and single-handed mobile ergonomics.
3. **No Secret Leaks**: Pre-commit reviews must guarantee zero private keys or production secrets enter the repository.
4. **Automated Testing**: Any new camera feature, VIN utility, or export function must include corresponding unit tests (`Vitest`) and E2E verification (`Playwright`).

## Development Workflow

```bash
# Install dependencies
npm ci

# Start local dev server
npm run dev

# Run unit tests
npm test

# Run Playwright E2E tests
npm run test:e2e
```
