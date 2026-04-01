const initialState = {
    headline: 'PulseRoom Command Center',
    subheadline: 'A live operations cockpit for launches, campaigns, or AI-assisted workflow monitoring.',
    metrics: [
        { id: 'reach', label: 'Live Reach', value: '128.4K', delta: '+12.8%', trend: 'up' },
        { id: 'automation', label: 'Automation Score', value: '92%', delta: '+4 pts', trend: 'up' },
        { id: 'latency', label: 'Response Latency', value: '184ms', delta: '-26ms', trend: 'up' },
        { id: 'tickets', label: 'Priority Queue', value: '07', delta: '-3', trend: 'up' }
    ],
    panels: [
        {
            id: 'panel-1',
            name: 'Launch Pulse',
            status: 'healthy',
            summary: 'Campaign surfaces are stable and trending above forecast.',
            progress: 82
        },
        {
            id: 'panel-2',
            name: 'AI Concierge',
            status: 'watching',
            summary: 'Agent suggestions are active. Review rate is slightly elevated.',
            progress: 64
        },
        {
            id: 'panel-3',
            name: 'Signal Capture',
            status: 'critical',
            summary: 'Two ingestion sources need operator attention.',
            progress: 38
        }
    ],
    activity: [
        {
            id: crypto.randomUUID(),
            time: new Date().toLocaleTimeString(),
            title: 'Launch feed synchronized',
            detail: 'Realtime channel is healthy across all active viewers.',
            level: 'low'
        },
        {
            id: crypto.randomUUID(),
            time: new Date().toLocaleTimeString(),
            title: 'AI draft escalated for review',
            detail: 'One response exceeded confidence guardrail and was routed to manual review.',
            level: 'medium'
        },
        {
            id: crypto.randomUUID(),
            time: new Date().toLocaleTimeString(),
            title: 'Signal capture source degraded',
            detail: 'Webhook delivery from one upstream endpoint is intermittently delayed.',
            level: 'high'
        }
    ],
    insights: [
        {
            id: 'insight-1',
            title: 'Best-performing motion surface',
            body: 'The interactive hero and live feed card are driving the highest dwell time in this demo.'
        },
        {
            id: 'insight-2',
            title: 'Why this project works for a portfolio',
            body: 'It shows real-time backend delivery, TypeScript route design, and a visually rich JavaScript UI.'
        }
    ],
    sparkline: [42, 48, 44, 53, 57, 62, 59, 66, 71, 68, 74, 81]
};
let dashboardState = structuredClone(initialState);
const activityPool = [
    {
        title: 'Operator command acknowledged',
        detail: 'A front-end action triggered a backend command log entry.',
        level: 'low'
    },
    {
        title: 'Engagement spike detected',
        detail: 'Live dashboard traffic rose faster than the trailing baseline.',
        level: 'medium'
    },
    {
        title: 'Latency guardrail recovered',
        detail: 'Response times returned to a healthy range after a brief spike.',
        level: 'low'
    },
    {
        title: 'Review queue warming',
        detail: 'A batch of AI-assisted actions is waiting for human confirmation.',
        level: 'medium'
    },
    {
        title: 'Ingress source requires retry',
        detail: 'One upstream system missed its last heartbeat and needs attention.',
        level: 'high'
    }
];
function randomFrom(items) {
    return items[Math.floor(Math.random() * items.length)];
}
function mutateMetric(value, trend) {
    if (value.endsWith('K')) {
        const base = Number.parseFloat(value.replace('K', ''));
        const swing = (Math.random() * 4 - 1.2) * (trend === 'up' ? 1 : trend === 'down' ? -1 : 0.4);
        return `${Math.max(12, base + swing).toFixed(1)}K`;
    }
    if (value.endsWith('%')) {
        const base = Number.parseFloat(value.replace('%', ''));
        const swing = Math.random() * 3 - 1;
        return `${Math.max(50, Math.min(99, base + swing)).toFixed(0)}%`;
    }
    if (value.endsWith('ms')) {
        const base = Number.parseFloat(value.replace('ms', ''));
        const swing = Math.random() * 22 - 10;
        return `${Math.max(90, base + swing).toFixed(0)}ms`;
    }
    const base = Number.parseFloat(value);
    const swing = Math.random() > 0.5 ? 1 : -1;
    return `${Math.max(0, base + swing).toFixed(0).padStart(2, '0')}`;
}
function statusForProgress(progress) {
    if (progress >= 70)
        return 'healthy';
    if (progress >= 45)
        return 'watching';
    return 'critical';
}
export function getDashboardState() {
    return structuredClone(dashboardState);
}
export function tickDashboard() {
    dashboardState.metrics = dashboardState.metrics.map((metric) => ({
        ...metric,
        value: mutateMetric(metric.value, metric.trend)
    }));
    dashboardState.panels = dashboardState.panels.map((panel) => {
        const nextProgress = Math.max(18, Math.min(96, panel.progress + Math.floor(Math.random() * 15) - 6));
        return {
            ...panel,
            progress: nextProgress,
            status: statusForProgress(nextProgress)
        };
    });
    const incoming = randomFrom(activityPool);
    dashboardState.activity = [
        {
            id: crypto.randomUUID(),
            time: new Date().toLocaleTimeString(),
            ...incoming
        },
        ...dashboardState.activity
    ].slice(0, 8);
    const nextSpark = Math.max(20, Math.min(96, dashboardState.sparkline.at(-1) + Math.floor(Math.random() * 16) - 7));
    dashboardState.sparkline = [...dashboardState.sparkline.slice(1), nextSpark];
    return getDashboardState();
}
export function logCommand(payload) {
    const item = {
        id: crypto.randomUUID(),
        time: new Date().toLocaleTimeString(),
        title: `Command executed: ${payload.label}`,
        detail: `Target ${payload.target} accepted the command and added it to the audit stream.`,
        level: 'low'
    };
    dashboardState.activity = [item, ...dashboardState.activity].slice(0, 8);
    return item;
}
