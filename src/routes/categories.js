import db from "../dbConfig.js";
import { nameValidation } from "../functions/validations.js";
import { setOffsetAndLimit, setOrder } from "../functions/sortersAndFilters.js";

export async function getCategories(req, res) {
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
}

export async function postCategories(req, res) {
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
}
