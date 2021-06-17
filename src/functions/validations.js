import joi from "joi";

export function categoryValidation(category) {
    const schema = joi.object({
        name: joi.string().trim().required(),
    });
    const error = schema.validate(category).error;
    return error ? false : category.name.trim();
}
