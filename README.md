# slashtags-auth

## Installation

```bash
npm install @slashtags/slashauth
```

## Usage

### HTTP

#### Server side

```js
const { AuthServer } = require('@slashtags/slashauth')

// create keyPair
const keyPair = crypto.createKeyPair()

const authz = ({ publicKey, token }) => {
  // NOTE: by the moment this method will be called signature will alreayd be verified
  return {
    status: 'ok',
    token: 'Bearer 123'
  }
}

const magiclink = ({ publicKey }) => {
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
    // port - to run server on (default 8000)
    // host - to run server on (default localhost)
    // route - route for auth (default auth)
    // version - version of auth (default v0.1)
  })

  await server.start()

const slashauthURL = server.fromatURL(token)

```

#### Client side

See https://github.com/slashtags/slashauth-client

```js
const { AuthClient, crypto } = require('@slashtags/slashauth-client')

// create keyPair
const keyPair = crypto.createKeyPair()
// use authServer's publicKey for pinning
const client = new AuthClient({ keyPair, remotePublicKey })

const response = await client.authz(slashauthURL)
// { status: 'ok', token: 'Bearer 123' }

const link = await client.magiclik(slashauthURL)
// { status: 'ok', ml: 'https://www.example.com?q=foobar' }

```
