import EventEmitter from 'events'
import net from 'net'

export const _getFamily = (addr) => {
  let v = net.isIP(addr)
  if (v === 0) return 'IPv4'
  else return 'IPv' + v
}

export class ForwardServer extends EventEmitter {
  constructor (host, port, client) {
    super()
    this.$info = {host, port, client}
  }

  address () {
    let family = _getFamily(this.$info.host)

    return {
      address: this.$info.host,
      port: this.$info.port,
      family
    }
  }

  close (callback) {
    if (callback) { this.on('close', callback) }
    return this.$info.client.unforwardIn(this.$info)
  }
}
