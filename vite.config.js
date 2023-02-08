import { resolve } from 'path'
import { defineConfig } from 'vite'

const proxyPrefix = 'https://maps.kosmosnimki.ru';
export default defineConfig({
  build: {
	minify: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'lib/main.js'),
      name: 'Geomixerv',
      // the proper extensions will be added
      fileName: 'geomixerv',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['L'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          leaflet: 'L',
        },
      },
    },
  },
  server: {
    proxy: {
      // string shorthand
      '/Layer/CheckVersion': proxyPrefix + '/Layer/CheckVersion.ashx',
      '/TileSender.ashx': proxyPrefix + '/TileSender.ashx',
      '/Layer': proxyPrefix + '/Layer',
      '/VectorLayer': proxyPrefix + '/VectorLayer',
      // с options
      '/api': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // с регуляркой (RegEx)
      '^/*.ashx': {
        target: 'https://maps.kosmosnimki.ru',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/fallback/, '')
      },
      // использование proxy instance
      // '/api': {
        // target: 'http://jsonplaceholder.typicode.com',
        // changeOrigin: true,
        // configure: (proxy, options) => {
          // proxy будет экземпляром 'http-proxy'
        // }
      // }
    }
  }})