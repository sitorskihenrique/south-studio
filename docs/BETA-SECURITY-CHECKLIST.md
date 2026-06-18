# Checklist de beta fechado

Use este checklist no projeto Supabase de producao antes de convidar usuarios.

## 1. Banco e migrations

- Confirmar que as migrations abaixo foram aplicadas:
  - `20260607_initial_schema.sql`
  - `20260609_add_project_links.sql`
  - `20260616120000_security_hardening.sql`
  - `20260616121000_tenant_foundation.sql`
- Confirmar que existem as tabelas:
  - `profiles`
  - `projects`
  - `tasks`
  - `budgets`
  - `film_plans`
- Confirmar que `projects`, `tasks`, `budgets` e `film_plans` possuem `user_id`.
- Confirmar que `tasks`, `budgets` e `film_plans` possuem `project_id`.

## 2. RLS

No painel Supabase, verificar que RLS esta ativa em:

- `profiles`
- `projects`
- `tasks`
- `budgets`
- `film_plans`

Cada tabela deve ter policies para `select`, `insert`, `update` e `delete` usando:

```sql
auth.uid() = user_id
```

Nao usar policy publica, `true`, ou acesso para `anon` nas tabelas de dados.

## 3. Teste de isolamento

1. Criar a conta A em uma janela normal.
2. Criar um projeto, uma tarefa, um orcamento e um plano.
3. Criar a conta B em uma janela anonima.
4. Confirmar que a conta B inicia com zero registros.
5. Confirmar que a conta B nao encontra nenhum dado da conta A.
6. Criar dados na conta B.
7. Voltar para a conta A e confirmar que os dados da conta B nao aparecem.

## 4. Rotas protegidas

Sem login, abrir diretamente:

- `/dashboard`
- `/projetos`
- `/tarefas`
- `/calculadora`
- `/plano-de-filmagem`
- `/configuracoes`

Todas devem redirecionar para `/login`.

## 5. Sincronizacao entre dispositivos

1. Entrar com a mesma conta no PC e no celular.
2. Criar uma tarefa no PC.
3. Focar ou recarregar o app no celular e confirmar que a tarefa aparece.
4. Criar outra tarefa no celular.
5. Voltar ao PC e confirmar que as duas tarefas continuam presentes.
6. Editar tarefas diferentes nos dois aparelhos.
7. Confirmar que nenhuma tarefa nao relacionada foi removida.
8. Repetir para projetos, orcamentos e planos.

## 6. Falha de rede

1. Abrir o app autenticado.
2. Desativar a internet.
3. Criar ou editar uma tarefa.
4. Confirmar a mensagem de sincronizacao pendente.
5. Reativar a internet.
6. Voltar ao app ou focar a janela.
7. Confirmar que a alteracao foi enviada ao Supabase.
8. Repetir com exclusao, projeto, orcamento e plano.

## 7. Autenticacao

- Testar cadastro por e-mail e senha.
- Confirmar o e-mail, quando a confirmacao estiver ativa.
- Testar login por e-mail e senha.
- Testar Google OAuth.
- Fechar e reabrir o navegador e confirmar a persistencia da sessao.
- Testar logout.
- Confirmar que uma sessao expirada volta ao login sem loading infinito.

## 8. Variaveis da Vercel

Devem existir somente:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Nunca adicionar `service_role` ao frontend ou a variaveis com prefixo `NEXT_PUBLIC_`.

## 9. Liberacao

Liberar o beta somente quando:

- Build de producao passar.
- Conta A e conta B estiverem isoladas.
- PC e celular preservarem registros criados em ambos.
- A fila pendente sincronizar depois da volta da internet.
- Todas as rotas privadas exigirem login.
