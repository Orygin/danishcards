var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    accountManager = require('./accountManager'),
    makeSocket = require('./gameRoom/makeSocket'),
    roomService = require('./roomservice');

accountManager.readFromFile();

roomService.io = io;
roomService.accountManager = accountManager;

process.env.PWD = process.cwd()

app.use(express.compress());
app.use(express.static(process.env.PWD + '/client/'));

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

server.listen(server_port, server_ip_address);

io.sockets.on('connection', function (socket) {
  socket.on('activate', function (data) {
    if(!accountManager.connect(data.name, data.pw))
      socket.emit('fail', 'failed login');

    socket.playerName = data.name;
    roomService.joinLounge(socket, data.name);

    makeSocket.call(socket);
  });
  socket.on('add post', function (data) {
    roomService.addPost(socket, data);
  })
  socket.on('join room', function (data) {
      roomService.joinRoom(socket, data.roomName, data.password);
  });
  socket.on('leave room', function (name) {
      roomService.leaveRoom(socket, name);
  });
  socket.on('create room', function (data) {
      if(roomService.createRoom(data))
        roomService.joinRoom(socket, data.roomName, data.password);
      else
        socket.emit('fail', 'failed room creation');
  });
});

process.on('exit', function (code) {
  accountManager.saveToFile(true);

  if(code == 1337){
    var exec = require('child_process').spawn,
        fs = require('fs'),
        out = fs.openSync('./out.log', 'a'),
        err = fs.openSync('./out.log', 'a');
    var ch = exec('./restartserver.sh', [], {cwd: process.env.PWD, detached: true, stdio: [ 'ignore', out, err ]});
    ch.unref();
  }
});

app.post('/restart', function(req, res){
  res.send(200);

  process.exit(1337);
});