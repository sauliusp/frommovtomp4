import express from 'express';
import multer from 'multer';
import path from 'path';
import * as exphbs from 'express-handlebars';


const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const upload = multer({ storage: multer.memoryStorage() });
const hbs = exphbs.create({ extname: '.hbs' });

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('upload');
});

app.post('/convert', upload.single('movFile'), (req, res) => {
  if (req.file && req.file.mimetype === 'video/quicktime') {
    console.log('MOV file received, starting conversion...');
    // Implement conversion logic here.
    res.send('Conversion complete.');
  } else {
    res.status(400).send('Invalid file format. Please upload a MOV file.');
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});