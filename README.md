# prossh

Promised [SSH2](https://github.com/mscdex/ssh2) Client wrapper

## Installation

    yarn add prossh

## Examples

### Execute `uptime` on a server

```js
var client = require('prossh').client

client({
  host: '192.168.100.100',
  port: 22,
  username: 'frylock',
  privateKey: require('fs').readFileSync('/here/is/my/key')
}).then(conn => {
  console.log('Client :: ready')
  return conn.exec('uptime')
}).then(uptime => {
  console.log('Client :: ready')
  return conn.exec('uptime').then(uptime => {
    uptime.stdout.on('data', data => console.log("STDOUT : " + data))
    uptime.stderr.on('data', data => console.log("STDERR : " + data))
    return uptime.result
  }).then(({code, signalName}) => {
    console.log('Stream :: exit :: code: ' + code + ', signal: ' + signalName)
    conn.end()
  }) 
})

// example output:
// Client :: ready
// STDOUT : 10:46  up  9:59, 4 users, load averages: 1.99 1.80 1.75
// 
// Stream :: exit :: code: 0, signal: undefined
```

### Start an interactive shell session

```js
var client = require('prossh').client

client({
  host: '192.168.100.100',
  port: 22,
  username: 'frylock',
  privateKey: require('fs').readFileSync('/here/is/my/key')
}).then(conn => {
  console.log('Client :: ready')
  return conn.shell({pty: true}).then(shell => {
    shell.stdout.on('data', data => console.log("STDOUT : " + data))
    shell.stderr.on('data', data => console.log("STDERR : " + data))
    shell.stream.end('ls -l\nexit\n')
    return shell.result
  }).then(() => {
    console.log('Stream :: close')
    conn.end()
  })
})

// example output:
// Client :: ready
// STDOUT: Last login: Sun Jun 15 09:37:21 2014 from 192.168.100.100
//
// STDOUT: ls -l
// exit
//
// STDOUT: frylock@athf:~$ ls -l
//
// STDOUT: total 8
//
// STDOUT: drwxr-xr-x 2 frylock frylock 4096 Nov 18  2012 mydir
//
// STDOUT: -rw-r--r-- 1 frylock frylock   25 Apr 11  2013 test.txt
//
// STDOUT: frylock@athf:~$ exit
//
// STDOUT: logout
//
// Stream :: close
```

### Send a raw HTTP request to port 80 on the server

```js
var client = require('./lib/index.js').client

client({
  host: '192.168.100.100',
  port: 22,
  username: 'frylock',
  privateKey: require('fs').readFileSync('/here/is/my/key')
}).then(conn => {
  console.log('Client :: ready')
  return conn.forwardOut({host: '127.0.0.1', port: 80}).then(stream => {
    stream.on('close', () => {
      console.log('TCP :: CLOSED')
      conn.end()
    }).on('data', data => console.log('TCP :: DATA: ' + data))
      .end([
        'HEAD / HTTP/1.1',
        'User-Agent: curl/7.27.0',
        'Host: 127.0.0.1',
        'Accept: */*',
        'Connection: close',
        '',
        ''
      ].join('\r\n'))
  })
})

// example output:
// Client :: ready
// TCP :: DATA: HTTP/1.1 200 OK
// Date: Thu, 15 Nov 2012 13:52:58 GMT
// Server: Apache/2.2.22 (Ubuntu)
// X-Powered-By: PHP/5.4.6-1ubuntu1
// Last-Modified: Thu, 01 Jan 1970 00:00:00 GMT
// Content-Encoding: gzip
// Vary: Accept-Encoding
// Connection: close
// Content-Type: text/html; charset=UTF-8
//
//
// TCP :: CLOSED
```

### Forward local connections to port 8000 on the server to us

```js
var client = require('./lib/index.js').client

client({
  host: '192.168.100.100',
  port: 22,
  username: 'frylock',
  privateKey: require('fs').readFileSync('/here/is/my/key')
}).then(conn => {
  console.log('Client :: ready')
  return conn.forwardIn(8080).then(server => {
    console.log('Listening for connections on server on port 8000!');
    server.on('connection', socket => {
      console.log('TCP :: INCOMING CONNECTION:')
      console.dir({
        destIP: socket.localAddress,
        destPort: socket.localPort,
        srcIP: socket.remoteAddress,
        srcPort: socket.remotePort
      })
      socket.on('close', () => console.log('TCP :: CLOSED'))
        .on('data', data => console.log('TCP :: DATA: ' + data))
        .end([
          'HTTP/1.1 404 Not Found',
          'Date: Thu, 15 Nov 2012 02:07:58 GMT',
          'Server: ForwardedConnection',
          'Content-Length: 0',
          'Connection: close',
          '',
          ''
        ].join('\r\n'))
    })
  })
})

// example output:
// Client :: ready
// Listening for connections on server on port 8000!
//  (.... then from another terminal on the server: `curl -I http://127.0.0.1:8000`)
// TCP :: INCOMING CONNECTION: { destIP: '127.0.0.1',
//  destPort: 8000,
//  srcIP: '127.0.0.1',
//  srcPort: 41969 }
// TCP DATA: HEAD / HTTP/1.1
// User-Agent: curl/7.27.0
// Host: 127.0.0.1:8000
// Accept: */*
//
//
// TCP :: CLOSED
```

### Get a directory listing via SFTP

To be continued

### Connection hopping

TODO

### Forward remote X11 connections

Test required

### Dynamic (1:1) port forwarding using a SOCKSv5 proxy (using [socksv5](https://github.com/mscdex/socksv5))

Test required

### Invoke an arbitrary subsystem

To be continued
