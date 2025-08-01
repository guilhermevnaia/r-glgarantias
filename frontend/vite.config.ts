import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3010',
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [
      "8080-ik6dp2fvn7ehl2ikq25i9-33e278d5.manusvm.computer",
      "5173-ijyvz2p7hwagi9rznugm4-6c497bd2.manusvm.computer"
    ],
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
