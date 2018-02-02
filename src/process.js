import {PassThrough} from 'stream'
import es from 'event-stream'

export class Process {
  constructor (client, stream) {
    this.$client = client
    this.$stream = stream

    let stdout = [new PassThrough(), new PassThrough()]
    let stderr = [new PassThrough(), new PassThrough()]

    stdout.forEach(stream.stdout.pipe.bind(stream.stdout))
    stderr.forEach(stream.stderr.pipe.bind(stream.stderr))
    let commonOut = es.merge(stdout[1], stderr[1])
    this.stream = es.duplex(stream.stdin, commonOut)

    this.stdout = stdout[0]
    this.stderr = stderr[0]
    this.stdin = stream.stdin

    this.result = new Promise((resolve, reject) => {
      stream.on('close', (code, signalName, didCoreDump, description) => {
        resolve({code, signalName, didCoreDump, description})
      })
    })
    this.exitCode = this.result.then(({code}) => code, err => { throw err })
    this.exitSignal = this.result.then(({signalName}) => signalName, err => { throw err })
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
