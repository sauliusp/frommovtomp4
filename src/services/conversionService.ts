import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { Request, Response } from 'express';
import { ensureDirectory } from '../utils/directoryUtils';

const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
const convertedDir = path.join(__dirname, '..', '..', 'public', 'converted');

ensureDirectory(uploadsDir);
ensureDirectory(convertedDir);

export function convertMovToMp4(req: Request, res: Response) {
  if (req.file && req.file.mimetype === 'video/quicktime') {
    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, '..', '..', 'public', 'converted', `${Date.now()}.mp4`);

    ffmpeg()
      .input(inputPath)
      .inputOptions([
        '-analyzeduration 20000000',
        '-probesize 20000000',
        '-err_detect ignore_err',
      ])
      .inputFormat('mov')
      .videoCodec('libx264')
      .size('1280x720')
      .outputOptions([
        '-crf',
        '23',
        '-preset',
        'veryfast',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-maxrate',
        '1000k',
        '-bufsize',
        '2000k',
      ])
      .output(outputPath)
      .on('start', () => {
        console.log('Starting MOV to MP4 conversion');
      })
      .on('progress', (progress) => {
        console.log(`Conversion progress: ${progress.percent.toFixed(2)}% done`);

        req.io.to(req.query.socketId as string).emit('conversionProgress', Math.floor(progress.percent));
      })
      .on('end', () => {
        console.log('Conversion complete');
        res.download(outputPath, 'converted.mp4', (err) => {
          if (err) {
            console.error('Error downloading the file:', err);
            res.status(500).send('An error occurred while downloading the file');
          }

          // Delete input and output files after conversion
          fs.unlink(inputPath, (err) => {
            if (err) console.error('Error deleting input file:', err);
          });
          fs.unlink(outputPath, (err) => {
            if (err) console.error('Error deleting output file:', err);
          });
        });
      })
      .on('error', (err, stdout, stderr) => {
        console.error('Conversion error:', err);
        console.error('stdout:', stdout);
        console.error('stderr:', stderr);
        res.status(500).send('An error occurred during the conversion');
      })
      .run();
  } else {
    res.status(400).send('Invalid file format. Please upload a MOV file.');
  }
}
