import { t } from '../I18nManager.js';
import { DentesService } from './DentesService.js';

/**
 * Serviço responsável pela leitura, validação e extração de dados
 * das planilhas de índices epidemiológicos.
 */
export class PlanilhaService {
	static CLASSIFICACAO_FDI = 'fdi';
	static CLASSIFICACAO_ADA = 'ada';
	static COMPONENTE_TODOS = 'TODOS';
	static CHAVES_INVALIDAS = Object.freeze(new Set(['null', 'undefined', 'Componente']));

	/**
	 * Enumeração para os tipos de formulários suportados.
	 * @readonly
	 * @enum {number}
	 */
	static TIPO_FORMULARIO = Object.freeze({
		CEOD_POR_COMPONENTE: 1,
		CEOD_TOTAL: 2,
		CPOD_POR_COMPONENTE: 3,
		CPOD_TOTAL: 4,
	});

	/**
	 * Códigos de erro padronizados para comunicação entre o serviço e a camada de UI.
	 */
	static CODIGO_ERRO_PLANILHA = Object.freeze({
		PARTICIPANTES_INVALIDOS: 'PARTICIPANTES_INVALIDOS',
		DADOS_FALTANTES: 'DADOS_FALTANTES',
		VALIDACAO_MATEMATICA: 'VALIDACAO_MATEMATICA',
		LEITURA_ARQUIVO: 'LEITURA_ARQUIVO',
	});

	/**
	 * Mapeamento de coordenadas (base zero) para extração de dados na planilha.
	 * O comentário lateral indica a linha e coluna equivalente visível no Microsoft Excel.
	 */
	static COORDENADAS_PLANILHA = Object.freeze({
		LINHA_PARTICIPANTES: 32, // Linha 33 no Excel
		COLUNA_PARTICIPANTES: 1, // Coluna B no Excel

		COL_INICIO_DENTES: 1, // Todos os blocos começam na Coluna B
		COL_FIM_CPOD: 32, // 32 Dentes Permanentes (Vai até Coluna AG)
		COL_FIM_CEOD: 20, // 20 Dentes Decíduos (Vai até Coluna U)

		FDI: {
			CPOD: {
				linhaChaves: 3, // Linha 4 no Excel
				linhas: {
					[DentesService.COMPONENTES.CARIADO]: 4,
					[DentesService.COMPONENTES.PERDIDO]: 5,
					[DentesService.COMPONENTES.OBTURADO]: 6,
					[DentesService.COMPONENTES.TOTAL]: 7,
				},
			},
			CEOD: {
				linhaChaves: 10, // Linha 11 no Excel
				linhas: {
					[DentesService.COMPONENTES.CARIADO]: 11,
					[DentesService.COMPONENTES.PERDIDO]: 12,
					[DentesService.COMPONENTES.OBTURADO]: 13,
					[DentesService.COMPONENTES.TOTAL]: 14,
				},
			},
		},

		ADA: {
			CPOD: {
				linhaChaves: 19, // Linha 20 no Excel
				linhas: {
					[DentesService.COMPONENTES.CARIADO]: 20,
					[DentesService.COMPONENTES.PERDIDO]: 21,
					[DentesService.COMPONENTES.OBTURADO]: 22,
					[DentesService.COMPONENTES.TOTAL]: 23,
				},
			},
			CEOD: {
				linhaChaves: 26, // Linha 27 no Excel
				linhas: {
					[DentesService.COMPONENTES.CARIADO]: 27,
					[DentesService.COMPONENTES.PERDIDO]: 28,
					[DentesService.COMPONENTES.OBTURADO]: 29,
					[DentesService.COMPONENTES.TOTAL]: 30,
				},
			},
		},
	});

	/**
	 * Cria um erro estruturado com código identificável para a camada de interface.
	 * @param {string} mensagem
	 * @param {string} código
	 * @returns {Error}
	 */
	static criarErroPlanilha(mensagem, codigo) {
		const erro = new Error(mensagem);
		erro.code = codigo;
		return erro;
	}

	/**
	 * Lê um arquivo Excel e converte em uma estrutura de dados processável.
	 * @param {File} arquivoPlanilha - Objeto físico do arquivo (File).
	 * @param {number} tipoFormulario - O tipo do formulário ativo mapeado no Enum.
	 * @param {string} [classificacao='fdi'] - O sistema de numeração (FDI ou ADA).
	 * @param {string} [componenteAlvo='TODOS'] - O componente de distribuição alvo.
	 * @returns {Promise<Object>} Promessa resolvida com os participantes e os dados mapeados.
	 */
	static async processarPlanilha(
		arquivoPlanilha,
		tipoFormulario,
		classificacao = this.CLASSIFICACAO_FDI,
		componenteAlvo = this.COMPONENTE_TODOS,
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

					const resultadoDaExtracao = this.extrairDados(
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

			leitor.onerror = () =>
				reject(
					this.criarErroPlanilha(
						'Erro físico ao tentar ler o arquivo selecionado.',
						this.CODIGO_ERRO_PLANILHA.LEITURA_ARQUIVO,
					),
				);
			leitor.readAsArrayBuffer(arquivoPlanilha);
		});
	}

	/**
	 * Extrai os dados da matriz utilizando o padrão Bounding Box.
	 * Se houver um espaço vazio na área alvo, lança uma mensagem de erro formatada.
	 * @param {Array<Array>} matriz - Array bidimensional contendo as linhas e colunas do Excel.
	 * @param {number} tipoFormulario - Código do tipo de formulário.
	 * @param {string} classificacao - O sistema (FDI ou ADA).
	 * @param {string} componenteAlvo - O componente alvo ou 'TODOS'.
	 * @returns {Object} Um objeto com o total de participantes e o mapa de dados estruturado.
	 */
	static extrairDados(matriz, tipoFormulario, classificacao, componenteAlvo) {
		const ehIndiceCEOD =
			tipoFormulario === this.TIPO_FORMULARIO.CEOD_TOTAL ||
			tipoFormulario === this.TIPO_FORMULARIO.CEOD_POR_COMPONENTE;

		const ehModeloTotal =
			tipoFormulario === this.TIPO_FORMULARIO.CEOD_TOTAL ||
			tipoFormulario === this.TIPO_FORMULARIO.CPOD_TOTAL;

		const configuracaoDeSistema =
			classificacao === this.CLASSIFICACAO_ADA
				? this.COORDENADAS_PLANILHA.ADA
				: this.COORDENADAS_PLANILHA.FDI;
		const configuracaoDeCoordenadas = ehIndiceCEOD
			? configuracaoDeSistema.CEOD
			: configuracaoDeSistema.CPOD;

		const totalDeParticipantes = this.obterTotalParticipantes(matriz);

		if (totalDeParticipantes <= 0) {
			const erro = this.criarErroPlanilha(
				t.modal?.erroParticipantesFalta ??
					'O total de participantes na célula B33 deve ser informado e maior que zero.',
				this.CODIGO_ERRO_PLANILHA.PARTICIPANTES_INVALIDOS,
			);

			throw erro;
		}

		const colunaInicial = this.COORDENADAS_PLANILHA.COL_INICIO_DENTES;
		const colunaFinal = ehIndiceCEOD
			? this.COORDENADAS_PLANILHA.COL_FIM_CEOD
			: this.COORDENADAS_PLANILHA.COL_FIM_CPOD;

		const { linhaInicialDaArea, linhaFinalDaArea } = this.obterLinhaDaArea(
			configuracaoDeCoordenadas,
			ehModeloTotal,
			componenteAlvo,
		);

		const mapaDeDadosDeDentes = new Map();
		const listaDeErros = [];
		const estadoValidacao = {
			encontrouDadoVazio: false,
			listaErrosDeValoresInvalidos: [],
		};

		for (
			let indiceColunaAtual = colunaInicial;
			indiceColunaAtual <= colunaFinal;
			indiceColunaAtual++
		) {
			const chaveDoDente = String(
				matriz[configuracaoDeCoordenadas.linhaChaves]?.[indiceColunaAtual] || '',
			).trim();

			if (!chaveDoDente || this.CHAVES_INVALIDAS.has(chaveDoDente)) {
				continue;
			}

			if (ehModeloTotal) {
				const { valor: valorAmostradoTotal, foiVazio } = this.verificarEExtrairValorDaCelula(
					matriz,
					configuracaoDeCoordenadas.linhas[DentesService.COMPONENTES.TOTAL],
					indiceColunaAtual,
					estadoValidacao,
					chaveDoDente,
				);

				if (!foiVazio && valorAmostradoTotal > totalDeParticipantes) {
					const mensagemDeErroTraduzida =
						t.modal?.erroParticipantesTotal
							?.replace('[DENTE]', chaveDoDente)
							?.replace('[VALOR]', valorAmostradoTotal)
							?.replace('[TOTAL]', totalDeParticipantes) ??
						`Dente ${chaveDoDente}: O valor total (${valorAmostradoTotal}) é maior que o número de participantes (${totalDeParticipantes}).`;

					listaDeErros.push(mensagemDeErroTraduzida);
				}
				mapaDeDadosDeDentes.set(chaveDoDente, valorAmostradoTotal);
			} else if (componenteAlvo === this.COMPONENTE_TODOS) {
				const {
					valor: valorCariado,
					foiVazio: ehCariadoVazio,
					valorInvalido: ehCariadoInvalido,
				} = this.verificarEExtrairValorDaCelula(
					matriz,
					configuracaoDeCoordenadas.linhas[DentesService.COMPONENTES.CARIADO],
					indiceColunaAtual,
					estadoValidacao,
					chaveDoDente,
				);
				const {
					valor: valorPerdido,
					foiVazio: ehPerdidoVazio,
					valorInvalido: ehPerdidoInvalido,
				} = this.verificarEExtrairValorDaCelula(
					matriz,
					configuracaoDeCoordenadas.linhas[DentesService.COMPONENTES.PERDIDO],
					indiceColunaAtual,
					estadoValidacao,
					chaveDoDente,
				);
				const {
					valor: valorObturado,
					foiVazio: ehObturadoVazio,
					valorInvalido: ehObturadoInvalido,
				} = this.verificarEExtrairValorDaCelula(
					matriz,
					configuracaoDeCoordenadas.linhas[DentesService.COMPONENTES.OBTURADO],
					indiceColunaAtual,
					estadoValidacao,
					chaveDoDente,
				);

				const somaDosComponentes = valorCariado + valorPerdido + valorObturado;
				const possuiCelulaVazia = ehCariadoVazio || ehPerdidoVazio || ehObturadoVazio;
				const possuiValorInvalido = ehCariadoInvalido || ehPerdidoInvalido || ehObturadoInvalido;

				if (
					!possuiCelulaVazia &&
					!possuiValorInvalido &&
					somaDosComponentes > totalDeParticipantes
				) {
					const mensagemDeErroTraduzida =
						t.modal?.erroParticipantesSoma
							?.replace('[DENTE]', chaveDoDente)
							?.replace('[SOMA]', somaDosComponentes)
							?.replace('[TOTAL]', totalDeParticipantes) ??
						`Dente ${chaveDoDente}: A soma (C+P+O = ${somaDosComponentes}) ultrapassa o limite de participantes (${totalDeParticipantes}).`;

					listaDeErros.push(mensagemDeErroTraduzida);
				}
				mapaDeDadosDeDentes.set(chaveDoDente, {
					cariado: valorCariado,
					perdido: valorPerdido,
					obturado: valorObturado,
				});
			} else {
				const { valor: valorComponenteUnico, foiVazio } = this.verificarEExtrairValorDaCelula(
					matriz,
					configuracaoDeCoordenadas.linhas[componenteAlvo],
					indiceColunaAtual,
					estadoValidacao,
					chaveDoDente,
				);

				if (!foiVazio && valorComponenteUnico > totalDeParticipantes) {
					const mensagemDeErroTraduzida =
						t.modal?.erroParticipantesComponente
							?.replace('[DENTE]', chaveDoDente)
							?.replace('[VALOR]', valorComponenteUnico)
							?.replace('[TOTAL]', totalDeParticipantes) ??
						`Dente ${chaveDoDente}: O componente (${valorComponenteUnico}) é maior que o número de participantes (${totalDeParticipantes}).`;

					listaDeErros.push(mensagemDeErroTraduzida);
				}
				mapaDeDadosDeDentes.set(chaveDoDente, valorComponenteUnico);
			}
		}

		if (estadoValidacao.encontrouDadoVazio) {
			listaDeErros.unshift(
				this.montarMensagemDeErro({
					ehIndiceCEOD,
					ehModeloTotal,
					componenteAlvo,
					classificacao,
					colunaInicial,
					colunaFinal,
					linhaInicialDaArea,
					linhaFinalDaArea,
				}),
			);
		}

		if (estadoValidacao.listaErrosDeValoresInvalidos.length > 0) {
			listaDeErros.push(...estadoValidacao.listaErrosDeValoresInvalidos);
		}

		if (listaDeErros.length > 0) {
			const codigoErro =
				estadoValidacao.encontrouDadoVazio && listaDeErros.length > 0
					? this.CODIGO_ERRO_PLANILHA.DADOS_FALTANTES
					: this.CODIGO_ERRO_PLANILHA.VALIDACAO_MATEMATICA;

			const erro = this.criarErroPlanilha(
				'Foram encontradas inconsistências na planilha.',
				codigoErro,
			);
			erro.detalhes = listaDeErros;
			throw erro;
		}

		return { totalParticipantes: totalDeParticipantes, dados: mapaDeDadosDeDentes };
	}

	/**
	 * Obtém o total de participantes da planilha.
	 * @param {Array<Array>} matriz
	 * @returns {number}
	 */
	static obterTotalParticipantes(matriz) {
		const valorBrutoParticipantes =
			matriz[this.COORDENADAS_PLANILHA.LINHA_PARTICIPANTES]?.[
				this.COORDENADAS_PLANILHA.COLUNA_PARTICIPANTES
			];

		return parseInt(valorBrutoParticipantes, 10) || 0;
	}

	/**
	 * Determina o intervalo de linhas da área alvo com base no modelo selecionado.
	 * @param {Object} configuracaoDeCoordenadas
	 * @param {boolean} ehModeloTotal
	 * @param {string} componenteAlvo
	 * @returns {{ linhaInicialDaArea: number, linhaFinalDaArea: number }}
	 */
	static obterLinhaDaArea(configuracaoDeCoordenadas, ehModeloTotal, componenteAlvo) {
		if (ehModeloTotal) {
			const linhaInicialDaArea = configuracaoDeCoordenadas.linhas[DentesService.COMPONENTES.TOTAL];
			return { linhaInicialDaArea, linhaFinalDaArea: linhaInicialDaArea };
		}

		if (componenteAlvo === this.COMPONENTE_TODOS) {
			const linhaInicialDaArea = Math.min(
				configuracaoDeCoordenadas.linhas[DentesService.COMPONENTES.CARIADO],
				configuracaoDeCoordenadas.linhas[DentesService.COMPONENTES.PERDIDO],
				configuracaoDeCoordenadas.linhas[DentesService.COMPONENTES.OBTURADO],
			);
			const linhaFinalDaArea = Math.max(
				configuracaoDeCoordenadas.linhas[DentesService.COMPONENTES.CARIADO],
				configuracaoDeCoordenadas.linhas[DentesService.COMPONENTES.PERDIDO],
				configuracaoDeCoordenadas.linhas[DentesService.COMPONENTES.OBTURADO],
			);

			return { linhaInicialDaArea, linhaFinalDaArea };
		}

		const linhaInicialDaArea = configuracaoDeCoordenadas.linhas[componenteAlvo];
		return { linhaInicialDaArea, linhaFinalDaArea: linhaInicialDaArea };
	}

	/**
	 * Extrai um valor da célula, marcando o estado de validação quando o conteúdo estiver vazio ou inválido.
	 * @param {Array<Array>} matriz
	 * @param {number} indiceLinha
	 * @param {number} indiceColuna
	 * @param {{ encontrouDadoVazio: boolean }} estadoValidacao
	 * @returns {{ valor: number, foiVazio: boolean }}
	 */
	static verificarEExtrairValorDaCelula(
		matriz,
		indiceLinha,
		indiceColuna,
		estadoValidacao,
		chaveDoDente,
	) {
		const conteudoBrutoDaCelula = matriz[indiceLinha]?.[indiceColuna];

		if (
			conteudoBrutoDaCelula === undefined ||
			conteudoBrutoDaCelula === null ||
			String(conteudoBrutoDaCelula).trim() === ''
		) {
			estadoValidacao.encontrouDadoVazio = true;
			return { valor: 0, foiVazio: true, valorInvalido: false };
		}

		const valorLimpo = this.converterLimparValorNumerico(conteudoBrutoDaCelula);

		if (isNaN(valorLimpo)) {
			const celulaExcel = `${this.converterIndiceParaLetraExcel(indiceColuna)}${indiceLinha + 1}`;
			const mensagemDeValorInvalido =
				t.modal?.erroValorInvalido
					?.replace('[DENTE]', chaveDoDente)
					?.replace('[CELULA]', celulaExcel)
					?.replace('[VALOR]', String(conteudoBrutoDaCelula).trim()) ??
				`Dente ${chaveDoDente}: a célula ${celulaExcel} contém um valor inválido (${String(conteudoBrutoDaCelula).trim()}).`;

			estadoValidacao.listaErrosDeValoresInvalidos.push(mensagemDeValorInvalido);
			return { valor: 0, foiVazio: false, valorInvalido: true };
		}

		return { valor: valorLimpo, foiVazio: false, valorInvalido: false };
	}

	/**
	 * Monta a mensagem de erro para dados faltantes usando o idioma ativo da interface.
	 * @param {{ ehIndiceCEOD: boolean, ehModeloTotal: boolean, componenteAlvo: string, classificacao: string, colunaInicial: number, colunaFinal: number, linhaInicialDaArea: number, linhaFinalDaArea: number }} contexto
	 * @returns {string}
	 */
	static montarMensagemDeErro(contexto) {
		const stringNomeDoIndice = contexto.ehIndiceCEOD
			? (t.filtros?.indice?.deciduos ?? 'ceo-d')
			: (t.filtros?.indice?.permanentes ?? 'CPO-D');

		let stringDistribuicao = t.filtros?.opcoes?.total ?? 'Total';

		if (!contexto.ehModeloTotal) {
			stringDistribuicao =
				contexto.componenteAlvo === this.COMPONENTE_TODOS
					? (t.filtros?.opcoes?.totalComponente ?? 'Todos os Componentes')
					: `${t.modal?.palavraComponente ?? 'Componente'} ${contexto.componenteAlvo}`;
		}

		const stringClassificacao = String(contexto.classificacao).toUpperCase();
		const celulaInicialExcel = `${this.converterIndiceParaLetraExcel(contexto.colunaInicial)}${contexto.linhaInicialDaArea + 1}`;
		const celulaFinalExcel = `${this.converterIndiceParaLetraExcel(contexto.colunaFinal)}${contexto.linhaFinalDaArea + 1}`;

		const textoPrefixoConfiguracao =
			t.modal?.erroDadosFaltantesConfig ??
			'A planilha possui dados faltantes para a configuração selecionada:';
		const textoAcaoPreencher =
			t.modal?.erroDadosFaltantesPreencher ??
			'Preencha todos os campos da planilha entre as células';
		const textoConjuncaoE = t.modal?.conjuncaoE ?? 'e';

		return `${textoPrefixoConfiguracao}
      <div class="configuracao-destaque">
        ${stringNomeDoIndice} — ${stringDistribuicao} — ${stringClassificacao}
      </div>
      ${textoAcaoPreencher} <strong>${celulaInicialExcel}</strong> ${textoConjuncaoE} <strong>${celulaFinalExcel}</strong>.`;
	}

	/**
	 * Converte o índice numérico da matriz (base 0) para as letras alfabéticas das colunas do Excel.
	 * @param {number} indiceBase0 - O número da coluna no array (ex: 1 = 'B').
	 * @returns {string} Letra correspondente à coluna do Excel.
	 */
	static converterIndiceParaLetraExcel(indiceBase0) {
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
	static converterLimparValorNumerico(valorBruto) {
		const numeroConvertido = parseFloat(String(valorBruto).replace(',', '.'));
		return isNaN(numeroConvertido) ? NaN : Number(numeroConvertido.toFixed(2));
	}
}
