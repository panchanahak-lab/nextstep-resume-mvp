import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const landingDist = path.join(rootDir, 'apps/landing/dist');
const appDist = path.join(rootDir, 'apps/app/dist');

console.log('Building landing app...');
execSync('npm run build:landing', { stdio: 'inherit' });

console.log('Building dashboard app...');
execSync('npm run build:app', { stdio: 'inherit' });

console.log('Merging dist folders...');

// Clean and recreate root dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// Copy landing dist to root dist
const copyRecursiveSync = (src, dest) => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

copyRecursiveSync(landingDist, distDir);

// Copy app dist to root dist/app
const rootAppDir = path.join(distDir, 'app');
fs.mkdirSync(rootAppDir, { recursive: true });
copyRecursiveSync(appDist, rootAppDir);

console.log('Build completed successfully!');
