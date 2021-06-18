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
import {
    setStartAndEndDate,
    filterRentals,
    setOffsetAndLimit,
    setOrder,
} from "./functions/sortersAndFilters.js";
import formatParser from "dayjs/plugin/customParseFormat.js";

dayjs.extend(formatParser);

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
    SELECT games.*, q1."rentalsCount" 
    FROM games 
    JOIN (SELECT rentals."gameId", count(rentals.id) as "rentalsCount" FROM rentals GROUP BY rentals."gameId") q1 
    ON q1."gameId" = games.id ${filters} ${order} ${offsetAndLimit}
    `;
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
    let dbQuery = `
    SELECT customers.*, q1."rentalsCount" 
    FROM customers 
    JOIN (SELECT rentals."customerId", count(rentals.id) as "rentalsCount" FROM rentals GROUP BY rentals."customerId") q1 
    ON q1."customerId" = customers.id ${filters} ${order} ${offsetAndLimit}`;
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
    let dbQuery = `SELECT customers.*, q1."rentalsCount" 
    FROM customers 
    JOIN (SELECT rentals."customerId", count(rentals.id) as "rentalsCount" FROM rentals GROUP BY rentals."customerId") q1 
    ON q1."customerId" = customers.id WHERE id = $1`;
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
    const order = setOrder(req.route.path, req.query);
    const offsetAndLimit = setOffsetAndLimit(req.query);
    const [filters, params] = filterRentals(req.query);
    let dbQuery = `SELECT rentals.*, 
    jsonb_build_object('name', customers.name, 'id', customers.id) AS customer,
    jsonb_build_object('id', games.id, 'name', games.name, 'categoryId', games."categoryId", 'categoryName', categories.name) AS game            
    FROM rentals 
    JOIN customers ON rentals."customerId" = customers.id
    JOIN games ON rentals."gameId" = games.id
    JOIN categories ON categories.id = games."categoryId" ${filters} ${order} ${offsetAndLimit}`;
    try {
        const rentals = await db.query(dbQuery, params);
        res.send(rentals.rows);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.get("/rentals/metrics", async (req, res) => {
    const [filters, params] = setStartAndEndDate(req.query);
    let dbQuery = `
    SELECT q1.*, (q1.revenue / q1.rentals) AS average 
    FROM (SELECT SUM("originalPrice" + COALESCE("delayFee",0)) AS "revenue" , 
    COUNT(id) as "rentals" FROM rentals ${filters}) q1`;
    try {
        const rentals = await db.query(dbQuery, params);
        res.send(rentals.rows);
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
