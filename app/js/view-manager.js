/**
 * Constrói a string HTML da página principal
 * @returns {string} O HTML completo em formato de string
 */
function construirPaginaPrincipal() {
	return /* html */ `
    <!-- ========= SEÇÃO HERO ========= -->
    <section class="apresentacao-container">
      <div class="apresentacao-texto">
        <h1>TeethGram</h1>

        <p>${t.cabecalho.descricao}</p>
      </div>

      <div class="apresentacao-imagem">
        <img src="assets/imagens/imagem-hero.png" alt="Ilustração TeethGram" width="350" height="350" loading="lazy" />
      </div>
    </section>

    <!-- ========= CARD PRINCIPAL ========= -->
    <main class="cartao-principal">
      <h2 id="titulo-secao-dinamico">${t.principal.tituloPermanentes}</h2>

      <!-- ========= SESSÃO DE FILTROS ========= -->
      <section class="sub-cartao-configuracao">
        <h3 class="visualmente-oculto">Filtros de Configuração</h3>
        
        <div class="linha-formulario">
          <!-- Campo: Índice -->
          <div class="campo-grupo">
            <label for="selecao-indice">${t.filtros.rotuloIndice}</label>
            
            <select id="selecao-indice">
              <option value="cpo-d" selected>${t.filtros.indice.permanentes}</option>
              <option value="ceo-d">${t.filtros.indice.deciduos}</option>
            </select>
          </div>

          <!-- Campo: Distribuição -->
          <div class="campo-grupo">
            <label for="selecao-distribuicao">${t.filtros.rotuloDistribuicao}</label>
            
            <select id="selecao-distribuicao">
              <option value="componente-c">${t.filtros.opcoes.componenteC}</option>
              <option value="componente-p">${t.filtros.opcoes.componenteP}</option>
              <option value="componente-o">${t.filtros.opcoes.componenteO}</option>
              <option value="total" selected>${t.filtros.opcoes.total}</option>
              <option value="componente">${t.filtros.opcoes.totalComponente}</option>
            </select>
          </div>

          <!-- Campo: Classificação dos Dentes -->
          <div class="campo-grupo">
            <label for="selecao-classificacao">${t.filtros.rotuloClassificacao}</label>
            
            <select id="selecao-classificacao">
              <option value="fdi">FDI</option>
              <option value="ada">ADA</option>
            </select>
          </div>

          <!-- Campo: Total de Participantes -->
          <div class="campo-grupo">
            <label for="total-participantes">${t.filtros.rotuloTotalParticipantes}</label>
            <input type="number" id="total-participantes" min="0" />
          </div>
        </div>

        <hr />

        <!-- ========= SESSÃO DE BOTÕES ========= -->
        <article class="botoes-container">
          <h3>${t.principal.tituloBotoes}</h3>

          <div class="linha-botoes">
            <button id="botao-baixar" onclick="baixarPlanilhaModelo()" type="button">${t.filtros.botoes.baixar}</button>
            <button id="botao-selecionar-arquivo" onclick="selecionarArquivoPlanilha()" type="button">${t.filtros.botoes.selecionar}</button>
          </div>
        </article>

      </section>

      <!-- ========= SESSÃO DOS FORMULÁRIOS ========= -->
      <section id="container-formulario"></section>

      <!-- ========= SESSÃO DOS GERAÇÃO DO HISTOGRAMA ========= -->
      <section class="linha-processamento">
        <h3 class="visualmente-oculto">Processamento de Dados</h3>
        
        <fieldset class="grupo-distribuicao">
          <legend class="titulo-distribuicao">${t.processamento.modoDistribuicao}</legend>
          <div class="radios-distribuicao">
            <label>
              <input type="radio" name="modo-distribuicao" value="media" checked />
              ${t.processamento.media}
            </label>

            <label>
              <input type="radio" name="modo-distribuicao" value="percentual" />
              ${t.processamento.percentual}
            </label>
          </div>
        </fieldset>

        <button class="botao-gerar-histograma" id="botao-gerar" onclick="gerarHistograma()">${t.processamento.botaoGerar}</button>
      </section>
    </main>

    <!-- ========= FOOTER ========= -->
    <footer class="rodape-institucional">
      <div class="conteudo-rodape">
        <div class="texto-informativo">
          <h3>${t.rodape.titulo}</h3>

          <p>${t.rodape.descricao}</p>
          
          <div class="logos-parceiros">
            <img src="assets/imagens/logo-uesb.png" alt="Logo UESB" width="100" height="auto" />
            <img src="assets/imagens/logo-sorrir.png" alt="Logo Programa Sorrir" width="200" />
            <img src="assets/imagens/logo-projeto.png" alt="Logo do Projeto" width="100" height="auto" />
          </div>
          
          <div>
            <h4>${t.rodape.tituloAutores}</h4>
            <p>${t.rodape.descricaoAutores}</p>
          </div>
          
          <div>
            <h4>${t.rodape.comoCitar}</h4>
            <p>${t.rodape.citacao}</p>
          </div>
        </div>
        
        <a href="/iframes/tools/teethgram/guia-teethgram.pdf" download="guia-teethgram.pdf" target="_blank" class="botao-download-manual">
          ${t.rodape.baixarManual}
        </a>

        <p class="direitos-autorais">${t.rodape.direitosAutorais}</p>
      </div>
    </footer>

    <!-- Modal de Falha de Envio do Arquivo -->
    <div id="janela-modal" class="modal-overlay">
      <div class="modal-conteudo">
        <div class="modal-icone">
          <span>&times;</span>
        </div>

        <h3 id="modal-titulo"></h3>
        
        <div id="modal-mensagem" class="modal-corpo"></div>
        
        <button onclick="fecharModal()" class="modal-botao">${t.modal?.botaoOk ?? 'Ok'}</button>
      </div>
    </div>
  `;
}

/**
 * Inicializa os ouvintes de evento para os formulários dinâmicos.
 */
function inicializarEventosFormulario() {
	const selectIndice = document.getElementById('selecao-indice');
	const selectDistribuicao = document.getElementById('selecao-distribuicao');
	const selectClassificacao = document.getElementById('selecao-classificacao');

	if (selectIndice && selectDistribuicao) {
		selectIndice.addEventListener('change', gerarFormulario);
		selectDistribuicao.addEventListener('change', gerarFormulario);

		gerarFormulario();
	}

	if (selectClassificacao) {
		selectClassificacao.addEventListener('change', atualizarClassificacaoDente);
	}
}

/**
 * Atualiza dinamicamente o título principal da seção de acordo com o índice selecionado.
 * @param {string} indiceSelecionado - O valor do índice vindo do select ('cpo-d' ou 'ceo-d').
 * @returns {void}
 */
function mudarTituloCard(indiceSelecionado) {
	const tituloCard = document.getElementById('titulo-secao-dinamico');
	if (!tituloCard) return;

	tituloCard.textContent =
		indiceSelecionado === 'cpo-d' ? t.principal.tituloPermanentes : t.principal.tituloDeciduos;
}
