/**
 * ComfyUI SSH Tunnel Manager
 *
 * Manages a gcloud compute ssh port-forwarding process that tunnels
 * localhost:8188 → VM:8188. The tunnel is started lazily on first
 * proxy request and kept alive until the process exits.
 */

import { spawn, type ChildProcess } from 'child_process'
import { createConnection } from 'net'

const LOCAL_PORT = 8188
const TUNNEL_READY_TIMEOUT_MS = 15_000

type TunnelState = 'idle' | 'starting' | 'ready' | 'error'

let tunnelProcess: ChildProcess | null = null
let tunnelState: TunnelState = 'idle'
let readyPromise: Promise<void> | null = null

function getGCPConfig() {
  return {
    project: process.env['GCP_PROJECT'] ?? 'mktia-ai-studio',
    zone: process.env['GCP_ZONE'] ?? 'us-central1-f',
    instance: process.env['GCP_INSTANCE_NAME'] ?? 'ai-studio-vm',
  }
}

/** Check if the local port is accepting connections */
function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' }, () => {
      socket.destroy()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
    socket.setTimeout(500, () => {
      socket.destroy()
      resolve(false)
    })
  })
}

/** Wait until the local port is open, with timeout */
async function waitForPort(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) return true
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

/** Start the gcloud SSH tunnel */
function startTunnel(): Promise<void> {
  if (readyPromise) return readyPromise

  readyPromise = new Promise(async (resolve, reject) => {
    tunnelState = 'starting'

    // Check if port is already open (another process tunneling)
    if (await isPortOpen(LOCAL_PORT)) {
      tunnelState = 'ready'
      resolve()
      return
    }

    const { project, zone, instance } = getGCPConfig()

    if (!instance) {
      tunnelState = 'error'
      readyPromise = null
      reject(new Error('GCP_INSTANCE_NAME not configured'))
      return
    }

    console.log(`[tunnel] Starting SSH tunnel → ${instance} port ${LOCAL_PORT}`)

    tunnelProcess = spawn(
      'gcloud',
      [
        'compute', 'ssh', instance,
        `--project=${project}`,
        `--zone=${zone}`,
        '--',
        `-L`, `${LOCAL_PORT}:localhost:${LOCAL_PORT}`,
        `-N`,   // don't execute commands, just forward
        `-o`, `StrictHostKeyChecking=no`,
        `-o`, `ExitOnForwardFailure=yes`,
        `-o`, `ServerAliveInterval=30`,
        `-o`, `ServerAliveCountMax=3`,
      ],
      { stdio: 'pipe', detached: false },
    )

    tunnelProcess.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim()
      if (msg) console.log(`[tunnel] ${msg}`)
    })

    tunnelProcess.on('exit', (code) => {
      console.log(`[tunnel] Process exited (code ${code})`)
      tunnelProcess = null
      tunnelState = 'idle'
      readyPromise = null
    })

    tunnelProcess.on('error', (err) => {
      console.error(`[tunnel] Failed to start: ${err.message}`)
      tunnelState = 'error'
      readyPromise = null
      reject(err)
    })

    // Wait for port to become available
    const ready = await waitForPort(LOCAL_PORT, TUNNEL_READY_TIMEOUT_MS)
    if (ready) {
      tunnelState = 'ready'
      console.log(`[tunnel] Ready on localhost:${LOCAL_PORT}`)
      resolve()
    } else {
      tunnelProcess?.kill()
      tunnelState = 'error'
      readyPromise = null
      reject(new Error(`Tunnel timeout — ComfyUI not responding on port ${LOCAL_PORT}`))
    }
  })

  return readyPromise
}

/** Ensure tunnel is up, starting it if necessary */
export async function ensureTunnel(): Promise<void> {
  if (tunnelState === 'ready' && await isPortOpen(LOCAL_PORT)) return
  if (tunnelState === 'starting' && readyPromise) return readyPromise
  // Reset stale state
  readyPromise = null
  tunnelState = 'idle'
  return startTunnel()
}

/** Stop the tunnel */
export function stopTunnel(): void {
  if (tunnelProcess) {
    tunnelProcess.kill()
    tunnelProcess = null
  }
  tunnelState = 'idle'
  readyPromise = null
}

export function getTunnelState(): TunnelState {
  return tunnelState
}
