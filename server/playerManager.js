function playerManager(){
	this.players= [];
	this.gameRules = {};
}
playerManager.prototype.addPlayer = function (socket){
  if(this.getPlayer(socket.player.name))
    return 'name';
  
  if(this.players.length >= this.gameRules.maxPlayers)
	  return 'max';
  
	this.players[this.players.length] = socket;
  
	return 'k';
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
	for (var i = this.players.length - 1; i >= 0; i--) {
		if(this.players[i].player.name == socket.player.name)
			this.players.splice(i,1);
	};
}
playerManager.prototype.setPlayerReady = function (socket){
	socket.player.ready = true;
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
playerManager.prototype.endGame = function () {
	for (var i = this.players.length - 1; i >= 0; i--) {
			this.players[i].player.ready = false;

			this.players[i].broadcast.emit('player unready', this.players[i].player.name);
		};
}
playerManager.prototype.setPlayerUnready = function (socket){
	socket.player.ready = false;
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
playerManager.prototype.hasCards = function (plr) {
	return (plr.player.handCards.length != 0 || plr.player.tappedCards.length != 0 || plr.player.tableCards.length != 0);
}
playerManager.prototype.playerWithCardsCount = function () {
	var count = 0;
	for (var i = this.players.length - 1; i >= 0; i--) {
		if(this.hasCards(this.players[i]))
			count += 1;
	};
	return count;
}
module.exports = new playerManager();