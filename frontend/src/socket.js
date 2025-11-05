import { io } from "socket.io-client";

const URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000" 
    : "https://slotswapper-97z9.onrender.com"; 

export const socket = io(URL, {
  transports: ["websocket"], 
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  withCredentials: true,
});

