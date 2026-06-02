/**
 * Sistemas dentários organizados por quadrantes para facilitar a renderização
 * e conversão na interface.
 *
 * Estrutura:
 * Chave (Key): Sistema ADA (Universal)
 * Valor (Value): Sistema FDI (ISO)
 * Nota: Congelado (freeze) para garantir imutabilidade durante a execução.
 */
export const MAPA_CONVERSAO = Object.freeze({
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
export const COMPONENTES = Object.freeze({
	CARIADO: 'CARIADO',
	PERDIDO: 'PERDIDO',
	OBTURADO: 'OBTURADO',
	TOTAL: 'TOTAL',
});

const dicionarioAdaParaFdi = {};
const dicionarioFdiParaAda = {};

const todosOsSistemasDentarios = [MAPA_CONVERSAO.PERMANENTE, MAPA_CONVERSAO.DECIDUO];

for (const sistemaDentario of todosOsSistemasDentarios) {
	const listaDeQuadrantes = Object.values(sistemaDentario);

	for (const dentesDoQuadrante of listaDeQuadrantes) {
		const paresDeDentes = Object.entries(dentesDoQuadrante);

		for (const [identificadorAda, identificadorFdi] of paresDeDentes) {
			dicionarioAdaParaFdi[identificadorAda] = identificadorFdi;
			dicionarioFdiParaAda[identificadorFdi] = identificadorAda;
		}
	}
}

/**
 * Converte a numeração de um dente do sistema FDI (padrão da ISO)
 * para o sistema ADA (Universal).
 *
 * @param {string} fdi - O número do dente no sistema FDI (ex: '18', '55').
 * @returns {string} O identificador correspondente no sistema ADA ou o próprio FDI.
 */
export function converterFDIParaADA(fdi) {
	const codigoFdiLimpo = String(fdi).trim();
	const codigoAdaConvertido = dicionarioFdiParaAda[codigoFdiLimpo];

	if (codigoAdaConvertido) return codigoAdaConvertido;

	return fdi;
}

/**
 * Converte a numeração de um dente do sistema ADA (Universal)
 * para o sistema FDI (padrão da ISO).
 *
 * @param {string} ada - O número/letra do dente no sistema ADA (ex: 'A', '1').
 * @returns {string} O identificador correspondente no sistema FDI ou o próprio valor.
 */
export function converterADAParaFDI(ada) {
	const codigoAdaLimpo = String(ada).trim().toUpperCase();
	const codigoFdiConvertido = dicionarioAdaParaFdi[codigoAdaLimpo];

	if (codigoFdiConvertido) return codigoFdiConvertido;

	return ada;
}
