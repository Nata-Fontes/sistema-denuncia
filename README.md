# Sistema Web de Denúncias Anônimas — Protótipo

Protótipo de sistema web para registro, acompanhamento e gerenciamento de
denúncias anônimas, desenvolvido com **HTML5, CSS3 e JavaScript puro**
(sem frameworks e sem back-end), pensado para ser publicado no **GitHub
Pages**.

> ⚠️ **É um protótipo educacional.** Os dados ficam salvos apenas no
> `localStorage` do navegador de quem acessa — não há servidor, banco de
> dados real ou envio de informações pela rede. Não substitui o registro
> oficial de boletim de ocorrência.

---

## 1. Estrutura de arquivos

```
denuncia-anonima/
├── index.html            # Página inicial — apresentação e seleção de perfil
├── denunciante.html       # Perfil Denunciante — nova denúncia e acompanhamento
├── admin-login.html       # Login do perfil Administrador
├── admin.html              # Painel do Administrador (protegido por sessão)
├── css/
│   └── style.css          # Folha de estilos única, compartilhada por todas as páginas
├── js/
│   ├── storage.js         # Camada de dados (localStorage) — usada por TODAS as páginas
│   ├── denunciante.js      # Lógica exclusiva de denunciante.html
│   └── admin.js             # Lógica exclusiva de admin.html
└── README.md
```

**Por que essa organização?**
- HTML, CSS e JavaScript ficam em arquivos separados, como pedido.
- `storage.js` concentra todas as regras de dados (criar denúncia, gerar
  protocolo, listar, filtrar, atualizar status) em um único lugar. Isso
  evita duplicar lógica entre a tela do denunciante e a do administrador —
  é a forma como o projeto "otimiza recursos": qualquer mudança no formato
  dos dados é feita em um só arquivo.
- Cada perfil tem seu próprio arquivo `.js` com *apenas* o comportamento
  daquela tela, então cada página carrega só o código que efetivamente usa.
- `style.css` é único e usa variáveis CSS (`:root`) para cores, tipografia
  e espaçamentos, garantindo consistência visual entre os dois perfis sem
  duplicar regras.

---

## 2. Perfis de acesso

### 2.1 Usuário / Denunciante (`denunciante.html`) — sem login

| Funcionalidade | Descrição |
|---|---|
| Registrar denúncia | Formulário com categoria, título, descrição, local, data da ocorrência, nível de urgência e anexo opcional (nome do arquivo, sem upload real). |
| Protocolo automático | Ao enviar, o sistema gera um protocolo único (`DN-AAAA-0000`) e o exibe em destaque — é a única "chave" para consultar o caso depois. |
| Acompanhar denúncia | Aba separada onde o denunciante digita o protocolo e vê o status atual e a linha do tempo completa do caso. |
| Anonimato | Nenhum dado pessoal (nome, e-mail, telefone) é solicitado em nenhuma etapa. |

### 2.2 Administrador da Delegacia (`admin-login.html` → `admin.html`)

| Funcionalidade | Descrição |
|---|---|
| Login | Tela de autenticação simples (usuário/senha fixos, apenas para demonstração). Sessão controlada via `sessionStorage`; o painel redireciona para o login se não houver sessão ativa. |
| Painel de estatísticas | Cartões com a contagem de denúncias em cada status (Recebida, Em análise, Em investigação, Concluída, Arquivada). |
| Filtros | Busca por protocolo/título, e filtros por status, categoria e nível de urgência — combináveis entre si. |
| Listagem | Tabela com todas as denúncias, responsiva (rolagem horizontal em telas pequenas). |
| Detalhes da denúncia | Modal com descrição completa, local, data, anexo e histórico integral de status. |
| Atualizar status | No mesmo modal, o administrador muda o status (com observação interna opcional) — a mudança é registrada na linha do tempo, visível também para o denunciante. |
| Logout | Encerra a sessão e retorna à página inicial. |

**Credenciais de demonstração:**
`usuário: admin` · `senha: delegacia123`
(definidas em `js/storage.js`, constante `DA_ADMIN_CREDENCIAIS`)

---

## 3. Fluxo de status de uma denúncia

```
Recebida → Em análise → Em investigação → Concluída
                                   ↘
                                 Arquivada
```

Cada mudança de status fica registrada com data/hora e observação,
formando a linha do tempo que tanto o denunciante quanto o administrador
podem visualizar.

---

## 4. Como testar localmente

Não é necessário instalar nada. Basta abrir `index.html` diretamente no
navegador, ou servir a pasta com qualquer servidor estático, por exemplo:

```bash
npx serve denuncia-anonima
# ou
python3 -m http.server --directory denuncia-anonima 8080
```

Na primeira execução, o sistema já cria 4 denúncias de exemplo
automaticamente (protocolos `DN-2026-0001` a `DN-2026-0004`), para que o
painel do administrador não fique vazio durante os testes.

---

## 5. Publicando no GitHub Pages

1. Crie um repositório no GitHub e envie o conteúdo desta pasta
   (`denuncia-anonima/`) para a raiz do repositório (ou para uma subpasta,
   ajustando o passo 3).
2. No GitHub, vá em **Settings → Pages**.
3. Em **Branch**, selecione a branch principal (`main`) e a pasta `/root`
   (ou `/docs`, se preferir mover os arquivos para lá).
4. Salve. Em alguns minutos o GitHub fornecerá uma URL pública no formato
   `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
5. Como o projeto é 100% estático (HTML/CSS/JS), nenhuma configuração
   adicional de build é necessária.

---

## 6. Possíveis evoluções futuras

- Substituir o `localStorage` por uma API real (back-end + banco de
  dados), mantendo `storage.js` como a única camada a ser trocada.
- Autenticação de administrador via servidor, com senha em hash.
- Upload real de anexos (com armazenamento em nuvem).
- Múltiplos administradores com níveis de permissão distintos.
- Notificações ao denunciante quando o status muda (exigiria algum canal
  de contato opcional e voluntário, sem quebrar o anonimato por padrão).
