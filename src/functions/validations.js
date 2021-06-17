import joi from "joi";

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
