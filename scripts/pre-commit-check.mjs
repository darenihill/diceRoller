#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🛡️  Starting Pre-Commit Adversarial & Regression Check Suite...\n');

let failed = false;

function runStep(name, command) {
  process.stdout.write(`⏳ Running ${name}... `);
  try {
    execSync(command, { cwd: projectRoot, stdio: 'pipe' });
    console.log('✅ PASSED');
  } catch (error) {
    console.log('❌ FAILED');
    console.error(`\n--- Error Output for ${name} ---`);
    console.error(error.stdout?.toString() || error.stderr?.toString() || error.message);
    failed = true;
  }
}

// 1. Adversarial Code Linter
runStep('ESLint Code Audit', 'npm run lint');

// 2. Automated Regression Test Suite
runStep('Vitest Automated Regression Suite (19+ Tests)', 'npm test');

// 3. TypeScript Typecheck & Production Build Verification
runStep('Vite Production Build & Type Check', 'npm run build');

// 4. Adversarial CSS & Layout Contract Guard
process.stdout.write('⏳ Running Adversarial CSS & Layout Guard Inspection... ');
try {
  const diceModulePath = path.join(projectRoot, 'src', 'components', 'Dice.module.css');
  const cssContent = fs.readFileSync(diceModulePath, 'utf-8');
  const diceBlockMatch = cssContent.match(/\.dice\s*\{([^}]+)\}/);

  if (diceBlockMatch && diceBlockMatch[1].match(/\bmargin\s*:/i)) {
    throw new Error('CRITICAL LAYOUT REGRESSION: .dice in Dice.module.css contains margin declaration! Spacing must be handled exclusively via CSS grid gap.');
  }

  const appTsxPath = path.join(projectRoot, 'src', 'App.tsx');
  const appContent = fs.readFileSync(appTsxPath, 'utf-8');
  if (appContent.match(/paddingBottom:\s*rpgMode\s*\?/i)) {
    throw new Error('CRITICAL LAYOUT REGRESSION: App.tsx contains dynamic paddingBottom ternary based on rpgMode! Container padding must remain constant (120px) to prevent grid height shifts.');
  }

  console.log('✅ PASSED');
} catch (err) {
  console.log('❌ FAILED');
  console.error(`\n--- Layout Guard Error ---`);
  console.error(err.message);
  failed = true;
}

console.log('\n---------------------------------------------------------');
if (failed) {
  console.error('⛔ PRE-COMMIT VERIFICATION FAILED! Do NOT commit or push to remote GitHub.');
  process.exit(1);
} else {
  console.log('🎉 ALL PRE-COMMIT CHECKS PASSED SUCCESSFULLY!');
  console.log('🔒 Git Push Safety Reminder: Waiting for user sign-off prior to git push.');
  process.exit(0);
}
