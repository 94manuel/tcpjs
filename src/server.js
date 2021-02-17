/*
     home                         publicly accessible server               remote
                                     from both devices
    tunnel client ----------------- tunnel server ---------------------- remote tv
      |      8811                         |                                 9911
      |                    tunnel server -+- remote server
      |                      8811                9911
     1001                  
   oscam server
*/

const net = require('net');

var remoteClient = null;
var tunnelClient = null;

var serverInfo = {portPublic:9911, portTunnel:8811};

const tunnelServer = net.createServer(function(c) {
  console.log('tunnel server: connected');
  tunnelClient = c;

  c.on('data', function(data) {
   console.log("tunnel->remote "+data.length);
   if (remoteClient)
     remoteClient.write(data);
  });

  c.on('end', function() {
    console.log('tunnel server: client disconnected');
    tunnelClient = null;
    if (remoteClient)
      remoteClient.destroy();
  });

  c.on('error', function() {
    console.log('tunnel server: client error');
    tunnelClient = null;
    if (remoteClient)
      remoteClient.destroy();
  });

  c.on('close', function() {
    console.log('tunnel server: client closed');
    tunnelClient = null;
    if (remoteClient)
      remoteClient.destroy();
  });

});

tunnelServer.on('error', function(err) {
  throw err;
});

tunnelServer.listen(serverInfo.portTunnel, function() {
  console.log('tunnel server bound: ' + serverInfo.portTunnel);
});

////////////////////////////

const remoteServer = net.createServer(function(c) {
  console.log('remote server: remote tv connected');
  remoteClient = c;

  if (tunnelClient)
    tunnelClient.write("[g:open]");
  else
  {
    c.destroy();
    console.log("nemam kam poslat open request");
  }

  c.on('data', function (data) {
   console.log("remote->tunnel "+data.length);
    if (tunnelClient)
      tunnelClient.write(data);
  });

  c.on('end', function() {
    console.log('remote server: client disconnected');
    if (tunnelClient && remoteClient)
      tunnelClient.write("[g:close]");
    remoteClient = null;
  });

  c.on('error', function () {
    console.log('remote server: client error');
    if (tunnelClient && remoteClient)
      tunnelClient.write("[g:close]");
    remoteClient = null;
  });

  c.on('close', function () {
    console.log('remote server: client closed');
    if (tunnelClient && remoteClient)
      tunnelClient.write("[g:close]");
    remoteClient = null;
  });

});

remoteServer.on('error', function(err) {
  throw err;
});

remoteServer.listen(serverInfo.portPublic, function () {
  console.log('remote server bound: ' + serverInfo.portPublic);
});