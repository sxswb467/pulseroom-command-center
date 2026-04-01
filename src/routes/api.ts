import type { FastifyInstance } from 'fastify';
import {
  type DashboardPreferences,
  getDashboardPreferences,
  getDashboardState,
  logCommand,
  setDashboardPreferences
} from '../lib/store.js';

function getClientId(headers: Record<string, unknown>): string {
  const header = headers['x-client-id'];
  return typeof header === 'string' && header.length >= 8 ? header : 'anonymous-client';
}

export async function apiRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async () => ({ status: 'ok', service: 'PulseRoom Command Center API' }));

  app.get('/api/dashboard', async () => getDashboardState());

  app.get('/api/preferences', async (request) => {
    const clientId = getClientId(request.headers as Record<string, unknown>);
    return getDashboardPreferences(clientId);
  });

  app.put(
    '/api/preferences',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            panel: { type: 'string', enum: ['all', 'healthy', 'watching', 'critical'] },
            activity: { type: 'string', enum: ['all', 'low', 'medium', 'high'] },
            range: { type: 'string', enum: ['6', '12', '24'] }
          }
        }
      }
    },
    async (request) => {
      const clientId = getClientId(request.headers as Record<string, unknown>);
      const body = (request.body ?? {}) as Partial<DashboardPreferences>;
      return setDashboardPreferences(clientId, body);
    }
  );

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
