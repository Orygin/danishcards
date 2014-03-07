var baseAI 	= require('./baseAI');

oryginAI.prototype = baseAI.prototype;
oryginAI.prototype.constructor = oryginAI;

function oryginAI() {
	baseAI.call(this);

	this.onCreate = function (state) {
		if(state.gameState == this.hostRoom.GAMESTATES.NOTPLAYING)
			this.socket.emit('set ready');
	}
	// The client has to handle these functions accordingly,
	// While we use the values from the server directly
	// So these are events but the data is already changed
	this.on('new game state', function(state) {

	});
	this.on('new playing hand', function (cards) {
	});

	this.on('new table hand', function (size) {
	});

	this.on('playing hand size', function (playerName) {
	});

	this.on('picking deck size', function (size) {
	});

	this.on('player turn', function (playerName) {
	});

	this.on('force play smallest', function () {
		this.gameRules.playCards(this, [this.player.getSmallestCard()]);
	});

	this.on('cards played', function (cards) {
	});

	this.on('draw card', function (cards) {
	});

	this.on('stack cut', function (size) {
	});

	this.on('play tapped cards', function (data) {
	});

	this.on('played table card', function (playerName) {
	});

	this.on('ace targeted', function (playerName) {
	});
}

module.exports = oryginAI;