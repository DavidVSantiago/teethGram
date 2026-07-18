import { t } from '../I18nManager.js';
import { DentesService } from '../services/DentesService.js';

/**
 * Classe utilitária responsável por gerar o HTML dinâmico dos formulários.
 * Atua como uma "fábrica" de templates visuais e gerencia manipulações de DOM.
 */
export class FormRenderer {
	static CLASSES_INPUT = Object.freeze({
		TOTAL: 'entrada-total',
		COMPONENTE: 'entrada-componente',
	});

	static PREFIXOS_INPUT = Object.freeze({
		C: 'c',
		PE: 'p',
		O: 'o',
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
	 * Gera o HTML de um cartão de dente por componentes (ex: C, P, O).
	 * @param {string} numero - O identificador do dente (FDI ou ADA).
	 * @param {Object} config - Configurações de IDs e rótulos.
	 * @returns {string} String contendo o HTML do cartão.
	 */
	static renderizarCartaoComponente(numero, config) {
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
	 * Renderiza o wrapper base do cartão de dente para reutilizar a estrutura visual.
	 * @param {{ tipo: string, numero: string, conteudo: string }} opcoes
	 * @returns {string}
	 */
	static renderizarCartaoBase({ tipo, numero, conteudo }) {
		const classeCartao = tipo === 'componente' ? 'componente-dente' : 'cartao-dente-simples';
		const cabecalho =
			tipo === 'componente'
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
	 * @param {Object} quadrantes - O objeto contendo a divisão de dentes.
	 * @param {Object|null} [configComponentes=null] - A configuração caso o formulário seja por componentes.
	 * @returns {string} String com a grade HTML completa do formulário.
	 */
	static gerarEstruturaArcos(quadrantes, configComponentes = null) {
		const renderizarQuadrante = (quadranteObj) => {
			return Object.values(quadranteObj)
				.map((fdi) => {
					if (configComponentes) {
						return this.renderizarCartaoComponente(fdi, configComponentes);
					}
					return this.renderizarCartaoSimples(fdi);
				})
				.join('');
		};

		const superior = this.renderizarGrupoArcos({
			titulo: t.formularios?.superiores ?? 'Superiores',
			quadranteEsquerdo: quadrantes.superiorDireito,
			quadranteDireito: quadrantes.superiorEsquerdo,
			rotuloEsquerdo: t.formularios?.direito ?? 'Direito',
			rotuloDireito: t.formularios?.esquerdo ?? 'Esquerdo',
			configComponentes,
		});

		const inferior = this.renderizarGrupoArcos({
			titulo: t.formularios?.inferiores ?? 'Inferiores',
			quadranteEsquerdo: quadrantes.inferiorEsquerdo,
			quadranteDireito: quadrantes.inferiorDireito,
			rotuloEsquerdo: t.formularios?.esquerdo ?? 'Esquerdo',
			rotuloDireito: t.formularios?.direito ?? 'Direito',
			configComponentes,
		});

		return /* html */ `
      <div class="container-formulario-dinamico">
        ${superior}
        ${inferior}
      </div>`;
	}

	/**
	 * Renderiza um grupo de arcos com base no contexto de direção e configuração do tipo de cartão.
	 * @param {{ titulo: string, quadranteDireito: Object, quadranteEsquerdo: Object, configComponentes: Object|null }} opcoes
	 * @returns {string}
	 */
	static renderizarGrupoArcos({
		titulo,
		quadranteEsquerdo,
		quadranteDireito,
		rotuloEsquerdo,
		rotuloDireito,
		configComponentes,
	}) {
		const renderizarQuadrante = (quadranteObj) => {
			return Object.values(quadranteObj)
				.map((fdi) => {
					if (configComponentes) {
						return this.renderizarCartaoComponente(fdi, configComponentes);
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
	 * Retorna os quadrantes de acordo com o índice epidemiológico.
	 * @param {string} indice - O índice ('cpo-d' ou outro).
	 * @returns {Object} Mapa de conversão (Permanente ou Decíduo).
	 */
	static obterQuadrantes(indice) {
		if (indice === 'cpo-d') {
			return DentesService.MAPA_CONVERSAO.PERMANENTE;
		}
		return DentesService.MAPA_CONVERSAO.DECIDUO;
	}

	static obterConfiguracaoCPOD() {
		return {
			idC: 'c',
			idPE: 'p',
			idO: 'o',
			rotulos: {
				C: t.formularios?.componentes?.cariado ?? 'C',
				P: t.formularios?.componentes?.perdido ?? 'P',
				O: t.formularios?.componentes?.obturado ?? 'O',
			},
		};
	}

	static obterConfiguracaoCEOD() {
		return {
			idC: 'c',
			idPE: 'e',
			idO: 'o',
			rotulos: {
				C: t.formularios?.componentes?.c_deciduo ?? 'c',
				P: t.formularios?.componentes?.e_deciduo ?? 'e',
				O: t.formularios?.componentes?.o_deciduo ?? 'o',
			},
		};
	}

	static atualizarOpcoesDistribuicao(indice) {
		const elementoSelectDistribuicao = document.getElementById('selecao-distribuicao');

		if (!elementoSelectDistribuicao) {
			return;
		}

		const textosDoIndice =
			indice === 'cpo-d' ? t.filtros.opcoes?.permanente : t.filtros.opcoes?.deciduo;

		if (!textosDoIndice) {
			return;
		}

		const opcaoComponenteC = elementoSelectDistribuicao.querySelector(
			'option[value="componente-c"]',
		);
		const opcaoComponenteP = elementoSelectDistribuicao.querySelector(
			'option[value="componente-p"]',
		);
		const opcaoComponenteO = elementoSelectDistribuicao.querySelector(
			'option[value="componente-o"]',
		);

		if (opcaoComponenteC) {
			opcaoComponenteC.textContent = textosDoIndice.componenteC;
		}
		if (opcaoComponenteP) {
			opcaoComponenteP.textContent = textosDoIndice.componenteP;
		}
		if (opcaoComponenteO) {
			opcaoComponenteO.textContent = textosDoIndice.componenteO;
		}
	}

	static atualizarSistemaNumeracao(sistemaAlvo) {
		const listaDeTitulos = document.querySelectorAll('[data-dente]');

		listaDeTitulos.forEach((elementoTitulo) => {
			const numeroFDI = elementoTitulo.getAttribute('data-dente');

			if (sistemaAlvo === 'ada') {
				elementoTitulo.textContent = DentesService.converterFDIParaADA(numeroFDI);
			} else {
				elementoTitulo.textContent = numeroFDI;
			}
		});
	}

	static atualizarEstadoInputs(indice, distribuicao) {
		if (distribuicao === 'total') {
			return;
		}

		const configuracaoComponentes =
			indice === 'cpo-d' ? this.obterConfiguracaoCPOD() : this.obterConfiguracaoCEOD();

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

	static injetarValorNoInput(dente, sufixo, valor, classificacaoSelecionada) {
		const ehSistemaADA = String(classificacaoSelecionada).trim().toLowerCase() === 'ada';
		const numeroDenteFDI = ehSistemaADA ? DentesService.converterADAParaFDI(dente) : dente;

		const idDoInputMontado = `${sufixo}-${numeroDenteFDI}`;
		const elementoInput = document.getElementById(idDoInputMontado);

		if (!elementoInput) {
			return;
		}

		elementoInput.value = valor >= 0 ? valor : '';
	}
}
