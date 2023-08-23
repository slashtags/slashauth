# slashtags-auth

## Installation

```bash
npm install @slashtags/slashauth
```

## Usage

### HTTP

#### Server side

```js
const { AuthServer, crypto } = require('@slashtags/slashauth')

// create keyPair
const keyPair = crypto.createKeyPair()

const authz = ({ publicKey, token, signature }) => {
  // NOTE: by the moment this method will be called signature will alreayd be verified
  return {
    status: 'ok',
    token: 'Bearer 123'
  }
}

const magiclink = (publicKey) => {
  // NOTE: by the moment this method will be called signature will alreayd be verified
  return {
    status: 'ok',
    ml: 'http://localhost:8000/v0.1/users/123'
  }
}

  const server = new SlashAuthServer({
    authz,
    magiclink,
    keypair
    // sv - object with sign(data, secretKey) and verify(signature, data, publicKey) methods
    // storage - storage for <pK>: <nonce> pairs with methods (default Map)
    //    - async set(publicKey, token)
    //    - async get(publicKey)
    //    - async delete(publicKey)
    // port - to run server on (default 8000)
    // host - to run server on (default localhost)
    // route - route for auth (default auth)
    // version - version of auth (default v0.1)
  })

  await server.start()

const slashauthURL = server.fromatURL(token)

```

#### Client side

```js
const { AuthClient, crypto } = require('@slashtags/slashauth')

// create keyPair
const keyPair = crypto.createKeyPair()
// use authServer's publicKey for pinning
const client = new HttpAuthClient({ keyPair, remotePublicKey })

const response = await client.authz(slashauthURL)
// { status: 'ok', token: 'Bearer 123' }

const link = await client.magiclik(slashauthURL)
// { status: 'ok', ml: 'https://www.example.com?q=foobar' }

```
