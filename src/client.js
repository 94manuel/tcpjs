var net = require('net');
var tunnel = null;
var target = null;

// tunnel server
var serverInfo = {port:8811, host:"public.server.com"};
// target device we want to access on network where this script is running
var targetInfo = {port:1001, host:"ip.local.network"};

function listen()
{
  tunnel = new net.Socket();

  tunnel.connect(serverInfo.port, serverInfo.host, function() {
  	console.log('Tunnel connected');
  });

  tunnel.on('error', function(ex) {
    console.log("Tunnel error: " + ex.code);
  });

  tunnel.on('data', function(data) {
    var indexOpen = data.indexOf("[g:open]");

    if (indexOpen != -1)
    {
      push(data.slice(0, indexOpen));
      push(data.slice(indexOpen + "[g:open]".length, data.length));
      open();
      return;
    }

    var indexClose = data.indexOf("[g:close]");

    if (indexClose != -1)
    {
      push(data.slice(0, indexClose));
      push(data.slice(indexClose + "[g:close]".length, data.length));
      close();
      return;
    }

    push(data);
  });

  tunnel.on('close', function() {
    tunnel = null;
    console.log('Connection closed, reconnecting in 5 seconds');
    setTimeout(listen, 5000);
  });
}

function open()
{
  console.log("Requesting to open target...");

  if (target)
  {
    target.destroy();
  }

  target = new net.Socket();

  target.connect(targetInfo.port, targetInfo.host, function() {
  	console.log('Target connected');
  });

  target.on('error', function(ex) {
    console.log("Error: " + ex.code);
  });

  target.on('data', function(data) {
    if (tunnel) // must exist!
      tunnel.write(data);
    else
      console.log("Tunel does not exist! unable to forward");

//    console.log("target->remote:"+data.length + " bytes");
  });
}

function close()
{
  console.log("Target session closed");
  if (target)
    target.destroy();
}

function push(data)
{
  if (!data.length)
    return;

//  console.log("remote->target:"+data.length + " bytes");

  if (target)
    target.write(data);
  else
    console.log("Target does not exist! unable to forward");
}

listen();