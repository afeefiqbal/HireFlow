"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
class AiService {
    static provider = null;
    static enabled = process.env.GROQ_ENABLED !== 'false';
    static registerProvider(provider) {
        this.provider = provider;
        try {
            if (this.enabled) {
                this.provider.init();
            }
        }
        catch (err) {
            console.warn('[AiService] Failed to init provider:', err);
            this.enabled = false;
        }
    }
    static isEnabled() {
        return this.enabled && this.provider !== null;
    }
    static generateCacheKey(operation, data) {
        const hash = crypto_1.default.createHash('sha256').update(JSON.stringify(data)).digest('hex');
        return `${operation}:${hash}`;
    }
    static async checkCache(cacheKey) {
        const cached = await prisma.aiCache.findUnique({ where: { cacheKey } });
        return cached ? cached.responseJson : null;
    }
    static async saveCache(cacheKey, responseJson) {
        await prisma.aiCache.upsert({
            where: { cacheKey },
            create: { cacheKey, responseJson },
            update: { responseJson },
        });
    }
    static async trackUsage(operation, jobId, inputStr, outputStr, latencyMs, status, error) {
        if (!this.provider)
            return;
        // Very rough token estimation (4 chars ~= 1 token)
        const inputTokens = Math.ceil(inputStr.length / 4);
        const outputTokens = Math.ceil(outputStr.length / 4);
        try {
            await prisma.aiUsage.create({
                data: {
                    provider: this.provider.getName(),
                    model: process.env.GROQ_SMART_MODEL || 'unknown',
                    operation,
                    jobId,
                    inputTokens,
                    outputTokens,
                    latencyMs,
                    status,
                    error
                }
            });
        }
        catch (e) {
            console.error('[AiService] Failed to track usage', e);
        }
    }
    static async executeWithCacheAndTracking(operation, jobId, cachePayload, fn, forceRefresh = false) {
        if (!this.isEnabled() || !this.provider) {
            throw new Error('AI Provider is not configured or enabled.');
        }
        const cacheKey = this.generateCacheKey(operation, cachePayload);
        if (!forceRefresh) {
            const cached = await this.checkCache(cacheKey);
            if (cached) {
                console.log(`[AiService] Cache hit for ${operation}`);
                return cached;
            }
        }
        const start = Date.now();
        try {
            const result = await fn();
            const latency = Date.now() - start;
            // Save cache & track success
            await this.saveCache(cacheKey, result);
            await this.trackUsage(operation, jobId, JSON.stringify(cachePayload), JSON.stringify(result), latency, 'SUCCESS');
            return result;
        }
        catch (err) {
            const latency = Date.now() - start;
            const isRateLimit = err.message?.toLowerCase().includes('rate') || err.status === 429;
            await this.trackUsage(operation, jobId, JSON.stringify(cachePayload), '', latency, isRateLimit ? 'RATE_LIMIT' : 'ERROR', err.message);
            throw err;
        }
    }
    // ==========================================
    // Public Interface methods
    // ==========================================
    static async analyzeJob(jobId, jobDescription, candidateProfile, forceRefresh = false) {
        return this.executeWithCacheAndTracking('analyzeJob', jobId, { jobDescription, profileId: candidateProfile.id }, () => this.provider.analyzeJob(jobDescription, candidateProfile), forceRefresh);
    }
    static async generateResume(jobId, jobDescription, candidateProfile, forceRefresh = false) {
        return this.executeWithCacheAndTracking('generateResume', jobId, { jobDescription, profileId: candidateProfile.id }, () => this.provider.generateResume(jobDescription, candidateProfile), forceRefresh);
    }
    static async generateCoverLetter(jobId, jobDescription, companyName, candidateProfile, forceRefresh = false) {
        return this.executeWithCacheAndTracking('generateCoverLetter', jobId, { jobDescription, companyName, profileId: candidateProfile.id }, () => this.provider.generateCoverLetter(jobDescription, companyName, candidateProfile), forceRefresh);
    }
    static async answerScreeningQuestions(jobId, questions, candidateProfile, forceRefresh = false) {
        return this.executeWithCacheAndTracking('answerScreeningQuestions', jobId, { questions, profileId: candidateProfile.id }, () => this.provider.answerScreeningQuestions(questions, candidateProfile), forceRefresh);
    }
}
exports.AiService = AiService;
