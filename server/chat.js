function gameChat() {
	this.io = {};
}
gameChat.prototype.rcvChat = function(socket, msg) {
	if(!this.tryCommand(msg))
		this.io.sockets.emit('chat message', {player: socket.player.name, message: msg});
};
gameChat.prototype.tryCommand = function(msg) {
	if(msg[0] == '/')
	{
		return true
	}
	else
		return false;
};

module.exports = new gameChat();