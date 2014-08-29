var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

///////////////////
// listen function =  main setup fucntion called by server.js
///////////////////

exports.listen = function(server) {
	console.log('chat_server.listen called');
	io = socketio.listen(server);
	io.set('log level', 2);
	console.log('chat_server listening');
	
	io.sockets.on('connection', function (socket) {
	
	    console.log('Connection Attempted to socket');
	    
		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
		console.log('Conenction from guest Number: ' + guestNumber);
		joinRoom(socket, 'Lobby');
		
		handleMessageBroadcasting(socket, nickNames);
		handleNameChangeAttempts(socket, nickNames, namesUsed);
		handleRoomJoining(socket);
		
		socket.on('rooms', function() {
			socket.emit('rooms', io.sockets.manager.rooms);
		});
	
		handleClientDisconnection(socket, nickNames, namesUsed);
		
	}); // end io.sockets.on('connection' ...
}; // end exports.listen


//////////////////
// HELPERS
//////////////////

function assignGuestName(socket, guestNumber, nickNames, namesUed) {
	var name = 'Guest' + guestNumber;
	nickNames[socket.id] = name;
	socket.emit('nameResult', {
		success: true,
		name: name
	});
	
	namesUsed.push(name);
	return guestNumber + 1;
}


function joinRoom(socket, room) {
	socket.join(room);
	currentRoom[socket.id] = room;
	socket.emit('joinResult', {room: room});
	socket.broadcast.to(room).emit('message', {
			text: nickNames[socket.id] + ' has joined ' + room + '.'
	});
	
	var usersInRoom = io.sockets.clients(room);
	if (usersInRoom.length > 1) {
		var usersInRoomSummary = 'Users currently in ' + room + ': ';
		for (var index in usersInRoom) {
			var userSocketId = usersInRoom[index].id;
			if (userSocketId != socket.id) {
				if (index > 0) {
					usersInRoomSummary += ', ';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		} // end for loop through users in room
		usersInRoomSummary += '.';
		socket.emit('message', {text: usersInRoomSummary});
	} // end if more than one user in room
} // end function joinRoom


///////////////////////////////////////
// Handlers for messages from clients
///////////////////////////////////////

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
	socket.on('nameAttempt', function(name) {
		if (name.indexOf('Guest') == 0) {
			socket.emit('nameResult', {
				success: false,
				message: 'Names cannot begin with "Guest".'
			});
		} else {
			if (namesUsed.indexOf(name) == -1) {
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;
				delete namesUsed[previousNameIndex];
				socket.emit('nameResult', {
					success: true, 
					name: name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message', {
					text: previousName + ' is now known as ' + name + '.'
				});
			} else {
				socket.emit('nameResult', {
					success: false,  
					message: 'That name is already in use.'
				});
			} // end if else name is not in use...
		} // end if else name contains guest
	});  // end socket.on('nameAttempt'...)
} // end function handleName Change


// Handle messages form the users
function handleMessageBroadcasting(socket) {
	socket.on('message', function(message) {
		socket.broadcast.to(message.room).emit('message', {
			text: nickNames[socket.id] + ": " + message.text
		});
	});
} // end function handleMessageBroadcasting


// handle room joinoing
function handleRoomJoining(socket) {
	socket.on('join', function(room) {
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
} // end function handleRoomJoining


// handle user disconnections
function handleClientDisconnection(socket) {
	socket.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
} // end function handleClientDisconnection

