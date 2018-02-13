var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var creds = '';
var redis = require('redis');
var client = '';
var state = 'available';
var room;
var to_username = 'self';
var id_chat;
var home = {};
var messages = {};
// Store people in chatroom
var chatters = [];
// var chatters = {}
// Store messages in chatroom
var chat_messages = [];


// Rooms
var rooms = [];

var app_messages = [];

var ROOM = [];

// Express Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

// Render Main HTML file
app.get('/', function (req, res) {
	
	room = req.query.room;
	
	
	
    res.sendFile('views/index.html', {
        root: __dirname
    });
});


// Read credentials from JSON
fs.readFile('creds.json', 'utf-8', function (err, data) {
    if (err) throw err;
    creds = JSON.parse(data);
    client = redis.createClient('redis://' + creds.user + ':' + creds.password + '@' + creds.host + ':' + creds.port);

    // Redis Client Ready
    client.once('ready', function () {

        // Flush Redis DB
        //client.flushdb();

      
        client.get('room',function(err, reply){
			
			if(reply){
			 console.log('cargando desde redis habitacines');	
			 var rooms= JSON.parse(reply);
		
		    rooms.forEach(function(room) { 	
		
		console.log('cargando..............');
		
        client.get('chat_users_'+room, function (err, reply) {
			console.log('-------redis users---------');
            if (reply) {
			    
                home[room] = JSON.parse(reply);
				console.log('Iniciando !!');
            }
        });

        // Initialize Messages
		console.log('messages ....');
		console.log('from '+room);
        client.get('chat_app_messages_'+room, function (err, reply) {
            if (reply) {
				console.log('from Redis Loading ....');
                messages[room] = JSON.parse(reply);
				console.log('----redis-messages--------');
				console.log(messages[room]);
            }
        });
		
		});
		
		
			}
			
			
		})

		

		
    });
});

var port = process.env.PORT || 8080;

// Start the Server
http.listen(port, function () {
    console.log('Server Started. Listening on *:' + port);
});


// API - Join Chat
app.post('/join', function (req, res) {
    var username = req.body.username;	
	var room = req.body.room;
	var CLT = [];
	home[room]=rooms;
	username = username+':'+room;
	
    if (home[room].indexOf(username) === -1) {
        home[room].push(username);
		
		  home[room].forEach(function(client) { 
          CLIENT = client.split(":");
	
	     if(CLIENT[1]==room){
          CLT.push(client);		 	   
	     }
	
	
	});	
		
		

		 client.get('room', function (err, reply) {
			  
			  if (reply) {
			  var ROOM = JSON.parse(reply);
			  }
		 });
		
		console.log(room);
		console.log('-------ROOM----------------');
		console.log(ROOM);
		if(ROOM.includes(room)) {
		
		 console.log('ya existe');
		
		}else{
	     ROOM.push(room);		     
			
		}
		console.log('........');
		console.log(ROOM);
		console.log('------END ROOM ------------');
		
	    client.set('room', JSON.stringify(ROOM));
        client.set('chat_users_'+room, JSON.stringify(CLT));
        res.send({
            'chatters': home[room],
            'status': 'OK'
        });
    } else {
        res.send({
            'status': 'FAILED'
        });
    }	
	
});

// API - Leave Chat
app.post('/leave', function (req, res) {
    var username = req.body.username;
	var room = req.body.room;
	var CT = [];
	username = username+':'+room;
	home[room].forEach(function(client) { 	
	      console.log('client ??');
          console.log(client);	  
		  CLIENT= client.split(':');		  
		  if(CLIENT[1]==room){	  
		  CT.push(client);
	      }
	});
	

    CT.splice(CT.indexOf(username), 1);
	home[room].splice(home[room].indexOf(username), 1);
	
    client.set('chat_users_'+room, JSON.stringify(CT));
    res.send({
        'status': 'OK'
    });
});



// API - Send + Store Message
app.post('/send_message', function (req, res) {
    var username = req.body.username;
    var message = req.body.message;
	var room = req.body.room;
	var is_message = [];
	//chat_messages= [];
	
    //messages[room]=chat_messages;
	
    messages[room].push({
        'sender': username,
        'message': message,
		'to': to_username,
		'room': room,
		'state':state
    });
	
	
	
	messages[room].forEach(function(item) { 
	

	if(item['room'] == room ){
		
	
        is_message.push(item);	
		
	}
	
	
	})
	
	
    client.set('chat_app_messages_'+room, JSON.stringify(is_message));
    res.send({
        'status': 'OK'
    });
});

// API - Get Messages
app.get('/get_messages', function (req, res) {
	room = req.query.room;
	console.log('--------get messages------');
	console.log(room);
	
	console.log(messages);
	
	is_message=[];
	
	if(messages[room]){

	console.log(messages);
	
	messages[room].forEach(function(item) { 
	

	if(item['room'] == room ){
		
        is_message.push(item);	
		
	}
	
	
	})

	
    res.send(is_message);
	
	}else{
		
	}
	
});

// API - Get Chatters
app.get('/get_chatters', function (req, res) {
	
    room = req.query.room;
	
	if(home[room]==undefined){
	   
	 res.send("");
      
		
	}else{
		
		is_message=[];
		
		console.log(messages);
      
		messages[room].forEach(function(item) { 
	

	if(item['room'] == room ){
		
        is_message.push(item);	
		
	}

	})  

    res.send(is_message);		
		
	}

	
});

// Socket Connection
// UI Stuff
io.on('connection', function (socket) {

    socket.on('room', function(room) {
        socket.join(room);
    });

    socket.on('storeClientInfo', function (data) {

            var clientInfo = new Object();
            clientInfo.customId         = data.customId;
            clientInfo.clientId     = socket.id;
            clients.push(clientInfo);
        });



    // Fire 'send' event for updating Message list in UI
    socket.on('message', function (data) {
		
		//console.log('message Data');
			
		 
		room = data['room'];
		
        io.sockets.in(room).emit('send', data);
    });

    // Fire 'count_chatters' for updating Chatter Count in UI
    socket.on('update_chatter_count', function (data) {
		

        io.sockets.in(room).emit('count_chatters', data);
    });

});
