BtleJuice bindings
==================

BtleJuice provides bindings for both Python and NodeJS. These bindings require the BtleJuice Core to be ran in background in order to work properly.

These bindings provide some classes to perform pure sniffing and on-the-fly data manipulation.

Importing BtleJuice
-------------------

``` javascript
const btlejuice = require('btlejuice-bindings');
```

Creating a sniffing interface
-----------------------------

The `SniffingInterface` provides all the required method to intercept every GATT operation and the data exchanged. It should be used as shown below:

``` javascript
'use strict'; /* Required for ECMA Script 6 */

const btlejuice = require('btlejuice-bindings');

class MySniffingInterface extends btlejuice.SniffingInterface {
  onReadResponse(service, characteristic, data){
    super.onReadResponse(service, characteristic, data);
    console.log(data);
    console.log(util.format(
      '[<][%s - %s] %s',
      service,
      characteristic,
      this.hexiify(data)
    ));
  }
}
```

**Note: calling the parent class method is mandatory for this sniffing interface to work properly.**

The following methods may be overriden:

  * `onConnected()`: called when the sniffing interface is connected to BtleJuice core
  * `onDisconnected()`: called on disconnection from BtleJuice core
  * `onClientConnected(client)`: called when a peripheral is connected to BtleJuice proxy
  * `onClientLeave(client)`: called when a peripheral is disconnected from BtleJuice proxy
  * `onStatusUpdated(status)`: called each time BtleJuice updates its internal status
  * `onProfile(profile)`: called when BtleJuice's proxy profiled a specific target
  * `onTargetSelected(target)`: called when
  * `onDeviceFound(peripheral)`: called when the target device has been found
  * `onProxyReady()`: called when the proxy is set up and ready
  * `onDataNotification(service, characteristic, data)`: called when a notification is received from the target device
  * `onWriteResponse(service, characteristic, error)`: called when a write operation has been performed
  * `onReadResponse(service, characteristic, data)`: called when a read operation has been performed
  * `onNotifyResponse(service, characteristic)`: callled when a notification subscription has been processed
  * `onWriteRequest(service, characteristic, data, offset, withoutResponse)`: called when a write request is sent by the connected peripheral
  * `onReadRequest(service, characteristic, offset)`: called when a read request is received from the connected peripheral
  * `onNotifyRequest(service, characteristic, enabled)`: called when a notification subscription is requested by the connected peripheral

Creating a hooking interface
----------------------------

The `HookingInterface` provides all the required method to intercept and modify on-the-fly every GATT operation and the data exchanged. It should be used as shown below:

``` javascript
'use strict'; /* Required for ECMA Script 6 */

const btlejuice = require('btlejuice-bindings');

class MyHookingInterface extends btlejuice.HookingInterface {
  /* Always return 100 for battery level. */
  onBeforeRead(service, characteristic, offset){
    if (service == '180f' && characteristic == '2a19')
      throw new HookForceResponse(new Buffer([100]));
  }
}
```

The following callbacks may be overriden:

  * `onBeforeRead(service, characteristic, offset)`: called before forwarding a read operation to the target device. Throw HookForceResponse to immediately return a value to the peripheral that requested the read. The target device will not be notified of this read operation.
  * `onAfterRead(service, characteristic, data)`: called after a read operation. Throw HookModify to send modified data to the requesting peripheral.
  * `onBeforeWrite(service, characteristic, data, offset, withoutResponse)`: called before a write operation occurs. Throw HookForceResponse to dismiss.
  * `onBeforeSubscribe(service, characteristic, enabled)`: called before suscribe to notification. Throw HookForceResponse to dismiss.
  * `onBeforeNotification(service, characteristic, data)`: called before a notification is sent to the connected peripheral. Throw HookModify to force a modified data to be notified.


Creating a BtleJuice based App
------------------------------

  ``` javascript
  'use strict'; /* Required for ECMA Script 6 */

  const btlejuice = require('btlejuice-bindings');

  class MyHookingInterface extends btlejuice.HookingInterface {
    /* Always return 100 for battery level. */
    onBeforeRead(service, characteristic, offset){
      if (service == '180f' && characteristic == '2a19') {
        throw new HookForceResponse(new Buffer([100]));
      }
    }
  }

  /* Start our hooking  engine. */
  var hooker = new MyHookingInterface(
    'localhost', 8080,
    'd4:ae:10:aa:29:f4'
  );
  ```
