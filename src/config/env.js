import dotenv from "dotenv";

dotenv.config();

const env = {
    port: process.env.PORT,
    db_url: process.env.DB_URL,
    jwt_secret: process.env.JWT_SECRET,
    jwt_expire: process.env.JWT_EXPIRE,
    cookie_http_only: process.env.COOKIE_HTTP_ONLY === "ture",
    cookie_secure: process.env.COOKIE_SECURE === "true",
};

export default env;