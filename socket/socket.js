const {Server} = require("socket.io");
const http = require("http");
const express = require("express");

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: ["http://localhost:3000", "https://www.b2bhubindia.com"],
		methods: ["GET", "POST"],
	},
});
 const getReceiverSocketId = (receiverId) => {
	return userSocketMap[receiverId];
};

const customerSocketMap = {}; // {customerId: socketId}

io.on("connection", (socket) => {
	console.log("a customer connected", socket.id);

	const customerId = socket.handshake.query.userId;
	if (customerId != "undefined") customerSocketMap[customerId] = socket.id;

	// io.emit() is used to send events to all the connected clients
	io.emit("getConnectedUsers", Object.keys(userSocketMap));

	// socket.on() is used to listen to the events. can be used both on client and server side
	socket.on("disconnect", () => {
		console.log("user disconnected", socket.id);
		delete userSocketMap[userId];
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	});
});

module.exports = { app, io, server, getReceiverSocketId };
