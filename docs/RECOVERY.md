# Plano de recuperacao operacional

Este documento resume o caminho simples de recuperacao para a fase beta do SaaS.

## Principios

- Nao executar `supabase db reset`, `db push` ou migrations diretamente em producao sem revisao previa.
- Nao usar nem expor `service_role` no frontend.
- Manter `.env.local` e qualquer secret fora do Git.
- Validar `npm run lint` e `npm run build` antes de publicar alteracoes.
- Preferir rollback por Git/deploy anterior quando o problema estiver no app.
- Preferir migration corretiva nova quando o problema estiver no schema.

## Incidente no app

1. Pausar novos deploys.
2. Confirmar o commit em producao.
3. Reproduzir localmente com as mesmas variaveis publicas.
4. Fazer rollback para o deploy anterior estavel, se houver impacto em login, cadastro, recuperacao de senha ou dados principais.
5. Corrigir em branch/local, rodar lint/build e abrir novo deploy.

## Incidente no banco

1. Nao apagar migrations antigas.
2. Conferir quais migrations existem localmente e quais foram aplicadas no remoto.
3. Criar uma migration corretiva pequena e revisavel.
4. Testar em ambiente local/staging antes do remoto.
5. Confirmar RLS, grants, indexes e policies afetadas.

## Incidente de secrets

1. Revogar a credencial no provedor afetado.
2. Gerar nova credencial.
3. Atualizar somente no painel/ambiente seguro de deploy.
4. Verificar historico Git antes de considerar o incidente encerrado.

## Dados e backups

- Antes do beta, confirmar backups automaticos do Supabase no painel do projeto.
- Para mudancas sensiveis de schema, exportar snapshot ou backup conforme o plano contratado.
- Nunca usar dados reais para teste de isolamento RLS sem consentimento e escopo claro.

## Checklist pre-deploy

- `npm run lint` passou.
- `npm run build` passou.
- CSP tem nonce por requisicao e nao tem `unsafe-inline` em `script-src`.
- Turnstile esta configurado com `NEXT_PUBLIC_TURNSTILE_SITE_KEY` no ambiente de deploy.
- Login, cadastro, Google OAuth e recuperacao de senha foram testados.
- Nenhum secret foi adicionado ao Git.
- Migrations novas foram revisadas antes de qualquer aplicacao remota.
