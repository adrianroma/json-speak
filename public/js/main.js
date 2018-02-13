$(function () {

    // test
    var socket = io();
    var chatter_count;
	var room = getUrlParameter('room');
	
    $.get('/get_chatters',{ room: room }, function (response) {
		console.log('total chatters:');
		console.log(response);
        $('.chat-info').text("There are currently " + response.length + " people in the chat room");
        chatter_count = response.length; //update chatter count
    });
	
	
	
	
	
	
    $('#join-chat').click(function () {
		var room = getUrlParameter('room');
	    console.log(room);
        var username = $.trim($('#username').val());
        $.ajax({
            url: '/join',
            type: 'POST',
            data: {
                username: username,
				room    : room
            },
            success: function (response) {
                if (response.status == 'OK') { //username doesn't already exists
				    console.log(room)
				    socket.emit('room', room);
				    
                    socket.emit('update_chatter_count', {
                        'action': 'increase'
                    });
                    $('.chat').show();
                    $('#leave-chat').data('username', username);
                    $('#send-message').data('username', username);
                    $.get('/get_messages',{ room:room }, function (response) {
                        if (response.length > 0) {
                            var message_count = response.length;
                            var html = '';
                            for (var x = 0; x < message_count; x++) {
                                html += "<div class='msg'><div class='user'>" + response[x]['sender'] + "</div><div class='txt'>" + response[x]['message'] + "</div></div>";
                            }
                            $('.messages').html(html);
                        }
                    });
                    $('.join-chat').hide(); //hide the container for joining the chat room.
                } else if (response.status == 'FAILED') { //username already exists
                    alert("Sorry but the username already exists, please choose another one");
                    $('#username').val('').focus();
                }
            }
        });
    });
    $('#leave-chat').click(function () {
		var room = getUrlParameter('room');
	
        var username = $(this).data('username');
        $.ajax({
            url: '/leave',
            type: 'POST',
            dataType: 'json',
            data: {
                username: username,
				room : room
            },
            success: function (response) {
                if (response.status == 'OK') {
                    socket.emit('message', {
                        'username': username,
                        'message': username + " has left the chat room..",
						'room': room
                    });
                    socket.emit('update_chatter_count', {
                        'action': 'decrease'
                    });
                    $('.chat').hide();
                    $('.join-chat').show();
                    $('#username').val('');
                    alert('You have successfully left the chat room');
                }
            }
        });
    });
    $('#send-message').click(function () {
		var room = getUrlParameter('room');
	
        var username = $(this).data('username');
        var message = $.trim($('#message').val());
        $.ajax({
            url: '/send_message',
            type: 'POST',
            dataType: 'json',
            data: {
                'username': username,
                'message': message,
				'room': room
            },
            success: function (response) {
                if (response.status == 'OK') {
                    socket.emit('message', {
                        'username': username,
                        'message': message,
						'room':room
                    });
                    $('#message').val('');
                }
            }
        });
    });
    socket.on('send', function (data) {
		
		 console.log(socket.io.engine.id);     // old ID
   /// socket.io.engine.id = 'new ID';
    console.log(socket.io.engine.id); 
		
		var room = getUrlParameter('room');
	    
        var username = data.username;
        var message = data.message;
        var html = "<div class='msg'><div class='user'>" + username + "</div><div class='txt'>" + message + "</div></div>";
		
        $('.messages').append(html);
    });
    socket.on('count_chatters', function (data) {
		    // new ID
		var room = getUrlParameter('room');
	
        if (data.action == 'increase') {
            chatter_count++;
        } else {
            chatter_count--;
        }
        $('.chat-info').text("There are currently " + chatter_count + " people in the chat room");
    });
});



var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};
