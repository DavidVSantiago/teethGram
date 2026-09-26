import { t } from '../I18nManager.js';
import { DentesService } from '../services/DentesService.js';

/**
 * Classe utilitária responsável por gerar o HTML dinâmico dos formulários.
 * Atua como uma fábrica de templates visuais e gerencia manipulações no DOM.
 */
export class FormRenderer {
	/**
	 * Classes CSS aplicadas aos campos de entrada numéricos.
	 * @readonly
	 * @type {Readonly<{TOTAL: string, COMPONENTE: string}>}
	 */
	static CLASSES_INPUT = Object.freeze({
		TOTAL: 'entrada-total',
		COMPONENTE: 'entrada-componente',
	});

	/**
	 * Prefixos padrão utilizados nos IDs dos elementos input.
	 * @readonly
	 * @type {Readonly<{C: string, PE: string, O: string, CO: string}>}
	 */
	static PREFIXOS_INPUT = Object.freeze({
		C: 'c',
		PE: 'p',
		O: 'o',
		CO: 'co',
	});

	/**
	 * Gera o HTML de um cartão de dente simples (apenas valor total).
	 * @param {string} numero - O identificador do dente (FDI ou ADA).
	 * @returns {string} String contendo o HTML do cartão.
	 */
	static renderizarCartaoSimples(numero) {
		return this.renderizarCartaoBase({
			tipo: 'simples',
			numero,
			conteudo: /* html */ `
        <input class="${this.CLASSES_INPUT.TOTAL}" type="number" id="total-${numero}" name="total-${numero}" min="0" />
      `,
		});
	}

	/**
	 * Gera o HTML de um cartão de dente por 3 componentes tradicionais (C, P, O).
	 * @param {string} numero - O identificador do dente (FDI ou ADA).
	 * @param {{ idC: string, idPE: string, idO: string, rotulos: { C: string, P: string, O: string } }} config
	 * @returns {string} String contendo o HTML do cartão.
	 */
	static renderizarCartaoComponente3(numero, config) {
		const { idC, idPE, idO, rotulos } = config;

		return this.renderizarCartaoBase({
			tipo: 'componente',
			numero,
			conteudo: /* html */ `
        <div class="dente-corpo">
          <div class="caixa-entrada">
            <input class="${this.CLASSES_INPUT.COMPONENTE}" type="number" id="${idC}-${numero}" name="${idC}-${numero}" min="0" />
          </div>
          <div class="caixa-entrada">
            <input class="${this.CLASSES_INPUT.COMPONENTE}" type="number" id="${idPE}-${numero}" name="${idPE}-${numero}" min="0" />
          </div>
          <div class="caixa-entrada">
            <input class="${this.CLASSES_INPUT.COMPONENTE}" type="number" id="${idO}-${numero}" name="${idO}-${numero}" min="0" />
          </div>
        </div>
        <footer class="dente-legenda">
          <label for="${idC}-${numero}">${rotulos.C}</label>
          <label for="${idPE}-${numero}">${rotulos.P}</label>
          <label for="${idO}-${numero}">${rotulos.O}</label>
        </footer>
      `,
		});
	}

	/**
	 * Gera o HTML de um cartão de dente dedicado para 4 componentes em linha horizontal.
	 * @param {string} numero - O identificador do dente (FDI ou ADA).
	 * @param {{ idC: string, idPE: string, idO: string, idCO: string, rotulos: { C: string, P: string, O: string, CO: string } }} config
	 * @returns {string} String contendo o HTML do cartão.
	 */
	static renderizarCartaoComponente4(numero, config) {
		const { idC, idPE, idO, idCO, rotulos } = config;

		return this.renderizarCartaoBase({
			tipo: 'componente-4',
			numero,
			conteudo: /* html */ `
        <div class="dente-corpo">
          <div class="caixa-entrada">
            <input class="${this.CLASSES_INPUT.COMPONENTE}" type="number" id="${idC}-${numero}" name="${idC}-${numero}" min="0" />
          </div>
          <div class="caixa-entrada">
            <input class="${this.CLASSES_INPUT.COMPONENTE}" type="number" id="${idPE}-${numero}" name="${idPE}-${numero}" min="0" />
          </div>
          <div class="caixa-entrada">
            <input class="${this.CLASSES_INPUT.COMPONENTE}" type="number" id="${idO}-${numero}" name="${idO}-${numero}" min="0" />
          </div>
          <div class="caixa-entrada">
            <input class="${this.CLASSES_INPUT.COMPONENTE}" type="number" id="${idCO}-${numero}" name="${idCO}-${numero}" min="0" />
          </div>
        </div>
        <footer class="dente-legenda">
          <label for="${idC}-${numero}">${rotulos.C}</label>
          <label for="${idPE}-${numero}">${rotulos.P}</label>
          <label for="${idO}-${numero}">${rotulos.O}</label>
          <label for="${idCO}-${numero}">${rotulos.CO}</label>
        </footer>
      `,
		});
	}

	/**
	 * Renderiza a estrutura base (wrapper) do cartão de dente para reutilizar o layout visual.
	 * @param {{ tipo: string, numero: string, conteudo: string }} opcoes - Parâmetros estruturais do cartão.
	 * @returns {string} Markup HTML do cartão base.
	 */
	static renderizarCartaoBase({ tipo, numero, conteudo }) {
		const ehComponente = tipo.startsWith('componente');
		let classeCartao = 'cartao-dente-simples';
		if (tipo === 'componente') classeCartao = 'componente-dente';
		if (tipo === 'componente-4') classeCartao = 'componente-dente-4';

		const cabecalho = ehComponente
			? /* html */ `
        <header class="dente-titulo">
          <h3 data-dente="${numero}">${numero}</h3>
        </header>
      `
			: /* html */ `
        <header class="container-numero">
          <label for="total-${numero}" class="numero-dente" data-dente="${numero}">${numero}</label>
        </header>
      `;

		return /* html */ `
      <article class="${classeCartao}">
        ${cabecalho}
        ${conteudo}
      </article>
    `;
	}

	/**
	 * Gera a estrutura completa de arcos e hemiarcos e preenche com os cartões de dentes.
	 * @param {Object} quadrantes - Objeto contendo a divisão de dentes da anatomia bucal.
	 * @param {Object|null} [configComponentes=null] - Configuração dos campos caso seja por componentes.
	 * @param {number} [qtdeComponentes=3] - Quantidade de componentes exibidos (3 ou 4).
	 * @returns {string} String contendo a grade HTML completa do formulário.
	 */
	static gerarEstruturaArcos(quadrantes, configComponentes = null, qtdeComponentes = 3) {
		const superior = this.renderizarGrupoArcos({
			titulo: t.formularios?.superiores ?? 'Superiores',
			quadranteEsquerdo: quadrantes.superiorDireito,
			quadranteDireito: quadrantes.superiorEsquerdo,
			rotuloEsquerdo: t.formularios?.direito ?? 'Direito',
			rotuloDireito: t.formularios?.esquerdo ?? 'Esquerdo',
			configComponentes,
			qtdeComponentes,
		});

		const inferior = this.renderizarGrupoArcos({
			titulo: t.formularios?.inferiores ?? 'Inferiores',
			quadranteEsquerdo: quadrantes.inferiorEsquerdo,
			quadranteDireito: quadrantes.inferiorDireito,
			rotuloEsquerdo: t.formularios?.esquerdo ?? 'Esquerdo',
			rotuloDireito: t.formularios?.direito ?? 'Direito',
			configComponentes,
			qtdeComponentes,
		});

		return /* html */ `
      <div class="container-formulario-dinamico">
        ${superior}
        ${inferior}
      </div>`;
	}

	/**
	 * Renderiza um grupo de arcos (superior ou inferior) agrupando hemiarcos direito e esquerdo.
	 * @param {{ titulo: string, quadranteEsquerdo: Object, quadranteDireito: Object, rotuloEsquerdo: string, rotuloDireito: string, configComponentes: Object|null, qtdeComponentes: number }} opcoes
	 * @returns {string} Markup HTML da seção do arco.
	 */
	static renderizarGrupoArcos({
		titulo,
		quadranteEsquerdo,
		quadranteDireito,
		rotuloEsquerdo,
		rotuloDireito,
		configComponentes,
		qtdeComponentes,
	}) {
		const renderizarQuadrante = (quadranteObj) => {
			return Object.values(quadranteObj)
				.map((fdi) => {
					if (configComponentes) {
						if (qtdeComponentes === 4) {
							return this.renderizarCartaoComponente4(fdi, configComponentes);
						}
						return this.renderizarCartaoComponente3(fdi, configComponentes);
					}
					return this.renderizarCartaoSimples(fdi);
				})
				.join('');
		};

		return /* html */ `
      <section class="grupo-dentes">
        <header class="cabecalho-arco"><h4>${titulo}</h4></header>
        <div class="grade-arcos">
          <div class="hemiarco esquerdo">
            <span class="etiqueta-lado">${rotuloEsquerdo}</span>
            <div class="coluna-dentes">${renderizarQuadrante(quadranteEsquerdo)}</div>
          </div>
          <div class="hemiarco direito">
            <span class="etiqueta-lado">${rotuloDireito}</span>
            <div class="coluna-dentes">${renderizarQuadrante(quadranteDireito)}</div>
          </div>
        </div>
      </section>`;
	}

	/**
	 * Retorna os quadrantes com base no índice epidemiológico selecionado.
	 * @param {string} indice - O identificador do índice ('cpo-d' ou 'ceo-d').
	 * @returns {Object} Mapa de conversão anatômica do DentesService.
	 */
	static obterQuadrantes(indice) {
		if (indice === 'cpo-d') {
			return DentesService.MAPA_CONVERSAO.PERMANENTE;
		}
		return DentesService.MAPA_CONVERSAO.DECIDUO;
	}

	/**
	 * Retorna a configuração de IDs e rótulos para o formulário CPO-D (Dentes Permanentes).
	 * @returns {{ idC: string, idPE: string, idO: string, idCO: string, rotulos: { C: string, P: string, O: string, CO: string } }}
	 */
	static obterConfiguracaoCPOD() {
		return {
			idC: this.PREFIXOS_INPUT.C,
			idPE: this.PREFIXOS_INPUT.PE,
			idO: this.PREFIXOS_INPUT.O,
			idCO: this.PREFIXOS_INPUT.CO,
			rotulos: {
				C: t.formularios?.componentes?.cariado ?? 'C',
				P: t.formularios?.componentes?.perdido ?? 'P',
				O: t.formularios?.componentes?.obturado ?? 'O',
				CO: t.formularios?.componentes?.cariado_obturado ?? 'C/O',
			},
		};
	}

	/**
	 * Retorna a configuração de IDs e rótulos para o formulário ceo-d (Dentes Decíduos).
	 * @returns {{ idC: string, idPE: string, idO: string, idCO: string, rotulos: { C: string, P: string, O: string, CO: string } }}
	 */
	static obterConfiguracaoCEOD() {
		return {
			idC: this.PREFIXOS_INPUT.C,
			idPE: 'e',
			idO: this.PREFIXOS_INPUT.O,
			idCO: this.PREFIXOS_INPUT.CO,
			rotulos: {
				C: t.formularios?.componentes?.c_deciduo ?? 'c',
				P: t.formularios?.componentes?.e_deciduo ?? 'e',
				O: t.formularios?.componentes?.o_deciduo ?? 'o',
				CO: t.formularios?.componentes?.co_deciduo ?? 'c/o',
			},
		};
	}

	/**
	 * Atualiza as opções do elemento <select> de distribuição de acordo com o índice selecionado.
	 * @param {string} indice - O índice ('cpo-d' ou 'ceo-d').
	 */
	static atualizarOpcoesDistribuicao(indice) {
		const elementoSelectDistribuicao = document.getElementById('selecao-distribuicao');
		if (!elementoSelectDistribuicao) return;

		const textosDoIndice = indice === 'cpo-d' ? t.filtros?.opcoes?.permanente : t.filtros?.opcoes?.deciduo;

		if (!textosDoIndice) return;

		const mapeamentoOpcoes = [
			{ valor: 'componente-c', texto: textosDoIndice.componenteC },
			{ valor: 'componente-p', texto: textosDoIndice.componenteP },
			{ valor: 'componente-o', texto: textosDoIndice.componenteO },
		];

		mapeamentoOpcoes.forEach(({ valor, texto }) => {
			const opcao = elementoSelectDistribuicao.querySelector(`option[value="${valor}"]`);
			if (opcao && texto) {
				opcao.textContent = texto;
			}
		});
	}

	/**
	 * Atualiza os títulos visuais dos dentes no DOM de acordo com o sistema de numeração selecionado.
	 * @param {string} sistemaAlvo - O sistema ('fdi' ou 'ada').
	 */
	static atualizarSistemaNumeracao(sistemaAlvo) {
		const listaDeTitulos = document.querySelectorAll('[data-dente]');

		listaDeTitulos.forEach((elementoTitulo) => {
			const numeroFDI = elementoTitulo.getAttribute('data-dente');
			elementoTitulo.textContent = sistemaAlvo === 'ada' ? DentesService.converterFDIParaADA(numeroFDI) : numeroFDI;
		});
	}

	/**
	 * Habilita ou desabilita os campos de entrada de acordo com a opção de distribuição ativa.
	 * @param {string} indice - O índice selecionado ('cpo-d' ou 'ceo-d').
	 * @param {string} distribuicao - A distribuição ativa ('total', 'componente-c', etc.).
	 */
	static atualizarEstadoInputs(indice, distribuicao) {
		if (['total', 'componente', 'componente-4'].includes(distribuicao)) return;

		const configuracaoComponentes = indice === 'cpo-d' ? this.obterConfiguracaoCPOD() : this.obterConfiguracaoCEOD();

		const mapaDePrefixos = {
			'componente-c': configuracaoComponentes.idC,
			'componente-p': configuracaoComponentes.idPE,
			'componente-o': configuracaoComponentes.idO,
		};

		const prefixoAtivo = mapaDePrefixos[distribuicao] || null;
		const listaDeInputs = document.querySelectorAll(`.${this.CLASSES_INPUT.COMPONENTE}`);

		listaDeInputs.forEach((elementoInput) => {
			if (!prefixoAtivo) {
				elementoInput.disabled = false;
				return;
			}

			const prefixoDoInputAtual = elementoInput.id.split('-')[0];

			if (prefixoDoInputAtual === prefixoAtivo) {
				elementoInput.disabled = false;
			} else {
				elementoInput.disabled = true;
				elementoInput.value = '';
			}
		});
	}

	/**
	 * Injeta um valor numérico no input correspondente a um dente específico no DOM.
	 * @param {string} dente - Identificador do dente.
	 * @param {string} sufixo - Prefixo do input (ex: 'c', 'p', 'o', 'total').
	 * @param {number} valor - Valor a ser injetado.
	 * @param {string} classificacaoSelecionada - Sistema de numeração ('fdi' ou 'ada').
	 */
	static injetarValorNoInput(dente, sufixo, valor, classificacaoSelecionada) {
		const ehSistemaADA = String(classificacaoSelecionada).trim().toLowerCase() === 'ada';
		const numeroDenteFDI = ehSistemaADA ? DentesService.converterADAParaFDI(dente) : dente;

		const idDoInputMontado = `${sufixo}-${numeroDenteFDI}`;
		const elementoInput = document.getElementById(idDoInputMontado);

		if (!elementoInput) return;

		elementoInput.value = valor >= 0 ? valor : '';
	}
}
