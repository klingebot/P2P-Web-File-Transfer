# P2P Web File Transfer

This website allows for Peer to Peer file transferring using WebRTC. Real-time chat is also capable with web sockets. This platform was designed for the d3x.me website.

## Features
- Peer to Peer file transferring over WebRTC
- Socket.io real-time chat

## Local Usage
This website was built with Node.js v15.

Ensure that all dependencies are installed.
- ejs
- express
- node-sass
- path
- socket.io
- uuid

### Running for development (SASS watch, non-minified)
```
npm run dev
```

### Running for production (Minified SASS)
```
npm run prod
```

Modify the listening port for PeerJS's handshake and ensure that it matches your webserver (Default is localhost:9000/myapp).

## Fluff
This is an ongoing project. Core functionality is all there with more to be expanded on.
