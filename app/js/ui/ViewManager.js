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
          
          <a href="/iframes/tools/teethgram/guia-teethgram.pdf" download="guia-teethgram.pdf" target="_blank" class="botao-download-manual">
            ${t.rodape?.baixarManual ?? 'Baixar Manual'}
          </a>
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
                <option value="componente">${t.filtros?.opcoes?.totalComponente ?? 'Total por 3 Componentes'}</option>
                <option value="componente-4">${t.filtros?.opcoes?.total4Componentes ?? 'Total por 4 Componentes'}</option>
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

        <div class="controles-exportacao">
          <div class="campo-grupo-exportacao">
            <label for="formato-imagem">${t.geracao?.rotuloFormato ?? 'Formato:'}</label>
            <select id="formato-imagem">
              <option value="png" selected>PNG</option>
              <option value="jpeg">JPG</option>
            </select>
          </div>

          <div class="campo-grupo-exportacao">
            <label for="resolucao-dpi">${t.geracao?.rotuloResolucao ?? 'Resolução / DPI:'}</label>
            <select id="resolucao-dpi">
              <option value="1" selected>${t.geracao?.rotuloPadrao ?? '1x (Padrão)'}</option>
              <option value="2">${t.geracao?.rotuloAltaDefinicao ?? '2x (Alta Definição)'}</option>
              <option value="3">${t.geracao?.rotuloUltraDefinicao ?? '3x (Ultra Definição)'}</option>
            </select>
          </div>
        </div>

        <button class="botao-gerar-imagem" id="botao-image" data-action="gerar">${t.geracao?.botaoSalvarImagem ?? 'Baixar Imagem do gráfico'}</button>
      </section>

      <!-- ========= RODAPÉ INSTITUCIONAL ========= -->
      <footer class="rodape-institucional">
        <div class="conteudo-rodape">
          <div class="texto-informativo">
            <h3>${t.rodape?.titulo ?? ''}</h3>
            <p>${t.rodape?.descricao ?? ''}</p>
            
            <div class="logos-parceiros">
              <img src="assets/imagens/logo-uesb.webp" alt="Logo UESB" width="100" />
              <img src="assets/imagens/logo-sorrir.png" alt="Logo Programa Sorrir" width="200" />
              <img src="assets/imagens/logo-projeto.webp" alt="Logo do Projeto" width="100" />
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

          <!-- ========= SEÇÃO DE ATENDIMENTO / CONTATO ========= -->
          <div class="secao-atendimento">
            <div class="atendimento-cabecalho">
              <h3>Atendimento</h3>
              <p>Entre em contato com a equipe do TeethGram</p>
            </div>

            <div class="atendimento-grade">
              <!-- Coluna E-mail Principal -->
              <div class="atendimento-card">
                <span class="atendimento-icone">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M112 128C85.5 128 64 149.5 64 176C64 191.1 71.1 205.3 83.2 214.4L291.2 370.4C308.3 383.2 331.7 383.2 348.8 370.4L556.8 214.4C568.9 205.3 576 191.1 576 176C576 149.5 554.5 128 528 128L112 128zM64 260L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 260L377.6 408.8C343.5 434.4 296.5 434.4 262.4 408.8L64 260z"/></svg>
                </span>
                <h4>Contato Principal</h4>
                <p>Para dúvidas gerais, suporte e informações institucionais.</p>
                <span class="atendimento-texto-email">manoelito.junior@uesb.edu.br</span>
              </div>

              <!-- Coluna E-mail Programa Sorrir -->
              <div class="atendimento-card">
                <span class="atendimento-icone">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M112 128C85.5 128 64 149.5 64 176C64 191.1 71.1 205.3 83.2 214.4L291.2 370.4C308.3 383.2 331.7 383.2 348.8 370.4L556.8 214.4C568.9 205.3 576 191.1 576 176C576 149.5 554.5 128 528 128L112 128zM64 260L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 260L377.6 408.8C343.5 434.4 296.5 434.4 262.4 408.8L64 260z"/></svg>
                </span>
                <h4>Programa Sorrir / Projeto</h4>
                <p>Canal dedicado para assuntos vinculados ao Programa Sorrir e UESB.</p>
                <span class="atendimento-texto-email">sorrir@uesb.edu.br</span>
              </div>
            </div>
          </div>
          
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
