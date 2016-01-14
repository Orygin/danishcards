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
	makeSocket.make.call(socket);
}
playerManager.prototype.removePlayer = function (socket, name){
	BaseClass.prototype.removePlayer.call(this, socket);
	makeSocket.remove.call(socket);
}
module.exports = exports = playerManager