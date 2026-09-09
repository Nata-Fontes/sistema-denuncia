/**
 * storage.js
 * -----------------------------------------------------------------------
 * Camada de dados do protótipo "Sistema Web de Denúncias Anônimas".
 *
 * Este é um protótipo estático (HTML/CSS/JS puro) pensado para rodar no
 * GitHub Pages, ou seja, sem servidor/back-end real. Por isso, o
 * localStorage do navegador faz o papel de "banco de dados".
 *
 * Centralizar toda a leitura/escrita AQUI (em vez de repetir em
 * denunciante.js e admin.js) é a forma de "otimizar recursos": um único
 * lugar de verdade para o formato dos dados, evitando código duplicado
 * e inconsistências entre as duas telas.
 *
 * Este arquivo é carregado por TODAS as páginas (index, denunciante e
 * admin), sempre antes do script específico de cada uma.
 * -----------------------------------------------------------------------
 */

const DA_STORAGE_KEY = 'da_denuncias_v1';
const DA_SESSION_KEY = 'da_admin_sessao_v1';

/** Estados possíveis do fluxo de uma denúncia. */
const DA_STATUS = {
  RECEBIDA: 'recebida',
  EM_ANALISE: 'em_analise',
  EM_INVESTIGACAO: 'em_investigacao',
  CONCLUIDA: 'concluida',
  ARQUIVADA: 'arquivada',
};

/** Ordem em que os status aparecem em selects e no funil de estatísticas. */
const DA_STATUS_ORDEM = [
  DA_STATUS.RECEBIDA,
  DA_STATUS.EM_ANALISE,
  DA_STATUS.EM_INVESTIGACAO,
  DA_STATUS.CONCLUIDA,
  DA_STATUS.ARQUIVADA,
];

const DA_STATUS_LABEL = {
  [DA_STATUS.RECEBIDA]: 'Recebida',
  [DA_STATUS.EM_ANALISE]: 'Em análise',
  [DA_STATUS.EM_INVESTIGACAO]: 'Em investigação',
  [DA_STATUS.CONCLUIDA]: 'Concluída',
  [DA_STATUS.ARQUIVADA]: 'Arquivada',
};

const DA_CATEGORIAS = [
  'Furto',
  'Roubo',
  'Violência doméstica',
  'Tráfico de drogas',
  'Perturbação do sossego',
  'Vandalismo / Dano ao patrimônio',
  'Ameaça',
  'Outro',
];

const DA_URGENCIA_LABEL = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

/**
 * Credenciais fixas do administrador, apenas para fins de demonstração.
 * Em um sistema real, o login aconteceria em um servidor, com a senha
 * armazenada como hash (nunca em texto puro e nunca no front-end).
 */
const DA_ADMIN_CREDENCIAIS = {
  usuario: 'admin',
  senha: 'delegacia123',
};

/* ----------------------------------------------------------------------
 * DataStore: CRUD das denúncias
 * -------------------------------------------------------------------- */
const DataStore = {
  /** Lê a lista completa do localStorage (uso interno). */
  _lerTudo() {
    const bruto = localStorage.getItem(DA_STORAGE_KEY);
    if (!bruto) return [];
    try {
      return JSON.parse(bruto);
    } catch (erro) {
      console.error('Não foi possível ler as denúncias salvas.', erro);
      return [];
    }
  },

  /** Persiste a lista completa no localStorage (uso interno). */
  _salvarTudo(lista) {
    localStorage.setItem(DA_STORAGE_KEY, JSON.stringify(lista));
  },

  /**
   * Popula o "banco" com denúncias de exemplo na primeira execução, para
   * que o painel do Administrador não fique vazio ao testar o protótipo.
   * Não faz nada se já existirem dados salvos.
   */
  seed() {
    if (localStorage.getItem(DA_STORAGE_KEY)) return;

    const agora = Date.now();
    const dia = 24 * 60 * 60 * 1000;

    const exemplos = [
      {
        protocolo: 'DN-2026-0001',
        categoria: 'Perturbação do sossego',
        titulo: 'Som alto reincidente durante a madrugada',
        descricao:
          'Há cerca de três semanas, um estabelecimento na região vem realizando eventos com som em volume muito alto após as 23h, impedindo o descanso dos moradores da quadra.',
        local: 'Rua das Palmeiras, próximo ao nº 480 — Centro',
        dataOcorrencia: new Date(agora - 6 * dia).toISOString().slice(0, 10),
        urgencia: 'baixa',
        anexoNome: null,
        status: DA_STATUS.EM_ANALISE,
        dataRegistro: new Date(agora - 6 * dia).toISOString(),
        historico: [
          {
            status: DA_STATUS.RECEBIDA,
            data: new Date(agora - 6 * dia).toISOString(),
            observacao: 'Denúncia registrada pelo sistema.',
          },
          {
            status: DA_STATUS.EM_ANALISE,
            data: new Date(agora - 4 * dia).toISOString(),
            observacao: 'Encaminhada para triagem da equipe de plantão.',
          },
        ],
      },
      {
        protocolo: 'DN-2026-0002',
        categoria: 'Vandalismo / Dano ao patrimônio',
        titulo: 'Pichação e dano a praça pública',
        descricao:
          'Bancos e equipamentos da praça municipal foram danificados e pichados durante a noite. Há também um poste de iluminação quebrado.',
        local: 'Praça Central, em frente à biblioteca municipal',
        dataOcorrencia: new Date(agora - 10 * dia).toISOString().slice(0, 10),
        urgencia: 'media',
        anexoNome: 'foto_praca.jpg',
        status: DA_STATUS.EM_INVESTIGACAO,
        dataRegistro: new Date(agora - 10 * dia).toISOString(),
        historico: [
          {
            status: DA_STATUS.RECEBIDA,
            data: new Date(agora - 10 * dia).toISOString(),
            observacao: 'Denúncia registrada pelo sistema.',
          },
          {
            status: DA_STATUS.EM_ANALISE,
            data: new Date(agora - 9 * dia).toISOString(),
            observacao: 'Triagem concluída, caso classificado como procedente.',
          },
          {
            status: DA_STATUS.EM_INVESTIGACAO,
            data: new Date(agora - 7 * dia).toISOString(),
            observacao: 'Equipe de patrulhamento notificada para reforço no local.',
          },
        ],
      },
      {
        protocolo: 'DN-2026-0003',
        categoria: 'Ameaça',
        titulo: 'Ameaças verbais reiteradas a comerciante local',
        descricao:
          'Um comerciante da região vem recebendo ameaças verbais de um indivíduo não identificado, associadas a uma suposta cobrança irregular.',
        local: 'Av. Brasil, comércio próximo ao nº 1200',
        dataOcorrencia: new Date(agora - 2 * dia).toISOString().slice(0, 10),
        urgencia: 'alta',
        anexoNome: null,
        status: DA_STATUS.RECEBIDA,
        dataRegistro: new Date(agora - 2 * dia).toISOString(),
        historico: [
          {
            status: DA_STATUS.RECEBIDA,
            data: new Date(agora - 2 * dia).toISOString(),
            observacao: 'Denúncia registrada pelo sistema.',
          },
        ],
      },
      {
        protocolo: 'DN-2026-0004',
        categoria: 'Furto',
        titulo: 'Furto de bicicleta em via pública',
        descricao:
          'Bicicleta furtada enquanto estava presa a um poste durante o período da tarde. Não há testemunhas identificadas até o momento.',
        local: 'Rua dos Ipês, esquina com Rua das Acácias',
        dataOcorrencia: new Date(agora - 30 * dia).toISOString().slice(0, 10),
        urgencia: 'baixa',
        anexoNome: null,
        status: DA_STATUS.CONCLUIDA,
        dataRegistro: new Date(agora - 30 * dia).toISOString(),
        historico: [
          {
            status: DA_STATUS.RECEBIDA,
            data: new Date(agora - 30 * dia).toISOString(),
            observacao: 'Denúncia registrada pelo sistema.',
          },
          {
            status: DA_STATUS.EM_ANALISE,
            data: new Date(agora - 28 * dia).toISOString(),
            observacao: 'Caso analisado e encaminhado à unidade responsável.',
          },
          {
            status: DA_STATUS.CONCLUIDA,
            data: new Date(agora - 20 * dia).toISOString(),
            observacao: 'Boletim de ocorrência formal registrado pela vítima. Caso concluído.',
          },
        ],
      },
    ];

    this._salvarTudo(exemplos);
  },

  /** Gera um protocolo sequencial único no formato DN-AAAA-0000. */
  gerarProtocolo() {
    const lista = this._lerTudo();
    const ano = new Date().getFullYear();
    const numero = lista.length + 1;
    return `DN-${ano}-${String(numero).padStart(4, '0')}`;
  },

  /**
   * Cria e salva uma nova denúncia.
   * @param {Object} dados - campos vindos do formulário do denunciante.
   * @returns {Object} a denúncia criada (já com protocolo e histórico).
   */
  criarDenuncia(dados) {
    const lista = this._lerTudo();
    const protocolo = this.gerarProtocolo();
    const agoraISO = new Date().toISOString();

    const novaDenuncia = {
      protocolo,
      categoria: dados.categoria,
      titulo: dados.titulo,
      descricao: dados.descricao,
      local: dados.local,
      dataOcorrencia: dados.dataOcorrencia,
      urgencia: dados.urgencia,
      anexoNome: dados.anexoNome || null,
      status: DA_STATUS.RECEBIDA,
      dataRegistro: agoraISO,
      historico: [
        {
          status: DA_STATUS.RECEBIDA,
          data: agoraISO,
          observacao: 'Denúncia registrada pelo sistema.',
        },
      ],
    };

    lista.push(novaDenuncia);
    this._salvarTudo(lista);
    return novaDenuncia;
  },

  /** Retorna todas as denúncias, da mais recente para a mais antiga. */
  listarDenuncias() {
    return this._lerTudo().sort(
      (a, b) => new Date(b.dataRegistro) - new Date(a.dataRegistro)
    );
  },

  /** Busca uma denúncia pelo número de protocolo (usado pelo denunciante). */
  buscarPorProtocolo(protocolo) {
    const alvo = (protocolo || '').trim().toUpperCase();
    return this._lerTudo().find((d) => d.protocolo.toUpperCase() === alvo) || null;
  },

  /**
   * Atualiza o status de uma denúncia e registra a mudança no histórico.
   * Usado exclusivamente pelo Administrador.
   */
  atualizarStatus(protocolo, novoStatus, observacao) {
    const lista = this._lerTudo();
    const indice = lista.findIndex((d) => d.protocolo === protocolo);
    if (indice === -1) return null;

    lista[indice].status = novoStatus;
    lista[indice].historico.push({
      status: novoStatus,
      data: new Date().toISOString(),
      observacao: observacao && observacao.trim() ? observacao.trim() : 'Status atualizado pela equipe responsável.',
    });

    this._salvarTudo(lista);
    return lista[indice];
  },

  /** Conta quantas denúncias existem em cada status, para o dashboard. */
  contarPorStatus() {
    const lista = this._lerTudo();
    const contagem = {};
    DA_STATUS_ORDEM.forEach((s) => (contagem[s] = 0));
    lista.forEach((d) => {
      contagem[d.status] = (contagem[d.status] || 0) + 1;
    });
    return contagem;
  },
};

/* ----------------------------------------------------------------------
 * AuthStore: sessão simples do administrador (apenas para o protótipo)
 * -------------------------------------------------------------------- */
const AuthStore = {
  login(usuario, senha) {
    const ok =
      usuario.trim() === DA_ADMIN_CREDENCIAIS.usuario &&
      senha === DA_ADMIN_CREDENCIAIS.senha;
    if (ok) {
      sessionStorage.setItem(DA_SESSION_KEY, '1');
    }
    return ok;
  },

  logout() {
    sessionStorage.removeItem(DA_SESSION_KEY);
  },

  sessaoAtiva() {
    return sessionStorage.getItem(DA_SESSION_KEY) === '1';
  },
};

// Garante que sempre existam dados de exemplo disponíveis no protótipo.
DataStore.seed();
