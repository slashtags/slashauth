const http = require('node:http')

const { test } = require('brittle')

const HttpAuthServer = require('../src/httpServer')
const HttpAuthClient = require('../src/httpClient')

const clientKeyPair = {
  publicKey: Buffer.from('681053c886e7d22700d5ecce520edf513db84de57b5d803376c3b6e7c71f6617', 'hex'),
  secretKey: Buffer.from('b09a030b1659c84f97661ad42d509593def1ec4ea880d0dc6f2067f3ec18e658681053c886e7d22700d5ecce520edf513db84de57b5d803376c3b6e7c71f6617', 'hex')
}

const serverKeyPair = {
  publicKey: Buffer.from('4bbeef6a3fb07b2665ac3448f8daa035df76172c34b83cac00ac2ac1021cfdb8', 'hex'),
  secretKey: Buffer.from('7c2445a5b7d7d8fe0c541f0db0c52532911c7c4f50ede102591bec45f80b9fbe4bbeef6a3fb07b2665ac3448f8daa035df76172c34b83cac00ac2ac1021cfdb8', 'hex')
}

test.skip('e2e - http', async t => {
  t.plan(8)

  const webServer = http.createServer((req, res) => {
    if (req.url === '/test') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('okay')
      t.ok(true)
    }
  })

  const authServer = new HttpAuthServer(webServer, {
    onAuthz: (data, publicKey) => {
      t.alike(data, 'hello')
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
  },
  { keyPair: serverKeyPair },
  'http://localhost:8000/auth'
  )

  const link = authServer.formatURL('hello')
  t.is(link, 'http://localhost:8000/auth?token=hello')

  webServer.listen(8000, 'localhost', async () => {
    const authClient = new HttpAuthClient({
      keyPair: clientKeyPair,
      remotePublicKey: serverKeyPair.publicKey
    })

    const authzRes = await authClient.authz('http://localhost:8000/auth?token=hello')
    t.alike(authzRes, {
      status: 'ok',
      message: null,
      resources: ['foo', 'bar']
    })

    const magicLinkRes = await authClient.magiclink('http://localhost:8000/auth')
    t.alike(magicLinkRes, {
      url: 'https://example.com',
      validUntil: 1000
    })

    const req = http.get('http://localhost:8000/test', (res) => {
      t.is(res.statusCode, 200)
    })
  })

  t.teardown(() => {
    authServer.close()
    webServer.close()
  })
})
