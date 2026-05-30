import { t } from '../i18n.js';
import { COMPONENTES } from './dentes-service.js';

/**
 * Enumeração para os tipos de formulários suportados.
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
 */
const COORDENADAS_PLANILHA = Object.freeze({
	LINHA_PARTICIPANTES: 32, // Linha 33 no Excel
	COLUNA_PARTICIPANTES: 1, // Coluna B no Excel

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
					defval: '', // Mantém células vazias para a nossa validação rigorosa
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
 * Extrai os dados da matriz utilizando o padrão Bounding Box.
 * Se houver um espaço vazio na área alvo, lança a mensagem exata do professor.
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
		throw new Error(
			JSON.stringify([
				t.modal?.erroParticipantesFalta ??
					'O total de participantes na célula B33 deve ser informado e maior que zero.',
			]),
		);
	}

	const dadosMap = new Map();
	const errosEncontrados = [];
	let encontrouDadoFaltante = false;

	// 1. Calcula a área exata de busca (Bounding Box)
	const colInicio = COORDENADAS_PLANILHA.COL_INICIO_DENTES;
	const colFim = ehCEOD ? COORDENADAS_PLANILHA.COL_FIM_CEOD : COORDENADAS_PLANILHA.COL_FIM_CPOD;

	let linhaInicio, linhaFim;
	if (ehModeloTotal) {
		linhaInicio = cfg.linhas[COMPONENTES.TOTAL];
		linhaFim = linhaInicio;
	} else if (componenteAlvo === 'TODOS') {
		linhaInicio = Math.min(
			cfg.linhas[COMPONENTES.CARIADO],
			cfg.linhas[COMPONENTES.PERDIDO],
			cfg.linhas[COMPONENTES.OBTURADO],
		);
		linhaFim = Math.max(
			cfg.linhas[COMPONENTES.CARIADO],
			cfg.linhas[COMPONENTES.PERDIDO],
			cfg.linhas[COMPONENTES.OBTURADO],
		);
	} else {
		linhaInicio = cfg.linhas[componenteAlvo];
		linhaFim = linhaInicio;
	}

	// 2. Helper: Verifica se a célula está VAZIA
	const verificarEEstrair = (linha, coluna) => {
		const celulaBruta = matriz[linha]?.[coluna];
		if (celulaBruta === undefined || celulaBruta === null || String(celulaBruta).trim() === '') {
			encontrouDadoFaltante = true;
			return 0; // Fallback temporário; a função será abortada no Passo 4
		}
		return limparValor(celulaBruta);
	};

	// 3. Varredura estrita dentro das coordenadas com i18n restaurado
	for (let c = colInicio; c <= colFim; c++) {
		const denteKey = String(matriz[cfg.linhaChaves]?.[c] || '').trim();

		if (!denteKey || denteKey === 'null' || denteKey === 'undefined' || denteKey === 'Componente') {
			continue;
		}

		if (ehModeloTotal) {
			const valorTotal = verificarEEstrair(cfg.linhas[COMPONENTES.TOTAL], c);

			if (valorTotal > totalParticipantes && !encontrouDadoFaltante) {
				const msgErro =
					t.modal?.erroParticipantesTotal
						?.replace('[DENTE]', denteKey)
						?.replace('[VALOR]', valorTotal)
						?.replace('[TOTAL]', totalParticipantes) ??
					`Dente ${denteKey}: O valor total (${valorTotal}) é maior que o número de participantes (${totalParticipantes}).`;

				errosEncontrados.push(msgErro);
			}
			dadosMap.set(denteKey, valorTotal);
		} else if (componenteAlvo === 'TODOS') {
			const cariado = verificarEEstrair(cfg.linhas[COMPONENTES.CARIADO], c);
			const perdido = verificarEEstrair(cfg.linhas[COMPONENTES.PERDIDO], c);
			const obturado = verificarEEstrair(cfg.linhas[COMPONENTES.OBTURADO], c);
			const soma = cariado + perdido + obturado;

			if (soma > totalParticipantes && !encontrouDadoFaltante) {
				const msgErro =
					t.modal?.erroParticipantesSoma
						?.replace('[DENTE]', denteKey)
						?.replace('[SOMA]', soma)
						?.replace('[TOTAL]', totalParticipantes) ??
					`Dente ${denteKey}: A soma (C+P+O = ${soma}) ultrapassa o limite de participantes (${totalParticipantes}).`;

				errosEncontrados.push(msgErro);
			}
			dadosMap.set(denteKey, { cariado, perdido, obturado });
		} else {
			const valorUnico = verificarEEstrair(cfg.linhas[componenteAlvo], c);

			if (valorUnico > totalParticipantes && !encontrouDadoFaltante) {
				const msgErro =
					t.modal?.erroParticipantesComponente
						?.replace('[DENTE]', denteKey)
						?.replace('[VALOR]', valorUnico)
						?.replace('[TOTAL]', totalParticipantes) ??
					`Dente ${denteKey}: O componente (${valorUnico}) é maior que o número de participantes (${totalParticipantes}).`;

				errosEncontrados.push(msgErro);
			}
			dadosMap.set(denteKey, valorUnico);
		}
	}

	// 4. Dispara a mensagem EXATA solicitada pelo professor
	if (encontrouDadoFaltante) {
		const indiceStr = ehCEOD
			? (t.filtros?.indice?.deciduos ?? 'ceo-d')
			: (t.filtros?.indice?.permanentes ?? 'CPO-D');

		let distStr = t.filtros?.opcoes?.total ?? 'Total';

		if (!ehModeloTotal) {
			distStr =
				componenteAlvo === 'TODOS'
					? (t.filtros?.opcoes?.totalComponente ?? 'Todos os Componentes')
					: `${t.modal?.palavraComponente ?? 'Componente'} ${componenteAlvo}`;
		}

		const classStr = String(classificacao).toUpperCase();
		const inicioExcel = `${obterLetraColunaExcel(colInicio)}${linhaInicio + 1}`;
		const fimExcel = `${obterLetraColunaExcel(colFim)}${linhaFim + 1}`;

		const textoConfig =
			t.modal?.erroDadosFaltantesConfig ??
			'A planilha possui dados faltantes para a configuração selecionada:';
		const textoPreencher =
			t.modal?.erroDadosFaltantesPreencher ??
			'Preencha todos os campos da planilha entre as células';
		const textoE = t.modal?.conjuncaoE ?? 'e';

		const msgProfessor = `${textoConfig}
      <div class="configuracao-destaque">
        ${indiceStr} — ${distStr} — ${classStr}
      </div>
      ${textoPreencher} <strong>${inicioExcel}</strong> ${textoE} <strong>${fimExcel}</strong>.`;

		throw new Error(JSON.stringify([msgProfessor]));
	}

	// 5. Se não faltou nenhum dado, mas a matemática falhou
	if (errosEncontrados.length > 0) {
		throw new Error(JSON.stringify(errosEncontrados));
	}

	return { totalParticipantes, dados: dadosMap };
}

/**
 * Converte o índice da matriz (base 0) para as letras das colunas do Excel.
 */
function obterLetraColunaExcel(indiceBase0) {
	let letra = '';
	let temp = indiceBase0;
	while (temp >= 0) {
		letra = String.fromCharCode((temp % 26) + 65) + letra;
		temp = Math.floor(temp / 26) - 1;
	}
	return letra;
}

/**
 * Formata valores brutos limpando vírgulas e casas decimais.
 */
function limparValor(v) {
	let n = parseFloat(String(v).replace(',', '.'));
	return isNaN(n) ? 0 : Number(n.toFixed(2));
}
