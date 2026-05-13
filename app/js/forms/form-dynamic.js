import { t } from '../i18n.js';

/**
 * Motor de renderização responsável por gerar as estruturas HTML dos formulários odontológicos.
 * Fornece métodos estáticos para criar as marcações dinâmicas sem a necessidade de instanciar a classe.
 */
export class FormulariosRenderer {
	/**
	 * Dicionário estático contendo o mapeamento dos sistemas de numeração dentária
	 * (FDI e ADA/Universal), segmentados por dentição permanente e decídua.
	 */
	static MAPAS = {
		// prettier-ignore
		FDI_PERMANENTE: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28', '38', '37', '36', '35', '34', '33', '32', '31', '41', '42', '43', '44', '45', '46', '47', '48'],

		// prettier-ignore
		FDI_DECIDUO: ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65', '75', '74', '73', '72', '71', '81', '82', '83', '84', '85'],

		// prettier-ignore
		ADA_PERMANENTE: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32'],

		// prettier-ignore
		ADA_DECIDUO: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
	};

	/**
	 * =======================================================================================
	 * GERADORES DE CARTÕES DE DENTES (MÉTODOS INTERNOS)
	 * =======================================================================================
	 */

	/**
	 * Gera o HTML de um cartão de dente simples para a coleta de índice total.
	 *
	 * @param {string} numero - Número identificador do dente (FDI ou ADA).
	 * @returns {string} Marcação HTML do cartão.
	 */
	static _gerarCartaoDente(numero) {
		return /* html */ `
      <article class="cartao-dente-simples">
        <header class="container-numero">
          <label for="total-${numero}" class="numero-dente">${numero}</label>
        </header>
        
        <input class="entrada-total" type="number" id="total-${numero}" name="total-${numero}" min="0" inputmode="numeric" />
      </article>
    `;
	}

	/**
	 * Gera o HTML de um cartão de dente detalhado para a coleta segmentada por componentes.
	 *
	 * @param {string} numero - Número identificador do dente (FDI ou ADA).
	 * @param {Object} config - Objeto contendo os IDs e rótulos traduzidos para os inputs.
	 * @returns {string} Marcação HTML do cartão com múltiplos inputs.
	 */
	static _gerarCartaoDenteComponente(numero, config) {
		const { rotuloC, rotuloPE, rotuloO, idC, idPE, idO } = config;

		return /* html */ `
      <article class="componente-dente">
        <header class="dente-titulo"><h3>${numero}</h3></header>
        
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
          <label for="${idC}-${numero}">${rotuloC}</label>
          <label for="${idPE}-${numero}">${rotuloPE}</label>
          <label for="${idO}-${numero}">${rotuloO}</label>
        </footer>
      </article>
    `;
	}

	/**
	 * =======================================================================================
	 * GERADORES DE ESTRUTURA E ARCOS (MÉTODOS INTERNOS)
	 * =======================================================================================
	 */

	/**
	 * Agrupa e retorna os dentes permanentes divididos anatomicamente por quadrantes.
	 *
	 * @returns {Object} Objeto contendo arrays de dentes para cada um dos 4 quadrantes.
	 */
	static _obterQuadrantesPermanentes() {
		return {
			superiorDireito: this.MAPAS.FDI_PERMANENTE.slice(0, 8),
			superiorEsquerdo: this.MAPAS.FDI_PERMANENTE.slice(8, 16),
			inferiorEsquerdo: this.MAPAS.FDI_PERMANENTE.slice(16, 24),
			inferiorDireito: this.MAPAS.FDI_PERMANENTE.slice(24, 32),
		};
	}

	/**
	 * Agrupa e retorna os dentes decíduos divididos anatomicamente por quadrantes.
	 *
	 * @returns {Object} Objeto contendo arrays de dentes para cada um dos 4 quadrantes.
	 */
	static _obterQuadrantesDeciduos() {
		return {
			superiorDireito: this.MAPAS.FDI_DECIDUO.slice(0, 5),
			superiorEsquerdo: this.MAPAS.FDI_DECIDUO.slice(5, 10),
			inferiorEsquerdo: this.MAPAS.FDI_DECIDUO.slice(10, 15),
			inferiorDireito: this.MAPAS.FDI_DECIDUO.slice(15, 20),
		};
	}

	/**
	 * Monta o grid completo da arcada dentária, distribuindo os cartões de dentes
	 * pelos quadrantes adequados (Superiores/Inferiores e Direita/Esquerda).
	 *
	 * @param {Object} quadrantes - O objeto de quadrantes gerado por `_obterQuadrantes...`.
	 * @param {Object|null} configComponentes - Opcional. Configurações para renderização por componentes.
	 * @returns {string} Marcação HTML de toda a estrutura do formulário.
	 */
	static _gerarEstruturaArcos(quadrantes, configComponentes = null) {
		const { superiorDireito, superiorEsquerdo, inferiorDireito, inferiorEsquerdo } = quadrantes;

		const renderizar = (num) =>
			configComponentes
				? this._gerarCartaoDenteComponente(num, configComponentes)
				: this._gerarCartaoDente(num);

		return /* html */ `
      <article class="container-formulario-dinamico">
        <section id="arco-superior" class="grupo-dentes">
          <header class="cabecalho-arco"><h4>${t.formularios?.superiores ?? 'Superiores'}</h4></header>
          <div class="grade-arcos">
            <div class="hemiarco direito">
              <span class="etiqueta-lado">${t.formularios?.direito ?? 'Direito'}</span>
              <div class="coluna-dentes">${superiorDireito.map(renderizar).join('')}</div>
            </div>
            <div class="hemiarco esquerdo">
              <span class="etiqueta-lado">${t.formularios?.esquerdo ?? 'Esquerdo'}</span>
              <div class="coluna-dentes">${superiorEsquerdo.map(renderizar).join('')}</div>
            </div>
          </div>
        </section>

        <section id="arco-inferior" class="grupo-dentes">
          <header class="cabecalho-arco"><h4>${t.formularios?.inferiores ?? 'Inferiores'}</h4></header>
          <div class="grade-arcos">
            <div class="hemiarco esquerdo">
              <span class="etiqueta-lado">${t.formularios?.esquerdo ?? 'Esquerdo'}</span>
              <div class="coluna-dentes">${inferiorEsquerdo.map(renderizar).join('')}</div>
            </div>
            
            <div class="hemiarco direito">
              <span class="etiqueta-lado">${t.formularios?.direito ?? 'Direito'}</span>
              <div class="coluna-dentes">${inferiorDireito.map(renderizar).join('')}</div>
            </div>
          </div>
        </section>
      </article>
    `;
	}

	/**
	 * =======================================================================================
	 * MÉTODOS PÚBLICOS DE RENDERIZAÇÃO
	 * =======================================================================================
	 */

	/**
	 * Renderiza o formulário do índice CPO-D (permanentes) no formato de coleta Total.
	 *
	 * @param {string} idioma - Sigla do idioma atual da interface.
	 * @returns {string} Estrutura HTML final.
	 */
	static renderizarCpodTotal(idioma) {
		return this._gerarEstruturaArcos(this._obterQuadrantesPermanentes());
	}

	/**
	 * Renderiza o formulário do índice ceo-d (decíduos) no formato de coleta Total.
	 *
	 * @param {string} idioma - Sigla do idioma atual da interface.
	 * @returns {string} Estrutura HTML final.
	 */
	static renderizarCeodTotal(idioma) {
		return this._gerarEstruturaArcos(this._obterQuadrantesDeciduos());
	}

	/**
	 * Renderiza o formulário do índice CPO-D (permanentes) no formato detalhado por Componentes.
	 *
	 * @param {string} idioma - Sigla do idioma atual da interface.
	 * @returns {string} Estrutura HTML final.
	 */
	static renderizarCpodPorComponente(idioma) {
		const configComponentes = {
			rotuloC: t.formularios?.componentes?.cariado ?? 'C',
			rotuloPE: t.formularios?.componentes?.perdido ?? 'P',
			rotuloO: t.formularios?.componentes?.obturado ?? 'O',
			idC: 'c',
			idPE: 'p',
			idO: 'o',
		};

		return this._gerarEstruturaArcos(this._obterQuadrantesPermanentes(), configComponentes);
	}

	/**
	 * Renderiza o formulário do índice ceo-d (decíduos) no formato detalhado por Componentes.
	 *
	 * @param {string} idioma - Sigla do idioma atual da interface.
	 * @returns {string} Estrutura HTML final.
	 */
	static renderizarCeodPorComponente(idioma) {
		const configComponentes = {
			rotuloC: t.formularios?.componentes?.c_deciduo ?? 'c',
			rotuloPE: t.formularios?.componentes?.e_deciduo ?? 'e',
			rotuloO: t.formularios?.componentes?.o_deciduo ?? 'o',
			idC: 'c',
			idPE: 'e',
			idO: 'o',
		};

		return this._gerarEstruturaArcos(this._obterQuadrantesDeciduos(), configComponentes);
	}
}
