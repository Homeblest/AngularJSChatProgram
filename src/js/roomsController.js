RuChat.controller('roomsController', function($scope, $location, $rootScope, $routeParams, socket) {

    $scope.currentUser = $routeParams.user;
    $scope.allUsers = [];
    $scope.curUserChannels = {};

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


    socket.emit('getUserChannels');

    socket.on('getCurUserChannels', function(channels){
        $scope.curUserChannels = channels;
        var list = Object.keys(channels);
        for(var i = 0; i < list.length; i++){
            console.log(Object.keys(channels));
        }
    });

});