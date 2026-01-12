// JARVIS Screen Capture - Content Script

let selectionMode = false;
let elementPickerMode = false;
let selectionStart = null;
let selectionOverlay = null;
let highlightedElement = null;

// Criar overlay de selecao
function createSelectionOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'jarvis-selection-overlay';
  overlay.innerHTML = `
    <div id="jarvis-selection-box"></div>
    <div id="jarvis-selection-info">Arraste para selecionar a area</div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

// Criar highlight de elemento
function createElementHighlight() {
  const highlight = document.createElement('div');
  highlight.id = 'jarvis-element-highlight';
  document.body.appendChild(highlight);
  return highlight;
}

// Iniciar modo de selecao
function startSelectionMode() {
  selectionMode = true;
  selectionOverlay = createSelectionOverlay();

  document.addEventListener('mousedown', onSelectionStart);
  document.addEventListener('mousemove', onSelectionMove);
  document.addEventListener('mouseup', onSelectionEnd);
  document.addEventListener('keydown', onEscapeKey);
}

// Iniciar modo de selecao de elemento
function startElementPickerMode() {
  elementPickerMode = true;

  const highlight = createElementHighlight();

  document.addEventListener('mousemove', onElementHover);
  document.addEventListener('click', onElementClick, true);
  document.addEventListener('keydown', onEscapeKey);

  // Mostrar instrucoes
  showToast('Clique em um elemento para captura-lo');
}

// Eventos de selecao
function onSelectionStart(e) {
  if (!selectionMode) return;
  selectionStart = { x: e.clientX, y: e.clientY };
}

function onSelectionMove(e) {
  if (!selectionMode || !selectionStart) return;

  const box = document.getElementById('jarvis-selection-box');
  const left = Math.min(selectionStart.x, e.clientX);
  const top = Math.min(selectionStart.y, e.clientY);
  const width = Math.abs(e.clientX - selectionStart.x);
  const height = Math.abs(e.clientY - selectionStart.y);

  box.style.left = left + 'px';
  box.style.top = top + 'px';
  box.style.width = width + 'px';
  box.style.height = height + 'px';
  box.style.display = 'block';
}

function onSelectionEnd(e) {
  if (!selectionMode || !selectionStart) return;

  const left = Math.min(selectionStart.x, e.clientX);
  const top = Math.min(selectionStart.y, e.clientY);
  const width = Math.abs(e.clientX - selectionStart.x);
  const height = Math.abs(e.clientY - selectionStart.y);

  if (width > 10 && height > 10) {
    captureSelection(left, top, width, height);
  }

  cleanupSelection();
}

// Eventos de elemento
function onElementHover(e) {
  if (!elementPickerMode) return;

  const element = e.target;
  if (element.id === 'jarvis-element-highlight') return;

  const highlight = document.getElementById('jarvis-element-highlight');
  const rect = element.getBoundingClientRect();

  highlight.style.left = rect.left + window.scrollX + 'px';
  highlight.style.top = rect.top + window.scrollY + 'px';
  highlight.style.width = rect.width + 'px';
  highlight.style.height = rect.height + 'px';
  highlight.style.display = 'block';

  highlightedElement = element;
}

function onElementClick(e) {
  if (!elementPickerMode) return;

  e.preventDefault();
  e.stopPropagation();

  if (highlightedElement) {
    captureElement(highlightedElement);
  }

  cleanupElementPicker();
}

// Tecla ESC
function onEscapeKey(e) {
  if (e.key === 'Escape') {
    cleanupSelection();
    cleanupElementPicker();
  }
}

// Limpar selecao
function cleanupSelection() {
  selectionMode = false;
  selectionStart = null;

  const overlay = document.getElementById('jarvis-selection-overlay');
  if (overlay) overlay.remove();

  document.removeEventListener('mousedown', onSelectionStart);
  document.removeEventListener('mousemove', onSelectionMove);
  document.removeEventListener('mouseup', onSelectionEnd);
  document.removeEventListener('keydown', onEscapeKey);
}

// Limpar element picker
function cleanupElementPicker() {
  elementPickerMode = false;
  highlightedElement = null;

  const highlight = document.getElementById('jarvis-element-highlight');
  if (highlight) highlight.remove();

  document.removeEventListener('mousemove', onElementHover);
  document.removeEventListener('click', onElementClick, true);
  document.removeEventListener('keydown', onEscapeKey);
}

// Capturar selecao
async function captureSelection(x, y, width, height) {
  // Usar html2canvas ou metodo nativo
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    // Capturar a tela visivel e recortar
    chrome.runtime.sendMessage({
      action: 'captureVisibleTab'
    }, (response) => {
      if (response && response.imageData) {
        const img = new Image();
        img.onload = () => {
          // Calcular escala
          const scale = img.width / window.innerWidth;
          ctx.drawImage(
            img,
            x * scale,
            y * scale,
            width * scale,
            height * scale,
            0,
            0,
            width,
            height
          );

          const croppedData = canvas.toDataURL('image/png');
          chrome.runtime.sendMessage({
            action: 'selectionComplete',
            imageData: croppedData
          });
        };
        img.src = response.imageData;
      }
    });
  } catch (error) {
    console.error('Erro ao capturar selecao:', error);
  }
}

// Capturar elemento
async function captureElement(element) {
  try {
    const rect = element.getBoundingClientRect();

    chrome.runtime.sendMessage({
      action: 'captureVisibleTab'
    }, (response) => {
      if (response && response.imageData) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = rect.width;
        canvas.height = rect.height;

        const img = new Image();
        img.onload = () => {
          const scale = img.width / window.innerWidth;
          ctx.drawImage(
            img,
            rect.left * scale,
            rect.top * scale,
            rect.width * scale,
            rect.height * scale,
            0,
            0,
            rect.width,
            rect.height
          );

          const croppedData = canvas.toDataURL('image/png');

          // Incluir informacoes do elemento
          chrome.runtime.sendMessage({
            action: 'elementCaptured',
            imageData: croppedData,
            elementInfo: {
              tagName: element.tagName,
              id: element.id,
              className: element.className,
              innerText: element.innerText?.substring(0, 500),
              type: element.type,
              name: element.name,
              value: element.value
            }
          });
        };
        img.src = response.imageData;
      }
    });
  } catch (error) {
    console.error('Erro ao capturar elemento:', error);
  }
}

// Toast de notificacao
function showToast(message) {
  const toast = document.createElement('div');
  toast.id = 'jarvis-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Listener de mensagens
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'startSelection':
      startSelectionMode();
      sendResponse({ success: true });
      break;

    case 'startElementPicker':
      startElementPickerMode();
      sendResponse({ success: true });
      break;

    case 'jarvisCapture':
      // Receber captura do popup
      handleJarvisCapture(message.data);
      sendResponse({ success: true });
      break;

    case 'fillFormFields':
      // JARVIS enviou dados para preencher
      fillFormFields(message.fields);
      sendResponse({ success: true });
      break;
  }

  return true;
});

// Receber captura do JARVIS
function handleJarvisCapture(data) {
  // Se estamos na pagina do JARVIS
  if (window.location.href.includes('localhost:3001')) {
    // Disparar evento customizado para o React pegar
    window.dispatchEvent(new CustomEvent('jarvis-capture', {
      detail: data
    }));
  }
}

// Preencher campos do formulario
function fillFormFields(fields) {
  fields.forEach(field => {
    let element = null;

    // Tentar encontrar por diferentes seletores
    if (field.id) {
      element = document.getElementById(field.id);
    }
    if (!element && field.name) {
      element = document.querySelector(`[name="${field.name}"]`);
    }
    if (!element && field.selector) {
      element = document.querySelector(field.selector);
    }
    if (!element && field.label) {
      // Procurar por label
      const labels = document.querySelectorAll('label');
      labels.forEach(label => {
        if (label.textContent.toLowerCase().includes(field.label.toLowerCase())) {
          const forId = label.getAttribute('for');
          if (forId) {
            element = document.getElementById(forId);
          } else {
            element = label.querySelector('input, select, textarea');
          }
        }
      });
    }

    if (element) {
      // Preencher o campo
      if (element.tagName === 'SELECT') {
        const option = Array.from(element.options).find(
          opt => opt.value === field.value || opt.text === field.value
        );
        if (option) {
          element.value = option.value;
        }
      } else if (element.type === 'checkbox' || element.type === 'radio') {
        element.checked = field.value === true || field.value === 'true';
      } else {
        element.value = field.value;
      }

      // Disparar eventos
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      // Highlight visual
      element.style.boxShadow = '0 0 10px #39FF14';
      setTimeout(() => {
        element.style.boxShadow = '';
      }, 2000);
    }
  });

  showToast(`JARVIS preencheu ${fields.length} campos`);
}

// Verificar se ha captura pendente ao carregar
chrome.storage.local.get(['pendingCapture'], (result) => {
  if (result.pendingCapture && window.location.href.includes('localhost:3001')) {
    handleJarvisCapture(result.pendingCapture);
    chrome.storage.local.remove(['pendingCapture']);
  }
});

console.log('JARVIS Screen Capture loaded');
