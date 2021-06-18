import dayjs from "dayjs";
import formatParser from "dayjs/plugin/customParseFormat.js";
import db from "../dbConfig.js";
import {
    rentalValidation,
    integerValidation,
} from "../functions/validations.js";
import {
    setStartAndEndDate,
    filterRentals,
    setOffsetAndLimit,
    setOrder,
} from "../functions/sortersAndFilters.js";

dayjs.extend(formatParser);

export async function getRentals(req, res) {
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
}

export async function getRentalsMetrics(req, res) {
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
}

export async function postRentals(req, res) {
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
}

export async function postRentalsReturn(req, res) {
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
}

export async function deleteRentals(req, res) {
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
}
