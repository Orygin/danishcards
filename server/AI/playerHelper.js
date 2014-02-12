function playerHelper(ai) { // Player helper for AI
	this.Ai = ai;

	this.pManager = require('../playerManager');
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
	return this.pManager.getPlayerList();
};

module.exports = playerHelper;