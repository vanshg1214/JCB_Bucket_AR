import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        bucket_2: 'bucket_2/index.html',
      },
    },
  },
});
