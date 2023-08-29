const fetch = require('node-fetch')
const SlashtagsURL = require('@synonymdev/slashtags-url')

const Noise = require('noise-handshake')
const Cipher = require('noise-handshake/cipher')
const curve = require('noise-curve-ed')

const prologue = Buffer.alloc(0)

const headers = { 'Content-Type': 'application/json' }

/**
 * SlashAuthClient
 * @param {object} opts
 * @param {object} opts.keypair - keypair
 * @param {string|buffer} opts.keypair.publicKey - public key
 * @param {string|buffer} opts.keypair.secretKey - secret key
 * @param {string|buffer} opts.serverPublicKey - server public key
 * @returns {object}
 */
class SlashAuthClient {
  constructor (opts = {}) {
    if (!opts.keypair) throw new Error('No keypair')
    if (!opts.serverPublicKey) throw new Error('No serverPublicKey')

    this.keypair = opts.keypair
    this.serverPublicKey = opts.serverPublicKey
  }

  /**
   * Authenticate and authorize a user using signature of server generated nonce
   * @param {string} url
   * @returns {object}
   * @throws {Error} No url
   */
  async authz (url) {
    if (!url) throw new Error('No url')

    const parsed = new URL(url)

    return this.sendRequest('authz', url, {
      token: parsed.searchParams.get('token'),
      publicKey: this.keypair.publicKey.toString('hex'),
    })
  }

  /**
   * Authenticate and authorize a user using magiclink
   * @param {string} url
   * @returns {object}
   * @throws {Error} No url
   */
  async magiclink (url) {
    if (!url) throw new Error('No url')

    return this.sendRequest('magiclink', url, {
      publicKey: this.keypair.publicKey.toString('hex'),
    })
  }

  /**
   * Send request to server
   * @param {string} method
   * @param {string} url
   * @param {object} params
   * @returns {object} response
   */
  async sendRequest (method, url, params) {
    const initiator = new Noise('IK', true, this.keypair, { curve })
    const parsed = SlashtagsURL.parse(url)

    initiator.initialise(prologue, this.serverPublicKey)
    const payload = initiator.send(Buffer.from(JSON.stringify(params))).toString('hex')

    const res = await fetch(parsed.query.relay + parsed.path, {
      headers,
      method: 'POST',
      body: JSON.stringify({ method, params: payload })
    })

    let body = await res.json()
    if (body.error) throw new Error(body.error.message)
    if (!body.result) throw new Error('No result in response')

    return JSON.parse(initiator.recv(Buffer.from(body.result, 'hex')).toString())
  }
}

module.exports = SlashAuthClient

