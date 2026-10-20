import express from 'express';
// @Filename: src/controllers/hello.controller.js
import { getHello } from '../controllers/hello.controller.js';

const router = express.Router();
// GET /api/hello
router.get('/', getHello);

export default router;
