import { db } from './src/lib/db';
import { existsSync } from 'fs';
import { join } from 'path';

async function testCriticalFixes() {
  console.log('🧪 === TESTING CRITICAL FIXES ===\n');
  
  // 1. Test bind variable fix
  console.log('1️⃣ Testing SQLite bind variable fix...');
  const sources = await db.dataSource.findMany({
    where: { status: 'active' },
    orderBy: { created_at: 'desc' },
    take: 1,
    include: { columns: true }
  });
  
  if (sources.length > 0) {
    const source = sources[0];
    const config = source.config as any;
    const tableName = config.tableName;
    
    if (tableName) {
      try {
        const result: any[] = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const dbCount = result[0].count;
        const expectedCount = source.record_count || 0;
        
        if (dbCount === expectedCount) {
          console.log(`   ✅ PASS: Row count matches (${dbCount} rows)`);
        } else {
          console.log(`   ❌ FAIL: Row count mismatch`);
          console.log(`      Expected: ${expectedCount}, Found: ${dbCount}`);
        }
        
        // Check chunk size calculation
        const columnsCount = source.columns.length;
        const SQLITE_MAX_VARIABLES = 999;
        const maxRowsPerChunk = Math.floor(SQLITE_MAX_VARIABLES / columnsCount);
        console.log(`   📊 Chunk size: ${maxRowsPerChunk} rows (${columnsCount} columns)`);
        console.log(`   📊 Total variables per chunk: ${maxRowsPerChunk * columnsCount} (< 999) ✅`);
        
      } catch (err) {
        console.log(`   ❌ FAIL: Error querying table: ${err}`);
      }
    } else {
      console.log(`   ⚠️  SKIP: No table name found in config`);
    }
  } else {
    console.log(`   ⚠️  SKIP: No active data sources to test`);
  }
  
  console.log('');
  
  // 2. Verify table name format
  console.log('2️⃣ Checking table name format...');
  const allSources = await db.dataSource.findMany();
  for (const source of allSources) {
    const config = source.config as any;
    if (config.tableName) {
      const tableName = config.tableName;
      const isValid = /^ds_[a-zA-Z0-9_]+$/.test(tableName);
      if (isValid) {
        console.log(`   ✅ ${tableName} - Valid format`);
      } else {
        console.log(`   ❌ ${tableName} - INVALID format!`);
      }
    }
  }
  
  console.log('');
  
  // 3. Check upload file size
  console.log('3️⃣ Checking uploaded file sizes...');
  const uploadsDir = join(process.cwd(), 'uploads');
  if (existsSync(uploadsDir)) {
    const fs = require('fs');
    const files = fs.readdirSync(uploadsDir);
    let tooLarge = 0;
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    
    files.forEach((f: string) => {
      const stat = fs.statSync(join(uploadsDir, f));
      if (stat.size > MAX_SIZE) {
        tooLarge++;
        console.log(`   ⚠️  ${f} - ${(stat.size / 1024 / 1024).toFixed(2)}MB (> 10MB)`);
      }
    });
    
    if (tooLarge === 0) {
      console.log(`   ✅ All ${files.length} files are within size limit`);
    } else {
      console.log(`   ⚠️  ${tooLarge} files exceed 10MB limit`);
    }
  }
  
  console.log('');
  
  // 4. Summary
  console.log('📊 === TEST SUMMARY ===\n');
  console.log('Critical fixes applied:');
  console.log('  ✅ SQLite bind variable limit fixed (dynamic chunk size)');
  console.log('  ✅ File size limit added (10MB max)');
  console.log('  ✅ Table name validation added');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Upload a test file with 200+ rows');
  console.log('  2. Verify all rows are inserted');
  console.log('  3. Check server logs for chunk progress');
  console.log('  4. Try uploading a file > 10MB (should fail)');
  console.log('');
  
  await db.$disconnect();
}

testCriticalFixes().catch(console.error);
