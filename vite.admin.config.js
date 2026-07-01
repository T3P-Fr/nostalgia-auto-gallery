import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build DÉDIÉ du Dashboard (admin.nostalgiaauto.gallery), séparé du site vitrine.
// Sortie dans dist-admin/ ; l'entrée admin.html sera renommée en index.html au
// déploiement (racine du sous-domaine).
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: "dist-admin",
        emptyOutDir: true,
        rollupOptions: {
            input: "admin.html",
            output: {
                // Vendor React isolé (meilleur cache navigateur entre déploiements).
                manualChunks: { "react-vendor": ["react", "react-dom"] },
            },
        },
    },
});
