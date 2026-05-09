# CLAUDE.md

## Visão do projeto

Framily é um aplicativo gamificado de gestão doméstica/familiar. O produto combina organização de tarefas, missões, compras, contas, lembretes, pontuação, ranking, progresso visual e recompensas.

A direção visual é **dashboard moderno com foco em progresso e recompensas**, não jogo completo. Mensagens-chave da experiência:

- "Minha casa está evoluindo."
- "Minhas tarefas viram progresso."
- "Minhas missões me aproximam de recompensas."
- "Cada membro contribui para a evolução da família."

## Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript, Tailwind CSS, shadcn/ui, Motion for React, next-intl
- **Backend:** Laravel 11 (PHP 8.3)
- **Banco:** MySQL 8
- **Auth:** Laravel Sanctum (token API com abilities), proxy via API route Next.js → cookie httpOnly
- **Login social futuro:** Laravel Socialite (Google primeiro)
- **Internacionalização:** estrutura preparada para múltiplos idiomas; pt-BR inicial, en-US planejado
- **Visual gamificado futuro:** estrutura preparada para Rive
- **Ambiente local:** Docker (frontend, backend, nginx, mysql)
- **Editor:** VS Code

## Estrutura do monorepo

```
framily/
  frontend/   Next.js
  backend/    Laravel
  docker/     configs nginx/php/mysql
  docker-compose.yml
  README.md
  CLAUDE.md
  .env.example
  .gitignore
```

## Estratégia de implementação

O projeto deve ser implementado em fases. Não implementar tudo de uma vez sem validar a base. Priorizar entregas pequenas, funcionais e testáveis.

1. **Fundação** — monorepo, Docker, Next.js, Laravel, Sanctum base, layouts, i18n base
2. **Autenticação, casas e membros** — cadastro/login adultos, criação de casa, convites, login infantil (e-mail+senha e apelido+PIN), rota `/kids`
3. **Tarefas, missões e pontuação** — CRUD de tarefas e missões, dificuldades pré-prontas, aprovação adulta, PointTransaction
4. **Ranking, progresso e recompensas** — rankings, badges, recompensas, resgates
5. **Calendário, lembretes, contas e compras** — calendário agregado, lembretes, divisão de contas (adultos), listas de compras

## Regras gerais

- Priorizar código simples, legível e evolutivo.
- Não criar complexidade desnecessária.
- Manter separação clara entre frontend e backend.
- Manter nomes técnicos em inglês no código.
- Explicar decisões importantes antes de grandes mudanças.
- Preservar compatibilidade com Docker.
- Sempre considerar permissões por tipo de usuário.
- Preparar tudo para evolução futura sem superengenharia.

## Regras de domínio

- Uma casa pode ter múltiplos membros.
- Usuários podem ter papéis diferentes dentro da casa.
- Papéis iniciais: `owner`, `admin`, `adult` e `child`.
- Crianças têm login próprio supervisionado.
- Crianças podem acessar com **e-mail e senha** ou **apelido e PIN**.
- PIN infantil deve ser armazenado com **hash bcrypt**, nunca em texto puro.
- Crianças devem estar vinculadas a um adulto responsável (`GuardianChild`).
- Perfis infantis têm acesso reduzido.
- Crianças acessam uma área separada em `/kids`.
- Crianças não podem gerenciar contas, permissões ou configurações da casa.
- Tarefas e missões feitas por crianças podem exigir aprovação de adulto.
- Pontos podem ser **pendentes** ou **confirmados**.
- Recompensas podem exigir aprovação de adulto.
- O foco da gamificação é progresso, conquistas e recompensas (não jogo completo).

## Modelo de gamificação

### Dificuldades pré-prontas (seeders)

| Key | Nome (pt-BR) | Pontos base | Uso |
|---|---|---|---|
| `easy` | Fácil | 10 | tarefas rápidas e simples |
| `medium` | Médio | 25 | tarefas com mais esforço/atenção |
| `hard` | Difícil | 50 | tarefas demoradas e de maior responsabilidade |
| `challenge` | Desafio | 100 | missões grandes ou metas semanais |

A casa pode criar presets próprios (`difficulty_presets.household_id` preenchido) sem afetar globais.

### Tipos de missão

- `single_task` — tarefa única
- `recurring_task` — repetição
- `streak` — sequência de dias
- `count` — quantidade
- `collective` — coletiva da casa
- `custom` — configurada manualmente

### Pontos (PointTransaction)

Append-only, polimórfica via `source_type/source_id`. Status: `pending`, `confirmed`, `cancelled`. Total de pontos do usuário em escopo (semana/mês/total) = `SUM(points WHERE status='confirmed')`.

## Regras de frontend

- Usar **App Router**.
- Usar componentes reutilizáveis (`src/components/**`).
- Usar **shadcn/ui** como base do design system (`src/components/ui/`).
- Usar **Tailwind CSS** para estilização.
- Usar **Motion for React** para microinterações.
- Manter visual de dashboard moderno com elementos gamificados.
- Criar **área infantil separada** em `/kids` com layout próprio.
- Crianças têm experiência simplificada, lúdica, positiva.
- Priorizar visual de **progresso e recompensas**.
- Evitar poluição visual.
- **Não espalhar textos fixos** nos componentes — usar `next-intl` (`useTranslations`) sempre.
- Estrutura i18n desde o início (`src/messages/{locale}.json`).
- Tipos TypeScript em `src/types/`.
- Cliente HTTP em `src/lib/api/`.
- Token Sanctum **nunca exposto ao JS** — proxy via API route Next.js → cookie httpOnly.

## Regras de backend

- Laravel 11 seguindo boas práticas.
- Organização por domínio em `app/Domain/{Households,Tasks,Missions,...}` quando fizer sentido.
- Usar migrations, models, controllers, requests, resources e policies.
- Proteger rotas com **Sanctum** (`auth:sanctum`).
- **Abilities** em tokens: `adult`, `admin`, `child`. Middleware customizado garante separação adulto/criança.
- Validar entradas com **Form Requests**.
- Usar **Policies** para permissões.
- Preparar estrutura para **Socialite** sem implementar tudo prematuramente (campos `provider`/`provider_id` na tabela `users` desde o início).
- Criar testes (**Pest**) para fluxos principais.
- Mensagens de validação e erros padronizadas com chave de tradução (`message_key`).
- **PIN infantil** sempre via `Hash::make()` (bcrypt). Rate limiting agressivo.

## Antes de alterar

- Verificar impacto em **permissões** (Policies).
- Verificar impacto em **autenticação** (Sanctum + abilities).
- Verificar impacto no **fluxo infantil** (`/kids`, login PIN, rate limiting).
- Verificar impacto em **relações entre entidades**.
- Verificar impacto em **i18n** (chaves novas em `pt-BR.json`).
- Atualizar documentação quando necessário (este arquivo + README).

## Comandos rápidos

```bash
# Subir tudo
docker compose up -d --build

# Backend
docker compose exec backend composer install
docker compose exec backend php artisan migrate --seed
docker compose exec backend php artisan test
docker compose exec backend ./vendor/bin/pint

# Frontend
docker compose exec frontend npm install
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

URLs locais: frontend `http://localhost:3000` · API `http://localhost:8000/api` · MySQL `localhost:3306`.
