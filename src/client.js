import {Client as _Client} from 'ssh2'
import EventEmitter from 'events'
import {Process, PtyProcess} from './process'
import {ForwardServer, _getFamily} from './forward-server'

class Client extends EventEmitter {
  constructor (conn) {
    super()
    this.$conn = conn
    this.$promise = Promise.resolve(null)

    this.banner = ''
    this.$forwardedIn = {}

    this.$conn.on('tcp connection', (detail, accept, reject) => {
      let server = (this.$forwardedIn[detail.destIP] || {})[detail.destPort]
      if (server) {
        let sock = accept()
        sock.localAddress = detail.destIP
        sock.localPort = detail.destPort
        sock.localFamily = _getFamily(detail.destIP)

        sock.remoteAddress = detail.srcIP
        sock.remotePort = detail.srcPort
        sock.remoteFamily = _getFamily(detail.srcIP)

        server.emit('connection', sock)
      } else reject()
    })
  }

  _connectTo (opt) {
    const host = opt.host
    const port = opt.port || 22

    let cfg = Object.assign({}, opt)
    delete cfg.host
    delete cfg.port

    return this.forwardOut({host, port}).then(stream => client(Object.assign(cfg, {sock: stream})))
  }

  connectTo (opts) {
    if (!Array.isArray(opts)) {
      opts = [opts]
    }

    let conns = []
    let opt = opts[0]
    let left = opts.slice(1)

    const cleanup = err => {
      for (let conn of conns) {
        conn.end()
      }
      throw err
    }

    let promise = this._connectTo(opt).catch(cleanup)

    for (let opt of left) {
      promise = promise.then(conn => {
        conns.unshift(conn)
        return conn._connectTo(opt)
      }, cleanup)
    }
    return promise
  }

  _waitContinue (fn, args) {
    this.$promise = this.$promise.then(_ => {
      let cont

      let promise = new Promise((resolve, reject) => {
        let argsWithCallback = Array.from(args)
        argsWithCallback.push((err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
        cont = fn.apply(this.$conn, argsWithCallback)
      })

      if (cont) return () => promise
      else {
        return new Promise(resolve => {
          this.$conn.once('continue', () => resolve(() => promise))
        })
      }
    }, err => { throw err })

    return this.$promise.then(lazy => lazy(), err => { throw err })
  }

  exec (command, options = {}) {
    let _Process = options.pty ? PtyProcess : Process

    return this._waitContinue(this.$conn.exec, [command, options])
      .then(stream => new _Process(this.$conn, stream), err => { throw err })
  }

  shell (window, options) {
    if (options === undefined) {
      options = window
      window = undefined
    }
    options = options || {}
    let _Process = options.pty || window ? PtyProcess : Process

    return this._waitContinue(this.$conn.shell, [window, options])
      .then(stream => new _Process(this.$conn, stream), err => { throw err })
  }

  forwardIn (cfg = {}) {
    if (typeof (cfg) !== 'object') cfg = {port: cfg}

    let {host, port} = cfg
    host = host || 'localhost'

    return this._waitContinue(this.$conn.forwardIn, [host, port])
      .then(newPort => {
        let server = new ForwardServer(host, newPort, this)
        if (!this.$forwardedIn[host]) this.$forwardedIn[host] = {}
        this.$forwardedIn[host][newPort] = server

        return server
      }, err => { throw err })
  }

  unforwardIn (cfg = {}) {
    if (typeof (cfg) !== 'object') cfg = {port: cfg}

    let {host, port} = cfg
    host = host || 'localhost'

    return this._waitContinue(this.$conn.unforwardIn, [host, port])
      .then(_ => ((this.$forwardedIn[host] || {})[port] || {emit: () => undefined}).emit('close'),
        err => { throw err })
  }

  forwardOut (cfg = {}) {
    let {srcHost, srcPort} = cfg
    let host = cfg.host || cfg.dstHost
    let port = cfg.port || cfg.dstPort
    srcHost = srcHost || 'localhost'
    srcPort = srcPort || 0

    return this._waitContinue(this.$conn.forwardOut, [srcHost, srcPort, host, port])
  }

  sftp () {
    return this._waitContinue(this.$conn.sftp, [])
  }

  subsys (subsystem) {
    return this._waitContinue(this.$conn.subsys, [])
  }

  end () {
    if (this.$conn) { this.$conn.end() }
  }
}

const connect = (opt) => {
  return new Promise((resolve, reject) => {
    let conn = new _Client()
    let client = new Client(conn)

    conn.once('ready', () => {
      resolve(client)
    }).once('error', err => {
      reject(err)
    }).on('banner', (message, language) => {
      client.banner = message
      client.emit('banner', message, language)
    }).connect(opt)
  })
}

export function client (opts) {
  if (!Array.isArray(opts)) { opts = [opts] }

  let conn = null
  let opt = opts[0]
  let left = opts.slice(1)
  if (left.length === 0) { return connect(opt) } else {
    return connect(opt).then(c => {
      conn = c
      return conn.connectTo(left)
    }).catch(err => {
      conn.end()
      throw err
    })
  }
}
