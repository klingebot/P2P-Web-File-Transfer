$(document).ready(function() {
  console.log('Ready!');
  const socket = io();
  const peer = new Peer(uuidv4(), {
    host: 'localhost',
    port: 9000,
    path: '/myapp'
  });

  var conn;
  var fileChunks = [];
  var mime = 'none';
  var fileName = '';
  var chunkCount = 0;

  peer.on('open', function(id) {
    console.log(`My id is ${id}.`);
    socket.emit('join-room', ROOM_ID, id);
  });

  peer.on('connection', function(conn) {
    conn.on('data', function(data){
      if(data.Mime) {
        mime = data.Mime;
      }

      if(data.FileName) {
        fileName = data.FileName;
      }

      if(data.ChunkCount) {
        chunkCount = data.ChunkCount;
      }

      if(fileChunks.length+1 == chunkCount && !data.mine && !data.FileName && !data.ChunkCount){
        // Check for small images & push last chunk
        fileChunks.push(data);

        var sortedFileChunks = [];

        if(fileChunks.length > 1){
          // Make sure chunks are in the right order
          fileChunks.sort(function(a, b) {
              return a.count - b.count;
          });

          // I hate javascript - push sorted chunks to new array
          fileChunks.forEach(function(component){
            sortedFileChunks.push(component.chunk);
          });
        } else {
          sortedFileChunks.push(fileChunks[0].chunk);
        }

        const file = new Blob(sortedFileChunks, { type: `${mime}` });

        // Download the file
        var link = window.URL.createObjectURL(file);

        // Remove the fileChunks
        fileChunks = [];
        mime = 'none';
        chunkCount = 0;
        $('.chat__history').append('<li class="chat__msg-global">File Received(' + fileName + '): <a download="' + fileName + '" target="_blank" href="'+link+'">Click to Download</a></li>');
        $('.chat__history').scrollTop($('.chat__history')[0].scrollHeight);
        fileName = '';
      } else {
        if (!data.Mime && !data.FileName && !data.ChunkCount){
          fileChunks.push(data);
        }
      }
    });
  });

  socket.on('user-connected', (data) => {
    peer.connect(data.id);
    $('.chat__history').append(`<li class='chat__msg-global'>User has joined the room. There are currently ${data.numClients} users.</li>`);
    $('.chat__history').scrollTop($('.chat__history')[0].scrollHeight);
  });

  socket.on('user-disconnect', (data) => {
    $('.chat__history').append(`<li class='chat__msg-global'>${data}</li>`);
    $('.chat__history').scrollTop($('.chat__history')[0].scrollHeight);
  });

  socket.on('user-message', (data) => {
    $('.chat__history').append(`<li class='chat__msg-other'>${data}</li>`);
    $('.chat__history').scrollTop($('.chat__history')[0].scrollHeight);
  })

  $('.file-form').submit(function(e){
    e.preventDefault();
  });

  $('.file-form > a').click(function(){
    if($(this).hasClass('disabled') || !$('.file-form > input').val()){
      $('.chat__history').append(`<li class='chat__msg-global'>Error attempting to submit your file.</li>`);
      $('.chat__history').scrollTop($('.chat__history')[0].scrollHeight);
    } else {

      // Get current list of connected peers
      var connections = peer.connections;

      if (Object.keys(connections).length > 0){
        // Disable form
        $(this).addClass('disabled');
        var file = $('.file-form > input').prop('files');
        file = file[0];

        for (var connection in connections){
          console.log(`Currently connecting to ${connection}.`);
          var conn = peer.connect(connection);
          conn.on('open', function(){
            // Let the user know the file is uploading.
            $('.chat__history').append(`<li class='chat__msg-global'>File ${file.name} is now uploading.</li>`);
            $('.chat__history').scrollTop($('.chat__history')[0].scrollHeight);

            if(file.type !== ''){
              conn.send({'Mime': file.type });
            } else {
              conn.send({'Mime': 'text/plain' });
            }
            conn.send({'FileName': file.name });
            file.arrayBuffer()
            .then(buffer => {
              if (buffer.byteLength > 0){
                var chunkSize = 16 * 2048;
                // If file is over 150mb
                if (buffer.byteLength > 157286400){
                  // Set chunksize to 50mb chunks
                  chunkSize = 52428800;
                }
                console.log(`ChunkSize: ${chunkSize}.\nByteLength: ${buffer.byteLength}`);
                let count = 0;
                let chunkCount = Math.ceil(buffer.byteLength / chunkSize);

                conn.send({'ChunkCount': chunkCount});

                while(buffer.byteLength){
                  const chunk = buffer.slice(0, chunkSize);
                  buffer = buffer.slice(chunkSize, buffer.byteLength);

                  // Send the chunk
                  conn.send({count: count, chunk: chunk});
                  count++;
                }
              }
              $('.chat__history').append(`<li class='chat__msg-global'>File ${file.name} has finished uploading.</li>`);
              $('.chat__history').scrollTop($('.chat__history')[0].scrollHeight);
              $('.file-form > input').val('');
              $('.file-form > a').removeClass('disabled');
            });
          });
          // If it somehow fails
          $('.file-form > input').val('');
          $('.file-form > a').removeClass('disabled');
        }
      } else {
        $('.chat__history').append(`<li class='chat__msg-global'>There are no clients to send to!</li>`);
        $('.chat__history').scrollTop($('.chat__history')[0].scrollHeight);
      }
    }
  });

  // When someone clicks enter
  $('.message-form').submit(function(e){
    e.preventDefault();
    var message = $('.message-form > input').val();

    if (message.length > 0){
      socket.emit('message', ROOM_ID, message);
      $('.chat__history').append(`<li class='chat__msg-self'>${message}</li>`);
      $('.chat__history').scrollTop($('.chat__history')[0].scrollHeight);
      $('.message-form > input').val('');
    }
  });

  // When someone clicks submit
  $('.message-form > a').click(function() {
    var message = $('.message-form > input').val();

    if (message.length > 0){
      socket.emit('message', ROOM_ID, message);
      $('.chat__history').append(`<li class='chat__msg-self'>${message}</li>`);
      $('.chat__history').scrollTop($('.chat__history')[0].scrollHeight);
      $('.message-form > input').val('');
    }
  });

  function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
});
