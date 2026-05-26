/**
 * WebSocket proxy wrapper for ComfyUI
 *
 * Monkey-patches http.createServer so we can intercept the `upgrade`
 * event before Next.js's standalone server.js runs.
 *
 * /ws  →  ws://127.0.0.1:8188/ws   (ComfyUI real-time progress)
 *
 * All other traffic is handled by Next.js as normal.
 */

import http from 'http'
import { WebSocket, WebSocketServer } from 'ws'

const wss = new WebSocketServer({ noServer: true })

wss.on('connection', (clientWs, req) => {
  const url = new URL(req.url, 'http://x')
  const target = `ws://127.0.0.1:8188/ws${url.search || ''}`

  const comfyWs = new WebSocket(target)

  comfyWs.on('message', (data, isBinary) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data, { binary: isBinary })
    }
  })

  clientWs.on('message', (data, isBinary) => {
    if (comfyWs.readyState === WebSocket.OPEN) {
      comfyWs.send(data, { binary: isBinary })
    }
  })

  comfyWs.on('close', (code, reason) => clientWs.close(code, reason))
  clientWs.on('close', (code, reason) => {
    if (comfyWs.readyState === WebSocket.OPEN) comfyWs.close(code, reason)
  })
  comfyWs.on('error', (err) => {
    console.error('[ws-proxy] ComfyUI WS error:', err.message)
    clientWs.close(1011, 'ComfyUI unreachable')
  })
  clientWs.on('error', (err) => {
    console.error('[ws-proxy] Client WS error:', err.message)
    comfyWs.close()
  })
})

// ─── Patch http.createServer to intercept WS upgrades ─────────────────────────
const _createServer = http.createServer.bind(http)

http.createServer = function (...args) {
  const server = _createServer(...args)

  server.on('upgrade', (req, socket, head) => {
    const pathname = new URL(req.url, 'http://x').pathname

    if (pathname === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
    } else {
      // Not a ComfyUI WS path — close gracefully
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
      socket.destroy()
    }
  })

  return server
}

// ─── Load Next.js standalone server (uses patched http.createServer) ──────────
await import('./apps/web/server.js')
