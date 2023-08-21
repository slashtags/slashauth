const axios = require('axios')

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
    const { options, parsed } = this.urlToOptions(url)
    const req = axios.request(options)

    return new Promise((resolve, reject) => {
      req.on('error', e => reject(e))

      req.on('connect', (res, socket, upgradeHead) => {
        const authClient = new AuthClient(socket, this.opts)

        authClient.authz(parsed.searchParams.get('token')).then((data) => {
          resolve(data)
          socket.destroy()
        })
      })
    })
  }

  /**
   * magiclink requests a magic link.
   * @returns {Promise<IMagicLinkResponse>} A promise that resolves to a magic link object.
   */
  async magiclink (url) {
    const { options } = this.urlToOptions(url)
    const req = axios.request(options)
    req.end()

    return new Promise((resolve, reject) => {
      req.on('connect', (res, socket, upgradeHead) => {
        const authClient = new AuthClient(socket, this.opts)

        authClient.magiclink().then((data) => {
          resolve(data)
          socket.destroy()
        })
      })
    })
  }

  urlToOptions (url) {
    const parsed = new URL(url)
    const options = {
      protocol: parsed.protocol,
      host: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'CONNECT'
    }

    return { options, parsed }
  }
}

module.exports = HttpAuthClient
