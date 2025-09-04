import fs from 'node:fs';
import path from 'node:path';

const distFile = path.resolve(process.cwd(), 'dist', 'index.js');
const shebang = '#!/usr/bin/env node\n';

if (!fs.existsSync(distFile)) {
  console.warn(`[postbuild] Skipping shebang injection: ${distFile} not found.`);
  process.exit(0);
}

const original = fs.readFileSync(distFile, 'utf8');
const hasShebang = original.startsWith(shebang);
const updated = hasShebang ? original : shebang + original;

if (!hasShebang) {
  fs.writeFileSync(distFile, updated, 'utf8');
  console.log('[postbuild] Shebang injected into dist/index.js');
}

try {
  // Make sure it's executable: rwxr-xr-x
  fs.chmodSync(distFile, 0o755);
} catch (e) {
  console.warn('[postbuild] chmod failed:', e);
}


