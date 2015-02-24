RuChat.controller('roomController', ['$scope', '$location', '$rootScope', '$routeParams', 'socket',
    function($scope, $location, $rootScope, $routeParams, socket) {

        if (!$rootScope.isLobby) {
            return;
        } else {

            // update the users list
            socket.on('updateusers', function(room, users, ops) {
                socket.emit('users');
                socket.emit('rooms');
                socket.emit('getUserChannels');
            });

            $scope.leaveRoom = function(channel) {
                if (Object.keys($scope.curUserChannels).length === 1) {
                    console.log("You must be in at least one room!");
                } else {
                    $scope.sendLeaveMsg(channel);
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

            // Fetch the chat history for the current room.
            socket.on('updatechat', function(roomName, history) {
                if ($scope.curUserChannels[roomName] !== undefined) {
                    $scope.curUserChannels[roomName].messageHistory = history;
                }
            });

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
                $scope.sendInOutMsg(dataMessage);
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
                $scope.sendInOutMsg(dataMessage);
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
                $scope.sendInOutMsg(dataMessage);
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
                $scope.sendInOutMsg(dataMessage);
            };

            // When ban event is called, add the users to banned list.
            socket.on('banned', function(room, users, username) {
                if ($scope.curUserChannels[room] !== undefined) {
                    $scope.curUserChannels[room].banned = users;
                }
            });

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
                $scope.sendInOutMsg(dataMessage);
            };

            $scope.setTopic = function(roomName, roomTopic) {
                var data = {
                    room: roomName,
                    topic: roomTopic
                };
                socket.emit('settopic', data);
            };

            socket.on('updatetopic', function(room, topic, username) {
                if (username !== undefined) {
                    socket.emit('getUserChannels');
                }
            });

            // Opens up a new tab with the current user and the recipient, tab will not be visible to other users.
            $scope.sendPrivateMsg = function(name) {

                if (name === $scope.currentUser) {
                    return;
                }
                socket.emit('joinroom', {
                    room: name + ' + ' + $scope.currentUser,
                    priv: true
                }, function(success, reason) {
                    if (!success) {
                        console.log(reason);
                    } else {
                        var msgObj = {
                            nick: name,
                            room: name + ' + ' + $scope.currentUser
                        };
                        socket.emit('privatemsg', msgObj, function(success) {
                            if (!success) {
                                console.log('privatemsg error');
                            } else {
                                socket.emit('rooms');
                                socket.emit('users');
                                socket.emit('getUserChannels');
                                $scope.sendJoinMsg(name + ' + ' + $scope.currentUser);
                            }
                        });
                    }
                });
            };

            socket.on('recv_privatemsg', function(fromName, roomName) {
                socket.emit('joinroom', {
                    room: roomName,
                    priv: true
                }, function(success, reason) {
                    if (!success) {
                        console.log(reason);
                    } else {
                        socket.emit('rooms');
                        socket.emit('users');
                        socket.emit('getUserChannels');
                        $scope.sendJoinMsg(roomName);
                    }
                });
            });
        }
    }
]);