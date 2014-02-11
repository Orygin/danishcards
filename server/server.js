var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , gameRules = require('./danishGameRules')
  , Player = require('./player')
  , playerManager = require('./playerManager')
  ,	gameChat = require('./chat')
  , accountManager = require('./accountManager');

  gameRules.playerManager = playerManager;
  gameRules.io = io;
  gameChat.io = io;
  gameChat.gameRules = gameRules;
  gameChat.playerManager = playerManager;
  playerManager.gameRules = gameRules;

process.env.PWD = process.cwd()

app.use(express.static(process.env.PWD+'/client/'));
app.use(express.logger());

server.listen(Number(process.env.PORT || 1337));

io.sockets.on('connection', function (socket) {

	socket.on('activate', function (data) {
		if(accountManager.connect(data.name, data.pw))
			playerManager.addPlayer(socket, data.name);
		else
			socket.emit('error', 'couldn\'t log in');
	});
	socket.on('create account', function(data) {
		if(accountManager.addAccount(data.name, data.pw))
			socket.emit('account created');
		else
			socket.emit('error', 'couldn\'t create account');
	});
	socket.on('disconnect', function () {
		playerManager.removePlayer(socket);
	});
	socket.on('setReady', function () {
		playerManager.setPlayerReady(socket);
	});
	socket.on('setUnready', function () {
		playerManager.setPlayerUnready(socket);
	});
	socket.on('set tapped card', function (card) {
		if(playerManager.tappedCard(socket, card))
			socket.broadcast.emit('tapped card', {name: socket.player.name, card: card});
	});
	socket.on('play cards', function (cards) {
		gameRules.playCards(socket, cards);
	});
	socket.on('gibe stack', function () {
		gameRules.playerTakeStack(socket);
	});
	socket.on('play table card', function (id) {
		gameRules.playTableCard(socket, id);
	});
	socket.on('ace target', function (name) {
		gameRules.aceTarget(name);
	});
	socket.on('send chat', function (msg) {
		gameChat.rcvChat(socket, msg);
	});
});
