var gameRules = require('../danishGameRules');
var playerManager = require('../playerManager');

function playerHelper() { // Player helper for AI
}

playerHelper.prototype.forEachPlayer = function(fct) {
	var players = playerManager.getPlayerList();
	for (var i = players.length - 1; i >= 0; i--) {
		fct(players[i]);
	};
};

playerHelper.prototype.getPlayerList = function() {
	return playerManager.getPlayerList();
};

module.exports = new playerHelper();