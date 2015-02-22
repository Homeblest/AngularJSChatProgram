RuChat.controller('roomsController', function($scope, $location, $rootScope, $routeParams, socket) {

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

    socket.on('userlist', function(userlist) {
        for (var i = 0; i < userlist.length; ++i) {
            $scope.allUsers[i] = userlist[i];
        }
    });

    socket.emit('joinroom', {room: 'lobby'}, function(success, reason){
        if(!success){
            console.log(reason);
        }
    });

    // Update the current user channels.
    socket.emit('getUserChannels');

    // Get all channels that current user is in.
    socket.on('getCurUserChannels', function(channels) {
        $scope.curUserChannels = channels;
    });

    // update the users list
    socket.on('updateusers', function(room, users, ops) {
        // Update the global user roster.
        socket.emit('users');
    });

    // Fetch the chat history for the current room.
    socket.on('updatechat', function(roomName, history) {
        if ($scope.curUserChannels[roomName] !== undefined) {
            $scope.curUserChannels[roomName].messageHistory = history;
        }
    });

    // When ban event is called, add the users to banned list.
    socket.on('banned', function(room, users, username) {
        if ($scope.curUserChannels[room] !== undefined) {
            $scope.curUserChannels[room].banned = users;
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
                    sendJoinMsg(roomName);
                    $scope.roomName = "";
                }
            });
        }
    };

    $scope.leaveRoom = function(channel) {
        if (Object.keys($scope.curUserChannels).length === 1) {
            console.log("You must be in at least one room!");
        } else {
            sendLeaveMsg(channel);
            socket.emit('partroom', channel);
            socket.emit('getUserChannels');
        }

    };

    $scope.sendMsg = function(channel) {

        $scope.data.msg = $scope.data.msg;
        $scope.data.roomName = channel;

        socket.emit('sendmsg', $scope.data);
        $scope.data.msg = "";
    };

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

    $scope.kick = function(roomName, user) {
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

    $scope.ban = function(roomName, user) {
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

    $scope.unBan = function(roomName, user) {
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

    $scope.sendPrivateMsg = function(name) {
        console.log("sendt");

    };
});