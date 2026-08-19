import { t } from '../I18nManager.js';

/**
 * Gerenciador da View Principal.
 * Responsável por gerar o esqueleto HTML estático da aplicação e gerenciar
 * atualizações dinâmicas na interface visual (como alterar títulos de seção).
 */
export class ViewManager {
	/**
	 * Constrói e retorna a estrutura HTML principal da página,
	 * inserindo as traduções ativas do dicionário.
	 *
	 * @returns {string} Código HTML da interface completa.
	 */
	static construirPaginaPrincipal() {
		return /* html */ `
      <!-- ========= SEÇÃO HERO ========= -->
      <section class="apresentacao-container">
        <div class="apresentacao-texto">
          <h1>TeethGram</h1>
          <p>${t.cabecalho?.descricao ?? ''}</p>
        </div>

        <div class="apresentacao-imagem">
          <img src="assets/imagens/imagem-hero.png" alt="Ilustração TeethGram" width="350" height="350" loading="lazy" />
        </div>
      </section>

      <!-- ========= CARD PRINCIPAL ========= -->
      <main class="cartao-principal">
        <h2 id="titulo-secao-dinamico">${t.principal?.tituloPermanentes ?? 'CPO-D'}</h2>

        <!-- ========= SEÇÃO DE FILTROS ========= -->
        <section class="sub-cartao-configuracao">
          <h3 class="sr-only">Filtros de Configuração</h3>
          
          <div class="linha-formulario">
            <!-- Campo: Índice -->
            <div class="campo-grupo">
              <label for="selecao-indice">${t.filtros?.rotuloIndice ?? 'Índice'}</label>

              <select id="selecao-indice">
                <option value="cpo-d" selected>${t.filtros?.indice?.permanentes ?? 'CPO-D (Permanentes)'}</option>
                <option value="ceo-d">${t.filtros?.indice?.deciduos ?? 'ceo-d (Decíduos)'}</option>
              </select>
            </div>

            <!-- Campo: Distribuição -->
            <div class="campo-grupo">
              <label for="selecao-distribuicao">${t.filtros?.rotuloDistribuicao ?? 'Distribuição'}</label>

              <select id="selecao-distribuicao">
                <option value="componente-c">${t.filtros?.opcoes?.permanente?.componenteC ?? 'Componente C'}</option>
                <option value="componente-p">${t.filtros?.opcoes?.permanente?.componenteP ?? 'Componente P'}</option>
                <option value="componente-o">${t.filtros?.opcoes?.permanente?.componenteO ?? 'Componente O'}</option>
                <option value="total" selected>${t.filtros?.opcoes?.total ?? 'Total'}</option>
                <option value="componente">${t.filtros?.opcoes?.totalComponente ?? 'Total por Componente'}</option>
              </select>
            </div>

            <!-- Campo: Classificação dos Dentes -->
            <div class="campo-grupo">
              <label for="selecao-classificacao">${t.filtros?.rotuloClassificacao ?? 'Sistema de Numeração'}</label>

              <select id="selecao-classificacao">
                <option value="fdi">FDI</option>
                <option value="ada">ADA</option>
              </select>
            </div>

            <!-- Campo: Total de Participantes -->
            <div class="campo-grupo">
              <label for="total-participantes">${t.filtros?.rotuloTotalParticipantes ?? 'Total de Participantes'}</label>
              <input type="number" id="total-participantes" min="0" />
            </div>
          </div>

          <hr />

          <!-- ========= SEÇÃO DE BOTÕES DE IMPORTAÇÃO ========= -->
          <article class="botoes-container">
            <h3>${t.principal?.tituloBotoes ?? 'Importação'}</h3>

            <div class="linha-botoes">
              <button id="botao-baixar" data-action="baixar" type="button">${t.filtros?.botoes?.baixar ?? 'Baixar Modelo'}</button>
              <button id="botao-selecionar-arquivo" data-action="selecionar-arquivo" type="button">${t.filtros?.botoes?.selecionar ?? 'Selecionar Planilha'}</button>
            </div>
          </article>
        </section>

        <!-- ========= SEÇÃO DOS FORMULÁRIOS DINÂMICOS ========= -->
        <section id="container-formulario"></section>

        <!-- ========= SEÇÃO DE PROCESSAMENTO DO HISTOGRAMA ========= -->
        <section class="linha-processamento">
          <h3 class="sr-only">Processamento de Dados</h3>
          
          <fieldset class="grupo-distribuicao">
            <legend class="titulo-distribuicao">${t.processamento?.modoDistribuicao ?? 'Exibir dados por:'}</legend>

            <div class="radios-distribuicao">
              <label>
                <input type="radio" name="modo-distribuicao" value="media" checked />
                ${t.processamento?.media ?? 'Média'}
              </label>
              
              <label>
                <input type="radio" name="modo-distribuicao" value="percentual" />
                ${t.processamento?.percentual ?? 'Percentual (%)'}
              </label>
            </div>
          </fieldset>

          <button class="botao-gerar-histograma" id="botao-gerar" data-action="gerar">${t.processamento?.botaoGerar ?? 'Gerar Histograma'}</button>
        </section>
      </main>

      <!-- ========= CONTAINER DO CANVAS ========= -->
      <section id="container-histograma" class="container-histograma hidden">
        <h3 class="sr-only">Resultado em Gráfico</h3>

        <canvas id="drawing" width="800" height="800"></canvas>

        <button class="botao-gerar-imagem" id="botao-image" data-action="gerar">${t.geracao?.botaoSalvarImagem ?? 'Salvar Imagem'}</button>
      </section>

      <!-- ========= RODAPÉ INSTITUCIONAL ========= -->
      <footer class="rodape-institucional">
        <div class="conteudo-rodape">
          <div class="texto-informativo">
            <h3>${t.rodape?.titulo ?? ''}</h3>
            <p>${t.rodape?.descricao ?? ''}</p>
            
            <div class="logos-parceiros">
              <img src="assets/imagens/logo-uesb.png" alt="Logo UESB" width="100" />
              <img src="assets/imagens/logo-sorrir.png" alt="Logo Programa Sorrir" width="200" />
              <img src="assets/imagens/logo-projeto.png" alt="Logo do Projeto" width="100" />
            </div>
            
            <div>
              <h4>${t.rodape?.tituloAutores ?? ''}</h4>
              <p>${t.rodape?.descricaoAutores ?? ''}</p>
            </div>
            
            <div>
              <h4>${t.rodape?.comoCitar ?? ''}</h4>
              <p>${t.rodape?.citacao ?? ''}</p>
            </div>
          </div>
          
          <a href="/iframes/tools/teethgram/guia-teethgram.pdf" download="guia-teethgram.pdf" target="_blank" class="botao-download-manual">
            ${t.rodape?.baixarManual ?? 'Baixar Manual'}
          </a>

          <p class="direitos-autorais">${t.rodape?.direitosAutorais ?? ''}</p>
        </div>
      </footer>

      <!-- ========= MODAL DE FEEDBACK ========= -->
      <div id="janela-modal" class="modal-overlay">
        <div class="modal-conteudo">
          <div class="modal-icone">
            <span>&times;</span>
          </div>

          <h3 id="modal-titulo"></h3>
          <div id="modal-mensagem" class="modal-corpo"></div>
          
          <button id="botao-fechar-modal" data-action="fechar-modal" class="modal-botao">${t.modal?.botaoOk ?? 'Ok'}</button>
        </div>
      </div>
    `;
	}

	/**
	 * Altera o título da seção principal dinamicamente no DOM com base no índice ativo.
	 * @param {string} indice - O código do índice selecionado no menu (ex: 'cpo-d' ou 'ceo-d').
	 */
	static mudarTituloCard(indice) {
		const elementoTitulo = document.getElementById('titulo-secao-dinamico');

		if (!elementoTitulo) return;

		const ehPermanente = indice === 'cpo-d';
		elementoTitulo.textContent = ehPermanente
			? (t.principal?.tituloPermanentes ?? 'Índice CPO-D')
			: (t.principal?.tituloDeciduos ?? 'Índice ceo-d');
	}
}
