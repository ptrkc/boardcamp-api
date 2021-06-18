import express from "express";
import cors from "cors";
import db from "./dbConfig.js";
import dayjs from "dayjs";
import {
    nameValidation,
    gameValidation,
    customerValidation,
    rentalValidation,
    integerValidation,
} from "./functions/validations.js";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/categories", async (req, res) => {
    const order = setOrder(req.route.path, req.query);
    const offsetAndLimit = setOffsetAndLimit(req.query);
    let query = `SELECT * FROM categories ${order} ${offsetAndLimit}`;
    try {
        const categories = await db.query(query);
        res.send(categories.rows);
    } catch (e) {
        console.log(e);
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
        console.log(e);
        res.sendStatus(500);
    }
});

app.get("/games", async (req, res) => {
    let name = nameValidation(req.query);
    const order = setOrder(req.route.path, req.query);
    const offsetAndLimit = setOffsetAndLimit(req.query);
    let filters = "";
    let params = [];
    if (name) {
        name += "%";
        filters = " WHERE games.name ILIKE $1 ";
        params = [name];
    }
    let dbQuery = `
    SELECT games.*, categories.name AS "categoryName"
    FROM games JOIN categories 
    ON games."categoryId" = categories.id ${filters} ${order} ${offsetAndLimit}`;

    try {
        const games = await db.query(dbQuery, params);
        res.send(games.rows);
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
    const dbQuery =
        'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)';
    const queryParams = [name, image, stockTotal, categoryId, pricePerDay];
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
        console.log(e);
        res.sendStatus(500);
    }
});

app.get("/customers", async (req, res) => {
    const order = setOrder(req.route.path, req.query);
    const offsetAndLimit = setOffsetAndLimit(req.query);
    let cpf = integerValidation(req.query.cpf);
    let filters = "";
    let params = [];
    if (cpf) {
        cpf += "%";
        filters = " WHERE cpf ILIKE $1 ";
        params = [cpf];
    }
    let dbQuery = `SELECT * FROM customers ${filters} ${order} ${offsetAndLimit}`;
    try {
        const customersSelect = await db.query(dbQuery, params);
        res.send(customersSelect.rows);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.get("/customers/:id", async (req, res) => {
    const id = integerValidation(req.params.id);
    if (!id) {
        res.sendStatus(400);
        return;
    }
    let dbQuery = "SELECT * FROM customers WHERE id = $1";
    let customersSelect;
    try {
        customersSelect = await db.query(dbQuery, [id]);
        if (customersSelect.rows.length === 0) {
            res.sendStatus(404);
        } else {
            res.send(customersSelect.rows[0]);
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.post("/customers", async (req, res) => {
    const customer = customerValidation(req.body);
    if (!customer) {
        res.sendStatus(400);
        return;
    }
    const { name, phone, cpf, birthday } = customer;
    const dbQuery =
        "INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)";
    const queryParams = [name, phone, cpf, birthday];

    try {
        const checkCPF = await db.query(
            "SELECT * FROM customers where cpf = $1",
            [cpf]
        );
        if (checkCPF.rows.length !== 0) {
            res.sendStatus(409);
            return;
        }
        await db.query(dbQuery, queryParams);
        res.sendStatus(201);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.put("/customers/:id", async (req, res) => {
    const id = parseInt(req.params && req.params.id);
    if (!/\d+/.test(id)) {
        res.sendStatus(400);
        return;
    }
    const customer = customerValidation(req.body);
    if (!customer) {
        res.sendStatus(400);
        return;
    }
    const { name, phone, cpf, birthday } = customer;
    const checkQuery = `
        SELECT * FROM customers WHERE id = $1 
        UNION 
        SELECT * FROM customers WHERE cpf = $2`;
    const checkParams = [id, cpf];
    const editQuery =
        "UPDATE customers SET (name, phone, cpf, birthday) = ($1, $2, $3, $4) WHERE id = $5";
    const queryParams = [name, phone, cpf, birthday, id];
    try {
        const preCheck = await db.query(checkQuery, checkParams);
        console.log(preCheck.rows);
        if (preCheck.rows.length === 2) {
            res.sendStatus(409);
            return;
        }
        if (preCheck.rows.length === 1) {
            if (preCheck.rows[0].id !== id) {
                res.sendStatus(404);
                return;
            }
        }
        if (preCheck.rows.length === 0) {
            res.sendStatus(404);
            return;
        }
        await db.query(editQuery, queryParams);
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.get("/rentals", async (req, res) => {
    const customerId = integerValidation(req.query.customerId);
    const gameId = integerValidation(req.query.gameId);
    const order = setOrder(req.route.path, req.query);
    const offsetAndLimit = setOffsetAndLimit(req.query);
    let filters = "";
    let params = [];
    if (customerId && gameId) {
        filters = ' WHERE rentals."customerId" = $1 AND rentals."gameId" = $2 ';
        params = [customerId, gameId];
    } else if (customerId) {
        filters = ' WHERE rentals."customerId" = $1 ';
        params = [customerId];
    } else if (gameId) {
        filters = ' WHERE rentals."gameId" = $1 ';
        params = [gameId];
    }
    let dbQuery = `
    SELECT 
    q1.* , q2."categoryName"
    FROM 
        (SELECT 
        rentals.*, customers.name AS "customerName", games.name AS "gameName", games."categoryId"
        FROM
        rentals JOIN customers ON rentals."customerId" = customers.id
        JOIN 
        games ON rentals."gameId" = games.id ${filters}) q1 
    JOIN 
        (SELECT categories.name as "categoryName", categories.id FROM categories) q2 
    ON q1."categoryId" = q2.id ${order} ${offsetAndLimit}`;
    try {
        const rawRentals = await db.query(dbQuery, params);
        const rentals = rawRentals.rows.map((r) => {
            return {
                id: r.id,
                customerId: r.customerId,
                gameId: r.gameId,
                rentDate: r.rentDate,
                daysRented: r.daysRented,
                returnDate: r.returnDate,
                originalPrice: r.originalPrice,
                delayFee: r.delayFee,
                customer: {
                    id: r.customerId,
                    name: r.customerName,
                },
                game: {
                    id: r.gameId,
                    name: r.gameName,
                    categoryId: r.categoryId,
                    categoryName: r.categoryName,
                },
            };
        });
        res.send(rentals);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.post("/rentals", async (req, res) => {
    const rental = rentalValidation(req.body);
    if (!rental) {
        res.sendStatus(400);
        return;
    }
    const { customerId, gameId, daysRented } = rental;
    try {
        const customer = await db.query(
            "SELECT * FROM customers WHERE id = $1",
            [customerId]
        );
        if (customer.rows.length === 0) {
            res.sendStatus(400);
            return;
        }
        const game = await db.query("SELECT * FROM games WHERE id = $1", [
            gameId,
        ]);
        if (game.rows.length === 0) {
            res.sendStatus(400);
            return;
        }
        const openRentals = await db.query(
            'SELECT * FROM rentals WHERE "gameId" = $1 AND "returnDate" IS NULL',
            [gameId]
        );
        if (openRentals.rows.length >= game.rows[0].stockTotal) {
            res.sendStatus(400);
            return;
        }
        const originalPrice = game.rows[0].pricePerDay * parseInt(daysRented);
        console.log(daysRented);
        const today = dayjs().format("YYYY-MM-DD");
        const insertQuery = `
            INSERT INTO rentals 
            ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") 
            VALUES ($1, $2, $3, $4, NULL, $5, NULL)`;
        const insertParams = [
            customerId,
            gameId,
            today,
            daysRented,
            originalPrice,
        ];
        await db.query(insertQuery, insertParams);
        res.sendStatus(201);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.post("/rentals/:id/return", async (req, res) => {
    const id = integerValidation(req.params.id);
    if (!id) {
        res.sendStatus(404);
        return;
    }
    try {
        const rental = await db.query("SELECT * FROM rentals WHERE id = $1", [
            id,
        ]);
        if (rental.rows.length === 0) {
            res.sendStatus(404);
            return;
        }
        const { rentDate, daysRented, returnDate, originalPrice } =
            rental.rows[0];
        if (returnDate !== null) {
            res.sendStatus(400);
            return;
        }
        const today = dayjs().format("YYYY-MM-DD");
        const lateDays = dayjs(today).diff(rentDate, "day") - daysRented;
        const delayFee =
            lateDays > 0 ? lateDays * (originalPrice / daysRented) : null;

        const editQuery = `
            UPDATE rentals SET ("returnDate", "delayFee") = ($1, $2) WHERE id = $3`;
        const editParams = [today, delayFee, id];
        await db.query(editQuery, editParams);
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.delete("/rentals/:id", async (req, res) => {
    const id = integerValidation(req.params.id);
    if (!id) {
        res.sendStatus(404);
        return;
    }
    try {
        const rental = await db.query("SELECT * FROM rentals WHERE id = $1", [
            id,
        ]);
        if (rental.rows.length === 0) {
            res.sendStatus(404);
            return;
        }
        const { returnDate } = rental.rows[0];
        if (returnDate !== null) {
            res.sendStatus(400);
            return;
        }
        const deleteQuery = `
            DELETE FROM rentals WHERE id = $1`;
        await db.query(deleteQuery, [id]);
        res.sendStatus(200);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.listen(4000, () => {
    console.log("Server started on port 4000.");
});

function setOffsetAndLimit(object) {
    let filters = "";
    const offset = integerValidation(object.offset);
    const limit = integerValidation(object.limit);

    if (offset) {
        filters += ` OFFSET ${offset}`;
    }
    if (limit) {
        filters += ` LIMIT ${limit}`;
    }
    return filters;
}

function setOrder(path, query) {
    let order = "";
    let desc = "";
    if (!query.order) {
        return order;
    }
    if (query.desc === "true") {
        desc = "DESC";
    }
    const categories = ["id", "name"];
    const customers = ["id", "name", "phone", "cpf", "birthday"];
    const games = [
        "id",
        "name",
        "image",
        "stockTotal",
        "categoryId",
        "pricePerDay",
        "categoryName",
    ];
    const rentals = [
        "id",
        "customerId",
        "gameId",
        "rentDate",
        "daysRented",
        "returnDate",
        "originalPrice",
        "delayFee",
        "customerName",
        "gameName",
        "categoryId",
        "categoryName",
    ];

    switch (path) {
        case "/categories":
            if (categories.includes(query.order)) {
                order = query.order;
            }
            break;
        case "/customers":
            if (customers.includes(query.order)) {
                order = query.order;
            }
            break;
        case "/games":
            if (games.includes(query.order)) {
                order = query.order;
            }
            break;
        case "/rentals":
            if (rentals.includes(query.order)) {
                order = query.order;
            }
            break;
    }
    return ` ORDER BY "${order}" ${desc} `;
}
