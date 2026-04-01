import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRoutes } from './routes/api.js';
import { tickDashboard } from './lib/store.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const app = Fastify({ logger: false });
await app.register(cors, { origin: true });
await app.register(fastifyStatic, {
    root: publicDir,
    prefix: '/'
});
await app.register(apiRoutes);
app.get('/api/stream', async (request, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders?.();
    const send = () => {
        const snapshot = tickDashboard();
        reply.raw.write(`data: ${JSON.stringify(snapshot)}\n\n`);
    };
    send();
    const interval = setInterval(send, 3500);
    request.raw.on('close', () => {
        clearInterval(interval);
        reply.raw.end();
    });
    return reply;
});
app.setNotFoundHandler((request, reply) => {
    if (request.raw.url?.startsWith('/api/')) {
        reply.code(404).send({ message: 'Not found' });
        return;
    }
    reply.sendFile('index.html');
});
const port = Number(process.env.PORT ?? 4180);
const host = process.env.HOST ?? '0.0.0.0';
app.listen({ port, host }).catch((error) => {
    app.log.error(error);
    process.exit(1);
});
