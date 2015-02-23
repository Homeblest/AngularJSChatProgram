RuChat.controller('MainController', function($scope, $location, $rootScope, $routeParams, socket) {

    $scope.currentUser = $routeParams.user;
    $scope.allUsers = [];
    $scope.curUserChannels = {};
    $scope.rooms = [];

    $scope.data = {
        roomName: "",
        msg: ""
    };

    // Get the list of all rooms
    socket.emit('rooms');

    // respond to emitted event from server by rooms event
    socket.on('roomlist', function(list) {
        var i = 0;
        for(var room in list){
            if(!list.hasOwnProperty(room)){
                continue;
            }
            if(list[room].isPrivate === false){
                $scope.rooms[i] = list[room].name;
                i++;
            }
        }
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
    socket.emit('joinroom', {room: 'lobby', priv: false}, function(success, reason){
        if(!success){
            console.log(reason);
        }else {
            $scope.sendJoinMsg('lobby');
        }
    });

    // When the user clicks on an available room
    // or creates a new room.
    $scope.createRoom = function(roomName) {
        // join the room only if he isnt already in it
        if ($scope.curUserChannels[roomName] === undefined) {
            var joinObj = {
                room: roomName,
                priv: false
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
});