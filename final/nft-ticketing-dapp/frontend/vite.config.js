import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        process: 'process/browser',
        util: 'util',
        // Use our custom buffer polyfill instead of the Node.js buffer
        buffer: resolve(__dirname, 'src/utils/buffer-polyfill.js'),
      }
    },
    define: {
      // Make env variables available in the client code
      'process.env': env,
      // Expose import.meta.env.VITE_* variables
      'import.meta.env.VITE_CONTRACT_ADDRESS': JSON.stringify(env.VITE_CONTRACT_ADDRESS || '0x6710D2C70ba9cE7f70c3655DE3CF7960e942cD21'),
      global: {},
    },
    build: {
      rollupOptions: {
        plugins: []
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      },
      // Exclude buffer from optimization to use our polyfill
      exclude: ['buffer']
    }
  }
})
