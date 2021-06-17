import express from "express";
import cors from "cors";
import pg from "pg";
import dbConfig from "./dbConfig.js";

const db = new pg.Pool(dbConfig);

const app = express();
app.use(express.json());
app.use(cors());

app.get("/categories", async (req, res) => {
    try {
        const games = await db.query("SELECT * FROM categories");
        res.send(games.rows);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.listen(4000, () => {
    console.log("Server started on port 4000.");
});
