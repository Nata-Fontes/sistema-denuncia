/**
 * admin.js
 * -----------------------------------------------------------------------
 * Comportamento exclusivo da página admin.html.
 * Depende de storage.js (deve ser carregado antes deste arquivo).
 * -----------------------------------------------------------------------
 */

// Protege a rota: sem sessão ativa, volta para o login.
// (Proteção apenas de front-end, coerente com o caráter de protótipo.)
if (!AuthStore.sessaoAtiva()) {
  window.location.href = 'admin-login.html';
}

let _daProtocoloEmEdicao = null;

document.addEventListener('DOMContentLoaded', () => {
  configurarSaida();
  preencherFiltros();
  configurarModal();
  configurarFormularioStatus();

  ['filtro-busca', 'filtro-status', 'filtro-categoria', 'filtro-urgencia'].forEach((id) => {
    document.getElementById(id).addEventListener('input', renderizarPainel);
  });

  renderizarPainel();
});

function configurarSaida() {
  document.getElementById('botao-sair').addEventListener('click', () => {
    AuthStore.logout();
    window.location.href = 'index.html';
  });
}

/** Preenche os selects de filtro (status e categoria) e o select do modal. */
function preencherFiltros() {
  const selectStatus = document.getElementById('filtro-status');
  DA_STATUS_ORDEM.forEach((status) => {
    const opcao = document.createElement('option');
    opcao.value = status;
    opcao.textContent = DA_STATUS_LABEL[status];
    selectStatus.appendChild(opcao);
  });

  const selectCategoria = document.getElementById('filtro-categoria');
  DA_CATEGORIAS.forEach((categoria) => {
    const opcao = document.createElement('option');
    opcao.value = categoria;
    opcao.textContent = categoria;
    selectCategoria.appendChild(opcao);
  });

  const selectModalStatus = document.getElementById('modal-novo-status');
  DA_STATUS_ORDEM.forEach((status) => {
    const opcao = document.createElement('option');
    opcao.value = status;
    opcao.textContent = DA_STATUS_LABEL[status];
    selectModalStatus.appendChild(opcao);
  });
}

/** Recalcula estatísticas + reaplica filtros + redesenha a tabela. Ponto único de atualização. */
function renderizarPainel() {
  renderizarResumoStatus();
  renderizarTabela(obterDenunciasFiltradas());
}

/** Cards de contagem por status, no topo do painel. */
function renderizarResumoStatus() {
  const contagem = DataStore.contarPorStatus();
  const container = document.getElementById('resumo-status');
  container.innerHTML = '';

  DA_STATUS_ORDEM.forEach((status) => {
    const cartao = document.createElement('div');
    cartao.className = `cartao-resumo cartao-resumo--${status}`;
    cartao.innerHTML = `
      <span class="cartao-resumo__numero">${contagem[status]}</span>
      <span class="cartao-resumo__rotulo">${DA_STATUS_LABEL[status]}</span>
    `;
    container.appendChild(cartao);
  });
}

/** Aplica os filtros da barra de busca sobre a lista completa de denúncias. */
function obterDenunciasFiltradas() {
  const termoBusca = document.getElementById('filtro-busca').value.trim().toLowerCase();
  const status = document.getElementById('filtro-status').value;
  const categoria = document.getElementById('filtro-categoria').value;
  const urgencia = document.getElementById('filtro-urgencia').value;

  return DataStore.listarDenuncias().filter((denuncia) => {
    const bateBusca =
      !termoBusca ||
      denuncia.protocolo.toLowerCase().includes(termoBusca) ||
      denuncia.titulo.toLowerCase().includes(termoBusca);
    const bateStatus = !status || denuncia.status === status;
    const bateCategoria = !categoria || denuncia.categoria === categoria;
    const bateUrgencia = !urgencia || denuncia.urgencia === urgencia;
    return bateBusca && bateStatus && bateCategoria && bateUrgencia;
  });
}

/** Desenha as linhas da tabela de denúncias. */
function renderizarTabela(lista) {
  const corpo = document.getElementById('corpo-tabela-denuncias');
  const estadoVazio = document.getElementById('estado-vazio');
  corpo.innerHTML = '';

  estadoVazio.hidden = lista.length > 0;

  lista.forEach((denuncia) => {
    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td class="protocolo-mono">${escaparHtml(denuncia.protocolo)}</td>
      <td>${escaparHtml(denuncia.titulo)}</td>
      <td>${escaparHtml(denuncia.categoria)}</td>
      <td>${DA_URGENCIA_LABEL[denuncia.urgencia]}</td>
      <td><span class="selo-status selo-status--${denuncia.status}">${DA_STATUS_LABEL[denuncia.status]}</span></td>
      <td>${formatarData(denuncia.dataRegistro)}</td>
      <td><button class="link-ver" data-protocolo="${escaparHtml(denuncia.protocolo)}">Ver detalhes</button></td>
    `;
    corpo.appendChild(linha);
  });

  corpo.querySelectorAll('.link-ver').forEach((botao) => {
    botao.addEventListener('click', () => abrirModal(botao.dataset.protocolo));
  });
}

/* ----------------------------------------------------------------------
 * Modal de detalhes / atualização de status
 * -------------------------------------------------------------------- */
function configurarModal() {
  document.getElementById('modal-fechar').addEventListener('click', fecharModal);
  document.getElementById('sobreposicao-modal').addEventListener('click', (evento) => {
    if (evento.target.id === 'sobreposicao-modal') fecharModal();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') fecharModal();
  });
}

function abrirModal(protocolo) {
  const denuncia = DataStore.buscarPorProtocolo(protocolo);
  if (!denuncia) return;

  _daProtocoloEmEdicao = protocolo;

  document.getElementById('modal-titulo').textContent = denuncia.titulo;
  document.getElementById('modal-meta').innerHTML = `
    <span class="protocolo-mono">${escaparHtml(denuncia.protocolo)}</span>
    <span>· ${escaparHtml(denuncia.categoria)}</span>
    <span>· Urgência: ${DA_URGENCIA_LABEL[denuncia.urgencia]}</span>
    <span class="selo-status selo-status--${denuncia.status}">${DA_STATUS_LABEL[denuncia.status]}</span>
  `;
  document.getElementById('modal-local').textContent = denuncia.local;
  document.getElementById('modal-data-ocorrencia').textContent = formatarData(denuncia.dataOcorrencia, true);
  document.getElementById('modal-anexo').textContent = denuncia.anexoNome || 'Nenhum anexo enviado';
  document.getElementById('modal-data-registro').textContent = formatarDataHora(denuncia.dataRegistro);
  document.getElementById('modal-descricao').textContent = denuncia.descricao;

  const historico = document.getElementById('modal-historico');
  historico.innerHTML = '';
  [...denuncia.historico].reverse().forEach((evento) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <div class="linha-tempo__data">${formatarDataHora(evento.data)}</div>
      <div class="linha-tempo__status">${DA_STATUS_LABEL[evento.status]}</div>
      <p class="linha-tempo__obs">${escaparHtml(evento.observacao)}</p>
    `;
    historico.appendChild(item);
  });

  document.getElementById('modal-novo-status').value = denuncia.status;
  document.getElementById('modal-observacao').value = '';

  document.getElementById('sobreposicao-modal').hidden = false;
}

function fecharModal() {
  document.getElementById('sobreposicao-modal').hidden = true;
  _daProtocoloEmEdicao = null;
}

function configurarFormularioStatus() {
  document.getElementById('formulario-status').addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (!_daProtocoloEmEdicao) return;

    const novoStatus = document.getElementById('modal-novo-status').value;
    const observacao = document.getElementById('modal-observacao').value;

    DataStore.atualizarStatus(_daProtocoloEmEdicao, novoStatus, observacao);

    fecharModal();
    renderizarPainel();
  });
}

/* ----------------------------------------------------------------------
 * Utilitários de formatação (duplicados de forma mínima em relação a
 * denunciante.js para manter cada página com apenas os scripts que usa)
 * -------------------------------------------------------------------- */
function formatarData(valor, ehDataSimples) {
  const data = ehDataSimples ? new Date(valor + 'T00:00:00') : new Date(valor);
  return data.toLocaleDateString('pt-BR');
}

function formatarDataHora(iso) {
  const data = new Date(iso);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}
