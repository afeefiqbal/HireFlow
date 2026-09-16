"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchesController = void 0;
const client_1 = require("@prisma/client");
const matching_service_1 = require("../services/matching.service");
const prisma = new client_1.PrismaClient();
class MatchesController {
    static async analyzeJob(req, res) {
        try {
            const { id } = req.params;
            const result = await matching_service_1.MatchingService.analyzeJob(id);
            return res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            console.error('Error analyzing job:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getMatches(req, res) {
        try {
            const { minScore = '0' } = req.query;
            const matches = await prisma.jobMatch.findMany({
                where: {
                    overallMatch: { gte: parseInt(minScore, 10) },
                },
                include: {
                    job: true,
                },
                orderBy: { overallMatch: 'desc' },
            });
            return res.json({
                success: true,
                data: matches,
            });
        }
        catch (error) {
            console.error('Error fetching matches:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.MatchesController = MatchesController;
