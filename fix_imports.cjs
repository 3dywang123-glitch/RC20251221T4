const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      fixImports(filePath);
    } else if (file.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;
      content = content.replace(/'\.\.\/components\//g, "'../componentsv2/");
      content = content.replace(/"\.\.\/components\//g, '"../componentsv2/');
      content = content.replace(/'\.\.\/contexts\//g, "'../contextsv2/");
      content = content.replace(/"\.\.\/contexts\//g, '"../contextsv2/');
      if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed: ${filePath}`);
      }
    }
  });
}

fixImports('./pagesv2');
fixImports('./componentsv2');
