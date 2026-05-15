import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'

// MSW server lifecycle — optional import so it doesn't break if server.ts is absent
let server: { listen: (o: object) => void; resetHandlers: () => void; close: () => void } | undefined

try {
  // Dynamic require keeps the import optional without top-level await
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('./mocks/server') as { server: typeof server }
  server = mod.server
} catch {
  // mocks/server.ts not yet present — skip MSW setup
}

beforeAll(() => server?.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server?.resetHandlers())
afterAll(() => server?.close())
