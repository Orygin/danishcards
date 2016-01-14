function loupGarouGameRules(host){
	this.playerTurn = -1;
	this.playingStack = [];
	this.playingDeck = this.shuffleCards(staticCards.cards());
	this.hostRoom = host;

	this.hostRoom.on('player disconnect', function (socket) {
		this.gameRules.checkEndGame();
	});
}

loupGarouGameRules.prototype.startGame = function () {

}
loupGarouGameRules.prototype.setGameState = function (state) {
	this.hostRoom.gameState = state;
	this.hostRoom.sockets.emit('new game state', state);
}
loupGarouGameRules.prototype.checkEndGame = function () {}
loupGarouGameRules.prototype.endGame = function () {}