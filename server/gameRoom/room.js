var gameChat = require('./chat'),
	playerManager = require('./playerManager'),
	gameRules = require('./danishGameRules'),
	voteSystem = require('./voteSystem'),
	makeSocket = require('./makeSocket');


function overlayIo (io, host) {
	this.io = io;
	this.hostRoom = host;
}
overlayIo.prototype.emit = function(name, data, ignore) {
	this.io.sockets.in(this.hostRoom.roomName).emit(name, data); // original emit

	this.hostRoom.playerManager.forEachAI(function (ai) {
		if(ignore === undefined)
			ai.emit(name, data);
		else if(ignore.player.name != ai.player.name)
			ai.emit(name, data);
	});
};

function playRoom(name, io) {
	this.GAMESTATES = {
		NOTPLAYING : {value: 0, name: "Not Playing"},
		TAPPINGPHASE: {value: 1, name: "Tapping phase"},
		PLAYERTURN: {value:2, name: "Player turn"}
	};
	this.emitSocket = false;

	this.roomName = name;
	this.cheats = false;
	this.maxPlayers = 5;
	this.gameState = this.GAMESTATES.NOTPLAYING;

	this.events = [];
	this.io = new overlayIo(io, this);

	this.gameRules = new gameRules(this);
	this.playerManager = new playerManager(this);
	this.gameChat = new gameChat(this);
	this.voteSystem = new voteSystem(this);

	this.on('player disconnect', function (socket) {
	});
};
playRoom.prototype.on = function(name, fct) {
	if(this.events[name]=== undefined)
		this.events[name] = [];

	this.events[name][this.events[name].length] = fct;
};
playRoom.prototype.__defineGetter__('sockets', function () { // Screen to io
	this.emitSocket = true;
	return this;
});
playRoom.prototype.emit = function(name, data) {
	if(this.emitSocket)	{
		this.emitSocket = false;
		this.io.emit(name, data);
	}
	var ev = this.events[name];
	
	if(ev === undefined)
		return;

	for (var i = ev.length - 1; i >= 0; i--) {
		ev[i].call(this, data);
	};
};

playRoom.prototype.remove = function() {
	this.playerManager.disconnectAllPlayers();
};
playRoom.prototype.getInfos = function() {
	return {name: this.roomName, cheats: this.cheats, maxPlayers: this.maxPlayers, gameState: this.gameState, players: this.playerManager.players.length};
};
playRoom.prototype.canJoin = function(socket) {
	return this.playerManager.players.length < this.maxPlayers;
};
playRoom.prototype.playerJoin = function(socket) {
	makeSocket.call(socket, this);
	this.playerManager.addPlayer(socket, socket.playerName);
	socket.emit('join room', this.roomName);
	socket.join(this.roomName);
};
playRoom.prototype.playerLeave = function(socket) {
	this.playerManager.removePlayer(socket);
	socket.leave(this.roomName);
};
module.exports = playRoom;