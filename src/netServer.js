const SecretStream = require('@hyperswarm/secret-stream')
const ProtomuxRPC = require('protomux-rpc')

const { authzOptions, magiclinkOptions } = require('./rpc-options.js')

/**
 * NetAuthServer is a server for the auth client.
 * @param {net.Socket} socket - A socket to the auth client.
 * @param {Object} handlers - Handlers for the server.
 * @param {Function} handlers.onAuthz - A handler for authorization requests.
 * @param {Function} handlers.onMagicLink - A handler for magic link requests.
 * @param {Object} opts - Options for the server.
 * @param {Object} opts.keyPair - A key pair for the server.
 * @param {number} [opts.timeout] - A timeout for the server.
 * @param {number} [opts.keepAlive] - A keep alive for the server.
 * @returns {AuthServer} An AuthServer instance.
 */
class AuthServer {
  constructor (socket, handlers, options = {}) {
    if (!socket) throw new Error('No socket provided')

    try {
      if (!handlers) throw new Error('No handlers provided')
      if (!handlers.onAuthz || !handlers.onMagicLink) throw new Error('No handler methods provided')
      if (!options.keyPair) throw new Error('No key pair provided')
    } catch (e) {
      socket.destroy()
      throw e
    }

    this.socket = socket

    const rpc = new ProtomuxRPC(this.socket)

    rpc.respond('authz', authzOptions, data => handlers.onAuthz(data))
    rpc.respond('magiclink', magiclinkOptions, _ => handlers.onMagicLink())
  }

  /**
   * close provided socket.
   * @returns {void}
   */
  close () {
    this.socket.destroy()
  }
}

module.exports = AuthServer
