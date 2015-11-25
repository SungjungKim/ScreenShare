'use strict';

var SIGNALING_SERVER = 'https://112.108.40.152:443/';

var config = {
    openSocket: function(config) {
        console.log('s1');
        /*
         Firebase ver.
         */
        var channel = config.channel || 'screen-capturing-' + location.href.replace( /\/|:|#|%|\.|\[|\]/g , '');
        var socket = new Firebase('https://webrtc.firebaseIO.com/' + channel);
        socket.channel = channel;
        socket.on("child_added", function(data) {
            console.log('s2');

            config.onmessage && config.onmessage(data.val());
        });
        socket.send = function(data) {
            console.log('s3');

            this.push(data);
        };
        config.onopen && setTimeout(config.onopen, 1);
        socket.onDisconnect().remove();

        return socket;

        /*
         Socket.io ver. (Not yet)
         */
        //var SIGNALING_SERVER = 'https://112.108.40.152:443/';
        //
        //config.channel = config.channel || location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');
        //var sender = Math.round(Math.random() * 999999999) + 999999999;
        //
        //io.connect(SIGNALING_SERVER).emit('new-channel', {
        //    channel: config.channel,
        //    sender: sender
        //});
        //
        //var socket = io.connect(SIGNALING_SERVER + config.channel);
        //socket.channel = config.channel;
        //socket.on('connect', function () {
        //    if (config.callback) config.callback(socket);
        //});
        //
        //socket.send = function (message) {
        //    socket.emit('message', {
        //        sender: sender,
        //        data: message
        //    });
        //};
        //
        //socket.on('message', config.onmessage);
    },
    onRemoteStream: function(media) {
        console.log('s4');

        var video = media.video;
        video.setAttribute('controls', true);
        videosContainer.insertBefore(video, videosContainer.firstChild);
        video.play();
        //rotateVideo(video);
    },
    onRoomFound: function(room) {
        console.log('s5');

        dualrtcUI.joinRoom({
            roomToken: room.broadcaster,
            joinUser: room.broadcaster
        });
    },
    onNewParticipant: function(numberOfParticipants) {
        console.log('s7');

        document.title = numberOfParticipants + ' users are viewing your screen!';
    },
    oniceconnectionstatechange: function(state) {
        console.log('s8');

        if(state == 'failed') {
            alert('Failed to bypass Firewall rules. It seems that target user did not receive your screen. Please ask him reload the page and try again.');
        }

        if(state == 'connected') {
            alert('A user successfully received your screen.');
        }
    }
}; // end of config

function captureUserMedia(callback, extensionAvailable) {
    console.log('s9');

    console.log('captureUserMedia chromeMediaSource', DetectRTC.screen.chromeMediaSource);

    var screen_constraints = {
        mandatory: {
            chromeMediaSource: DetectRTC.screen.chromeMediaSource,
            maxWidth: screen.width > 1920 ? screen.width : 1920,
            maxHeight: screen.height > 1080 ? screen.height : 1080
            // minAspectRatio: 1.77
        },
        optional: [{ // non-official Google-only optional constraints
            googTemporalLayeredScreencast: true
        }, {
            googLeakyBucket: true
        }]
    };
    // try to check if extension is installed.
    if(isChrome && typeof extensionAvailable == 'undefined' && DetectRTC.screen.chromeMediaSource != 'desktop') {
        DetectRTC.screen.isChromeExtensionAvailable(function(available) {
            console.log('s10');

            captureUserMedia(callback, available);
        });
        return;
    }

    if(isChrome && DetectRTC.screen.chromeMediaSource == 'desktop' && !DetectRTC.screen.sourceId) {
        DetectRTC.screen.getSourceId(function(error) {
            console.log('s11');

            if(error && error == 'PermissionDeniedError') {
                alert('PermissionDeniedError: User denied to share content of his screen.');
            }

            captureUserMedia(callback);
        });
        return;
    }

    if(isChrome && !DetectRTC.screen.sourceId) {
        window.addEventListener('message', function (event) {
            console.log('s12');

            if (event.data && event.data.chromeMediaSourceId) {
                var sourceId = event.data.chromeMediaSourceId;
                DetectRTC.screen.sourceId = sourceId;
                DetectRTC.screen.chromeMediaSource = 'desktop';
                if (sourceId == 'PermissionDeniedError') {
                    return alert('User denied to share content of his screen.');
                }
                captureUserMedia(callback, true);
            }
            if (event.data && event.data.chromeExtensionStatus) {
                warn('Screen capturing extension status is:', event.data.chromeExtensionStatus);
                DetectRTC.screen.chromeMediaSource = 'screen';
                captureUserMedia(callback, true);
            }
        });
        return;
    }

    if(isChrome && DetectRTC.screen.chromeMediaSource == 'desktop') {
        screen_constraints.mandatory.chromeMediaSourceId = DetectRTC.screen.sourceId;
    }

    var constraints = {
        audio: false,
        video: screen_constraints
    };

    if(!!navigator.mozGetUserMedia) {
        console.warn(Firefox_Screen_Capturing_Warning);
        constraints.video = {
            mozMediaSource: 'window',
            mediaSource: 'window',
            maxWidth: 1920,
            maxHeight: 1080,
            minAspectRatio: 1.77
        };
    }

    console.log( JSON.stringify( constraints , null, '\t') );

    var video = document.createElement('video');
    video.setAttribute('autoplay', true);
    video.setAttribute('controls', true);
    videosContainer.insertBefore(video, videosContainer.firstChild);

    getUserMedia({
        video: video,
        constraints: constraints,
        onsuccess: function(stream) {
            console.log('s13');

            config.attachStream = stream;
            callback && callback();
            video.setAttribute('muted', true);
            //rotateVideo(video);
        },
        onerror: function() {
            console.log('s14');

            if (isChrome && location.protocol === 'http:') {
                alert('Please test this WebRTC experiment on HTTPS.');
            } else if(isChrome) {
                alert('Screen capturing is either denied or not supported. Please install chrome extension for screen capturing or run chrome with command-line flag: --enable-usermedia-screen-capturing');
            }
            else if(!!navigator.mozGetUserMedia) {
                alert(Firefox_Screen_Capturing_Warning);
            }
        }
    });
} // end of captureUserMedia

var dualrtcUI = dualrtc(config);
var videosContainer = document.getElementById("videos-container") || document.body;

$('#share-screen').click(function () {
    var roomName = document.getElementById('room-name') || { };
    roomName.disabled = true;
    captureUserMedia(function() {
        dualrtcUI.createRoom({
            roomName: (roomName.value || 'Anonymous') + ' shared his screen with you'
        });
    });
    this.disabled = true;
});

//document.getElementById('share-screen').onclick = function() {
//    var roomName = document.getElementById('room-name') || { };
//    roomName.disabled = true;
//    captureUserMedia(function() {
//        conferenceUI.createRoom({
//            roomName: (roomName.value || 'Anonymous') + ' shared his screen with you'
//        });
//    });
//    this.disabled = true;
//};

function rotateVideo(video) {
    console.log('s17');

    video.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(0deg)';
    setTimeout(function() {
        console.log('s18');

        video.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(360deg)';
    }, 1000);
}

(function() {
    var uniqueToken = document.getElementById('unique-token');
    if (uniqueToken)
        if (location.hash.length > 2) uniqueToken.parentNode.parentNode.parentNode.innerHTML = '<h2 style="text-align:center;"><a href="' + location.href + '" target="_blank">Share this link</a></h2>';
        else uniqueToken.innerHTML = uniqueToken.parentNode.parentNode.href = '#' + (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace( /\./g , '-');
})();

var Firefox_Screen_Capturing_Warning = 'Make sure that you are using Firefox Nightly and you enabled: media.getusermedia.screensharing.enabled flag from about:config page. You also need to add your domain in "media.getusermedia.screensharing.allowed_domains" flag.';
