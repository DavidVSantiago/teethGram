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
					[DentesService.COMPONENTES.OBTURADO]: 5,
					[DentesService.COMPONENTES.PERDIDO]: 6,
					[DentesService.COMPONENTES.TOTAL]: 7,
				},
			},
			CEOD: {
				linhaChaves: 10, // Linha 11 no Excel
				linhas: {
					[DentesService.COMPONENTES.CARIADO]: 11,
					[DentesService.COMPONENTES.OBTURADO]: 12,
					[DentesService.COMPONENTES.PERDIDO]: 13,
					[DentesService.COMPONENTES.TOTAL]: 14,
				},
			},
		},

		ADA: {
			CPOD: {
				linhaChaves: 19, // Linha 20 no Excel
				linhas: {
					[DentesService.COMPONENTES.CARIADO]: 20,
					[DentesService.COMPONENTES.OBTURADO]: 21,
					[DentesService.COMPONENTES.PERDIDO]: 22,
					[DentesService.COMPONENTES.TOTAL]: 23,
				},
			},
			CEOD: {
				linhaChaves: 26, // Linha 27 no Excel
				linhas: {
					[DentesService.COMPONENTES.CARIADO]: 27,
					[DentesService.COMPONENTES.OBTURADO]: 28,
					[DentesService.COMPONENTES.PERDIDO]: 29,
					[DentesService.COMPONENTES.TOTAL]: 30,
				},
			},
		},
	});

	/**
	 * Cria um erro estruturado com código identificável para a camada de interface.
	 * @param {string} mensagem - Descrição do erro.
	 * @param {string} codigo - Identificador padronizado de erro.
	 * @returns {Error} Objeto de Erro estendido com propriedade code.
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
	 * @returns {Promise<{totalParticipantes: number, dados: Map<string, any>}>} Promessa com participantes e mapa de dados.
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

					const resultado = this.extrairDados(matrizDadosExcel, tipoFormulario, classificacao, componenteAlvo);
					resolve(resultado);
				} catch (erroDeProcessamento) {
					reject(erroDeProcessamento);
				}
			};

			leitor.onerror = () =>
				reject(this.criarErroPlanilha('Erro físico ao tentar ler o arquivo selecionado.', this.CODIGO_ERRO_PLANILHA.LEITURA_ARQUIVO));
			leitor.readAsArrayBuffer(arquivoPlanilha);
		});
	}

	/**
	 * Extrai os dados da matriz utilizando o padrão Bounding Box.
	 * Se houver espaço vazio na área alvo ou erros matemáticos, dispara uma exceção formatada.
	 * @param {Array<Array>} matriz - Array bidimensional contendo as linhas e colunas do Excel.
	 * @param {number} tipoFormulario - Código do tipo de formulário.
	 * @param {string} classificacao - O sistema (FDI ou ADA).
	 * @param {string} componenteAlvo - O componente alvo ou 'TODOS'.
	 * @returns {{ totalParticipantes: number, dados: Map<string, any> }} Dados e participantes consolidados.
	 */
	static extrairDados(matriz, tipoFormulario, classificacao, componenteAlvo) {
		const ehIndiceCEOD = tipoFormulario === this.TIPO_FORMULARIO.CEOD_TOTAL || tipoFormulario === this.TIPO_FORMULARIO.CEOD_POR_COMPONENTE;

		const ehModeloTotal = tipoFormulario === this.TIPO_FORMULARIO.CEOD_TOTAL || tipoFormulario === this.TIPO_FORMULARIO.CPOD_TOTAL;

		const configSistema = classificacao === this.CLASSIFICACAO_ADA ? this.COORDENADAS_PLANILHA.ADA : this.COORDENADAS_PLANILHA.FDI;
		const configCoords = ehIndiceCEOD ? configSistema.CEOD : configSistema.CPOD;

		const totalParticipantes = this.obterTotalParticipantes(matriz);

		if (totalParticipantes <= 0) {
			throw this.criarErroPlanilha(
				t.modal?.erroParticipantesFalta ?? 'O total de participantes na célula B33 deve ser informado e maior que zero.',
				this.CODIGO_ERRO_PLANILHA.PARTICIPANTES_INVALIDOS,
			);
		}

		const colInicial = this.COORDENADAS_PLANILHA.COL_INICIO_DENTES;
		const colFinal = ehIndiceCEOD ? this.COORDENADAS_PLANILHA.COL_FIM_CEOD : this.COORDENADAS_PLANILHA.COL_FIM_CPOD;

		const { linhaInicialDaArea, linhaFinalDaArea } = this.obterLinhaDaArea(configCoords, ehModeloTotal, componenteAlvo);

		const mapaDados = new Map();
		const listaErros = [];
		const estadoValidacao = {
			encontrouDadoVazio: false,
			listaErrosDeValoresInvalidos: [],
		};

		for (let col = colInicial; col <= colFinal; col++) {
			const chaveDente = String(matriz[configCoords.linhaChaves]?.[col] || '').trim();

			if (!chaveDente || this.CHAVES_INVALIDAS.has(chaveDente)) {
				continue;
			}

			if (ehModeloTotal) {
				this._processarExtracaoTotal(matriz, configCoords, col, chaveDente, totalParticipantes, estadoValidacao, mapaDados, listaErros);
			} else if (componenteAlvo === this.COMPONENTE_TODOS) {
				this._processarExtracaoTodosComponentes(
					matriz,
					configCoords,
					col,
					chaveDente,
					totalParticipantes,
					estadoValidacao,
					mapaDados,
					listaErros,
				);
			} else {
				this._processarExtracaoComponenteUnico(
					matriz,
					configCoords,
					col,
					chaveDente,
					componenteAlvo,
					totalParticipantes,
					estadoValidacao,
					mapaDados,
					listaErros,
				);
			}
		}

		if (estadoValidacao.encontrouDadoVazio) {
			listaErros.unshift(
				this.montarMensagemDeErro({
					ehIndiceCEOD,
					ehModeloTotal,
					componenteAlvo,
					classificacao,
					colunaInicial: colInicial,
					colunaFinal: colFinal,
					linhaInicialDaArea,
					linhaFinalDaArea,
				}),
			);
		}

		if (estadoValidacao.listaErrosDeValoresInvalidos.length > 0) {
			listaErros.push(...estadoValidacao.listaErrosDeValoresInvalidos);
		}

		if (listaErros.length > 0) {
			const codigoErro =
				estadoValidacao.encontrouDadoVazio && listaErros.length > 0
					? this.CODIGO_ERRO_PLANILHA.DADOS_FALTANTES
					: this.CODIGO_ERRO_PLANILHA.VALIDACAO_MATEMATICA;

			const erro = this.criarErroPlanilha('Foram encontradas inconsistências na planilha.', codigoErro);
			erro.detalhes = listaErros;
			throw erro;
		}

		return { totalParticipantes, dados: mapaDados };
	}

	/**
	 * Obtém o total de participantes lido na célula padronizada da planilha.
	 * @param {Array<Array>} matriz - Array bidimensional contendo a planilha.
	 * @returns {number} Quantidade total de participantes.
	 */
	static obterTotalParticipantes(matriz) {
		const valorBruto = matriz[this.COORDENADAS_PLANILHA.LINHA_PARTICIPANTES]?.[this.COORDENADAS_PLANILHA.COLUNA_PARTICIPANTES];
		return parseInt(valorBruto, 10) || 0;
	}

	/**
	 * Determina o intervalo de linhas da área alvo com base no modelo selecionado.
	 * @param {Object} configCoords - Mapeamento de linhas e colunas.
	 * @param {boolean} ehModeloTotal - Se o modelo é do tipo Total.
	 * @param {string} componenteAlvo - Nome do componente selecionado.
	 * @returns {{ linhaInicialDaArea: number, linhaFinalDaArea: number }}
	 */
	static obterLinhaDaArea(configCoords, ehModeloTotal, componenteAlvo) {
		if (ehModeloTotal) {
			const linha = configCoords.linhas[DentesService.COMPONENTES.TOTAL];
			return { linhaInicialDaArea: linha, linhaFinalDaArea: linha };
		}

		if (componenteAlvo === this.COMPONENTE_TODOS) {
			const linhaInicialDaArea = Math.min(
				configCoords.linhas[DentesService.COMPONENTES.CARIADO],
				configCoords.linhas[DentesService.COMPONENTES.OBTURADO],
				configCoords.linhas[DentesService.COMPONENTES.PERDIDO],
			);
			const linhaFinalDaArea = Math.max(
				configCoords.linhas[DentesService.COMPONENTES.CARIADO],
				configCoords.linhas[DentesService.COMPONENTES.OBTURADO],
				configCoords.linhas[DentesService.COMPONENTES.PERDIDO],
			);
			return { linhaInicialDaArea, linhaFinalDaArea };
		}

		const linha = configCoords.linhas[componenteAlvo];
		return { linhaInicialDaArea: linha, linhaFinalDaArea: linha };
	}

	/**
	 * Extrai um valor da célula, marcando o estado de validação quando o conteúdo estiver vazio ou inválido.
	 * @param {Array<Array>} matriz - Matriz de dados da planilha.
	 * @param {number} indiceLinha - Índice Y (linha).
	 * @param {number} indiceColuna - Índice X (coluna).
	 * @param {Object} estadoValidacao - Objeto de rastreio dos erros encontrados.
	 * @param {string} chaveDoDente - Identificador do dente.
	 * @returns {{ valor: number, foiVazio: boolean, valorInvalido: boolean }}
	 */
	static verificarEExtrairValorDaCelula(matriz, indiceLinha, indiceColuna, estadoValidacao, chaveDoDente) {
		const conteudoBruto = matriz[indiceLinha]?.[indiceColuna];

		if (conteudoBruto === undefined || conteudoBruto === null || String(conteudoBruto).trim() === '') {
			estadoValidacao.encontrouDadoVazio = true;
			return { valor: 0, foiVazio: true, valorInvalido: false };
		}

		const valorLimpo = this.converterLimparValorNumerico(conteudoBruto);

		if (isNaN(valorLimpo)) {
			const celulaExcel = `${this.converterIndiceParaLetraExcel(indiceColuna)}${indiceLinha + 1}`;
			const msg =
				t.modal?.erroValorInvalido
					?.replace('[DENTE]', chaveDoDente)
					?.replace('[CELULA]', celulaExcel)
					?.replace('[VALOR]', String(conteudoBruto).trim()) ??
				`Dente ${chaveDoDente}: a célula ${celulaExcel} contém um valor inválido (${String(conteudoBruto).trim()}).`;

			estadoValidacao.listaErrosDeValoresInvalidos.push(msg);
			return { valor: 0, foiVazio: false, valorInvalido: true };
		}

		return { valor: valorLimpo, foiVazio: false, valorInvalido: false };
	}

	/**
	 * Monta a mensagem de erro para dados faltantes usando o idioma ativo da interface.
	 * @param {{ ehIndiceCEOD: boolean, ehModeloTotal: boolean, componenteAlvo: string, classificacao: string, colunaInicial: number, colunaFinal: number, linhaInicialDaArea: number, linhaFinalDaArea: number }} contexto - Metadados da operação.
	 * @returns {string} String com marcação HTML pronta para exibição no modal.
	 */
	static montarMensagemDeErro(contexto) {
		const nomeIndice = contexto.ehIndiceCEOD ? (t.filtros?.indice?.deciduos ?? 'ceo-d') : (t.filtros?.indice?.permanentes ?? 'CPO-D');

		let stringDistribuicao = t.filtros?.opcoes?.total ?? 'Total';

		if (!contexto.ehModeloTotal) {
			if (contexto.componenteAlvo === this.COMPONENTE_TODOS) {
				stringDistribuicao = t.filtros?.opcoes?.totalComponente ?? 'Todos os Componentes';
			} else {
				// Mapeia a constante interna do componente para a tradução ativa no dicionário
				const mapaNomesComponentes = {
					[DentesService.COMPONENTES.CARIADO]: t.formularios?.componentes?.cariado ?? 'Cariado',
					[DentesService.COMPONENTES.PERDIDO]: contexto.ehIndiceCEOD
						? (t.formularios?.componentes?.e_deciduo ?? 'Extraído')
						: (t.formularios?.componentes?.perdido ?? 'Perdido'),
					[DentesService.COMPONENTES.OBTURADO]: t.formularios?.componentes?.obturado ?? 'Obturado',
				};

				const nomeComponenteTraduzido = mapaNomesComponentes[contexto.componenteAlvo] ?? contexto.componenteAlvo;
				stringDistribuicao = `${t.modal?.palavraComponente ?? 'Component'} ${nomeComponenteTraduzido}`;
			}
		}

		const stringClassificacao = String(contexto.classificacao).toUpperCase();
		const celulaInicialExcel = `${this.converterIndiceParaLetraExcel(contexto.colunaInicial)}${contexto.linhaInicialDaArea + 1}`;
		const celulaFinalExcel = `${this.converterIndiceParaLetraExcel(contexto.colunaFinal)}${contexto.linhaFinalDaArea + 1}`;

		const textoPrefixoConfiguracao =
			t.modal?.erroDadosFaltantesConfig ?? 'A planilha possui dados faltantes para a configuração selecionada:';
		const textoAcaoPreencher = t.modal?.erroDadosFaltantesPreencher ?? 'Preencha todos os campos da planilha entre as células';
		const textoConjuncaoE = t.modal?.conjuncaoE ?? 'e';

		return `${textoPrefixoConfiguracao}
    <div class="configuracao-destaque">
      ${nomeIndice} — ${stringDistribuicao} — ${stringClassificacao}
    </div>
    ${textoAcaoPreencher} <strong>${celulaInicialExcel}</strong> ${textoConjuncaoE} <strong>${celulaFinalExcel}</strong>.`;
	}

	/**
	 * Converte o índice numérico da matriz (base 0) para as letras alfabéticas das colunas do Excel.
	 * @param {number} indiceBase0 - O número da coluna no array (ex: 1 = 'B').
	 * @returns {string} Letra correspondente à coluna do Excel.
	 */
	static converterIndiceParaLetraExcel(indiceBase0) {
		let letra = '';
		let temp = indiceBase0;

		while (temp >= 0) {
			letra = String.fromCharCode((temp % 26) + 65) + letra;
			temp = Math.floor(temp / 26) - 1;
		}

		return letra;
	}

	/**
	 * Normaliza valores numéricos brutos da planilha, tratando vírgulas e eliminando casas decimais.
	 * @param {any} valorBruto - O conteúdo não tipado retirado da célula.
	 * @returns {number} O número final formatado.
	 */
	static converterLimparValorNumerico(valorBruto) {
		const num = parseFloat(String(valorBruto).replace(',', '.'));
		return isNaN(num) ? NaN : Number(num.toFixed(2));
	}

	/**
	 * Processa a extração e validação do modelo por valor Total.
	 * @private
	 */
	static _processarExtracaoTotal(matriz, configCoords, col, dente, totalPart, estadoValidacao, mapaDados, listaErros) {
		const { valor, foiVazio } = this.verificarEExtrairValorDaCelula(
			matriz,
			configCoords.linhas[DentesService.COMPONENTES.TOTAL],
			col,
			estadoValidacao,
			dente,
		);

		if (!foiVazio && valor > totalPart) {
			const msg =
				t.modal?.erroParticipantesTotal?.replace('[DENTE]', dente)?.replace('[VALOR]', valor)?.replace('[TOTAL]', totalPart) ??
				`Dente ${dente}: O valor total (${valor}) é maior que o número de participantes (${totalPart}).`;

			listaErros.push(msg);
		}
		mapaDados.set(dente, valor);
	}

	/**
	 * Processa a extração e validação do modelo com Todos os Componentes (C, O, P).
	 * @private
	 */
	static _processarExtracaoTodosComponentes(matriz, configCoords, col, dente, totalPart, estadoValidacao, mapaDados, listaErros) {
		const resC = this.verificarEExtrairValorDaCelula(
			matriz,
			configCoords.linhas[DentesService.COMPONENTES.CARIADO],
			col,
			estadoValidacao,
			dente,
		);
		const resO = this.verificarEExtrairValorDaCelula(
			matriz,
			configCoords.linhas[DentesService.COMPONENTES.OBTURADO],
			col,
			estadoValidacao,
			dente,
		);
		const resP = this.verificarEExtrairValorDaCelula(
			matriz,
			configCoords.linhas[DentesService.COMPONENTES.PERDIDO],
			col,
			estadoValidacao,
			dente,
		);

		const soma = resC.valor + resO.valor + resP.valor;
		const possuiVazio = resC.foiVazio || resO.foiVazio || resP.foiVazio;
		const possuiInvalido = resC.valorInvalido || resO.valorInvalido || resP.valorInvalido;

		if (!possuiVazio && !possuiInvalido && soma > totalPart) {
			const msg =
				t.modal?.erroParticipantesSoma?.replace('[DENTE]', dente)?.replace('[SOMA]', soma)?.replace('[TOTAL]', totalPart) ??
				`Dente ${dente}: A soma (C+O+P = ${soma}) ultrapassa o limite de participantes (${totalPart}).`;

			listaErros.push(msg);
		}

		mapaDados.set(dente, {
			cariado: resC.valor,
			obturado: resO.valor,
			perdido: resP.valor,
		});
	}

	/**
	 * Processa a extração e validação do modelo por Componente Único (somente C, P ou O).
	 * @private
	 */
	static _processarExtracaoComponenteUnico(matriz, configCoords, col, dente, compAlvo, totalPart, estadoValidacao, mapaDados, listaErros) {
		const { valor, foiVazio } = this.verificarEExtrairValorDaCelula(matriz, configCoords.linhas[compAlvo], col, estadoValidacao, dente);

		if (!foiVazio && valor > totalPart) {
			const msg =
				t.modal?.erroParticipantesComponente?.replace('[DENTE]', dente)?.replace('[VALOR]', valor)?.replace('[TOTAL]', totalPart) ??
				`Dente ${dente}: O componente (${valor}) é maior que o número de participantes (${totalPart}).`;

			listaErros.push(msg);
		}
		mapaDados.set(dente, valor);
	}
}
