# Feature Specification: Refinar escopo editorial por perfil e secao

**Feature Branch**: `feature/refine-editorial-scope-by-section`

**Created**: 2026-05-25

**Status**: Draft

**Input**: Criar uma subfatia pequena derivada da spec 001 para refinar somente o escopo editorial por perfil e secao, sem executar o backlog restante da portabilidade ICHC.

## Contexto e Objetivo

A primeira fatia da portabilidade ICHC protegeu publicacao, validade, URL amigavel global, menu publico, permissao granular de publicacao, SEO fallback e auditoria minima. Esta nova feature trata apenas do proximo risco: garantir que usuarios editoriais so possam listar, criar, editar ou publicar conteudos nas secoes permitidas pelo seu perfil.

Esta spec nao reabre a spec 001 como fila de implementacao. Ela isola a antiga T033 em uma feature menor, com escopo testavel e sem incluir workflow completo, multi-secao, catalogo legado de tipos, busca publica, newsletter, ouvidoria, anexos, galerias ou novas regras de menu publico.

## User Scenarios & Testing

### User Story 1 - Bloquear operacoes editoriais fora do escopo (Priority: P1)

Como responsavel editorial, quero que o sistema impeça operacoes de conteudo em secoes fora do perfil ativo do usuario, para evitar publicacao ou alteracao indevida em areas institucionais que nao pertencem ao editor.

**Why this priority**: A primeira fatia ja bloqueou publicacao sem permissao; sem escopo por secao, um usuario autorizado a editar ainda pode atuar na area errada.

**Independent Test**: Um usuario com permissao editorial para uma secao permitida consegue operar nessa secao, mas recebe bloqueio seguro ao tentar operar em outra secao.

**Acceptance Scenarios**:

1. **Given** um usuario com permissao editorial e escopo apenas para a secao A, **When** ele cria conteudo na secao A, **Then** a operacao e permitida se as demais regras forem validas.
2. **Given** o mesmo usuario com escopo apenas para a secao A, **When** ele tenta criar ou atualizar conteudo na secao B, **Then** a operacao e negada por autorizacao e nenhuma alteracao e persistida.
3. **Given** um conteudo existente em uma secao fora do escopo do usuario, **When** o usuario tenta alterar status, validade, slug, secao principal ou dados editoriais, **Then** a operacao e negada antes de persistir.

---

### User Story 2 - Listar conteudos administrativos por escopo editorial (Priority: P2)

Como editor, quero visualizar no manager apenas conteudos das secoes que posso acessar ou publicar, para reduzir erro operacional e evitar exposicao administrativa desnecessaria.

**Why this priority**: A listagem administrativa orienta o trabalho editorial diario; se ela mostrar conteudo fora do escopo, o usuario pode tentar acoes que serao bloqueadas tarde demais.

**Independent Test**: A listagem administrativa de conteudos retorna somente itens das secoes permitidas ao perfil ativo, exceto para perfis com acesso amplo explicitamente autorizado.

**Acceptance Scenarios**:

1. **Given** um usuario com escopo para secoes A e B, **When** ele abre a lista administrativa de conteudos, **Then** apenas conteudos de A e B sao retornados.
2. **Given** um usuario sem secoes permitidas e sem perfil amplo, **When** ele abre a lista administrativa, **Then** nenhum conteudo fora de escopo e retornado.
3. **Given** um administrador com acesso amplo aprovado, **When** ele abre a lista administrativa, **Then** o acesso amplo e aplicado de forma explicita e testada.

---

### User Story 3 - Preservar separacao entre acesso publico e escopo editorial (Priority: P2)

Como responsavel de produto, quero que a regra de escopo editorial nao confunda politica publica de secao com permissao de edicao, para manter o portal seguro e o manager governado por perfis.

**Why this priority**: A spec 001 separou menu publico, conteudo publico e permissao de publicacao. Esta feature deve preservar essa separacao para nao reintroduzir vazamento ou permissao ampla por engano.

**Independent Test**: Alteracoes de escopo editorial nao mudam o comportamento publico ja validado; secoes publicas continuam controlando exibicao publica, enquanto escopo editorial controla operacoes administrativas.

**Acceptance Scenarios**:

1. **Given** uma secao publica sem permissao editorial para determinado usuario, **When** esse usuario tenta editar conteudo dessa secao, **Then** a visibilidade publica da secao nao concede permissao administrativa.
2. **Given** uma secao permitida para edicao, **When** ela possui politica publica restritiva, **Then** a permissao editorial nao altera automaticamente a exposicao publica.

### Edge Cases

- Usuario com permissao de escrita, mas sem secoes permitidas.
- Usuario com multiplos perfis e escopos diferentes.
- Perfil com acesso amplo administrativo.
- Secao inativa ou removida do escopo apos o conteudo existir.
- Tentativa de mover conteudo de uma secao permitida para uma secao nao permitida.
- Escopo em secao pai com filhos: a regra deve seguir o comportamento de negocio do legado em `legado/`, tratando associacao perfil-secao como permissao editorial explicita e nao como heranca automatica ampla, salvo decisao humana posterior.

## Requirements

### Functional Requirements

- **FR-001**: O sistema MUST determinar o escopo editorial do usuario autenticado a partir do perfil ativo e das secoes associadas a esse perfil.
- **FR-002**: O sistema MUST aplicar o escopo editorial em operacoes administrativas de conteudo que listam, criam, atualizam, publicam, arquivam ou alteram validade editorial.
- **FR-003**: O sistema MUST negar operacoes de conteudo quando a secao principal solicitada estiver fora do escopo editorial do usuario.
- **FR-004**: O sistema MUST impedir que um usuario mova conteudo para uma secao fora de seu escopo editorial.
- **FR-005**: O sistema MUST garantir que uma negacao por escopo editorial nao persista alteracao parcial.
- **FR-006**: O sistema MUST diferenciar politica publica de secao de escopo editorial; `public`, `restricted_visible` e `restricted_hidden` nao devem conceder permissao administrativa por si so.
- **FR-007**: O sistema MUST preservar a regra ja implementada de que publicar ou alterar publicacao exige permissao granular de publicacao alem do escopo de secao.
- **FR-008**: O sistema MUST tratar usuario sem secoes permitidas como sem escopo editorial, salvo perfil amplo explicitamente aprovado.
- **FR-009**: O sistema MUST seguir a regra de negocio extraida do legado para escopo por secao: um perfil pode atuar nas secoes explicitamente associadas ao seu escopo editorial, e descendentes so entram no escopo quando tambem forem cobertos por regra explicita documentada e testada.
- **FR-010**: O sistema MUST preservar comportamento publico ja validado da primeira fatia: conteudo publico, menu publico, validade, URL amigavel e SEO fallback nao devem mudar por esta feature.
- **FR-011**: O sistema MUST retornar erro seguro de autorizacao para tentativas fora do escopo, sem vazar dados de secoes ou conteudos nao permitidos.
- **FR-012**: O sistema MUST ficar fora de escopo para workflow editorial completo, multi-secao de conteudo, busca publica, newsletter, ouvidoria, anexos, galerias e catalogo legado amplo.

### Key Entities

- **Usuario editorial**: pessoa autenticada que opera o manager/Refresh admin.
- **Perfil ativo**: papel editorial ou administrativo que define permissoes e escopo.
- **Secao permitida**: secao que um perfil pode acessar, editar ou publicar conforme regra aprovada.
- **Conteudo**: item editorial associado a uma secao principal.
- **Escopo editorial**: conjunto de secoes em que um usuario pode atuar administrativamente.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% dos testes de operacao fora de escopo negam a acao e confirmam que nenhuma alteracao foi persistida.
- **SC-002**: 100% dos testes de operacao dentro do escopo continuam permitindo a acao quando as demais permissoes tambem forem validas.
- **SC-003**: Listagens administrativas testadas nao retornam conteudo fora do escopo editorial para usuarios sem acesso amplo.
- **SC-004**: Nenhum teste publico da primeira fatia passa a falhar por causa desta feature.
- **SC-005**: A decisao sobre heranca de escopo entre secao pai e descendentes fica registrada antes de qualquer implementacao que dependa dela.

## Assumptions

- A feature parte da primeira fatia da spec 001 ja implementada e validada.
- `contents.publish` continua sendo exigida para publicacao; escopo de secao nao substitui permissao granular.
- A politica publica de secao controla exibicao/acesso publico; escopo editorial controla operacoes administrativas.
- A implementacao deve preferir comportamento conservador quando o usuario nao tiver escopo definido.
- A regra de negocio de secoes deve ser extraida de `legado/` como fonte de comportamento, especialmente `perfil_secao`, `perfil_secao_acesso`, hierarquia de perfil e hierarquia de secao, sem copiar codigo, SQL, HTML, CSS ou estrutura do legado.
- Fases futuras devem ser autorizadas em specs ou subfatias menores, sem executar o backlog inteiro da spec 001.
