// JARVIS Screen Capture - Popup Script

const JARVIS_URL = 'http://localhost:3001';

// Estado
let capturedImage = null;
let captureMode = null;

// Elementos DOM
const serverStatus = document.getElementById('serverStatus');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('previewImage');

// Verificar conexao com JARVIS
async function checkServerConnection() {
  try {
    const response = await fetch(`${JARVIS_URL}/api/remote?action=status`);
    if (response.ok) {
      serverStatus.textContent = 'Conectado';
      serverStatus.classList.add('connected');
      serverStatus.classList.remove('disconnected');
    } else {
      throw new Error('Server error');
    }
  } catch {
    serverStatus.textContent = 'Desconectado';
    serverStatus.classList.add('disconnected');
    serverStatus.classList.remove('connected');
  }
}

// Capturar tela inteira
document.getElementById('captureFullScreen').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      alert('Erro ao capturar: ' + chrome.runtime.lastError.message);
      return;
    }
    showPreview(dataUrl, 'fullscreen');
  });
});

// Capturar selecao
document.getElementById('captureSelection').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, { action: 'startSelection' }, (response) => {
    if (chrome.runtime.lastError) {
      alert('Erro: Recarregue a pagina e tente novamente');
      return;
    }
    window.close();
  });
});

// Selecionar elemento
document.getElementById('captureElement').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, { action: 'startElementPicker' }, (response) => {
    if (chrome.runtime.lastError) {
      alert('Erro: Recarregue a pagina e tente novamente');
      return;
    }
    window.close();
  });
});

// JARVIS Preencher Formulario
document.getElementById('fillForm').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Primeiro captura a tela
  chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
    if (chrome.runtime.lastError) {
      alert('Erro ao capturar: ' + chrome.runtime.lastError.message);
      return;
    }

    // Envia para JARVIS analisar e preencher
    await sendToJarvis(dataUrl, 'fill_form', tab.id);
  });
});

// Analisar Erro
document.getElementById('analyzeError').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
    if (chrome.runtime.lastError) {
      alert('Erro ao capturar: ' + chrome.runtime.lastError.message);
      return;
    }

    await sendToJarvis(dataUrl, 'analyze_error', tab.id);
  });
});

// Mostrar preview
function showPreview(dataUrl, mode) {
  capturedImage = dataUrl;
  captureMode = mode;
  previewImage.src = dataUrl;
  preview.classList.add('active');
}

// Enviar ao JARVIS
document.getElementById('sendToJarvis').addEventListener('click', async () => {
  if (capturedImage) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await sendToJarvis(capturedImage, 'analyze', tab.id);
  }
});

// Cancelar preview
document.getElementById('cancelPreview').addEventListener('click', () => {
  capturedImage = null;
  captureMode = null;
  preview.classList.remove('active');
});

// Enviar imagem para JARVIS
async function sendToJarvis(imageData, action, tabId) {
  try {
    // Abrir JARVIS em nova aba ou focar se ja existir
    const jarvisTabs = await chrome.tabs.query({ url: `${JARVIS_URL}/*` });

    let jarvisTab;
    if (jarvisTabs.length > 0) {
      jarvisTab = jarvisTabs[0];
      await chrome.tabs.update(jarvisTab.id, { active: true });
    } else {
      jarvisTab = await chrome.tabs.create({ url: JARVIS_URL });
    }

    // Aguardar a pagina carregar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Enviar mensagem para a pagina do JARVIS
    chrome.tabs.sendMessage(jarvisTab.id, {
      action: 'jarvisCapture',
      data: {
        image: imageData,
        captureAction: action,
        sourceUrl: (await chrome.tabs.get(tabId)).url,
        timestamp: new Date().toISOString()
      }
    });

    // Salvar no storage para o JARVIS pegar
    chrome.storage.local.set({
      pendingCapture: {
        image: imageData,
        action: action,
        sourceUrl: (await chrome.tabs.get(tabId)).url,
        timestamp: new Date().toISOString()
      }
    });

    window.close();
  } catch (error) {
    alert('Erro ao enviar para JARVIS: ' + error.message);
  }
}

// Configuracoes
document.getElementById('openSettings').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Listener para mensagens do content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'selectionComplete') {
    showPreview(message.imageData, 'selection');
  } else if (message.action === 'elementCaptured') {
    showPreview(message.imageData, 'element');
  }
});

// Inicializar
checkServerConnection();
