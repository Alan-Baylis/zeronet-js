"use strict"

const msgstream = require("zeronet-client/lib/stream/msgpack")
const handshake = require("zeronet-protocol/lib/proto/handshake")
const util = require("util")
const Bridge = require("zeronet-client/lib/stream/bridge")
const bl = require("bl")
const clientDuplex = require("zeronet-client/lib/duplex")
const EE = require("events").EventEmitter

const pull = require('pull-stream')

const debug = require("debug")

const log = debug("zeronet:protocol:client:handshake")

const Client = require("zeronet-client")

function HandshakeClient(conn, protocol, zeronet, opt) {
  const self = this

  /* Handling */

  const handlers = self.handlers = {
    handshake: handshake(self, protocol, zeronet, opt)
  }
  let addrs
  conn.getObservedAddrs((e, a) => self.addrs = addrs = (opt.isServer ? "=> " : "<= ") + a.map(a => a.toString()).join(", "))
  log("initializing", addrs)

  function handleIn(data) {
    if (handlers[data.cmd]) handlers[data.cmd].recv(data)
    disconnect(d.end())
  }

  /* Callbacks */

  let cbs = {}

  function addCallback(id, cb) {
    cbs[id] = cb
  }

  function handleResponse(data) {
    if (cbs[data.to]) {
      cbs[data.to](data)
      delete cbs[data.to]
    }
  }

  self.req_id = 0

  self.addCallback = addCallback

  /* CMDS */

  const cmd = self.cmd = {}

  for (var name in handlers)
    cmd[name] = handlers[name].send.bind(handlers[name])

  function disconnect(e) {
    d.end()
    self.emit("end", e)
    self.write = () => {
      throw new Error("Offline")
    }
    self.cmd = {}
  }
  self.disconnect = disconnect

  /* logic */

  const s = Bridge(conn, addrs)

  let d = clientDuplex(addrs, handleIn, handleResponse, disconnect)
  self.write = d.write

  pull(
    s,
    d.u = msgstream.unpack(1),
    d,
    msgstream.pack(),
    s
  )

  /* getRaw */

  self.getRaw = cb => {
    d.u.getChunks().pipe(bl((err, data) => {
      log("appending leftover %s bytes", addrs, data.length)
      if (err) return cb(err)
      cb(null, s.restore([data]))
    }))
  }

  /* upgrade */

  function warnNoCrypto() {
    if (zeronet.zeronet) { //why did we call common "zeronet"???
      let i = {
        address: addrs.split(" ")[1],
        direction: addrs.split(" ")[0] == "=>" ? "to" : "from"
      }
      zeronet.logger("protocol:handshake").warn(i, "No crypto used in connection %s %s", i.direction, i.address)
    }
  }

  self.upgrade = cb => {
    (opt.isServer ? self.waitForHandshake : self.handshake)((err, handshake, opt) => {
      if (err) return cb(err)
      conn.getObservedAddrs((aderr, addr) => {
        conn.getPeerInfo((pierr, pi) => {
          const next = conn => {
            conn.getObservedAddrs = cb => cb(aderr, addr)
            conn.getPeerInfo = cb => cb(pierr, pi)
            cb(null, new Client(conn, protocol, zeronet, {
              isServer: opt.isServer,
              handshake: self.handshakeData,
              crypto: protocol.crypto && handshake.commonCrypto() ? handshake.commonCrypto() : false
            }))
          }
          if (protocol.crypto && handshake.commonCrypto()) {
            protocol.crypto.wrap(handshake.commonCrypto(), self, opt, (err, conn) => {
              if (err) return cb(err)
              else next(conn)
            })
          } else {
            warnNoCrypto()
            self.getRaw((err, conn) => err ? cb(err) : next(conn))
          }
        })
      })
    })
  }

}

util.inherits(HandshakeClient, EE)

module.exports = HandshakeClient
