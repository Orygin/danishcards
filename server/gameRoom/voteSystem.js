function voteSystem (host) {
	this.hostRoom = host;
	this.possibleVotes = [];
	this.currentVote = {name: "", voters: 0, args: {}};
	this.voteTimeout = -1;

	this.addVote('kick', 
		function () { return Math.ceil(this.hostRoom.playerManager.players.length / 2); }, 
		function (args) {
			if(this.hostRoom.playerManager.getPlayer(args[2]))
				return true;

			return false;
		},
		function (arg) {
			this.hostRoom.accountManager.kickPlayer(arg[2], 60);
		}
	);
	
	this.addVote('endgame', function () { return this.hostRoom.playerManager.players.length; }, function () { return true; }, function (arg) { this.hostRoom.gameRules.endGame(); });

	this.hostRoom.on('player disconnect', function () {
		this.voteSystem.checkVote();
	});
};
voteSystem.prototype.addVote = function(name, completeness, validity, onComplete) {
	this.possibleVotes[name] = onComplete;
	this.possibleVotes[name].valid = validity;
	this.possibleVotes[name].threshold = completeness;
};

voteSystem.prototype.castVote = function(args) {
	if(this.currentVote.name === ""){
		if(!this.possibleVotes[args[1]].valid(args)){
			args[0].emit('chat command', {message:'Could not start vote : vote invalid'});
			return;
		}
		this.currentVote.name = args[1];
		this.currentVote.args = args; // remove the vote name from args
		this.currentVote.voters = 1;

		var out = "New vote : ";
		for(var i = 1; i <= args.length-1; i++)
			out += args[i] + " ";

		this.hostRoom.gameChat.serverSay(out);

		var _this = this;

		this.voteTimeout = setTimeout(function () {
			_this.endVote();

			this.hostRoom.gameChat.serverSay('Voting time elapsed, vote failed');
		}, 120 * 1000);

		this.checkVote();
	}
	else if (args[1] === this.currentVote.name){
		this.currentVote.voters += 1;
		if(!this.checkVote())
			this.hostRoom.gameChat.serverSay(args[0].player.name + ' voted');
	}
	else if (args.length == 1)
	{
		var res = "No vote in progress";
		if(this.currentVote.name !== ""){
			var out = "";
			for(var i = 1; i <= this.currentVote.args.length-1; i++)
				out += this.currentVote.args[i] + " ";
			res = "Vote in progress : " + out + " : " + this.currentVote.voters;
		}
		args[0].emit('chat command', {message: res});
	}
	else
		args[0].emit('chat command', {message:'failed to start a vote : vote already in progress'});
};
voteSystem.prototype.checkVote = function() {
	if(this.currentVote.name === "")
		return false;

	if(this.possibleVotes[this.currentVote.name].threshold() <= this.currentVote.voters){
		var func = this.possibleVotes[this.currentVote.name];
		var args = this.currentVote.args;
		this.endVote();

		func(args); // endVote before, avoids firing twice if player gets disconnected
		this.hostRoom.gameChat.serverSay('Vote passed : ' + this.currentVote.name);

		return true;
	}
	return false;
};
voteSystem.prototype.endVote = function() {
	if(this.voteTimeout != -1)
		clearTimeout(this.voteTimeout);

	this.currentVote = {name: "", voters: 0, args: {}};
	this.voteTimeout = -1;
};
voteSystem.prototype.listVotes = function() {
	var res = "";
	for(i in this.possibleVotes)
	{
		res += i + "\n";
	}
};
module.exports = voteSystem;