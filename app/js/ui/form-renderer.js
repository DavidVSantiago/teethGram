import { t } from '../i18n.js';
import { MAPA_CONVERSAO } from '../services/odontometria-config.js';

/**
 * Classe utilitária responsável por gerar o HTML dinâmico dos formulários.
 * Atua como uma "fábrica" de templates visuais.
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
            <input class="entrada-componente" type="number" id="${idC}-${numero}" name="${idC}-${numero}" />
          </div>
          <div class="caixa-entrada">
            <input class="entrada-componente" type="number" id="${idPE}-${numero}" name="${idPE}-${numero}" />
          </div>
          <div class="caixa-entrada">
            <input class="entrada-componente" type="number" id="${idO}-${numero}" name="${idO}-${numero}" />
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
			const listaDentesFDI = Object.values(quadranteObj);

			const htmlGerado = listaDentesFDI.map((fdi) => {
				if (configComponentes !== null) {
					return this.renderizarCartaoComponente(fdi, configComponentes);
				} else {
					return this.renderizarCartaoSimples(fdi);
				}
			});

			return htmlGerado.join('');
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
		} else {
			return MAPA_CONVERSAO.DECIDUO;
		}
	}
}
