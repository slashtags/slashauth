const fetch = require('node-fetch')
const SlashtagsURL = require('@synonymdev/slashtags-url')

const Noise = require('noise-handshake')
const Cipher = require('noise-handshake/cipher')

const prologue = Buffer.alloc(0) // prologue is just a well-known value.

const headers = {
  'Content-Type': 'application/json'
}

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
  },

  /**
   * Generate token
   * @returns {string}
   */
  createToken: function () {
    return require('./crypto').createToken()
  }
}

/**
 * SlashAuthClient
 * @param {object} opts
 * @param {object} opts.keypair - keypair
 * @param {string|buffer} opts.keypair.publicKey - public key
 * @param {string|buffer} opts.keypair.secretKey - secret key
 * @param {string|buffer} opts.serverPublicKey - server public key
 * @param {object} opts.sv
 * @param {function} opts.sv.sign - sign function
 * @param {function} opts.sv.verify - verify function
 * @param {function} opts.sv.createToken - createToken function
 * @returns {object}
 */
class SlashAuthClient {
  constructor (opts = {}) {
    if (!opts.keypair) throw new Error('No keypair')
    if (!opts.serverPublicKey) throw new Error('No serverPublicKey')

    this.keypair = opts.keypair
    this.serverPublicKey = opts.serverPublicKey
    this.sv = opts.sv || sv

    this.initiator = new Noise('IK', true)

    this.enc = null
    this.dec = null
  }

  /**
   * Authenticate and authorize a user using signature of server generated nonce
   * @param {string} url
   * @returns {object}
   * @throws {Error} Invalid signature
   * @throws {Error} Invalid token
   * @throws {Error} No url
   * @throws {Error} No signature in response
   * @throws {Error} No result in response
   */
  async authz (url) {
    if (!url) throw new Error('No url')

    const parsed = new URL(url)
    await this.shakeHands(url)

    const token = parsed.searchParams.get('token')
    const params = this.createRequestParams({ token })

    return this.sendRequest('authz', url, params)
  }

  /**
   * Authenticate and authorize a user using magiclink
   * @param {string} url
   * @returns {object}
   * @throws {Error} Invalid signature
   * @throws {Error} Invalid token
   * @throws {Error} No url
   * @throws {Error} No signature in response
   * @throws {Error} No result in response
   */
  async magiclink (url) {
    if (!url) throw new Error('No url')

    await this.shakeHands(url)
    const { token } = await this.requestToken(url)
    const params = this.createRequestParams({ token })

    return this.sendRequest('magiclink', url, params)
  }

  /**
   * Request a token from the server
   * @param {string} url
   * @returns {object}
   * @throws {Error} Invalid signature
   * @throws {Error} Invalid token
   * @throws {Error} No url
   * @throws {Error} No signature in response
   * @throws {Error} No result in response
   */
  async requestToken (url) {
    if (!url) throw new Error('No url')

    await this.shakeHands(url)
    const params = this.createRequestParams({
      publicKey: this.keypair.publicKey.toString('hex')
    })

    return this.sendRequest('requestToken', url, params)
  }

  /**
   * Process response
   * @param {object} body
   * @param {string} nonce
   * @returns {object}
   * @throws {Error} Invalid signature
   * @throws {Error} Invalid token
   * @throws {Error} No signature in response
   * @throws {Error} No result in response
   * @throws {Error} No url
   */
  processResponse (body, nonce) {
    if (body.error) throw new Error(body.error.message)
    if (!body.result.signature) throw new Error('No signature in response')
    if (!body.result.result) throw new Error('No result in response')
    if (body.result.result.nonce !== nonce) throw new Error('Invalid nonce')

    this.sv.verify(
      body.result.signature,
      JSON.stringify(body.result.result),
      this.serverPublicKey
    )

    return body.result.result
  }

  /**
   * Send request to server
   * @param {string} method
   * @param {string} url
   * @param {object} params
   * @returns {object} response
   */
  async sendRequest (method, url, params) {
    const parsed = SlashtagsURL.parse(url)

    // XXX: method can not be encrypted
    const res = await fetch(parsed.query.relay + parsed.path, {
      headers,
      method: 'POST',
      // XXX encrypt params
      body: JSON.stringify({ method, params })
    })

    let body = await res.json()
    if (this.dec) {
      body.result.result = JSON.parse(this.dec.decrypt(body.result.encrypted).toString())
    }

    return this.processResponse(body, params.nonce)
  }

  /**
   * Create request params
   * @param {object} param
   * @returns {object}
   */
  createRequestParams (param = {}) {
    const nonce = this.sv.createToken()
    const data = Object.values(param)[0]
    const signature = this.sv.sign(`${nonce}:${data}`, this.keypair.secretKey)
    return {
      ...param,
      nonce,
      publicKey: this.keypair.publicKey.toString('hex'),
      signature
    }
  }

  async shakeHands (url) {
    if (this.enc && this.dec) return

    const parsed = SlashtagsURL.parse(url)

    // XXX consider using nonce
    this.initiator.initialise(Buffer.from('a'), Buffer.from(parsed.query.hk, 'hex'))

    const handshakeMessage = this.initiator.send().toString('hex')
    const params = await this.createRequestParams({ handshakeMessage })
    const reply = await this.sendRequest('handshake', url, params)

    this.initiator.recv(Buffer.from(reply.handshakeMessage, 'hex'))

    if(!this.initiator.complete) throw new Error('Handshake failed')

    this.enc = new Cipher(this.initiator.rx),
    this.dec = new Cipher(this.initiator.tx)
  }
}

module.exports = SlashAuthClient
