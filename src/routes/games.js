import db from "../dbConfig.js";
import { nameValidation, gameValidation } from "../functions/validations.js";
import { setOffsetAndLimit, setOrder } from "../functions/sortersAndFilters.js";

export async function getGames(req, res) {
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
    LEFT JOIN (SELECT rentals."gameId", count(rentals.id) as "rentalsCount" FROM rentals GROUP BY rentals."gameId") q1 
    ON q1."gameId" = games.id ${filters} ${order} ${offsetAndLimit}
    `;
    try {
        const games = await db.query(dbQuery, params);
        res.send(games.rows);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
}

export async function postGames(req, res) {
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
}
