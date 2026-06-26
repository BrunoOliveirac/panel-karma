# Karma Panel

Painel administrativo web desenvolvido como projeto de estudo. Este repositório contém apenas a **interface** (frontend); os dados são buscados em uma API externa.

---

## Português (pt-BR)

### O que é este projeto?

O **Karma Panel** é uma aplicação web que simula um painel de gestão — o tipo de sistema que empresas usam para cadastrar e consultar informações internas.

Este repositório foi criado para **praticar e demonstrar** habilidades de desenvolvimento frontend: organização de código, formulários, listagens com filtros e paginação, autenticação, internacionalização e testes automatizados.

> **Importante:** trata-se de um projeto de estudo, não de um produto final. A estrutura do painel prevê várias áreas (home, CRM, chat, dashboard), mas **apenas alguns fluxos estão implementados de ponta a ponta** no momento.

### O que já funciona?

Os fluxos implementados variam conforme o tipo de usuário:

#### Admin

| Fluxo        | O que dá para fazer                                                                           |
| ------------ | --------------------------------------------------------------------------------------------- |
| **Suportes** | Listar, buscar, paginar, cadastrar, editar, ativar/desativar, trocar senha e excluir suportes |

#### Usuário

| Fluxo        | O que dá para fazer                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| **Clientes** | Listar, buscar, paginar, cadastrar e editar clientes                                                 |
| **Setores**  | Listar, buscar, paginar, cadastrar e editar e ativar/desativar setores                               |
| **Projetos** | Listar, buscar, filtrar por cliente, paginar, cadastrar, editar, ativar/desativar e excluir projetos |

#### Suporte

| Fluxo | O que dá para fazer |
| ----- | ------------------- |

Além disso, a aplicação possui telas de **login** e **cadastro**, suporte a **vários idiomas** (português, inglês, espanhol, etc.) e **tema claro/escuro**.

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

| Comando             | Descrição                                            |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Inicia o projeto em modo de desenvolvimento          |
| `npm run build`     | Gera a versão otimizada para produção                |
| `npm run start`     | Roda a versão de produção (requer `build` antes)     |
| `npm run lint`      | Verifica problemas de código                         |
| `npm test`          | Executa os testes unitários (Jest)                   |
| `npm run watch:e2e` | Abre a interface do Playwright para rodar testes e2e |

### Testes automatizados

- **Testes unitários:** validam componentes isolados (formulários, listagens, etc.).
- **Testes e2e:** abrem o navegador de verdade e simulam cliques, preenchimento de campos e navegação.

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
├── src/              # Código-fonte da aplicação
│   ├── app/          # Páginas e rotas
│   ├── components/   # Componentes reutilizáveis (botões, inputs, etc.)
│   └── lib/          # Serviços, validações, hooks e utilitários
├── e2e/              # Testes end-to-end (Playwright)
├── messages/         # Traduções (i18n)
└── public/           # Imagens e ícones estáticos
```

### Observações para recrutadores

- O foco deste repositório é **frontend**: interface, experiência do usuário, validação de formulários e testes.
- O escopo é **intencionalmente limitado** — fluxos completos em um projeto de estudo já permitem avaliar organização de código, padrões adotados e qualidade dos testes.
- Os testes automatizados (unitários e e2e) demonstram preocupação com **confiabilidade** e **manutenção** do código.

---

## English

### What is this project?

**Karma Panel** is a web application that simulates a management dashboard — the kind of system companies use to register and browse internal data.

This repository was built to **practice and showcase** frontend development skills: code organization, forms, searchable paginated lists, authentication, internationalization, and automated testing.

> **Note:** this is a study project, not a finished product. The panel layout includes several areas (home, CRM, chat, dashboard), but **only a few flows are fully implemented end to end** at the moment.

### What works today?

Implemented flows vary by user type:

#### Admin

| Flow              | What you can do                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Support staff** | List, search, paginate, create, edit, validate email, activate/deactivate, change password, and delete support users |

#### User

| Flow         | What you can do                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------ |
| **Clients**  | List, search, paginate, create, and edit clients                                                 |
| **Sectors**  | List, search, paginate, create, edit, and activate/deactivate sectors                            |
| **Projects** | List, search, filter by client, paginate, create, edit, activate/deactivate, and delete projects |

#### Support

| Flow | What you can do |
| ---- | --------------- |

The app also includes **login** and **registration** screens, **multiple languages** (Portuguese, English, Spanish, etc.), and **light/dark theme** support.

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

| Command             | Description                                   |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Starts the app in development mode            |
| `npm run build`     | Builds the optimized production bundle        |
| `npm run start`     | Runs the production build (run `build` first) |
| `npm run lint`      | Checks code quality                           |
| `npm test`          | Runs unit tests (Jest)                        |
| `npm run watch:e2e` | Opens the Playwright UI for e2e tests         |

### Automated tests

- **Unit tests:** validate isolated components (forms, lists, etc.).
- **E2e tests:** open a real browser and simulate clicks, form input, and navigation.

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
├── src/              # Application source code
│   ├── app/          # Pages and routes
│   ├── components/   # Reusable UI components (buttons, inputs, etc.)
│   └── lib/          # Services, validators, hooks, and utilities
├── e2e/              # End-to-end tests (Playwright)
├── messages/         # Translations (i18n)
└── public/           # Static images and icons
```

### Notes for recruiters

- This repository focuses on **frontend**: UI, user experience, form validation, and testing.
- The scope is **intentionally limited** — complete flows in a study project are enough to assess code organization, patterns, and test quality.
- Automated tests (unit and e2e) show attention to **reliability** and **maintainability**.

---

## Licença

Projeto de estudo — consulte o autor para uso e referência.
