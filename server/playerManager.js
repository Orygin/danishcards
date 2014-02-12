// Manages players and AIs

var baseBot = require('./AI/oryginAI'),
	Player = require('./player'),
	accountManager = require('./accountManager'),
	gameChat = require('./chat'),
	_g = require('./globals');

function playerManager(){
	this.players= [];
	this.gameRules = {};
}
playerManager.prototype.addPlayer = function (socket, name){
	if(this.players.length >= _g.maxPlayers){
		socket.emit('error', 'too many players', _g.maxPlayers);
		socket.disconnect();
		return 'maxplayers';
	}

	if(this.getPlayer(name)){
		this.getPlayer(name).disconnect();
		this.removePlayer(this.getPlayer(name));
		this.addPlayer(socket, name);
	}

	socket.player = new Player(name);

	this.players[this.players.length] = socket;

	socket.broadcast.emit('user connected', name);

	socket.emit('current state', {	playingStack: this.gameRules.playingStack,
									pickingStackSize: this.gameRules.playingDeck.length, 
									gameState: _g.gameState, 
									players: this.getPlayerList(),
									availableCommands: gameChat.getCommandList()	});

	return 'ok';
}

playerManager.prototype.addAI = function(name) {
	if(accountManager.getAccount(name)){
		return 'name';
	}// bots may not take an already existing account name (which would prevent a player from connecting)

	var bot = new baseBot();
	bot.io = this.gameRules.io;
	bot.isAi = true;
	return this.addPlayer(bot, name);
}

playerManager.prototype.getPlayer = function (name)
{
  for (var i = this.players.length - 1; i >= 0; i--) {
		if(this.players[i].player.name == name)
			return this.players[i];
	};
  return false;
}
playerManager.prototype.removePlayer = function (socket){
	if(socket.player === undefined)
		return false;

	for (var i = this.players.length - 1; i >= 0; i--) {
		if(this.players[i].player.name == socket.player.name){
			this.players.splice(i,1);
			socket.broadcast.emit('user disconnected', socket.player.name);
			this.gameRules.checkEndGame();
			return true;
		}
	};
	return false;
}
playerManager.prototype.removeAI = function(name) {
	var plr = this.getPlayer(name);
	
	if(!plr)
		return false;

	return this.removePlayer(plr);
};
playerManager.prototype.setPlayerReady = function (socket){
	socket.player.ready = true;
	this.gameRules.io.sockets.emit('player ready', socket.player.name);
	if(this.players.length > 1)
	{
		var start = true;
		for (var i = this.players.length - 1; i >= 0; i--) {
			if(!this.players[i].player.ready)
				start = false;
		};
		if(start)
			this.gameRules.startGame();
	}
}
playerManager.prototype.setPlayerUnready = function (socket){
	socket.player.ready = false;
	this.gameRules.io.sockets.emit('player unready', socket.player.name);
}
playerManager.prototype.setAIReady = function(name) {
	var plr = this.getPlayer(name);
	if(!plr)
		return false;

	this.setPlayerReady(plr);
	return true;
}
playerManager.prototype.setAIUnready = function(name) {
	var plr = this.getPlayer(name);
	if(!plr)
		return false;

	this.setPlayerUnready(plr);
	return true;
};
playerManager.prototype.endGame = function () {
	for (var i = this.players.length - 1; i >= 0; i--) {
			this.players[i].player.ready = false;

			this.players[i].broadcast.emit('player unready', this.players[i].player.name);
		};
}
playerManager.prototype.getPlayers = function () {
	var ret = [];
	for (var i = this.players.length - 1; i >= 0; i--) {
		ret[i] = this.players[i].player;
	};
	return ret;
}
playerManager.prototype.getPlayerList = function () {
	var ret = [];
	for (var i = this.players.length - 1; i >= 0; i--) {
		ret[i] = {	name: this.players[i].player.name, 
					tableHand:this.players[i].player.tableCards.length, 
					playingHand: this.players[i].player.handCards.length, 
					tappedHand: this.players[i].player.tappedCards};
	};
	return ret;
}
playerManager.prototype.broadcastPlayersHand = function () {
	for (var i = this.players.length - 1; i >= 0; i--) {
		this.players[i].emit('new playing hand', this.players[i].player.handCards);
		this.broadcastPlayerHandSize(this.players[i]);
	};
}
playerManager.prototype.broadcastPlayersTableSize = function () {
	for (var i = this.players.length - 1; i >= 0; i--) {
		this.players[i].emit('new table hand', this.players[i].player.tableCards.length);
	};	
}
playerManager.prototype.broadcastPlayerHandSize = function (player) {
	player.broadcast.emit('playing hand size', {name: player.player.name, size: player.player.handCards.length});
}
playerManager.prototype.tappedCard = function (socket, card) {
	if(socket.player.tappedCards.length >= 3)
		return false;

	socket.player.tappedCards[socket.player.tappedCards.length] = card;
	for (var i = socket.player.handCards.length - 1; i >= 0; i--) {
		if(this.gameRules.cardsEqual(socket.player.handCards[i], card))
			socket.player.handCards.splice(i,1);
	}
	this.broadcastPlayerHandSize(socket);
	this.checkAllPlayerTapped();
	return true;
}
playerManager.prototype.checkAllPlayerTapped = function () {
	var start = true;

	for (var i = this.players.length - 1; i >= 0; i--) {
		if(this.players[i].player.tappedCards.length != 3)
			start = false
	}
	if(start)
		this.gameRules.endTappingPhase();
}

playerManager.prototype.broadcastPickingDeckSize = function () {
	this.gameRules.io.sockets.emit('picking deck size', this.gameRules.playingDeck.length);
}
playerManager.prototype.broadcastPlayerTurn = function (id) {
	this.gameRules.io.sockets.emit('player turn', this.players[id].player.name);
}
playerManager.prototype.broadcastNewStackCards = function (cards) {
	this.gameRules.io.sockets.emit('cards played', cards);	
}
playerManager.prototype.broadcastCutStack = function () {
	this.gameRules.io.sockets.emit('stack cut');
}
playerManager.prototype.forEachAI = function(fct) {
	for (var i = this.players.length - 1; i >= 0; i--) {
		if(this.players[i].player.isAI)
			fct(this.players[i]);
	};
};
playerManager.prototype.forEachNonAI = function(fct) {
	for (var i = this.players.length - 1; i >= 0; i--) {
		if(!this.players[i].player.isAI)
			fct(this.players[i]);
	};
};
playerManager.prototype.forEachPlayer = function(fct) {
	for (var i = this.players.length - 1; i >= 0; i--) {
		fct(this.players[i]);
	};
};
playerManager.prototype.playerWithCardsCount = function () {
	var count = 0;
	for (var i = this.players.length - 1; i >= 0; i--) {
		if(this.players[i].player.hasCards())
			count += 1;
	};
	return count;
}
module.exports = exports = new playerManager();