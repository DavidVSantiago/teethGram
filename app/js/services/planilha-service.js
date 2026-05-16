import { t } from '../i18n.js';
import { COMPONENTES } from './odontometria-config.js';

/**
 * Enumeração para os tipos de formulários suportados.
 * Facilita o controle de fluxo sem usar strings mágicas.
 * @readonly
 * @enum {number}
 */
export const TIPO_FORMULARIO = Object.freeze({
	CEOD_POR_COMPONENTE: 1,
	CEOD_TOTAL: 2,
	CPOD_POR_COMPONENTE: 3,
	CPOD_TOTAL: 4,
});

/**
 * Mapeamento de coordenadas (base zero) para extração de dados na planilha.
 * Suporta tanto o sistema FDI (topo da planilha) quanto ADA (parte inferior).
 * @constant
 */
const COORDENADAS_PLANILHA = Object.freeze({
	LINHA_PARTICIPANTES: 32, // Linha 33 no Excel
	COLUNA_PARTICIPANTES: 1, // Coluna B no Excel

	// Limites globais das colunas
	COL_INICIO_DENTES: 1, // Todos os blocos começam na Coluna B
	COL_FIM_CPOD: 32, // 32 Dentes Permanentes (Vai até Coluna AG)
	COL_FIM_CEOD: 20, // 20 Dentes Decíduos (Vai até Coluna U)

	FDI: {
		CPOD: {
			linhaChaves: 3, // Linha 4 no Excel
			linhas: {
				[COMPONENTES.CARIADO]: 4,
				[COMPONENTES.PERDIDO]: 5,
				[COMPONENTES.OBTURADO]: 6,
				[COMPONENTES.TOTAL]: 7,
			},
		},
		CEOD: {
			linhaChaves: 10, // Linha 11 no Excel
			linhas: {
				[COMPONENTES.CARIADO]: 11,
				[COMPONENTES.PERDIDO]: 12,
				[COMPONENTES.OBTURADO]: 13,
				[COMPONENTES.TOTAL]: 14,
			},
		},
	},

	ADA: {
		CPOD: {
			linhaChaves: 19, // Linha 20 no Excel
			linhas: {
				[COMPONENTES.CARIADO]: 20,
				[COMPONENTES.PERDIDO]: 21,
				[COMPONENTES.OBTURADO]: 22,
				[COMPONENTES.TOTAL]: 23,
			},
		},
		CEOD: {
			linhaChaves: 26, // Linha 27 no Excel
			linhas: {
				[COMPONENTES.CARIADO]: 27,
				[COMPONENTES.PERDIDO]: 28,
				[COMPONENTES.OBTURADO]: 29,
				[COMPONENTES.TOTAL]: 30,
			},
		},
	},
});

/**
 * Lê um arquivo Excel e converte em uma estrutura de dados processável.
 * @param {File} file - O arquivo vindo do input type="file".
 * @param {number} tipoFormulario - ID do tipo de formulário (Enum TIPO_FORMULARIO).
 * @param {string} classificacao - O sistema de classificação selecionado ('fdi' ou 'ada').
 * @param {string} [componenteAlvo='TODOS'] - Componente específico ou 'TODOS'.
 * @returns {Promise<Object>} Promessa resolvendo com os dados e participantes.
 */
export async function processarPlanilha(
	file,
	tipoFormulario,
	classificacao = 'fdi',
	componenteAlvo = 'TODOS',
) {
	return new Promise((resolve, reject) => {
		const leitor = new FileReader();

		leitor.onload = (e) => {
			try {
				const workbook = XLSX.read(e.target.result, { type: 'array' });
				const primeiraAba = workbook.Sheets[workbook.SheetNames[0]];

				const matriz = XLSX.utils.sheet_to_json(primeiraAba, {
					header: 1,
					defval: '',
				});

				const resultado = extrairDados(matriz, tipoFormulario, classificacao, componenteAlvo);

				resolve(resultado);
			} catch (error) {
				reject(error);
			}
		};

		leitor.onerror = () => reject(new Error('Erro ao ler o arquivo físico.'));
		leitor.readAsArrayBuffer(file);
	});
}

/**
 * Extrai os dados da matriz da planilha, preenche o Map e valida inconsistências.
 * @private
 * @param {Array[]} matriz - Matriz gerada pelo XLSX contendo os dados brutos.
 * @param {number} tipoFormulario - Enum referenciando o índice (CPO-D/ceo-d).
 * @param {string} classificacao - Sistema de numeração selecionado (FDI/ADA).
 * @param {string} componenteAlvo - Define se extrai todos os componentes ou um específico.
 * @returns {Object} Objeto contendo { totalParticipantes, dados }.
 * @throws {Error} Lança um erro formatado em JSON contendo a lista de inconsistências.
 */
function extrairDados(matriz, tipoFormulario, classificacao, componenteAlvo) {
	const ehCEOD =
		tipoFormulario === TIPO_FORMULARIO.CEOD_TOTAL ||
		tipoFormulario === TIPO_FORMULARIO.CEOD_POR_COMPONENTE;
	const ehModeloTotal =
		tipoFormulario === TIPO_FORMULARIO.CEOD_TOTAL || tipoFormulario === TIPO_FORMULARIO.CPOD_TOTAL;

	const configSistema =
		classificacao === 'ada' ? COORDENADAS_PLANILHA.ADA : COORDENADAS_PLANILHA.FDI;

	const cfg = ehCEOD ? configSistema.CEOD : configSistema.CPOD;

	const valorParticipantesString =
		matriz[COORDENADAS_PLANILHA.LINHA_PARTICIPANTES]?.[COORDENADAS_PLANILHA.COLUNA_PARTICIPANTES];

	const totalParticipantes = parseInt(valorParticipantesString, 10) || 0;

	if (totalParticipantes <= 0) {
		throw new Error(t.modal?.erroParticipantesFalta ?? 'Erro no total de participantes.');
	}

	const dadosMap = new Map();
	const errosEncontrados = [];

	let possuiDados = false;

	const colInicio = COORDENADAS_PLANILHA.COL_INICIO_DENTES;
	const colFim = ehCEOD ? COORDENADAS_PLANILHA.COL_FIM_CEOD : COORDENADAS_PLANILHA.COL_FIM_CPOD;

	for (let c = colInicio; c <= colFim; c++) {
		const denteKey = String(matriz[cfg.linhaChaves]?.[c]).trim();

		if (!denteKey || denteKey === 'null' || denteKey === 'undefined' || denteKey === 'Componente') {
			continue;
		}

		if (ehModeloTotal) {
			const celulaBruta = matriz[cfg.linhas[COMPONENTES.TOTAL]]?.[c];
			if (celulaTemDado(celulaBruta)) possuiDados = true;

			const valorTotal = limparValor(celulaBruta);

			if (valorTotal > totalParticipantes) {
				const msgErro = t.modal.erroParticipantesTotal
					.replace('[DENTE]', denteKey)
					.replace('[VALOR]', valorTotal)
					.replace('[TOTAL]', totalParticipantes);
				errosEncontrados.push(msgErro);
			}

			dadosMap.set(denteKey, valorTotal);
		} else if (componenteAlvo === 'TODOS') {
			const celulaC = matriz[cfg.linhas[COMPONENTES.CARIADO]]?.[c];
			const celulaP = matriz[cfg.linhas[COMPONENTES.PERDIDO]]?.[c];
			const celulaO = matriz[cfg.linhas[COMPONENTES.OBTURADO]]?.[c];

			if (celulaTemDado(celulaC) || celulaTemDado(celulaP) || celulaTemDado(celulaO)) {
				possuiDados = true;
			}

			const cariado = limparValor(celulaC);
			const perdido = limparValor(celulaP);
			const obturado = limparValor(celulaO);
			const soma = cariado + perdido + obturado;

			if (soma > totalParticipantes) {
				const msgErro = t.modal.erroParticipantesSoma
					.replace('[DENTE]', denteKey)
					.replace('[SOMA]', soma)
					.replace('[TOTAL]', totalParticipantes);
				errosEncontrados.push(msgErro);
			}

			dadosMap.set(denteKey, { cariado, perdido, obturado });
		} else {
			const celulaUnica = matriz[cfg.linhas[componenteAlvo]]?.[c];
			if (celulaTemDado(celulaUnica)) possuiDados = true;

			const valorUnico = limparValor(celulaUnica);

			if (valorUnico > totalParticipantes) {
				const msgErro = t.modal.erroParticipantesComponente
					.replace('[DENTE]', denteKey)
					.replace('[VALOR]', valorUnico)
					.replace('[TOTAL]', totalParticipantes);
				errosEncontrados.push(msgErro);
			}

			dadosMap.set(denteKey, valorUnico);
		}
	}

	if (!possuiDados) {
		let erroIndice = false;
		let erroDistribuicao = false;
		let erroClassificacao = false;
		let encontrouAlgumDado = false;

		const todasAsRegioes = [
			{ cfg: COORDENADAS_PLANILHA.FDI.CPOD, isCEOD: false, isTotal: true, isADA: false },
			{ cfg: COORDENADAS_PLANILHA.FDI.CPOD, isCEOD: false, isTotal: false, isADA: false },
			{ cfg: COORDENADAS_PLANILHA.FDI.CEOD, isCEOD: true, isTotal: true, isADA: false },
			{ cfg: COORDENADAS_PLANILHA.FDI.CEOD, isCEOD: true, isTotal: false, isADA: false },
			{ cfg: COORDENADAS_PLANILHA.ADA.CPOD, isCEOD: false, isTotal: true, isADA: true },
			{ cfg: COORDENADAS_PLANILHA.ADA.CPOD, isCEOD: false, isTotal: false, isADA: true },
			{ cfg: COORDENADAS_PLANILHA.ADA.CEOD, isCEOD: true, isTotal: true, isADA: true },
			{ cfg: COORDENADAS_PLANILHA.ADA.CEOD, isCEOD: true, isTotal: false, isADA: true },
		];

		for (const regiao of todasAsRegioes) {
			if (verificarRegiao(matriz, regiao.cfg, regiao.isTotal, regiao.isCEOD)) {
				encontrouAlgumDado = true;

				if (regiao.isCEOD !== ehCEOD) erroIndice = true;
				if (regiao.isTotal !== ehModeloTotal) erroDistribuicao = true;
				if (regiao.isADA !== (classificacao === 'ada')) erroClassificacao = true;
			}
		}

		// Se achou dados em algum lugar, lista tudo o que está divergente com a tela
		if (encontrouAlgumDado) {
			if (erroIndice) {
				errosEncontrados.push(
					t.modal?.erroIndiceTrocado ?? 'A planilha possui dados, mas para o Índice oposto.',
				);
			}
			if (erroDistribuicao) {
				errosEncontrados.push(
					t.modal?.erroDistribuicaoTrocada ??
						'A planilha possui dados, mas na Distribuição oposta.',
				);
			}
			if (erroClassificacao) {
				errosEncontrados.push(
					t.modal?.erroClassificacaoTrocada ??
						'A planilha possui dados, mas na Classificação oposta.',
				);
			}
		} else {
			errosEncontrados.push(
				t.modal?.mensagemErro ??
					'Nenhum dado numérico foi identificado. A planilha parece estar completamente vazia.',
			);
		}
	}

	if (errosEncontrados.length > 0) {
		throw new Error(JSON.stringify(errosEncontrados));
	}

	return { totalParticipantes, dados: dadosMap };
}

/**
 * Função utilitária para verificar se a célula possui um dado numérico válido,
 * diferenciando de células completamente vazias.
 * @private
 * @param {any} v - O valor da célula extraído da planilha.
 * @returns {boolean} True se a célula contiver dados, False caso contrário.
 */
function celulaTemDado(v) {
	return v !== undefined && v !== null && String(v).trim() !== '';
}

/**
 * Função detetive: vasculha rapidamente uma região específica da matriz
 * procurando por qualquer dado legítimo.
 *
 * @param {Array[]} matriz - A matriz completa da planilha.
 * @param {Object} cfgConfig - As coordenadas da região (coluna início, fim e linhas).
 * @param {boolean} checarTotal - Flag para checar linha de total ou linhas de componentes.
 * @returns {boolean} True se encontrou dados na região, False caso contrário.
 */
function verificarRegiao(matriz, cfgConfig, checarTotal, ehCEOD) {
	const colInicio = COORDENADAS_PLANILHA.COL_INICIO_DENTES;
	const colFim = ehCEOD ? COORDENADAS_PLANILHA.COL_FIM_CEOD : COORDENADAS_PLANILHA.COL_FIM_CPOD;

	for (let c = colInicio; c <= colFim; c++) {
		if (checarTotal) {
			if (celulaTemDado(matriz[cfgConfig.linhas[COMPONENTES.TOTAL]]?.[c])) return true;
		} else {
			if (
				celulaTemDado(matriz[cfgConfig.linhas[COMPONENTES.CARIADO]]?.[c]) ||
				celulaTemDado(matriz[cfgConfig.linhas[COMPONENTES.PERDIDO]]?.[c]) ||
				celulaTemDado(matriz[cfgConfig.linhas[COMPONENTES.OBTURADO]]?.[c])
			) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Normaliza valores extraídos da planilha tratando casas decimais, vírgulas e lixo.
 * @private
 * @param {any} v - Valor bruto da célula.
 * @returns {number} O valor numérico formatado.
 */
function limparValor(v) {
	if (v === '' || v === undefined || v === null) return 0;
	let n = parseFloat(String(v).replace(',', '.'));
	return isNaN(n) ? 0 : Number(n.toFixed(2));
}
