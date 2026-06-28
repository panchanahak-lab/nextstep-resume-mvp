const fs = require('fs');
const path = require('path');

const directoriesToProcess = [
  path.join(__dirname, 'apps/landing/src/sections'),
  path.join(__dirname, 'apps/landing/src/components'),
  path.join(__dirname, 'apps/landing/src/pages')
];

const replacements = [
  { regex: /(?<!dark:)bg-blue-50/g, replacement: 'bg-blue-50 dark:bg-blue-900/20' },
  { regex: /(?<!dark:)bg-purple-50/g, replacement: 'bg-purple-50 dark:bg-purple-900/20' },
  { regex: /(?<!dark:)bg-green-50/g, replacement: 'bg-green-50 dark:bg-green-900/20' },
  { regex: /(?<!dark:)bg-yellow-50/g, replacement: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { regex: /(?<!dark:)bg-red-50/g, replacement: 'bg-red-50 dark:bg-red-900/20' },
  { regex: /(?<!dark:)text-blue-600/g, replacement: 'text-blue-600 dark:text-blue-400' },
  { regex: /(?<!dark:)text-purple-600/g, replacement: 'text-purple-600 dark:text-purple-400' },
  { regex: /(?<!dark:)text-green-600/g, replacement: 'text-green-600 dark:text-green-400' },
  { regex: /(?<!dark:)text-blue-700/g, replacement: 'text-blue-700 dark:text-blue-300' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

directoriesToProcess.forEach(walkDirectory);
console.log('Pastel dark mode classes added to landing app successfully!');
