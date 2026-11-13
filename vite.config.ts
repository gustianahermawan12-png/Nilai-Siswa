import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vendor-react',
                test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                priority: 30,
              },
              {
                name: 'vendor-firebase-app',
                test: /node_modules[\\/]@?firebase[\\/](app|auth|util|component|logger)/,
                priority: 25,
              },
              {
                name: 'vendor-firebase-firestore',
                test: /node_modules[\\/]@?firebase[\\/]firestore/,
                priority: 25,
              },
              {
                name: 'vendor-firebase-grpc',
                test: /node_modules[\\/](@grpc|protobufjs|@protobufjs|long|re2js|lodash\.camelcase)/,
                priority: 24,
              },
              {
                name: 'vendor-jspdf',
                test: /node_modules[\\/](jspdf|jspdf-autotable)[\\/]/,
                priority: 22,
              },
              {
                name: 'vendor-html2canvas',
                test: /node_modules[\\/](html2canvas|canvg|dompurify|stackblur-canvas|svg-pathdata|rgbcolor)[\\/]/,
                priority: 21,
              },
              {
                name: 'vendor-pdf-codecs',
                test: /node_modules[\\/](fflate|pako|fast-png|iobuffer|core-js)[\\/]/,
                priority: 20,
              },
              {
                name: 'vendor-ui',
                test: /node_modules[\\/](lucide-react|motion|framer-motion|motion-dom|motion-utils)[\\/]/,
                priority: 15,
              },
            ],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
