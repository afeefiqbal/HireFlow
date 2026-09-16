"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const api_routes_1 = require("./routes/api.routes");
const createApp = () => {
    const app = (0, express_1.default)();
    // Security & standard middleware
    app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
    app.use((0, cors_1.default)({
        origin: true, // Allow frontend dev server and production domains
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, morgan_1.default)('dev'));
    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    // Authentication & Security Middleware
    // In development, permits local requests seamlessly. In production, checks for valid bearer token.
    app.use((req, res, next) => {
        const requiredToken = process.env.API_ACCESS_TOKEN;
        const authHeader = req.headers.authorization;
        // Permit preflight, health, and local dev requests
        if (req.method === 'OPTIONS' ||
            req.path === '/health' ||
            process.env.NODE_ENV === 'development' ||
            !requiredToken) {
            return next();
        }
        if (authHeader && authHeader === `Bearer ${requiredToken}`) {
            return next();
        }
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Private AI Job Agent access requires a valid authentication token.',
        });
    });
    // Mount API Routes
    app.use('/api', api_routes_1.apiRouter);
    // Global Error Handler
    app.use((err, req, res, next) => {
        console.error('Unhandled Application Error:', err);
        res.status(err.status || 500).json({
            success: false,
            message: err.message || 'Internal Server Error',
        });
    });
    return app;
};
exports.createApp = createApp;
