// Manages players and AIs

var baseBot = require('./AI/oryginAI'),
	Player = require('./player'),
	accountManager = require('../accountManager');

function playerManager(host){
	this.players= [];
	this.hostRoom = host;
}
playerManager.prototype.addPlayer = function (socket, name){
	if(this.players.length >= this.hostRoom.maxPlayers){
		socket.emit('error', 'too many players', this.hostRoom.maxPlayers);
		socket.disconnect();
		return 'maxplayers';
	}

	if(this.getPlayer(name)){
		this.getPlayer(name).disconnect();
		this.removePlayer(this.getPlayer(name));
		return this.addPlayer(socket, name);
	}

	socket.player = new Player(name);

	this.players[this.players.length] = socket;

	this.hostRoom.sockets.emit('user connected', name);

	return 'ok';
}

playerManager.prototype.addAI = function(name) {
	if(require('../accountManager').getAccount(name)){
		return 'name';
	}// bots may not take an already existing account name (which would prevent a player from connecting)

	var bot = new baseBot(this.hostRoom);
	bot.io = this.hostRoom.io;
	bot.isAi = true;
	var res = this.addPlayer(bot, name);
	bot.player.isAI = true;
	bot.activate();
	return res;
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
			if(this.emptyHand(socket))
				this.broadcastPickingDeckSize();

			this.players.splice(i,1);

			this.hostRoom.sockets.emit('user disconnected', socket.player.name);
			this.hostRoom.emit('player disconnect', socket);

			socket.player = undefined;

			return true;
		}
	};
	return false;
}
playerManager.prototype.kickPlayer = function(name) {
	var plr = this.getPlayer(name);
	plr.disconnect();
	this.removePlayer(plr);
};
playerManager.prototype.removeAI = function(name) {
	var plr = this.getPlayer(name);
	
	if(!plr)
		return false;

	return this.removePlayer(plr);
};
playerManager.prototype.emptyHand = function(socket) {
	var b = this.hostRoom.gameRules.playingDeck.length;
	for (var i = socket.player.handCards.length - 1; i >= 0; i--) {
		if(this.hostRoom.gameRules.playingDeck.length > 0)
			this.hostRoom.gameRules.playingDeck.splice(0,0, socket.player.handCards[i]);
	};
	for (var i = socket.player.tappedCards.length - 1; i >= 0; i--) {
		if(this.hostRoom.gameRules.playingDeck.length > 0)
			this.hostRoom.gameRules.playingDeck.splice(0,0, socket.player.tappedCards[i]);
	};
	for (var i = socket.player.tableCards.length - 1; i >= 0; i--) {
		if(this.hostRoom.gameRules.playingDeck.length > 0)
			this.hostRoom.gameRules.playingDeck.splice(0,0, socket.player.tableCards[i]);
	};

	this.hostRoom.gameRules.shuffleCards(this.hostRoom.gameRules.playingDeck);

	return this.hostRoom.gameRules.playingDeck.length > b; // Did we add cards to the stack
};
playerManager.prototype.setPlayerReady = function (socket){
	socket.player.ready = true;
	this.hostRoom.sockets.emit('player ready', socket.player.name);
	if(this.players.length > 1)
	{
		var start = true;
		for (var i = this.players.length - 1; i >= 0; i--) {
			if(!this.players[i].player.ready)
				start = false;
		};
		if(start)
			this.hostRoom.gameRules.startGame();
	}
}
playerManager.prototype.setPlayerUnready = function (socket){
	socket.player.ready = false;
	this.hostRoom.sockets.emit('player unready', socket.player.name);
}
playerManager.prototype.setAIReady = function(name) {
	var plr = this.getPlayer(name);
	if(!plr)
		return false;

	this.setPlayerReady(plr);
	return true;
}
playerManager.prototype.setAllAIReady = function() {
	this.forEachAI(function (ai) {
		this.setPlayerReady(ai);
	})
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

			this.players[i].broadcast.to(this.hostRoom.roomName).emit('player unready', this.players[i].player.name);
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
					tappedHand: this.players[i].player.tappedCards,
					isAI: this.players[i].player.isAI};
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
	this.hostRoom.sockets.emit('playing hand size', {name: player.player.name, size: player.player.handCards.length});
}
playerManager.prototype.tappedCard = function (socket, card) {
	if(socket.player.tappedCards.length >= 3)
		return false;
	console.dir(card);
	socket.player.tappedCards[socket.player.tappedCards.length] = card;
	for (var i = socket.player.handCards.length - 1; i >= 0; i--) {
		if(this.hostRoom.gameRules.cardsEqual(socket.player.handCards[i], card))
			socket.player.handCards.splice(i,1);
	}
	this.broadcastPlayerHandSize(socket);
	this.checkAllPlayerTapped();
	this.hostRoom.sockets.emit('tapped card', {name: socket.player.name, card: card});
	return true;
}
playerManager.prototype.checkAllPlayerTapped = function () {
	var start = true;

	for (var i = this.players.length - 1; i >= 0; i--) {
		if(this.players[i].player.tappedCards.length != 3)
			start = false
	}
	if(start)
		this.hostRoom.gameRules.endTappingPhase();
}

playerManager.prototype.broadcastPickingDeckSize = function () {
	this.hostRoom.sockets.emit('picking deck size', this.hostRoom.gameRules.playingDeck.length);
}
playerManager.prototype.broadcastPlayerTurn = function (id) {
	this.hostRoom.sockets.emit('player turn', this.players[id].player.name);
}
playerManager.prototype.broadcastNewStackCards = function (cards) {
	this.hostRoom.sockets.emit('cards played', cards);	
}
playerManager.prototype.broadcastCutStack = function () {
	this.hostRoom.sockets.emit('stack cut');
}
playerManager.prototype.forEachAI = function(fct) {
	for (var i = this.players.length - 1; i >= 0; i--) {
		if(this.players[i].player.isAI)
			fct.call(this, this.players[i]);
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
playerManager.prototype.disconnectAllPlayers = function() {
	for (var i = this.players.length - 1; i >= 0; i--) {
		this.players[i].disconnect();
	};
};
module.exports = exports = playerManager;