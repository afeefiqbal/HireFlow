"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from root or local directory
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
const app_1 = require("./app");
const PORT = process.env.PORT || 4000;
const app = (0, app_1.createApp)();
const ai_service_1 = require("./ai/ai.service");
const groq_provider_1 = require("./ai/providers/groq.provider");
ai_service_1.AiService.registerProvider(new groq_provider_1.GroqProvider());
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
