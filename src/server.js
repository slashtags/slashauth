const { RPC } = require('slashtags-server')
const { createToken } = require('./crypto.js')

const SlashtagsURL = require('@synonymdev/slashtags-url')

const Noise = require('noise-handshake')
const Cipher = require('noise-handshake/cipher')

const prologue = Buffer.alloc(0) // prologue is just a well-known value.

const endpointList = [
  {
    name: 'authz',
    svc: 'SlashAuthServer.authz',
    description: 'Authenticate and authorize a user using signature of server generated nonce'
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
  /**
   * Sign data with secret key
   * @param {string|buffer} data
   * @param {string|buffer} secretKey
   * @returns {string}
   */
  sign: function (data, secretKey) {
    return require('./crypto').sign(data, secretKey)
  },

  /**
   * Verify signature
   * @param {string} signature
   * @param {string|buffer} data
   * @param {string|buffer} publicKey
   * @returns {boolean}
   * @throws {Error} Invalid signature
   */
  verify: function (signature, data, publicKey) {
    if (require('./crypto').verify(signature, data, publicKey)) return

    throw new Error('Invalid signature')
  }
}

const handlersWrappers = {
  /**
   * Authenticate and authorize a user using signature server generated nonce
   * @param {object} params
   * @param {string} params.publicKey
   * @param {string} params.token
   * @param {string} params.signature
   * @returns {object}
   * @throws {Error} Invalid signature
   * @throws {Error} Invalid token
   */
  authz: async function (encryptedRequest) {
    const payload = JSON.parse(this.responder.recv(Buffer.from(encryptedRequest, 'hex')).toString())

    const { publicKey, token, signature } = payload
    this.sv.verify(signature, `${token}`, publicKey)

    const result = await this.authz({ publicKey, token, signature })

    const encrypted = this.responder.send(Buffer.from(JSON.stringify(result))).toString('hex')

    return {
      encrypted,
      signature: this.sv.sign(JSON.stringify(result), this.keypair.secretKey)
    }
  },

  /**
   * Request a magic to be sent to the user
   * @param {object} params
   * @param {string} params.publicKey
   * @param {string} params.signature
   * @returns {object}
   * @throws {Error} Invalid signature
   * @throws {Error} Invalid token
   */
  requestToken: async function (encryptedRequest) {
    const payload = JSON.parse(this.responder.recv(Buffer.from(encryptedRequest, 'hex')).toString())
    const { publicKey, signature } = payload

    this.sv.verify(signature, `${publicKey}`, publicKey)
    const result = await this.requestToken(publicKey)


    const newResponder = new Noise('IK', false)//, this.keypair)
    newResponder.initialise(prologue)

    result.hk = newResponder.s.publicKey.toString('hex')

    const encrypted = this.responder.send(Buffer.from(JSON.stringify(result))).toString('hex')

    this.responder = newResponder

    return {
      encrypted,
      signature: this.sv.sign(JSON.stringify(result), this.keypair.secretKey)
    }
  },

  /**
   * Requst a nonce associated with user's public key
   * @param {object} params
   * @param {string} params.publicKey
   * @param {string} params.token
   * @param {string} params.signature
   * @returns {object}
   * @throws {Error} Invalid signature
   * @throws {Error} Invalid token
   */
  magiclink: async function (encryptedRequest) {
    const payload = JSON.parse(this.responder.recv(Buffer.from(encryptedRequest, 'hex')).toString())
    const { publicKey, token, signature } = payload

    this.sv.verify(signature, `${token}`, publicKey)
    this.verifyToken({ publicKey, token })

    const result = await this.magiclink(publicKey)

    const encrypted = this.responder.send(Buffer.from(JSON.stringify(result))).toString('hex')

    return {
      encrypted,
      signature: this.sv.sign(JSON.stringify(result), this.keypair.secretKey)
    }
  }
}

/**
 * SlashAuthServer
 * @param {object} opts
 * @param {object} opts.keypair - keypair
 * @param {string} opts.keypair.publicKey - public key
 * @param {string} opts.keypair.secretKey - secret key
 * @param {function} opts.authz - authz function
 * @param {function} opts.magiclink - magiclink function
 * @param {object} [opts.storage] - storage with (get, set, delete) methods
 * @param {object} [opts.sv] - signature verification object
 * @param {number} [opts.port] - rpc port
 * @param {string} [opts.host] - rpc host
 * @param {string} [opts.route] - rpc route
 * @param {string} [opts.version] - rpc version
 * @returns {SlashAuthServer}
 */
class SlashAuthServer {
  constructor (opts = {}) {
    if (!opts.keypair) throw new Error('No keypair')
    if (!opts.authz) throw new Error('No authz')
    if (!opts.magiclink) throw new Error('No magiclink')

    this.authz = opts.authz
    this.magiclink = opts.magiclink

    this.keypair = opts.keypair

    this.tokenStorage = opts.storage || new Map()

    this.responder = new Noise('IK', false)//, this.keypair)
    this.responder.initialise(prologue)

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

  /**
   * Get url to rpc server
   * @param {string} token
   * @returns {string}
   */
  formatUrl (token) {
    return SlashtagsURL.format(this.keypair.publicKey, {
      path: `/${this.rpc.version}/${this.rpc.route}`,
      // FXIME: https
      query: `token=${token}&hk=${this.responder.s.publicKey.toString('hex')}&relay=http://${this.rpc.host}:${this.rpc.port}`
    })
  }

  /**
   * Start rpc server
   * @returns {Promise<void>}
   */
  async start () {
    this.server = new RPC({ rpc: this.rpc })
    return await this.server.start()
  }

  /**
   * Stop rpc server
   * @returns {Promise<void>}
   */
  async stop () {
    await this.server?.stop()
  }

  /**
   * Get token by public key
   * @param {string} publicKey
   * @returns {string}
   */
  async requestToken (publicKey) {
    const token = createToken()
    await this.tokenStorage.set(publicKey, token)

    return { token }
  }

  /**
   * Verify token
   * @param {object} opts
   * @property {string} opts.publicKey
   * @property {string} opts.token
   * @returns {Promise<void>}
   * @throws {Error} Invalid token
   */
  async verifyToken ({ publicKey, token }) {
    if (!token) throw new Error('invalid token')

    const storedToken = await this.tokenStorage.get(publicKey)
    await this.tokenStorage.delete(publicKey)

    if (storedToken !== token) throw new Error('invalid token')
  }
}

module.exports = SlashAuthServer
