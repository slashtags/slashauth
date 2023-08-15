const AuthServer = require('./netServer')

/**
 * HttpAuthServer is a server for the auth client.
 * @param {http.Server} server - A server to the auth client.
 * @param {Object} handlers - Handlers for the server.
 * @param {Function} handlers.onAuthz - A handler for authorization requests.
 * @param {Function} handlers.onMagicLink - A handler for magic link requests.
 * @param {Object} opts - Options for the server.
 * @param {Object} opts.keyPair - A key pair for the server.
 * @param {number} [opts.timeout] - A timeout for the server.
 * @param {number} [opts.keepAlive] - A keep alive for the server.
 * @returns {AuthServer} An AuthServer instance.
 */
class HttpAuthServer {
  constructor (server, handlers, opts, authUrl) {
    this.url = new URL(authUrl)

    server.on('connect', (req, socket, head) => {
      if (req.url !== this.url.pathname) {
        socket.write('HTTP/1.1 404 Not Found\r\n' +
          'Agent: SlashAuth\r\n' +
          '\r\n')

        socket.end()
        return
      }

      socket.write('HTTP/1.1 200 Connection Established\r\n' +
                  'Agent: SlashAuth\r\n' +
                  '\r\n')

      this.authServer = new AuthServer(socket, handlers, opts)
    })
  }

  /**
   * formatURL formats a token into a url.
   * @param {string} token - A token to format.
   * @returns {string} A formatted url.
   */
  formatURL (token) {
    return `${this.url}?token=${token}`
  }

  /**
   * close provided socket.
   * @returns {void}
   */
  close () {
    this.authServer?.close()
  }
}

module.exports = HttpAuthServer
