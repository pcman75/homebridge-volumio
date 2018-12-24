var io=require('socket.io-client');
var socket= io.connect('http://living.local');


//Report successful connection
socket.on('connect', function () {
      console.log('Client Connected');
    });

//Report disconnection
socket.on('disconnect', function () {
          console.log('Client Disconnected');
    });

//Notify on player state changes, this includes volume changes, songs etc
socket.on('pushState', function (data) {
              console.log(data);
        });

//Notify just the volume value
socket.on('pushState', function (data) {
              console.log(data.volume);
        });

//Set Volume to 15
socket.emit('volume', 15);

//Increase Volume by value specified by "On click Volume Change", default is 10
//socket.emit('volume', '+');

//Decrease Volume by value specified by "On click Volume Change", default is 10
//socket.emit('volume', '-');