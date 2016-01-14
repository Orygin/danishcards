//This was exported to its own module so it can be called on the fakeSocket of AIs as well as player's socket

module.exports.make = function() {
	this.on('get current state', function () {
		this.emit('current state', {	gameState: this.hostRoom.gameState, 
										players: this.hostRoom.playerManager.getPlayerList(),
										availableCommands: this.hostRoom.gameChat.getCommandList(),
										roomName: this.hostRoom.roomName,
										gameName: this.hostRoom.gameName	});
	});
};
module.exports.remove = function () {
	this.removeAllListeners('get current state');
}