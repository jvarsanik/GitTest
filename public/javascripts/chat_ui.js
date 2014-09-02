///////////////////////////////////////////
// chat_ui.js - javascript to handle interaction with the user - display text
////////////////////////////////////////////

// there are two types of text: trusted, and untrusted
// display the trusted stuff direcctly, html escape the untrusted stuff 
// to prevent cross site scripting attacks...

function divEscapedContentElement(message) {
	return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
	return $('<div></div>').html('<i>' + message + '</i>');
}


////////////////////////////////////////////
///  Process user input
////////////////////////////////////////////
// Note on syntax: $('#send-message') access the html division names 'send-message'

function processUserInput(chatApp, socket) {
	var message = $('#send-message').val();
	var systemMessage;
	
	if (message.charAt(0) == '/') {
		systemMessage = chatApp.processCommand(message);
		
		// if this is successfu, systemMessage will be true...
		if (systemMessage) {
			$('#messages').append(divSystemContentElement(systemMessage));
		}
	} else {
		chatApp.sendMessage($('#room').text(), message);
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));		
	} // end if else first character is /
	
	$('#send-message').val('');
} // end function processUserInput



////////////////////////////////////
// Initialize Socket.io on client side
// message handlers from server
////////////////////////////////////
var socket = io.connect();

$(document).ready(function() {
	var chatApp = new Chat(socket);
	
	// when changed name
	socket.on('nameResult', function(result) {
		var message;
		
		if (result.success) {
			message = '15 - You are now known as ' + result.name + '.';
		} else {
			message = result.message;
		}
		$('#messages').append(divSystemContentElement(message));
	});  // end socket.on('nameResult...)
	
	// when joined a room
	socket.on('joinResult', function(result) {
		$('#room').text(result.room);
		$('#messages').append(divSystemContentElement('15 - Room changed to ' + result.room + '.'));
	}); // end socket.on('joinResult... );
	
	
	// when get a message
	socket.on('message', function(message) {
		var newElement = $('<div></div>').text(message.text);
		$('#messages').append(newElement);
	}); // end socket.on('message'...);
	
	
	// When want room list
	socket.on('rooms', function(rooms) {
		$('#room-list').empty();
		
		for (var room in rooms) {
			room = room.substring(1, room.length);
			if (room != '') {
				$('#room-list').append(divEscapedContentElement(room));
			}
		} // end for room in rooms
		
		// allow clicking on a room to change rooms
		$('#room-list div').click(function() {
			chatApp.processCommand('/join ' + $(this).text());
			$('#send-message').focus();
		}); // end click function
		
	}); // end socket.on('message'...)
	
	
	// Request list of rooms periodically
	setInterval(function() {
		socket.emit('rooms');
	}, 1000);
	
	$('#send-message').focus();
	
	// Allow submitting the form to send a message
	$('#send-form').submit(function() {
		processUserInput(chatApp, socket);
		return false;
	}); // end submission behavior
	
}); // end document.ready(function()...