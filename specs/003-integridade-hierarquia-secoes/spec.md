# Feature Specification: Integridade de hierarquia e caminhos de secoes

**Feature Branch atual**: `feature/section-path-friendlyurl-propagation`
**Branch inicial da spec**: `feature/section-hierarchy-path-integrity`, usada para concluir US1/T001-T008
**Created**: 2026-05-25  
**Status**: Draft  
**Input**: Proxima subfatia de regras de negocio de secoes do CMS legado ICHC, usando `legado/` apenas como fonte de comportamento.

## User Scenarios & Testing

### User Story 1 - Impedir hierarquia invalida (Priority: P1)

Como administrador de conteudo, quero que uma secao nao possa ser movida para ela mesma nem para uma descendente, para evitar ciclos e corrupcao da arvore.

**Independent Test**: ao tentar definir a propria secao ou uma descendente como pai, a operacao falha com erro seguro e nenhuma secao, `FriendlyUrl` ou auditoria e persistida.

### User Story 2 - Propagar caminhos ao renomear ou mover secao (Priority: P1)

Como administrador de conteudo, quero que renomear ou mover uma secao atualize os caminhos das secoes descendentes, para que a navegacao, URL canonica e breadcrumbs continuem coerentes.

**Independent Test**: ao mover `/institucional` para `/portal/institucional`, descendentes como `/institucional/sobre` passam para `/portal/institucional/sobre`, com `FriendlyUrl` de cada secao atualizado.

### User Story 3 - Preservar ordem e breadcrumb administrativo (Priority: P2)

Como editor, quero ver secoes em ordem e com caminho hierarquico coerente, para localizar corretamente onde o conteudo sera publicado.

**Independent Test**: listagens administrativas de secoes retornam paths atualizados e ordenacao previsivel por caminho/ordem, sem depender de nomes ou markup do legado.

## Requirements

### Functional Requirements

- **FR-001**: O sistema MUST tratar o legado apenas como fonte de regra de negocio, sem copiar PHP, SQL, HTML, CSS, JavaScript, assets, cache, credenciais ou configuracoes antigas.
- **FR-002**: A branch desta spec MUST ser `feature/section-hierarchy-path-integrity`.
- **FR-003**: A feature MUST preservar o modelo nativo do Refresh, usando `Section.parentId`, `Section.slug`, `Section.path`, `Section.order` e `FriendlyUrl`.
- **FR-004**: O sistema MUST rejeitar mover uma secao para ela mesma.
- **FR-005**: O sistema MUST rejeitar mover uma secao para qualquer descendente direta ou indireta.
- **FR-006**: Ao renomear uma secao, o sistema MUST recalcular seu `slug` e `path` canonico conforme normalizacao nativa atual.
- **FR-007**: Ao mover uma secao para outro pai, o sistema MUST recalcular seu `path` com base no `path` do novo pai.
- **FR-008**: Ao alterar `path` de uma secao, o sistema MUST recalcular recursivamente os `path` das descendentes.
- **FR-009**: Ao recalcular paths, o sistema MUST atualizar `FriendlyUrl` de cada secao afetada.
- **FR-010**: Se qualquer novo path colidir com `FriendlyUrl` existente de outro alvo, a operacao MUST falhar antes de deixar estado parcial.
- **FR-011**: Se qualquer novo path colidir com `Section.path` existente de outra secao, a operacao MUST falhar antes de deixar estado parcial.
- **FR-012**: Listagens administrativas MUST continuar retornando caminhos hierarquicos coerentes apos renomear ou mover secoes.
- **FR-013**: Ordem de secoes MUST permanecer baseada no campo nativo `order`, com desempate previsivel ja existente.
- **FR-014**: A feature MUST NOT alterar regra de menu publico, `Section.accessPolicy`, public policy de conteudo ou escopo editorial por perfil.
- **FR-015**: A feature MUST NOT criar migration, seed ou novo modelo se o schema atual for suficiente.

## Scope

### In Scope

- Validacao de parentId em update de secao.
- Recalculo seguro de `Section.path` para descendentes.
- Atualizacao de `FriendlyUrl` para secoes afetadas.
- Testes de regressao para ciclo, move, rename, colisao e ausencia de estado parcial.
- Documentacao de regra de negocio extraida do legado.

### Out of Scope

- Redesenho do Portal ou Refresh admin.
- Mudancas em menu publico.
- Multi-secao de conteudo.
- Workflow editorial.
- Links externos/nova janela de secao.
- Cache legado.
- Importacao ou backfill de dados do legado.
- Migration, seed, Docker, Compose, env, local-prod ou production.

## Legacy Behavior Evidence

Evidencias usadas apenas para comportamento:

- `legado/Manager/Secao.php`: usa cadeia de ancestralidade (`secao_dna`) e nome/caminho ordenado (`secao_nome_ordem`), recalculando descendentes quando a hierarquia muda.
- `legado/Manager/Secao.php`: valida URL amigavel de secao antes de salvar.
- `legado/Manager/website.sql`: modela `secao_dna`, `secao_nome_ordem`, `secao_ordem`, `secao_url_amigavel` e `url_amigavel`.

## Success Criteria

- **SC-001**: Tentativas de mover uma secao para si mesma ou descendente sao rejeitadas em 100% dos casos cobertos por teste.
- **SC-002**: Renomear ou mover uma secao com descendentes atualiza todos os paths descendentes e suas URLs amigaveis em um unico fluxo seguro.
- **SC-003**: Colisoes de path/URL impedem persistencia parcial.
- **SC-004**: Nenhuma mudanca de schema, migration ou seed e necessaria para completar a fatia.
- **SC-005**: Testes especificos de `sections.service` e typecheck da API passam durante desenvolvimento da subfatia.
- **SC-006**: Antes de commit/PR, a branch executa e registra o gate completo: `test:security`, `test:api`, `typecheck`, `lint`, `test:portal`, `test:refresh`, `test:migrations`, `test:ci`, `test:smoke` quando houver stack de teste, e `test:all -- --skip-playwright-install` ou equivalente manual documentado quando o harness estiver bloqueado.

## Assumptions

- O schema atual ja possui campos suficientes para esta fatia.
- `FriendlyUrl` ja e a fonte de verdade planejada para URL amigavel global.
- Breadcrumb administrativo pode ser derivado de `Section.path` e/ou hierarquia atual sem novo campo persistido.
