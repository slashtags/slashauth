const { RPC } = require('slashtags-server')
const { createToken } = require('./crypto.js')

const SlashtagsURL = require('@synonymdev/slashtags-url')

const Noise = require('noise-handshake')
const Cipher = require('noise-handshake/cipher')
const curve = require('noise-curve-ed')

const prologue = Buffer.alloc(0)

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
]

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
    const responder = new Noise('IK', false, this.keypair, { curve })
    responder.initialise(prologue)

    const payload = JSON.parse(responder.recv(Buffer.from(encryptedRequest, 'hex')).toString())

    const { publicKey, token } = payload
    const result = await this.authz({ publicKey, token })

    const encrypted = responder.send(Buffer.from(JSON.stringify(result))).toString('hex')

    return {
      encrypted,
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
    const responder = new Noise('IK', false, this.keypair, { curve })
    responder.initialise(prologue)

    const payload = JSON.parse(responder.recv(Buffer.from(encryptedRequest, 'hex')).toString())
    const { publicKey } = payload

    const result = await this.magiclink(publicKey)
    const encrypted = responder.send(Buffer.from(JSON.stringify(result))).toString('hex')

    return {
      encrypted,
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
      query: `token=${token}&relay=http://${this.rpc.host}:${this.rpc.port}`
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
}

module.exports = SlashAuthServer
