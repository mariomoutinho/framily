# Framily

Aplicativo gamificado de gestão de casa/família. Combina organização de tarefas, missões, compras, contas, lembretes, pontuação, ranking e recompensas em um dashboard moderno com foco em **progresso e recompensas**.

> Aviso: este é o repositório-base da Fase 1 (fundação). Os módulos de domínio são implementados nas fases seguintes — veja a seção [Estratégia de fases](#estratégia-de-fases).

---

## Sumário

- [Stack](#stack)
- [Requisitos](#requisitos)
- [Como rodar com Docker](#como-rodar-com-docker)
- [URLs locais](#urls-locais)
- [Comandos úteis](#comandos-úteis)
- [Arquitetura](#arquitetura)
- [Estratégia de fases](#estratégia-de-fases)
- [Autenticação](#autenticação)
- [Login infantil e rota /kids](#login-infantil-e-rota-kids)
- [Internacionalização](#internacionalização)
- [Extensões recomendadas para VS Code](#extensões-recomendadas-para-vs-code)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript, Tailwind CSS, shadcn/ui, Motion for React, next-intl |
| Backend | Laravel 11 (PHP 8.3) |
| Banco | MySQL 8 |
| Auth | Laravel Sanctum (token + abilities) com proxy via API route Next.js → cookie httpOnly |
| Login social (futuro) | Laravel Socialite (Google primeiro) |
| Visual gamificado (futuro) | Rive |
| Infra local | Docker Compose |

## Requisitos

- Docker 24+ e Docker Compose v2
- Git
- Make opcional
- (Opcional, sem Docker) Node 20+, PHP 8.3+, Composer 2+, MySQL 8+

## Como rodar com Docker

```bash
git clone <repo> framily
cd framily

# Variáveis de ambiente
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Subir os containers
docker compose up -d --build

# Instalar dependências (primeira vez)
docker compose exec backend composer install
docker compose exec frontend npm install

# Backend: chave + migrations + seeders
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate --seed
```

Pronto. Acesse:

- Frontend: http://localhost:3000
- Health check da API: http://localhost:8000/api/health

## URLs locais

| Serviço | URL |
|---|---|
| Frontend Next.js | http://localhost:3000 |
| Backend Laravel (via nginx) | http://localhost:8000 |
| API base | http://localhost:8000/api |
| MySQL | localhost:3306 (user `framily`, db `framily`) |

## Comandos úteis

### Backend

```bash
docker compose exec backend composer install
docker compose exec backend php artisan migrate
docker compose exec backend php artisan migrate:fresh --seed
docker compose exec backend php artisan db:seed
docker compose exec backend php artisan test
docker compose exec backend ./vendor/bin/pint        # formatação
docker compose exec backend ./vendor/bin/phpstan analyse  # opcional
```

### Frontend

```bash
docker compose exec frontend npm install
docker compose exec frontend npm run dev    # já roda no entrypoint
docker compose exec frontend npm run build
docker compose exec frontend npm run lint
docker compose exec frontend npm run format
```

### Acessar o banco

```bash
docker compose exec mysql mysql -u framily -pframily framily
```

## Arquitetura

```
framily/
├── frontend/          Next.js (App Router)
│   ├── src/app/
│   │   ├── (public)/  rotas públicas (login, register, landing)
│   │   ├── (app)/     rotas autenticadas adultas (dashboard, tasks, ...)
│   │   └── kids/      rotas infantis (login próprio + dashboard simplificado)
│   ├── src/components/
│   │   ├── ui/                shadcn/ui
│   │   ├── layout/            sidebar/topbar/kids topbar
│   │   ├── gamification/      PointsCard, MissionCard, BadgeCard, ...
│   │   └── feedback/          Empty/Loading/Error
│   ├── src/lib/api/           cliente HTTP + auth helpers
│   ├── src/messages/          traduções pt-BR.json, en-US.json
│   └── src/types/             tipos das entidades
│
├── backend/           Laravel (organização por domínio)
│   ├── app/Domain/
│   │   ├── Auth/          AuthController, ChildAuthController
│   │   ├── Households/    Household, HouseholdMember, Invite
│   │   ├── Tasks/         Task, TaskAssignment, TaskCompletion
│   │   ├── Missions/      Mission, MissionTemplate, ...
│   │   ├── Gamification/  DifficultyPreset, PointTransaction, Achievement
│   │   ├── Rewards/       Reward, RewardRedemption
│   │   ├── Calendar/      Reminder
│   │   ├── Bills/         Bill, BillSplit
│   │   └── Shopping/      ShoppingList, ShoppingItem
│   ├── app/Http/{Controllers,Requests,Resources,Middleware}/
│   ├── app/Policies/
│   ├── routes/api.php
│   ├── database/{migrations,seeders,factories}/
│   └── lang/{pt_BR,en}/
│
└── docker/            configs nginx/php/mysql
```

## Estratégia de fases

| Fase | Escopo | Status |
|---|---|---|
| **1. Fundação** | Monorepo, Docker, Next.js, Laravel, Sanctum base, layouts, i18n | ✅ atual |
| 2. Auth + Casas + Membros | Cadastro/login adultos, criação de casa, convites, login infantil, `/kids` | 🔜 |
| 3. Tarefas + Missões + Pontuação | CRUD tarefas/missões, dificuldades, aprovação adulta, PointTransaction | 🔜 |
| 4. Ranking + Progresso + Recompensas | Rankings, badges, recompensas, resgates | 🔜 |
| 5. Calendário + Lembretes + Contas + Compras | Calendário agregado, lembretes, contas, compras | 🔜 |

## Autenticação

- **Sanctum** com tokens API (não SPA cookie mode — frontend e backend rodam em domínios separados no Docker).
- Tokens têm **abilities**: `adult`, `admin`, `child`. Middleware separa rotas adultas e infantis.
- Frontend chama API routes Next.js (`/api/auth/*`) que fazem proxy para Laravel e armazenam o token em **cookie httpOnly** — token nunca chega ao JS.
- Login social futuro via **Socialite** (rotas reservadas em `/api/auth/social/{provider}/{redirect|callback}`, campos `provider`/`provider_id` já existem em `users`).

## Login infantil e rota /kids

- Crianças têm **login próprio**, vinculadas obrigatoriamente a um adulto responsável (`GuardianChild`).
- **Duas formas de login** (ambas suportadas):
  1. **E-mail + senha** próprios.
  2. **Apelido + PIN** (apelido único por casa, PIN com hash bcrypt). Login mais simples, ideal para crianças mais novas.
- A área infantil tem layout próprio em `/kids`:
  - `/kids/login` — toggle entre os dois métodos
  - `/kids` — dashboard simplificado (tarefas do dia, missões ativas, pontos, próxima recompensa, badges)
- Permissões reduzidas via Policies: criança não vê contas/despesas, não gerencia casa, mas pode concluir tarefas/missões e solicitar recompensas (com aprovação adulta).

## Internacionalização

- **Frontend:** `next-intl` integrado ao App Router. Arquivos em `frontend/src/messages/{locale}.json` por namespace (`common`, `auth`, `tasks`, `missions`, `kids`, `rewards`, `errors`). Locale default: `pt-BR`. Estrutura preparada para `en-US`.
- **Backend:** Laravel `lang/pt_BR/` e `lang/en/`. Form Requests retornam mensagens com `__()`. Erros padronizados com `message_key` para o frontend traduzir.
- **Regra:** nunca espalhe textos fixos nos componentes — sempre via `useTranslations()`.

## Extensões recomendadas para VS Code

Veja [`.vscode/extensions.json`](.vscode/extensions.json). Lista:

- Docker (`ms-azuretools.vscode-docker`)
- Dev Containers (`ms-vscode-remote.remote-containers`)
- PHP Intelephense (`bmewburn.vscode-intelephense-client`)
- Laravel Extension Pack (`onecentlin.laravel-extension-pack`)
- Laravel Pint (`open-southeners.laravel-pint`)
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- Thunder Client (`rangav.vscode-thunder-client`) ou REST Client (`humao.rest-client`)
- MySQL (`cweijan.vscode-mysql-client2`)
- GitLens (`eamodio.gitlens`)
- Error Lens (`usernamehw.errorlens`)
- i18n Ally (`lokalise.i18n-ally`)

## Licença

A definir.
