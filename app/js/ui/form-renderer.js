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
				.map((fdi) =>
					configComponentes
						? this.renderizarCartaoComponente(fdi, configComponentes)
						: this.renderizarCartaoSimples(fdi),
				)
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
		return indice === 'cpo-d' ? MAPA_CONVERSAO.PERMANENTE : MAPA_CONVERSAO.DECIDUO;
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
		const selectDist = document.getElementById('selecao-distribuicao');
		if (!selectDist) return;

		const textos = indice === 'cpo-d' ? t.filtros.opcoes?.permanente : t.filtros.opcoes?.deciduo;
		if (!textos) return;

		const opcaoC = selectDist.querySelector('option[value="componente-c"]');
		const opcaoP = selectDist.querySelector('option[value="componente-p"]');
		const opcaoO = selectDist.querySelector('option[value="componente-o"]');

		if (opcaoC) opcaoC.textContent = textos.componenteC;
		if (opcaoP) opcaoP.textContent = textos.componenteP;
		if (opcaoO) opcaoO.textContent = textos.componenteO;
	}

	static atualizarSistemaNumeracao(sistemaAlvo) {
		const titulos = document.querySelectorAll('[data-fdi]');

		titulos.forEach((el) => {
			const fdi = el.getAttribute('data-fdi');
			el.textContent = sistemaAlvo === 'ada' ? converterFDIParaADA(fdi) : fdi; // Otimização rápida aqui também!
		});
	}

	static atualizarEstadoInputs(indice, distribuicao) {
		if (distribuicao === 'total') return;

		const configComp =
			indice === 'cpo-d' ? this.obterConfiguracaoCPOD() : this.obterConfiguracaoCEOD();

		const mapaPrefixos = {
			'componente-c': configComp.idC,
			'componente-p': configComp.idPE,
			'componente-o': configComp.idO,
		};
		const prefixoAtivo = mapaPrefixos[distribuicao] || null;

		const inputs = document.querySelectorAll('.entrada-componente');

		inputs.forEach((input) => {
			if (!prefixoAtivo) {
				input.disabled = false;
				return;
			}

			const prefixoInput = input.id.split('-')[0];

			if (prefixoInput === prefixoAtivo) {
				input.disabled = false;
			} else {
				input.disabled = true;
				input.value = '';
			}
		});
	}

	static injetarValorNoInput(dente, sufixo, valor, classificacaoSelecionada) {
		const isAda = String(classificacaoSelecionada).trim().toLowerCase() === 'ada';
		const denteFDI = isAda ? converterADAParaFDI(dente) : dente;

		const idMontado = `${sufixo}-${denteFDI}`;
		const inputElement = document.getElementById(idMontado);

		if (inputElement) {
			if (valor >= 0) {
				inputElement.value = valor;
			} else {
				inputElement.value = '';
			}
		} else {
			console.warn(`Atenção: Input não encontrado na tela: ${idMontado}`);
		}
	}
}
