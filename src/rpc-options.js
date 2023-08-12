const c = require('compact-encoding')
const cstruct = require('compact-encoding-struct')

const authzOptions = {
  responseEncoding: cstruct.compile({
    status: c.string,
    message: cstruct.opt(c.string),
    resources: cstruct.opt(cstruct.array(c.string))
  }),
  requestEncoding: c.string
}

const magiclinkOptions = {
  responseEncoding: cstruct.compile({
    url: c.string,
    validUntil: c.uint
  }),
  requestEncoding: c.null
}

module.exports = {
  authzOptions,
  magiclinkOptions
}

/**
 * @typedef {
 *  | {status: "ok", resources: string[]}
 *  | {status: "error", message: string}
 * } IAuthZResponse
 *
 * @typedef {{url: string, validUntil: number}} IMagicLinkResponse
 */
