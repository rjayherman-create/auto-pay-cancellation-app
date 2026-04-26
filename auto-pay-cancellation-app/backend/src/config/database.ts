import { Pool, QueryResult } from 'pg';
import { logger } from '../utils/logger';

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'autopay_user',
  password: process.env.DB_PASSWORD || 'autopay_password_secure',
  host: process.env.DB_HOST || 'autopay-postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'autopay_db'
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    logger.error('❌ PostgreSQL connection failed:', err);
  } else {
    logger.info('✅ PostgreSQL connected successfully');
  }
});

// Supabase-like interface for PostgreSQL
export const supabaseAdmin: any = {
  from: (table: string) => {
    return {
      select: (fields = '*') => {
        return {
          eq: (field: string, value: any) => {
            return {
              single: async () => {
                try {
                  const result = await pool.query(
                    `SELECT ${fields} FROM ${table} WHERE ${field} = $1 LIMIT 1`,
                    [value]
                  );
                  const data = result.rows[0] || null;
                  return { data, error: data ? null : 'Not found' };
                } catch (error) {
                  logger.error(`Query error in ${table}:`, error);
                  return { data: null, error: (error as any).message };
                }
              }
            };
          },
          gt: (field: string, value: any) => {
            return {
              single: async () => {
                try {
                  const result = await pool.query(
                    `SELECT ${fields} FROM ${table} WHERE ${field} > $1 LIMIT 1`,
                    [value]
                  );
                  const data = result.rows[0] || null;
                  return { data, error: data ? null : 'Not found' };
                } catch (error) {
                  logger.error(`Query error in ${table}:`, error);
                  return { data: null, error: (error as any).message };
                }
              }
            };
          }
        };
      },
      insert: (data: any) => {
        return {
          select: () => {
            return {
              single: async () => {
                try {
                  const fields = Object.keys(data);
                  const values = Object.values(data);
                  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
                  const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
                  
                  const result = await pool.query(query, values);
                  const record = result.rows[0];
                  logger.info(`✅ Inserted into ${table}: ${record?.id}`);
                  return { data: record, error: null };
                } catch (error) {
                  logger.error(`❌ Insert failed in ${table}`, error);
                  return { data: null, error: (error as any).message };
                }
              }
            };
          }
        };
      },
      update: (data: any) => {
        return {
          eq: (field: string, value: any) => {
            return {
              select: () => {
                return {
                  single: async () => {
                    try {
                      const fields = Object.keys(data);
                      const values = Object.values(data);
                      const updates = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
                      values.push(value);
                      const query = `UPDATE ${table} SET ${updates}, updated_at = NOW() WHERE ${field} = $${values.length} RETURNING *`;
                      
                      const result = await pool.query(query, values);
                      const record = result.rows[0];
                      if (!record) {
                        return { data: null, error: 'Not found' };
                      }
                      logger.info(`✅ Updated in ${table}: ${record.id}`);
                      return { data: record, error: null };
                    } catch (error) {
                      logger.error(`❌ Update failed in ${table}`, error);
                      return { data: null, error: (error as any).message };
                    }
                  }
                };
              }
            };
          }
        };
      }
    };
  }
};

// Direct query function for advanced operations
export async function query(sql: string, params?: any[]) {
  try {
    const result = await pool.query(sql, params);
    return { data: result.rows, error: null };
  } catch (error) {
    logger.error('Query error:', error);
    return { data: null, error: (error as any).message };
  }
}

logger.info('✅ PostgreSQL database module initialized');
