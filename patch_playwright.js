const fs = require('fs');
let code = fs.readFileSync('playwright.config.ts', 'utf8');
code = code.replace(
  "import { loadEnvConfig } from '@next/env';",
  "// @ts-ignore\nimport { loadEnvConfig } from '@next/env';"
);
fs.writeFileSync('playwright.config.ts', code);
