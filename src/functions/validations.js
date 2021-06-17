import joi from "joi";

export function nameValidation(object) {
    const schema = joi.object({
        name: joi.string().trim().required(),
    });
    const error = schema.validate(object, { allowUnknown: true }).error;
    return error ? false : object.name.trim();
}
