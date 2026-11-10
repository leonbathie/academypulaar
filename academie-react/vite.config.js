import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // PWA : application installable (icone ecran d'accueil, plein ecran,
        // fonctionnement hors-ligne via service worker). autoUpdate : le SW se
        // met a jour tout seul apres un nouveau deploiement.
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.webp', 'favicon.png', 'apple-touch-icon.png'],
            manifest: {
                id: '/',
                name: 'Goomu Fulo e Wiɗto',
                short_name: 'GFW',
                description: 'Saggitorde e ganndinal Pulaar/Fulfulde — dictionnaire, terminologie et recherche.',
                lang: 'ff',
                dir: 'ltr',
                theme_color: '#1a1a2e',
                background_color: '#fdf8f0',
                display: 'standalone',
                orientation: 'any',
                start_url: '/',
                scope: '/',
                categories: ['education', 'books', 'reference'],
                icons: [
                    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                    { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                ],
                shortcuts: [
                    { name: 'Dictionnaire', short_name: 'Dico', url: '/dictionnaire' },
                    { name: 'Terminologie', short_name: 'Terminologie', url: '/terminologie' },
                    { name: 'Correct / Incorrect', short_name: 'Dire', url: '/dire' },
                    { name: 'Bibliothèque', short_name: 'Livres', url: '/bibliotheque' }
                ]
            },
            workbox: {
                // Precache de l'app (pas les videos .webm, trop lourdes : chargees a la demande)
                globPatterns: ['**/*.{js,css,html,webp,png,svg,woff2,json}'],
                // Grosses images inutiles hors-ligne : icones d'install (recuperees
                // par l'OS via le manifest) et image OG (crawlers seulement).
                globIgnores: [
                    '**/logo-academie.png',
                    '**/pwa-512x512.png',
                    '**/pwa-maskable-512x512.png'
                ],
                // SPA : les routes cote client retombent sur index.html hors-ligne
                navigateFallback: '/index.html',
                // ...sauf l'API et les fichiers servis par le backend
                navigateFallbackDenylist: [/^\/api/, /^\/uploads/, /^\/share/],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
                maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
            }
        })
    ],
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
