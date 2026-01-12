# Tutorial Completo - Chaves de API do JARVIS Negrao

## Indice
1. [Gemini API (Google)](#1-gemini-api-google) - IA Auxiliar
2. [Anthropic Claude API](#2-anthropic-claude-api) - IA Principal
3. [ElevenLabs API](#3-elevenlabs-api) - Voz do JARVIS
4. [Google OAuth (Calendar)](#4-google-oauth-calendar) - Agenda e Lembretes
5. [Tuya IoT API](#5-tuya-iot-api) - Smart Home
6. [Google Ads API](#6-google-ads-api) - Automacao de Campanhas

---

## 1. GEMINI API (Google)
**Custo:** Gratuito (com limites generosos)
**Tempo:** 2 minutos

### Passo a Passo:
1. Acesse: https://aistudio.google.com/
2. Faca login com sua conta Google
3. Clique em **"Get API Key"** no menu lateral esquerdo
4. Clique em **"Create API Key"**
5. Selecione um projeto existente ou crie um novo
6. Copie a chave gerada (comeca com `AIza...`)

### No .env.local:
```
GEMINI_API_KEY=AIzaSy...sua_chave_aqui
```

### Limites Gratuitos:
- 60 requisicoes por minuto
- 1 milhao de tokens por dia

---

## 2. ANTHROPIC CLAUDE API
**Custo:** Pago (a partir de $5 de credito inicial)
**Tempo:** 5 minutos

### Passo a Passo:
1. Acesse: https://console.anthropic.com/
2. Clique em **"Sign Up"** e crie uma conta
3. Confirme seu email
4. Va em **"API Keys"** no menu lateral
5. Clique em **"Create Key"**
6. De um nome (ex: "JARVIS")
7. Copie a chave (comeca com `sk-ant-...`)

### No .env.local:
```
ANTHROPIC_API_KEY=sk-ant-...sua_chave_aqui
```

### Adicionar Creditos:
1. Va em **"Billing"** no menu
2. Clique em **"Add Payment Method"**
3. Adicione cartao de credito
4. Compre creditos (minimo $5)

### Precos (Claude 3.5 Sonnet):
- Input: $3 por 1M tokens
- Output: $15 por 1M tokens
- Uma conversa media usa ~1000 tokens (~$0.01)

---

## 3. ELEVENLABS API
**Custo:** Gratuito ate 10.000 caracteres/mes
**Tempo:** 3 minutos

### Passo a Passo:
1. Acesse: https://elevenlabs.io/
2. Clique em **"Sign Up"** (canto superior direito)
3. Crie conta com email ou Google
4. Apos login, clique no seu perfil (canto superior direito)
5. Clique em **"Profile + API Key"**
6. Na secao "API Key", clique no icone de olho para revelar
7. Copie a chave

### Escolher Voz do JARVIS:
1. Va em **"Voices"** no menu
2. Procure por vozes masculinas em portugues ou ingles
3. Recomendacoes:
   - **"Adam"** - Voz grave, profissional
   - **"Antoni"** - Voz suave, sofisticada
   - **"Daniel"** - Voz britanica (estilo JARVIS original)
4. Clique na voz desejada
5. Copie o **Voice ID** da URL (ex: `21m00Tcm4TlvDq8ikWAM`)

### No .env.local:
```
ELEVENLABS_API_KEY=sua_chave_aqui
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

### Planos:
- Free: 10.000 caracteres/mes
- Starter ($5/mes): 30.000 caracteres/mes
- Creator ($22/mes): 100.000 caracteres/mes

---

## 4. GOOGLE OAUTH (Calendar)
**Custo:** Gratuito
**Tempo:** 10 minutos

### Passo a Passo:

#### A. Criar Projeto no Google Cloud:
1. Acesse: https://console.cloud.google.com/
2. Faca login com sua conta Google
3. Clique em **"Select a Project"** (topo da pagina)
4. Clique em **"New Project"**
5. Nome: "JARVIS Negrao"
6. Clique em **"Create"**

#### B. Ativar Google Calendar API:
1. No menu lateral, va em **"APIs & Services"** > **"Library"**
2. Pesquise por **"Google Calendar API"**
3. Clique nela e depois em **"Enable"**

#### C. Configurar Tela de Consentimento:
1. Va em **"APIs & Services"** > **"OAuth consent screen"**
2. Selecione **"External"** e clique **"Create"**
3. Preencha:
   - App name: "JARVIS Negrao"
   - User support email: seu email
   - Developer email: seu email
4. Clique **"Save and Continue"**
5. Em Scopes, clique **"Add or Remove Scopes"**
6. Adicione: `https://www.googleapis.com/auth/calendar`
7. Clique **"Save and Continue"**
8. Em Test Users, adicione seu email
9. Clique **"Save and Continue"**

#### D. Criar Credenciais OAuth:
1. Va em **"APIs & Services"** > **"Credentials"**
2. Clique **"+ Create Credentials"** > **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: "JARVIS Web"
5. Em **"Authorized redirect URIs"**, adicione:
   - `http://localhost:3000/api/calendar/callback`
   - `http://localhost:3001/api/calendar/callback`
6. Clique **"Create"**
7. Copie o **Client ID** e **Client Secret**

### No .env.local:
```
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/callback
```

---

## 5. TUYA IOT API (Smart Home)
**Custo:** Gratuito
**Tempo:** 15 minutos

### Pre-requisitos:
- Ter dispositivos Tuya/Smart Life configurados no app

### Passo a Passo:

#### A. Criar Conta de Desenvolvedor:
1. Acesse: https://platform.tuya.com/
2. Clique em **"Sign Up"** ou **"Start Free Trial"**
3. Preencha o formulario com seus dados
4. Confirme o email

#### B. Criar Projeto Cloud:
1. Apos login, va em **"Cloud"** > **"Development"**
2. Clique em **"Create Cloud Project"**
3. Preencha:
   - Project Name: "JARVIS Smart Home"
   - Industry: "Smart Home"
   - Development Method: "Smart Home"
   - Data Center: **"Western America"** ou **"Central Europe"**
4. Clique **"Create"**

#### C. Obter Credenciais:
1. Apos criar, voce vera a pagina do projeto
2. Copie:
   - **Access ID/Client ID**
   - **Access Secret/Client Secret**

#### D. Vincular App Smart Life:
1. No projeto, va em **"Devices"** > **"Link Tuya App Account"**
2. Clique **"Add App Account"**
3. Abra o app **Smart Life** no celular
4. Va em **Perfil** > **Configuracoes** (engrenagem)
5. Role ate encontrar um QR code ou codigo
6. Escaneie ou digite o codigo no site

#### E. Autorizar APIs:
1. Va em **"API"** > **"Go to Authorize"**
2. Ative todas as APIs de **"Smart Home"**:
   - Smart Home Basic Service
   - Smart Home Device Control
   - Smart Home Scene Linkage

### No .env.local:
```
TUYA_ACCESS_ID=seu_access_id
TUYA_ACCESS_SECRET=seu_access_secret
TUYA_REGION=us
```

### Regioes Disponiveis:
- `us` - Western America
- `eu` - Central Europe
- `cn` - China
- `in` - India

---

## 6. GOOGLE ADS API
**Custo:** Gratuito (API), mas precisa de conta Google Ads
**Tempo:** 20-30 minutos (requer aprovacao)

### Pre-requisitos:
- Conta Google Ads ativa (mesmo sem campanhas)
- Conta Manager (MCC) recomendada para multi-contas

### Passo a Passo:

#### A. Criar Conta Google Ads (se nao tiver):
1. Acesse: https://ads.google.com/
2. Clique em **"Comecar agora"**
3. Siga o wizard (pode pular a criacao de campanha)
4. Anote o **Customer ID** (formato: 123-456-7890)

#### B. Criar Conta Manager (MCC) - Opcional mas Recomendado:
1. Acesse: https://ads.google.com/home/tools/manager-accounts/
2. Clique em **"Create a Manager Account"**
3. Preencha os dados
4. Vincule suas contas de anunciante

#### C. Solicitar Acesso a API:
1. Acesse: https://console.cloud.google.com/
2. Use o mesmo projeto do Google Calendar ou crie um novo
3. Va em **"APIs & Services"** > **"Library"**
4. Pesquise **"Google Ads API"**
5. Clique em **"Enable"**

#### D. Obter Developer Token:
1. Acesse: https://ads.google.com/
2. Faca login com a conta Manager (MCC)
3. Va em **"Tools & Settings"** (chave inglesa)
4. Em **"Setup"**, clique em **"API Center"**
5. Preencha o formulario de solicitacao:
   - Descreva seu uso (automacao de campanhas)
   - Aceite os termos
6. Voce recebera um **Developer Token** (modo teste inicialmente)

#### E. Criar Credenciais OAuth para Ads:
1. No Google Cloud Console, va em **"Credentials"**
2. Use as mesmas credenciais OAuth do Calendar
   OU crie novas especificas para Ads
3. Adicione o escopo: `https://www.googleapis.com/auth/adwords`

### No .env.local:
```
GOOGLE_ADS_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_ADS_DEVELOPER_TOKEN=xxxxxxxxxxxxxxxxxxxx
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_LOGIN_CUSTOMER_ID=1234567890
```

### Niveis do Developer Token:
- **Test Account:** Apenas contas de teste
- **Basic Access:** Ate 15.000 operacoes/dia
- **Standard Access:** Ate 1.000.000 operacoes/dia

### Dica:
Para aprovacao mais rapida, explique que voce usara para:
- Gerenciamento automatizado de campanhas
- Otimizacao de bids
- Relatorios personalizados

---

## Arquivo .env.local Completo

```env
# ===== IAs =====
GEMINI_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-...

# ===== Voz =====
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# ===== Google OAuth =====
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/callback

# ===== Smart Home =====
TUYA_ACCESS_ID=...
TUYA_ACCESS_SECRET=...
TUYA_REGION=us

# ===== Google Ads =====
GOOGLE_ADS_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-...
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_LOGIN_CUSTOMER_ID=1234567890

# ===== Seguranca (Opcional) =====
JARVIS_REMOTE_TOKEN=uma_senha_forte_aqui
```

---

## Ordem de Prioridade Sugerida

1. **Gemini** - Ja configurado, essencial para o chat
2. **ElevenLabs** - Da vida ao JARVIS com voz realista
3. **Claude** - IA mais poderosa para tarefas complexas
4. **Google OAuth** - Desbloqueia calendario e lembretes
5. **Tuya** - So se tiver dispositivos smart home
6. **Google Ads** - Mais complexo, deixe por ultimo

---

## Problemas Comuns

### "API Key Invalid"
- Verifique se copiou a chave completa
- Remova espacos extras
- Reinicie o servidor: `npm run dev`

### "Quota Exceeded"
- Voce atingiu o limite gratuito
- Aguarde reset (geralmente 24h) ou faca upgrade

### "OAuth Error"
- Verifique se as URLs de redirect estao corretas
- Adicione seu email como Test User
- Limpe cookies do navegador

### "Tuya Device Not Found"
- Verifique se vinculou a conta do app corretamente
- Certifique-se que os dispositivos estao online
- Use a regiao correta no TUYA_REGION

---

## Suporte

Se tiver duvidas:
- Gemini: https://ai.google.dev/docs
- Claude: https://docs.anthropic.com/
- ElevenLabs: https://docs.elevenlabs.io/
- Google APIs: https://developers.google.com/
- Tuya: https://developer.tuya.com/en/docs
