RuChat.controller('roomsController', function($scope, $location, $rootScope, $routeParams, socket) {

    $scope.currentUser = $routeParams.user;
    $scope.allUsers = [];

    // Make the user join the lobby automatically
    var joinObj1 = {
        room: 'lobby'
    };
    socket.emit('joinroom', joinObj1, function(success, reason) {
        if (!success) {
            console.log(reason);
        }else {
            sendJoinMsg('lobby');
        }
    });

    $scope.curUserChannels = {};

    socket.emit('getUserChannels');

    socket.on('getCurUserChannels', function(channels) {
        $scope.curUserChannels = channels;
    });

    socket.on('banned', function(room, users, username) {
        if ($scope.curUserChannels[room] !== undefined) {
            $scope.curUserChannels[room].banned = users;
        }
    });

    // Get the list of all rooms
    socket.emit('rooms');
    // respond to emitted event from server
    socket.on('roomlist', function(list) {
        $scope.rooms = Object.keys(list);
    });

    // Get the list of all connected users
    socket.emit('users');

    socket.on('userlist', function(userlist) {
        for (var i = 0; i < userlist.length; ++i) {
            $scope.allUsers[i] = userlist[i];
        }
    });

    $scope.createRoom = function(roomName) {
        if ($scope.curUserChannels[roomName] === undefined) {
            var joinObj = {
                room: roomName
            };
            socket.emit('joinroom', joinObj, function(success, reason) {
                if (!success) {
                    $scope.errorMessage = reason;
                } else {
                    sendJoinMsg(roomName);
                }

            });

            socket.emit('getUserChannels');
            socket.emit('rooms');
            $scope.roomName = "";
        }
    };

    socket.on('updateusers', function(room, users, ops) {
        // This fires the rooms event which fires the roomlist event.
        socket.emit('rooms');
        if ($scope.curUserChannels[room] !== undefined) {
            $scope.curUserChannels[room].users = users;
            $scope.curUserChannels[room].ops = ops;
            socket.emit('getUserChannels');
        }

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


    socket.on('updatechat', function(roomName, history) {
        if ($scope.curUserChannels[roomName] !== undefined) {
            $scope.curUserChannels[roomName].messageHistory = history;
        }
    });

    var sendJoinMsg = function(roomName) {
        var data = {
            roomName: roomName,
            msg: "Joined Room"
        };
        socket.emit('sendmsg', data);
    };

    var sendLeaveMsg = function(roomName) {
        var data = {
            roomName: roomName,
            msg: "Left Room"
        };
        socket.emit('sendmsg', data);
    };

    $scope.isOp = function(channel, name) {
        var roomOps = Object.keys($scope.curUserChannels[channel].ops);

        for (var i = 0; i < roomOps.length; ++i) {
            if (name === roomOps[i]) {
                return true;
            }
        }
    };

    $scope.op = function(roomName, user) {
        var data = {
            room: roomName,
            user: user
        };
        socket.emit('op', data);
        var dataMessage = {
            roomName: roomName,
            message: "The user " + user + " has been opped"
        };
        sendInOutMsg(dataMessage);
    };

    $scope.deop = function(roomName, user) {
        var data = {
            room: roomName,
            user: user
        };
        socket.emit('deop', data);
        var dataMessage = {
            roomName: roomName,
            message: "The user " + user + " has been deopped"
        };
        sendInOutMsg(dataMessage);
    };

    $scope.leaveRoom = function(channel) {
        console.log("Leaving " + channel);
        sendLeaveMsg(channel);
        socket.emit('partroom', channel);
    };

    $scope.kick = function (roomName, user) {
        var data = {
            room: roomName,
            user: user
        };
        socket.emit('kick', data);
        var dataMessage = {
            roomName: roomName,
            message: "The user " + user + " has been kicked out"
        };
        sendInOutMsg(dataMessage);
    };

    $scope.ban = function (roomName, user) {
        var data = {
            room: roomName,
            user: user
        };
        socket.emit('ban', data);
        var dataMessage = {
            roomName: roomName,
            message: "The user " + user + " has been banned"
        };
        sendInOutMsg(dataMessage);
    };

    $scope.unBan = function (roomName, user) {
        var data = {
            room: roomName,
            user: user
        };
        socket.emit('unban', data);
        var dataMessage = {
            roomName: roomName,
            message: "The user " + user + " has been unbanned"
        };
        sendInOutMsg(dataMessage);
    };

    var sendInOutMsg = function(dataMessage) {
        var data = {
            roomName: dataMessage.roomName,
            msg: dataMessage.message
        };
        socket.emit('sendmsg', data);
    };

    $scope.setTopic = function(roomName, roomTopic) {
        var data = {
            room: roomName,
            topic: roomTopic
        };
        socket.emit('settopic', data);
    };

    socket.on('updatetopic', function(room, topic, username) {
        if(username !== undefined) {
           socket.emit('getUserChannels');
        }
    });
});