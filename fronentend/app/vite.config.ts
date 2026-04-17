import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "figma:asset/b596a6772d8489d08f4749d243b11a2e17ee27cd.png": path.resolve(__dirname, './src/assets/b596a6772d8489d08f4749d243b11a2e17ee27cd.png'),
      "figma:asset/263b05502fe4f16ac930f2b238a69dde3399d505.png": path.resolve(__dirname, './src/assets/263b05502fe4f16ac930f2b238a69dde3399d505.png'),
    },
  },
});
