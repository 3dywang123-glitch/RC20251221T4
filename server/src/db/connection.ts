import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Disable SSL for now
  connectionTimeoutMillis: 10000, // 10 seconds
});

pool.on('connect', () => {
  console.log('📊 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('💥 Unexpected database error:', err);
  if (process.env.NODE_ENV !== 'development') {
    process.exit(-1);
  }
});

export default pool;
