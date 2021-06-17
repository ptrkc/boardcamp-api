import express from "express";
import cors from "cors";
import pg from "pg";
import dbConfig from "./dbConfig.js";
import {
    nameValidation,
    cpfValidation,
    gameValidation,
} from "./functions/validations.js";

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
    const category = nameValidation(req.body);
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

app.get("/games", async (req, res) => {
    let name = nameValidation(req.query);
    let dbQuery = "SELECT * FROM games";
    let gamesSelect;
    try {
        if (name) {
            name += "%";
            dbQuery += " WHERE name ILIKE $1";
            gamesSelect = await db.query(dbQuery, [name]);
        } else {
            gamesSelect = await db.query(dbQuery);
        }
        const categories = await db.query("SELECT * FROM categories");
        const games = gamesSelect.rows.map((g) => {
            const category = categories.rows.find((c) => c.id === g.categoryId);
            return { ...g, categoryName: category.name };
        });
        res.send(games);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.post("/games", async (req, res) => {
    const game = gameValidation(req.body);
    if (!game) {
        res.sendStatus(400);
        return;
    }
    const { name, image, stockTotal, categoryId, pricePerDay } = game;
    const queryParams = [name, image, stockTotal, categoryId, pricePerDay];
    const dbQuery =
        'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)';
    try {
        const checkCategory = await db.query(
            "SELECT * FROM categories where id = $1",
            [categoryId]
        );
        if (checkCategory.rows.length === 0) {
            res.sendStatus(400);
            return;
        }
        const checkName = await db.query(
            "SELECT * FROM games where name = $1",
            [name]
        );
        if (checkName.rows.length !== 0) {
            res.sendStatus(409);
            return;
        }
        await db.query(dbQuery, queryParams);
        res.sendStatus(201);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.get("/customers", async (req, res) => {
    let cpf = cpfValidation(req.query);
    let dbQuery = "SELECT * FROM customers";
    let customersSelect;
    try {
        if (cpf) {
            cpf += "%";
            dbQuery += " WHERE cpf ILIKE $1";
            customersSelect = await db.query(dbQuery, [cpf]);
        } else {
            customersSelect = await db.query(dbQuery);
        }
        res.send(customersSelect.rows);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.listen(4000, () => {
    console.log("Server started on port 4000.");
});
