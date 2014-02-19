var gameRules = require('./danishGameRules'),
	playerManager = require('./playerManager'),
	_g = require('./globals');

function gameChat() {
	this.io = {};

	this.commandCb = [];

	this.gameRules = gameRules;

	_g.gameChat = this;

	this.on = function(name, desc, flags, fct) {
		this.commandCb[name] = fct;
		this.commandCb[name].desc = desc;
		this.commandCb[name].flags = flags;
	};

	this.on('/help', 'display this', [], function (arg) {
		if(arg.length > 1 && arg[1] == "vote")
			return {isCommand:true, message: _g.voteSystem.listVotes()};

		var response = "Available commands are : \n";

		for(var i in this.commandCb)
		{
			response += i + " : " + this.commandCb[i].desc + "\n";
		}

		return {isCommand:true, message: response};
	});
	this.on('/setAdmin', 'Gives you admin right', [], function (arg) {
		if(arg.length < 2)
			return {isCommand:true, message: 'password missing'};

		if(arg[1] == _g.rcon)
		{
			var acm = require('./accountManager');
			acm.getAccount(arg[0].player.name).rank = 'admin';
			return {isCommand:true, message: 'given admin rights'};
		}
		else
			return {isCommand:true, message: 'Invalid password'};
	});
	this.on('/askew', 'Cheat : Skew your card draws', ['cheat'],  function (arg) {
		if(arg.length <= 1)
			return {isCommand:true, message: "Missing argument"};

		arg[0].player.askew = arg[1];

		return {isCommand:true, message: "You are now skewing your draws by " + arg[1]};
	});
	this.on('/plsrdy', 'Play a please ready sound to everybody',  ['admin', 'replicated'], function () {
		this.io.sockets.emit('play sound rdy');

		return {isCommand:true, message: "Please ready up!"};
	});
	this.on('/sv_cheats', 'Enable or disable cheats', ['admin', 'replicated'], function(arg) {
		if(arg.length < 2)
			return {isCommand:true, message: "sv_cheats : " + _g.sv_cheats};

		_g.sv_cheats = arg[1] ? 1 : 0;

		return {isCommand:true, message: "Sv_cheats changed to : " + arg[1]};
	});

	this.on('/createAI', 'Creates a bot, needs a name as argument',  ['admin'], function (arg) {
		if(arg.length < 2)
			return {isCommand:true, message: "Missing argument"};

		var res = this.playerManager.addAI(arg[1]);

		if(res == 'ok')
			return {isCommand:true, message: "Bot added : " + arg[1]};

		else if (res == 'maxplayers')
			return {isCommand:true, message: "Could not add AI : Too much players"};

		else if (res == 'name')
			return {isCommand:true, message: "Could not add AI : Name already taken"};

		else
			return {isCommand:true, message: "Could not add AI : Unknown error"};
	});
	this.on('/setAIRdy', 'Sets a bot ready',  ['admin'], function (arg) {
		if(this.playerManager.setAIReady(arg[1]))
			return {isCommand:true, message: "AI set ready"};
		else
			return {isCommand:true, message: "Could not set AI ready"};
	});
	this.on('/setAIUnRdy', 'Sets a bot unready',  ['admin'], function (arg) {
		if(this.playerManager.setAIUnready(arg[1]))
			return {isCommand:true, message: "AI set unready"};
		else
			return {isCommand:true, message: "Could not set AI unready"};
	});
	this.on('/removeAI', 'removes an AI from the game', ['admin'], function(arg) {
		if(this.playerManager.removeAI(arg[1]))
			return {isCommand:true, message: "AI removed"};
		else
			return {isCommand:true, message: "Could not remove AI"};
	});
	this.on('/saveAccounts', 'Saves all accounts to file', ['admin'], function () {
		var acc = require('./accountManager');
		acc.saveToFile();
		return {isCommand:true, message: "Accounts saved"};
	});
	this.on('/vote', 'Allow players to vote or create votes', [], function (args) {
		_g.voteSystem.castVote(args);
		return {isCommand:true, message: ""};
	});
}

gameChat.prototype.rcvChat = function(socket, msg) {
	var cmd = this.parseCommand(socket, msg);

	if(!cmd.isCommand)
		this.io.sockets.emit('chat message', {player: socket.player.name, message: msg});
	else if(cmd.isReplicated)
		this.io.sockets.emit('chat command', cmd);
	else
		socket.emit('chat command', cmd);
};

gameChat.prototype.parseCommand = function(socket, msg) {
	if(msg[0] != '/')
		return {isCommand: false};

	var arg = msg.split(' ');
	var cmd = arg[0];
	arg[0] = socket;

	if(this.commandCb[cmd] === undefined)
		return {isCommand:true, message: "Command unknown : " + cmd};

	var replic = false;
	for (var i = this.commandCb[cmd].flags.length - 1; i >= 0; i--)
	{
		var flag = this.commandCb[cmd].flags[i];
		if(flag == 'admin')
		{
			var acm = require('./accountManager');

			if(!acm.isPlayerAdmin(socket.player.name))
				return {isCommand:true, message: "You don't have admin rights"};
		}
		else if(flag == 'cheat')
		{
			if(_g.sv_cheats != 1)
				return {isCommand:true, message: "Cant exec command with sv_cheats off"};
		}
		else if (flag == 'replicated')
			replic = true;
	}

	var res = this.commandCb[cmd].call(this, arg);
	res.isReplicated = replic;

	return res;
};

gameChat.prototype.getCommandList = function() {
	var response = [];
	for(var i in this.commandCb)
	{
		response[response.length] = {name: i, desc: this.commandCb[i].desc, flags: this.commandCb[i].flags};
	}
	return response;
};
gameChat.prototype.serverSay = function(msg) {
	this.io.sockets.emit('chat command', {message: msg});
};
module.exports = new gameChat();