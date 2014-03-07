var app = angular.module('danish', ['ui.keypress', 'ui.bootstrap', 'luegg.directives', 'angular-audio-player', 'danishDirectives'])

.controller('Main', function ($scope, $location, $window){
	$scope.alerts = [];
	$scope.addAlert = function(mesg, level) {
		$scope.alerts.push({msg: mesg, type: level});
	};
	$scope.closeAlert = function(index) {
		$scope.alerts.splice(index, 1);
	};
	$scope.getTemplateForStatus = function () {
		if($scope.connectionStatus == "disconnected")
			return 'tpl/disconnected.html';
		else if($scope.connectionStatus == "inroom")
			return 'tpl/inroom.html';
		else if($scope.connectionStatus == "lounge")
			return 'tpl/lounge.html';
		else if($scope.connectionStatus == "connecting")
			return 'tpl/disconnected.html';
	};

	$scope.connectionStatus = "disconnected";

	$scope.connect = function (playerName, password) {
		var socket = io.connect('/');
		$scope.socket = socket;
		$scope.createSocketOn(socket);

		$scope.playerName = playerName;
		$scope.password = password;

		socket.on('connect', function () {
			$scope.$apply(function () {
				$scope.connectionStatus = "connecting";
			});
			socket.emit('activate', {name: playerName, pw: password});
		});
	}
	$scope.createSocketOn = function(socket) {
		socket.on('error', function (name, value) {
	    	$scope.$apply(function(){
		        if(name == 'too many players')
		        {
		          $scope.connectionStatus = "disconnected";
		          $scope.addAlert('Too many players already', 'danger');
		          socket.disconnect();
		        }
		        else if (name == 'couldn\'t log in')
		        {
		          $scope.connectionStatus = "disconnected";
		          $scope.addAlert('Couldn\'t log in', 'danger');
		          socket.disconnect();	
		        }
		        else if (name == 'failed login')
		        {
		          $scope.connectionStatus = "disconnected";
		          $scope.addAlert('Username already taken / wrong password / kicked', 'danger');
		          socket.disconnect();	
		        }
      		});
		});
		socket.on('disconnect', function () {
			$scope.connectionStatus = "disconnected";
			$scope.addAlert('You have been disconnected', 'danger');
		});
		socket.on('join lounge', function (data) {
			$scope.$apply(function () {
				$scope.connectionStatus = "lounge";
				$scope.lounge = data;
			});
		});
		socket.on('join room', function (data) {
			$scope.$apply(function () {
				$scope.connectionStatus = "inroom";
			});
		});
	};
	
	$scope.getNumber = function(num) {
		return new Array(num);   
	};
});
app.controller('githubLog', function ($scope){
	var script = document.createElement('script');
	script.src = 'https://api.github.com/repos/orygin/danishcards/commits?callback=ghcb';

	document.getElementsByTagName('head')[0].appendChild(script);

	$scope.ghlog = "";
	$scope.parseData = function(data) {
		for (var i = data.length - 1; i >= 0; i--) {
			$scope.ghlog += "\n" + data[i].commit.committer.name + " - " + data[i].commit.committer.date;
			var lines = data[i].commit.message.match(/[^\r\n]+/g);
			for (var j = 0; j <= lines.length - 1; j++) {
				$scope.ghlog += "\n - " + lines[j]; //Each line gets an added dash
			}
		};
	};
});
function ghcb(response) {
  var data = response.data;
  scope = angular.element(document.getElementsByClassName('ghLog')[0]).scope();
  scope.$apply(function() {
  	scope.parseData(data);
  });
}

app.controller('Sound', function ($scope){
	$scope.muted = false;

	$scope.toggleMute = function () {
		$scope.muted = !$scope.muted;
	}

	$scope.$on('connected', function(){
		if(!$scope.muted)
			$scope.connectSound.play();
	});
	$scope.$on('selfTurn', function () {
		if(!$scope.muted)
			$scope.selfTurnSound.play();
	});
	$scope.$on('playerTurn', function(){
		if(!$scope.muted)
			$scope.playerTurnSound.play();
	});
	$scope.$on('stackCut', function(){
		if(!$scope.muted)
			$scope.stackCutSound.play();
	});
	$scope.$on('plsrdy', function(){
		if(!$scope.muted)
			$scope.plsRdy.play();
	});
	$scope.$on('mention', function() {
		if(!$scope.muted)
			$scope.mentionSound.play();
	});
});
