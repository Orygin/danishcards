function gameChat(host) {
	this.hostRoom = host;

	this.commandCb = [];

	this.on = function(name, desc, flags, fct) {
		this.commandCb[name] = fct;
		this.commandCb[name].desc = desc;
		this.commandCb[name].flags = flags;
	};

	this.on('/help', 'display this', [], function (arg) {
		if(arg.length > 1 && arg[1] == "vote")
			return {isCommand:true, message: this.hostRoom.voteSystem.listVotes()};

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

		if(arg[1] == this.hostRoom.rcon)
		{
			var acm = require('../accountManager');
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
	this.on('/plsrdy', 'Play a please ready sound to everybody',  ['owner', 'replicated'], function () {
		this.hostRoom.sockets.emit('play sound rdy');

		return {isCommand:true, message: "Please ready up!"};
	});
	this.on('/cheats', 'Enable or disable cheats', ['owner', 'replicated'], function(arg) {
		if(arg.length < 2)
			return {isCommand:true, message: "cheats : " + this.hostRoom.cheats};

		this.hostRoom.cheats = arg[1] ? 1 : 0;

		return {isCommand:true, message: "cheats changed to : " + arg[1]};
	});

	this.on('/createAI', 'Creates a bot, needs a name as argument',  ['owner'], function (arg) {
		if(arg.length < 2)
			return {isCommand:true, message: "Missing argument"};

		var res = this.hostRoom.playerManager.addAI(arg[1]);

		if(res == 'ok')
			return {isCommand:true, message: "Bot added : " + arg[1]};

		else if (res == 'maxplayers')
			return {isCommand:true, message: "Could not add AI : Too much players"};

		else if (res == 'name')
			return {isCommand:true, message: "Could not add AI : Name already taken"};

		else
			return {isCommand:true, message: "Could not add AI : Unknown error"};
	});
	this.on('/setAIRdy', 'Sets a bot ready',  ['owner'], function (arg) {
		if(this.hostRoom.playerManager.setAIReady(arg[1]))
			return {isCommand:true, message: "AI set ready"};
		else
			return {isCommand:true, message: "Could not set AI ready"};
	});
	this.on('/setAllAIRdy', 'Sets all bot ready',  ['owner'], function (arg) {
		if(this.hostRoom.playerManager.setAllAIReady())
			return {isCommand:true, message: "AI set ready"};
	});
	this.on('/setAIUnRdy', 'Sets a bot unready',  ['owner'], function (arg) {
		if(this.hostRoom.playerManager.setAIUnready(arg[1]))
			return {isCommand:true, message: "AI set unready"};
		else
			return {isCommand:true, message: "Could not set AI unready"};
	});
	this.on('/removeAI', 'removes an AI from the game', ['owner'], function(arg) {
		if(this.hostRoom.playerManager.removeAI(arg[1]))
			return {isCommand:true, message: "AI removed"};
		else
			return {isCommand:true, message: "Could not remove AI"};
	});
	this.on('/saveAccounts', 'Saves all accounts to file', ['admin'], function () {
		var acc = require('../accountManager');
		acc.saveToFile();
		return {isCommand:true, message: "Accounts saved"};
	});
	this.on('/vote', 'Allow players to vote or create votes', [], function (args) {
		if(args.length < 2)
			return {isCommand:true, message: this.hostRoom.voteSystem.listVotes()};

		this.hostRoom.voteSystem.castVote(args);
		return {isCommand:true, message: ""};
	});
	this.on('/kick', 'Kicks a player', ['owner'], function (args) {
		if(args.length < 2)
			return {isCommand:true, message: 'Please give a player name'};

		this.hostRoom.roomService.kickPlayer(args[1]);
		return {isCommand:true, message: "Player " + args[1] + ' kicked.'};
	});
}

gameChat.prototype.rcvChat = function(socket, msg) {
	var cmd = this.parseCommand(socket, msg);

	if(cmd.message === '')
		return;

	if(!cmd.isCommand)
		this.hostRoom.sockets.emit('chat message', {player: socket.player.name, message: msg});
	else if(cmd.isReplicated)
		this.hostRoom.sockets.emit('chat command', cmd);
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
			var acm = require('../accountManager');

			if(!acm.isPlayerAdmin(socket.player.name))
				return {isCommand:true, message: "You don't have admin rights"};
		}
		else if(flag == 'owner')
		{
			var acm = require('../accountManager');

			if(!acm.isPlayerAdmin(socket.player.name) && this.hostRoom.owner !== socket.player.name)
				return {isCommand:true, message: "You don't have the rights to do that"};
		}
		else if(flag == 'cheat')
		{
			if(this.hostRoom.cheats != 1)
				return {isCommand:true, message: "Cant exec command with cheats off"};
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
	this.hostRoom.sockets.emit('chat command', {message: msg});
};
module.exports = gameChat;