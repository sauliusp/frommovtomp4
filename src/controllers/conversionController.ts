import { Request, Response } from 'express';
import { upload } from '../services/multerService';
import { convertMovToMp4 } from '../services/conversionService';

export function getUploadPage(_: Request, res: Response) {
  res.render('upload');
}

export function postConvertMov(req: Request, res: Response) {
  upload(req, res, (err) => {
    if (err) {
      console.error('Error uploading file:', err);
      res.status(500).send('An error occurred while uploading the file');
      return;
    }

    convertMovToMp4(req, res);
  });
}
