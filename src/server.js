const { RPC } = require("@slashtagsdev/slashtags-server");
const SlashtagsURL = require("@synonymdev/slashtags-url");

const endpointList = [
  {
    name: "authz",
    svc: "SlashAuthServer.authz",
    description:
      "Authenticate and authorize a user using signature of server generated nonce",
  },
  {
    name: "magiclink",
    svc: "SlashAuthServer.magiclink",
    description: "Request a magic to be sent to the user",
  },
];

const handlersWrappers = {
  /**
   * Authenticate and authorize a user using signature server generated nonce
   * @param {object} params
   * @param {string} params.publicKey
   * @param {string} params.token
   * @returns {object}
   */
  authz: async function ({ publicKey, token }) {
    return await this.authz({ publicKey, token });
  },

  /**
   * Requst a nonce associated with user's public key
   * @param {object} params
   * @param {string} params.publicKey
   * @returns {object}
   */
  magiclink: async function ({ publicKey }) {
    return await this.magiclink(publicKey);
  },
};

/**
 * SlashAuthServer
 * @param {object} opts
 * @param {object} opts.keypair - keypair
 * @param {string|buffer} opts.keypair.publicKey - public key
 * @param {string|buffer} opts.keypair.secretKey - secret key
 * @param {function} opts.authz - authz function
 * @param {function} opts.magiclink - magiclink function
 * @param {number} [opts.port] - rpc port
 * @param {string} [opts.host] - rpc host
 * @param {string} [opts.route] - rpc route
 * @param {string} [opts.version] - rpc version
 * @returns {SlashAuthServer}
 */
class SlashAuthServer {
  constructor(opts = {}) {
    if (!opts.keypair) throw new Error("No keypair");
    if (!opts.authz) throw new Error("No authz");
    if (!opts.magiclink) throw new Error("No magiclink");

    this.authz = opts.authz;
    this.magiclink = opts.magiclink;

    this.keypair = opts.keypair;

    this.rpc = {
      port: opts.port === null ? "" : opts.port || 8000,
      host: opts.host || "localhost",
      route: opts.route || "auth",
      version: opts.version || "v0.1",
      endpointList,
      handler: (ctx) => {
        const fn = handlersWrappers[ctx.getSvcFn()];
        if (fn) return fn.call(this, ctx.params);

        return ctx.failedMethod("INVALID_METHOD");
      },
    };

    this.server = null;
  }

  /**
   * Get url to rpc server
   * @param {string} token
   * @returns {string}
   */
  formatUrl(token) {
    return SlashtagsURL.format(this.keypair.publicKey, {
      path: `/${this.rpc.version}/${this.rpc.route}`,
      query: `token=${token}&relay=http://${this.rpc.host}:${this.rpc.port}`,
    });
  }

  /**
   * Start rpc server
   * @returns {Promise<void>}
   */
  async start() {
    this.server = new RPC({ rpc: this.rpc, keypair: this.keypair });
    return await this.server.start();
  }

  /**
   * Stop rpc server
   * @returns {Promise<void>}
   */
  async stop() {
    await this.server?.stop();
  }

  /**
   * Generate valid keypair
   * @returns {object}
   */
  static generateKeyPair() {
    return require("noise-curve-ed").generateKeyPair();
  }
}

module.exports = SlashAuthServer;
