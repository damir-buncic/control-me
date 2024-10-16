const express = require("express");
const expressWss = require("express-ws");
const { v4 } = require("uuid");

const PORT = 3000;

const app = express();

const wssServer = expressWss(app);

const wss = wssServer.getWss();

app.get("/", (req, res, next) => res.send("Hello!"));

wss.on("connection", (ws, req) => {
  ws._id = v4();
  ws.send(JSON.stringify({ type: "id", id: ws._id }));
});

app.ws("/", function (ws) {
  ws.on("message", function (msg) {
    const message = JSON.parse(msg);
    switch (message.type) {
      case "admin-ready": {
        ws._type = "admin";
        break;
      }
      case "client-ready": {
        ws._type = "client";
        ws._name = message.name;
        wss.clients.forEach((c) => {
          if (c._type === "admin") {
            c.send(JSON.stringify({ type: "client-online", name: message.name, id: ws._id, myId: c._id }));
          }
        });
        break;
      }
      case "offer": {
        wss.clients.forEach((c) => {
          if (c._id === message.id) {
            c.send(JSON.stringify({ type: "offer", id: ws._id, offer: message.offer }));
          }
        });
        break;
      }
      case "answer": {
        wss.clients.forEach((c) => {
          if (c._id === message.id) {
            c.send(JSON.stringify({ type: "answer", id: ws._id, answer: message.answer }));
          }
        });
        break;
      }
      case "ice-candidate": {
        wss.clients.forEach((c) => {
          if (c._id === message.id) {
            c.send(JSON.stringify({ type: "ice-candidate", id: message.id, candidate: message.candidate }));
          }
        });
        break;
      }
      case "connection-request": {
        wss.clients.forEach((c) => {
          if (c._id === message.to) {
            c.send(JSON.stringify({ type: "connection-request", replyTo: ws._id }));
          }
        });
      }
      case "connection-response": {
        wss.clients.forEach((c) => {
          if (c._id === message.to) {
            c.send(JSON.stringify({ type: "connection-response", accepted: message.accepted }));
          }
        });
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
