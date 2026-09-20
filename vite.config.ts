import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function cloudflareSpaPlugin(): Plugin {
  return {
    name: 'cloudflare-spa-fallback',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexPath = path.join(distDir, 'index.html');
      const spaPath = path.join(distDir, '200.html');
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, spaPath);
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), cloudflareSpaPlugin()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-chartjs': ['chart.js', 'react-chartjs-2'],
          'vendor-leaflet': ['leaflet'],
          'vendor-fit': ['@garmin/fitsdk'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
});
