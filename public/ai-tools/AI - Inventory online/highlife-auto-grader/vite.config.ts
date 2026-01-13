import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    base: './', // CRITICAL: Allows app to work in subfolders or embeds (Antigravity placement)
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the Gemini SDK to work with Netlify env vars
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});