import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildTime = Date.now();

// 自動在每次打包時寫入最新的 version.json，供客戶端比對版本
const versionPlugin = () => ({
  name: 'version-generator',
  buildStart() {
    const versionData = JSON.stringify({ version: '1.2.2', buildTime }, null, 2);
    try {
      const pubDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(pubDir)) {
        fs.mkdirSync(pubDir, { recursive: true });
      }
      fs.writeFileSync(path.resolve(pubDir, 'version.json'), versionData);
    } catch (e) {
      console.error('Failed to write version.json:', e);
    }
  },
});

export default defineConfig({
  plugins: [react(), versionPlugin()],
  define: {
    __APP_BUILD_TIME__: JSON.stringify(buildTime),
  },
});
