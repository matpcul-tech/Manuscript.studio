import { inngest } from '../client';

// Smoke-test function. Deliberately trivial: no Anthropic, no DB, no Realtime.
// Used to confirm the Inngest event -> worker -> step pipeline is wired up
// end-to-end before we layer real generation logic on top.
export const ping = inngest.createFunction(
  {
    id: 'ping',
    name: 'Ping (smoke test)',
    retries: 0,
    triggers: [{ event: 'test/ping' }],
  },
  async ({ event, step }) => {
    await step.sleep('think', '2s');
    return {
      ok: true,
      receivedAt: new Date().toISOString(),
      payload: event.data,
    };
  }
);
