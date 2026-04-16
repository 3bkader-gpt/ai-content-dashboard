const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir('client/src');
let updatedCount = 0;

const replacements = [
  { p: /\bbg-gray-50(?!\/| dark:)/g, r: 'bg-gray-50 dark:bg-gray-950' },
  { p: /\bbg-white(?!\/| dark:)/g, r: 'bg-white dark:bg-gray-900' },
  { p: /\btext-gray-900(?!\/| dark:)/g, r: 'text-gray-900 dark:text-gray-50' },
  { p: /\btext-gray-600(?!\/| dark:)/g, r: 'text-gray-600 dark:text-gray-400' },
  { p: /\btext-gray-500(?!\/| dark:)/g, r: 'text-gray-500 dark:text-gray-400' },
  { p: /\btext-gray-400(?!\/| dark:)/g, r: 'text-gray-400 dark:text-gray-500' },
  { p: /\btext-indigo-600(?!\/| dark:)/g, r: 'text-indigo-600 dark:text-indigo-400' },
  { p: /\bborder-gray-200(?!\/| dark:)/g, r: 'border-gray-200 dark:border-gray-800' },
  { p: /\bborder-gray-100(?!\/| dark:)/g, r: 'border-gray-100 dark:border-gray-800' },
  { p: /\bbg-gray-100(?!\/| dark:)/g, r: 'bg-gray-100 dark:bg-gray-800' },
  { p: /\bbg-indigo-50(?!\/| dark:)/g, r: 'bg-indigo-50 dark:bg-indigo-900/30' },
  { p: /\border-gray-200(?!\/| dark:)/g, r: 'border-gray-200 dark:border-gray-800' }
];

files.forEach(file => {
   let content = fs.readFileSync(file, 'utf8');
   let original = content;
   replacements.forEach(rep => {
     content = content.replace(rep.p, rep.r);
   });
   
   // Specific fixes for text-gray-900 inside placeholders and ring controls
   content = content.replace(/placeholder:text-gray-500 dark:text-gray-400/g, 'placeholder:text-gray-500 dark:placeholder:text-gray-400');
   
   if (content !== original) {
     fs.writeFileSync(file, content, 'utf8');
     updatedCount++;
     console.log('Updated dark mode classes:', file);
   }
});

console.log('Total files updated with dark mode:', updatedCount);
