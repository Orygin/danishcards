function loungeCtrl($scope, $modal) {
	$scope.socket.on('update lounge', function (data) {
		$scope.$apply(function () {
			$scope.lounge.rooms = data;
		});
	});
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
											password: $scope.roomPassword});
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