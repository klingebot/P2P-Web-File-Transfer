const express = require('express'),
      app = express(),
      http = require('http'),
      path = require('path'),
      { PeerServer } = require('peer'),
      peerServer = PeerServer({ port: 9000, path: '/myapp' }),
      { v4: uuidv4 } = require('uuid'),
      port = 3000,
      server = http.Server(app),
      io = require('socket.io')(server);

// Express settings

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public/')));


// Render the homepage
app.get('/', (req, res) => {
  res.render('index');
});

// Redirect to a `room` with a random uuid
app.get('/create', (req, res) => {
  res.redirect(`/room/${uuidv4()}`);
});

// Render a room with the ID passed through to the client
app.get('/room/:room', (req, res) => {
  const v4 = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
  var room = req.params.room;

  // Ensure rooms are being made correctly (uuid for some security)
  if(room.match(v4)){
    res.render('room', { roomId: room });
  } else {
    res.redirect('/');
  }
});

io.on('connection', (socket) => {

  // User connecting
  socket.on('join-room', (roomId, id) => {
    socket.join(roomId);
    var numClients = io.sockets.adapter.rooms.get(roomId).size;
    socket.to(roomId).emit('user-connected', { numClients, id });
  })

  // User disconnecting
  socket.on('disconnecting', () => {
    socket.rooms.forEach(function(room){
      var numClients = io.sockets.adapter.rooms.get(room).size-1;
      socket.to(room).emit('user-disconnect', 'User has left. There are now ' + numClients + ' clients.');
    });
  });

  // User sends a message
  socket.on('message', (roomId, msg) => {
    socket.broadcast.to(roomId).emit('user-message', msg);
  })
})

console.log(`Server running on port ${port}`);
server.listen(port);
