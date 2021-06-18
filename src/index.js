import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import formatParser from "dayjs/plugin/customParseFormat.js";
import { getCategories, postCategories } from "./routes/categories.js";
import { getGames, postGames } from "./routes/games.js";
import {
    getCustomers,
    getCustomersId,
    postCustomers,
    putCustomers,
} from "./routes/customers.js";
import {
    deleteRentals,
    getRentals,
    getRentalsMetrics,
    postRentals,
    postRentalsReturn,
} from "./routes/rentals.js";

dayjs.extend(formatParser);

const app = express();
app.use(express.json());
app.use(cors());

app.get("/categories", (req, res) => getCategories(req, res));

app.post("/categories", (req, res) => postCategories(req, res));

app.get("/games", (req, res) => getGames(req, res));

app.post("/games", (req, res) => postGames(req, res));

app.get("/customers", (req, res) => getCustomers(req, res));

app.get("/customers/:id", (req, res) => getCustomersId(req, res));

app.post("/customers", (req, res) => postCustomers(req, res));

app.put("/customers/:id", (req, res) => putCustomers(req, res));

app.get("/rentals", (req, res) => getRentals(req, res));

app.get("/rentals/metrics", (req, res) => getRentalsMetrics(req, res));

app.post("/rentals", (req, res) => postRentals(req, res));

app.post("/rentals/:id/return", (req, res) => postRentalsReturn(req, res));

app.delete("/rentals/:id", (req, res) => deleteRentals(req, res));

app.listen(4000, () => {
    console.log("Server started on port 4000.");
});
