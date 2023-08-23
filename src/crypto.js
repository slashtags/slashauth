const b4a = require('b4a')
const sodium = require('sodium-universal')

function createKeyPair (seed) {
  const publicKey = b4a.allocUnsafe(sodium.crypto_sign_PUBLICKEYBYTES)
  const secretKey = b4a.allocUnsafe(sodium.crypto_sign_SECRETKEYBYTES)

  if (seed) sodium.crypto_sign_seed_keypair(publicKey, secretKey, seed)
  else sodium.crypto_sign_keypair(publicKey, secretKey)

  return {
    publicKey,
    secretKey
  }
}

function createToken () {
  const token = b4a.allocUnsafe(sodium.crypto_sign_BYTES)
  sodium.randombytes_buf(token)

  return token.toString('hex')
}

function sign (data, secretKey) {
  const signature = b4a.alloc(sodium.crypto_sign_BYTES)
  sodium.crypto_sign_detached(signature, b4a.from(data), b4a.from(secretKey, 'hex'))

  return signature.toString('hex')
}

function verify (signature, data, publicKey) {
  return sodium.crypto_sign_verify_detached(b4a.from(signature, 'hex'), b4a.from(data), b4a.from(publicKey, 'hex'))
}

module.exports = {
  createKeyPair,
  createToken,
  sign,
  verify
}
