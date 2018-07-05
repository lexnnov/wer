'use strict'
/* eslint-disable no-console */

const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const Node = require('./libp2p-bundle')
const pull = require('pull-stream')
const async = require('async')
const Pushable = require('pull-pushable')
const p = Pushable()
let idListener

const messageBlock = document.getElementById('messageBlock')

const input = document.getElementById('zxcvb')
const send = document.getElementById('send')
const connectedPeers = document.getElementById('connectedPeers')
var peer;

async.parallel([
  (callback) => {
    PeerId.create({bits: 1024}, (err, idDialer) => {
      if (err) {
        throw err
      }
      callback(null, idDialer)
      peer = idDialer._idB58String
    })
  },
  (callback) => {
    PeerId.createFromJSON(require('./peer-id-listener'), (err, idListener) => {
      if (err) {
        throw err
      }
      callback(null, idListener)
    })
  }
], (err, ids) => {
  if (err) throw err
  const peerDialer = new PeerInfo(ids[0])
  peerDialer.multiaddrs.add('/ip4/0.0.0.0/tcp/0')
  const nodeDialer = new Node({
    peerInfo: peerDialer
  })

  const peerListener = new PeerInfo(ids[1])
  idListener = ids[1]
  peerListener.multiaddrs.add('/ip4/127.0.0.1/tcp/10333')
  nodeDialer.start((err) => {
    if (err) {
      throw err
    }

    console.log('Dialer ready, listening on:')

    peerListener.multiaddrs.forEach((ma) => {
      console.log(ma.toString() + '/ipfs/' + idListener.toB58String())
    })


      send.onclick = function() {
          p.push(input.value)
      };

      input.onkeyup = function (e) {
          e = e || window.event;
          if (e.keyCode === 13) {
              p.push(input.value)
          }
          // Отменяем действие браузера
          return false;
      }

      // nodeDialer.dialProtocol('/ip4/192.168.1.12/tcp/10333/ipfs/QmYcuVrDn76jLz62zAQDmfttX9oSFH1cGXSH9rdisbHoGP','/main-node/1.0.0', (err, conn) => {
      //     if (err) {
      //         throw err
      //     }
    nodeDialer.dialProtocol(peerListener, '/chat/1.0.0', (err, conn) => {
      if (err) {
        throw err
      }
      console.log('nodeA dialed to nodeB on protocol: /chat/1.0.0')
      console.log('Type a message and see what happens')
      // Write operation. Data sent as a buffer
        p.push("peer " + peer + " connect to you")
      pull(
        p,
        conn
      )
      // Sink, data converted from buffer to utf8 string
      pull(
        conn,
        pull.map((data) => {
            if(data.toString('utf8').search( /you/i) == 0){
                connectedPeers.innerText += data + "\n"

            }else {
                messageBlock.innerText += data + "\n"
                return data.toString('utf8').replace('\n', '')

            }

            return data.toString('utf8').replace('\n', '')

        }),
        pull.drain(console.log)


    )

      process.stdin.setEncoding('utf8')
      process.openStdin().on('data', (chunk) => {
        var data = chunk.toString()
        p.push(data)

      })


    })
  })
})