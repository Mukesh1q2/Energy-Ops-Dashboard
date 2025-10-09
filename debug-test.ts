import { db } from './src/lib/db';
import { existsSync } from 'fs';
import { join } from 'path';

async function runDiagnostics() {
  console.log('🔍 === COMPREHENSIVE DIAGNOSTICS ===\n');
  
  // 1. Check database connection
  console.log('1️⃣ Testing database connection...');
  try {
    await db.$queryRaw`SELECT 1`;
    console.log('   ✅ Database connected\n');
  } catch (err) {
    console.log('   ❌ Database connection failed:', err);
    return;
  }

  // 2. Check data sources
  console.log('2️⃣ Checking data sources...');
  const sources = await db.dataSource.findMany({
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log(`   Found ${sources.length} data sources:`);
  sources.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.name} (${s.status}) - ${s.record_count || 0} records`);
    const config = s.config as any;
    if (config.filePath) {
      const exists = existsSync(config.filePath);
      console.log(`      File exists: ${exists ? '✅' : '❌'} ${config.filePath}`);
    }
  });
  console.log('');

  // 3. Check columns
  console.log('3️⃣ Checking columns...');
  const columnsCount = await db.dataSourceColumn.count();
  console.log(`   Total columns: ${columnsCount}`);
  
  if (columnsCount > 0) {
    const recentColumns = await db.dataSourceColumn.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      include: { dataSource: { select: { name: true } } }
    });
    console.log(`   Recent columns:`);
    recentColumns.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.column_name} (${c.data_type}) - ${c.dataSource.name}`);
    });
  }
  console.log('');

  // 4. Check for active sources with columns
  console.log('4️⃣ Checking active sources with columns...');
  const activeSources = await db.dataSource.findMany({
    where: { status: 'active' },
    include: {
      columns: true
    }
  });
  console.log(`   Found ${activeSources.length} active sources:`);
  activeSources.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.name} - ${s.columns.length} columns`);
    if (s.columns.length > 0) {
      console.log(`      Sample columns: ${s.columns.slice(0, 3).map(c => c.column_name).join(', ')}`);
    }
  });
  console.log('');

  // 5. Check dynamic tables
  console.log('5️⃣ Checking dynamic tables...');
  const tables = await db.$queryRaw<any[]>`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name LIKE 'ds_%'
    ORDER BY name;
  `;
  console.log(`   Found ${tables.length} dynamic tables:`);
  tables.forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.name}`);
  });
  console.log('');

  // 6. Check uploads folder
  console.log('6️⃣ Checking uploads folder...');
  const uploadsDir = join(process.cwd(), 'uploads');
  if (existsSync(uploadsDir)) {
    console.log(`   ✅ Uploads folder exists: ${uploadsDir}`);
    const fs = require('fs');
    const files = fs.readdirSync(uploadsDir);
    console.log(`   Files in uploads: ${files.length}`);
    files.slice(0, 5).forEach((f: string) => {
      const stat = fs.statSync(join(uploadsDir, f));
      console.log(`      - ${f} (${(stat.size / 1024).toFixed(2)} KB)`);
    });
  } else {
    console.log(`   ❌ Uploads folder not found!`);
  }
  console.log('');

  // 7. Test One-Click Plot readiness
  console.log('7️⃣ Testing One-Click Plot readiness...');
  const sourcesWithColumns = await db.dataSource.findMany({
    where: {
      status: 'active',
      columns: {
        some: {}
      }
    },
    include: {
      columns: true
    },
    take: 1
  });
  
  if (sourcesWithColumns.length > 0) {
    const s = sourcesWithColumns[0];
    console.log(`   ✅ Found source ready for One-Click Plot: ${s.name}`);
    console.log(`      Columns: ${s.columns.length}`);
    const numericCols = s.columns.filter(c => c.data_type === 'numeric').length;
    const stringCols = s.columns.filter(c => c.data_type === 'string').length;
    const dateCols = s.columns.filter(c => c.data_type === 'date').length;
    console.log(`      Types: ${numericCols} numeric, ${stringCols} string, ${dateCols} date`);
    console.log(`      Expected chart suggestions: ${Math.min(10, numericCols * 2 + stringCols)}`);
  } else {
    console.log(`   ❌ No sources ready for One-Click Plot`);
    console.log(`      Need: status='active' AND columns > 0`);
  }
  console.log('');

  // 8. Summary and recommendations
  console.log('📊 === SUMMARY ===\n');
  
  const issues = [];
  const recommendations = [];
  
  if (sources.length === 0) {
    issues.push('No data sources found');
    recommendations.push('Upload an Excel file to create a data source');
  }
  
  if (columnsCount === 0) {
    issues.push('No columns found');
    recommendations.push('Upload process may have failed - check server logs');
  }
  
  if (tables.length === 0) {
    issues.push('No dynamic tables created');
    recommendations.push('Auto-processing may have failed');
  }
  
  if (sourcesWithColumns.length === 0 && sources.length > 0) {
    issues.push('Data sources exist but have no columns');
    recommendations.push('Delete old sources and re-upload');
  }
  
  if (issues.length === 0) {
    console.log('✅ ALL SYSTEMS OPERATIONAL');
    console.log('   - Data sources: OK');
    console.log('   - Columns: OK');
    console.log('   - Dynamic tables: OK');
    console.log('   - One-Click Plot: READY');
  } else {
    console.log('⚠️  ISSUES FOUND:');
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
    console.log('\n💡 RECOMMENDATIONS:');
    recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }
  
  console.log('\n');
  await db.$disconnect();
}

runDiagnostics().catch(console.error);
