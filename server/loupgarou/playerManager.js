var BaseClass = require('../gameRoom/playerManager');
	Player = require('./player'),
playerManager.prototype = new BaseClass();

function playerManager(host){
	this.players= [];
	this.hostRoom = host;
	this.playerClass = Player;
}

module.exports = exports = playerManager