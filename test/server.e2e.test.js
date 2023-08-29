const { test } = require('brittle')
const SlashtagsURL = require('@synonymdev/slashtags-url')

const { SlashAuthServer, SlashAuthClient } = require('../index')
const curve = require('noise-curve-ed')

const serverKeyPair = curve.generateKeyPair()
const clientKeyPair = curve.generateKeyPair()

test('e2e server - az', async t => {
  t.plan(7)

  const authz = ({ publicKey, token }) => {
    t.is(publicKey, clientKeyPair.publicKey.toString('hex'))
    t.is(token, 'testtoken')

    return {
      status: 'ok',
      token: 'Bearer 123'
    }
  }

  const magiclink = (publicKey) => {
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

  const parsed = SlashtagsURL.parse(magicLinkUrl)
  t.is(parsed.query.token, 'testtoken')
  t.is(parsed.query.relay, `http://${server.rpc.host}:${server.rpc.port}`)
  t.is(parsed.path, `/${server.rpc.version}/${server.rpc.route}`)

  const authzRes = await client.authz(magicLinkUrl)

  t.is(authzRes.status, 'ok')
  t.is(authzRes.token, 'Bearer 123')

  t.teardown(async () => {
    await server.stop()
  })
})

test('e2e server - ml', async t => {
  t.plan(6)

  const authz = ({ publicKey, token }) => {
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

  const parsed = SlashtagsURL.parse(magicLinkUrl)
  t.is(parsed.query.token, 'testtoken')
  t.is(parsed.query.relay, `http://${server.rpc.host}:${server.rpc.port}`)
  t.is(parsed.path, `/${server.rpc.version}/${server.rpc.route}`)

  const magicLinkRes = await client.magiclink(magicLinkUrl)
  t.is(magicLinkRes.status, 'ok')
  t.is(magicLinkRes.ml, 'http://localhost:8000/v0.1/users/123')

  t.teardown(async () => {
    await server.stop()
  })
})

test('e2e server - all', async t => {
  t.plan(7)

  const authz = ({ publicKey, token, signature }) => {
    t.is(publicKey, clientKeyPair.publicKey.toString('hex'))
    t.is(token, 'testtoken')

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
