export const successResponse = (msg = "Success", data = []
) => {
    return {
        flag: 1,
        msg,
        data
    };
};

export const errorResponse = (msg = "something went wrong", data = []
) => {
    return {
        flag: 0,
        msg,
        data
    };
};

export const authError = (msg = "Authentication failed", data = []

) => {
    return {
        flag: 2,
        msg,
        data
    };
};





