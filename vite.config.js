import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    global: "globalThis",
  }, server: {
    host: true,        // ← THÊM DÒNG NÀY (quan trọng nhất!!!)
    port: 5173,        // ← Tùy chọn, nhưng nên có cho rõ ràng
    strictPort: true,  // ← Nếu port 5173 bị chiếm thì báo lỗi thay vì tự nhảy port khác
  },
});
