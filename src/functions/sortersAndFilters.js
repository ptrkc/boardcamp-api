import dayjs from "dayjs";

import formatParser from "dayjs/plugin/customParseFormat.js";
dayjs.extend(formatParser);

export function setStartAndEndDate(query) {
    let counter = 1;
    const params = [];
    let filters = "";
    const startDate = dayjs(query.startDate, "YYYY-MM-DD", true).isValid()
        ? query.startDate
        : false;
    const endDate = dayjs(query.endDate, "YYYY-MM-DD", true).isValid()
        ? query.endDate
        : false;
    if (startDate || endDate) {
        filters = " WHERE ";
        if (startDate) {
            filters += ` rentals."rentDate" >= $${counter} AND `;
            params.push(`'${startDate}'`);
            counter++;
        }
        if (endDate) {
            filters += ` rentals."rentDate" <= $${counter} AND `;
            params.push(`'${endDate}'`);
            counter++;
        }
    }
    filters = filters.substring(filters.length - 4, 0);
    return [filters, params];
}

export function filterRentals(query) {
    let counter = 1;
    const params = [];
    let filters = "";
    const customerId = integerValidation(query.customerId);
    const gameId = integerValidation(query.gameId);
    const status =
        query.status === "open" || query.status === "closed"
            ? query.status
            : false;
    const startDate = dayjs(query.startDate, "YYYY-MM-DD", true).isValid()
        ? query.startDate
        : false;
    if (customerId || gameId || status || startDate) {
        filters = " WHERE ";
        if (customerId) {
            filters += ` rentals."customerId" = $${counter} AND `;
            params.push(customerId);
            counter++;
        }
        if (gameId) {
            filters += ` rentals."gameId" = $${counter} AND `;
            params.push(gameId);
            counter++;
        }
        if (status) {
            filters += ` rentals."returnDate" IS ${
                status === "closed" ? "NOT" : ""
            } NULL AND `;
        }
        if (startDate) {
            filters += ` rentals."rentDate" >= $${counter} AND `;
            params.push(`'${startDate}'`);
            counter++;
        }
    }

    filters = filters.substring(filters.length - 4, 0);
    return [filters, params];
}

export function setOffsetAndLimit(object) {
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

export function setOrder(path, query) {
    let order = "";
    let desc = "ASC";
    if (!query.order) {
        return order;
    }
    if (query.desc === "true") {
        desc = "DESC";
    }
    const categories = ["id", "name"];
    const customers = [
        "id",
        "name",
        "phone",
        "cpf",
        "birthday",
        "rentalsCount",
    ];
    const games = [
        "id",
        "name",
        "image",
        "stockTotal",
        "categoryId",
        "pricePerDay",
        "categoryName",
        "rentalsCount",
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
