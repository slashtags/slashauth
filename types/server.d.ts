export = SlashAuthServer;
/**
 * SlashAuthServer
 * @param {object} opts
 * @param {object} opts.keypair - keypair
 * @param {string} opts.keypair.publicKey - public key
 * @param {string} opts.keypair.secretKey - secret key
 * @param {function} opts.authz - authz function
 * @param {function} opts.magiclink - magiclink function
 * @param {object} [opts.storage] - storage with (get, set, delete) methods
 * @param {object} [opts.sv] - signature verification object
 * @param {number} [opts.port] - rpc port
 * @param {string} [opts.host] - rpc host
 * @param {string} [opts.route] - rpc route
 * @param {string} [opts.version] - rpc version
 * @returns {SlashAuthServer}
 */
declare class SlashAuthServer {
    constructor(opts?: {});
    authz: any;
    magiclink: any;
    keypair: any;
    tokenStorage: any;
    sv: any;
    rpc: {
        port: any;
        host: any;
        route: any;
        version: any;
        endpointList: {
            name: string;
            svc: string;
            description: string;
        }[];
        handler: (ctx: any) => any;
    };
    server: any;
    /**
     * Get url to rpc server
     * @param {string} token
     * @returns {string}
     */
    formatUrl(token: string): string;
    /**
     * Start rpc server
     * @returns {Promise<void>}
     */
    start(): Promise<void>;
    /**
     * Stop rpc server
     * @returns {Promise<void>}
     */
    stop(): Promise<void>;
    /**
     * Get token by public key
     * @param {string} publicKey
     * @returns {string}
     */
    requestToken(publicKey: string): string;
    /**
     * Verify token
     * @param {object} opts
     * @property {string} opts.publicKey
     * @property {string} opts.token
     * @returns {Promise<void>}
     * @throws {Error} Invalid token
     */
    verifyToken({ publicKey, token }: object): Promise<void>;
}
