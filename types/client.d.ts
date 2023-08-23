export = SlashAuthClient;
/**
 * SlashAuthClient
 * @param {object} opts
 * @param {object} opts.keypair - keypair
 * @param {string|buffer} opts.keypair.publicKey - public key
 * @param {string|buffer} opts.keypair.secretKey - secret key
 * @param {string|buffer} opts.serverPublicKey - server public key
 * @param {object} opts.sv
 * @param {function} opts.sv.sign - sign function
 * @param {function} opts.sv.verify - verify function
 * @returns {object}
 */
declare class SlashAuthClient {
    constructor(opts?: {});
    keypair: any;
    serverPublicKey: any;
    sv: any;
    /**
     * Authenticate and authorize a user using signature of server generated nonce
     * @param {string} url
     * @returns {object}
     * @throws {Error} Invalid signature
     * @throws {Error} Invalid token
     * @throws {Error} No url
     * @throws {Error} No signature in response
     * @throws {Error} No result in response
     */
    authz(url: string): object;
    /**
     * Authenticate and authorize a user using magiclink
     * @param {string} url
     * @returns {object}
     * @throws {Error} Invalid signature
     * @throws {Error} Invalid token
     * @throws {Error} No url
     * @throws {Error} No signature in response
     * @throws {Error} No result in response
     */
    magiclink(url: string): object;
    /**
     * Request a token from the server
     * @param {string} url
     * @returns {object}
     * @throws {Error} Invalid signature
     * @throws {Error} Invalid token
     * @throws {Error} No url
     * @throws {Error} No signature in response
     * @throws {Error} No result in response
     */
    requestToken(url: string): object;
    /**
     * Process response
     * @param {object} body
     * @returns {object}
     * @throws {Error} Invalid signature
     * @throws {Error} Invalid token
     * @throws {Error} No signature in response
     * @throws {Error} No result in response
     * @throws {Error} No url
     */
    processResponse(body: object): object;
}
