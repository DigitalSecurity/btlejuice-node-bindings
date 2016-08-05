'use strict';

/**
 * Node.js BtleJuice bindings.
 **/

 const io = require('socket.io-client');
 const events = require('events');
 const util = require('util');


/**
 * HookModify
 *
 * Hooking related class.
 **/

class HookModify {
  constructor(data) {
    this.data = data;
  }

  getData() {
    return this.data;
  }
}

/**
 * HookForceResponse
 *
 * Hooking related class.
 **/

class HookForceResponse {
  constructor(data, error) {
    this.data = data;
    this.error = error;
  }

  getData(){
    return this.data;
  }

  getError(){
    return this.error;
  }
}

/**
 * UnhandledException
 **/
class UnhandledException {
}

/**
 * Btlejuice
 *
 * Provides all the features required to communicate with the BtleJuice
 * MitM service.
 **/

class BtleJuice {

  constructor(host, port) {
    /* BtleJuice is an event emitter, call its parent constructor. */
    events.EventEmitter.call(this);

    /* Create the webservice URL from host and port. */
    this.url  = util.format('http://%s:%d/', host, port);

    /* Create the socket.io client from this url. */
    this.client = new io(this.url);

    /* Connection failed handler. */
    this.client.on('connect_error', function(){
        console.log('[!] Unable to connect to BtleJuice core.');
        process.exit(1);
    });

    /* Setup handlers. */
    this.installEventHandlers();
  };

  /**
   * installEventHandlers()
   *
   * Setup event handlers for the current socket.io client.
   **/

  installEventHandlers(){
    /* Call onConnected() once connected to the remote service. */
    this.client.on('connect', function(){
      this._onConnected();
    }.bind(this));

    /* Call onDisconnected() if disconnected from the remote service. */
    this.client.on('disconnect', function(){
      this._onDisconnected();
    }.bind(this));

    /* Call onStatusUpdated() when status update is received. */
    this.client.on('app.status', function(status){
      this._onStatusUpdated(status);
    }.bind(this));

    /* Call onTargetSelected() when a target has been selected. */
    this.client.on('app.target', function(target){
      this._onTargetSelected(target);
    }.bind(this));

    /* Call onClientConnected() when a BT client connects to our proxy. */
    this.client.on('app.connect', function(client){
      this._onClientConnected(client);
    }.bind(this));

    /* Call onClientLeft() when a BT client disconnects from our proxy. */
    this.client.on('app.disconnect', function(client){
      this._onClientLeft(client);
    }.bind(this));

    /* Call onDeviceFound() when a device is found during scanning. */
    this.client.on('peripheral', function(peripheral, name, rssi){
      this._onDeviceFound(peripheral, name, rssi);
    }.bind(this));

    /* Call onProxyReady() when our proxy is ready to forward. */
    this.client.on('ready', function(){
      this._onProxyReady();
    }.bind(this));

    /* Call onDataNotification() when proxy gets a notification from the remote
       device */
    this.client.on('data', function(service, characteristic, data){
      this._onDataNotification(service, characteristic, data);
    }.bind(this));

    /* Call onWriteResponse() when proxy gets a response from a write operation. */
    this.client.on('ble_write_resp', function(service, characteristic, error){
      this._onWriteResponse(service, characteristic, error);
    }.bind(this));

    /* Call onReadResponse() when proxy gets a response from a read operation. */
    this.client.on('ble_read_resp', function(service, characteristic, data){
      this._onReadResponse(service, characteristic, data);
    }.bind(this));

    /* Call onNotifyResponse() when proxy gets a response from a notification. */
    this.client.on('ble_notify_resp', function(service, characteristic){
      this._onNotifyResponse(service, characteristic);
    }.bind(this));

    /* Call onProfile() when proxy gets target profile. */
    this.client.on('profile', function(profile){
      this._onProfile(profile);
    }.bind(this));

    /* Call onWriteRequest() when proxy gets a write request. */
    this.client.on('proxy_write', function(service, characteristic, data, offset, withoutResponse){
      this._onWriteRequest(service, characteristic, data, offset, withoutResponse);
    }.bind(this));

    /* Call onReadRequest() when proxy gets a read request. */
    this.client.on('proxy_read', function(service, characteristic, offset){
      this._onReadRequest(service, characteristic, offset);
    }.bind(this));

    /* Call onNotifyRequest() when proxy gets a notification request. */
    this.client.on('proxy_notify', function(service, characteristic, enabled){
      this._onNotifyRequest(service, characteristic, enabled);
    }.bind(this));
  };

  /**************************************
  * Available actions
  **************************************/

  /**
   * selectTarget()
   *
   * Select a specific target.
   **/

  selectTarget(target){
    this.client.emit('target', target);
  }

  /**
   * startScan()
   *
   * Start BTLE scanning. Stops proxy if already active.
   **/

  startScan(){
    this.client.emit('scan_devices');
  }

  /**
   * status()
   *
   * Get BtleJuice core status.
   **/

  status(){
    this.client.emit('status');
  }

  /**
   * stop()
   *
   * Stop proxy.
   **/

  stop(){
    this.client.emit('stop');
  }

  /**
   * deviceWrite()
   *
   * Performs a write operation on the target device.
   **/

  deviceWrite(service, characteristic, data, offset, withoutResponse){
    if (offset == null)
      offset = 0;
    if (withoutResponse == null)
      withoutResponse = false;
    this.client.emit(
      'ble_write',
      service,
      characteristic,
      data,
      offset,
      withoutResponse
    );
  }

  /**
   * deviceRead()
   *
   * Performs a read operation on the target device.
   **/

  deviceRead(service, characteristic){
    this.client.emit('ble_read', service, characteristic);
  }

  /**
   * deviceNotify()
   *
   * Register for notification for a given characteristic.
   **/

  deviceNotify(service, characteristic, enabled){
    this.client.emit('ble_notify', service, characteristic, enabled);
  }

  /**
   * sendWriteResponse()
   *
   * Send a write response to the BLE master device (client app)
   **/

  sendWriteResponse(service, characteristic, error){
    this.client.emit('proxy_write_resp', service, characteristic, error);
  }

  /**
   * sendReadResponse()
   *
   * Send a read response to the BLE master device (client app)
   **/

  sendReadResponse(service, characteristic, data){
    this.client.emit('proxy_read_resp', service, characteristic, data);
  }

  /**
   * sendNotificationResponse()
   *
   * Send a notification response to the master.
   **/

  sendNotificationResponse(service, characteristic){
    this.client.emit('proxy_notify_resp', service, characteristic);
  }

  /**
   * sendDataNotification()
   *
   * Notify a master of incoming data.
   **/

  sendDataNotification(service, characteristic, data){
    this.client.emit('proxy_data', service, characteristic, data);
  }

  /**************************************
   * Callbacks (must be overriden)
   *************************************/

  _onConnected(){}
  _onDisconnected(){}
  _onClientConnected(client){}
  _onClientLeft(client){}
  _onStatusUpdated(status){}
  _onProfile(profile){}
  _onTargetSelected(target){}
  _onDeviceFound(peripheral, name, rssi){}
  _onProxyReady(){}
  _onDataNotification(service, characteristic, data){}
  _onWriteResponse(service, characteristic, error){}
  _onReadResponse(service, characteristic, data){}
  _onNotifyResponse(service, characteristic){}
  _onWriteRequest(service, characteristic, data, offset, withoutResponse){}
  _onReadRequest(service, characteristic, offset){}
  _onNotifyRequest(service, characteristic, enabled){}
}


class BtleJuiceProxy extends BtleJuice {

  /**
   * Constructor.
   **/

  constructor(target, host, port) {
    /* Connect to Btlejuice core. */
    super(host, port);
    this.target = target;
  }

  /**
   * Connect handler.
   **/
  _onConnected(){
    this.stop();
    this.selectTarget(this.target);
  }


  /**
   * _onReadRequest()
   *
   * Forward the read request to the target device.
   **/

  _onReadRequest(service, characteristic, offset){
    this.deviceRead(service, characteristic, offset);
  }


  /**
   * _onReadResponse()
   *
   * Forward the read response to the dummy device.
   **/

  _onReadResponse(service, characteristic, data){
    this.sendReadResponse(service, characteristic, data);
  }


  /**
   * _onWriteRequest()
   *
   * Forward the write request to the target device.
   **/

  _onWriteRequest(service, characteristic, data, offset, withoutResponse) {
    this.deviceWrite(
      service,
      characteristic,
      data,
      offset,
      withoutResponse
    );
  }

  /**
   * _onWriteResponse()
   *
   * Forward the write response to the dummy device.
   **/

  _onWriteResponse(service, characteristic, error){
    this.sendWriteResponse(service, characteristic, error);
  }


  /**
   * _onNotifyRequest()
   *
   * Forward the notification subscription request to the target device.
   **/

  _onNotifyRequest(service, characteristic, enabled){
    this.deviceNotify(service, characteristic, enabled);
  }


  /**
   * _onNotifyResponse()
   *
   * Forward the notification subscription response to the dummy device.
   **/

  _onNotifyResponse(service, characteristic){
    this.sendNotificationResponse(service, characteristic);
  }


  /**
   * _onDataNotification()
   *
   * Forward the data notification to the dummy device.
   **/

  _onDataNotification(service, characteristic, data){
    this.sendDataNotification(service, characteristic, data);
  }
}

/**
 * SniffingInterface
 *
 * This class provides all the required callbacks to sniff data
 * exchanged through GATT read, write and notification operations.
 **/

class SniffingInterface extends BtleJuiceProxy {
  constructor(host, port, target) {
    super(target, host, port);
  }


  /**
   * _onConnected()
   *
   * Calls the ̀̀ onConnected̀̀  callback when connected to BtleJuice core.
   **/

  _onConnected(){
    super._onConnected();
    this.onConnected();
  }


  /**
   * _onProxyReady()
   *
   * Calls the ̀̀ onProxyReadỳ  callback when BtleJuice's proxy is set up.
   **/

  _onProxyReady(){
    this.onProxyReady();
  }


  /**
   * _onClientConnected()
   *
   * Calls the onClientConnected  callback each time a peripheral connects to
   * the dummy device.
   **/

  _onClientConnected(client){
    this.onClientConnected(client);
  }


  /**
   * _onClientLeft()
   *
   * Calls the onClientLeft callback each time a peripheral disconnects from
   * the dummy device.
   **/

  _onClientLeft(client){
    this.onClientLeft(client);
  }


  /**
   * _onReadResponse()
   *
   * Calls the onRead  callback when data is read from a characteristic.
   **/

  _onReadResponse(service, characteristic, data) {
    super._onReadResponse(service, characteristic, data);
    this.onRead(service, characteristic, data);
  }

  /**
   * _onWriteRequest()
   *
   * Calls the onWrite callback when data is read from a characteristic.
   **/

  _onWriteRequest(service, characteristic, data, offset, withoutResponse) {
    super._onWriteRequest(service, characteristic, data, offset, withoutResponse);
    this.onWrite(service, characteristic, data, offset, withoutResponse);
  }

  /**
   * _onDataNotification()
   *
   * Calls the onNotification callback when data is updated.
   **/

  _onDataNotification(service, characteristic, data) {
    super._onDataNotification(service, characteristic, data);
    this.onNotification(service, characteristic, data);
  }


  /**
   * _onNotifyRequest()
   *
   * Calls the onSubscribe callback on notification (un)subscription.
   **/

  _onNotifyRequest(service, characteristic, enabled) {
    super._onNotifyRequest(service, characteristic, enabled);
    this.onSubscribe(service, characteristic, enabled);
  }

  /* Hexiify helper. */
  hexiify(data){
    var output = '';
    for (var i=0; i<data.length; i++) {
      var b = data.readUInt8(i);
      if ((b>=48) && (b<=122))
        output += '.'+String.fromCharCode(b);
      else {
        var b_ =b.toString(16)
        if (b<0x10)
          b_ = '0'+b;
        output += b_+' ';
      }
    }
    return output;
  }

  /* Callbacks (must be overriden) */
  onConnected(){}
  onProxyReady(){}
  onClientConnected(client){}
  onClientLeft(client){}
  onRead(service, characteristic, data){}
  onWrite(service, characteristic, data, offset, withoutResponse){}
  onNotification(service, characteristic, data){}
  onSubscribe(service, characteristic, enabled){}
}

/**
 * HookingInterface
 *
 * Provides callbacks for handling GATT read, write and notification ops.
 *
 * Throw HookForceResponse to force a response to be sent (requests will not be
 * forwarded if thrown in onBefore* callbacks).
 * Throw HookModify to return a modified data to the dummy device.
 **/

class HookingInterface extends BtleJuiceProxy {
  constructor(host, port, target) {
    super(target, host, port)
  }

  _onConnected(){
    super._onConnected();
    this.onConnected();
  }

  _onProxyReady(){
    this.onProxyReady();
  }

  _onClientConnected(client){
    this.onClientConnected(client);
  }

  _onClientLeft(client){
    this.onClientLeft();
  }

  /**
   * _onReadRequest()
   *
   * Calls onBeforeRead() to process the read request.
   *
   * If HookForceResponse is thrown, then do not forward request to target
   * device but return the provided response to the dummy instead.
   **/

  _onReadRequest(service, characteristic, offset) {
    try {
      /* Call the `onBeforeRead`  callback. */
      this.onBeforeRead(service, characteristic, offset);
      /* Forward request to the device. */
      this.deviceRead(service, characteristic, offset);
    } catch (e) {
      if (e instanceof HookForceResponse) {
        /* Send response to the proxy and do not send request to device. */
        this.sendReadResponse(service, characteristic, e.data);
      } else {
        throw new UnhandledException();
      }
    }
  }

  /**
   * _onReadResponse()
   *
   * Calls onAfterRead() to process the read response.
   *
   * If HookModify is thrown, then the modified response is forwarded to
   * the dummy device instead of the original one.
   **/

  _onReadResponse(service, characteristic, data) {
    try {
      /* Call `onAfterRead` callback. */
      this.onAfterRead(service, characteristic, data);

      /* Forward response to client application. */
      this.sendReadResponse(service, characteristic, data);
    } catch (e) {
      if (e instanceof HookModify) {
        /* Send modified response. */
        this.sendReadResponse(service, characteristic, e.data);
      } else {
        throw new UnhandledException();
      }
    }
  }

  /**
   * _onWriteRequest()
   *
   * Calls onBeforeWrite() to process the write request.
   *
   * If HookModify is thrown, then the modified data is forwarded to
   * the target device instead of the original one.
   *
   * If HookForceResponse is thrown, then the write request is not performed
   * but a success message will be sent to the dummy device.
   **/

  _onWriteRequest(service, characteristic, data, offset, withoutResponse) {
    try {
      /* Call `onBeforeWrite` callback. */
      this.onBeforeWrite(service, characteristic, data, offset, withoutResponse);
      /* Forward request to device. */
      this.deviceWrite(service, characteristic, data, offset, withoutResponse);
    } catch (e) {
      if (e instanceof HookForceResponse) {
        /* Send forced response. */
        this.sendWriteResponse(service, characteristic, e.error);
      } else if (e instanceof HookModify) {
        /* Send modified data. */
        this.deviceWrite(service, characteristic, e.data, offset, withoutResponse);
      } else {
        throw new UnhandledException();
      }
    }
  }

  /**
   * _onWriteRequest()
   *
   * Calls onBeforeSubscribe() to process the subscription request.
   *
   * If HookForceResponse is thrown, the subscription is not forwarded to the
   * target device but a success message is sent to the dummy device.
   **/

  _onNotifyRequest(service, characteristic, enabled) {
    try {
      /* Call `onBeforeSubscribe` callback. */
      this.onBeforeSubscribe(service, characteristic, enabled);
      /* Forward to device. */
      this.deviceNotify(service, characteristic, enabled);
    } catch(e) {
      if (e instanceof HookForceResponse) {
        /* Send notification subscription response. */
        this.sendNotificationResponse(service, characteristic);
      } else {
        throw new UnhandledException();
      }
    }
  }


  /**
   * _onDataNotification()
   *
   * Calls onBeforeNotification() to process the notification.
   *
   * If HookForceResponse is thrown, the notification is discarded.
   * If HookModify is thrown, the modified data is notified.
   **/

  _onDataNotification(service, characteristic, data) {
    try {
      /* Call `onBeforeNotification` callback. */
      this.onBeforeNotification(service, characteristic, data);
      /* Forward to client application. */
      this.sendDataNotification(service, characteristic, data);
    } catch (e) {
      if (e instanceof HookModify) {
        this.sendDataNotification(service, characteristic, e.data);
      } else if (e instanceof HookForceResponse) {
      } else {
        throw new UnhandledException();
      }
    }
  }

  /* Callbacks. */
  onConnected(){}
  onProxyReady(){}
  onClientConnected(client){}
  onClientLeft(client){}
  onBeforeRead(service, characteristic, offset){}
  onAfterRead(service, characteristic, data){}
  onBeforeWrite(service, characteristic, data, offset, withoutResponse){}
  onBeforeSubscribe(service, characteristic, enabled){}
  onBeforeNotification(service, characteristic, data){}
}

/* Module exports. */

exports.BtleJuiceProxy = BtleJuiceProxy;
exports.SniffingInterface = SniffingInterface;
exports.HookingInterface = HookingInterface;
exports.HookModify = HookModify;
exports.HookForceResponse = HookForceResponse;
