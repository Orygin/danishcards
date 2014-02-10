var gameRules = require('./danishGameRules');
var playerManager = require('./playerManager');

function gameChat() {
	this.io = {};

	this.commandCb = [];

	this.gameRules = gameRules;

	this.on = function(name, desc, fct) {
		this.commandCb[name] = fct;
		this.commandCb[name].desc = desc;
	};

	this.on('/help', 'display this', function () {
		var response = "Available commands are : \n";

		for(var i in this.commandCb)
		{
			response += i + " : " + this.commandCb[i].desc + "\n";
		}

		return {isCommand:true, message: response};
	});

	this.on('/giffcards', 'Cheat : Replace hand with new cards', function () {
		gameRules.renewHand(socket);

		return {isCommand:true, message: "giffen new cards"};
	});

	this.on('/plsrdy', 'Play a please ready sound to everybody', function () {
		this.io.sockets.emit('play sound rdy');

		return {isCommand:true, message: "Please ready up!"};
	});

	this.on('/createAI', 'Creates a bot, needs a name as argument', function (arg) {
		if(arg.length < 1)
			return {isCommand:true, message: "Missing argument"};

		var res = this.playerManager.addAI(arg[0]);

		if(res == 'ok')
			return {isCommand:true, message: "Bot added : " + arg[0]};

		else if (res == 'maxplayers')
			return {isCommand:true, message: "Could not add AI : Too much players"};

		else if (res == 'name')
			return {isCommand:true, message: "Could not add AI : Name already taken"};

		else
			return {isCommand:true, message: "Could not add AI : Unknown error"};
	});
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

	var arg = msg.split(' ');
	var cmd = arg[0];
	arg.splice(0,1);

	if(this.commandCb[cmd] === undefined)
		return {isCommand:true, message: "Command unknown : " + cmd};

	return this.commandCb[cmd].call(this, arg);	
};

module.exports = new gameChat();