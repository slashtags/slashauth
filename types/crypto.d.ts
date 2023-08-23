export function createKeyPair(seed: any): {
    publicKey: any;
    secretKey: any;
};
export function createToken(): any;
export function sign(data: any, secretKey: any): any;
export function verify(signature: any, data: any, publicKey: any): any;
