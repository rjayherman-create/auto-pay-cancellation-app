const express = require('express');
const { sequelize } = require('../config/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET all databases and tables
router.get('/databases', protect, async (req, res) => {
  try {
    const query = `
      SELECT 
        datname as database_name,
        pg_size_pretty(pg_database_size(datname)) as size,
        (SELECT count(*) FROM information_schema.tables WHERE table_catalog = datname AND table_schema = 'public') as table_count
      FROM pg_database
      WHERE datname NOT IN ('postgres', 'template0', 'template1', 'rdsadmin')
      ORDER BY datname;
    `;

    const databases = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });

    // Get overall stats
    const statsQuery = `
      SELECT 
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
        pg_size_pretty(pg_database_size(current_database())) as database_size
      FROM information_schema.tables
      LIMIT 1;
    `;

    const stats = await sequelize.query(statsQuery, { type: sequelize.QueryTypes.SELECT });

    res.json({
      success: true,
      databases: databases.map(db => ({
        name: db.database_name,
        size: db.size,
        tableCount: db.table_count || 0
      })),
      stats: {
        totalTables: stats[0]?.total_tables || 0,
        databaseSize: stats[0]?.database_size || 'Unknown',
        currentDb: process.env.DB_NAME || 'cardhugs'
      }
    });
  } catch (error) {
    console.error('Error fetching databases:', error);
    res.status(500).json({ error: 'Failed to fetch databases', details: error.message });
  }
});

// GET all tables in current database
router.get('/tables', protect, async (req, res) => {
  try {
    const query = `
      SELECT 
        tablename as table_name,
        (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = tablename) as row_count
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    const tables = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });

    res.json({
      success: true,
      tables: tables.map(table => ({
        name: table.table_name,
        recordCount: table.row_count || 0
      })),
      total: tables.length
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables', details: error.message });
  }
});

// GET table schema (columns and types)
router.get('/tables/:tableName/schema', protect, async (req, res) => {
  try {
    const { tableName } = req.params;

    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = :tableName
      ORDER BY ordinal_position;
    `;

    const columns = await sequelize.query(query, {
      replacements: { tableName },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      table: tableName,
      columns: columns,
      columnCount: columns.length
    });
  } catch (error) {
    console.error('Error fetching table schema:', error);
    res.status(500).json({ error: 'Failed to fetch table schema', details: error.message });
  }
});

// GET table data with pagination
router.get('/tables/:tableName/data', protect, async (req, res) => {
  try {
    const { tableName } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Get data
    const dataQuery = `SELECT * FROM "${tableName}" LIMIT :limit OFFSET :offset;`;
    const data = await sequelize.query(dataQuery, {
      replacements: { limit: parseInt(limit), offset: parseInt(offset) },
      type: sequelize.QueryTypes.SELECT
    });

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM "${tableName}";`;
    const countResult = await sequelize.query(countQuery, { type: sequelize.QueryTypes.SELECT });
    const total = countResult[0].total;

    res.json({
      success: true,
      table: tableName,
      data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ error: 'Failed to fetch table data', details: error.message });
  }
});

// GET database stats and info
router.get('/stats', protect, async (req, res) => {
  try {
    const query = `
      SELECT 
        schemaname,
        tablename,
        (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = tablename) as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY row_count DESC;
    `;

    const tableStats = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });

    // Overall stats
    const overallQuery = `
      SELECT 
        count(*) as total_tables,
        sum((SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = tablename)) as total_rows
      FROM pg_tables
      WHERE schemaname = 'public';
    `;

    const overall = await sequelize.query(overallQuery, { type: sequelize.QueryTypes.SELECT });

    res.json({
      success: true,
      overall: {
        totalTables: overall[0].total_tables,
        totalRows: overall[0].total_rows || 0,
        databaseSize: 'See table stats'
      },
      tableStats: tableStats.map(t => ({
        table: t.tablename,
        rows: t.row_count || 0,
        size: t.table_size
      }))
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

module.exports = router;
