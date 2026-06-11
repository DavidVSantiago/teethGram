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
 * O comentário lateral indica a linha e coluna equivalente visível no Microsoft Excel.
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
 * @param {File} arquivoPlanilha - Objeto físico do arquivo (File).
 * @param {number} tipoFormulario - O tipo do formulário ativo mapeado no Enum.
 * @param {string} [classificacao='fdi'] - O sistema de numeração (FDI ou ADA).
 * @param {string} [componenteAlvo='TODOS'] - O componente de distribuição alvo.
 * @returns {Promise<Object>} Promessa resolvida com os participantes e os dados mapeados.
 */
export async function processarPlanilha(
	arquivoPlanilha,
	tipoFormulario,
	classificacao = 'fdi',
	componenteAlvo = 'TODOS',
) {
	return new Promise((resolve, reject) => {
		const leitor = new FileReader();

		leitor.onload = (eventoDeCarga) => {
			try {
				const pastaDeTrabalho = XLSX.read(eventoDeCarga.target.result, { type: 'array' });
				const nomePrimeiraAba = pastaDeTrabalho.SheetNames[0];
				const planilhaAtiva = pastaDeTrabalho.Sheets[nomePrimeiraAba];

				const matrizDadosExcel = XLSX.utils.sheet_to_json(planilhaAtiva, {
					header: 1,
					defval: '',
				});

				const resultadoDaExtracao = extrairDados(
					matrizDadosExcel,
					tipoFormulario,
					classificacao,
					componenteAlvo,
				);
				resolve(resultadoDaExtracao);
			} catch (erroDeProcessamento) {
				reject(erroDeProcessamento);
			}
		};

		leitor.onerror = () => reject(new Error('Erro físico ao tentar ler o arquivo selecionado.'));
		leitor.readAsArrayBuffer(arquivoPlanilha);
	});
}

/**
 * Extrai os dados da matriz utilizando o padrão Bounding Box.
 * Se houver um espaço vazio na área alvo, lança uma mensagem de erro formatada (conforme regra acadêmica).
 * @param {Array<Array>} matriz - Array bidimensional contendo as linhas e colunas do Excel.
 * @param {number} tipoFormulario - Código do tipo de formulário.
 * @param {string} classificacao - O sistema (FDI ou ADA).
 * @param {string} componenteAlvo - O componente alvo ou 'TODOS'.
 * @returns {Object} Um objeto com o total de participantes e o mapa de dados estruturado.
 */
function extrairDados(matriz, tipoFormulario, classificacao, componenteAlvo) {
	const ehIndiceCEOD =
		tipoFormulario === TIPO_FORMULARIO.CEOD_TOTAL ||
		tipoFormulario === TIPO_FORMULARIO.CEOD_POR_COMPONENTE;

	const ehModeloTotal =
		tipoFormulario === TIPO_FORMULARIO.CEOD_TOTAL || tipoFormulario === TIPO_FORMULARIO.CPOD_TOTAL;

	const configuracaoDeSistema =
		classificacao === 'ada' ? COORDENADAS_PLANILHA.ADA : COORDENADAS_PLANILHA.FDI;
	const configuracaoDeCoordenadas = ehIndiceCEOD
		? configuracaoDeSistema.CEOD
		: configuracaoDeSistema.CPOD;

	const valorBrutoParticipantes =
		matriz[COORDENADAS_PLANILHA.LINHA_PARTICIPANTES]?.[COORDENADAS_PLANILHA.COLUNA_PARTICIPANTES];
	const totalDeParticipantes = parseInt(valorBrutoParticipantes, 10) || 0;

	if (totalDeParticipantes <= 0) {
		throw new Error(
			JSON.stringify([
				t.modal?.erroParticipantesFalta ??
					'O total de participantes na célula B33 deve ser informado e maior que zero.',
			]),
		);
	}

	const mapaDeDadosDeDentes = new Map();
	const listaDeErrosMatematicos = [];
	let flagDadoVazioEncontrado = false;

	const colunaInicial = COORDENADAS_PLANILHA.COL_INICIO_DENTES;
	const colunaFinal = ehIndiceCEOD
		? COORDENADAS_PLANILHA.COL_FIM_CEOD
		: COORDENADAS_PLANILHA.COL_FIM_CPOD;

	let linhaInicialDaArea, linhaFinalDaArea;

	if (ehModeloTotal) {
		linhaInicialDaArea = configuracaoDeCoordenadas.linhas[COMPONENTES.TOTAL];
		linhaFinalDaArea = linhaInicialDaArea;
	} else if (componenteAlvo === 'TODOS') {
		linhaInicialDaArea = Math.min(
			configuracaoDeCoordenadas.linhas[COMPONENTES.CARIADO],
			configuracaoDeCoordenadas.linhas[COMPONENTES.PERDIDO],
			configuracaoDeCoordenadas.linhas[COMPONENTES.OBTURADO],
		);
		linhaFinalDaArea = Math.max(
			configuracaoDeCoordenadas.linhas[COMPONENTES.CARIADO],
			configuracaoDeCoordenadas.linhas[COMPONENTES.PERDIDO],
			configuracaoDeCoordenadas.linhas[COMPONENTES.OBTURADO],
		);
	} else {
		linhaInicialDaArea = configuracaoDeCoordenadas.linhas[componenteAlvo];
		linhaFinalDaArea = linhaInicialDaArea;
	}

	const verificarEExtrairValorDaCelula = (indiceLinha, indiceColuna) => {
		const conteudoBrutoDaCelula = matriz[indiceLinha]?.[indiceColuna];

		if (
			conteudoBrutoDaCelula === undefined ||
			conteudoBrutoDaCelula === null ||
			String(conteudoBrutoDaCelula).trim() === ''
		) {
			flagDadoVazioEncontrado = true;
			return 0;
		}

		const valorLimpo = converterLimparValorNumerico(conteudoBrutoDaCelula);

		if (isNaN(valorLimpo)) {
			flagDadoVazioEncontrado = true;
			return 0;
		}

		return valorLimpo;
	};

	for (
		let indiceColunaAtual = colunaInicial;
		indiceColunaAtual <= colunaFinal;
		indiceColunaAtual++
	) {
		const chaveDoDente = String(
			matriz[configuracaoDeCoordenadas.linhaChaves]?.[indiceColunaAtual] || '',
		).trim();

		if (
			!chaveDoDente ||
			chaveDoDente === 'null' ||
			chaveDoDente === 'undefined' ||
			chaveDoDente === 'Componente'
		) {
			continue;
		}

		if (ehModeloTotal) {
			const valorAmostradoTotal = verificarEExtrairValorDaCelula(
				configuracaoDeCoordenadas.linhas[COMPONENTES.TOTAL],
				indiceColunaAtual,
			);

			if (valorAmostradoTotal > totalDeParticipantes && !flagDadoVazioEncontrado) {
				const mensagemDeErroTraduzida =
					t.modal?.erroParticipantesTotal
						?.replace('[DENTE]', chaveDoDente)
						?.replace('[VALOR]', valorAmostradoTotal)
						?.replace('[TOTAL]', totalDeParticipantes) ??
					`Dente ${chaveDoDente}: O valor total (${valorAmostradoTotal}) é maior que o número de participantes (${totalDeParticipantes}).`;

				listaDeErrosMatematicos.push(mensagemDeErroTraduzida);
			}
			mapaDeDadosDeDentes.set(chaveDoDente, valorAmostradoTotal);
		} else if (componenteAlvo === 'TODOS') {
			const valorCariado = verificarEExtrairValorDaCelula(
				configuracaoDeCoordenadas.linhas[COMPONENTES.CARIADO],
				indiceColunaAtual,
			);
			const valorPerdido = verificarEExtrairValorDaCelula(
				configuracaoDeCoordenadas.linhas[COMPONENTES.PERDIDO],
				indiceColunaAtual,
			);
			const valorObturado = verificarEExtrairValorDaCelula(
				configuracaoDeCoordenadas.linhas[COMPONENTES.OBTURADO],
				indiceColunaAtual,
			);

			const somaDosComponentes = valorCariado + valorPerdido + valorObturado;

			if (somaDosComponentes > totalDeParticipantes && !flagDadoVazioEncontrado) {
				const mensagemDeErroTraduzida =
					t.modal?.erroParticipantesSoma
						?.replace('[DENTE]', chaveDoDente)
						?.replace('[SOMA]', somaDosComponentes)
						?.replace('[TOTAL]', totalDeParticipantes) ??
					`Dente ${chaveDoDente}: A soma (C+P+O = ${somaDosComponentes}) ultrapassa o limite de participantes (${totalDeParticipantes}).`;

				listaDeErrosMatematicos.push(mensagemDeErroTraduzida);
			}
			mapaDeDadosDeDentes.set(chaveDoDente, {
				cariado: valorCariado,
				perdido: valorPerdido,
				obturado: valorObturado,
			});
		} else {
			const valorComponenteUnico = verificarEExtrairValorDaCelula(
				configuracaoDeCoordenadas.linhas[componenteAlvo],
				indiceColunaAtual,
			);

			if (valorComponenteUnico > totalDeParticipantes && !flagDadoVazioEncontrado) {
				const mensagemDeErroTraduzida =
					t.modal?.erroParticipantesComponente
						?.replace('[DENTE]', chaveDoDente)
						?.replace('[VALOR]', valorComponenteUnico)
						?.replace('[TOTAL]', totalDeParticipantes) ??
					`Dente ${chaveDoDente}: O componente (${valorComponenteUnico}) é maior que o número de participantes (${totalDeParticipantes}).`;

				listaDeErrosMatematicos.push(mensagemDeErroTraduzida);
			}
			mapaDeDadosDeDentes.set(chaveDoDente, valorComponenteUnico);
		}
	}

	if (flagDadoVazioEncontrado) {
		const stringNomeDoIndice = ehIndiceCEOD
			? (t.filtros?.indice?.deciduos ?? 'ceo-d')
			: (t.filtros?.indice?.permanentes ?? 'CPO-D');

		let stringDistribuicao = t.filtros?.opcoes?.total ?? 'Total';

		if (!ehModeloTotal) {
			stringDistribuicao =
				componenteAlvo === 'TODOS'
					? (t.filtros?.opcoes?.totalComponente ?? 'Todos os Componentes')
					: `${t.modal?.palavraComponente ?? 'Componente'} ${componenteAlvo}`;
		}

		const stringClassificacao = String(classificacao).toUpperCase();
		const celulaInicialExcel = `${converterIndiceParaLetraExcel(colunaInicial)}${linhaInicialDaArea + 1}`;
		const celulaFinalExcel = `${converterIndiceParaLetraExcel(colunaFinal)}${linhaFinalDaArea + 1}`;

		const textoPrefixoConfiguracao =
			t.modal?.erroDadosFaltantesConfig ??
			'A planilha possui dados faltantes para a configuração selecionada:';
		const textoAcaoPreencher =
			t.modal?.erroDadosFaltantesPreencher ??
			'Preencha todos os campos da planilha entre as células';
		const textoConjuncaoE = t.modal?.conjuncaoE ?? 'e';

		const mensagemMoldadaProfessor = `${textoPrefixoConfiguracao}
      <div class="configuracao-destaque">
        ${stringNomeDoIndice} — ${stringDistribuicao} — ${stringClassificacao}
      </div>
      ${textoAcaoPreencher} <strong>${celulaInicialExcel}</strong> ${textoConjuncaoE} <strong>${celulaFinalExcel}</strong>.`;

		throw new Error(JSON.stringify([mensagemMoldadaProfessor]));
	}

	if (listaDeErrosMatematicos.length > 0) {
		throw new Error(JSON.stringify(listaDeErrosMatematicos));
	}

	return { totalParticipantes: totalDeParticipantes, dados: mapaDeDadosDeDentes };
}

/**
 * Converte o índice numérico da matriz (base 0) para as letras alfabéticas das colunas do Excel.
 * @param {number} indiceBase0 - O número da coluna no array (ex: 1 = 'B').
 * @returns {string} Letra correspondente à coluna do Excel.
 */
function converterIndiceParaLetraExcel(indiceBase0) {
	let letraDaColuna = '';
	let indiceTemporario = indiceBase0;

	while (indiceTemporario >= 0) {
		letraDaColuna = String.fromCharCode((indiceTemporario % 26) + 65) + letraDaColuna;
		indiceTemporario = Math.floor(indiceTemporario / 26) - 1;
	}

	return letraDaColuna;
}

/**
 * Normaliza valores numéricos brutos da planilha, tratando vírgulas e eliminando casas decimais.
 * @param {any} valorBruto - O conteúdo não tipado retirado da célula.
 * @returns {number} O número final formatado.
 */
function converterLimparValorNumerico(valorBruto) {
	const numeroConvertido = parseFloat(String(valorBruto).replace(',', '.'));
	return isNaN(numeroConvertido) ? NaN : Number(numeroConvertido.toFixed(2));
}
