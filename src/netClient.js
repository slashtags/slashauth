const { authzOptions, magiclinkOptions } = require('./rpc-options.js')
const SecretStream = require('@hyperswarm/secret-stream')
const ProtomuxRPC = require('protomux-rpc')

/**
 * NetAuthClient is a client for the auth server.
 * @param {net.Socket} socket - A socket to the auth server.
 * @param {Object} opts - Options for the client.
 * @param {Object} opts.keyPair - A key pair for the client.
 * @param {Buffer} opts.remotePublicKey - The public key of the auth server.
 * @returns {AuthClient} An AuthClient instance.
 */
class AuthClient {
  constructor (socket, opts) {
    if (!socket) throw new Error('No socket provided')
    try {
      if (!opts) throw new Error('No options provided')
      if (!opts.keyPair) throw new Error('No key pair provided')
      if (!opts.remotePublicKey) throw new Error('No server public key provided')
    } catch (e) {
      socket.destroy()
      throw e
    }

    this.rpc = new ProtomuxRPC(new SecretStream(true, socket, opts))
  }

  /**
   * authz requests authorization for a token.
   * @param {string} token - A token to authorize.
   * @returns {Promise<IAuthZResponse>} A promise that resolves to an authorization object.
   */
  async authz (token) {
    return await this.rpc.request('authz', token, authzOptions)
  }

  /**
   * magiclink requests a magic link.
   * @returns {Promise<IMagicLinkResponse>} A promise that resolves to a magic link object.
   */
  async magiclink () {
    return await this.rpc.request('magiclink', null, magiclinkOptions)
  }
}

module.exports = AuthClient
