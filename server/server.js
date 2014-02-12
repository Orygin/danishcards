var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , gameRules = require('./danishGameRules')
  , Player = require('./player')
  , playerManager = require('./playerManager')
  ,	gameChat = require('./chat')
  , accountManager = require('./accountManager')
  , makeSocket = require('./makeSocket')
  , globalIO = require('./globalIO');

  globalIO.sockets.sIo = io;
  gameRules.playerManager = playerManager;
  gameRules.io = globalIO;
  gameChat.io = globalIO;
  gameChat.gameRules = gameRules;
  gameChat.playerManager = playerManager;
  playerManager.gameRules = gameRules;

process.env.PWD = process.cwd()

app.use(express.static(process.env.PWD+'/client/'));
//app.use(express.logger());

server.listen(Number(process.env.PORT || 1337));

io.sockets.on('connection', function (socket) {
	makeSocket.call(socket);
});
