var BaseClass = require('../gameRoom/playerManager');
	Player = require('./player'),
	makeSocket = require('./makeSocket');
	const util = require('util');


function playerManager(host){
	this.players = []; // Connected users in this room
	this.registeredPlayers = []; // Players signed to play next game
	this.activePlayers = []; // players currently in game
	this.hostRoom = host;
	this.playerClass = Player;
}

util.inherits(playerManager, BaseClass);

playerManager.prototype.addPlayer = function (socket, name){
	BaseClass.prototype.addPlayer.call(this, socket, name);
	makeSocket.make.call(socket);
}
playerManager.prototype.removePlayer = function (socket, name){
	BaseClass.prototype.removePlayer.call(this, socket);
	makeSocket.remove.call(socket);
}
playerManager.prototype.getPlayerClass = function (name) {
	for (var i = this.activePlayers.length - 1; i >= 0; i--) {
		if (this.activePlayers[i].name === name){
			return this.activePlayers[i];
		}
	};
	for (var i = this.registeredPlayers.length - 1; i >= 0; i--) {
	 	if(this.registeredPlayers[i].name === name) {
	 		return this.registeredPlayers[i];
	 	}
	 }; 
	//Player not in memory, new object
	return BaseClass.prototype.getPlayerClass.call(this, name);
}
playerManager.prototype.registerPlayer = function (socket) {
	this.reg
}
module.exports = exports = playerManager