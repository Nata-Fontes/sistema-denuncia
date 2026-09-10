/**
 * denunciante.js
 * -----------------------------------------------------------------------
 * Comportamento exclusivo da página denunciante.html.
 * Depende de storage.js (deve ser carregado antes deste arquivo).
 * -----------------------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {
  preencherCategorias();
  configurarAbas();
  configurarFormularioDenuncia();
  configurarFormularioBusca();
});

/** Preenche o <select> de categorias a partir da lista central em storage.js. */
function preencherCategorias() {
  const select = document.getElementById('campo-categoria');
  DA_CATEGORIAS.forEach((categoria) => {
    const option = document.createElement('option');
    option.value = categoria;
    option.textContent = categoria;
    select.appendChild(option);
  });
}

/** Controla a alternância entre as abas "Nova denúncia" e "Acompanhar". */
function configurarAbas() {
  const botaoNova = document.getElementById('botao-aba-nova');
  const botaoAcompanhar = document.getElementById('botao-aba-acompanhar');
  const painelNova = document.getElementById('aba-nova');
  const painelAcompanhar = document.getElementById('aba-acompanhar');

  function irPara(aba) {
    const ehNova = aba === 'nova';
    botaoNova.classList.toggle('ativa', ehNova);
    botaoAcompanhar.classList.toggle('ativa', !ehNova);
    botaoNova.setAttribute('aria-selected', String(ehNova));
    botaoAcompanhar.setAttribute('aria-selected', String(!ehNova));
    painelNova.classList.toggle('ativa', ehNova);
    painelAcompanhar.classList.toggle('ativa', !ehNova);
  }

  botaoNova.addEventListener('click', () => irPara('nova'));
  botaoAcompanhar.addEventListener('click', () => irPara('acompanhar'));

  // Exposto para uso pelo botão "Acompanhar esta denúncia" na confirmação.
  window._daIrParaAbaAcompanhar = () => irPara('acompanhar');
}

/** Configura o envio do formulário de nova denúncia. */
function configurarFormularioDenuncia() {
  const formulario = document.getElementById('formulario-denuncia');
  const mensagemErro = document.getElementById('mensagem-erro-formulario');
  const blocoConfirmacao = document.getElementById('bloco-confirmacao');
  const textoProtocolo = document.getElementById('texto-protocolo-gerado');

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    mensagemErro.hidden = true;

    const dados = {
      categoria: formulario.categoria.value,
      titulo: formulario.titulo.value.trim(),
      descricao: formulario.descricao.value.trim(),
      local: formulario.local.value.trim(),
      dataOcorrencia: formulario.dataOcorrencia.value,
      urgencia: formulario.urgencia.value,
      anexoNome: formulario.anexo.files[0] ? formulario.anexo.files[0].name : null,
    };

    if (!dados.categoria || !dados.titulo || !dados.descricao || !dados.local || !dados.dataOcorrencia) {
      mensagemErro.textContent = 'Preencha todos os campos obrigatórios antes de enviar.';
      mensagemErro.hidden = false;
      return;
    }

    const denunciaCriada = DataStore.criarDenuncia(dados);

    formulario.hidden = true;
    blocoConfirmacao.hidden = false;
    textoProtocolo.textContent = denunciaCriada.protocolo;
    blocoConfirmacao.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('botao-nova-outra').addEventListener('click', () => {
    formulario.reset();
    formulario.hidden = false;
    blocoConfirmacao.hidden = true;
  });

  document.getElementById('botao-ir-acompanhar').addEventListener('click', () => {
    const protocolo = textoProtocolo.textContent;
    window._daIrParaAbaAcompanhar();
    const campoBusca = document.getElementById('campo-protocolo-busca');
    campoBusca.value = protocolo;
    document.getElementById('formulario-busca').dispatchEvent(new Event('submit'));
  });
}

/** Configura a busca de denúncia por protocolo. */
function configurarFormularioBusca() {
  const formulario = document.getElementById('formulario-busca');
  const mensagemErro = document.getElementById('mensagem-erro-busca');
  const resultado = document.getElementById('resultado-consulta');

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    mensagemErro.hidden = true;
    resultado.innerHTML = '';

    const protocolo = document.getElementById('campo-protocolo-busca').value;
    const denuncia = DataStore.buscarPorProtocolo(protocolo);

    if (!denuncia) {
      mensagemErro.textContent = 'Nenhuma denúncia encontrada para este número de protocolo. Verifique se digitou corretamente.';
      mensagemErro.hidden = false;
      return;
    }

    resultado.appendChild(construirCartaoAcompanhamento(denuncia));
  });
}

/** Monta o card de acompanhamento (dados gerais + linha do tempo). */
function construirCartaoAcompanhamento(denuncia) {
  const container = document.createElement('article');
  container.className = 'confirmacao';

  const cabecalho = document.createElement('div');
  cabecalho.innerHTML = `
    <h2>${escaparHtml(denuncia.titulo)}</h2>
    <p style="margin-bottom: 0.4rem;">
      <span class="selo-status selo-status--${denuncia.status}">${DA_STATUS_LABEL[denuncia.status]}</span>
    </p>
    <p style="color: var(--ink-soft); font-size: 0.9rem;">
      Protocolo <strong>${escaparHtml(denuncia.protocolo)}</strong> ·
      Categoria: ${escaparHtml(denuncia.categoria)} ·
      Urgência: ${DA_URGENCIA_LABEL[denuncia.urgencia]}
    </p>
    <p>${escaparHtml(denuncia.descricao)}</p>
  `;
  container.appendChild(cabecalho);

  const tituloHistorico = document.createElement('h3');
  tituloHistorico.textContent = 'Histórico do caso';
  tituloHistorico.style.marginTop = '1.25rem';
  container.appendChild(tituloHistorico);

  const linhaTempo = document.createElement('ul');
  linhaTempo.className = 'linha-tempo';

  [...denuncia.historico].reverse().forEach((evento) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <div class="linha-tempo__data">${formatarDataHora(evento.data)}</div>
      <div class="linha-tempo__status">${DA_STATUS_LABEL[evento.status]}</div>
      <p class="linha-tempo__obs">${escaparHtml(evento.observacao)}</p>
    `;
    linhaTempo.appendChild(item);
  });

  container.appendChild(linhaTempo);
  return container;
}

/** Formata uma string ISO de data para o padrão dd/mm/aaaa às hh:mm. */
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

/** Escapa texto simples antes de inserir via innerHTML, evitando HTML injection. */
function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}
