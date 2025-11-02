"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.browserRoutes = void 0;
const express_1 = require("express");
exports.browserRoutes = (0, express_1.Router)();
exports.browserRoutes.get('/logs', async (req, res) => {
    res.json({ logs: [] });
});
exports.browserRoutes.get('/network', async (req, res) => {
    res.json({ requests: [] });
});
//# sourceMappingURL=browser.js.map