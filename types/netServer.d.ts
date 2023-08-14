export = AuthServer;
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
declare class AuthServer {
    constructor(socket: any, handlers: any, options?: {});
    socket: any;
    /**
     * close provided socket.
     * @returns {void}
     */
    close(): void;
}
