//This was exported to its own module so it can be called on the fakeSocket of AIs as well as player's socket

module.exports.make = function() {
	this.on('get current state', function () {
		this.emit('current state', {	playingStack: this.hostRoom.gameRules.playingStack,
										pickingStackSize: this.hostRoom.gameRules.playingDeck.length, 
										gameState: this.hostRoom.gameState, 
										players: this.hostRoom.playerManager.getPlayerList(),
										availableCommands: this.hostRoom.gameChat.getCommandList(),
										roomName: this.hostRoom.roomName,
										gameName: this.hostRoom.gameName	});
	});
	this.on('set tapped card', function (card) {
		this.hostRoom.playerManager.tappedCard(this, card)
	});
	this.on('play cards', function (cards) {
		this.hostRoom.gameRules.playCards(this, cards);
	});
	this.on('gibe stack', function () {
		this.hostRoom.gameRules.playerTakeStack(this);
	});
	this.on('play table card', function (id) {
		this.hostRoom.gameRules.playTableCard(this, id);
	});
	this.on('ace target', function (name) {
		this.hostRoom.gameRules.aceTarget(name);
	});
};
module.exports.remove = function () {
	this.removeAllListeners('get current state');
	this.removeAllListeners('set tapped card');
	this.removeAllListeners('play cards');
	this.removeAllListeners('play table cards');
	this.removeAllListeners('gibe stack');
	this.removeAllListeners('ace target');
}