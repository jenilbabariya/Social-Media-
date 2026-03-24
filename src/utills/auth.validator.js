import Validator from "validatorjs";
import { errorResponse } from "../lib/general.js";

export const validate = (data, rules) => {
    const validation = new Validator(data, rules, );

    if (validation.fails()){
        return errorResponse(
            "Validation failed",
            validation.errors.all(),

        );
    }

    return null;
};