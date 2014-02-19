var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , gameRules = require('./danishGameRules')
  , Player = require('./player')
  , playerManager = require('./playerManager')
  ,	gameChat = require('./chat')
  , accountManager = require('./accountManager')
  , makeSocket = require('./makeSocket')
  , voteSystem = require('./voteSystem');

// hijack sockets.emit to account for AIs
io.sockets.oemit = io.sockets.emit;
io.sockets.emit = function (name, data, ignore) {
	this.oemit(name, data); // original emit

	playerManager.forEachAI(function (ai) {
		if(ignore === undefined)
			ai.emit(name, data);
		else if(ignore.player.name != ai.player.name)
			ai.emit(name, data);
	});
};
  
  accountManager.readFromFile();
  gameRules.playerManager = playerManager;
  gameRules.io = io;
  gameChat.io = io;
  gameChat.gameRules = gameRules;
  gameChat.playerManager = playerManager;
  playerManager.gameRules = gameRules;

process.env.PWD = process.cwd()

app.use(express.static(process.env.PWD+'/client/'));
//app.use(express.logger());
io.set('log level', 1);

server.listen(Number(process.env.PORT || 80));

io.sockets.on('connection', function (socket) {
  makeSocket.call(socket);
});

process.on('exit', function (code) {
  accountManager.saveToFile(true);
  console.log('exiting');
  if(code == 1337){
    var exec = require('child_process').exec;
    exec('./restartserver.sh', {cwd: process.env.PWD});  
  }
});

app.post('/restart', function(req, res){
  process.exit(1337);
});