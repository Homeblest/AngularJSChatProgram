RuChat.controller('MainController', function($scope, $location, $rootScope, $routeParams, socket) {

    $scope.currentUser = $routeParams.user;
    $scope.allUsers = [];
    $scope.curUserChannels = {};

    $scope.data = {
        roomName: "",
        msg: ""
    };

    // Get the list of all rooms
    socket.emit('rooms');

    // respond to emitted event from server by rooms event
    socket.on('roomlist', function(list) {
        $scope.rooms = Object.keys(list);
    });

    // Get the list of all connected users
    socket.emit('users');

    // Just copies all elements from userlist to our scope.
    socket.on('userlist', function(userlist) {
        for (var i = 0; i < userlist.length; ++i) {
            $scope.allUsers[i] = userlist[i];
        }
    });

    // Forces every user to join the lobby when they connect.
    socket.emit('joinroom', {room: 'lobby'}, function(success, reason){
        if(!success){
            console.log(reason);
        }else {
            $scope.sendJoinMsg('lobby');
        }
    });

    // When the create room form is submitted.
    $scope.createRoom = function(roomName) {

        if ($scope.curUserChannels[roomName] === undefined) {
            var joinObj = {
                room: roomName
            };
            socket.emit('joinroom', joinObj, function(success, reason) {
                if (!success) {
                    $scope.errorMessage = reason;
                } else {
                    socket.emit('rooms');
                    socket.emit('users');
                    socket.emit('getUserChannels');
                    $scope.sendJoinMsg(roomName);
                    $scope.roomName = "";
                }
            });
        }
    };

    $scope.sendJoinMsg = function(roomName) {
        var data = {
            roomName: roomName,
            msg: "Joined Room"
        };
        socket.emit('sendmsg', data);
    };

    $scope.sendLeaveMsg = function(roomName) {
        var data = {
            roomName: roomName,
            msg: "Left Room"
        };
        socket.emit('sendmsg', data);
    };

    $scope.sendInOutMsg = function(dataMessage) {
        var data = {
            roomName: dataMessage.roomName,
            msg: dataMessage.message
        };
        socket.emit('sendmsg', data);
    };

    $scope.sendPrivateMsg = function(name) {
        console.log("sendt");

    };
});