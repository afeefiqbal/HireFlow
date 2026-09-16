"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumesController = void 0;
const resume_service_1 = require("../services/resume.service");
class ResumesController {
    static async generateTailoredCv(req, res) {
        try {
            const { id: jobId } = req.params;
            const result = await resume_service_1.ResumeService.generateTailoredCv(jobId);
            return res.json({
                success: true,
                message: 'Tailored CV generated successfully',
                data: result,
            });
        }
        catch (err) {
            console.error('Error generating tailored CV:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getResumesByJob(req, res) {
        try {
            const { id: jobId } = req.params;
            const resumes = await resume_service_1.ResumeService.getResumesByJob(jobId);
            return res.json({
                success: true,
                data: resumes,
            });
        }
        catch (err) {
            console.error('Error fetching resumes by job:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getResumeById(req, res) {
        try {
            const { id } = req.params;
            const result = await resume_service_1.ResumeService.getResumeById(id);
            return res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            console.error('Error fetching resume by id:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async updateResume(req, res) {
        try {
            const { id } = req.params;
            const updated = await resume_service_1.ResumeService.updateResume(id, req.body);
            return res.json({
                success: true,
                message: 'Resume updated successfully',
                data: updated,
            });
        }
        catch (err) {
            console.error('Error updating resume:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async regenerateResume(req, res) {
        try {
            const { id } = req.params;
            const result = await resume_service_1.ResumeService.regenerateResume(id);
            return res.json({
                success: true,
                message: 'Resume regenerated successfully',
                data: result,
            });
        }
        catch (err) {
            console.error('Error regenerating resume:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getAtsAnalysis(req, res) {
        try {
            const { id } = req.params;
            const resumeVer = await resume_service_1.ResumeService.getResumeById(id);
            return res.json({
                success: true,
                data: resumeVer.atsAnalysis,
            });
        }
        catch (err) {
            console.error('Error getting ATS analysis:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
exports.ResumesController = ResumesController;
