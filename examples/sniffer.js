"use strict"

const btlejuice = require("../index")
const util = require('util');

function hexiify(data){
  var output = '';
  for (var i=0; i<data.length; i++) {
    var b = data.readUInt8(i);
    if ((b>=48) && (b<=122))
      output += '.'+String.fromCharCode(b) + ' ';
    else {
      var b_ =b.toString(16)
      if (b<0x10)
        b_ = '0'+b;
      output += b_+' ';
    }
  }
  return output;
}

class MySniffingInterface extends btlejuice.SniffingInterface {
  onClientConnected(client) {
    console.log('** Connection from '+client);
  }

  onClientLeave(client) {
    console.log('** Disconnection from '+client);
  }

  onRead(service, characteristic, data) {
    console.log('[<][%s - %s] %s', service, characteristic, hexiify(data));
  }

  onWrite(service, characteristic, data) {
    console.log('[>][%s - %s] %s', service, characteristic, hexiify(data));
  }

  onNotification(service, characteristic, data) {
    console.log('[!][%s - %s] %s', service, characteristic, hexiify(data));
  }
}

var sniffer = new MySniffingInterface('localhost', 8080, 'cc:80:8a:ee:52:17');
