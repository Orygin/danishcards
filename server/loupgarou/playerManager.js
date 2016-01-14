var BaseClass = require('../gameRoom/playerManager');
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
module.exports = exports = playerManager