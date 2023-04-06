import express from 'express';
import { getUploadPage, postConvertMov } from '../controllers/conversionController';

export const conversionRouter = express.Router();

conversionRouter.get('/', getUploadPage);
conversionRouter.post('/convert', postConvertMov);
