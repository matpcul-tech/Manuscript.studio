import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { ping } from '@/lib/inngest/functions/ping';

// Single endpoint Inngest calls back into. Each registered function shows up
// in the Inngest dashboard after the first successful sync. New functions get
// added to the array below as we build them out (chapter draft, back matter,
// description, export, etc).
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [ping],
});
