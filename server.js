const express = require('express');
require('dotenv').config(); 
const mongoose = require('mongoose'); // Importando o mongoose
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');
const mongoDbUri = process.env.MONGODB_URI;

app.set('view engine', 'ejs');
app.get('/api-key', (req, res) => {
  res.json({ apiKey: process.env.API_KEY });
});


app.use(express.static('public'));


// Conexão com MongoDB (substitua com sua URL do MongoDB)
mongoose.connect(mongoDbUri)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(error => console.error('Erro ao conectar ao MongoDB:', error));

// Definindo o esquema do ônibus
const busSchema = new mongoose.Schema({
  number: String,
  arrivalTime: String,
  line: String,
  status: String
});

// Criando o modelo do ônibus
const Bus = mongoose.model('Bus', busSchema);

// Endpoint para buscar lista de ônibus
app.get('/api/buses', async (req, res) => {
    try {
        const buses = await Bus.find(); // Supondo que você esteja usando Mongoose
        res.json(buses);
    } catch (error) {
        console.error('Erro ao buscar dados dos ônibus:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get('/:room', (req, res) => {
  console.log("Tentando renderizar a view 'room'"); // Log para depuração
  res.render('room', { roomId: req.params.room });
});

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

server.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});


