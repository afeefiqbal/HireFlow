"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsController = void 0;
const client_1 = require("@prisma/client");
const application_service_1 = require("../services/application.service");
const prisma = new client_1.PrismaClient();
class ApplicationsController {
    static async listApplications(req, res) {
        try {
            const applications = await application_service_1.ApplicationService.listApplications();
            return res.json({
                success: true,
                data: applications,
            });
        }
        catch (error) {
            console.error('Error listing applications:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    static async updateApplicationStatus(req, res) {
        try {
            const { jobId, status, note } = req.body;
            if (!jobId || !status) {
                return res.status(400).json({ success: false, message: 'jobId and status are required' });
            }
            const validStatuses = [
                'DISCOVERED',
                'MATCHED',
                'SAVED',
                'CV_READY',
                'READY_TO_APPLY',
                'APPLIED',
                'INTERVIEW',
                'REJECTED',
                'OFFER',
                'WITHDRAWN',
            ];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
            }
            const updated = await application_service_1.ApplicationService.updateStatus(jobId, status, note);
            return res.json({
                success: true,
                data: updated,
            });
        }
        catch (error) {
            console.error('Error updating application status:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.ApplicationsController = ApplicationsController;
