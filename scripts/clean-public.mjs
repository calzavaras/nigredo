import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });

console.log('Cleaned public/');
