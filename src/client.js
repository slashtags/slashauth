const fetch = require('node-fetch')

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
 * @returns {object}
 */
class SlashAuthClient {
  constructor (opts = {}) {
    if (!opts.keypair) throw new Error('No keypair')
    if (!opts.serverPublicKey) throw new Error('No serverPublicKey')

    this.keypair = opts.keypair
    this.serverPublicKey = opts.serverPublicKey
    this.sv = opts.sv || sv
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
    const res = await fetch(url, {
      headers,
      method: 'POST',
      body: JSON.stringify({
        method: 'authz',
        params: {
          publicKey: this.keypair.publicKey.toString('hex'),
          token: parsed.searchParams.get('token'),
          signature: this.sv.sign(parsed.searchParams.get('token'), this.keypair.secretKey)
        }
      })
    })
    const body = await res.json()

    return this.processResponse(body)
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

    const { token } = await this.requestToken(url)
    const res = await fetch(url, {
      headers,
      method: 'POST',
      body: JSON.stringify({
        method: 'magiclink',
        params: {
          publicKey: this.keypair.publicKey.toString('hex'),
          signature: this.sv.sign(token, this.keypair.secretKey),
          token
        }
      })
    })
    const body = await res.json()

    return this.processResponse(body)
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

    const res = await fetch(url, {
      headers,
      method: 'POST',
      body: JSON.stringify({
        method: 'requestToken',
        params: {
          publicKey: this.keypair.publicKey.toString('hex'),
          signature: this.sv.sign(this.keypair.publicKey.toString('hex'), this.keypair.secretKey)
        }
      })
    })

    const body = await res.json()

    return this.processResponse(body)
  }

  /**
   * Process response
   * @param {object} body
   * @returns {object}
   * @throws {Error} Invalid signature
   * @throws {Error} Invalid token
   * @throws {Error} No signature in response
   * @throws {Error} No result in response
   * @throws {Error} No url
   */
  processResponse (body) {
    if (body.error) throw new Error(body.error.message)
    if (!body.result.signature) throw new Error('No signature in response')
    if (!body.result.result) throw new Error('No result in response')

    this.sv.verify(
      body.result.signature,
      JSON.stringify(body.result.result),
      this.serverPublicKey
    )

    return body.result.result
  }
}

module.exports = SlashAuthClient
