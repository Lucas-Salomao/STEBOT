const endpoint = 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1';
const darkModeToggle = document.getElementById('dark-mode-toggle');
const BTN_microphone = document.getElementById('capture');
let mode = "light";

const GetKey = (service, callback) => {
  fetch('keys.json')
      .then(response => response.json())
      .then(data => {
          callback(data[service]);
      })
      .catch(error => console.error(error));
};

let openAIKey;
let MicrosoftKey;

GetKey('openai', (key) => {
  openAIKey = key;
  openAIKey = openAIKey.replaceAll("!", "");
  openAIKey = openAIKey.replaceAll("@", "");
});

GetKey('microsoft', (key) => {
  MicrosoftKey = key;
});

darkModeToggle.addEventListener('click', () => {
  changeTheme();
});

function changeTheme() {
  if (mode == "light") {
    document.body.classList.toggle('dark-mode');
    darkModeToggle.querySelector('i').setAttribute('class', 'fa fa-sun');
    mode = "dark";
  }
  else {
    if (mode == "dark") {
      document.body.classList.toggle('dark-mode');
      darkModeToggle.querySelector('i').setAttribute('class', 'fa fa-moon');
      mode = "light";
    }
  }
}

function textToSpeech(texto) {
  //const textoParaFala = document.getElementById('prompt').value;
  const textoParaFala = texto;
  const requestOptions = {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': MicrosoftKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'curl',
    },
    body: `<speak version='1.0' xml:lang='pt-BR'>
                <voice xml:lang='pt-BR' xml:gender='Female' name='pt-BR-AntonioNeural'>
                 ${textoParaFala}
                </voice>
            </speak>`,
  };

  fetch(endpoint, requestOptions)
    .then(response => {
      if (response.ok) {
        return response.arrayBuffer();
      } else {
        throw new Error(`Falha na requisição: ${response.status} - ${response.statusText}`);
      }
    })
    .then(data => {
      const blob = new Blob([data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      const audioElement = new Audio(audioUrl);
      audioElement.play();
    })
    .catch(error => {
      console.error('Erro:', error);
    });
}

const ConsultarOpenAI = async (pergunta) => {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", "Bearer "+openAIKey);
  myHeaders.append("Cookie", "__cf_bm=XVKVf7Yld3UDpt7E5giIXHZ9WlRGFFT614a6doOA4oI-1701179759-0-AXsC4gsMCdBH2kRq+9t4uityhNlyHAJhlZSTdFzwqtYXUKGzCzs5KtQo7fMDsqTezOlKA79XM2meEDHQT2a/9sg=; _cfuvid=XIkS2NVGkFkOvc3TuI3ljFJLlXh1JV5EddshQcY1hlQ-1701179759298-0-604800000");

  var raw = JSON.stringify({
    "model": "ft:gpt-3.5-turbo-0613:personal::8PsmsY32",
    "messages": [
      {
        "role": "system",
        "content": "Jarvis é um assistente muito solícito, que pode responder qualquer pergunta."
      },
      {
        "role": "user",
        "content": pergunta
      }
    ],
    "temperature": 0.2
  });

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  fetch("https://api.openai.com/v1/chat/completions", requestOptions)
    .then(response => response.json())
    .then(result => textToSpeech(result.choices[0].message.content))
    .catch(error => console.log('error', error));
}

const CapturarVoz = () => {
  var startButton = document.getElementById('capture');
  //var stopButton = document.getElementById('stop');
  var resultElement = document.getElementById('prompt');

  var recognition = new webkitSpeechRecognition();

  recognition.lang = window.navigator.language;
  recognition.interimResults = true;

  recognition.start();

  //startButton.addEventListener('click', () => { recognition.start(); });
  //stopButton.addEventListener('click', () => { recognition.stop(); });

  recognition.addEventListener('result', (event) => {
    const result = event.results[event.results.length - 1][0].transcript;
    resultElement.value = result;
  });

  recognition.addEventListener('end', () => {
    const textocapturado = resultElement.value;
    ConsultarOpenAI(textocapturado);
    //textToSpeech(textocapturado);
  });
}

const AtivarJarvis = () => {

  BTN_microphone.click();

  var resultElement = document.getElementById('prompt');

  // Crie uma instância de SpeechRecognition
  const recognition = new webkitSpeechRecognition();

  // Defina configurações para a instância
  recognition.continuous = true; // Permite que ele continue escutando
  recognition.interimResults = false; // Define para true se quiser resultados parciais
  recognition.lang = "pt-BR";

  // Inicie o reconhecimento de voz
  recognition.start();

  // Adicione um evento de escuta para lidar com os resultados
  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1]; // Último resultado

    // Verifique o texto reconhecido
    const recognizedText = result[0].transcript;


    // Verifique se a palavra "Jarvis" está no texto
    if (recognizedText.toLowerCase().includes('alexa')) {
      BTN_microphone.style.background = "green";
      // Comece a salvar a pergunta quando "Jarvis" é detectado
      let array_pergunta = recognizedText.toLowerCase().split('alexa');
      array_pergunta = array_pergunta[array_pergunta.length - 1];

      if (array_pergunta.toLowerCase().includes("trocar tema")) {
        changeTheme();
      }
      else {
        resultElement.value = array_pergunta;
        console.log(array_pergunta);
        ConsultarOpenAI(array_pergunta);
      }

      // Pare o reconhecimento de voz para economizar recursos
      recognition.stop();
    }
  };

  // Adicione um evento para reiniciar o reconhecimento após um tempo
  recognition.onend = () => {
    setTimeout(() => {
      recognition.start();
      BTN_microphone.style.background = "#dd203c";
    }, 1000); // Espere 1 segundo antes de reiniciar
  };


}

//chamada das funções
AtivarJarvis();
//CapturarVoz();


