export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/styles.css'],
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
