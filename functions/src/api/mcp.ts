import { Router } from 'express';

export const mcpRoutes = Router();

mcpRoutes.post('/execute', async (req, res) => {
  const { tool, params } = req.body;
  res.json({ result: `Executed ${tool}` });
});