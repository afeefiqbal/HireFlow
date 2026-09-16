"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreeningController = void 0;
const screening_service_1 = require("../services/screening.service");
class ScreeningController {
    static async analyzeScreening(req, res) {
        try {
            const { id: jobId } = req.params;
            const { questions } = req.body;
            const results = await screening_service_1.ScreeningService.analyzeScreeningQuestions(jobId, questions);
            return res.json({
                success: true,
                message: 'Screening questions analyzed successfully',
                data: results,
            });
        }
        catch (err) {
            console.error('Error analyzing screening questions:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getScreeningQuestions(req, res) {
        try {
            const { id: jobId } = req.params;
            const questions = await screening_service_1.ScreeningService.getScreeningQuestions(jobId);
            return res.json({
                success: true,
                data: questions,
            });
        }
        catch (err) {
            console.error('Error fetching screening questions:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async answerQuestion(req, res) {
        try {
            const { id } = req.params;
            const { answer } = req.body;
            const updated = await screening_service_1.ScreeningService.answerScreeningQuestion(id, answer);
            return res.json({
                success: true,
                message: 'Answer saved successfully',
                data: updated,
            });
        }
        catch (err) {
            console.error('Error saving screening answer:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
exports.ScreeningController = ScreeningController;
