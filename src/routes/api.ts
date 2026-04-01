import type { FastifyInstance } from 'fastify';
import { getDashboardState, logCommand } from '../lib/store.js';

export async function apiRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async () => ({ status: 'ok', service: 'PulseRoom Command Center API' }));

  app.get('/api/dashboard', async () => getDashboardState());

  app.post(
    '/api/commands',
    {
      schema: {
        body: {
          type: 'object',
          required: ['label', 'target'],
          properties: {
            label: { type: 'string', minLength: 2, maxLength: 40 },
            target: { type: 'string', minLength: 2, maxLength: 40 }
          }
        }
      }
    },
    async (request, reply) => {
      const body = request.body as { label: string; target: string };
      const activity = logCommand(body);
      reply.code(201);
      return { success: true, activity };
    }
  );
}
