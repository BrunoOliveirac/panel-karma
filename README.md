# Karma Panel

Painel administrativo web desenvolvido como projeto de estudo. Este repositório contém apenas a **interface** (frontend); os dados vêm de uma API externa ([functions-karma](https://github.com/BrunoOliveirac/functions-kizuna)).

[Português (pt-BR)](#português-pt-br) · [English](#english)

---

## Português (pt-BR)

### Sumário

- [O que é este projeto?](#o-que-é-este-projeto)
- [Tipos de usuário e acessos](#tipos-de-usuário-e-acessos)
- [O que já funciona](#o-que-já-funciona)
- [Autenticação e sessão](#autenticação-e-sessão)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar localmente](#como-rodar-localmente)
- [Scripts disponíveis](#scripts-disponíveis)
- [Testes automatizados](#testes-automatizados)
- [Estrutura resumida](#estrutura-resumida)
- [Observações para recrutadores](#observações-para-recrutadores)

### O que é este projeto?

O **Karma Panel** é uma aplicação web que simula um painel de gestão — o tipo de sistema que empresas usam para cadastrar e consultar informações internas.

Este repositório foi criado para **praticar e demonstrar** habilidades de desenvolvimento frontend: organização de código, formulários, listagens com filtros e paginação, autenticação, controle de acesso por perfil, internacionalização e testes automatizados.

> **Importante:** trata-se de um projeto de estudo, não de um produto final. A estrutura do painel prevê várias áreas (home, CRM, chat, dashboard), mas **apenas alguns fluxos estão implementados de ponta a ponta** no momento.

### Tipos de usuário e acessos

Existem quatro perfis. Depois do login, cada um cai em uma tela inicial diferente e só vê as rotas permitidas para o seu tipo:

| Perfil | Tela inicial | Papel no sistema |
| ------ | ------------ | ---------------- |
| **Admin** | `/dashboard` | Administra a equipe de suporte |
| **Usuário** | `/home` | Dono da conta: gerencia o CRM e os membros da equipe |
| **Membro** | `/clients` | Colaborador vinculado a um usuário; acessa o CRM, sem gerenciar membros |
| **Suporte** | `/chat` | Atendimento (tela ainda em construção) |

#### Matriz de acesso

| Recurso | Admin | Usuário | Membro | Suporte |
| ------- | :---: | :-----: | :----: | :-----: |
| **Perfil** | Sim | Sim | Sim | Sim |
| **Notificações** | Sim | Sim | Sim | Sim |
| **Suportes** | Sim | — | — | — |
| **Membros** | — | Sim | — | — |
| **Clientes** | — | Sim | Sim | — |
| **Projetos** | — | Sim | Sim | — |
| **Setores** | — | Sim | Sim | — |
| **Dashboard** | Placeholder | — | — | — |
| **Home** | — | Placeholder | — | — |
| **Chat** | — | — | — | Placeholder |

Login e cadastro são públicos. O cadastro sempre cria uma conta do tipo **Usuário**.

### O que já funciona

#### Todos os usuários autenticados

Recursos disponíveis para **Admin**, **Usuário**, **Membro** e **Suporte**:

| Fluxo | O que dá para fazer |
| ----- | ------------------- |
| **Perfil** | Ver e editar nome, e-mail e senha; enviar, recortar ou remover avatar |
| **Notificações** | Centro de notificações com busca, abas (todas / não lidas / lidas), contadores, carregar mais, marcar como lida (uma ou todas) e excluir. O sino no topo mostra as últimas notificações e atualiza em tempo real (SSE) |

A aplicação também tem **login**, **cadastro** (com checklist de força da senha), **vários idiomas** (português Brasil/Portugal, inglês, espanhol e romeno) e **tema claro/escuro**.

#### Admin

| Fluxo | O que dá para fazer |
| ----- | ------------------- |
| **Suportes** | Listar, buscar, paginar, cadastrar, editar, validar e-mail, ativar/desativar, trocar senha e excluir usuários de suporte |

#### Usuário

| Fluxo | O que dá para fazer |
| ----- | ------------------- |
| **Clientes** | Listar em cards (todas / favoritas), buscar, paginar, cadastrar e editar (nome, e-mail, telefone, orçamento, setor, observações), favoritar e excluir |
| **Projetos** | Listar, buscar, filtrar por cliente, paginar, cadastrar, editar, ativar/desativar e excluir |
| **Setores** | Listar, buscar, paginar, cadastrar, editar, ativar/desativar e excluir |
| **Membros** | Listar membros vinculados, buscar, paginar, criar membro, vincular um usuário existente por e-mail, gerenciar projetos do membro e desvincular |

#### Membro

Mesmos fluxos de **Clientes**, **Projetos** e **Setores** do usuário. **Não** acessa a gestão de membros nem a home do dono da conta.

#### Suporte

A tela de chat (`/chat`) ainda é um placeholder. O suporte já acessa **perfil** e **notificações**.

#### Telas ainda em construção

Dashboard (admin), home (usuário) e chat (suporte) existem na navegação, mas ainda não têm fluxo completo.

### Autenticação e sessão

- O token fica em cookie **httpOnly** e vale até a **meia-noite** do dia do login.
- Após **3 horas de inatividade**, a sessão é encerrada automaticamente.
- O logout revoga o token na API.
- Tentativas inválidas de login e conta bloqueada (muitas falhas) são tratadas na tela.

### Tecnologias utilizadas

Em termos simples, o projeto foi construído com:

- **[Next.js](https://nextjs.org/)** e **[React](https://react.dev/)** — base da interface web
- **[TypeScript](https://www.typescriptlang.org/)** — JavaScript com tipagem, para reduzir erros
- **[Tailwind CSS](https://tailwindcss.com/)** — estilização visual
- **[React Query](https://tanstack.com/query)** — busca e atualização de dados da API
- **[Jest](https://jestjs.io/)** — testes unitários de componentes
- **[Playwright](https://playwright.dev/)** — testes end-to-end (simulam o uso real no navegador)

### Pré-requisitos

Antes de rodar o projeto, você precisa ter instalado:

1. **[Node.js](https://nodejs.org/)** (versão LTS recomendada — 20 ou superior)
2. **[npm](https://www.npmjs.com/)** (já vem com o Node.js)
3. Uma **API backend** rodando e acessível — por padrão em `http://localhost:8080`

> A API **não faz parte deste repositório**. Sem ela, as telas abrem, mas login e as operações não funcionarão.

### Como rodar localmente

**1. Clone o repositório**

```bash
git clone https://github.com/BrunoOliveirac/panel-karma.git
cd panel-karma
```

**2. Instale as dependências**

```bash
npm install
```

**3. (Opcional) Configure a URL da API**

Se a API não estiver em `http://localhost:8080`, crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_API_URL=http://endereco-da-sua-api:porta
```

**4. Inicie o servidor de desenvolvimento**

```bash
npm run dev
```

**5. Abra no navegador**

Acesse [http://localhost:3000](http://localhost:3000).

### Scripts disponíveis

| Comando | Descrição |
| ------- | --------- |
| `npm run dev` | Inicia o projeto em modo de desenvolvimento |
| `npm run build` | Gera a versão otimizada para produção |
| `npm run start` | Roda a versão de produção (requer `build` antes) |
| `npm run lint` | Verifica problemas de código |
| `npm test` | Executa os testes unitários (Jest) |
| `npm run watch:e2e` | Abre a interface do Playwright para rodar testes e2e |

### Testes automatizados

- **Testes unitários:** validam componentes isolados (formulários, listagens, etc.).
- **Testes e2e:** abrem o navegador de verdade e simulam cliques, preenchimento de campos e navegação. Há suites por domínio (auth, clientes, setores, projetos, suportes, membros, perfil e acesso por perfil).

Para os testes e2e, o servidor precisa estar rodando (`npm run dev`) em outro terminal:

```bash
npx playwright test
```

Na primeira execução, instale os navegadores do Playwright:

```bash
npx playwright install
```

### Estrutura resumida

```
panel-karma/
├── src/
│   ├── app/          # Páginas e rotas (App Router)
│   ├── components/   # Layout, UI e componentes globais
│   └── lib/          # Serviços, validações, hooks e utilitários
├── e2e/              # Testes end-to-end (Playwright)
├── messages/         # Traduções (i18n)
└── public/           # Imagens e ícones estáticos
```

As chamadas à API passam por rotas internas (`/api/backend` e `/api/notifications/stream`), que encaminham o token de sessão.

### Observações para recrutadores

- O foco deste repositório é **frontend**: interface, experiência do usuário, validação de formulários, controle de acesso por perfil e testes.
- O escopo é **intencionalmente limitado** — fluxos completos em um projeto de estudo já permitem avaliar organização de código, padrões adotados e qualidade dos testes.
- Os testes automatizados (unitários e e2e) demonstram preocupação com **confiabilidade** e **manutenção** do código.

---

## English

### Contents

- [What is this project?](#what-is-this-project)
- [User types and access](#user-types-and-access)
- [What works today](#what-works-today)
- [Authentication and session](#authentication-and-session)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [How to run locally](#how-to-run-locally)
- [Available scripts](#available-scripts)
- [Automated tests](#automated-tests)
- [Folder overview](#folder-overview)
- [Notes for recruiters](#notes-for-recruiters)

### What is this project?

**Karma Panel** is a web application that simulates a management dashboard — the kind of system companies use to register and browse internal data.

This repository was built to **practice and showcase** frontend development skills: code organization, forms, searchable paginated lists, authentication, role-based access, internationalization, and automated testing.

> **Note:** this is a study project, not a finished product. The panel layout includes several areas (home, CRM, chat, dashboard), but **only a few flows are fully implemented end to end** at the moment.

### User types and access

There are four roles. After login, each one lands on a different home screen and can only open the routes allowed for that type:

| Role | Home screen | Role in the system |
| ---- | ----------- | ------------------ |
| **Admin** | `/dashboard` | Manages the support staff |
| **User** | `/home` | Account owner: manages the CRM and team members |
| **Member** | `/clients` | Collaborator linked to a user; can use the CRM, but cannot manage members |
| **Support** | `/chat` | Support desk (screen still a placeholder) |

#### Access matrix

| Feature | Admin | User | Member | Support |
| ------- | :---: | :--: | :----: | :-----: |
| **Profile** | Yes | Yes | Yes | Yes |
| **Notifications** | Yes | Yes | Yes | Yes |
| **Support staff** | Yes | — | — | — |
| **Members** | — | Yes | — | — |
| **Clients** | — | Yes | Yes | — |
| **Projects** | — | Yes | Yes | — |
| **Sectors** | — | Yes | Yes | — |
| **Dashboard** | Placeholder | — | — | — |
| **Home** | — | Placeholder | — | — |
| **Chat** | — | — | — | Placeholder |

Login and registration are public. Registration always creates a **User** account.

### What works today

#### All authenticated users

Available to **Admin**, **User**, **Member**, and **Support**:

| Flow | What you can do |
| ---- | --------------- |
| **Profile** | View and update name, email, and password; upload, crop, or remove an avatar |
| **Notifications** | Notification center with search, tabs (all / unread / read), counts, load more, mark as read (one or all), and delete. The top-bar bell shows the latest items and refreshes in real time (SSE) |

The app also includes **login**, **registration** (with a live password-strength checklist), **multiple languages** (Brazilian/European Portuguese, English, Spanish, and Romanian), and **light/dark theme**.

#### Admin

| Flow | What you can do |
| ---- | --------------- |
| **Support staff** | List, search, paginate, create, edit, validate email, activate/deactivate, change password, and delete support users |

#### User

| Flow | What you can do |
| ---- | --------------- |
| **Clients** | Card grid (all / favorites), search, paginate, create and edit (name, email, phone, budget, sector, notes), favorite, and delete |
| **Projects** | List, search, filter by client, paginate, create, edit, activate/deactivate, and delete |
| **Sectors** | List, search, paginate, create, edit, activate/deactivate, and delete |
| **Members** | List linked members, search, paginate, create a member, link an existing user by email, manage the member's projects, and unlink |

#### Member

Same **Clients**, **Projects**, and **Sectors** flows as the user. Members **cannot** manage other members or open the account owner's home page.

#### Support

The chat screen (`/chat`) is still a placeholder. Support users already have **profile** and **notifications**.

#### Screens still in progress

Dashboard (admin), home (user), and chat (support) appear in navigation but do not have a complete flow yet.

### Authentication and session

- The token is stored in an **httpOnly** cookie and lasts until **midnight** on the login day.
- After **3 hours of inactivity**, the session ends automatically.
- Logout revokes the token on the API.
- Invalid credentials and locked accounts (too many failed attempts) are handled on the login screen.

### Tech stack

In plain terms, the project uses:

- **[Next.js](https://nextjs.org/)** and **[React](https://react.dev/)** — web UI foundation
- **[TypeScript](https://www.typescriptlang.org/)** — typed JavaScript for fewer runtime errors
- **[Tailwind CSS](https://tailwindcss.com/)** — visual styling
- **[React Query](https://tanstack.com/query)** — fetching and updating API data
- **[Jest](https://jestjs.io/)** — unit tests for components
- **[Playwright](https://playwright.dev/)** — end-to-end tests (real browser automation)

### Prerequisites

Before running the project, you need:

1. **[Node.js](https://nodejs.org/)** (LTS recommended — version 20 or newer)
2. **[npm](https://www.npmjs.com/)** (bundled with Node.js)
3. A **backend API** up and running — by default at `http://localhost:8080`

> The API is **not included in this repository**. Without it, pages load but login and operations will not work.

### How to run locally

**1. Clone the repository**

```bash
git clone https://github.com/BrunoOliveirac/panel-karma.git
cd panel-karma
```

**2. Install dependencies**

```bash
npm install
```

**3. (Optional) Set the API URL**

If the API is not at `http://localhost:8080`, create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_API_URL=http://your-api-host:port
```

**4. Start the development server**

```bash
npm run dev
```

**5. Open in your browser**

Visit [http://localhost:3000](http://localhost:3000).

### Available scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Starts the app in development mode |
| `npm run build` | Builds the optimized production bundle |
| `npm run start` | Runs the production build (run `build` first) |
| `npm run lint` | Checks code quality |
| `npm test` | Runs unit tests (Jest) |
| `npm run watch:e2e` | Opens the Playwright UI for e2e tests |

### Automated tests

- **Unit tests:** validate isolated components (forms, lists, etc.).
- **E2e tests:** open a real browser and simulate clicks, form input, and navigation. Suites are grouped by domain (auth, clients, sectors, projects, supports, members, profile, and role-based access).

For e2e tests, the dev server must be running (`npm run dev`) in another terminal:

```bash
npx playwright test
```

On first run, install Playwright browsers:

```bash
npx playwright install
```

### Folder overview

```
panel-karma/
├── src/
│   ├── app/          # Pages and routes (App Router)
│   ├── components/   # Layout, UI, and global components
│   └── lib/          # Services, validators, hooks, and utilities
├── e2e/              # End-to-end tests (Playwright)
├── messages/         # Translations (i18n)
└── public/           # Static images and icons
```

API calls go through internal routes (`/api/backend` and `/api/notifications/stream`), which forward the session token.

### Notes for recruiters

- This repository focuses on **frontend**: UI, user experience, form validation, role-based access, and testing.
- The scope is **intentionally limited** — complete flows in a study project are enough to assess code organization, patterns, and test quality.
- Automated tests (unit and e2e) show attention to **reliability** and **maintainability**.

---

## Licença

Projeto de estudo — consulte o autor para uso e referência.
