import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import env from "./env.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5000",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Parse cookies from handshake
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) return socket.disconnect();

    const accessToken = cookies
      .split(/; ?/)
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];

    if (!accessToken) {
      console.log("Socket connection rejected: No access token found in cookies");
      return socket.disconnect();
    }


    try {
      const decoded = jwt.verify(accessToken, env.jwt_secret);
      const userId = decoded.userId;

      // Join personal room
      socket.join(`user:${userId}`);
      console.log(`User ${userId} connected and joined room user:${userId}`);

      socket.on("join-post", (postId) => {
        socket.join(`post:${postId}`);
        console.log(`Socket ${socket.id} joined post room post:${postId}`);
      });

      socket.on("leave-post", (postId) => {
        socket.leave(`post:${postId}`);
        console.log(`Socket ${socket.id} left post room post:${postId}`);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    } catch (err) {
      console.error("Socket authentication error:", err.message);
      socket.disconnect();
    }
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
