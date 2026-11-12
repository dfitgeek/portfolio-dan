#!/usr/bin/env node
/**
 * revert-to-checkpoint.js
 * Restores the database, uploads, and optionally git branch to checkpoint-1.
 * Usage:
 *   node scripts/revert-to-checkpoint.js
 *   node scripts/revert-to-checkpoint.js --hard
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const checkpointDir = path.join(rootDir, 'backups', 'checkpoint-1');
const targetDataDir = path.join(rootDir, 'data');
const targetUploadsDir = path.join(rootDir, 'uploads');

console.log('==============================================');
console.log('Restoring to Checkpoint 1...');
console.log('==============================================\n');

if (!fs.existsSync(checkpointDir)) {
  console.error(`❌ Checkpoint directory not found at: ${checkpointDir}`);
  process.exit(1);
}

// 1. Restore data/db.json
const sourceDb = path.join(checkpointDir, 'data', 'db.json');
const targetDb = path.join(targetDataDir, 'db.json');
if (fs.existsSync(sourceDb)) {
  fs.copyFileSync(sourceDb, targetDb);
  console.log('✓ Restored data/db.json');
} else {
  console.warn('⚠️ No db.json found in checkpoint');
}

// 2. Restore uploads
const sourceUploads = path.join(checkpointDir, 'uploads');
if (fs.existsSync(sourceUploads)) {
  const files = fs.readdirSync(sourceUploads);
  for (const file of files) {
    if (file === 'seed') continue; // keep seed as is
    const src = path.join(sourceUploads, file);
    const dest = path.join(targetUploadsDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
    }
  }
  console.log(`✓ Restored user uploads from checkpoint`);
}

// 3. Optional git hard reset to checkpoint-1 tag
if (process.argv.includes('--hard') || process.argv.includes('--git')) {
  try {
    execSync('git checkout checkpoint-1', { cwd: rootDir, stdio: 'inherit' });
    console.log('✓ Checked out git tag "checkpoint-1"');
  } catch (err) {
    console.warn('⚠️ Failed to checkout git tag:', err.message);
  }
}

console.log('\n==============================================');
console.log('✓ Checkpoint 1 successfully restored!');
console.log('==============================================\n');
