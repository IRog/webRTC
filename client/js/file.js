//TODO: show file name and correct % on the reciever. Name the file properly on download
var username
let connectedPerson;

var socket = new WebSocket('ws://localhost:8888');

socket.onopen = function () {
  console.log("Connected");
};

// Handle all messages through this callback
socket.onmessage = function (message) {
  console.log("Got message", message.data);

  var data = JSON.parse(message.data);

  switch(data.type) {
    case "login":
      onLogin(data.success);
      break;
    case "offer":
      onOffer(data.offer, data.name);
      break;
    case "answer":
      onAnswer(data.answer);
      break;
    case "candidate":
      onCandidate(data.candidate);
      break;
    case "leave":
      onLeave();
      break;
    default:
      break;
  }
};

socket.onerror = function (err) {
  console.log("Got error", err);
};

// Alias for sending messages in JSON format
function send(message) {
  if (connectedPerson) {
    message.name = connectedPerson;
  }

  socket.send(JSON.stringify(message));
};

let loginPageElem = document.querySelector('#login-page')
let usernameInputElem = document.querySelector('#username')
let loginButtonElem = document.querySelector('#login')
let theirUsernameInputElem = document.querySelector('#their-username')
let connectButton = document.querySelector('#connect')
let sharePage = document.querySelector('#share-page')
let sendButtonElem = document.querySelector('#send')
let readyText = document.querySelector('#ready')
let statusText = document.querySelector('#status')

sharePage.style.display = "none";
readyText.style.display = "none";

// Login when the user clicks the button
loginButtonElem.addEventListener("click", function (event) {
  username = usernameInputElem.value;

  if (username.length > 0) {
    send({
      type: "login",
      name: username
    });
  }
});

function onLogin(success) {
  if (success === false) {
    alert("Login unsuccessful, please try a different name.");
  } else {
    loginPageElem.style.display = "none";
    sharePage.style.display = "block";

    // Get the plumbing ready for a call
    startConnection();
  }
};

let thisConnection 
let dataChan
let currentFileSize
let currentFile
let currentFileMeta;

function startConnection() {
  if (hasRTCPeerConnection()) {
    setupPeerConnection();
  } else {
    alert("Sorry, your browser does not support WebRTC.");
  }
}

function setupPeerConnection() {
  var configuration = {
    "iceServers": [{ "url": "stun:stun.1.google.com:19302 " }]
  };
  thisConnection = new RTCPeerConnection(configuration, {optional: []});

  // Setup ice handling
  thisConnection.onicecandidate = function (event) {
    if (event.candidate) {
      send({
        type: "candidate",
        candidate: event.candidate
      });
    }
  };

  openDataChannel();
}

function openDataChannel() {
  var dataChannelOptions = {
    ordered: true,
    reliable: true,
    negotiated: true,
    id: "myChannel"
  };
  dataChan = thisConnection.createDataChannel("myLabel", dataChannelOptions);

  dataChan.onerror = function (error) {
    console.log("Data Channel Error:", error);
  };

  // Add this to the openDataChannel function
  dataChan.onmessage = function (event) {
    try {
      var message = JSON.parse(event.data);
      switch (message.type) {
        case "start":
          currentFile = [];
          currentFileMeta = message.data;
          break;
        case "end":
          saveFile(currentFileMeta, currentFile);
          break;
      }
    } catch (e) {
      // Assume this is file content
      currentFile.push(window.atob(event.data));
      currentFileSize += currentFile[currentFile.length - 1].length;

      var percentage = Math.floor((currentFileSize / currentFileMeta.size) * 100);
      statusText.innerHTML = "Receiving... " + percentage + "%";
    }
  };

  dataChan.onopen = function () {
    readyText.style.display = "inline-block";
  };

  dataChan.onclose = function () {
    readyText.style.display = "none";
  };
}

function hasUserMedia() {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  return !!navigator.getUserMedia;
}

function hasRTCPeerConnection() {
  window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
  window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
  return !!window.RTCPeerConnection;
}

function hasFileApi() {
  return window.File && window.FileReader && window.FileList && window.Blob;
}

connectButton.addEventListener("click", function () {
  var theirUsername = theirUsernameInputElem.value;

  if (theirUsername.length > 0) {
    startPeerConnection(theirUsername);
  }
});

function startPeerConnection(user) {
  connectedPerson = user;

  // Begin the offer
  thisConnection.createOffer(function (offer) {
    send({
      type: "offer",
      offer: offer
    });
    thisConnection.setLocalDescription(offer);
  }, function (error) {
    alert("An error has occurred.");
  });
};

function onOffer(offer, name) {
  connectedPerson = name;
  thisConnection.setRemoteDescription(new RTCSessionDescription(offer));

  thisConnection.createAnswer(function (answer) {
    thisConnection.setLocalDescription(answer);

    send({
      type: "answer",
      answer: answer
    });
  }, function (error) {
    alert("An error has occurred");
  });
};

function onAnswer(answer) {
  thisConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

function onCandidate(candidate) {
  thisConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

function onLeave() {
  connectedPerson = null;
  thisConnection.close();
  thisConnection.onicecandidate = null;
  setupPeerConnection();
};

sendButtonElem.addEventListener("click", function (event) {
  var files = document.querySelector('#files').files;

  if (files.length > 0) {
    dataChan.send(JSON.stringify({
      type: "start",
      data: files[0]
    }));

    sendFile(files[0]);
  }
});

function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return btoa(binary);
}

function base64ToBlob(b64Data, contentType) {
    contentType = contentType || '';

    var byteArrays = [], byteNumbers, slice;

    for (var i = 0; i < b64Data.length; i++) {
      slice = b64Data[i];

      byteNumbers = new Array(slice.length);
      for (var n = 0; n < slice.length; n++) {
          byteNumbers[n] = slice.charCodeAt(n);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
}

var CHUNK_MAX = 16000;
function sendFile(file) {
  var reader = new FileReader();

  reader.onloadend = function(evt) {
    if (evt.target.readyState == FileReader.DONE) {
      var buffer = reader.result,
          start = 0,
          end = 0,
          last = false;

      function sendChunk() {
        end = start + CHUNK_MAX;

        if (end > file.size) {
           end = file.size;
           last = true;
        } // Code that already exists

        var percentage = Math.floor((end / file.size) * 100);
        statusText.innerHTML = "Sending... " + percentage + "%";

        dataChan.send(arrayBufferToBase64(buffer.slice(start, end)));

        // If this is the last chunk send our end message, otherwise keep sending
        if (last === true) {
          dataChan.send(JSON.stringify({
            type: "end"
          }));
        } else {
          start = end;
          // Throttle the sending to avoid flooding
          setTimeout(function () {
            sendChunk();
          }, 100);
        }
      }

      sendChunk();
    }
  };

  reader.readAsArrayBuffer(file);
}

function saveFile(meta, data) {
  var blob = base64ToBlob(data, meta.type);

  var link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = meta.name;
  link.click();
}
