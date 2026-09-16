"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreparationController = void 0;
const preparation_service_1 = require("../services/preparation.service");
class PreparationController {
    static async getPreparation(req, res) {
        try {
            const { id: jobId } = req.params;
            const result = await preparation_service_1.PreparationService.getApplicationPreparation(jobId);
            return res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            console.error('Error fetching application preparation:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getQueue(req, res) {
        try {
            const result = await preparation_service_1.PreparationService.getApplicationQueue();
            return res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            console.error('Error fetching application queue:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
exports.PreparationController = PreparationController;
