const net = require('node:net')

const { test } = require('brittle')

const AuthServer = require('../src/netServer')
const AuthClient = require('../src/netClient')

const clientKeyPair = {
  publicKey: Buffer.from('681053c886e7d22700d5ecce520edf513db84de57b5d803376c3b6e7c71f6617', 'hex'),
  secretKey: Buffer.from('b09a030b1659c84f97661ad42d509593def1ec4ea880d0dc6f2067f3ec18e658681053c886e7d22700d5ecce520edf513db84de57b5d803376c3b6e7c71f6617', 'hex')
}

const serverKeyPair = {
  publicKey: Buffer.from('4bbeef6a3fb07b2665ac3448f8daa035df76172c34b83cac00ac2ac1021cfdb8', 'hex'),
  secretKey: Buffer.from('7c2445a5b7d7d8fe0c541f0db0c52532911c7c4f50ede102591bec45f80b9fbe4bbeef6a3fb07b2665ac3448f8daa035df76172c34b83cac00ac2ac1021cfdb8', 'hex')
}

test('AuthClient erorr handling', async t => {
  let socket

  t.exception(() => new AuthClient(), 'No socket provided')

  socket = new net.Socket()
  t.exception(() => new AuthClient(socket), 'No options provided')
  t.ok(socket.destroyed)

  socket = new net.Socket()
  t.exception(() => new AuthClient(socket, {}), 'No key pair provided')
  t.ok(socket.destroyed)

  socket = new net.Socket()
  t.exception(() => new AuthClient(socket, { keyPair: clientKeyPair }), 'No server public key provided')
  t.ok(socket.destroyed)

  socket = new net.Socket()
  t.execution(() => new AuthClient(socket, { keyPair: clientKeyPair, remotePublicKey: serverKeyPair.publicKey }))
  t.is(socket.destroyed, false)

  t.teardown(() => {
    socket.destroy()
  })
})
test('AuthServer erorr handling', async t => {
  let socket

  t.exception(() => new AuthServer(), 'No socket provided')

  socket = new net.Socket()
  t.exception(() => new AuthServer(socket), 'No handlers provided')
  t.ok(socket.destroyed)

  socket = new net.Socket()
  t.exception(() => new AuthServer(socket, {}), 'No handler methods provided')
  t.ok(socket.destroyed)

  socket = new net.Socket()
  t.exception(() => new AuthServer(
    socket,
    { onAuthz: () => {}, onMagicLink: () => {} }
  ), 'No options provided')
  t.ok(socket.destroyed)

  socket = new net.Socket()
  t.exception(() => new AuthServer(
    socket,
    { onAuthz: () => {}, onMagicLink: () => {} },
    {}
  ), 'No key pair provided')
  t.ok(socket.destroyed)

  socket = new net.Socket()
  const authServer = new AuthServer(
    socket,
    { onAuthz: () => {}, onMagicLink: () => {} },
    { keyPair: serverKeyPair }
  )
  t.is(socket.destroyed, false)
  authServer.close()

  socket = new net.Socket()
  const authServerOpted = new AuthServer(
    socket,
    { onAuthz: () => {}, onMagicLink: () => {} },
    {
      keyPair: serverKeyPair,
      timeout: 1000,
      keepAlive: 100
    }
  )

  t.teardown(() => {
    authServer.close()
    authServerOpted.close()
  })
})

test('e2e - socket', async t => {
  t.plan(5)

  let authServer
  const netServer = net.createServer((socket) => {
    authServer = new AuthServer(socket, {
      onAuthz: (data, publicKey) => {
        t.is(data, 'hello')
        t.is(publicKey.toString('hex'), clientKeyPair.publicKey.toString('hex'))

        return {
          status: 'ok',
          resources: ['foo', 'bar']
        }
      },
      onMagicLink: (publicKey) => {
        t.is(publicKey.toString('hex'), clientKeyPair.publicKey.toString('hex'))

        return {
          url: 'https://example.com',
          validUntil: 1000
        }
      }
    }, { keyPair: serverKeyPair })
  })

  netServer.listen(3000, 'localhost', async () => {
    const socket = net.createConnection({ host: 'localhost', port: 3000 })

    const authClient = new AuthClient(socket, {
      keyPair: clientKeyPair,
      remotePublicKey: serverKeyPair.publicKey
    })

    const authzRes = await authClient.authz('hello')
    t.alike(authzRes, {
      status: 'ok',
      message: null,
      resources: ['foo', 'bar']
    })

    const magicLinkRes = await authClient.magiclink()
    t.alike(magicLinkRes, {
      url: 'https://example.com',
      validUntil: 1000
    })
  })

  t.teardown(() => {
    authServer.close()
    netServer.close()
  })
})
