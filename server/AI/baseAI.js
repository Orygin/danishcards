var basePlayer = require('../player');
var playerHelper = require('./playerHelper');
var chat = require('../chat');

module.exports = function AI () {
	this.playerHelper = new playerHelper(this);
	this.player = {};
	this.io = {};

	this.socketCallbacks = [];
	this.emitBroadcast = false;

// The client has to handle these functions accordingly,
// While we use the values from the server directly
// So these are events but the data is already changed
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

	this.on('cards played', function (cards) {
	});

	this.on('stack cut', function (size) {
	});

	this.on('draw card', function (cards) {
	});

	this.on('played table card', function (playerName) {
	});

	this.on('ace targeted', function (playerName) {
	});

	this.on('force play smallest', function () {
	});

	this.on('play tapped cards', function (data) {
	});

	this.on('current state', function (state) { // called when the player object was created upon us
		this.player.isAI = true;
	});
}

module.exports.prototype.__defineGetter__('broadcast', function () { // We are to send info to everyone and other AIs
	this.emitBroadcast = true;
	return this;
});

module.exports.prototype.on = function(name, fct) {
	this.socketCallbacks[name] = fct;
};
module.exports.prototype.emit = function(name, data) {
	if(this.emitBroadcast == true)
	{
		this.emitBroadcast = false;
		this.io.sockets.emit(name, data); // Send to real players with socket.io
		this.playerHelper.forEachAI(function (Ai) {
			if(Ai.player.name != this.player.name)
				Ai.emit(name, data); // Emit for each Ai that is not us
		});

		return;
	}

	if(this.socketCallbacks[name] === undefined)
		return;

	this.socketCallbacks[name].call(this, data);
};