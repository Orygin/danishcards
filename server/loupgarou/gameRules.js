function danishGameRules(host){
	this.playerTurn = -1;
	this.playingStack = [];
	this.playingDeck = this.shuffleCards(staticCards.cards());
	this.hostRoom = host;

	this.hostRoom.on('player disconnect', function (socket) {
		this.gameRules.checkEndGame();
	});
}

danishGameRules.prototype.startGame = function () {