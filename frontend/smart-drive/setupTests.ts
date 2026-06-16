import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'

// MSW server lifecycle. Import estático (não `require`) para que o resolver de
// alias `@/` do vitest funcione — os handlers importam de `@/features/*`.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
