RuChat.controller('roomsController', function($scope, $location, $rootScope, $routeParams, socket) {

    $scope.currentUser = $routeParams.user;
    $scope.allUsers = [];

    // Get the list of all rooms
    socket.emit('rooms');
    // respond to emitted event from server
    socket.on('roomlist', function(list) {
        $scope.rooms = Object.keys(list);
    });

    socket.emit('users');

    socket.on('userlist', function(userlist) {
        for (var i = 0; i < userlist.length; ++i) {
            $scope.allUsers[i] = userlist[i];
        }
    });

    $scope.createRoom = function() {
        socket.emit('rooms');
        $location.path('/room/' + $scope.currentUser + '/' + $scope.roomName);
    };

    $scope.curUserChannels = {};

    socket.emit('getUserChannels');

    socket.on('getCurUserChannels', function(channels){
        $scope.curUserChannels = channels;
    });

    $scope.data = {
            roomName: "",
            msg: ""
        };

    $scope.sendMsg = function(channel) {

        $scope.data.msg = $scope.data.msg;
        $scope.data.roomName = channel;

        socket.emit('sendmsg', $scope.data);
        $scope.data.msg = "";
    };

    

});