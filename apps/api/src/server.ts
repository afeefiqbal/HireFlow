import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or local directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { createApp } from './app';

const PORT = process.env.PORT || 4000;
const app = createApp();

import { AiService } from './ai/ai.service';
import { GroqProvider } from './ai/providers/groq.provider';

AiService.registerProvider(new GroqProvider());

const server = app.listen(PORT, () => {
  console.log(`
🚀 AI JOB AGENT API is running!
📡 Listening on: http://localhost:${PORT}
🩺 Health endpoint: http://localhost:${PORT}/health
📊 REST API: http://localhost:${PORT}/api/dashboard/stats
👤 Profile: Afeef Iqbal (Single Source of Truth)
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});
