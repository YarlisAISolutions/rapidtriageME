import { Router } from 'express';

export const browserRoutes = Router();

browserRoutes.get('/logs', async (req, res) => {
  res.json({ logs: [] });
});

browserRoutes.get('/network', async (req, res) => {
  res.json({ requests: [] });
});