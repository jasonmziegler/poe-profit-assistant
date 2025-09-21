import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'

describe('Build integration', () => {
  it('should pass type checking', () => {
    expect(() => {
      execSync('npm run type-check', { stdio: 'pipe' })
    }).not.toThrow()
  })

  it('should pass linting', () => {
    expect(() => {
      execSync('npm run lint:check', { stdio: 'pipe' })
    }).not.toThrow()
  })

  it('should validate package.json scripts exist', () => {
    const packageJson = require('../../package.json')

    expect(packageJson.scripts.dev).toBeDefined()
    expect(packageJson.scripts.build).toBeDefined()
    expect(packageJson.scripts.test).toBeDefined()
    expect(packageJson.scripts['type-check']).toBeDefined()
    expect(packageJson.scripts['lint:check']).toBeDefined()
  })
})