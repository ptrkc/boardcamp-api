import express from "express";
import cors from "cors";
import pg from "pg";
import dbConfig from "./dbConfig.js";
import { categoryValidation } from "./functions/validations.js";

const db = new pg.Pool(dbConfig);

const app = express();
app.use(express.json());
app.use(cors());

app.get("/categories", async (req, res) => {
    try {
        const categories = await db.query("SELECT * FROM categories");
        res.send(categories.rows);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.post("/categories", async (req, res) => {
    const category = categoryValidation(req.body);
    if (!category) {
        res.sendStatus(400);
        return;
    }
    try {
        const checkExisting = await db.query(
            "SELECT * FROM categories where name = $1",
            [category]
        );
        if (checkExisting.rows.length !== 0) {
            res.sendStatus(409);
            return;
        }
        await db.query("INSERT INTO categories (name) VALUES ($1)", [category]);
        res.sendStatus(201);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.listen(4000, () => {
    console.log("Server started on port 4000.");
});
