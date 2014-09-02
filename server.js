var http 	= require('http');
var fs 		= require('fs');
var path 	= require('path');
var mime	= require('mime');
var cache 	= {};


// Helper to send 4040 respones if file not dound
function send404(response) {
	response.writeHead(404, {'Content-Type': 'text/plain'});
	response.write('Error 404: resource not found.');
	response.end();
}

// Actually send a static file
function sendFile(response, filePath, fileContents) {
	response.writeHead(
		200, 
		{"content-type": mime.lookup(path.basename(filePath))}
	);
	response.end(fileContents);
}


// helper to serve static files - checks if the fiel is in the cache, if so send t
// that cached version.  If not, send it and add it to the cache.
function serveStatic(response, cache, absPath) {
	if (cache[absPath]) {
		sendFile(response, absPath, cache[absPath]);
	} else {
		fs.exists(absPath, function(exists) {
			if(exists) {
				fs.readFile(absPath, function(err, data) {
					if (err) {
						send404(response);
					} else {
						cache[absPath] = data;
						sendFile(response, absPath, data);
					}
				});
			} else {
				send404(response);
			}
		});
	}
}


// actual static webpage server
var server = http.createServer(function(request, response) {
	var filePath = false;
	
	if (request.url == '/') {
		filePath = 'public/index.html';
	} else {
		filePath = 'public' + request.url;
		
	}
	
	console.log('Getting ' + filePath);
	
	var absPath = './' + filePath;
	serveStatic(response, cache, absPath);
});



//////////////////////////////
// ACTUALLY START THE SERVER!!
//////////////////////////////
var PORT_NUMBER = 3000;
server.listen(PORT_NUMBER, function() {
	console.log("15 - Server Listneing to Port " + PORT_NUMBER);
});


//////////////////////////
// Set up Socket.io
/////////////////////////
var chatServer = require('./lib/chat_server');
chatServer.listen(server);


