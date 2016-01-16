var gameChat = require('./chat'),
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

function playRoom(data, roomService) {
	this.GAMESTATES = {
		NOTPLAYING : {value: 0, name: "Not Playing"},
		TAPPINGPHASE: {value: 1, name: "Tapping phase"},
		PLAYERTURN: {value:2, name: "Player turn"}
	};
	this.emitSocket = false;

	this.roomName = data.roomName;
	this.password = data.password;
	this.cheats = data.cheats;
	this.owner = data.owner;
	this.gameName = data.gameRules;
	this.maxPlayers = 5;
	this.gameState = this.GAMESTATES.NOTPLAYING;
	this.rcon = 'sauce';
	this.autoPrune = true;

	this.events = [];
	this.io = new overlayIo(roomService.io, this);

	this.gameRules = this.getGameRules(this);
	this.playerManager = this.getPlayerManager(this);
	this.gameChat = new gameChat(this);
	this.voteSystem = new voteSystem(this);
	this.roomService = roomService;

	this.on('player disconnect', function (socket) {
		roomService.updateLounge();
	});
	this.postInit();
};
playRoom.prototype.on = function(name, fct) {
	if(this.events[name]=== undefined)
		this.events[name] = [];

	this.events[name][this.events[name].length] = fct;
};
playRoom.prototype.__defineGetter__('sockets', function () { // filter to io
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
playRoom.prototype.getInfos = function() {
	return {name: this.roomName,
			public: (this.password === undefined || this.password == ""),
			owner: this.owner,
			cheats: this.cheats,
			maxPlayers: this.maxPlayers,
			gameState: this.gameState,
			gameName: this.gameName,
			players: this.playerManager.players.length};
};
playRoom.prototype.canJoin = function(socket, pass) {
	if(this.password !== '' && this.password !== undefined && this.password !== pass)
		return false;

	return this.playerManager.players.length < this.maxPlayers;
};
playRoom.prototype.playerJoin = function(socket) {
	socket.hostRoom = this;
	this.playerManager.addPlayer(socket, socket.playerName);
	socket.emit('join room', this.roomName);
	socket.join(this.roomName);
};
playRoom.prototype.playerLeave = function(socket) {
	socket.hostRoom = undefined;
	this.playerManager.removePlayer(socket);
	socket.leave(this.roomName);
};
module.exports = playRoom;