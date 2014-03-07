function loungeCtrl($scope) {
	$scope.joinRoom = function (name) {
		$scope.socket.emit('join room', name);
	};
	$scope.clickCreateRoom = function () {
		if(!$scope.ButtonActivated)
			return $scope.ButtonActivated = true;
		
		if($scope.roomName === ""){
			$scope.addAlert('Can\'t create a room with an empty name', 'warning');
			return;
		}
		$scope.socket.emit('create room', $scope.roomName);
	};
};