"use strict"

const btlejuice = require("../index")
const util = require('util');

class MyHookingInterface extends btlejuice.HookingInterface {
  onClientConnected(client) {
    console.log('** Connection from '+client);
  }

  onClientLeft(client) {
    console.log('** Disconnection from '+client);
  }

  onBeforeWrite(service, characteristic, data) {
    if (service === 'ffe5' && characteristic === 'ffe9') {
        /* move command ? */
        if (data[0] == 0x78) {
            /* Inverse forward/backward */
            var x = 0;
            if (data[1] != 0x00) {
                if (data[1] <= 0x20)
                     x = data[1] + 0x20;
                else
                     x = data[1] - 0x20;
            }
            var y = 0;
            if (data[2] != 0x00) {
                if (data[2] <= 0x60)
                    y = data[2] + 0x20;
                else
                    y = data[2] - 0x20;
            }
            throw new btlejuice.HookModify(new Buffer([0x78, x, y]));
        }
    }
  }
}

var sniffer = new MyHookingInterface('127.0.0.1', 8080, 'b4:99:4c:2c:a5:c2');
