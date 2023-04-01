import express from 'express';
import multer from 'multer';
import path from 'path';
import * as exphbs from 'express-handlebars';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import session from 'express-session';

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ dest: path.join(__dirname, 'public', 'uploads') });
const hbs = exphbs.create({ extname: '.hbs' });

// Create HTTP server and Socket.IO server
const httpServer = new Server(app);
const io = new SocketIOServer(httpServer);  

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Ensure directories exist
const ensureDirectory = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const uploadsDir = path.join(__dirname, 'public', 'uploads');
const convertedDir = path.join(__dirname, 'public', 'converted');

ensureDirectory(uploadsDir);
ensureDirectory(convertedDir);

app.get('/', (req, res) => {
  const room = Date.now().toString();
  res.locals.room = room;
  res.render('upload', { room });
});

// Add session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Join the client to a room with their session ID
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  });
});

app.get('/session', (req, res) => {
  res.send(req.sessionID);
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
      .videoCodec('libx264') // Efficient video codec
      .size('1280x720') // Reduce video resolution if necessary
      .outputOptions([
        '-crf', '23',
        '-preset', 'veryfast',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-maxrate', '1000k', // Limit video bitrate
        '-bufsize', '2000k'
      ])
      .output(outputPath)
      .on('start', () => {
        console.log('Starting MOV to MP4 conversion');
      })
      .on('progress', (progress) => {
        console.log(`Conversion progress: ${progress.percent.toFixed(2)}% done`);

        io.to(req.sessionID).emit('conversionProgress', progress.percent.toFixed(2));
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
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

