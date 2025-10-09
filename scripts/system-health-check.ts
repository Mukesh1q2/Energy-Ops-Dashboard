import { db } from '../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function runDiagnostics() {
  console.log('\n🔍 Running System Health Check...\n');
  
  let issues = 0;
  let warnings = 0;

  // 1. Database Connection
  try {
    await db.execute('SELECT 1');
    console.log('✅ Database connection: OK');
  } catch (error) {
    console.error('❌ Database connection: FAILED', error);
    issues++;
  }

  // 2. Check Data Sources
  try {
    const dataSources = await db.execute('SELECT * FROM data_sources ORDER BY created_at DESC LIMIT 5');
    console.log(`✅ Data sources found: ${dataSources.rows.length}`);
    
    if (dataSources.rows.length === 0) {
      console.log('⚠️  No data sources in database');
      warnings++;
    } else {
      dataSources.rows.forEach((ds: any) => {
        console.log(`   - ${ds.name} (${ds.status}) - ID: ${ds.id}`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking data sources:', error);
    issues++;
  }

  // 3. Check Columns
  try {
    const columns = await db.execute('SELECT * FROM columns ORDER BY created_at DESC LIMIT 10');
    console.log(`✅ Columns found: ${columns.rows.length}`);
    
    if (columns.rows.length === 0) {
      console.log('⚠️  No columns in database');
      warnings++;
    } else {
      const columnsByDs = columns.rows.reduce((acc: any, col: any) => {
        if (!acc[col.data_source_id]) acc[col.data_source_id] = [];
        acc[col.data_source_id].push(col.column_name);
        return acc;
      }, {});
      
      Object.entries(columnsByDs).forEach(([dsId, cols]: [string, any]) => {
        console.log(`   - Data Source ${dsId}: ${cols.length} columns`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking columns:', error);
    issues++;
  }

  // 4. Check Dynamic Tables
  try {
    const tables = await db.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE 'ds_%'
      ORDER BY name
    `);
    console.log(`✅ Dynamic tables found: ${tables.rows.length}`);
    
    if (tables.rows.length === 0) {
      console.log('⚠️  No dynamic tables created');
      warnings++;
    } else {
      for (const table of tables.rows) {
        const count = await db.execute(`SELECT COUNT(*) as count FROM ${table.name}`);
        console.log(`   - ${table.name}: ${(count.rows[0] as any).count} rows`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking dynamic tables:', error);
    issues++;
  }

  // 5. Check Upload Directory
  const uploadDir = path.join(process.cwd(), 'uploads');
  try {
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      console.log(`✅ Upload directory: ${files.length} files`);
      
      if (files.length === 0) {
        console.log('⚠️  No uploaded files found');
        warnings++;
      } else {
        files.slice(0, 5).forEach(file => {
          const filePath = path.join(uploadDir, file);
          const stats = fs.statSync(filePath);
          console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        });
      }
    } else {
      console.log('❌ Upload directory does not exist');
      issues++;
    }
  } catch (error) {
    console.error('❌ Error checking upload directory:', error);
    issues++;
  }

  // 6. Check API Routes
  const apiDir = path.join(process.cwd(), 'app', 'api');
  try {
    if (fs.existsSync(apiDir)) {
      const apiRoutes: string[] = [];
      
      function scanDir(dir: string, prefix = '') {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            scanDir(itemPath, prefix + '/' + item);
          } else if (item === 'route.ts' || item === 'route.js') {
            apiRoutes.push('/api' + prefix);
          }
        });
      }
      
      scanDir(apiDir);
      console.log(`✅ API routes found: ${apiRoutes.length}`);
      apiRoutes.forEach(route => console.log(`   - ${route}`));
    }
  } catch (error) {
    console.error('⚠️  Error scanning API routes:', error);
    warnings++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  console.log(`❌ Critical Issues: ${issues}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  
  if (issues === 0 && warnings === 0) {
    console.log('\n✨ System is healthy! All checks passed.\n');
  } else if (issues === 0) {
    console.log('\n✅ System is operational with minor warnings.\n');
  } else {
    console.log('\n🚨 System has critical issues that need attention.\n');
  }

  process.exit(issues > 0 ? 1 : 0);
}

runDiagnostics().catch(error => {
  console.error('Fatal error during diagnostics:', error);
  process.exit(1);
});
