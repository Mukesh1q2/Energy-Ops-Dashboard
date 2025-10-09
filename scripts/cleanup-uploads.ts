/**
 * Cleanup Uploads Script
 * 
 * Removes temporary upload files older than a specified age.
 * Can be run manually or scheduled via cron/task scheduler.
 * 
 * Usage:
 *   npx tsx scripts/cleanup-uploads.ts [--days=7] [--dry-run]
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const UPLOAD_DIRS = [
  'uploads/market-snapshot',
  'uploads/dmo-generator',
  'uploads/dmo-contract',
  'uploads/dmo-bidding'
];

const MAX_AGE_DAYS = parseInt(process.env.CLEANUP_MAX_AGE_DAYS || '7', 10);
const DRY_RUN = process.argv.includes('--dry-run');

async function cleanupDirectory(dirPath: string): Promise<{ deleted: number; totalSize: number }> {
  const fullPath = path.join(process.cwd(), dirPath);
  let deleted = 0;
  let totalSize = 0;

  try {
    // Check if directory exists
    await fs.access(fullPath);
    
    const files = await fs.readdir(fullPath);
    const now = Date.now();
    const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(fullPath, file);
      const stats = await fs.stat(filePath);

      // Skip directories
      if (stats.isDirectory()) continue;

      const age = now - stats.mtimeMs;

      if (age > maxAgeMs) {
        console.log(`  🗑️  ${file} (${(stats.size / 1024).toFixed(2)} KB, ${Math.floor(age / (1000 * 60 * 60 * 24))} days old)`);
        
        if (!DRY_RUN) {
          await fs.unlink(filePath);
        }
        
        deleted++;
        totalSize += stats.size;
      }
    }

    return { deleted, totalSize };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`  ℹ️  Directory does not exist: ${dirPath}`);
      return { deleted: 0, totalSize: 0 };
    }
    throw error;
  }
}

async function main() {
  console.log('🧹 Starting upload cleanup...\n');
  console.log(`Configuration:`);
  console.log(`  - Max age: ${MAX_AGE_DAYS} days`);
  console.log(`  - Dry run: ${DRY_RUN ? 'YES (no files will be deleted)' : 'NO'}\n`);

  let totalDeleted = 0;
  let totalSize = 0;

  for (const dir of UPLOAD_DIRS) {
    console.log(`Checking ${dir}...`);
    const result = await cleanupDirectory(dir);
    totalDeleted += result.deleted;
    totalSize += result.totalSize;
    
    if (result.deleted === 0) {
      console.log(`  ✅ No old files found\n`);
    } else {
      console.log(`  ✅ ${result.deleted} file(s) ${DRY_RUN ? 'would be' : ''} deleted\n`);
    }
  }

  console.log('─────────────────────────────────────');
  console.log(`Summary:`);
  console.log(`  - Total files ${DRY_RUN ? 'to delete' : 'deleted'}: ${totalDeleted}`);
  console.log(`  - Total size freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  if (DRY_RUN) {
    console.log(`\n💡 Run without --dry-run to actually delete files`);
  } else {
    console.log(`\n✨ Cleanup complete!`);
  }
}

main().catch((error) => {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
});
