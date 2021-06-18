import joi from "joi";
import dayjs from "dayjs";
import formatParser from "dayjs/plugin/customParseFormat.js";

dayjs.extend(formatParser);

export function nameValidation(object) {
    const schema = joi.object({
        name: joi.string().trim().required(),
    });
    const error = schema.validate(object, { allowUnknown: true }).error;
    return error ? false : object.name.trim();
}

export function gameValidation(object) {
    const urlRegEx =
        /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
    const schema = joi.object({
        name: joi.string().trim().required(),
        image: joi.string().trim().pattern(urlRegEx).required(),
        stockTotal: joi.number().integer().min(1).required(),
        categoryId: joi.number().integer().min(1).required(),
        pricePerDay: joi.number().integer().min(1).required(),
    });
    const error = schema.validate(object).error;
    return error
        ? false
        : { ...object, name: object.name.trim(), image: object.image.trim() };
}

export function customerValidation(object) {
    const schema = joi.object({
        name: joi.string().trim().required(),
        phone: joi
            .string()
            .trim()
            .pattern(/^\d{10,11}$/)
            .required(),
        cpf: joi
            .string()
            .trim()
            .pattern(/^\d{11}$/)
            .required(),
        birthday: joi.string().required(),
    });
    let error = schema.validate(object).error;
    const validBirthday =
        object.birthday &&
        dayjs(object.birthday.trim(), "YYYY-MM-DD", true).isValid();
    return error || !validBirthday
        ? false
        : {
              name: object.name.trim(),
              phone: object.phone.trim(),
              cpf: object.cpf.trim(),
              birthday: object.birthday.trim(),
          };
}

export function rentalValidation(object) {
    const schema = joi.object({
        customerId: joi.number().integer().min(1).required(),
        gameId: joi.number().integer().min(1).required(),
        daysRented: joi.number().integer().min(1).required(),
    });
    const error = schema.validate(object).error;
    return error ? false : object;
}

export function integerValidation(str) {
    const isInt = parseInt(str) > 0;
    return isInt ? parseInt(str) : false;
}
