export = HttpAuthServer;
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
declare class HttpAuthServer {
    constructor(server: any, handlers: any, opts: any, authUrl: any);
    url: URL;
    authServer: AuthServer;
    /**
     * formatURL formats a token into a url.
     * @param {string} token - A token to format.
     * @returns {string} A formatted url.
     */
    formatURL(token: string): string;
    /**
     * close provided socket.
     * @returns {void}
     */
    close(): void;
}
import AuthServer = require("./netServer");
