export = HttpAuthClient;
/**
 * HttpAuthClient is a client for the auth server.
 * @param {http.Server} server - A server to the auth server.
 * @param {Object} opts - Options for the client.
 * @param {Object} opts.keyPair - A key pair for the client.
 * @param {Buffer} opts.remotePublicKey - The public key of the auth server.
 * @returns {AuthClient} An AuthClient instance.
 */
declare class HttpAuthClient {
    constructor(opts: any);
    opts: any;
    /**
     * authz requests authorization for a token.
     * @param {string} token - A token to authorize.
     * @returns {Promise<IAuthZResponse>} A promise that resolves to an authorization object.
     */
    authz(url: any): Promise<IAuthZResponse>;
    /**
     * magiclink requests a magic link.
     * @returns {Promise<IMagicLinkResponse>} A promise that resolves to a magic link object.
     */
    magiclink(url: any): Promise<IMagicLinkResponse>;
}
