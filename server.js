import http from "http";
import app from "./app.js";
import env from "./src/config/env.js"
import connectDB from "./src/config/db.js";
import { initSocket } from "./src/config/socket.js";

await connectDB();

const server = http.createServer(app);
initSocket(server);

server.listen(env.port, () => {
    console.log(`server is running on ${env.port}`);
});