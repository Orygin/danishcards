// Manages players and AIs

var BaseClass = require('../gameRoom/playerManager'),
	Player = require('./player'),
	makeSocket = require('./makeSocket');

playerManager.prototype = new BaseClass();
playerManager.prototype.parent = BaseClass.prototype;

function playerManager(host){
	this.players= [];
	this.hostRoom = host;
	this.playerClass = Player;
}
playerManager.prototype.addPlayer = function (socket, name){
	BaseClass.prototype.addPlayer.call(this, socket, name);
	makeSocket.call(socket);
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
playerManager.prototype.playerWithCardsCount = function () {
	var count = 0;
	for (var i = this.players.length - 1; i >= 0; i--) {
		if(this.players[i].player.hasCards())
			count += 1;
	};
	return count;
}

module.exports = exports = playerManager