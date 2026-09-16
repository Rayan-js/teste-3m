# Portal de tickets de suporte

Teste técnico. Portal interno de chamados: o funcionário abre o ticket, o time de suporte acompanha, filtra e movimenta pelo fluxo de status.

Backend em FastAPI com SQLite, frontend em React com TypeScript.

## Rodando o projeto

Precisa de Python 3.11+ e Node 18+.

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Linux / macOS

pip install -r requirements-dev.txt
python -m app.seed            # opcional, cria 12 tickets de exemplo
uvicorn app.main:app --reload
```

A API sobe em http://127.0.0.1:8000 e o Swagger fica em `/docs`. O banco (`tickets.db`) é criado sozinho na primeira execução. Para recriar os dados de exemplo: `python -m app.seed --reset`.

**Frontend**, em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre em http://localhost:5173. O Vite já faz proxy de `/api` para o backend, então não precisa configurar nada.

**Testes**: `pytest` dentro de `backend` (45 testes, cobrindo a API e o fluxo de status). No frontend, `npm run build` roda a checagem de tipos junto com o build.

As variáveis de ambiente são todas opcionais, estão nos `.env.example`: `DATABASE_URL` e `CORS_ORIGINS` no backend, `VITE_API_URL` no frontend (só é necessária se você não usar o proxy do Vite).

## Organização

```
backend/
  app/
    main.py        criação do app, CORS, rotas
    config.py      configuração por variável de ambiente
    database.py    engine e sessão
    errors.py      erro de domínio -> status HTTP
    seed.py        dados de exemplo
    domain/        regras de negócio (enums, fluxo de status, exceções)
    models/        tabelas
    schemas/       entrada e saída da API
    services/      criar, listar, detalhar, mudar status
    routers/       endpoints
  tests/
frontend/
  src/
    api/           cliente HTTP e chamadas da API
    components/    tabela, filtros, badges, histórico, estados de tela
    constants/     rótulos em português e opções dos filtros
    hooks/         carregamento assíncrono e parâmetros da listagem
    pages/         listagem, detalhe, novo ticket
    types/         tipos espelhando os contratos da API
```

No backend o caminho é sempre `router -> service -> model`. O router só cuida de HTTP (parâmetros, status code, serialização) e o service executa o caso de uso. O que é regra de negócio de verdade (quais transições de status valem, o peso de cada prioridade) fica em `domain/`, sem depender de framework, o que deixa o teste dessa parte bem direto.

## API

Tudo sob `/api`, JSON, datas em UTC no formato ISO.

| Método | Rota | O que faz | Erros |
|---|---|---|---|
| `GET` | `/tickets` | Lista com filtros, ordenação e paginação | 422 |
| `POST` | `/tickets` | Cria o ticket (201 + header `Location`) | 422 |
| `GET` | `/tickets/{id}` | Detalhe com histórico e próximos status válidos | 404 |
| `PATCH` | `/tickets/{id}/status` | Avança o status | 404, 409, 422 |
| `GET` | `/health` | Healthcheck | |

Filtros do `GET /tickets`: `status` (`open`, `in_progress`, `resolved`, `closed`), `category` (`it`, `facilities`, `hr`, `finance`, `other`) e `priority` (`low`, `medium`, `high`, `urgent`). Ordenação com `sort_by` (`created_at` ou `priority`) e `order` (`asc` ou `desc`), padrão mais recentes primeiro. Paginação com `page` e `page_size`.

Criando um ticket:

```http
POST /api/tickets

{
  "title": "Notebook não liga",
  "description": "A luz de energia pisca e depois apaga.",
  "category": "it",
  "priority": "urgent"
}
```

A resposta traz o ticket, o `history` (a criação já entra como `null -> open`) e `allowed_transitions`, que é a lista de status para onde aquele ticket pode ir a partir de agora. Mudar o status é um `PATCH /api/tickets/{id}/status` com `{"status": "in_progress"}`.

Erro de negócio vem como `{"detail": "mensagem"}` e erro de validação vem no formato padrão do FastAPI, com a lista dos campos inválidos.

## Decisões

**FastAPI.** A maior parte do trabalho aqui é validar entrada e devolver JSON, que é justamente onde o Pydantic resolve quase tudo sozinho. De quebra o Swagger sai de graça, o que ajuda a testar a API sem Postman. Django traria admin, templates e ORM próprio que eu não ia usar.

**SQLite com SQLAlchemy.** Escolhi pensando em quem vai avaliar: clona, instala e roda, sem subir serviço nenhum. Como o acesso todo passa pelo SQLAlchemy, migrar para Postgres é trocar a `DATABASE_URL` e o driver. Cheguei a considerar salvar em JSON, mas filtro, ordenação, paginação e o relacionamento do histórico ficariam bem mais frágeis na mão do que em SQL.

**Histórico em tabela separada.** Cada mudança é uma linha com status de origem, destino e data. Fica sendo uma trilha que não se altera, e depois dá para acrescentar quem mudou ou um comentário sem mexer na tabela de tickets.

**A regra do fluxo mora no backend.** O mapa de transições permitidas está em um lugar só (`app/domain/workflow.py`) e a API responde 409 se alguém tentar pular etapa, mesmo chamando por fora da interface. O detalhe do ticket devolve `allowed_transitions`, então a tela só mostra os botões válidos sem repetir a regra em JavaScript.

**Endpoint próprio para o status** em vez de um `PATCH /tickets/{id}` genérico. Mudar status não é edição comum: tem validação própria e gera histórico. Endpoint separado deixa isso explícito e evita que um update genérico fure o fluxo.

**Ordenação por prioridade com peso numérico.** Ordenando a coluna direto o resultado sairia em ordem alfabética (alta, baixa, média, urgente), que não quer dizer nada. A query usa um `CASE` mapeando cada prioridade para um número. Empatou, o mais antigo vem primeiro, que é quem está esperando há mais tempo.

**Coluna `version` no ticket.** Se duas pessoas do suporte mexerem no mesmo ticket ao mesmo tempo, a segunda recebe 409 em vez de sobrescrever a primeira sem ninguém perceber. A tela recarrega o ticket para mostrar como ele está de fato.

**Sem biblioteca de estado no frontend.** O escopo é pequeno e um hook com `AbortController` já resolve carregando/erro e cancela a requisição anterior, evitando que a resposta lenta de um filtro antigo sobrescreva a tela. Em um projeto maior eu usaria TanStack Query pelo cache.

Os filtros ficam na URL, então dá para recarregar a página ou mandar o link já filtrado para alguém.

## O que eu assumi

- Não tem login. Funcionário e suporte usam a mesma interface, e qualquer um pode abrir ticket ou mudar status.
- O fluxo é linear: só avança uma etapa por vez, não volta, e Fechado é final.
- Categorias fixas: TI, Instalações, RH, Financeiro e Outros.
- Ticket não é editado nem apagado depois de criado.
- O formulário já vem com prioridade Média preenchida, categoria é obrigatória escolher.

## Limitações

- As tabelas são criadas no startup, sem Alembic. Resolve para protótipo, mas não versiona mudança de schema.
- SQLite tem escrita concorrente limitada. Para um time pequeno serve, para uso pesado não.
- Paginação por offset, que é simples mas perde desempenho em volume grande.
- A validação existe nos dois lados (o backend é a fonte da verdade, o frontend é para dar resposta imediata), então os limites precisam ser mantidos em sincronia na mão.
- Os testes estão no backend, onde estão as regras. No frontend eu contei com o TypeScript.

## Com mais tempo

- Login com perfis: funcionário enxerga os próprios tickets, suporte enxerga todos, e o histórico registra quem mudou o quê.
- Responsável pelo ticket e comentários na conversa.
- Reabrir ticket resolvido informando o motivo.
- Alembic e Postgres.
- Testes de componente com Vitest e um teste end to end do fluxo principal.
- Busca por texto e filtro com mais de um valor por campo.
