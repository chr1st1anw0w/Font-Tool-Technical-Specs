import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Security Warning: API keys in client-side code
    // This is only suitable for development/prototypes
    // For production, use a backend proxy to protect API keys
    if (!env.GEMINI_API_KEY && mode !== 'test') {
      console.warn('⚠️  WARNING: GEMINI_API_KEY not found in environment variables.');
      console.warn('⚠️  AI features will be disabled. Copy .env.example to .env and add your key.');
    }

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // ⚠️ SECURITY WARNING: This exposes the API key in client bundle
        // Only use for development/testing, not production
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve('./src'),
        }
      }
    };
});