import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test.ts,test.tsx}'],
    globals: true,
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/test-setup.ts', 'src/**/*.test.*', 'src/**/*.d.ts', 'dist/', 'e2e/']
    }
  }
})
