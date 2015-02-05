//This was exported to its own module so it can be called on the fakeSocket of AIs as well as player's socket

module.exports = function() {
	this.on('disconnect', function () {
		if(this.hostRoom !== undefined)
			this.hostRoom.playerManager.removePlayer(this);
	});
	this.on('get current state', function () {
		this.emit('current state', {	playingStack: this.hostRoom.gameRules.playingStack,
										pickingStackSize: this.hostRoom.gameRules.playingDeck.length, 
										gameState: this.hostRoom.gameState, 
										players: this.hostRoom.playerManager.getPlayerList(),
										availableCommands: this.hostRoom.gameChat.getCommandList(),
										roomName: this.hostRoom.roomName	});
	});
	this.on('set ready', function () {
		this.hostRoom.playerManager.setPlayerReady(this);
	});
	this.on('set unready', function () {
		this.hostRoom.playerManager.setPlayerUnready(this);
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
	this.on('send chat', function (msg) {
		this.hostRoom.gameChat.rcvChat(this, msg);
	});
};