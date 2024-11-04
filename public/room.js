async function fetchApiKey() {
  try {
      const response = await fetch('/api-key');
      if (!response.ok) throw new Error('Erro ao buscar a chave da API');
      const data = await response.json();
      return data.apiKey; // Retorna a chave da API
  } catch (error) {
      console.error('Erro:', error);
  }
}
let busList

function updateTime() {
  const now = new Date();
  document.getElementById('current-time').innerText = now.toLocaleTimeString();
  document.getElementById('current-date').innerText = now.toLocaleDateString();
}

// Função assíncrona para obter clima
async function getWeather() {
  const apiKey = await fetchApiKey(); // Chama a função para buscar a chave da API
  const city = 'São Paulo, BR';
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Erro ao buscar dados do clima');
    }
    const data = await response.json();
    const { temp } = data.main; // Temperatura
    const weatherDescription = data.weather[0].description; // Descrição do clima
    const humidity = data.main.humidity; // Umidade
    const windSpeed = data.wind.speed; // Velocidade do vento
    
    // Atualize seu HTML com os dados do clima
    document.getElementById('weather').innerText = `Temperatura: ${temp}°C, ${weatherDescription}. Umidade: ${humidity}%. Vento: ${windSpeed} m/s`;
  } catch (error) {
    console.error('Erro ao obter clima:', error);
    document.getElementById('weather').innerText = 'Erro ao obter clima';
  }
}

// Função para buscar os dados dos ônibus do backend
async function fetchBuses() {
  try {
    busList = document.getElementById('bus-list'); // Use a variável global
    const response = await fetch('/api/buses'); 
    const buses = response.data;

    // Verifica se busList está definido antes de tentar acessar
    if (!busList) {
      console.error("busList não está definido");
      return;
    }

    // Atualiza o conteúdo de 'busList' com as divs formatadas para cada ônibus
    busList.innerHTML = buses.map(bus => `
      <tr class="bus-line-div">
        <td class="bus-number">${bus.number}</td>
        <td class="bus-line">${bus.line}</td>
        <td class="arrival-time">${bus.arrivalTime}</td>
        <td class="status">${bus.status}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error("Erro ao buscar dados dos ônibus:", error);
    if (busList) {
      busList.innerText = 'Erro ao buscar dados dos ônibus'; // Mensagem de erro amigável
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setInterval(updateTime, 1000); // Atualiza a hora a cada segundo
  getWeather();
  fetchBuses();

  // Event listeners para os botões
  document.getElementById('police-button').addEventListener('click', () => {
    startVideoConference('police');
  });

  document.getElementById('fire-button').addEventListener('click', () => {
    startVideoConference('fire');
  });

  document.getElementById('medic-button').addEventListener('click', () => {
    startVideoConference('medic');
  });

  document.getElementById('panic-button').addEventListener('click', () => {
    startVideoConference('panic');
  });
});

function startVideoConference(service) {
    
  // Mostrar o grid de vídeo
  document.getElementById('display').style.display = 'none'; // Esconder painel de informações
  document.getElementById('video-grid').style.display = 'grid'; // Mostrar grid de vídeo

  // Lógica para iniciar a videoconferência
  const socket = io('/');
  const videoGrid = document.getElementById('video-grid');
  const myPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
  });
  const myVideo = document.createElement('video');
  myVideo.muted = true;
  const peers = {};

  navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  }).then(stream => {
    addVideoStream(myVideo, stream);

    myPeer.on('call', call => {
      call.answer(stream);
      const video = document.createElement('video');
      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on('user-connected', userId => {
      connectToNewUser(userId, stream);
    });
  });

  socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close();
  });

  myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
  });

  function connectToNewUser(userId, stream) {
    if (peers[userId]) return; 
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      if (!video.srcObject) {
        addVideoStream(video, userVideoStream);
    }
    });
    call.on('close', () => {
      video.remove();
      delete peers[userId]; 
    });

    peers[userId] = call;
  }

  function addVideoStream(video, stream) {
    while (videoGrid.firstChild) {
      videoGrid.removeChild(videoGrid.firstChild);
    }
    if (videoGrid.childElementCount > 0) {
      return; // Evitar duplicação
  }
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    videoGrid.append(video);
  }
  
  
}
  
  
