"use strict"

const pack = require("zeronet-protocol/lib/proto/pack")
const debug = require("debug")
const log = debug("zeronet:protocol:defaults")

module.exports = function Defaults(protocol, zeronet) {
  protocol.handle("getFile", {
    site: "string",
    inner_path: "string",
    location: "number"
  }, {
    body: Buffer.isBuffer,
    location: "number",
    size: "number"
  }, (data, cb) => {
    if (!zeronet.zites[data.site]) return cb(new Error("Unknown site"))
    cb("Hello. This ZeroNetJS client does not have this function implented yet. Please kindly ignore this peer.")
    //TODO: finish
  })

  protocol.handle("ping", {}, {
    body: b => b == "pong"
  }, (data, cb) => {
    cb(null, {
      body: "pong"
    })
  })

  protocol.handle("pex", {
    site: "string",
    peers: Array.isArray,
    peers_onion: d => !d || Array.isArray(d),
    need: "number"
  }, {
    peers: Array.isArray
  }, (data, cb) => {
    if (data.peers) { //parse peers. ignore len!=6, but i think it's an encoding error instead
      let unpack = data.peers.map(p => {
        try {
          return pack.v4.unpack(p)
        } catch (e) {
          return
        }
      }).filter(v => !!v)
      log("got peers for", data.site, unpack.join(", ") || "<none>")
      zeronet.peerPool.addMany(unpack, data.site)
    }
    cb("Hello. This ZeroNetJS client does not have this function implented yet. Please kindly ignore this peer.")
    //TODO: parse onion peers
  })

  protocol.handle("update", {
    site: "string",
    inner_path: "string",
    body: "string"
  }, {
    ok: "string"
  }, (data, cb) => {
    if (!zeronet.zites[data.site]) return cb(new Error("Unknown site"))
    cb("Hello. This ZeroNetJS client does not have this function implented yet. Please kindly ignore this peer.")
    //TODO: finish
  })

  protocol.handle("listModified", {
    site: "string",
    since: "number"
  }, {
    modified_files: "object"
  }, (data, cb) => {
    if (!zeronet.zites[data.site]) return cb(new Error("Unknown site"))
    cb("Hello. This ZeroNetJS client does not have this function implented yet. Please kindly ignore this peer.")
    //TODO: finish
  })

  protocol.handle("getHashfield", {
    site: "string"
  }, {
    hashfiled_raw: "object"
  }, (data, cb) => {
    if (!zeronet.zites[data.site]) return cb(new Error("Unknown site"))
    cb("Hello. This ZeroNetJS client does not have this function implented yet. Please kindly ignore this peer.")
    //TODO: finish
  })

  protocol.handle("setHashfield", {
    site: "string",
    hashfield_raw: "object"
  }, {
    ok: "object"
  }, (data, cb) => {
    if (!zeronet.zites[data.site]) return cb(new Error("Unknown site"))
    cb("Hello. This ZeroNetJS client does not have this function implented yet. Please kindly ignore this peer.")
    //TODO: finish
  })

  protocol.handle("findHashIds", {
    site: "string",
    hash_ids: Array.isArray //with numbers
  }, {
    peers: "object",
    peers_onion: "object"
  }, (data, cb) => {
    if (!zeronet.zites[data.site]) return cb(new Error("Unknown site"))
    cb("Hello. This ZeroNetJS client does not have this function implented yet. Please kindly ignore this peer.")
    //TODO: finish
  })
}
