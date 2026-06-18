# Cologne OS - Fundacao multi-tenant

Este projeto ainda opera as ferramentas principais por `user_id`.

As tabelas atuais continuam intactas:

- `projects`
- `tasks`
- `budgets`
- `film_plans`
- `profiles`

Nenhuma delas foi migrada para `tenant_id` nesta fase.

## O que foi adicionado

Foi criada apenas a fundacao para crescimento futuro:

- `tenants`
- `tenant_members`
- `tenant_settings`

Todo novo usuario passa a receber automaticamente:

- um tenant pessoal
- uma membership com papel `owner`
- um registro vazio de configuracoes do tenant

Usuarios existentes tambem recebem essa estrutura via backfill na migration.

## Roles

Roles previstas:

- `owner`
- `admin`
- `member`
- `viewer`

## RLS

As novas tabelas usam Row Level Security.

O acesso e baseado em membership:

- membros podem ler o tenant, membros e settings
- `owner` e `admin` podem administrar membros e settings

As funcoes `is_tenant_member` e `is_tenant_admin` usam `security definer` para evitar recursao nas policies.

## Helpers

Helpers criados:

- `getCurrentTenant()`
- `getCurrentMembership()`
- `getActiveTenantId()`

Eles estao preparados para uso futuro, mas ainda nao alteram a sincronizacao atual das ferramentas.

## O que nao foi feito

Ainda nao foi implementado:

- migracao de `projects`, `tasks`, `budgets` ou `film_plans` para `tenant_id`
- switcher de equipe
- convites
- white label
- Stripe
- billing
- cache local por tenant

Essas etapas devem vir apenas depois de validar o produto com usuarios reais.
