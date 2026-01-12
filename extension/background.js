// JARVIS Screen Capture - Background Service Worker

// Listener para comandos de teclado
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (command === 'capture-screen') {
    // Capturar tela inteira
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('Erro ao capturar:', chrome.runtime.lastError);
        return;
      }

      // Salvar e abrir JARVIS
      openJarvisWithCapture(dataUrl, 'analyze', tab.url);
    });
  } else if (command === 'capture-selection') {
    // Iniciar modo de selecao
    chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });
  }
});

// Listener para mensagens
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'captureVisibleTab':
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        sendResponse({ imageData: dataUrl });
      });
      return true; // Manter canal aberto para resposta async

    case 'selectionComplete':
    case 'elementCaptured':
      // Salvar captura e abrir JARVIS
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        openJarvisWithCapture(
          message.imageData,
          message.action === 'elementCaptured' ? 'element' : 'selection',
          tab.url,
          message.elementInfo
        );
      });
      break;

    case 'openJarvis':
      openJarvisWithCapture(message.imageData, message.captureAction, message.sourceUrl);
      break;
  }
});

// Abrir JARVIS com captura
async function openJarvisWithCapture(imageData, action, sourceUrl, elementInfo = null) {
  const JARVIS_URL = 'http://localhost:3001';

  // Salvar dados da captura
  await chrome.storage.local.set({
    pendingCapture: {
      image: imageData,
      action: action,
      sourceUrl: sourceUrl,
      elementInfo: elementInfo,
      timestamp: new Date().toISOString()
    }
  });

  // Verificar se JARVIS ja esta aberto
  const tabs = await chrome.tabs.query({ url: `${JARVIS_URL}/*` });

  if (tabs.length > 0) {
    // Focar na aba existente
    await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.windows.update(tabs[0].windowId, { focused: true });

    // Enviar mensagem para a aba
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'jarvisCapture',
      data: {
        image: imageData,
        captureAction: action,
        sourceUrl: sourceUrl,
        elementInfo: elementInfo,
        timestamp: new Date().toISOString()
      }
    });
  } else {
    // Abrir nova aba
    chrome.tabs.create({ url: JARVIS_URL });
  }
}

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'jarvis-capture',
    title: 'Enviar para JARVIS',
    contexts: ['all']
  });

  chrome.contextMenus.create({
    id: 'jarvis-fill-form',
    title: 'JARVIS: Preencher Formulario',
    contexts: ['editable']
  });

  chrome.contextMenus.create({
    id: 'jarvis-analyze-error',
    title: 'JARVIS: Analisar Erro',
    contexts: ['selection']
  });
});

// Handler do context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'jarvis-capture':
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        openJarvisWithCapture(dataUrl, 'analyze', tab.url);
      });
      break;

    case 'jarvis-fill-form':
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        openJarvisWithCapture(dataUrl, 'fill_form', tab.url);
      });
      break;

    case 'jarvis-analyze-error':
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        openJarvisWithCapture(dataUrl, 'analyze_error', tab.url, {
          selectedText: info.selectionText
        });
      });
      break;
  }
});

console.log('JARVIS Background Service Worker loaded');
