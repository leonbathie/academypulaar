import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        allowedHosts: true
    },
    build: {
        // Eviter le warning sur les chunks lourds mais conserver une vraie
        // separation via manualChunks ci-dessous.
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                // Separation des dependances en chunks longue-duree-cache.
                // Quand l'utilisateur revient, ces fichiers sont deja en cache
                // (hash stable tant que les versions n'ont pas change).
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector']
                }
            }
        }
    }
})
