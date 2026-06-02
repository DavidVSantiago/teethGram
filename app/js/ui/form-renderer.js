import { t } from '../i18n.js';
import {
	MAPA_CONVERSAO,
	converterFDIParaADA,
	converterADAParaFDI,
} from '../services/dentes-service.js';

/**
 * Classe utilitária responsável por gerar o HTML dinâmico dos formulários.
 * Atua como uma "fábrica" de templates visuais e gerencia manipulações de DOM.
 */
export class FormRenderer {
	/**
	 * Gera o HTML de um cartão de dente simples (apenas valor total).
	 * @param {string} numero - O identificador do dente (FDI ou ADA).
	 * @returns {string} String contendo o HTML do cartão.
	 */
	static renderizarCartaoSimples(numero) {
		return /* html */ `
      <article class="cartao-dente-simples">
        <header class="container-numero">
          <label for="total-${numero}" class="numero-dente" data-fdi="${numero}">${numero}</label>
        </header>

        <input class="entrada-total" type="number" id="total-${numero}" name="total-${numero}" min="0" />
      </article>
    `;
	}

	/**
	 * Gera o HTML de um cartão de dente por componentes (ex: C, P, O).
	 * @param {string} numero - O identificador do dente (FDI ou ADA).
	 * @param {Object} config - Configurações de IDs e rótulos.
	 * @returns {string} String contendo o HTML do cartão.
	 */
	static renderizarCartaoComponente(numero, config) {
		const { idC, idPE, idO, rotulos } = config;

		return /* html */ `
      <article class="componente-dente">
        <header class="dente-titulo"><h3 data-fdi="${numero}">${numero}</h3></header>

        <div class="dente-corpo">
          <div class="caixa-entrada">
            <input class="entrada-componente" type="number" id="${idC}-${numero}" name="${idC}-${numero}" min="0" />
          </div>
          <div class="caixa-entrada">
            <input class="entrada-componente" type="number" id="${idPE}-${numero}" name="${idPE}-${numero}" min="0" />
          </div>
          <div class="caixa-entrada">
            <input class="entrada-componente" type="number" id="${idO}-${numero}" name="${idO}-${numero}" min="0" />
          </div>
        </div>

        <footer class="dente-legenda">
          <label for="${idC}-${numero}">${rotulos.C}</label>
          <label for="${idPE}-${numero}">${rotulos.P}</label>
          <label for="${idO}-${numero}">${rotulos.O}</label>
        </footer>
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

		return /* html */ `
      <div class="container-formulario-dinamico">
        <section class="grupo-dentes">
          <header class="cabecalho-arco"><h4>${t.formularios?.superiores ?? 'Superiores'}</h4></header>
          
          <div class="grade-arcos">
            <div class="hemiarco direito">
              <span class="etiqueta-lado">${t.formularios?.direito ?? 'Direito'}</span>
              <div class="coluna-dentes">${renderizarQuadrante(quadrantes.superiorDireito)}</div>
            </div>

            <div class="hemiarco esquerdo">
              <span class="etiqueta-lado">${t.formularios?.esquerdo ?? 'Esquerdo'}</span>
              <div class="coluna-dentes">${renderizarQuadrante(quadrantes.superiorEsquerdo)}</div>
            </div>
          </div>
        </section>

        <section class="grupo-dentes">
          <header class="cabecalho-arco"><h4>${t.formularios?.inferiores ?? 'Inferiores'}</h4></header>
          
          <div class="grade-arcos">
            <div class="hemiarco esquerdo">
              <span class="etiqueta-lado">${t.formularios?.esquerdo ?? 'Esquerdo'}</span>
              <div class="coluna-dentes">${renderizarQuadrante(quadrantes.inferiorEsquerdo)}</div>
            </div>

            <div class="hemiarco direito">
              <span class="etiqueta-lado">${t.formularios?.direito ?? 'Direito'}</span>
              <div class="coluna-dentes">${renderizarQuadrante(quadrantes.inferiorDireito)}</div>
            </div>
          </div>
        </section>
      </div>`;
	}

	/**
	 * Retorna os quadrantes de acordo com o índice epidemiológico.
	 * @param {string} indice - O índice ('cpo-d' ou outro).
	 * @returns {Object} Mapa de conversão (Permanente ou Decíduo).
	 */
	static obterQuadrantes(indice) {
		if (indice === 'cpo-d') {
			return MAPA_CONVERSAO.PERMANENTE;
		}
		return MAPA_CONVERSAO.DECIDUO;
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
		const listaDeTitulos = document.querySelectorAll('[data-fdi]');

		listaDeTitulos.forEach((elementoTitulo) => {
			const numeroFDI = elementoTitulo.getAttribute('data-fdi');

			if (sistemaAlvo === 'ada') {
				elementoTitulo.textContent = converterFDIParaADA(numeroFDI);
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
		const listaDeInputs = document.querySelectorAll('.entrada-componente');

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
		const numeroDenteFDI = ehSistemaADA ? converterADAParaFDI(dente) : dente;

		const idDoInputMontado = `${sufixo}-${numeroDenteFDI}`;
		const elementoInput = document.getElementById(idDoInputMontado);

		if (elementoInput) {
			if (valor >= 0) {
				elementoInput.value = valor;
			} else {
				elementoInput.value = '';
			}
		} else {
			console.warn(`Atenção: Input não encontrado na tela: ${idDoInputMontado}`);
		}
	}
}
