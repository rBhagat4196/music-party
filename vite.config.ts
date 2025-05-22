import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  theme: {
    extend: {
      colors: {
        'green-50': '#f0fdf4',
        'green-200': '#bbf7d0',
        'red-50': '#fef2f2',
        'red-200': '#fecaca',
        'blue-50': '#eff6ff',
        'blue-200': '#bfdbfe',
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
