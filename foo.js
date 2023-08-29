const Noise = require('noise-handshake')
const prologue = Buffer.alloc(0) // prologue is just a well-known value.

// Server side receiving the  
const responder = new Noise('IK', false)
responder.initialise(prologue)

// Client side making request
const initiator = new Noise('IK', true)
initiator.initialise(prologue, responder.s.publicKey)

const request = { foo: 'bar' };
const encryptedRequest = initiator.send(Buffer.from(JSON.stringify(request)))

// Get the encryptedRequest from the request body, either raw or hex or base64 inside a json rpc, doesn't matter.
const decryptedRequest = JSON.parse(responder.recv(encryptedRequest).toString())
// {foo: 'bar'};

// Do something with the request

const response = { status: "ok" };
const encryptedResponse = responder.send(Buffer.from(JSON.stringify(response)))

// Client side verifying the response
const decryptedResponse = JSON.parse(initiator.recv(encryptedResponse).toString())
console.log(decryptedResponse)
// {status: "ok"}
