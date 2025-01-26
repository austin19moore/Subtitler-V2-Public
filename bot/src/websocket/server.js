const { WebSocketServer } = require("ws");

const ws = new WebSocketServer({ port: 8090 });

const sendMessage = (data) => {
  ws.clients.forEach(function each(client) {
    if (client.readyState == WebSocket.OPEN && data != undefined)
      client.send(JSON.stringify(data));
  });
};

module.exports = { sendMessage };
