var express = require('express');
var app = express();
var fs = require('fs');
var config = require('./src/js/config');
var server;

if (config.ws.secured) { // HTTPS
    var https = require('https');
    var options = {
        key: fs.readFileSync('key/key.pem', 'utf8'),
        cert: fs.readFileSync('key/cert.pem', 'utf8')
    };
    var securePort = config.ws.securePort;

    server = https.createServer(options, app).listen(securePort, function (err) {
        console.log('[+] Set [https] protocol and server running at port #' + securePort);
    });
} else { // HTTP
    var http = require('http');
    var port = config.ws.port;
    server = http.createServer(app).listen(port, function (err) {
        console.log('[+] Set [http] protocol and server running at port #' + port);
    });
}

var io = require('socket.io').listen(server, {
    log: true,
    origins: '*:*'
});


var channels = {};

io.sockets.on('connection', function (socket) {

    console.log('[[connected]]');

    var initChannel = '';
    if (!io.isConnected) {
        io.isConnected = true;
    }

    socket.on('new-channel', function (data) {
        if (!channels[data.channel]) {
            initChannel = data.channel;
        }

        channels[data.channel] = data.channel;
        onNewNamespace(data.channel, data.sender);
    });

    socket.on('presence', function (channel) {
        var isChannelPresent = !! channels[channel];
        socket.emit('presence', isChannelPresent);
    });

    socket.on('disconnect', function (channel) {
        if (initChannel) {
            delete channels[initChannel];
        }
    });
});

function onNewNamespace(channel, sender) {
    io.of('/' + channel).on('connection', function (socket) {
        var username;
        if (io.isConnected) {
            io.isConnected = false;
            socket.emit('connect', true);
        }

        socket.on('message', function (data) {
            if (data.sender == sender) {
                if (!username) username = data.data.sender;

                socket.broadcast.emit('message', data.data);
            }
        });

        socket.on('disconnect', function () {
            if (username) {
                socket.broadcast.emit('user-left', username);
                username = null;
            }
        });
    });
}


// Handle resource request by server
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/dist/dualrtc.html');
});

app.get('/dist/dualrtc.html', function(req, res) {
    res.sendFile(__dirname + '/dist/dualrtc.html');
});

app.get('/dist/js/jquery-2.1.4.min.js', function(req, res) {
    res.sendFile(__dirname + '/dist/js/jquery-2.1.4.min.js');
});

app.get('/dist/js/adapter.js', function(req, res) {
    res.sendFile(__dirname + '/dist/js/adapter.js');
});

app.get('/dist/js/dualrtc.js', function(req, res) {
    res.sendFile(__dirname + '/dist/js/dualrtc.js');
});

app.get('/dist/js/screenShare.js', function(req, res) {
    res.sendFile(__dirname + '/dist/js/screenShare.js');
});

app.get('/dist/js/detectrtc.js', function(req, res) {
    res.sendFile(__dirname + '/dist/js/detectrtc.js');
});

app.use(express.static('.'));
