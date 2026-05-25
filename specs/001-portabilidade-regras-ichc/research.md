# Research: Portabilidade de regras de negocio do CMS legado ICHC

## Decision: Planejamento documental sem executar setup/hook Git

**Rationale**: O workspace possui hooks opcionais de commit antes/depois de plan e o script padrao do Spec Kit depende de contexto de branch. A instrucao do usuario proibiu qualquer acao Git, commit, checkout, reset, branch change e regularizacao automatica de `refactor/business-rules`.

**Alternatives considered**:

- Executar setup/hook padrao: rejeitado por risco de acao Git ou falha de branch.
- Regularizar branch automaticamente: rejeitado por DP-001 e instrucao explicita.
- Gerar artefatos manualmente a partir do template: escolhido por ser documental, auditavel e seguro.

## Decision: Usar status nativos `draft`, `published`, `archived`

**Rationale**: O schema e os contratos ja usam `ContentStatus = "draft" | "published" | "archived"`. Manter status legados como strings principais criaria divergencia e risco de CMS paralelo.

**Alternatives considered**:

- Manter `Novo`, `Publicado`, `Rascunho`, `Complemento`, `Excluido`: rejeitado por conflito com contratos atuais.
- Criar campo duplo `legacyStatus`: rejeitado para primeira fatia por adicionar acoplamento ao legado.
- Mapear termos legados para status nativos: escolhido.

## Decision: Policy publica compartilhada para conteudo

**Rationale**: Hoje `listPublished` filtra `status = "published"`, mas `findBySlug` retorna conteudo por slug sem filtro publico. A mesma regra deve proteger lista, detalhe, URL, busca e blocos.

**Alternatives considered**:

- Ajustar apenas endpoints atuais: rejeitado porque futura busca/blocos poderiam divergir.
- Criar helper/service de policy publica: escolhido.

## Decision: Planejar entidade dedicada de URL amigavel global

**Rationale**: `Section.slug/path` e `Content.slug` sao unicos separadamente. A regra exige unicidade global entre secoes e conteudos e resolucao do alvo. Uma entidade central reduz duplicacao e risco de colisao.

**Alternatives considered**:

- Validacao cruzada entre tabelas: menor migration, mas espalha regra em services e dificulta resolucao/backfill.
- Manter unicidade separada: rejeitado por nao atender criterio de aceite.
- Entidade `FriendlyUrl`: escolhido para planejamento.

## Decision: Traduzir controle de secao para politica nativa

**Rationale**: O legado usa `Livre`, `Restrita_Aparente`, `Restrita`. O Refresh ja possui `visibleInMenu`, `isActive` e `RoleSectionAccess`, mas isso nao distingue aparecer no menu de poder acessar. Uma policy nativa explicita evita vazamento.

**Alternatives considered**:

- Copiar nomes do legado: rejeitado por acoplamento textual.
- Derivar tudo de campos existentes: rejeitado por ambiguidade.
- Adicionar `accessPolicy` nativa: escolhido para planejamento.

## Decision: Primeira fatia nao inclui catalogo legado de mascaras

**Rationale**: `ContentType.schemaJson` ja permite mascara configuravel. Reproduzir todos os tipos legados por inercia aumenta escopo e cria CMS paralelo.

**Alternatives considered**:

- Seed de todos os tipos legados: rejeitado.
- Tipo minimo/generico existente: escolhido.
- Tipos condicionais por produto em fases futuras: mantido.

## Decision: Newsletter, ouvidoria, tags, anexos, galerias e workflow completo ficam fora da primeira fatia

**Rationale**: Esses dominios nao bloqueiam publicacao, validade e URL. Newsletter e ouvidoria envolvem e-mail, dados pessoais e decisoes de produto; anexos/galerias envolvem upload e LGPD; workflow completo exige modelo proprio de comentarios/notificacao.

**Alternatives considered**:

- Incluir tudo em uma entrega: rejeitado pela spec e pela Constitution.
- Planejar fases futuras com specs proprias: escolhido.

## Decision: Seeds devem ser minimas e idempotentes

**Rationale**: Bootstrap atual ja cria permissoes e Administrador. Para primeira fatia, a necessidade provavel e uma permissao granular de publicacao (`contents.publish`) e talvez perfil/funcoes editoriais em ambiente de teste.

**Alternatives considered**:

- Seed demo de catalogo legado: rejeitado.
- Seed minima por permissao/tipo generico: escolhido se faltar dado essencial.

## Decision: Validacoes por ambiente sem alterar ambientes nesta etapa

**Rationale**: A Constitution exige `dev`, `local-prod` e production separados e reprodutiveis. O plano define validacoes, mas nao muda Compose, Docker, envs ou deploy.

**Alternatives considered**:

- Alterar scripts/Compose para acomodar feature: rejeitado nesta etapa.
- Validar apenas local: rejeitado para feature com banco/auth/portal.
- Planejar validacoes graduais por ambiente: escolhido.
