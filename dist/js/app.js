var RuChat = angular.module('RuChat', ['ngRoute', 'luegg.directives', 'ui.bootstrap']);

RuChat.config(
    function($routeProvider) {
        $routeProvider
            .when('/login', {
                templateUrl: 'partials/login.html',
                controller: 'loginController'
            })
            .when('/rooms/:user', {
                templateUrl: 'partials/rooms.html',
                controller: 'roomsController'
            })
            .when('/room/:user/:room/', {
                templateUrl: 'partials/room.html',
                controller: 'roomController'
            })
            .otherwise({
                redirectTo: '/login'
            });
    }
);






RuChat.factory('socket', function ($rootScope) {
    var socket = io.connect('http://localhost:8080');
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});
RuChat.filter('capitalize', function() {
    return function(input, all) {
        return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }) : '';
    };
});
RuChat.controller('loginController', function($scope, $location, $rootScope, $routeParams, socket) {

    $scope.errorMessage = '';
    $scope.nickname = '';

    $scope.login = function() {
        if ($scope.nickname === '') {
            $scope.errorMessage = 'Please choose a username before continuing!';
        } else {
            var nick = $scope.nickname;
            socket.emit('adduser', nick, function(available) {
                if (available) {
                    $location.path('/rooms/' + $scope.nickname);
                } else {
                    $scope.errorMessage = 'This username is already taken!';
                }
            });
        }
    };
});
RuChat.controller('roomController', function($scope, $location, $rootScope, $routeParams, socket) {

    $scope.currentRoom = $routeParams.room;
    $scope.currentUser = $routeParams.user;
    $scope.currentUsers = [];
    $scope.bannedUsers = [];
    $scope.errorMessage = '';
    $scope.allMessages = [];
    $scope.allRoomUsers = [];
    $scope.serverMessage = '';
    $scope.roomOps = [];
    $scope.roomObject = {};

    var roomObj = {
        room: $scope.currentRoom
    };
    socket.emit('joinroom', roomObj, function(success, reason) {
        if (!success) {
            $scope.errorMessage = reason;
        }
        sendInOutMsg("Joined room");
    });

    socket.on('updateusers', function(room, users, ops) {
        // This fires the rooms event which fires the roomlist event.
        socket.emit('rooms');
    });

    // fires when leave button is clicked
    $scope.leaveRoom = function() {
        sendInOutMsg("Left room");
        socket.emit('partroom', $scope.currentRoom);
        //socket.emit('partroom', $scope.currentRoom);
        $location.path('/rooms/' + $scope.currentUser);
    };

    // Get the user roster for the room
    // to display all connected users in that room
    socket.emit('rooms');
    socket.on('roomlist', function(list) {
        $scope.currentUsers = Object.keys(list[$scope.currentRoom].users);
        $scope.allMessages = list[$scope.currentRoom].messageHistory;
        $scope.roomTopic = list[$scope.currentRoom].topic;
        $scope.roomOps = Object.keys(list[$scope.currentRoom].ops);
        $scope.bannedUsers = Object.keys(list[$scope.currentRoom].banned);
    });

    $scope.isOp = function(name) {
        for (var i = 0; i < $scope.roomOps.length; ++i) {
            if(name === $scope.roomOps[i]){
                return true;
            }
        }
    };

    $scope.sendMsg = function() {
        var data = {
            roomName: $scope.currentRoom,
            msg: $scope.message
        };
        socket.emit('sendmsg', data);
        $scope.message = "";
    };
    
    $scope.kick = function (user) {
        var data = {
            room: $scope.currentRoom,
            user: user
        };
        socket.emit('kick', data);
        sendInOutMsg("The user " + user + " has been kicked out");
    };

    $scope.isInUserList = function (user) {
        for (var i = 0; i < $scope.currentUsers.length; i++) {
            if ($scope.currentUsers[i] == user) {
                return true;
            }
        }
        return false;
    };

    $scope.ban = function (user) {
        var data = {
            room: $scope.currentRoom,
            user: user
        };
        socket.emit('ban', data);
        sendInOutMsg("The user " + user + " has been banned");
    };

    $scope.unBan = function (user) {
        var data = {
            room: $scope.currentRoom,
            user: user
        };
        socket.emit('unban', data);
        sendInOutMsg("The user " + user + " has been unbanned");
    };

    var sendInOutMsg = function(dataMessage) {
        var data = {
            roomName: dataMessage.roomName,
            msg: dataMessage.message
        };
        socket.emit('sendmsg', data);
    };

    socket.on('updatechat', function (roomName, history) {
        for (var i = 0; i < history.length; i++) {
            $scope.allMessages[i] = history[i];
        }
    });
});
RuChat.controller('roomsController', function($scope, $location, $rootScope, $routeParams, socket) {

    $scope.currentUser = $routeParams.user;
    $scope.allUsers = [];
    $scope.curUserChannels = {};
    $scope.data = {
        roomName: "",
        msg: ""
    };
    var joinLobbyObj = {
        room: 'lobby'
    };

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

    // Make the user join the lobby automatically
    socket.emit('joinroom', joinLobbyObj, function(success, reason) {
        if (!success) {
            console.log(reason);
        } else {
            // Update the current user channels.
            socket.emit('getUserChannels');
            // Announce that the user has joined the lobby
            sendJoinMsg('lobby');
        }
    });

    // Get all channels that current user is in.
    socket.on('getCurUserChannels', function(channels) {
        $scope.curUserChannels = channels;
    });

    // update the users list in the current room.
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
                    sendJoinMsg(roomName);
                }
            });
            socket.emit('getUserChannels');
            socket.emit('rooms');
            $scope.roomName = "";
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

    $scope.leaveRoom = function(channel) {
        if (Object.keys($scope.curUserChannels).length === 1) {
            console.log("You must be in at least one room!");
        } else {
            sendLeaveMsg(channel);
            socket.emit('partroom', channel);
            socket.emit('getUserChannels');
        }

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