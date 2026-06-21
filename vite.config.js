import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Le proxy conserve une URL unique en développement tout en séparant l'API.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            "/api": "http://localhost:3001",
        },
    },
});
