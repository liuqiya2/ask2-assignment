import { Pool } from 'pg';

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'my_database2',
    password: '151105',
    port: 5432
});

module.exports = pool;