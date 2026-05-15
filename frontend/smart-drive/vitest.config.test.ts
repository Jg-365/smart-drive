import { describe, it, expect } from 'vitest'
import { SD } from '@/lib/sd-tokens'

describe('path alias + design tokens', () => {
  it('resolves @/lib/sd-tokens to an object with a primary property', () => {
    expect(SD).toBeTypeOf('object')
    expect(SD).toHaveProperty('primary')
  })

  it('SD.primary equals #00E5FF', () => {
    expect(SD.primary).toBe('#00E5FF')
  })
})
