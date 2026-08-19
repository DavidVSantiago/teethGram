/**
 * Serviço responsável pelo gerenciamento de conversões entre sistemas
 * de numeração dentária e componentes dos índices odontológicos.
 */
export class DentesService {
	/**
	 * Sistemas dentários organizados por quadrantes para facilitar a renderização
	 * e conversão na interface.
	 *
	 * Estrutura:
	 * Chave (Key): Sistema ADA (Universal)
	 * Valor (Value): Sistema FDI (ISO)
	 * Nota: Congelado (freeze) para garantir imutabilidade durante a execução.
	 */
	static MAPA_CONVERSAO = Object.freeze({
		PERMANENTE: {
			superiorDireito: { 1: '18', 2: '17', 3: '16', 4: '15', 5: '14', 6: '13', 7: '12', 8: '11' },
			superiorEsquerdo: { 9: '21', 10: '22', 11: '23', 12: '24', 13: '25', 14: '26', 15: '27', 16: '28' },
			inferiorEsquerdo: { 17: '38', 18: '37', 19: '36', 20: '35', 21: '34', 22: '33', 23: '32', 24: '31' },
			inferiorDireito: { 25: '41', 26: '42', 27: '43', 28: '44', 29: '45', 30: '46', 31: '47', 32: '48' },
		},

		DECIDUO: {
			superiorDireito: { A: '55', B: '54', C: '53', D: '52', E: '51' },
			superiorEsquerdo: { F: '61', G: '62', H: '63', I: '64', J: '65' },
			inferiorEsquerdo: { K: '75', L: '74', M: '73', N: '72', O: '71' },
			inferiorDireito: { P: '81', Q: '82', R: '83', S: '84', T: '85' },
		},
	});

	/**
	 * Constantes padronizadas para os componentes dos índices odontológicos.
	 * Evita o uso de "strings mágicas" (hardcoded) espalhadas pelo código.
	 */
	static COMPONENTES = Object.freeze({
		CARIADO: 'CARIADO',
		PERDIDO: 'PERDIDO',
		OBTURADO: 'OBTURADO',
		TOTAL: 'TOTAL',
	});

	/**
	 * MAPA_CONVERSAO é a fonte da verdade para a conversão entre sistemas dentários.
	 * A propriedade abaixo é inicializada gerando os dicionários de atalhos de consulta,
	 * com o objetivo de acelerar a busca durante a conversão.
	 * @private
	 */
	static _dicionarios = this._criarDicionariosDeConversao();

	/**
	 * Método interno que constrói os dicionários de conversão baseado no MAPA_CONVERSAO.
	 * @returns {{ dicionarioAdaParaFdi: Object.<string, string>, dicionarioFdiParaAda: Object.<string, string> }}
	 * @private
	 */
	static _criarDicionariosDeConversao() {
		const dicionarioAdaParaFdi = {};
		const dicionarioFdiParaAda = {};

		const sistemas = [this.MAPA_CONVERSAO.PERMANENTE, this.MAPA_CONVERSAO.DECIDUO];

		sistemas.forEach((sistema) => {
			Object.values(sistema).forEach((quadrante) => {
				Object.entries(quadrante).forEach(([ada, fdi]) => {
					dicionarioAdaParaFdi[ada] = fdi;
					dicionarioFdiParaAda[fdi] = ada;
				});
			});
		});

		return {
			dicionarioAdaParaFdi,
			dicionarioFdiParaAda,
		};
	}

	/**
	 * Converte a numeração de um dente do sistema FDI (padrão da ISO)
	 * para o sistema ADA (Universal).
	 *
	 * @param {string|number} fdi - O número do dente no sistema FDI (ex: '18', '55').
	 * @returns {string} O identificador correspondente no sistema ADA ou o próprio valor informado.
	 */
	static converterFDIParaADA(fdi) {
		if (fdi === null || fdi === undefined) return '';
		const codigoFdiLimpo = String(fdi).trim();
		return this._dicionarios.dicionarioFdiParaAda[codigoFdiLimpo] || String(fdi);
	}

	/**
	 * Converte a numeração de um dente do sistema ADA (Universal)
	 * para o sistema FDI (padrão da ISO).
	 *
	 * @param {string|number} ada - O número/letra do dente no sistema ADA (ex: 'A', '1').
	 * @returns {string} O identificador correspondente no sistema FDI ou o próprio valor informado.
	 */
	static converterADAParaFDI(ada) {
		if (ada === null || ada === undefined) return '';
		const codigoAdaLimpo = String(ada).trim().toUpperCase();
		return this._dicionarios.dicionarioAdaParaFdi[codigoAdaLimpo] || String(ada);
	}
}
