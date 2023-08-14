const http = require('http')
const AuthClient = require('./netClient')

/**
 * HttpAuthClient is a client for the auth server.
 * @param {http.Server} server - A server to the auth server.
 * @param {Object} opts - Options for the client.
 * @param {Object} opts.keyPair - A key pair for the client.
 * @param {Buffer} opts.remotePublicKey - The public key of the auth server.
 * @returns {AuthClient} An AuthClient instance.
 */
class HttpAuthClient {
  constructor (opts) {
    this.opts = opts
  }

  /**
   * authz requests authorization for a token.
   * @param {string} token - A token to authorize.
   * @returns {Promise<IAuthZResponse>} A promise that resolves to an authorization object.
   */
  async authz (url) {
    const parsed = new URL(url)
    const options = {
      host: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'CONNECT'
    }

    const req = http.request(options)
    req.end()

    return new Promise((resolve, reject) => {
      req.on('error', e => reject(e))

      req.on('connect', (res, socket, upgradeHead) => {
        const authClient = new AuthClient(socket, this.opts)

        authClient.authz(parsed.searchParams.get('token')).then(data => resolve(data))
      })
    })
  }

  /**
   * magiclink requests a magic link.
   * @returns {Promise<IMagicLinkResponse>} A promise that resolves to a magic link object.
   */
  async magiclink (url) {
    const parsed = new URL(url)
    const options = {
      host: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'CONNECT'
    }

    const req = http.request(options)
    req.end()

    return new Promise((resolve, reject) => {
      req.on('connect', (res, socket, upgradeHead) => {
        const authClient = new AuthClient(socket, this.opts)

        authClient.magiclink().then(data => resolve(data))
      })
    })
  }
}

module.exports = HttpAuthClient
