import express from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import path from 'path';
import * as exphbs from 'express-handlebars';
import ffmpeg from 'fluent-ffmpeg';


const app = express();
app.use(express.static(path.join(__dirname, 'public')));
// const upload = multer({ storage: multer.memoryStorage() });
const upload = multer({ dest: path.join(__dirname, 'public', 'uploads') });
const hbs = exphbs.create({ extname: '.hbs' });

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('upload');
});

app.post('/convert', upload.single('movFile'), (req, res) => {
  if (req.file && req.file.mimetype === 'video/quicktime') {
    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, 'public', 'converted', `${Date.now()}.mp4`);

    ffmpeg()
      .input(inputPath)
      .inputOptions([
        '-analyzeduration 20000000',
        '-probesize 20000000',
        '-err_detect ignore_err'
      ])
      .inputFormat('mov')
      .videoCodec('libx264')
      .outputOptions(['-crf', '23', '-preset', 'veryfast', '-c:a', 'aac', '-b:a', '128k'])
      .output(outputPath)
      .on('start', () => {
        console.log('Starting MOV to MP4 conversion');
      })
      .on('progress', (progress) => {
        console.log(`Conversion progress: ${progress.percent.toFixed(2)}% done`);
      })
      .on('end', () => {
        console.log('Conversion complete');
        res.download(outputPath, (err) => {
          if (err) {
            console.error('Error sending the file:', err);
            res.status(500).send('An error occurred while sending the file');
          }
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
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});