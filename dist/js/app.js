var RuChat=angular.module("RuChat",["ngRoute","luegg.directives","ui.bootstrap"]);RuChat.config(["$routeProvider",function(o){o.when("/login",{templateUrl:"partials/login.html",controller:"loginController"}).when("/rooms/:user",{templateUrl:"partials/rooms.html",controller:"MainController"}).otherwise({redirectTo:"/login"})}]);
RuChat.factory("socket",["$rootScope",function(n){var t=io.connect("http://localhost:8080");return{on:function(o,c){t.on(o,function(){var o=arguments;n.$apply(function(){c.apply(t,o)})})},emit:function(o,c,a){t.emit(o,c,function(){var o=arguments;n.$apply(function(){a&&a.apply(t,o)})})}}}]);
RuChat.controller("loginController",["$scope","$location","$rootScope","$routeParams","socket",function(e,o,n,r,a){e.errorMessage="",e.nickname="",e.login=function(){if(""===e.nickname)e.errorMessage="Please choose a username before continuing!";else{var n=e.nickname;a.emit("adduser",n,function(n){n?o.path("/rooms/"+e.nickname):e.errorMessage="This username is already taken!"})}}}]);
RuChat.controller("MainController",["$scope","$location","$rootScope","$routeParams","socket",function(o,e,n,s,r){o.currentUser=s.user,o.allUsers=[],o.curUserChannels={},o.rooms=[],o.data={roomName:"",msg:""},r.emit("getUserChannels"),r.on("getCurUserChannels",function(e){o.curUserChannels=e}),r.emit("rooms"),r.on("roomlist",function(e){var n=0;for(var s in e)e.hasOwnProperty(s)&&e[s].isPrivate===!1&&(o.rooms[n]=e[s].name,n++)}),r.emit("users"),r.on("userlist",function(e){for(var n=0;n<e.length;++n)o.allUsers[n]=e[n]}),r.emit("joinroom",{room:"lobby",priv:!1},function(e,n){e?o.sendJoinMsg("lobby"):console.log(n)}),o.createRoom=function(e){if(console.log(o.curUserChannels),void 0===o.curUserChannels[e]){var n={room:e,priv:!1};r.emit("joinroom",n,function(n,s){n?(r.emit("rooms"),r.emit("users"),r.emit("getUserChannels"),o.sendJoinMsg(e),o.roomName=""):o.errorMessage=s})}},o.sendJoinMsg=function(o){var e={roomName:o,msg:"Joined Room"};r.emit("sendmsg",e)},o.sendLeaveMsg=function(o){var e={roomName:o,msg:"Left Room"};r.emit("sendmsg",e)},o.sendInOutMsg=function(o){var e={roomName:o.roomName,msg:o.message};r.emit("sendmsg",e)}}]);
RuChat.controller("roomController",["$scope","$location","$rootScope","$routeParams","socket",function(e,n,o,s,r){r.on("updateusers",function(){r.emit("users"),r.emit("rooms"),r.emit("getUserChannels")}),e.leaveRoom=function(n){1===Object.keys(e.curUserChannels).length?console.log("You must be in at least one room!"):(e.sendLeaveMsg(n),r.emit("partroom",n),r.emit("getUserChannels"))},e.sendMsg=function(n){e.data.msg=e.data.msg,e.data.roomName=n,r.emit("sendmsg",e.data),e.data.msg=""},r.on("updatechat",function(n,o){void 0!==e.curUserChannels[n]&&(e.curUserChannels[n].messageHistory=o)}),e.isOp=function(n,o){for(var s=Object.keys(e.curUserChannels[n].ops),r=0;r<s.length;++r)if(o===s[r])return!0},e.op=function(n,o){var s={room:n,user:o};r.emit("op",s);var t={roomName:n,message:"The user "+o+" has been opped"};e.sendInOutMsg(t)},e.deop=function(n,o){var s={room:n,user:o};r.emit("deop",s);var t={roomName:n,message:"The user "+o+" has been deopped"};e.sendInOutMsg(t)},e.kick=function(n,o){var s={room:n,user:o};r.emit("kick",s);var t={roomName:n,message:"The user "+o+" has been kicked out"};e.sendInOutMsg(t)},e.ban=function(n,o){var s={room:n,user:o};r.emit("ban",s);var t={roomName:n,message:"The user "+o+" has been banned"};e.sendInOutMsg(t)},r.on("banned",function(n,o){void 0!==e.curUserChannels[n]&&(e.curUserChannels[n].banned=o)}),e.unBan=function(n,o){var s={room:n,user:o};r.emit("unban",s);var t={roomName:n,message:"The user "+o+" has been unbanned"};e.sendInOutMsg(t)},e.setTopic=function(e,n){var o={room:e,topic:n};r.emit("settopic",o)},r.on("updatetopic",function(e,n,o){void 0!==o&&r.emit("getUserChannels")}),e.sendPrivateMsg=function(n){n!==e.currentUser&&r.emit("joinroom",{room:n+" + "+e.currentUser,priv:!0},function(o,s){if(o){var t={nick:n,room:n+" + "+e.currentUser};r.emit("privatemsg",t,function(o){o?(r.emit("rooms"),r.emit("users"),r.emit("getUserChannels"),e.sendJoinMsg(n+" + "+e.currentUser)):console.log("privatemsg error")})}else console.log(s)})},r.on("recv_privatemsg",function(n,o){r.emit("joinroom",{room:o,priv:!0},function(n,s){n?(r.emit("rooms"),r.emit("users"),r.emit("getUserChannels"),e.sendJoinMsg(o)):console.log(s)})})}]);
RuChat.filter("capitalize",function(){return function(t){return t?t.replace(/([^\W_]+[^\s-]*) */g,function(t){return t.charAt(0).toUpperCase()+t.substr(1).toLowerCase()}):""}});