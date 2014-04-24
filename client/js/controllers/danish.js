var app = angular.module('danish', ['ui.keypress', 'ui.bootstrap', 'luegg.directives', 'angular-audio-player', 'danishDirectives', 'ngSanitize'])

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

	$scope.setLastRoomName = function(name) {
		$scope.lastRoomName = name;
	};
	$scope.playSound = function(name) {
		$scope.$broadcast("play sound", name);
	};
	$scope.leaveRoom = function() {
		$scope.socket.emit('leave room', $scope.lastRoomName);
	};

	$scope.connectionStatus = "disconnected";
	$scope.footerData = 'Game created by Louis Geuten. Graciously hosted by Maxime Robaux. Source available on <a href="https://github.com/Orygin/danishcards">github</a>';

	$scope.connect = function (playerName, password) {
		if(playerName === "" || playerName === undefined ||password === "" || password === undefined)
			return $scope.addAlert('Can\t login with empty username or password', 'danger');;

		var socket = io.connect('/', {'force new connection': true, 'reconnect': false});
		$scope.socket = socket;
		$scope.createSocketOn(socket);

		$scope.playerName = playerName;
		$scope.password = password;
	}
	$scope.createSocketOn = function(socket) {
		socket.on('connect', function () {
			$scope.$apply(function () {
				$scope.connectionStatus = "connecting";
			});
			socket.emit('activate', {name: $scope.playerName, pw: $scope.password});
		});
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
		        else if(name == 'failed room creation'){
					$scope.addAlert('Could not create room!', 'warning');
		        }
		        else if(name === 'fail join room password'){
		        	$scope.addAlert('Could not join room: invalid password!', 'warning');
		        }
		        else if (name === 'fail join room exist'){
		        	$scope.addAlert('Could not join room: room doesn\'t exists!', 'warning');
		        }
      		});
		});
		socket.on('disconnect', function () {
			$scope.connectionStatus = "disconnected";
			$scope.addAlert('You have been disconnected', 'danger');

			socket.removeAllListeners();
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
	$scope.setFooter = function(t) {
		$scope.footerData = t;
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
	$scope.$on('play sound', function(e, snd) {
		if($scope.muted)
			return;

		switch(snd){
			case "connected":
				$scope.connectSound.play();
				break;
			case "selfTurn":
				$scope.selfTurnSound.play();
				break;
			case "playerTurn":
				$scope.playerTurnSound.play();
				break;
			case "stackCut":
				$scope.stackCutSound.play();
				break;
			case "plsrdy":
				$scope.plsRdy.play();
				break;
			case "mention":
				$scope.mentionSound.play();
				break;
		}
	});
});
