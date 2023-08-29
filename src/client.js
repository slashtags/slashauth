const { sendRequest } = require('slashtags-request')

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

    return sendRequest({
      method: 'authz',
      url,
      keypair: this.keypair,
      serverPublicKey: this.serverPublicKey,
      params: {
        token: parsed.searchParams.get('token'),
        publicKey: this.keypair.publicKey.toString('hex')
      }
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

    return sendRequest({
      method: 'magiclink',
      url,
      keypair: this.keypair,
      serverPublicKey: this.serverPublicKey,
      params: {
        publicKey: this.keypair.publicKey.toString('hex')
      }
    })
  }
}

module.exports = SlashAuthClient
