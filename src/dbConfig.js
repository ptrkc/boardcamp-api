import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

pg.types.setTypeParser(pg.types.builtins.DATE, (str) => str);

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
};

const db = new pg.Pool(dbConfig);

export default db;
