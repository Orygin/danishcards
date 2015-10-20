function loungeCtrl($scope, $modal) {
	$scope.room = {};
	$scope.toPost =  {};
	$scope.socket.on('update lounge', function (data) {
		$scope.$apply(function () {
			$scope.lounge = data;
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
											password: $scope.room.password});
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