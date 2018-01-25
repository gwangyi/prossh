import {Duplex, Readable} from 'stream'

class Stream extends Duplex {
  constructor (stdin, opt = {}) {
    super(opt)
    this.$stdin = stdin
  }

  _write (chunk, encoding, callback) {
    this.$stdin.write(chunk, encoding, callback)
  }

  _read (size) {
  }
}

class DummyReadable extends Readable {
  _read (size) {
  }
}

export class Process {
  constructor (client, stream) {
    this.$client = client
    this.$stream = stream

    this.stream = new Stream(stream.stdin)

    let stdout = [new DummyReadable(), this.stream]
    let stderr = [new DummyReadable(), this.stream]

    stream.stdout.on('data', data => stdout.map(strm => strm.push(data)))
    stream.stderr.on('data', data => stderr.map(strm => strm.push(data)))

    this.stdout = stream.stdout
    this.stderr = stream.stderr
    this.stdin = stream.stdin

    this.exitCode = new Promise((resolve, reject) => {
      stream.on('close', (code, signalName, didCoreDump, description) => {
        if (code !== null) { resolve(code) } else { reject(new Error(`${description} ${signalName}` + (didCoreDump ? ' (core dumped)' : ''))) }
      })
    })
  }

  signal (signalName) {
    return new Promise(resolve => {
      if (!this.$stream.signal(signalName)) { this.$client.on('continue', () => resolve()) } else { resolve() }
    })
  }
}

export class PtyProcess extends Process {
  setWindow (rows, cols, height, width) {
    return new Promise(resolve => {
      if (!this.$stream.setWindow(rows, cols, height, width)) { this.$client.on('continue', () => resolve()) } else { resolve() }
    })
  }
}
