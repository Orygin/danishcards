function loungeCtrl($scope, $modal) {
	$scope.room = {};
	$scope.toPost =  {};
	$scope.socket.on('update lounge', function (data) {
		$scope.$apply(function () {
			if($scope.lounge = [])
				$scope.lounge = data;
			else
				for (var i = data.posts.length - 1; i >= 0; i--) {
					var found = false;
					for (var j = $scope.lounge.posts.length - 1; j >= 0; j--) {
						if($scope.lounge.posts[j].id == data.posts[i].id){
							found = true;
						}
					};	
					if (!found)
						$scope.lounge.posts[$scope.lounge.posts.length] = data.posts[i];
				};
			$scope.lounge.rooms = data.rooms;
			$scope.lounge.connectedUsers = data.connectedUsers;
		});
	});
	$scope.addPost = function () {
		$scope.socket.emit('add post', $scope.toPost);
	}
	$scope.joinRoom = function (room) {
		if(!room.public)
			return $scope.createModalPassword(room);

		$scope.socket.emit('join room', {roomName: room.name, password: ''});
	};
	$scope.createRoom = function () {
		if($scope.roomName === '' || $scope.roomName === undefined)	
			return $scope.addAlert('Can\'t create room with empty name', 'warning');

		$scope.socket.emit('create room', {	roomName: $scope.roomName,
											cheats: $scope.cheats,
											owner: $scope.playerName,
											password: $scope.room.password,
											gameRules: $scope.gameRules});
	};
	$scope.createModalPassword = function(room) {
		var modalInstance = $modal.open({
			templateUrl: 'passwordContent.html',
			controller: ModalInstanceCtrl
		});

		modalInstance.result.then(function (pass) {
			$scope.socket.emit('join room', {roomName: room.name, password: pass});
		});
	};
};

var ModalInstanceCtrl = function ($scope, $modalInstance) {
	$scope.ok = function (p) {
		$modalInstance.close(p);
	};
	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
};