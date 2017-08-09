"use strict"

const tls = require("tls")
const net = require("net")
const constants = require("constants")

const toPull = require("stream-to-pull-stream")
const toStream = require("pull-stream-to-stream")
const Connection = require("interface-connection").Connection

const OpenSSLGenerator = require("zeronet-crypto/helper").OpenSSLGenerator

const debug = require("debug")
const log = debug("zeronet:crypto:tls")

module.exports = function TLSSupport(protocol) {

  const gen = new OpenSSLGenerator()

  let rsa_cert
  let rsa_wait = []

  gen.rsa((err, res) => {
    if (err) throw err
    rsa_cert = res
    rsa_wait.forEach(wait => rsa_crypto(wait[0], wait[1], wait[2]))
  })

  const rsa_crypto = (conn, options, cb) => {
    if (options.isServer && !rsa_cert) return rsa_wait.push([conn, options, cb])
    log(options, "tls handshake init", rsa_cert)
    let stream = toStream(conn)
    const socket = new net.Socket()
    stream.pipe(socket).pipe(stream) //same as pull(stream, socket, stream)
    const next = err => {
      if (err) return cb(err)
      cb(null, new Connection(toPull.duplex(stream)))
    }
    if (options.isServer) {
      /*stream = tls.connect({
        socket,
        isServer: true,
        key: rsa_cert.privkey,
        cert: rsa_cert.cert,
        agent: true,
        requestCert: false,
        rejectUnauthorized: false,
        ciphers: "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:AES128-GCM-SHA256:AES128-SHA256:HIGH:" +
          "!aNULL:!eNULL:!EXPORT:!DSS:!DES:!RC4:!3DES:!MD5:!PSK",
        honorCipherOrder: true,
        secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2
      }, next)*/
      /*stream = tls.connect({
        socket,
        requestCert: true,
        rejectUnauthorized: false,
        secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2
      })*/
      stream = new tls.TLSSocket(socket, {
        isServer: true,
        key: rsa_cert.privkey,
        cert: rsa_cert.cert,
        requestCert: true,
        rejectUnauthorized: false,
        ciphers: "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:AES128-GCM-SHA256:AES128-SHA256:HIGH:" +
          "!aNULL:!eNULL:!EXPORT:!DSS:!DES:!RC4:!3DES:!MD5:!PSK",
        honorCipherOrder: true,
        secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2
      })
      stream.renegotiate({
        requestCert: true
      }, next)
    } else {
      stream = new tls.TLSSocket(socket, {
        isServer: false,
        requestCert: true,
        rejectUnauthorized: false,
        secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2
      }, next)
    }
    log("tls ready", options)
    stream.on("error", console.error)
  }
  protocol.crypto.add("tls-rsa", rsa_crypto)
}
