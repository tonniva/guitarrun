export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/styles.css'],
  runtimeConfig: { public: { apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://platform-api-f7ebccg5emdvgce0.southeastasia-01.azurewebsites.net/'|| 'http://127.0.0.1:4100', googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '' } },
  app: {
    head: {
      htmlAttrs: { lang: 'th' },
      title: 'GuitarRun — Real-time Guitar Trainer',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/brand/guitarrun-icon.svg' }],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'theme-color', content: '#080b10' }
      ]
    }
  }
})
