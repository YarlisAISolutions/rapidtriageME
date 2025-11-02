"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpRoutes = void 0;
const express_1 = require("express");
exports.mcpRoutes = (0, express_1.Router)();
exports.mcpRoutes.post('/execute', async (req, res) => {
    const { tool, params } = req.body;
    res.json({ result: `Executed ${tool}` });
});
//# sourceMappingURL=mcp.js.map