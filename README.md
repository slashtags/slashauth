# slashtags-auth

P2P authorization and bidirectional authentication via [secret stream](https://github.com/holepunchto/hyperswarm-secret-stream) and [ProtomuxRPC](https://github.com/holepunchto/protomux-rpc).

## Installation

```bash
npm install @slashtags/slashauth
```

## Usage

### Server side

```js
const { AuthServer, keyPair } = require('@slashtags/slashauth')

// create net.Socket
// create keyPair

const server = new AuthServer(socket, {
    onauthz: (token, remote) => {
      // Check that token is valid, and remote isn't blocked
      return { status: 'ok', resources: [] }
    },
    onmagiclink: (remote) => {
        return 'https://www.example.com?q=foobar'
    },
    { keyPair }
})
```

### Client side

```js
const { AuthClient, keyPair } = require('@slashtags/slashauth')

// create net.Socket to auth url
// create keyPair
// use authServer's publicKey for pinning

const client = new AuthClient(socket, { keyPair, remotePublicKey })

const response = await client.authz('<token>')
// { status: "ok", resources: ['*'] }

const link = await client.magiclik()

```
