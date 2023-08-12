export type IAuthZResponse = any | {
    status: "ok";
    resources: string[];
} | {
    status: "error";
    message: string;
};
export type IMagicLinkResponse = {
    url: string;
    validUntil: number;
};
export namespace authzOptions {
    let responseEncoding: any;
    let requestEncoding: any;
}
export namespace magiclinkOptions {
    let responseEncoding_1: any;
    export { responseEncoding_1 as responseEncoding };
    let requestEncoding_1: any;
    export { requestEncoding_1 as requestEncoding };
}
