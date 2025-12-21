import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// 您的真实数据库地址
const connectionString = 'postgresql://root:lyan5srB7vO6i20zh48ukXC3mcAIWb19@hkg1.clusters.zeabur.com:31557/zeabur';

console.log('正在连接数据库 (不使用 SSL)...');

const pool = new Pool({
  connectionString,
  // ⚠️ 关键修改：去掉了 ssl 配置，允许普通连接
});

const run = async () => {
  const client = await pool.connect();
  try {
    console.log('✅ 数据库连接成功！');
    
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    console.log('正在读取 SQL 文件:', schemaPath);
    
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('正在执行建表语句...');
    await client.query(sql);
    
    console.log('🎉🎉🎉 建表成功！所有表已创建！');
    
  } catch (err) {
    console.error('❌ 出错了:', err);
  } finally {
    client.release();
    pool.end();
  }
};

run();
