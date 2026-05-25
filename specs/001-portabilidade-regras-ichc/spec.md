# Feature Specification: Portabilidade de regras de negocio do CMS legado ICHC

**Feature Branch atual/documentada**: `refactor/business-rules`

**Observacao de governanca**: esta branch nao segue o prefixo exigido pela Refresh Constitution 1.1.0. DP-001 foi resolvida por excecao formal humana para manter `refactor/business-rules` nesta feature/rodada; a regra geral de futuras branches `feature/*`, `change/*` ou `fix/*` permanece preservada.

**Task Type**: change

**Created**: 2026-05-23

**Status**: Primeira fatia implementada e validada; spec permanece como guarda-chuva de backlog para fases futuras.

**Input**: User description: "Mapear e incorporar ao Refresh somente as regras de negocio extraidas do CMS legado ICHC, preservando comportamento de negocio e adaptando aos modelos, convencoes, arquitetura e stack ja existentes no Refresh."

## Contexto e Objetivo

O Refresh deve usar o CMS legado ICHC apenas como fonte de comportamento de negocio. A feature existe para classificar, planejar e implementar de forma incremental regras de usuarios, perfis, permissoes, secoes, menus, URLs amigaveis, conteudos, tipos de conteudo, SEO, anexos, galerias, workflow editorial, newsletter, ouvidoria/contato e auditoria, sem copiar tecnologia antiga.

O principio central desta feature e: replicar regras de negocio, nao a tecnologia antiga. O legado nao deve ser usado como fonte de PHP, SQL, HTML, CSS, JavaScript, assets, cache, credenciais, SMTP, IPs, e-mails especificos, caminhos absolutos, estrutura fisica de pastas ou configuracoes de servidor.

Esta spec nasceu como etapa inicial documental. A primeira fatia foi implementada posteriormente em subfatias autorizadas e validadas. O restante da spec permanece como guarda-chuva de backlog: fases futuras exigem nova autorizacao humana explicita, escopo menor e, preferencialmente, nova spec ou nova subfatia antes de qualquer runtime, banco, migration, Docker, Compose, scripts, workflows, deploy, commit, push ou merge.

## Nota de estabilizacao pos-primeira fatia

A primeira fatia T007-T032 e T064-T065 foi ampla demais para operar como uma unica esteira: misturou governanca, runtime, banco, permissoes, Portal, contratos, auditoria e backlog. Para proximas fases, esta spec nao deve ser usada como ordem direta para `$speckit-implement` integral. A regra operacional passa a ser:

- criar subfatia pequena e explicitamente autorizada;
- separar checklist de readiness de tasks runtime;
- manter backlog/future spec fora do checklist executavel;
- registrar testes TDD em red como "testes criados", nao como comportamento entregue;
- atualizar status dos artefatos apenas nos pontos essenciais;
- validar public policy de conteudo sempre junto com politica de secao para evitar vazamento publico.

## Clarifications

### Session 2026-05-23

- Q: DP-001 - Qual decisao de branch deve orientar o plano e a implementacao futura? -> A: Status: resolvida por excecao formal humana. Branch mantida: `refactor/business-rules`. Motivo: a feature ja foi iniciada e documentada nesta branch. Escopo da excecao: somente esta feature/rodada documental e sua continuidade imediata. Regra geral preservada: futuras features, changes ou fixes devem seguir branch especifica com prefixo `feature/*`, `change/*` ou `fix/*`, conforme Refresh Constitution 1.1.0. Nenhuma acao Git foi executada: nenhuma branch foi criada, excluida, renomeada, trocada ou regularizada automaticamente. Impacto em banco: nenhum. Impacto em ambiente: nenhum. Impacto em testes: nenhum direto; antes de PR, validar branch, status do workspace e ausencia de segredos. Impacto em documentacao: registrar a excecao formal no `$speckit-plan`, `$speckit-tasks`, checklist e documentacao de entrega.
- Q: DP-002 - Como representar status editoriais legados sem criar inconsistencia com o modelo atual? -> A: Status: resolvida para a primeira fatia. Opcoes consideradas: manter todos os status em portugues; traduzir para vocabulário nativo; criar dois campos separados para status legado e status nativo. Recomendacao segura: usar o vocabulário nativo do Refresh para comportamento publico e contratos (`draft`, `published`, `archived`) e mapear os termos legados como regra de negocio: `Publicado` -> `published`; `Novo` e `Rascunho` -> `draft`; `Excluido` -> `archived`/exclusao logica; `Complemento` fica fora da primeira fatia e deve ser tratado futuramente como tipo, relacionamento ou visibilidade especifica, nao como status publico. Justificativa: reduz impacto em contrato e evita introduzir strings legadas como novo modelo paralelo. Impacto em banco: nenhum obrigatorio para status se o campo string atual for reaproveitado; validade editorial ainda exige migration propria. Impacto em ambiente: nenhum direto. Impacto em testes: cobrir filtros publicos e transicoes de status. Impacto em documentacao: documentar tabela de equivalencia legado -> Refresh.
- Q: DP-003 - Secoes terao `Livre`, `Restrita_Aparente` e `Restrita` ou politica equivalente? -> A: Status: resolvida para planejamento. Opcoes consideradas: copiar nomes legados; traduzir para politica nativa; tentar derivar apenas de `visibleInMenu`, `isActive` e permissoes existentes. Recomendacao segura: traduzir para uma politica nativa explicita em secao, por exemplo `public`, `restricted_visible` e `restricted_hidden`, usando `RoleSectionAccess` para autorizacao. Justificativa: derivar restricao apenas de campos existentes e ambiguo e pode vazar secao restrita em menu ou acesso publico. Impacto em banco: provavel migration em `Section` para politica de acesso e, se aprovado, campos de destino de navegacao. Impacto em ambiente: validar portal e Refresh nos subpaths atuais. Impacto em testes: menu publico, acesso restrito, breadcrumb e bloqueio por permissao. Impacto em documentacao: registrar mapeamento dos termos legados para politica nativa.
- Q: DP-004 - URL amigavel global deve usar entidade dedicada ou validacao cruzada? -> A: Status: resolvida para planejamento. Opcoes consideradas: entidade dedicada global; validacao cruzada entre `Section.slug/path` e `Content.slug`; manter unicidade separada por tabela. Recomendacao segura: planejar entidade dedicada de URL amigavel global, com caminho unico, tipo de alvo e referencia ao alvo, mantendo validacoes nos services. Justificativa: reduz duplicacao de regras, centraliza resolucao, evita colisao entre secao e conteudo e facilita redirecionamentos/fallbacks futuros. Impacto em banco: migration provavel para entidade de URL amigavel e backfill controlado em dev/test. Impacto em ambiente: validar resolucao publica em `/abbatech/portal` e API publica/interna sem alterar production. Impacto em testes: unicidade global, resolucao, fallback e rejeicao antes de salvar. Impacto em documentacao: documentar contrato de URL e regra de migracao/backfill.
- Q: DP-005 - Conteudos relacionados serao por tags, relacao explicita ou ambos, e entram na primeira fase? -> A: Status: diferida. Opcoes consideradas: tags; relacao explicita; ambos. Recomendacao segura: excluir conteudos relacionados da primeira fatia; quando entrar, preferir tags para classificacao/editorial e relacao explicita somente se houver necessidade de curadoria manual. Justificativa: nao bloqueia publicacao, validade, URL ou menu e adiciona migration/modelagem que pode criar escopo paralelo. Impacto em banco: nenhum na primeira fatia; migration futura para Tag/relacao se aprovado. Impacto em ambiente: nenhum agora. Impacto em testes: futuro teste de associacao/remocao/exibicao. Impacto em documentacao: registrar como backlog/future spec.
- Q: DP-006 - Newsletter entra nesta rodada? -> A: Status: diferida. Opcoes consideradas: incluir na primeira fatia; planejar como fase posterior; remover definitivamente. Recomendacao segura: manter newsletter fora da primeira fatia e preservar apenas o requisito de nao migrar SMTP/credenciais legadas. Justificativa: o modelo existe parcialmente, mas envio/log real nao deve bloquear publicacao, validade e URL. Impacto em banco: nenhum na primeira fatia; talvez migration/seed futura para status e destinatarios avulsos. Impacto em ambiente: futuro plano deve validar SMTP por ambiente sem copiar legado. Impacto em testes: futuro envio, dispatch/log e ausencia de segredo. Impacto em documentacao: backlog com decisao de produto.
- Q: DP-007 - Ouvidoria/contato sera modulo formal do Refresh? -> A: Status: diferida e fora da primeira fatia. Opcoes consideradas: implementar modulo formal; mapear para `PrivacyRequest`; deixar fora de escopo/backlog. Recomendacao segura: deixar ouvidoria/contato fora de escopo da primeira implementacao e exigir decisao explicita de produto antes de qualquer modelagem. Justificativa: envolve dados pessoais, notificacao, status, responsaveis e possivel LGPD; nao deve entrar por arrasto do legado. Impacto em banco: nenhum agora; migration futura se virar modulo formal. Impacto em ambiente: nenhum agora; futuro envio de e-mail por ambiente. Impacto em testes: futuro anti-spam, status, encaminhamento, resposta e filtros. Impacto em documentacao: registrar como backlog/future spec.
- Q: DP-008 - Quais tipos de conteudo precisam existir agora? -> A: Status: resolvida para primeira fatia com backlog explicito. Opcoes consideradas: reproduzir catalogo legado inteiro; usar somente tipos existentes; criar catalogo minimo orientado a produto. Recomendacao segura: nao reproduzir catalogo legado por inercia. Para a primeira fatia, usar apenas tipo institucional/generico existente ou um tipo minimo equivalente se o bootstrap nao tiver. Tipos condicionais para fases seguintes: Noticias, Documentos/Publicacoes e Banner, somente se houver tela/bloco do Refresh aprovado. Backlog: Licitacoes, Galeria de Imagens, Audios, Perguntas Frequentes, Pop-up, Depoimentos, Locais e demais tipos legados. Justificativa: evita CMS paralelo e reduz seeds/migrations desnecessarias. Impacto em banco: nenhum se usar `ContentType.schemaJson` existente; seed pode ser necessario se faltar tipo minimo. Impacto em ambiente: nenhum direto. Impacto em testes: mascara minima, obrigatoriedade de campos e publicacao. Impacto em documentacao: catalogar tipos obrigatorios, condicionais e backlog.

### Session 2026-05-23 - Decisoes humanas dos blockers restantes

- Multi-secao: resolvida para primeira fatia como backlog/future spec. A primeira fatia deve garantir apenas secao principal obrigatoria por `Content.sectionId` ou equivalente nativo existente. Nao criar `ContentSection` nem migration de multi-secao nesta primeira fatia; a regra legada de multiplas secoes permanece reconhecida e diferida para fase futura.
- Permissao granular de publicacao: resolvida com o nome oficial `contents.publish`. `contents.write` nao pode publicar conteudo, alterar status para `published`, alterar validade de publicacao ou arquivar conteudo publicado sem `contents.publish`. Seed idempotente minimo para `contents.publish` pode ser planejado se necessario, mas nenhum seed esta autorizado nesta etapa documental.
- URL amigavel global: resolvida com entidade dedicada `FriendlyUrl` como fonte de verdade aprovada para a primeira fatia. `FriendlyUrl.path` deve ser unico globalmente entre secao e conteudo. O campo publico canonico para o Portal deve ser `url`; `slug` e `section.path` podem permanecer como dados auxiliares, mas nao devem ser fonte de verdade para colisao global. Migration de `FriendlyUrl` deve ser planejada, mas nao criada nesta etapa documental.
- Fluxo de migration: resolvido. Qualquer migration necessaria deve ser criada somente em dev via `npm run docker:dev:migrate -- nome_em_snake_case`. `local-prod` e `production` devem aplicar apenas migrations versionadas ja criadas por fluxo apropriado de deploy/migrate. `prisma db push`, `prisma migrate reset`, SQL manual e correcoes diretas em local-prod/production continuam proibidos. Nenhuma migration esta autorizada nesta etapa documental.

Analise adicional da matriz de aderencia:

- Regras criticas para a primeira fatia: autenticacao apenas com usuario `Ativo`; permissao backend para editar/publicar; conteudo publico somente `published`; validade ativa/inativa; URL amigavel global; secao principal obrigatoria; menu publico por visibilidade, hierarquia, ordem e politica de acesso; detalhe publico sem vazar conteudo nao publicado; ausencia de credenciais/configuracoes legadas.
- Regras para backlog/future spec: tags/metatags editoriais completas, conteudos relacionados, anexos, galerias, newsletter/envio, ouvidoria/contato, workflow editorial completo, catalogo legado amplo de tipos, contador de visitas, blocos dinamicos avancados e ordenacao aleatoria.
- Regras que preservam comportamento ja existente: usuario com multiplos perfis, unicidade de CPF/e-mail/username, arvore de secoes, atualizacao de path descendente, revisao de conteudo em salvamento, SEO basico, modelos parciais de newsletter, auditoria basica e upload seguro de imagem de perfil.
- Regras que exigem migration versionada provavel: validade editorial em `Content`; entidade dedicada `FriendlyUrl`; politica de acesso de `Section`; possivel destino/link de secao; tags; anexos/galerias; workflow; ouvidoria se aprovada. Relacao de secoes associadas a conteudo fica para backlog/future spec.
- Regras que exigem seed provavel: permissoes como `contents.publish`; perfis/funcoes Autor, Editor, Publicador, Administrador; tipo de conteudo minimo se ausente; possiveis aplicacoes/menus para nova politica.
- Regras que exigem somente ajuste de service/policy sem migration: login estrito por status `Ativo`; remocao/decisao sobre login por nome; filtro publico de status; detalhe publico filtrado; permission policy de publicacao; paginacao/filtros administrativos; normalizacao de slug; uso de SEO fallback.
- Regras com risco de exposicao publica: `findBySlug` sem filtro publico, listas sem validade, menus sem `visibleInMenu`/restricao, busca futura sem policy compartilhada, preview sem autenticacao, conteudo excluido tratado como delete fisico ou status publico.
- Regras com risco de autorizacao/permissao: publicacao com `contents.write`, area administrativa protegida apenas pela UI, escopo de secao por perfil incompleto, perfil ativo vs acumulacao de perfis e workflow sem destinatario elegivel.
- Regras com risco de criar CMS paralelo: catalogo completo de mascaras legadas, templates/blocos legados, cache legado, tags/relacionamentos duplicados, anexo/galeria fora de `MediaAsset`/UploadService e ouvidoria sem decisao de produto.
- Regras dependentes de decisao de produto: branch da implementacao, termos editoriais exibidos ao usuario, tipos de conteudo obrigatorios/condicionais/backlog, newsletter, ouvidoria, conteudos relacionados, workflow completo.
- Regras dependentes de decisao tecnica ainda futura: modelo de validade detalhado, politica de acesso de secao, schema de mascara e estrategia de backfill. Entidade global de URL, relacao multi-secao para primeira fatia, permissao granular para publicar e fluxo de migration foram decididos documentalmente.
- Regras excluidas da primeira implementacao para reduzir risco: newsletter, ouvidoria, catalogo legado completo, tags/relacionados, anexos/galerias, workflow completo, blocos dinamicos avancados, contador de visitas e cache.

Recomendacao para o `$speckit-plan`:

- Status atual apos a primeira fatia: primeira fatia implementada e validada; DP-001, multi-secao, permissao granular, `FriendlyUrl` dedicada e fluxo de migration foram resolvidos. Proximas fases exigem nova subfatia ou spec menor.
- Primeira fatia recomendada: "Protecao de publicacao e roteamento publico". Objetivo: impedir vazamento de conteudo nao publicado/restrito/fora de validade e impedir publicacao por perfil sem permissao.
- Regras incluidas na primeira fatia: usuario `Ativo` para autenticacao; status nativo `draft/published/archived`; filtro publico compartilhado de publicacao e validade; URL amigavel global por `FriendlyUrl`; secao principal obrigatoria via `Content.sectionId` ou equivalente nativo; menu publico por hierarquia, ordem, visibilidade e acesso; permissao granular `contents.publish`; SEO fallback basico; auditoria minima para alteracoes criticas.
- Regras explicitamente fora da primeira fatia: newsletter, ouvidoria, tags/relacionados, anexos/galerias, workflow completo, catalogo legado amplo de tipos, blocos dinamicos avancados, contador de visitas e cache.
- Migrations possivelmente necessarias: validade editorial em `Content`; entidade dedicada `FriendlyUrl`; politica de acesso/destino de `Section`; possivel campo/relacao para auditoria ou status logico se o plano nao usar `archived`. Migration de multi-secao fica fora da primeira fatia.
- Testes minimos: auth status `Ativo`; permissao de publicar; public list/detail/search policy para `published` e validade; duplicidade global de URL; menu restrito/visivel/ordenado; secao principal e associacao; SEO fallback; migration test se houver schema; regressao contra ausencia de credenciais legadas.
- Riscos principais: branch atual fora do padrao constitucional, vazamento publico, publicacao indevida, migration fora de dev, copia acidental de legado, criacao de CMS paralelo e impacto em subpaths/public API.
- Proxima etapa para qualquer implementacao futura: definir subfatia pequena, revisar status/diff do workspace, confirmar working tree sem alteracoes alheias e ausencia de arquivos sensiveis. Newsletter, ouvidoria, tags, anexos/galerias e workflow completo devem ficar fora de qualquer execucao sem aprovacao posterior explicita.

## Escopo

### Incluido

- Usuarios, perfis, permissoes administrativas e escopo por secao.
- Secoes, menus, navegacao, hierarquia, links e visibilidade publica.
- URLs amigaveis para secoes e conteudos.
- Conteudo publicavel, status editorial, validade, versoes e preview autorizado.
- Tipos de conteudo/mascaras como definicao configuravel de campos e validacoes.
- Listagens, detalhe, menus e blocos dinamicos do portal.
- Busca publica em conteudos publicados e acessiveis.
- SEO e tags/metatags.
- Anexos, arquivos e galerias relacionados a conteudos.
- Workflow editorial com encaminhamento, comentario, responsavel e notificacao.
- Newsletter/envio de e-mail quando compativel com o modulo atual do Refresh.
- Ouvidoria/contato somente se aprovado como modulo formal do Refresh.
- Auditoria e historico usando mecanismos nativos do Refresh.

### Fora de Escopo Obrigatorio

- Reproduzir telas, layout, HTML, CSS ou JavaScript do legado.
- Copiar queries SQL, funcoes PHP, estrutura fisica de pastas ou nomes de arquivos como contrato.
- Migrar credenciais, SMTP, IPs, e-mails especificos, caminhos absolutos ou configuracoes antigas.
- Recriar cache legado se o Refresh tiver mecanismo proprio.
- Preservar bugs, inconsistencias de encoding ou acoplamentos do legado.
- Criar um CMS paralelo quando o Refresh ja possui modelos equivalentes.
- Implementar tudo em uma unica entrega.
- Alterar codigo runtime, banco, migrations, Docker, Compose, scripts, workflows ou templates do Spec Kit nesta etapa documental.

## Matriz de Aderencia Inicial

Esta matriz usa o workspace Refresh como referencia de aderencia. Os caminhos indicam onde existe cobertura atual ou onde o dominio esta mais proximo. A classificacao deve ser refinada no `$speckit-plan` antes de qualquer implementacao.

| Regra extraida do legado | Modulo/dominio | Ja existe no Refresh? | Onde existe no workspace? | Status | Menor mudanca necessaria | Precisa migration? | Precisa teste? | Risco | Observacoes |
|---|---|---:|---|---|---|---|---|---|---|
| Usuario so autentica com status `Ativo` | Auth/Usuarios | Parcial | `apps/api/src/modules/auth/auth.service.ts`, `apps/api/prisma/schema.prisma` | parcialmente atendida | Restringir login para `status === "Ativo"` e alinhar `isActive` a esta regra | Nao | Sim | Alto | Hoje bloqueia `Inativo` e `Excluido`, mas permite outros status ativos logicamente. |
| Login aceita CPF, e-mail ou username | Auth/Usuarios | Sim, com excesso | `apps/api/src/modules/auth/auth.service.ts` | parcialmente atendida | Remover ou decidir se login por nome permanece; manter CPF/e-mail/username como contrato | Nao | Sim | Medio | Login por `name` existe hoje e nao veio como regra de negocio alvo. |
| Usuario pode ter um ou mais perfis | Usuarios/Perfis | Sim | `UserRole` em `apps/api/prisma/schema.prisma` | ja atendida | Validar UX e contratos para troca de perfil | Nao | Sim | Baixo | Ja ha relacao N:N usuario-perfil. |
| Perfil ativo define permissao e funcao editorial | Auth/Perfis | Parcial | `AuthSession.roleId`, `Role.functionName`, `AuthService.switchProfile` | parcialmente atendida | Padronizar funcoes editoriais e usar perfil ativo nas politicas de conteudo | Talvez seed | Sim | Alto | Estrutura existe, politica editorial ainda e incompleta. |
| Perfis possuem hierarquia via perfil superior | Perfis/Workflow | Parcial | `Role.parentRoleId` em schema, `ManagementService.createRole` | parcialmente atendida | Usar hierarquia para workflow e escopo de secoes | Talvez seed | Sim | Alto | Dado existe, comportamento de workflow nao. |
| Funcoes Autor, Editor, Publicador, Administrador | Perfis/Workflow | Parcial | `Role.functionName`, seeds em `apps/api/prisma/seed/*` | parcialmente atendida | Definir taxonomia oficial e permissoes por funcao | Talvez seed | Sim | Alto | Precisa decisao de produto sobre nomes finais e privilegios. |
| Permissoes por area com acessar/auditar/incluir/alterar/excluir | Permissoes | Parcial | `Permission`, `RoleApplicationAccess`, `PermissionsGuard` | parcialmente atendida | Unificar acoes granulares com guards e UI; incluir auditar | Talvez | Sim | Alto | Existe `canCreate/canUpdate/canDelete/canAccess`, mas guards usam codigos simples. |
| Area administrativa bloqueada sem permissao | Permissoes/Refresh CMS | Parcial | `PermissionsGuard`, `apps/refresh/app/_lib/utils.ts`, `management.types.ts` | parcialmente atendida | Garantir bloqueio backend e ocultacao/estado frontend por area e acao | Nao | Sim | Alto | Frontend nao pode ser fonte de autorizacao. |
| Perfis associados a secoes publicaveis/acessiveis | Secoes/Permissoes | Sim, parcial | `RoleSectionAccess`, `ContentsService.getRoleScope` | parcialmente atendida | Diferenciar acessar, publicar e aparecer publicamente | Talvez | Sim | Alto | Hoje ha associacao por secao, sem tipo de acesso. |
| Autenticacao acumula secoes permitidas pelos perfis | Auth/Secoes | Parcial | `AuthService.getCurrentUser`, `ContentsService.getRoleScope` | parcialmente atendida | Expor escopo acumulado quando multiplos perfis forem relevantes | Talvez nao | Sim | Medio | Hoje opera pelo perfil ativo, nao por acumulacao completa. |
| Duplicidade de usuario por CPF, e-mail ou username e bloqueada | Usuarios | Sim | `ManagementValidationService.ensureUniqueUserIdentity`, schema unique | ja atendida | Manter e cobrir regressao | Nao | Sim | Medio | CPF opcional, e-mail e username normalizados. |
| Status de usuario: Ativo, Verificado, Novo, Inativo, Excluido | Usuarios | Parcial | `User.status`, `ManagementUsersService` | parcialmente atendida | Formalizar enum de negocio e regra de autenticacao | Talvez | Sim | Medio | Schema usa string livre. |
| Secoes formam arvore hierarquica | Secoes | Sim | `Section.parentId`, `SectionsService.listTree` | ja atendida | Manter e ampliar contratos conforme regras de menu | Nao | Sim | Medio | Caminho e descendentes ja existem. |
| Secao possui nome, descricao, ordem, pai/caminho, visibilidade | Secoes | Sim | `Section` em schema, `SectionsService` | ja atendida | Cobrir regressao de ordenacao e path | Nao | Sim | Medio | Campos principais ja existem. |
| Secao possui link/acao, controle de acesso, nova janela, imagem, perfil responsavel | Secoes/Menu | Parcial | `Section` atual | ausente/parcial | Adicionar campos nativos ou politica equivalente sem copiar nomes legados | Sim | Sim | Alto | Exige decisao de modelo. |
| Menus publicos listam secoes visiveis em ordem e hierarquia | Portal/Secoes | Parcial | `SectionsService.listTree`, `apps/portal/lib/api.ts` | parcialmente atendida | Filtrar `visibleInMenu`, acesso e restricoes no backend publico | Nao/Talvez | Sim | Alto | `listTree` filtra `isActive`, mas nao explicitamente `visibleInMenu`. |
| Secoes restritas e aparentes obedecem acesso | Secoes/Portal | Nao | Nao ha campo especifico | ausente | Modelar tipo de acesso: Livre, Restrita_Aparente, Restrita | Sim | Sim | Alto | Critico para portal publico. |
| Excluir secao remove relacionamentos e URL amigavel | Secoes | Parcial | `SectionsService.remove`, relacoes Prisma | parcialmente atendida | Definir exclusao segura vs bloqueio quando ha filhos/conteudos | Talvez | Sim | Alto | Hoje bloqueia se ha filhos/conteudos. |
| Mover/renomear secao atualiza descendentes | Secoes | Sim | `SectionsService.rebuildChildPaths` | ja atendida | Validar com teste de regressao | Nao | Sim | Medio | Regra ja implementada. |
| Secao aponta para URL interna, link interno, link externo ou listagem especial | Secoes/Portal | Nao | Nao ha campos dedicados | ausente | Modelar destino de navegacao sem reproduzir rotas tecnicas antigas | Sim | Sim | Medio | Precisa encaixar nos subpaths do Refresh. |
| Contador de visitas em secao | Analytics interno | Parcial | `Section.visits`, `ManagementService.resetStatistics` | parcialmente atendida | Incrementar em acesso publico se aprovado | Nao | Sim | Baixo | Campo existe, comportamento incompleto. |
| Breadcrumb e titulo derivam da hierarquia | Portal/Secoes | Parcial | `Section.path`, portal basico | parcialmente atendida | Expor breadcrumb/titulo no contrato publico | Talvez nao | Sim | Medio | Depende de UI/portal. |
| URLs amigaveis de secao e conteudo sao unicas globalmente | URL amigavel | Parcial | `Section.slug/path`, `Content.slug` | parcialmente atendida | Validar unicidade global entre secao e conteudo ou criar entidade de URL | Talvez | Sim | Alto | Hoje unicidade e separada por tabela. |
| URL de conteudo guarda secao principal | URL/Conteudo | Sim | `Content.sectionId`, `Content.slug` | parcialmente atendida | Resolver URL considerando conteudo+secao e fallback | Talvez nao | Sim | Alto | Falta resolvedor global de URL. |
| Geracao automatica normaliza acentos, espacos e pontuacao | Slug/URL | Sim | `SectionsService.toSlug`, `ContentsService.toSlug` | ja atendida | Consolidar helper compartilhado e cobrir globalidade | Nao | Sim | Medio | Ja usa normalizacao. |
| Conteudo possui tipo, titulo, secao principal, status, autor, campos textuais e midia | Conteudo | Parcial | `Content`, `ContentType`, `MediaAsset` | parcialmente atendida | Acrescentar data de conteudo, validade, secoes alternativas e campos por mascara | Sim | Sim | Alto | Estrutura central existe. |
| Status editoriais Novo, Publicado, Rascunho, Complemento, Excluido | Conteudo editorial | Parcial | `Content.status`, contratos `draft/published/archived` | parcialmente atendida | Traduzir status legado para vocabulário Refresh e regras publicas | Talvez | Sim | Alto | Evitar copiar string legado se modelo atual puder representar. |
| Portal exibe somente Publicado | Portal/Conteudo | Parcial | `ContentsService.listPublished` | parcialmente atendida | Garantir em detalhe, busca, blocos e listagens | Nao/Talvez | Sim | Critico | `findBySlug` nao filtra status hoje. |
| Validade por intervalo com flag ativa | Conteudo editorial | Nao | Nao ha campos dedicados | ausente | Adicionar politica de validade com data inicial, final e flag | Sim | Sim | Critico | Criterio minimo da feature. |
| Data final vale ate fim do dia | Conteudo editorial | Nao | Nao ha politica dedicada | ausente | Definir normalizacao de fim de dia no dominio | Talvez nao | Sim | Medio | Pode ser regra de service. |
| Conteudos excluidos usam exclusao logica por padrao | Conteudo/Auditoria | Nao | `ContentsService.remove` faz delete fisico | ausente | Alterar para status excluido quando aplicavel | Talvez | Sim | Alto | Evitar perda de historico. |
| Ao salvar conteudo, criar versao historica | Conteudo/Versionamento | Sim | `ContentRevision`, `ContentsService.createRevision` | ja atendida | Garantir cobertura para todos salvamentos relevantes | Nao | Sim | Alto | Ja cria revisao em create/update. |
| Secao principal consta tambem nas secoes associadas | Conteudo/Secoes | Nao | Nao ha relacao multi-secao | backlog/future spec | Primeira fatia usa apenas `Content.sectionId`; `ContentSection` e migration de multi-secao ficam diferidos | Nao na primeira fatia | Sim futuro | Medio | Regra legada reconhecida, mas diferida por decisao humana. |
| Autores/Editores nao publicam diretamente sem permissao | Workflow/Permissoes | Nao | Permissao atual `contents.write` e status livre no DTO | ausente | Criar policy de transicao de status por funcao/permissao | Nao/Talvez | Sim | Critico | Evita publicacao indevida. |
| Publicadores controlam status, publicacao e validade | Workflow/Conteudo | Nao | `ContentsController` status aceita published com `contents.write` | ausente | Separar permissao de publicar de permissao de editar | Talvez seed | Sim | Critico | Alta superficie de autorizacao. |
| Listagem administrativa filtra por status, secao, tipo, usuario e texto | CMS/Conteudo | Parcial | `ContentsService.listAdmin` | parcialmente atendida | Adicionar filtros explicitamente parametrizados | Nao | Sim | Medio | Hoje lista por escopo, sem filtros. |
| Preview de conteudo nao publicado para autorizados | Portal/CMS | Nao | Nao ha endpoint/contrato de preview | ausente | Definir preview autenticado e auditavel | Talvez nao | Sim | Alto | Deve respeitar subpaths e sessao. |
| Mascara define campos ativos, obrigatorios, rotulos, ajuda e valores | Tipos de conteudo | Parcial | `ContentType.schemaJson` | parcialmente atendida | Formalizar schema de mascara e validar no backend | Talvez nao | Sim | Alto | Campo JSON existe, enforcement nao. |
| Campos obrigatorios bloqueiam salvamento | Tipos/Conteudo | Nao | DTO exige apenas titulo/secao/tipo | ausente | Validar payload contra mascara ativa | Nao/Talvez | Sim | Alto | Regra central. |
| Valores fixos viram selecao/multipla escolha | Tipos/Conteudo | Parcial | `schemaJson` generico | parcialmente atendida | Definir contrato de opcoes e validacao | Talvez nao | Sim | Medio | UI e backend precisam concordar. |
| Tipos relevantes: noticias, licitacoes, documentos, galerias, videos, banners etc. | Tipos/Seeds | Parcial | `ContentType`, seeds demo/bootstrap | depende de decisao de produto | Criar catalogo inicial apenas se aprovado | Talvez seed | Sim | Medio | Nao copiar catalogo se nao for necessario ao Refresh. |
| Blocos podem ser detalhe, template, lista ou menu | Portal/Templates | Parcial | `Template`, `Element`, `apps/portal` | parcialmente atendida | Definir bloco dinamico nativo e contratos de consulta | Talvez | Sim | Alto | Nao copiar templates legados. |
| Listas filtram por publicado, validade, secao, tipo e exclusoes | Portal/Conteudo | Parcial | `ContentsService.listPublished` | parcialmente atendida | Criar politica unica de publicacao/listagem | Talvez | Sim | Critico | Deve ser reusada por busca e blocos. |
| Listas ordenam por data, cadastro, titulo, autor/fonte/legenda, id ou aleatorio | Portal/Listagens | Parcial | Ordenacao atual por `publishedAt` | parcialmente atendida | Definir opcoes permitidas e defaults por bloco | Talvez nao | Sim | Medio | Evitar ordenacao arbitraria insegura. |
| Paginacao configuravel | Portal/Listagens | Parcial | `take: 20` fixo em service | parcialmente atendida | Adicionar paginacao validada | Nao | Sim | Medio | Relevante para busca. |
| Conteudo relacionado por relacao explicita ou tags | Conteudo relacionado | Nao | Nao ha Tag/relacao entre conteudos | ausente | Escolher modelo: tags, relacao explicita ou ambos | Sim | Sim | Medio | Decisao de produto. |
| Busca publica em conteudos publicados e acessiveis | Busca | Nao | Nao ha modulo de busca | ausente | Criar contrato de busca com politica de publicacao/acesso | Talvez nao | Sim | Alto | Criterio minimo. |
| Resultado aponta para URL amigavel | Busca/URL | Parcial | `Content.slug` | parcialmente atendida | Usar resolvedor global de URL | Depende URL | Sim | Alto | Depende de URL amigavel global. |
| SEO proprio e fallback por conteudo/secao | SEO | Parcial | `SeoMetadata`, `ContentsService.upsertSeo` | parcialmente atendida | Garantir fallback em portal e secao sem conteudo | Nao/Talvez | Sim | Medio | SEO especifico existe. |
| Tags/metatags criadas, associadas e removidas de conteudos | Tags | Nao | Nao ha Tag model | ausente | Criar modelo nativo de tag e associacao | Sim | Sim | Medio | Cuidar para nao confundir com SEO keywords. |
| Conteudos podem ter anexos com metadados | Anexos | Parcial | `MediaAsset`, `UploadService` | ausente/parcial | Criar relacao de anexos a conteudo com metadados e ordem | Sim | Sim | Alto | MediaAsset hoje cobre arquivo generico, nao anexo editorial. |
| Conteudos podem ter galeria de imagens | Galerias | Parcial | `MediaAsset` | ausente/parcial | Criar relacao galeria/conteudo ou tipo de anexo imagem | Sim | Sim | Alto | Validar MIME/tamanho conforme politica. |
| Detalhe renderiza anexos, galeria e relacionados se componente solicitar | Portal/Detalhe | Nao | `PublicContent` nao inclui anexos/galeria | ausente | Expandir contrato publico conforme componente | Sim/Depende | Sim | Medio | Depende de componentes Refresh. |
| Workflow encaminha conteudo para usuario elegivel | Workflow | Nao | Nao ha entidade workflow | ausente | Criar encaminhamento/comentario e policy por hierarquia | Sim | Sim | Critico | Alta importancia editorial. |
| Encaminhamento altera responsavel, registra comentario, notifica e altera status | Workflow | Nao | Nao ha comportamento dedicado | ausente | Implementar como fatia propria apos conteudo/perfis | Sim | Sim | Critico | Notificacao pode ser e-mail ou interna. |
| Newsletter possui campanha, remetente, assunto, corpo, destinatarios e log | Newsletter | Parcial | `NewsletterCampaign`, `NewsletterGroup`, `NewsletterRecipient`, `NewsletterDispatch` | parcialmente atendida | Implementar envio, destinatarios avulsos/filtro e relatorio | Talvez | Sim | Alto | Modelos existem, envio ativo nao. |
| Newsletter nova recebe status Novo | Newsletter | Parcial | Default atual `draft` | depende de decisao de produto | Traduzir `Novo` para status nativo ou ajustar status | Talvez nao | Sim | Medio | Nao copiar status se `draft` for padrao escolhido. |
| Nao migrar SMTP, senhas ou enderecos especificos | Seguranca/Env | Sim | `.gitignore`, env examples, Constitution | ja atendida | Manter guardrails e validar diff antes de commit futuro | Nao | Sim | Critico | Nenhum segredo legado deve entrar. |
| Ouvidoria publica e administrativa | Ouvidoria/Contato | Parcial minimo | `PrivacyRequest`, `SystemEmail` | depende de decisao de produto | Decidir se vira modulo formal ou fica fora de escopo | Sim se aprovado | Sim | Alto | Implementar somente com aprovacao de produto. |
| Auditoria registra usuario, data, acao e entidade | Auditoria | Parcial | `AuditLog`, auth password reset logs | parcialmente atendida | Aplicar auditoria sistematica em conteudo, secao, permissoes e workflow | Nao/Talvez | Sim | Alto | Modelo existe, cobertura incompleta. |
| Exclusao fisica apenas para auxiliares ou casos seguros | Auditoria/Dados | Parcial | Deletes variados em services | parcialmente atendida | Revisar politica por entidade antes de implementar | Talvez nao | Sim | Alto | Conteudo publicado deve preservar historico. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Classificar regras legadas contra o Refresh (Priority: P1)

Como responsavel pelo produto Refresh, quero saber quais comportamentos do CMS legado ja existem, quais estao parciais e quais exigem decisao de produto, para aprovar a menor primeira fatia sem copiar tecnologia antiga.

**Why this priority**: Esta historia impede implementacao cega, duplicacao de CMS e alteracoes de banco sem entendimento de impacto.

**Independent Test**: A matriz de aderencia permite selecionar uma primeira fatia com regra, modulo, cobertura existente, menor mudanca, necessidade de migration, necessidade de teste, risco e observacoes.

**Acceptance Scenarios**:

1. **Given** as regras extraidas do legado ICHC, **When** a regra for analisada, **Then** ela deve ser classificada como ja atendida, parcialmente atendida, ausente, fora de escopo ou depende de decisao de produto.
2. **Given** uma regra classificada como parcialmente atendida ou ausente, **When** a matriz for revisada, **Then** ela deve indicar a menor mudanca necessaria e se ha impacto de banco.
3. **Given** uma regra que dependeria de copiar tecnologia legada, **When** ela for registrada, **Then** a spec deve preservar apenas o comportamento de negocio e rejeitar implementacao acidental.

---

### User Story 2 - Publicar conteudos com status, validade e URL coerentes (Priority: P1)

Como editor/publicador, quero que o Refresh aplique status editorial, validade, secao principal e URL amigavel unica, para que somente conteudos autorizados e vigentes aparecam no portal.

**Why this priority**: Status, validade e URL sao criterios minimos de publicacao e afetam diretamente o portal publico.

**Independent Test**: Um conteudo publicado e vigente aparece no portal; conteudos em estados nao publicos ou fora de validade nao aparecem; URL duplicada e rejeitada antes do salvamento.

**Acceptance Scenarios**:

1. **Given** um conteudo em `Publicado` e dentro da validade, **When** o portal listar conteudos publicos, **Then** esse conteudo deve estar disponivel.
2. **Given** um conteudo em `Novo`, `Rascunho`, `Complemento` ou `Excluido`, **When** o portal listar conteudos publicos, **Then** esse conteudo nao deve estar disponivel.
3. **Given** uma URL amigavel ja usada por qualquer secao ou conteudo, **When** um editor tentar salvar outra secao ou conteudo com a mesma URL, **Then** o salvamento deve ser rejeitado antes de persistir a alteracao.
4. **Given** um conteudo com validade ativa, **When** a data atual estiver fora do intervalo, **Then** o conteudo nao deve aparecer em listagens, busca ou blocos publicos.

---

### User Story 3 - Controlar navegacao publica por secao e permissao (Priority: P1)

Como visitante ou usuario autenticado autorizado, quero navegar por menus, secoes e breadcrumbs respeitando visibilidade, ordem, hierarquia e restricoes, para que o portal exponha apenas o que e permitido.

**Why this priority**: Secoes sao a base de menu, rota, contexto de publicacao e controle de acesso publico.

**Independent Test**: Menus publicos exibem apenas secoes visiveis e permitidas, em ordem e hierarquia correta; secoes restritas nao aparecem ou nao sao acessadas por usuario sem permissao.

**Acceptance Scenarios**:

1. **Given** secoes livres, aparentes e restritas com hierarquia, **When** o menu publico for montado, **Then** somente secoes permitidas e visiveis devem aparecer na ordem configurada.
2. **Given** uma secao restrita, **When** um usuario sem permissao tentar acessa-la, **Then** o acesso deve ser bloqueado ou omitido conforme o tipo de restricao.
3. **Given** uma secao renomeada ou movida, **When** seus descendentes forem consultados, **Then** o caminho hierarquico e breadcrumb devem refletir a nova estrutura.

---

### User Story 4 - Aplicar perfis, permissoes e workflow editorial (Priority: P2)

Como administrador editorial, quero que usuarios, perfis, hierarquia e permissoes determinem quem cria, edita, publica, audita e recebe conteudos encaminhados, para preservar governanca editorial.

**Why this priority**: Sem policy editorial, o Refresh pode publicar conteudo indevido ou atribuir tarefas a usuarios sem escopo.

**Independent Test**: Usuario inativo nao autentica; usuario sem permissao nao acessa area administrativa; workflow registra comentario, altera responsavel e notifica destinatario elegivel.

**Acceptance Scenarios**:

1. **Given** um usuario com status diferente de `Ativo`, **When** ele tentar autenticar, **Then** o login deve ser recusado.
2. **Given** um usuario sem permissao de alterar conteudo, **When** ele tentar alterar conteudo por qualquer interface, **Then** a operacao deve ser bloqueada no backend.
3. **Given** um conteudo encaminhado para revisao, **When** o encaminhamento for concluido, **Then** o responsavel, status, comentario e notificacao devem ser registrados.

---

### User Story 5 - Expor busca, SEO, anexos, galerias e conteudos relacionados (Priority: P2)

Como visitante do portal, quero encontrar conteudos publicados, acessar URLs amigaveis e ver metadados, anexos, galerias e relacionados quando o componente solicitar, para consumir conteudo institucional completo.

**Why this priority**: Esta historia amplia o portal sem bloquear a primeira fatia de publicacao e governanca.

**Independent Test**: Busca retorna apenas conteudos publicados e acessiveis; SEO especifico sobrescreve fallback; detalhe inclui anexos/galerias/relacionados quando configurado.

**Acceptance Scenarios**:

1. **Given** conteudos publicados e nao publicados, **When** uma busca publica for feita, **Then** apenas conteudos publicados e acessiveis devem aparecer.
2. **Given** um conteudo com SEO proprio, **When** sua pagina for resolvida, **Then** titulo e descricao especificos devem prevalecer sobre fallback.
3. **Given** um detalhe configurado para mostrar anexos e galeria, **When** o conteudo for acessado, **Then** os itens relacionados devem aparecer conforme ordem e metadados cadastrados.

---

### User Story 6 - Tratar newsletter e ouvidoria apenas quando aprovadas (Priority: P3)

Como responsavel de produto, quero que newsletter e ouvidoria sejam incorporadas somente se compativeis com o Refresh e aprovadas como modulo formal, para evitar expandir escopo sem necessidade.

**Why this priority**: O Refresh ja possui parte de newsletter e privacidade, mas envio e ouvidoria exigem decisoes de produto, seguranca e dados.

**Independent Test**: Newsletter so entra em implementacao se houver escopo aprovado; ouvidoria permanece fora de implementacao ate decisao formal.

**Acceptance Scenarios**:

1. **Given** campanha/newsletter aprovada para implementacao, **When** envio imediato ocorrer, **Then** quantidade enviada e log de envio devem ser registrados.
2. **Given** ouvidoria sem aprovacao de produto, **When** tasks forem geradas, **Then** nao deve haver implementacao de modulo de ouvidoria.
3. **Given** qualquer fluxo de e-mail, **When** ele for planejado, **Then** nenhuma credencial, SMTP antigo ou e-mail especifico do legado deve ser migrado.

### Edge Cases

- URL amigavel duplicada entre uma secao e um conteudo deve falhar antes de salvar.
- Conteudo publicado sem validade ativa deve aparecer independentemente de intervalo.
- Conteudo com validade ativa e data final no dia atual deve permanecer valido ate o fim do dia de negocio.
- Secao oculta, inativa ou restrita nao deve vazar em menu, busca ou breadcrumb publico.
- Usuario com multiplos perfis deve operar com perfil ativo definido e escopo coerente.
- Conteudo excluido logicamente nao deve aparecer em portal nem em listagens administrativas padrao.
- Campos obrigatorios por mascara devem bloquear salvamento mesmo que o frontend esteja desatualizado.
- Tags, anexos, galerias ou destinatarios removidos devem remover associacoes inseguras ou obsoletas sem quebrar historico necessario.
- Falha de notificacao de workflow ou newsletter deve ser registrada sem vazar segredo ou bloquear indevidamente dados ja consistentes, conforme politica definida no plano.
- Dados e configuracoes legadas sensiveis devem ser rejeitados mesmo se aparecerem em arquivos de origem do legado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST tratar o legado ICHC exclusivamente como fonte de regras de negocio e MUST NOT copiar codigo, SQL, HTML, CSS, JavaScript, assets, credenciais, caminhos absolutos, configuracoes antigas ou cache legado.
- **FR-002**: O sistema MUST manter uma matriz de aderencia para cada regra ou grupo atomico de regras extraidas, indicando cobertura atual, menor mudanca, impacto de banco, necessidade de teste, risco e observacoes.
- **FR-003**: O sistema MUST preservar a arquitetura nativa do Refresh, reutilizando modelos existentes quando equivalentes e evitando criar CMS paralelo.
- **FR-004**: O sistema MUST permitir autenticacao apenas para usuario com status de negocio `Ativo`.
- **FR-005**: O sistema MUST aceitar login por identificador equivalente a CPF, e-mail ou username, conforme politica final do Refresh.
- **FR-006**: O sistema MUST impedir duplicidade de usuario por CPF, e-mail ou username, respeitando regra mais forte ja existente.
- **FR-007**: O sistema MUST permitir que usuario possua um ou mais perfis e que um perfil ativo defina permissoes, funcao editorial e escopo operacional.
- **FR-008**: O sistema MUST representar hierarquia de perfis e usa-la para escopo editorial, workflow e selecao de destinatarios elegiveis quando aplicavel.
- **FR-009**: O sistema MUST controlar permissoes administrativas por area/aplicativo e acoes equivalentes a acessar, auditar, incluir, alterar e excluir.
- **FR-010**: O sistema MUST bloquear no backend qualquer area administrativa ou operacao para perfil sem permissao suficiente.
- **FR-011**: O sistema MUST associar perfis a secoes publicaveis/acessiveis e aplicar esse escopo em conteudo, menu restrito e workflow.
- **FR-012**: O sistema MUST manter secoes em arvore hierarquica com nome, descricao, ordem, pai/caminho, visibilidade publica e estado ativo.
- **FR-013**: O sistema MUST suportar regras de menu publico que listem somente secoes visiveis, permitidas, ativas, ordenadas e na hierarquia correta.
- **FR-014**: O sistema MUST diferenciar secoes livres, restritas aparentes e restritas, ou registrar uma decisao de produto que traduza esses conceitos para politica equivalente do Refresh.
- **FR-015**: O sistema MUST manter caminhos hierarquicos e breadcrumbs coerentes quando uma secao for movida ou renomeada.
- **FR-016**: O sistema MUST rejeitar URL amigavel duplicada globalmente entre secoes e conteudos antes do salvamento.
- **FR-017**: O sistema MUST resolver URL amigavel para secao, conteudo, tipo da URL, secao atual e conteudo atual, sem exigir rotas tecnicas antigas.
- **FR-018**: O sistema MUST gerar sugestoes de URL amigavel a partir de secao e titulo, normalizando acentos, espacos e pontuacao.
- **FR-019**: O sistema MUST garantir que todo conteudo tenha tipo/mascara, secao principal, status editorial, autor/responsavel e campos exigidos por seu tipo.
- **FR-020**: O sistema MUST garantir que a secao principal de um conteudo tambem conste entre suas secoes associadas, quando o modelo de associacao multipla for implementado.
- **FR-021**: O sistema MUST exibir no portal publico apenas conteudos com status publicado e acesso permitido.
- **FR-022**: O sistema MUST impedir que conteudos em Novo, Rascunho, Complemento ou Excluido aparecam em listas, busca, blocos ou detalhes publicos.
- **FR-023**: O sistema MUST aplicar validade editorial quando a flag de validade estiver ativa, exibindo o conteudo somente entre data inicial e data final.
- **FR-024**: O sistema MUST tratar a data final de validade como valida ate o fim do dia quando a representacao de horario for necessaria.
- **FR-025**: O sistema MUST preferir exclusao logica para conteudo publicado ou com historico relevante.
- **FR-026**: O sistema MUST criar versao historica a cada salvamento relevante de conteudo, contendo dados principais, usuario responsavel e data/hora.
- **FR-027**: O sistema MUST impedir publicacao direta por Autor ou Editor sem permissao explicita de publicacao.
- **FR-028**: O sistema MUST permitir que Publicador controle status de publicacao, data de publicacao e intervalo de validade.
- **FR-029**: O sistema MUST permitir listagem administrativa de conteudos filtravel por status, secao, tipo/mascara, usuario responsavel e texto.
- **FR-030**: O sistema MUST suportar preview autenticado de conteudo nao publicado apenas para usuarios autorizados.
- **FR-031**: O sistema MUST permitir que tipos de conteudo/mascaras definam campos ativos, obrigatorios, rotulos, ajuda, tipo de entrada, valores permitidos, formatos e limites.
- **FR-032**: O sistema MUST validar no backend os campos obrigatorios e formatos definidos pela mascara antes de salvar conteudo.
- **FR-033**: O sistema MUST traduzir tipos legados relevantes para tipos nativos do Refresh somente quando necessarios ao produto.
- **FR-034**: O sistema MUST suportar blocos publicos de detalhe, lista de conteudos, template/bloco de conteudo e menu de secoes usando modelos nativos.
- **FR-035**: O sistema MUST aplicar a mesma politica de publicacao, validade, secao, tipo e acesso em listas, busca e blocos dinamicos.
- **FR-036**: O sistema MUST permitir paginacao e ordenacoes autorizadas para listas publicas sem expor ordenacao insegura ou acidental.
- **FR-037**: O sistema MUST oferecer busca publica em conteudos publicados e acessiveis, respeitando restricao de secao, escopo de arvore, URL amigavel e paginacao.
- **FR-038**: O sistema MUST aplicar SEO especifico de conteudo quando existir e fallback por conteudo/secao quando nao existir.
- **FR-039**: O sistema MUST permitir tags/metatags editoriais criadas, associadas, removidas e exibidas quando o produto aprovar esse recurso.
- **FR-040**: O sistema MUST permitir anexos relacionados a conteudos com titulo, arquivo, tipo, tamanho, descricao, data, ordem e pasta/politica equivalente.
- **FR-041**: O sistema MUST permitir galerias de imagens vinculadas a conteudos com imagem principal, thumb e metadados editoriais.
- **FR-042**: O sistema MUST validar tipo e tamanho de anexos/galerias conforme mascara ou politica global do Refresh.
- **FR-043**: O sistema MUST permitir workflow editorial de encaminhamento com remetente, destinatario elegivel, comentario, status, responsavel e notificacao.
- **FR-044**: O sistema MUST preservar historico de comentarios de workflow por conteudo.
- **FR-045**: O sistema MUST implementar newsletter/envio apenas quando aprovado, registrando campanha, destinatarios, quantidade enviada e log/relatorio de envio.
- **FR-046**: O sistema MUST NOT migrar SMTP, senhas, enderecos especificos ou configuracoes de e-mail do legado.
- **FR-047**: O sistema MUST implementar ouvidoria/contato apenas se houver decisao formal de produto, com status, responsavel, comentarios, notificacao e filtros administrativos.
- **FR-048**: O sistema MUST registrar auditoria de alteracoes relevantes com usuario, data, acao e entidade afetada, usando mecanismo nativo do Refresh.
- **FR-049**: O sistema MUST documentar impactos, testes, riscos, rollback e fluxo GitFlow antes de qualquer implementacao.
- **FR-050**: O sistema MUST manter `production` sem alteracao durante esta feature ate haver instrucao explicita de deploy ou mudanca operacional.

### Key Entities *(include if feature involves data)*

- **Usuario**: Pessoa que acessa o CMS; possui identidade, status, credenciais seguras, perfis, consentimento e historico.
- **Perfil**: Papel editorial ou administrativo; possui funcao, status, hierarquia, permissoes, menus, escopo de secoes e tipos de conteudo.
- **Permissao administrativa**: Capacidade concedida a perfil sobre area/aplicativo e acao especifica.
- **Secao**: Item hierarquico do portal usado como menu, rota, agrupador, contexto de publicacao e controle de acesso.
- **URL amigavel**: Identificador publico unico para secao ou conteudo, resolvido sem dependencia de rota tecnica antiga.
- **Conteudo**: Item publicavel central do portal, ligado a tipo, secao principal, autor/responsavel, status, validade, SEO, revisoes e midia.
- **Tipo de conteudo/Mascara**: Definicao configuravel de campos ativos, obrigatorios, rotulos, ajuda, tipos de entrada e validacoes.
- **Template/Bloco de exibicao**: Regra nativa de apresentacao/consulta para detalhe, lista, menu ou bloco, sem copiar templates legados.
- **SEO**: Metadados editoriais de pagina/conteudo com fallback.
- **Tag/Metatag**: Termo editorial associado a conteudo para classificacao, relacao e exibicao.
- **Anexo/Arquivo**: Documento relacionado a conteudo com metadados, ordem, tamanho, tipo e politica de acesso.
- **Galeria de imagens**: Conjunto de imagens relacionadas a conteudo com metadados e ordem.
- **Workflow editorial**: Encaminhamento de conteudo entre usuarios/perfis com comentario, responsavel, status e notificacao.
- **Newsletter/Campanha**: Envio em massa com remetente, assunto, corpo, destinatarios, status e logs.
- **Ouvidoria/Manifestacao**: Mensagem publica com status, responsavel, comentarios e resposta, somente se aprovada.
- **Auditoria**: Registro de acao relevante, entidade, usuario, metadados e data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das regras listadas nesta spec possuem classificacao de aderencia antes do inicio de implementacao.
- **SC-002**: 100% dos criterios minimos de aceite de publicacao, validade, URL, secao, menu, permissao, workflow, SEO, busca, anexos/galerias e credenciais estao rastreados para requisitos funcionais.
- **SC-003**: Nenhum arquivo, credencial, configuracao, caminho absoluto, SMTP, SQL, PHP, HTML, CSS, JavaScript ou asset do legado e copiado para o Refresh.
- **SC-004**: Conteudos nao publicados, excluidos ou fora de validade tem taxa de exposicao publica de 0% nos testes automatizados da primeira fatia que tocar publicacao.
- **SC-005**: URL amigavel duplicada entre secoes e conteudos e rejeitada em 100% dos testes automatizados aplicaveis.
- **SC-006**: Usuario com status diferente de `Ativo` falha autenticacao em 100% dos testes automatizados aplicaveis.
- **SC-007**: Permissoes administrativas bloqueiam operacoes nao autorizadas no backend em 100% dos testes de permissao da fatia implementada.
- **SC-008**: A primeira fatia aprovada pode ser validada independentemente, sem exigir implementacao simultanea de newsletter, ouvidoria, galeria, tags e workflow completo.
- **SC-009**: Todas as mudancas futuras de banco geradas por esta feature possuem migration versionada criada somente em dev e validada por teste de migrations antes de PR.
- **SC-010**: A documentacao tecnica da implementacao aprovada registra objetivo, decisoes, arquivos alterados, impactos, testes, riscos, rollback e fluxo GitFlow.

## Impactos Esperados

### Impactos em Banco

- Nenhum impacto de banco esta autorizado nesta etapa documental.
- A implementacao futura provavelmente exigira migrations para validade editorial, URL amigavel global por `FriendlyUrl`, tags, anexos/galerias, workflow editorial e possivelmente ouvidoria. Relacao de secoes associadas a conteudo fica para future spec fora da primeira fatia.
- Campos ja existentes que podem ser reaproveitados: `User`, `Role`, `Permission`, `RoleApplicationAccess`, `RoleSectionAccess`, `RoleContentTypeAccess`, `Section`, `Content`, `ContentType`, `Template`, `MediaAsset`, `SeoMetadata`, `ContentRevision`, `Newsletter*`, `SystemEmail`, `AuditLog`, `PrivacyRequest`.
- Qualquer migration futura MUST ser criada em `dev` pelo fluxo oficial `npm run docker:dev:migrate -- nome_em_snake_case`, nunca por `prisma db push` ou `prisma migrate reset`.

### Impactos em Ambiente

- Nenhuma alteracao em `production` esta autorizada nesta etapa.
- Implementacoes futuras devem preservar subpaths `/abbatech/portal` e `/abbatech/refresh`, API interna `api/v1` e API publica `/abbatech/api`.
- Mudancas futuras em URLs, API clients, previews, busca, uploads, newsletter ou notificacao devem ser avaliadas em `dev`, `local-prod` e `production` no plano antes de conclusao.
- Nenhum SMTP, segredo, IP, e-mail especifico ou configuracao antiga do legado pode ser incorporado a `.env`, exemplos versionados, Compose ou Dokploy.

### Testes Necessarios

- Auth: status de usuario, CPF/e-mail/username, perfil ativo e sessao.
- Permissoes: acessar, incluir, alterar, excluir, auditar; bloqueio backend por area.
- Secoes/menu: hierarquia, ordem, visibilidade, restricao, path descendente e breadcrumb.
- URL amigavel: unicidade global, geracao normalizada, resolucao e fallback.
- Conteudo: status publico, validade ativa/inativa, fim do dia, secao principal, secoes associadas, exclusao logica e revisao.
- Mascaras: campos ativos, obrigatorios, tipos de entrada, valores fixos e limites.
- Portal: listas, detalhes, blocos, busca, paginacao, ordenacao, SEO fallback e preview autorizado.
- Upload/midia: anexos, galerias, MIME/extensao/tamanho e metadados.
- Workflow: destinatario elegivel, comentario, responsavel, status e notificacao.
- Newsletter: criacao, destinatarios, envio, dispatch/log e ausencia de segredos legados, se aprovada.
- Ouvidoria: formulario, status, encaminhamento, resposta e filtros, se aprovada.
- Migrations: validacao estatica e deploy em banco `test`/`ci` quando houver mudanca de schema.

### Documentacao Esperada

- Esta spec, o `$speckit-plan` e o `$speckit-tasks` devem permanecer como trilha principal da decisao.
- A implementacao futura deve atualizar documentacao tecnica auditavel com arquivos alterados, logica aplicada, testes, riscos, rollback e fluxo GitFlow.
- Como `docs/*` e ignorado por padrao, qualquer documentacao versionada deve ser explicitamente liberada ou registrada em artefato Spec Kit/README/PR.

## Decisoes de Produto e Diferimentos

- **DP-001**: Resolvida por excecao formal humana. Branch atual/documentada `refactor/business-rules` mantida para esta feature/rodada porque a feature ja foi iniciada e documentada nessa branch. A excecao e limitada a esta feature e nao altera a regra geral da Refresh Constitution 1.1.0: futuras features, changes ou fixes devem usar branch especifica com prefixo `feature/*`, `change/*` ou `fix/*`. Nenhuma acao Git foi executada.
- **DP-002**: Resolvida para primeira fatia. Usar vocabulário nativo `draft`, `published`, `archived` com mapeamento de negocio dos status legados.
- **DP-003**: Resolvida para planejamento. Traduzir `Livre`, `Restrita_Aparente` e `Restrita` para politica nativa explicita de acesso de secao.
- **DP-004**: Resolvida para planejamento. Planejar entidade dedicada de URL amigavel global, salvo se o `$speckit-plan` demonstrar alternativa menor com risco equivalente.
- **DP-005**: Diferida. Conteudos relacionados ficam fora da primeira fatia.
- **DP-006**: Diferida. Newsletter fica fora da primeira fatia.
- **DP-007**: Diferida. Ouvidoria/contato fica fora de escopo ate decisao formal de produto.
- **DP-008**: Resolvida para primeira fatia. Usar tipo minimo/generico existente; tipos condicionais e catalogo legado amplo ficam para fases futuras.
- **DP-009**: Resolvida. Associacao multi-secao fica fora da primeira fatia e vai para backlog/future spec; primeira fatia usa `Content.sectionId` ou equivalente nativo para secao principal obrigatoria.
- **DP-010**: Resolvida. Permissao granular oficial de publicacao sera `contents.publish`; `contents.write` nao publica, nao altera para `published`, nao altera validade de publicacao e nao arquiva publicado sem `contents.publish`.
- **DP-011**: Resolvida. Entidade dedicada `FriendlyUrl` aprovada como fonte de verdade; `FriendlyUrl.path` unico global e campo publico canonico `url`.
- **DP-012**: Resolvida. Migrations somente em dev via `npm run docker:dev:migrate -- nome_em_snake_case`; `prisma db push`, `prisma migrate reset`, SQL manual e correcao direta em local-prod/production proibidos.

## Riscos

- **Critico**: Expor conteudo nao publicado, excluido, restrito ou fora de validade no portal.
- **Critico**: Publicacao indevida por usuario sem perfil publicador.
- **Critico**: Copiar segredo, SMTP, caminho absoluto ou configuracao antiga do legado.
- **Alto**: Criar modelos paralelos quando o Refresh ja possui entidades equivalentes.
- **Alto**: Quebrar subpaths publicos, API `api/v1` ou contratos de build por mudanca de URL.
- **Alto**: Criar migration fora do fluxo dev ou alterar banco sem plano.
- **Alto**: Expandir newsletter/ouvidoria sem aprovacao de produto.
- **Medio**: Manter status, nomes e tipos legados como string solta sem normalizacao.
- **Medio**: Duplicar logicas de publicacao em listas, busca, detalhe e blocos.

## Assumptions

- O Refresh continua sendo o CMS principal; o legado e somente fonte de comportamento.
- Regras ja cobertas por modelos existentes devem ser ajustadas no menor ponto possivel.
- O portal publico deve continuar respeitando os subpaths atuais.
- Dados legados reais nao serao migrados nesta feature sem plano separado de dados, backup e privacidade.
- Testes automatizados por risco sao obrigatorios para qualquer fatia implementada.
- Newsletter e ouvidoria nao entram automaticamente no MVP sem decisao de produto.
- Esta spec e deliberadamente mais ampla que a primeira fatia; o `$speckit-tasks` deve decompor implementacao incremental e parar apos MVP aprovado.
