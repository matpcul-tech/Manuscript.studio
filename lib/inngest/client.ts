import { Inngest } from 'inngest';

// Single shared Inngest client. In production it auto-reads INNGEST_EVENT_KEY
// and INNGEST_SIGNING_KEY from env. In local dev it talks to the Inngest dev
// server on localhost:8288 when INNGEST_DEV is unset or '1'.
export const inngest = new Inngest({
  id: 'manuscript-studio',
  name: 'Manuscript Studio',
});
