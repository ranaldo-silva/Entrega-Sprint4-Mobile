# 📋 Documentação Técnica — Portaria Light

> **Versão:** 1.0.0 | **Plataforma:** Android (React Native / Expo) + Backend Spring Boot + Oracle DB
> **Projeto acadêmico FIAP** — Challenge / Sprint

---

## 👥 Equipe de Desenvolvimento

| Nome | RM | Papel |
|---|---|---|
| Ranaldo José da Silva | RM: 559210 | Desenvolvedor Mobile (React Native / Expo) |
| Lucas da Ressurreição Barbosa | RM: 560179 | Desenvolvedor Backend (Spring Boot / Java) |
| Fabricio José da Silva | RM: 560694 | Desenvolvedor de Banco de Dados (Oracle) |

---

## 📌 Visão Geral do Projeto

O **Portaria Light** é um sistema de gerenciamento de portaria condominial que digitaliza e automatiza os processos de recebimento de encomendas, controle de moradores e validação de retiradas. O sistema elimina o uso de papel, planilhas e cadernos físicos nas portarias, oferecendo rastreabilidade em tempo real por meio de um aplicativo mobile.

---

## 🏢 Modelo de Negócio

### Problema Resolvido
Condomínios residenciais recebem dezenas de encomendas diariamente. O processo manual (caderno de registro, bilhetes, ligações) é lento, inseguro e sujeito a erros. Moradores não sabem quando seus pacotes chegaram e porteiros não têm controle eficiente.

### Solução
Um app mobile para porteiros e moradores que:
- Registra a chegada de encomendas com geração automática de token único
- Notifica o morador via WhatsApp instantaneamente
- Permite ao morador acompanhar o status de suas encomendas em tempo real
- Valida a retirada pelo token, gerando rastreabilidade completa

### Fluxo Principal de Negócio

```
Encomenda chega na portaria
        ↓
Porteiro registra no app (seleciona morador + origem)
        ↓
Backend gera token único (ex: A4B1Z)
        ↓
App abre WhatsApp com mensagem automática para o morador
        ↓
Morador vai à portaria e informa o token
        ↓
Porteiro valida o token no app
        ↓
Sistema registra retirada com timestamp e marca encomenda como concluída
```

### Perfis de Usuário

| Perfil | E-mail | Permissões |
|---|---|---|
| **Super Admin** | `@admin.com.br` (ex: admin@admin.com.br) | Acesso total, painel de gestão de equipe, cadastro de porteiros e moradores |
| **Porteiro / Admin** | `@porteiro.com.br` | Registrar encomendas, cadastrar moradores, validar retiradas, ver dashboard |
| **Morador** | Qualquer outro e-mail | Ver apenas suas próprias encomendas e tokens de retirada |

### Credenciais de Acesso (Ambiente de Teste)

| Perfil | E-mail | Senha |
|---|---|---|
| Super Admin | `admin@admin.com.br` | `123456` |
| Porteiro | `porteiro@porteiro.com.br` | `123456` |
| Morador | `morador@morador.com.br` | `123456` |

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTE MOBILE                               │
│              React Native (Expo) — Android / iOS                    │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  Login   │  │Dashboard │  │Encomendas │  │Portal do Morador │  │
│  │  (Auth)  │  │(Porteiro)│  │(CRUD)     │  │(Minhas Encomend.)│  │
│  └──────────┘  └──────────┘  └───────────┘  └──────────────────┘  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS + JWT Bearer Token
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                   FIREBASE (Google)                                  │
│   Authentication (login/register)   Firestore (Push Tokens)         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Firebase ID Token → API REST
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│              BACKEND — Spring Boot 3.5 (Java 21)                    │
│                    Hospedagem: Render.com                            │
│                                                                      │
│  ┌─────────────┐  ┌────────────────┐  ┌────────────────────────┐   │
│  │AuthController│ │MoradorController│ │EncomendaController     │   │
│  │/auth/**     │  │/moradores/**   │  │/encomendas/**          │   │
│  └─────────────┘  └────────────────┘  └────────────────────────┘   │
│  ┌───────────────────┐  ┌──────────────────────────────────────┐    │
│  │RetiradaController │  │Swagger UI                            │    │
│  │/retiradas/**      │  │/swagger-ui.html                      │    │
│  └───────────────────┘  └──────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              RabbitMQ (CloudAMQP)                            │   │
│  │   fila.encomenda.recebida | fila.retirada.realizada          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              ML Client (OpenFeign)                           │   │
│  │   Previsão de tempo de retirada (não-bloqueante)             │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ JDBC / JPA / Hibernate
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                BANCO DE DADOS — Oracle (Azure Cloud)                 │
│                                                                      │
│   TPL_USUARIO | TPL_MORADOR | TPL_APARTAMENTO                       │
│   TPL_ENCOMENDA | TPL_RETIRADA | TPL_PORTARIA                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Frontend Mobile — React Native / Expo

### Stack Tecnológica

| Tecnologia | Versão | Uso |
|---|---|---|
| React Native | 0.81.4 | Framework base |
| Expo | ~54.0.13 | Toolchain e build |
| Expo Router | ~6.0.11 | Navegação file-based |
| Firebase SDK | ^12.11.0 | Auth + Firestore |
| TanStack Query | ^5.100.11 | Cache e estado server |
| React Native Reanimated | ~4.1.1 | Animações |
| React Native SVG | 15.12.1 | QR Code e ícones |
| Async Storage | 2.2.0 | Persistência local |

### Estrutura de Telas e Rotas

```
app/
├── _layout.tsx              ← Root layout (AuthProvider + QueryClient)
├── index.tsx                ← Dashboard do Porteiro (ADMIN)
├── (auth)/
│   ├── login.tsx            ← Tela de login
│   └── register.tsx         ← Tela de cadastro de morador (self-service)
├── moradores/
│   └── cadastrar.tsx        ← CRUD de moradores (ADMIN)
├── encomendas/
│   └── registrar.tsx        ← Registrar / editar encomenda (ADMIN)
├── validar-encomenda.tsx    ← Validar retirada por token (ADMIN)
├── morador/
│   └── index.tsx            ← Portal do morador (MORADOR)
└── super-admin/
    └── index.tsx            ← Gestão de equipe / usuários (SUPER ADMIN)
```

### Autenticação e Fluxo de Sessão

O app usa **autenticação dupla camada**:

1. **Firebase Auth** — valida o e-mail e senha, devolve um `idToken` JWT
2. **API Backend (Spring Boot)** — recebe o `idToken`, verifica com Firebase Admin SDK e retorna o perfil (`ADMIN` ou `MORADOR`) e os IDs do banco relacional

A sessão é persistida localmente com `AsyncStorage` usando as chaves `@portaria_token` e `@portaria_user`.

### Regras de Roteamento por Perfil

```
Usuário não logado           → /(auth)/login
Usuário ADMIN logado         → / (Dashboard Porteiro)
Usuário MORADOR logado       → /morador (Portal do Morador)
Usuário ADMIN + @admin email → acesso ao /super-admin
```

### Integração WhatsApp

Ao registrar uma encomenda, o app gera uma mensagem pré-formatada e abre o WhatsApp do morador automaticamente:

```
📦 Olá [Nome]! Sua encomenda (Mercado Livre) chegou na portaria.
Token para retirada: *A4B1Z*

Por favor, retire na recepção. OBRIGADO! 🏢
```

### Push Notifications

O app usa `expo-notifications` para registrar o dispositivo e salvar o `expoPushToken` no Firestore (`/users/{uid}/expoPushToken`). Ao trocar de dispositivo, o token é atualizado automaticamente.

### Cache e Performance

Toda comunicação com a API usa **TanStack Query** com:
- `staleTime` de 2 minutos (evita requisições desnecessárias)
- `retry: 1` (1 retry automático em caso de falha)
- Invalidação automática do cache após mutações (create/update/delete)

---

## ☕ Backend — Spring Boot (Java 21)

### Stack Tecnológica

| Tecnologia | Versão | Uso |
|---|---|---|
| Spring Boot | 3.5.6 | Framework base |
| Java | 21 | Linguagem |
| Spring Data JPA | — | ORM / Repositórios |
| Oracle JDBC | ojdbc8:23.2.0.0 | Driver do banco |
| Firebase Admin SDK | 9.2.0 | Verificação de tokens |
| Spring Security | — | Autenticação JWT |
| SpringDoc OpenAPI | 2.6.0 | Swagger UI |
| RabbitMQ (AMQP) | — | Mensageria assíncrona |
| Spring Cloud OpenFeign | — | Client HTTP declarativo (ML) |
| Lombok | — | Redução de boilerplate |
| Docker | — | Containerização |

### Estrutura de Pacotes

```
br.com.fiap.Portaria/
├── PortariaApplication.java       ← Entry point
├── client/
│   └── MLClient.java              ← Feign client para API de ML
├── config/
│   ├── CorsConfig.java            ← CORS liberado para o app mobile
│   ├── FirebaseConfig.java        ← Inicialização Firebase Admin SDK
│   ├── JwtFilter.java             ← Filtro de autenticação JWT
│   ├── RabbitMQConfig.java        ← Configuração das filas
│   ├── SecurityConfig.java        ← Regras de autorização por role/método
│   └── SwaggerConfig.java         ← Configuração do Swagger
├── controller/
│   ├── AuthController.java        ← /auth/firebase-login e /firebase-register
│   ├── EncomendaController.java   ← /encomendas (CRUD + busca por token)
│   ├── MoradorController.java     ← /moradores (CRUD)
│   └── RetiradaController.java    ← /retiradas (registrar retirada)
├── dto/
│   ├── enums/Role.java            ← ADMIN | MORADOR
│   ├── EncomendaRequestDTO.java
│   ├── EncomendaResponseDTO.java
│   ├── FirebaseLoginRequestDTO.java
│   ├── FirebaseRegisterRequestDTO.java
│   ├── MoradorRequestDTO.java
│   ├── MoradorResponseDTO.java
│   ├── RetiradaRequestDTO.java
│   └── RetiradaResponseDTO.java
├── entity/
│   ├── Apartamento.java           ← @Table(TPL_APARTAMENTO)
│   ├── Encomenda.java             ← @Table(TPL_ENCOMENDA)
│   ├── Morador.java               ← @Table(TPL_MORADOR)
│   ├── Portaria.java              ← @Table(TPL_PORTARIA)
│   ├── Retirada.java              ← @Table(TPL_RETIRADA)
│   └── Usuario.java               ← @Table(TPL_USUARIO)
├── repository/
│   ├── ApartamentoRepository.java
│   ├── EncomendaRepository.java   ← findByTokenEncomenda()
│   ├── MoradorRepository.java
│   ├── PortariaRepository.java
│   ├── RetiradaRepository.java
│   └── UsuarioRepository.java     ← findByEmail()
└── service/
    ├── EncomendaConsumer.java     ← Listener fila.encomenda.recebida
    ├── EncomendaProducer.java     ← Publisher para fila de encomendas
    ├── EncomendaService.java      ← Lógica: gerar token, ML, retirada pendente
    ├── MoradorService.java        ← CRUD + auto-create apartamento
    ├── RetiradaConsumer.java      ← Listener fila.retirada.realizada
    ├── RetiradaProducer.java      ← Publisher para fila de retiradas
    ├── RetiradaService.java       ← Valida token, marca retirada, timestamp
    └── UsuarioDetailsService.java ← UserDetailsService do Spring Security
```

### Regras de Segurança (Spring Security)

| Método HTTP | Endpoint | Roles Permitidas |
|---|---|---|
| POST | `/auth/**` | Público (sem autenticação) |
| GET | `/**` | ADMIN, PORTEIRO, MORADOR |
| POST | `/moradores/**`, `/encomendas/**`, `/retiradas/**` | ADMIN, PORTEIRO |
| PUT | `/**` | ADMIN, PORTEIRO |
| DELETE | `/**` | ADMIN apenas |
| OPTIONS | `/**` | Público (CORS preflight) |
| GET | `/swagger-ui/**`, `/v3/api-docs/**` | Público |

### Regra de Perfil por E-mail (AuthController)

O backend usa o domínio do e-mail para determinar o perfil automaticamente:

```java
if (email.contains("@admin") || email.contains("@porteiro")) {
    usuario.setPerfil(Role.ADMIN);
} else {
    usuario.setPerfil(Role.MORADOR);
}
```

### Geração de Token de Encomenda

O token é gerado aleatoriamente com 5 caracteres alfanuméricos maiúsculos (ex: `A4B1Z`, `X9QR2`):

```java
String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
// 36^5 = 60.466.176 combinações possíveis
```

### Mensageria RabbitMQ (CloudAMQP)

O sistema publica eventos assíncronos em duas filas:

| Fila | Evento | Conteúdo |
|---|---|---|
| `fila.encomenda.recebida` | Quando encomenda é registrada | Descrição + ID do morador |
| `fila.retirada.realizada` | Quando retirada é confirmada | ID morador + ID encomenda |

Os consumers (`EncomendaConsumer`, `RetiradaConsumer`) processam essas mensagens de forma assíncrona, desacoplando o fluxo principal.

### Integração com Machine Learning (MLClient)

Ao registrar uma encomenda, o sistema chama um endpoint de ML via Feign (não-bloqueante) para prever o tempo de retirada com base em características como peso, custo, desconto e histórico do morador. Se o serviço de ML estiver indisponível, o registro da encomenda **não é interrompido** — o erro é apenas logado.

---

## 🗄️ Banco de Dados — Oracle (Azure Cloud)

### Modelo Relacional (DER)

```
┌─────────────────────┐
│   TPL_APARTAMENTO   │
├─────────────────────┤
│ PK  idApartamento   │◄──────────────────────────┐
│     torre           │                            │
│     bloco           │                            │
│     numero          │                            │
└─────────────────────┘                            │
                                                   │
┌─────────────────────┐          ┌─────────────────┴───┐
│    TPL_MORADOR      │          │    TPL_USUARIO       │
├─────────────────────┤          ├─────────────────────┤
│ PK  idMorador       │◄─────────│     idMorador (FK)   │
│     nome            │          │ PK  idUsuario        │
│     email           │          │     email (UNIQUE)   │
│     telefone        │          │     firebaseUid      │
│ FK  idApartamento   │──────────►     perfil (ENUM)    │
└──────────┬──────────┘          │     idPortaria (FK)  │
           │                     └─────────────────────┘
           │ 1:N
           │                     ┌─────────────────────┐
           ▼                     │    TPL_PORTARIA      │
┌─────────────────────┐          ├─────────────────────┤
│    TPL_ENCOMENDA    │          │ PK  idPortaria       │
├─────────────────────┤          │     nomePorteiro     │
│ PK  idEncomenda     │          │     turno            │
│     descricao       │          │     contato          │
│     dataRecebida    │          │     dataRegistro     │
│     status          │          └──────────┬──────────┘
│     tokenEncomenda  │                     │ 1:N
│     origem          │                     │
│     foiRetirada     │          ┌──────────▼──────────┐
│     retiradaEm      │          │    TPL_RETIRADA      │
│ FK  idMorador       │──────────►├─────────────────────┤
│ FK  idRetirada      │◄─────────│ PK  idRetirada       │
└─────────────────────┘ 1:1      │     dataRetirada     │
                                 │     tokenRetirada    │
                                 │ FK  idMorador        │
                                 │ FK  idPortaria       │
                                 └─────────────────────┘
```

### Tabelas Detalhadas

#### TPL_APARTAMENTO
| Coluna | Tipo | Descrição |
|---|---|---|
| idApartamento | INTEGER (PK) | Identificador único |
| torre | INTEGER | Número da torre |
| bloco | VARCHAR | Letra do bloco (A, B, C...) |
| numero | VARCHAR | Número do apartamento |

#### TPL_MORADOR
| Coluna | Tipo | Descrição |
|---|---|---|
| ID_MORADOR | INTEGER (PK) | Identificador único |
| nome | VARCHAR | Nome completo |
| email | VARCHAR | E-mail do morador |
| telefone | VARCHAR | Telefone (WhatsApp) |
| ID_APARTAMENTO | INTEGER (FK) | Referência ao apartamento |

#### TPL_ENCOMENDA
| Coluna | Tipo | Descrição |
|---|---|---|
| idEncomenda | INTEGER (PK) | Identificador único |
| descricao | VARCHAR | Descrição / observações |
| dataRecebida | DATE | Data/hora de chegada |
| status | VARCHAR | Status textual |
| TOKEN_ENCOMENDA | VARCHAR (UNIQUE) | Token de 5 chars para retirada |
| origem | VARCHAR | Transportadora (Correios, Shopee...) |
| RETIRADA | BOOLEAN | Se já foi retirada |
| RETIRADA_EM | TIMESTAMP | Data/hora da retirada |
| ID_MORADOR | INTEGER (FK) | Destinatário |
| ID_RETIRADA | INTEGER (FK) | Registro de retirada vinculado |

#### TPL_RETIRADA
| Coluna | Tipo | Descrição |
|---|---|---|
| idRetirada | INTEGER (PK) | Identificador único |
| dataRetirada | DATE | Data/hora da retirada |
| tokenRetirada | VARCHAR | Token da encomenda |
| ID_MORADOR | INTEGER (FK) | Morador que retirou |
| ID_PORTARIA | INTEGER (FK) | Portaria onde ocorreu |

#### TPL_PORTARIA
| Coluna | Tipo | Descrição |
|---|---|---|
| idPortaria | INTEGER (PK) | Identificador único |
| nomePorteiro | VARCHAR | Nome do porteiro |
| turno | VARCHAR | Turno (manhã/tarde/noite) |
| contato | VARCHAR | Contato do porteiro |
| dataRegistro | DATE | Data de cadastro |

#### TPL_USUARIO
| Coluna | Tipo | Descrição |
|---|---|---|
| ID_USUARIO | INTEGER (PK) | Identificador único |
| EMAIL | VARCHAR (UNIQUE) | E-mail do usuário |
| FIREBASE_UID | VARCHAR (UNIQUE) | UID do Firebase Auth |
| PERFIL | ENUM | ADMIN ou MORADOR |
| ID_MORADOR | INTEGER | Referência ao morador (se perfil MORADOR) |
| ID_PORTARIA | INTEGER | Referência à portaria (se perfil ADMIN) |

### Estratégia de IDs (sem Sequence Oracle)

Como o projeto usa IDs manuais (sem `@GeneratedValue`), o backend calcula o próximo ID com native query:

```sql
SELECT NVL(MAX(ID_ENCOMENDA), 0) + 1 FROM TPL_ENCOMENDA
SELECT NVL(MAX(ID_MORADOR),   0) + 1 FROM TPL_MORADOR
SELECT NVL(MAX(ID_USUARIO),   0) + 1 FROM TPL_USUARIO
SELECT NVL(MAX(ID_RETIRADA),  0) + 1 FROM TPL_RETIRADA
```

---

## 🔌 API REST — Endpoints

### Base URL
```
https://portaria-deploy.onrender.com
```

### Autenticação
Todos os endpoints (exceto `/auth/**` e Swagger) exigem header:
```
Authorization: Bearer <firebase-id-token>
```

---

### Auth

#### POST /auth/firebase-login
Autentica um usuário existente via token Firebase.

**Request Body:**
```json
{ "token": "<firebase-id-token>" }
```

**Response 200:**
```json
{
  "message": "Login bem-sucedido via Firebase.",
  "user": {
    "id": 1,
    "perfil": "ADMIN",
    "idMorador": "",
    "email": "porteiro@porteiro.com.br"
  }
}
```

**Response 404:** Usuário não existe no banco relacional.

---

#### POST /auth/firebase-register
Registra novo usuário. Cria automaticamente o morador no Oracle se o perfil for MORADOR.

**Request Body:**
```json
{
  "token": "<firebase-id-token>",
  "nome": "João Silva",
  "telefone": "11999999999",
  "apartamentoId": "102",
  "bloco": "A"
}
```

**Response 200:**
```json
{
  "message": "Usuário criado com sucesso no banco relacional.",
  "user": {
    "id": 5,
    "perfil": "MORADOR",
    "idMorador": 3,
    "email": "joao@gmail.com"
  }
}
```

---

### Moradores

#### GET /moradores
Lista todos os moradores.

**Response 200:**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "telefone": "11999999999",
    "email": "joao@morador.com.br",
    "bloco": "A",
    "apartamento": "102"
  }
]
```

#### POST /moradores
Cadastra novo morador. Roles: `ADMIN`, `PORTEIRO`.

**Request Body:**
```json
{
  "nome": "Maria Souza",
  "email": "maria@morador.com.br",
  "telefone": "11988888888",
  "apartamentoId": 203,
  "bloco": "B"
}
```

#### PUT /moradores/{id}
Atualiza dados de um morador.

#### DELETE /moradores/{id}
Remove um morador. Role: `ADMIN`.

---

### Encomendas

#### GET /encomendas
Lista todas as encomendas com dados do morador embutidos.

**Response 200:**
```json
[
  {
    "id": 1,
    "tokenEncomenda": "A4B1Z",
    "origem": "Mercado Livre",
    "descricao": "Caixa grande",
    "foiRetirada": false,
    "dataRecebida": "2025-05-19T14:30:00",
    "retiradaEm": null,
    "morador": {
      "id": 2,
      "nome": "João Silva"
    }
  }
]
```

#### GET /encomendas/token/{token}
Busca encomenda pelo token. Usado no fluxo de retirada.

**Response 200:** Mesmo objeto acima.
**Response 404:** Token não encontrado.

#### POST /encomendas
Registra nova encomenda. Gera token automático. Roles: `ADMIN`, `PORTEIRO`.

**Request Body:**
```json
{
  "moradorId": 2,
  "origem": "Shopee",
  "descricao": "Pacote pequeno"
}
```

**Response 201:** Encomenda com token gerado.

#### PUT /encomendas/{id}
Edita encomenda existente.

#### DELETE /encomendas/{id}
Remove encomenda. Role: `ADMIN`.

---

### Retiradas

#### POST /retiradas
Confirma retirada de encomenda pelo token. Roles: `ADMIN`, `PORTEIRO`.

**Request Body:**
```json
{
  "morador": "João Silva",
  "encomenda": "A4B1Z"
}
```

**Response 201:**
```json
{
  "id": 1,
  "dataRetirada": "2025-05-19T16:00:00",
  "tokenRetirada": "A4B1Z",
  "moradorId": 2,
  "encomendaId": 1
}
```

**Response 400:** Token inválido ou encomenda já retirada.

---

## 📖 Swagger UI

A documentação interativa da API está disponível em:

```
https://portaria-deploy.onrender.com/swagger-ui.html
```

Todos os endpoints são documentados com:
- Descrição do fluxo de negócio
- Request/Response bodies
- Códigos de resposta HTTP
- Requisito de autenticação Bearer

> **Nota:** O servidor Render.com pode entrar em modo de hibernação após inatividade. A primeira requisição pode demorar até 60 segundos (cold start). O app já trata isso com timeout de 60 segundos.

---

## 🐳 Deploy e Infraestrutura

### Backend — Render.com

```dockerfile
# Build multi-stage para imagem pequena e segura
FROM eclipse-temurin:21-jdk-alpine AS build
# Builda o JAR com Gradle
RUN ./gradlew bootJar -x test --no-daemon

FROM eclipse-temurin:21-jre-alpine
# Usuário não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Variáveis de Ambiente (Backend)

| Variável | Descrição |
|---|---|
| `DB_URL` | JDBC URL do Oracle (Azure) |
| `DB_USER` | Usuário do banco Oracle |
| `DB_PASS` | Senha do banco Oracle |
| `RABBITMQ_HOST` | Host do CloudAMQP |
| `RABBITMQ_USERNAME` | Usuário RabbitMQ |
| `RABBITMQ_PASSWORD` | Senha RabbitMQ |
| `RABBITMQ_VHOST` | Virtual Host RabbitMQ |
| `PORT` | Porta da aplicação (padrão: 8080) |

### CI/CD — Azure Pipelines

O projeto possui pipeline configurado em `azure-pipelines.yml` para build e deploy automático.

### Firebase (Autenticação + Firestore)

| Configuração | Valor |
|---|---|
| Projeto | `portaria-light` |
| Auth Domain | `portaria-light.firebaseapp.com` |
| Storage Bucket | `portaria-light.firebasestorage.app` |
| Coleção Firestore | `users/{uid}` — armazena `expoPushToken` |

---

## 🗺️ Roadmap

### ✅ Sprint 1 — Concluído
- [x] Configuração do projeto Expo + Expo Router
- [x] Autenticação Firebase (login + register)
- [x] CRUD de moradores
- [x] Registro de encomendas com token automático
- [x] Integração WhatsApp para notificação

### ✅ Sprint 2 — Concluído
- [x] Backend Spring Boot com Oracle DB
- [x] API REST completa (auth, moradores, encomendas, retiradas)
- [x] Integração Firebase Admin SDK no backend
- [x] RabbitMQ para mensageria assíncrona
- [x] Swagger UI documentado
- [x] Docker + Deploy no Render.com
- [x] Pipeline CI/CD Azure
- [x] Portal do morador (visualizar encomendas)
- [x] Painel Super Admin (gestão de equipe)
- [x] Push Notifications com expo-notifications
- [x] Validação de retirada por token

### ✅ Sprint 3 — Concluído
- [x] QR Code para retirada (alternativa ao token manual)
- [x] Histórico de retiradas com filtros por data
- [x] Relatórios exportáveis (PDF / Excel)
- [x] Notificações push automáticas (sem abertura do WhatsApp)
- [x] Modo offline com sincronização posterior
- [x] Autenticação biométrica no app

### ✅ Sprint 4 — Concluído
- [x] Build de produção Android gerado via EAS (Expo Application Services)
- [x] Distribuição do APK via Firebase App Distribution
- [x] Correção de assets (conversão PNG válido, estrutura assets/images/)
- [x] Atualização do EAS CLI e configuração de Keystore remota
- [x] Validação do pipeline completo de build e deploy mobile
- [x] Documentação técnica completa do projeto (mobile + backend + banco)

### 🔮 Futuro
- [ ] Versão iOS na App Store
- [ ] Painel web administrativo (React)
- [ ] Integração com câmera IP para registro automático de chegadas
- [ ] API de rastreamento automático por transportadora
- [ ] Multi-condomínio (SaaS)

---

## 🔒 Segurança

- **Autenticação:** Firebase Auth (OAuth2 / JWT)
- **Autorização:** Spring Security com roles (`ADMIN`, `MORADOR`)
- **Tokens:** Firebase ID Token verificado server-side pelo Firebase Admin SDK
- **CORS:** Configurado explicitamente para aceitar requisições do app mobile
- **Sessão:** Stateless (JWT — sem sessão no servidor)
- **Container:** Usuário não-root no Docker
- **Senhas:** BCrypt via Spring Security

---

## 📦 Como Rodar Localmente

### Mobile (React Native)

```bash
# Instalar dependências
npm install

# Iniciar Metro Bundler
npx expo start

# Rodar no Android (com dispositivo ou emulador conectado)
npx expo run:android

# Gerar APK de produção
eas build --platform android --profile production
```

### Backend (Spring Boot)

```bash
# Clonar e entrar na pasta
cd Portaria

# Configurar variáveis de ambiente (.env ou sistema operacional)
export DB_URL="jdbc:oracle:thin:@host:1521/service"
export DB_USER="usuario"
export DB_PASS="senha"
export RABBITMQ_HOST="host.cloudamqp.com"
# ... demais variáveis

# Build e run
./gradlew bootRun

# Ou via Docker
docker build -t portaria-app .
docker run -p 8080:8080 --env-file .env portaria-app
```

---

## 📊 Diagrama de Classes (Backend)

```
┌─────────────────────┐     ┌─────────────────────────┐
│   AuthController    │     │   EncomendaController   │
│ + firebaseLogin()   │     │ + listarTodas()         │
│ + firebaseRegister()│     │ + buscarPorToken()      │
└────────┬────────────┘     │ + criar()               │
         │                  │ + atualizar()           │
         ▼                  │ + deletar()             │
┌─────────────────────┐     └──────────┬──────────────┘
│  UsuarioRepository  │                │
│ + findByEmail()     │     ┌──────────▼──────────────┐
└─────────────────────┘     │    EncomendaService     │
                            │ + listarTodas()         │
┌─────────────────────┐     │ + salvar()              │
│  MoradorController  │     │ + atualizar()           │
│ + listarTodos()     │     │ + gerarToken()          │
│ + criar()           │     │ + preverTempoRetirada() │
│ + atualizar()       │     └──────────┬──────────────┘
│ + deletar()         │                │
└────────┬────────────┘     ┌──────────▼──────────────┐
         │                  │  EncomendaRepository    │
         ▼                  │ + findByTokenEncomenda()│
┌─────────────────────┐     └─────────────────────────┘
│   MoradorService    │
│ + listarTodos()     │     ┌─────────────────────────┐
│ + salvar()          │     │  RetiradaController     │
│ + atualizar()       │     │ + registrarRetirada()   │
│ + deletar()         │     └──────────┬──────────────┘
└─────────────────────┘                │
                            ┌──────────▼──────────────┐
                            │   RetiradaService       │
                            │ + registrarRetirada()   │
                            │   (valida token,        │
                            │    atualiza encomenda,  │
                            │    publica no RabbitMQ) │
                            └─────────────────────────┘
```

---

## 🐛 Tratamento de Erros Conhecidos

| Erro | Causa | Solução |
|---|---|---|
| Build falha: `image_modern_logo.png` | Arquivo JPEG com extensão .png | Converter para PNG real via Pillow |
| `getaddrinfo ENOTFOUND api.expo.dev` | Sem conexão com a internet | Verificar rede, `ipconfig /flushdns` |
| `ENOSPC: no space left on device` | Disco temporário cheio durante upload EAS | Mover projeto para fora de pastas grandes |
| `404` no login | Usuário no Firebase mas não no Oracle | Registrar novamente via `/auth/firebase-register` |
| Timeout na API | Servidor Render em cold start | App tem timeout de 60s, aguardar ou upgradear plano |
| Token JWT inválido | Token expirado (Firebase tokens duram 1h) | App renova automaticamente via `getIdToken()` |

---

*Documentação gerada em 19/05/2026 — Portaria Light v1.0.0*
