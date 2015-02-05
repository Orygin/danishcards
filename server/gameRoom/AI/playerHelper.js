function playerHelper(ai, host) { // Player helper for AI
	this.Ai = ai;
	this.hostRoom = host;
	this.playerManager = host.playerManager;
}

playerHelper.prototype.forEachPlayer = function(fct) {
	var players = this.getPlayerList();
	for (var i = players.length - 1; i >= 0; i--) {
		fct.call(this.Ai, players[i]);
	};
};

playerHelper.prototype.forEachAI = function(fct) {
	var players = this.getPlayerList();
	for (var i = players.length - 1; i >= 0; i--) {
		if(players[i].player.isAI)
			fct.call(this.Ai, players[i]);
	};
};
playerHelper.prototype.forEachNonAI = function(fct) {
	var players = this.getPlayerList();
	for (var i = players.length - 1; i >= 0; i--) {
		if(!players[i].player.isAI)
			fct.call(this.Ai, players[i]);
	};
};

playerHelper.prototype.getPlayerList = function() {
	return this.playerManager.getPlayerList();
};
playerHelper.prototype.playerHasCards = function (player) {
	return (player.playingHand != 0 || player.tappedHand.length != 0 || player.tableHand != 0);
};

module.exports = playerHelper;