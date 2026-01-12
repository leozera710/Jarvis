# Tutorial: Configurar Google Agenda no JARVIS

Este tutorial mostra como configurar a integracao com Google Calendar para o JARVIS gerenciar sua agenda.

---

## Passo 1: Criar Projeto no Google Cloud

1. Acesse o Google Cloud Console:
   ```
   https://console.cloud.google.com/
   ```

2. Faca login com sua conta Google

3. Clique em **"Select a Project"** no topo da pagina

4. Clique em **"NEW PROJECT"**

5. Preencha:
   - **Project name:** JARVIS Negrao
   - **Organization:** (deixe padrao)

6. Clique em **"CREATE"**

7. Aguarde a criacao (alguns segundos)

---

## Passo 2: Ativar a Google Calendar API

1. No menu lateral, clique em **"APIs & Services"** > **"Library"**

2. Na barra de pesquisa, digite: **"Google Calendar API"**

3. Clique no resultado **"Google Calendar API"**

4. Clique no botao azul **"ENABLE"**

5. Aguarde a ativacao

---

## Passo 3: Configurar Tela de Consentimento OAuth

1. No menu lateral, va em **"APIs & Services"** > **"OAuth consent screen"**

2. Selecione **"External"** (para uso pessoal)

3. Clique em **"CREATE"**

4. Preencha os campos obrigatorios:
   - **App name:** JARVIS Negrao
   - **User support email:** seu-email@gmail.com
   - **Developer contact information:** seu-email@gmail.com

5. Clique em **"SAVE AND CONTINUE"**

### Configurar Escopos (Scopes)

6. Na proxima tela, clique em **"ADD OR REMOVE SCOPES"**

7. Pesquise e selecione:
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   https://www.googleapis.com/auth/calendar.readonly
   ```

8. Clique em **"UPDATE"**

9. Clique em **"SAVE AND CONTINUE"**

### Adicionar Usuarios de Teste

10. Clique em **"+ ADD USERS"**

11. Digite seu email: seu-email@gmail.com

12. Clique em **"ADD"**

13. Clique em **"SAVE AND CONTINUE"**

14. Revise e clique em **"BACK TO DASHBOARD"**

---

## Passo 4: Criar Credenciais OAuth 2.0

1. No menu lateral, va em **"APIs & Services"** > **"Credentials"**

2. Clique em **"+ CREATE CREDENTIALS"**

3. Selecione **"OAuth client ID"**

4. Configure:
   - **Application type:** Web application
   - **Name:** JARVIS Web Client

5. Em **"Authorized JavaScript origins"**, adicione:
   ```
   http://localhost:3000
   http://localhost:3001
   ```

6. Em **"Authorized redirect URIs"**, adicione:
   ```
   http://localhost:3000/api/calendar/callback
   http://localhost:3001/api/calendar/callback
   ```

7. Clique em **"CREATE"**

8. **IMPORTANTE:** Uma janela aparecera com suas credenciais:
   - **Client ID:** Algo como `123456789-xxxxx.apps.googleusercontent.com`
   - **Client Secret:** Algo como `GOCSPX-xxxxx`

9. **COPIE ESSAS CREDENCIAIS!** Voce vai precisar delas.

---

## Passo 5: Configurar no JARVIS

1. Abra o arquivo `.env.local` na raiz do projeto:
   ```
   C:\Users\Admin\ProjetoJarvisNegrao\.env.local
   ```

2. Adicione/atualize as variaveis:
   ```env
   # Google OAuth2 - Para Google Calendar
   GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
   GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/callback
   ```

3. Salve o arquivo

4. Reinicie o servidor:
   ```bash
   # Pare o servidor (Ctrl+C)
   # Inicie novamente
   npm run dev
   ```

---

## Passo 6: Autorizar o JARVIS

1. Acesse o JARVIS no navegador:
   ```
   http://localhost:3001
   ```

2. Clique no botao **"AGENDA"** no menu lateral

3. Clique em **"Conectar Google Agenda"**

4. Uma janela do Google abrira

5. Selecione sua conta Google

6. Clique em **"Continuar"** (mesmo se aparecer aviso de app nao verificado)

7. Clique em **"Continuar"** novamente para permitir acesso

8. Voce sera redirecionado de volta ao JARVIS

9. **Pronto!** Sua agenda esta conectada.

---

## Verificar se Funcionou

Apos conectar, voce devera ver:
- Seus eventos do dia
- Opcao de criar novos eventos
- Botao de lembretes

### Testar por voz:
- "Jarvis, qual minha agenda hoje?"
- "Jarvis, crie um evento amanha as 14h"
- "Jarvis, me lembre de ligar para o cliente em 1 hora"

---

## Solucao de Problemas

### Erro "redirect_uri_mismatch"
- Verifique se a URL de callback esta correta no Google Cloud
- Use exatamente: `http://localhost:3001/api/calendar/callback`

### Erro "access_denied"
- Adicione seu email como usuario de teste
- Verifique se os escopos estao corretos

### Erro "invalid_client"
- Verifique se copiou o Client ID e Secret corretamente
- Remova espacos extras

### Nada acontece ao clicar em Conectar
- Verifique o console do navegador (F12)
- Verifique se as variaveis de ambiente estao corretas
- Reinicie o servidor

---

## Estrutura dos Arquivos Envolvidos

```
src/
├── app/
│   └── api/
│       └── calendar/
│           ├── route.ts          # API principal do calendario
│           └── callback/
│               └── route.ts      # Callback do OAuth
├── hooks/
│   ├── useCalendar.ts           # Hook do calendario
│   └── useReminders.ts          # Hook de lembretes
└── components/
    └── CalendarPanel.tsx        # (a ser criado)
```

---

## Comandos de Voz Planejados

| Comando | Acao |
|---------|------|
| "Qual minha agenda hoje?" | Lista eventos do dia |
| "Quais compromissos amanha?" | Lista eventos de amanha |
| "Cria um evento [descricao] [data/hora]" | Cria novo evento |
| "Me lembre de [tarefa] em [tempo]" | Cria lembrete |
| "Cancela o evento [nome]" | Remove evento |
| "Remarque [evento] para [nova data]" | Atualiza evento |

---

## Proximos Passos

Apos configurar a agenda, voce pode:
1. Criar um CalendarPanel para visualizar eventos
2. Integrar lembretes com notificacoes
3. Sincronizar alarmes com o sistema

---

## Links Uteis

- Google Cloud Console: https://console.cloud.google.com/
- Documentacao Calendar API: https://developers.google.com/calendar/api
- Guia OAuth2: https://developers.google.com/identity/protocols/oauth2

---

*Tutorial criado para o projeto JARVIS Negrao*
