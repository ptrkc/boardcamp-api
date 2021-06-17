import express from "express";
import cors from "cors";
import pg from "pg";
import dbConfig from "./dbConfig.js";

const app = express();
app.use(express.json());
app.use(cors());

const db = new pg.Pool(dbConfig);

app.listen(4000, () => {
    console.log("Server started on port 4000.");
});
