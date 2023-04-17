import express from 'express';
import path from 'path';
import * as exphbs from 'express-handlebars';
import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { conversionRouter } from './routes/conversion';
import { ioMiddleware } from './middleware/ioMiddleware';

const app = express();
app.use(express.static(path.join(__dirname, '..', 'public')));

const hbs = exphbs.create({ extname: '.hbs' });

// Create HTTP server and Socket.IO server
const httpServer = new Server(app);
const io = new SocketIOServer(httpServer);

app.use(ioMiddleware(io));

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use('/', conversionRouter);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
