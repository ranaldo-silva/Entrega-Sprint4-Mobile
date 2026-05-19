# Sistema de Portaria Inteligente 🏢

O **Sistema de Portaria Light** é uma solução completa em nível de produção (Mobile + Backend) para o gerenciamento ultrasseguro e rápido de atividades de condomínios. Ele inclui acompanhamento completo de recebimento e entrega de encomendas, além da administração e controle de acesso e cadastro de todos os moradores e membros da equipe.

---

## 👥 Guia de Uso: Passo a Passo Humanizado

Nossa plataforma foi desenhada para ser intuitiva. Abaixo, detalhamos a jornada de cada tipo de usuário dentro do aplicativo:

### 👑 Síndico (Super Admin)
Como Síndico ou Gestor, você tem o controle total do condomínio na palma da mão. Sua principal responsabilidade é garantir que apenas pessoas autorizadas tenham acesso ao sistema.

**Passo a Passo:**
1. **Primeiro Acesso:** Faça login com seu e-mail administrativo (autorizado previamente na base de dados).
2. **Painel de Gestão:** Ao entrar, você será direcionado para o painel de "Gestão de Equipe" (`/super-admin`).
3. **Criando a Equipe:** Preencha o formulário para adicionar novos Porteiros ou Moradores. Defina o e-mail, senha inicial e o Nível de Acesso (Role).
4. **Gerenciamento:** Na lista abaixo do formulário, você pode visualizar todos os usuários cadastrados. Você tem o poder de **Ativar/Desativar** o acesso de qualquer pessoa com um clique (ideal em caso de demissão de funcionários ou mudança de moradores) ou **Excluir** o cadastro definitivamente.

### 🛡️ Porteiro
O Porteiro é o coração da operação do condomínio. O aplicativo foi desenhado para agilizar o trabalho na guarita, reduzindo filas e extravios.

**Passo a Passo:**
1. **Login:** Faça login com as credenciais fornecidas pelo Síndico.
2. **Dashboard de Resumo:** Na tela inicial, você terá uma visão rápida de tudo que está acontecendo: total de moradores, pacotes pendentes e pacotes já retirados.
3. **Registrando Encomendas:** Chegou um pacote? Clique em **"+ Nova"**. Selecione o morador, informe a origem e gere o registro. O sistema criará um **Token Único** para aquele pacote.
4. **Notificando o Morador:** Ao registrar, o morador recebe instantaneamente uma **Notificação Push** no celular. Se preferir, você pode clicar no botão **"💬 WhatsApp"** ao lado da encomenda para abrir diretamente o WhatsApp do morador com uma mensagem pronta e amigável (incluindo o token de retirada).
5. **Entrega Segura:** Quando o morador descer para buscar, você pode validar a entrega pelo sistema para que ela passe para o status de "Retirada", mantendo o histórico de auditoria perfeito.

### 👤 Morador
A vida do morador fica muito mais tranquila sem precisar ligar para a portaria perguntando se "chegou algo".

**Passo a Passo:**
1. **Acesso:** Faça o login com o e-mail cadastrado pela administração.
2. **Alertas em Tempo Real:** Sempre que uma encomenda chegar no seu nome, seu celular vai apitar com uma **Notificação Push** gerada pelo nosso sistema nativo do Expo.
3. **Acompanhamento:** Abra o app para visualizar a lista das suas encomendas pendentes e pegue o seu **Token de Retirada** exclusivo.
4. **Retirada:** Desça até a portaria, informe o seu Token e retire o seu pacote com segurança!

---

## 🚀 Painel Tecnológico

*   **Frontend (Mobile App)**: Desenvolvido com React Native e Expo SDK. UI de vanguarda projetada com estética moderna (Glassmorphism, Micro-interações Animadas e Tema Dark Premium).
*   **Backend (API Restful)**: Baseado em Java no ecossistema **Spring Boot 3**.
*   **Banco de Dados**: Firestore / Oracle Database escalável.
*   **Notificações Push**: Integração nativa com **Expo Notifications**, acoplada com triggers locais e no Firebase.
*   **Segurança (Auth)**: Autenticação mista poderosa. O **Firebase Authentication** gerencia as sessões de usuário combinando com a regra de Roles (`super_admin`, `porteiro`, `morador`) no Firestore.

---

## 📱 Como Rodar o Aplicativo Mobile

⚠️ **Aviso de Compatibilidade Crítica:** 
Para experimentar a interface premium em sua total glória, bem como evitar falhas de integração no CORS de navegadores Web nativos, **é estritamente exigido** que este aplicativo seja testado de uma de duas maneiras nativas:

### Opção 1: Expo Go (Em um Dispositivo Físico)
A rota mais rápida e recomendada.
1. Instale o app [Expo Go](https://expo.dev/client) no seu celular (compatível com Android e iOS).
2. Na raiz do painel frontend (`/portaria`), execute as dependências e inicie o servidor:
   ```bash
   npm install
   npx expo start --tunnel
   ```
3. Abra a câmera do celular, aponte para o QR Code gerado no terminal e aguarde o "bundling" nativo.

### Opção 2: Emulador do Android Studio (Desenvolvedores)
Para testar na tela do computador exatamente como em um celular.
1. Instale o [Android Studio](https://developer.android.com/studio) e crie um **Virtual Device (AVD)**.
2. Inicie o emulador na janela do Android Studio.
3. No terminal (na pasta `/portaria`), rode o ambiente indicando o destino Android:
   ```bash
   npm install
   npx expo start -a
   ```
4. O emulador abrirá o aplicativo automaticamente (ou, para projetos ejetados/prebuildados, utilize `npx expo run:android`).

---

## 🔒 Arquitetura de Permissões (White-Listing)

Na essência deste aplicativo, há um foco rigoroso na **política de portas-fechadas**, garantindo a segurança de todos os condôminos:
*   Apenas usuários com Role `super_admin` podem cadastrar novas contas e gerenciar acessos (como o painel de Gestão de Equipe).
*   Pessoas que tentarem "burlar" o login não conseguirão ver dados sensíveis graças ao nosso *Role-Based Access Control* (RBAC) robusto, amarrado às rotas protegidas do Expo Router e regras do Firebase Firestore.
