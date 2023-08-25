const { test } = require('brittle')

const { SlashAuthServer, crypto } = require('../index')

const { SlashAuthClient } = require("@slashtags/slashauth-client")

const serverKeyPair = crypto.createKeyPair()
const clientKeyPair = crypto.createKeyPair()

test('e2e server', async t => {
  t.plan(8)

  const authz = ({ publicKey, token, signature }) => {
    t.is(publicKey, clientKeyPair.publicKey.toString('hex'))
    t.is(token, 'testtoken')
    t.ok(signature)

    return {
      status: 'ok',
      token: 'Bearer 123'
    }
  }

  const magiclink = (publicKey) => {
    t.is(publicKey, clientKeyPair.publicKey.toString('hex'))

    return {
      status: 'ok',
      ml: 'http://localhost:8000/v0.1/users/123'
    }
  }

  const server = new SlashAuthServer({
    authz,
    magiclink,
    keypair: serverKeyPair
  })

  await server.start()

  const client = new SlashAuthClient({
    keypair: clientKeyPair,
    serverPublicKey: serverKeyPair.publicKey
  })

  const magicLinkUrl = server.formatUrl('testtoken')
  const authzRes = await client.authz(magicLinkUrl)

  t.is(authzRes.status, 'ok')
  t.is(authzRes.token, 'Bearer 123')

  const magicLinkRes = await client.magiclink(magicLinkUrl)
  t.is(magicLinkRes.status, 'ok')
  t.is(magicLinkRes.ml, 'http://localhost:8000/v0.1/users/123')

  t.teardown(async () => {
    await server.stop()
  })
})
