/* $(document).ready(function() {
 */
/*global io*/
// ES6 import
/* import io from 'socket.io-client';
// CommonJS
 */

document.getElementById("username").oninput = function() { myFunction() };

/*     socket.on('user', (data) => {
        $('#num-users').text(data.currentUsers + ' users online');
        let message =
            data.name +
            (data.connected ? ' has joined the chat.' : ' has left the chat.');
        $('#messages').append($('<li>').html('<b>' + message + '</b>'));
    });
    socket.on('chat message', (data) => {
        console.log('socket.on 1');
        $('#messages').append($('<li>').text(`${data.name}: ${data.message}`));
    });
 */ // Form submittion with new message in field with id 'm'
/*     $('form').submit(function() {
        var messageToSend = $('#m').val();
        socket.emit('chat message', messageToSend);
        $('#m').val('');
        return false; // prevent form submit from refreshing page
    });
 */
function myFunction() {
    var string = document.getElementById('username').value;
    console.log(string);
    socket.emit = ('username-attempt', string);

}
/*     $('#username').name(function() {
        var string = $('#username').val();
        socket.emit = ('username attempt', string);
    })
 */
socket.on('username-response', (data) => {
        console.log(data.string);
        if (data.status == 0) {
            document.getElementById('userst').innerHTML = `Your username is ${data.string}`;
        } else {
            document.getElementById('userst').innerHTML = `${data.string} is already in use`;

        }
    })
    /* }); */