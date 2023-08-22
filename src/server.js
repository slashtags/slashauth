const { RPC } = require('slashtags-server')
const { createToken } = require('./crypto.js')

const endpointList = [
  {
    name: 'authz',
    svc: 'SlashAuthServer.authz',
    description: 'Authenticate and authorize a user using signature server generated nonce'
  },
  {
    name: 'magiclink',
    svc: 'SlashAuthServer.magiclink',
    description: 'Request a magic to be sent to the user'
  },
  {
    name: 'requestToken',
    svc: 'SlashAuthServer.requestToken',
    description: 'Requst a nonce associated with user\'s public key'
  }
]

const sv = {
  sign: function (data, secretKey) {
    return require('./crypto').sign(data, secretKey)
  },
  verify: function (signature, data, publicKey) {
    if (require('./crypto').verify(signature, data, publicKey)) return

    throw new Error('Invalid signature')
  }
}

const handlersWrappers = {
  authz: async function ({ publicKey, token, signature }) {
    this.sv.verify(signature, token, publicKey)

    const result = await this.authz({ publicKey, token, signature })

    return {
      result,
      signature: this.sv.sign(JSON.stringify(result), this.keypair.secretKey)
    }
  },

  requestToken: async function ({ publicKey, signature }) {
    this.sv.verify(signature, publicKey, publicKey)
    const result = await this.requestToken(publicKey)

    return {
      result,
      signature: this.sv.sign(JSON.stringify(result), this.keypair.secretKey)
    }
  },

  magiclink: async function ({ publicKey, token, signature }) {
    this.sv.verify(signature, token, publicKey)
    this.verifyToken({ publicKey, token })

    const result = await this.magiclink(publicKey)

    return {
      result,
      signature: this.sv.sign(JSON.stringify(result), this.keypair.secretKey)
    }
  }
}

class SlashAuthServer {
  constructor (opts = {}) {
    if (!opts.keypair) throw new Error('No keypair')
    if (!opts.authz) throw new Error('No authz')
    if (!opts.magiclink) throw new Error('No magiclink')

    this.authz = opts.authz
    this.magiclink = opts.magiclink

    this.keypair = opts.keypair

    this.tokens = opts.storage || new Map()
    this.sv = opts.sv || sv

    this.rpc = {
      port: opts.port || 8000,
      host: opts.host || 'localhost',
      route: opts.route || 'auth',
      version: opts.version || 'v0.1',
      endpointList,
      handler: (ctx) => {
        const fn = handlersWrappers[ctx.getSvcFn()]
        if (fn) return fn.call(this, ctx.params)

        return ctx.failedMethod('INVALID_METHOD')
      }
    }

    this.server = null
  }

  formatUrl (token) {
    const url = new URL(`http://${this.rpc.host}`)
    url.port = this.rpc.port
    url.pathname = `/${this.rpc.version}/${this.rpc.route}`
    url.search = `token=${token}`

    return url.toString()
  }

  async start () {
    this.server = new RPC({ rpc: this.rpc })
    return await this.server.start()
  }

  async stop () {
    await this.server?.stop()
  }

  async requestToken (publicKey) {
    const token = createToken()
    await this.tokens.set(publicKey, token)

    return { token }
  }

  async verifyToken ({ publicKey, token }) {
    if (!token) throw new Error('invalid token')

    const storedToken = await this.tokens.get(publicKey)
    await this.tokens.delete(publicKey)

    if (storedToken !== token) throw new Error('invalid token')
  }
}

module.exports = SlashAuthServer
