import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => ({
  // The repository is published from the account's root Pages domain.
  base: '/',
  plugins: [react()],
}));
