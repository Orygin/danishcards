function gameChat() {
	this.io = {};
	this.gameRules = {};
}
gameChat.prototype.rcvChat = function(socket, msg) {
	var cmd = this.parseCommand(socket, msg);

	if(!cmd.isCommand)
		this.io.sockets.emit('chat message', {player: socket.player.name, message: msg});
	else
		socket.emit('chat command', cmd);
};

gameChat.prototype.parseCommand = function(socket, msg) {
	if(msg[0] != '/')
		return {isCommand: false};
	
	if(msg == "/giffcards")
	{
		this.gameRules.renewHand(socket);
		return {isCommand:true, message: "giffen new cards"};
	}
	if(msg == "/plsrdy")
	{
		this.io.sockets.emit('play sound rdy');
		return {isCommand:true, message: "Please ready up!"};
	}
		
};

module.exports = new gameChat();