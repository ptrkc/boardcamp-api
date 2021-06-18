import db from "../dbConfig.js";
import {
    customerValidation,
    integerValidation,
} from "../functions/validations.js";
import { setOffsetAndLimit, setOrder } from "../functions/sortersAndFilters.js";

export async function getCustomers(req, res) {
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
    LEFT JOIN (SELECT rentals."customerId", count(rentals.id) as "rentalsCount" FROM rentals GROUP BY rentals."customerId") q1 
    ON q1."customerId" = customers.id ${filters} ${order} ${offsetAndLimit}`;
    try {
        const customersSelect = await db.query(dbQuery, params);
        res.send(customersSelect.rows);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
}

export async function getCustomersId(req, res) {
    const id = integerValidation(req.params.id);
    if (!id) {
        res.sendStatus(400);
        return;
    }
    let dbQuery = `SELECT customers.*, q1."rentalsCount" 
    FROM customers 
    LEFT JOIN (SELECT rentals."customerId", count(rentals.id) as "rentalsCount" FROM rentals GROUP BY rentals."customerId") q1 
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
}

export async function postCustomers(req, res) {
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
}

export async function putCustomers(req, res) {
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
}
