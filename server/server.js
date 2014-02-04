var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , gameRules = require('./danishGameRules')
  , Player = require('./player')
  , playerManager = require('./playerManager')
  ,	gameChat = require('./chat');

  gameRules.playerManager = playerManager;
  gameRules.io = io;
  gameChat.io = io;
  gameChat.gameRules = gameRules;
  playerManager.gameRules = gameRules;

process.env.PWD = process.cwd()

app.use(express.static(process.env.PWD+'/client/'));
app.use(express.logger());

server.listen(Number(process.env.PORT || 1337));

io.sockets.on('connection', function (socket) {
	socket.player = new Player("");

	socket.on('setPlayerName', function (data) {
		socket.player.name = data;
    	var add = playerManager.addPlayer(socket);
		if(add == 'k'){
				socket.emit('currentState', {	playingStack: gameRules.playingStack,
												pickingStackSize: gameRules.playingDeck.length, 
												gameState: gameRules.gameState, 
												players: playerManager.getPlayerList()	});
				socket.broadcast.emit('user connected', data);
			}
		else if (add == 'max')
			socket.emit('error', 'too many players', gameRules.maxPlayers);
    else if (add == 'name')
      socket.emit('error', 'name already in use');
	});
	socket.on('disconnect', function () {
		playerManager.removePlayer(socket);
		socket.broadcast.emit('user disconnected', socket.player.name);
		gameRules.checkEndGame();
	});
	socket.on('setReady', function () {
		playerManager.setPlayerReady(socket);
		io.sockets.emit('player ready', socket.player.name);
	});
	socket.on('setUnready', function () {
		playerManager.setPlayerUnready(socket);
		io.sockets.emit('player unready', socket.player.name);
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
