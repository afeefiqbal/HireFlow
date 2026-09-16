"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoverLettersController = void 0;
const cover_letter_service_1 = require("../services/cover-letter.service");
class CoverLettersController {
    static async generateCoverLetter(req, res) {
        try {
            const { id: jobId } = req.params;
            const result = await cover_letter_service_1.CoverLetterService.generateCoverLetter(jobId);
            return res.json({
                success: true,
                message: 'Cover letter generated successfully',
                data: result,
            });
        }
        catch (err) {
            console.error('Error generating cover letter:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getCoverLettersByJob(req, res) {
        try {
            const { id: jobId } = req.params;
            const letters = await cover_letter_service_1.CoverLetterService.getCoverLettersByJob(jobId);
            return res.json({
                success: true,
                data: letters,
            });
        }
        catch (err) {
            console.error('Error fetching cover letters by job:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getCoverLetterById(req, res) {
        try {
            const { id } = req.params;
            const result = await cover_letter_service_1.CoverLetterService.getCoverLetterById(id);
            return res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            console.error('Error fetching cover letter by id:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async updateCoverLetter(req, res) {
        try {
            const { id } = req.params;
            const { bodyText } = req.body;
            const result = await cover_letter_service_1.CoverLetterService.updateCoverLetter(id, bodyText);
            return res.json({
                success: true,
                message: 'Cover letter updated successfully',
                data: result,
            });
        }
        catch (err) {
            console.error('Error updating cover letter:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
exports.CoverLettersController = CoverLettersController;
