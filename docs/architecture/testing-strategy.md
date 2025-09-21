# Testing Strategy

## Test Organization

```
tests/
├── unit/
│   ├── analysis/
│   │   ├── demand.test.ts
│   │   └── profit.test.ts
│   └── components/
│       └── OpportunityCard.test.tsx
├── integration/
│   ├── api/
│   │   └── analyze.test.ts
│   └── db/
│       └── queries.test.ts
└── e2e/
    └── dashboard.spec.ts
```

## Test Examples

### Unit Test

```typescript
// tests/unit/analysis/profit.test.ts
import { calculateProfit } from '@/lib/analysis/profit'

describe('Profit Calculation', () => {
  it('should calculate correct profit margin', () => {
    const result = calculateProfit(100, 150)
    expect(result.margin).toBe(50)
    expect(result.percentage).toBe(50)
  })
})
```

### Integration Test

```typescript
// tests/integration/api/analyze.test.ts
describe('GET /api/analyze', () => {
  it('should return opportunities', async () => {
    const response = await fetch('/api/analyze')
    const data = await response.json()
    expect(data.opportunities).toBeDefined()
    expect(Array.isArray(data.opportunities)).toBe(true)
  })
})
```
