//This serves as a layer to socket.io. This allows us to send things to AI too as they are not true sockets and are unknown to socket.io

var playerManager = require('./playerManager');

function io () {
}
function sockets() {
	this.sIo = {};
}

sockets.prototype.emit = function(name, data, ignore) {
	this.sIo.sockets.emit(name, data);

	playerManager.forEachAI(function (ai) {
		if(ignore === undefined)
			ai.emit(name, data);
		else if(ignore.player.name != ai.player.name)
			ai.emit(name, data);
	});
};

var i = new io();
i.sockets = new sockets();

module.exports = i;