import type { IncomingMessage, ServerResponse } from 'node:http'
import type { TaskData } from '../../../utils/type'

// require, not import: package.json declares "type": "commonjs", so Node loads
// this file as CommonJS. Type-only imports above are erased and stay valid.
const { createServer } = require('node:http') as typeof import('node:http')

/**
 * Reference implementation of testing/backend/openapi.yaml.
 *
 * Exists so the API suite has a conforming target to run against. State is
 * in-memory only, so CRUD round-trips work within a single run and reset on
 * restart. Started automatically by the `webServer` hook in playwright.config.ts.
 */

const PORT = Number(process.env.PORT ?? 8080)
const USERNAME = process.env.UI_USERNAME ?? 'student'
const PASSWORD = process.env.UI_PASSWORD ?? 'Password123'

const API_PATH = '/api/v1'
const TASK_COLLECTION = `${API_PATH}/task`
const TASK_ITEM = new RegExp(`^${API_PATH}/task/([^/]+)$`)
const STATUSES = ['new', 'in progress', 'in testing', 'done']

type Task = TaskData & { id: number }

const tasks = new Map<number, Task>()
let nextId = 1

function sendJson(res: ServerResponse, status: number, payload?: unknown): void {
    const body = payload === undefined ? '' : JSON.stringify(payload)
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
    })
    res.end(body)
}

/** The spec's Error schema: `code` and `message`, both required strings. */
function sendError(res: ServerResponse, status: number, message: string): void {
    sendJson(res, status, { code: String(status), message })
}

function isAuthorised(req: IncomingMessage): boolean {
    const header = req.headers.authorization
    if (!header?.startsWith('Basic ')) {
        return false
    }
    const [user, password] = Buffer.from(header.slice(6), 'base64').toString().split(':')
    return user === USERNAME && password === PASSWORD
}

async function readBody(req: IncomingMessage): Promise<Partial<TaskData> | null> {
    const chunks: Buffer[] = []
    for await (const chunk of req) {
        chunks.push(chunk as Buffer)
    }
    if (chunks.length === 0) {
        return null
    }
    try {
        return JSON.parse(Buffer.concat(chunks).toString())
    } catch {
        return null
    }
}

/** `taskId` is `integer, minimum: 1` in the spec; anything else is a 400. */
function parseTaskId(raw: string): number | null {
    if (!/^-?\d+$/.test(raw)) {
        return null
    }
    const id = Number(raw)
    return id >= 1 ? id : null
}

function isValidPayload(body: Partial<TaskData> | null): body is TaskData {
    if (!body || typeof body.name !== 'string' || typeof body.assignee !== 'string') {
        return false
    }
    return body.status === undefined || STATUSES.includes(body.status)
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const { method = 'GET', url = '' } = req

    if (!isAuthorised(req)) {
        return sendError(res, 401, 'Unauthorized')
    }

    if (method === 'POST' && url === TASK_COLLECTION) {
        const body = await readBody(req)
        if (!isValidPayload(body)) {
            return sendError(res, 400, 'Invalid input')
        }
        const task: Task = { ...body, id: nextId++ }
        tasks.set(task.id, task)
        return sendJson(res, 200, task)
    }

    const match = url.match(TASK_ITEM)
    if (!match) {
        return sendError(res, 404, 'Not found')
    }

    const taskId = parseTaskId(match[1])
    if (taskId === null) {
        return sendError(res, 400, 'Invalid ID supplied')
    }

    const existing = tasks.get(taskId)
    if (!existing) {
        return sendError(res, 404, 'Task not found')
    }

    switch (method) {
        case 'GET':
            return sendJson(res, 200, existing)
        case 'PUT': {
            const body = await readBody(req)
            if (!isValidPayload(body)) {
                return sendError(res, 400, 'Invalid input')
            }
            const updated: Task = { ...body, id: taskId }
            tasks.set(taskId, updated)
            return sendJson(res, 200, updated)
        }
        case 'DELETE':
            tasks.delete(taskId)
            return sendJson(res, 200, { id: taskId })
        default:
            return sendError(res, 405, 'Method not allowed')
    }
}

createServer((req, res) => {
    handle(req, res).catch(() => sendError(res, 500, 'Unexpected error'))
}).listen(PORT, () => {
    console.log(`Task Management API (reference implementation) listening on :${PORT}`)
})
