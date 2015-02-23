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
                controller: 'MainController'
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

    // When the create room form is submitted.
    $scope.createRoom = function(roomName) {

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
RuChat.controller('roomController', function($scope, $location, $rootScope, $routeParams, socket) {

    // Update the current user channels.
    socket.emit('getUserChannels');

    // Get all channels that current user is in.
    socket.on('getCurUserChannels', function(channels) {
        $scope.curUserChannels = channels;
    });

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
});
// This filter capitalizes the first letter of each word in a sentence.
RuChat.filter('capitalize', function() {
    return function(input, all) {
        return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }) : '';
    };
});