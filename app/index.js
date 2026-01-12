/**
 * =======================================================================================
 * CONFIGURAÇÕES E CONSTANTES GLOBAIS
 * =======================================================================================
 */

/**
 * Simulação de ENUM para identificação dos tipos de formulários.
 * Utilizado para controle de fluxo e lógica de download/geração.
 * @enum {number}
 */
const TIPO_FORMULARIO = {
	CEOD_POR_COMPONENTE: 1,
	CEOD_TOTAL: 2,
	CPOD_POR_COMPONENTE: 3,
	CPOD_TOTAL: 4,
};

/**
 * Mapeamento de identificadores de formulários para strings de saída.
 * Traduz o valor numérico do TIPO_FORMULARIO para o nome do arquivo.
 */
const DESCRICAO_TIPO_FORMULARIO = {
	[TIPO_FORMULARIO.CEOD_POR_COMPONENTE]: 'ceod-por-comp',
	[TIPO_FORMULARIO.CEOD_TOTAL]: 'ceod-total',
	[TIPO_FORMULARIO.CPOD_POR_COMPONENTE]: 'cpod-por-comp',
	[TIPO_FORMULARIO.CPOD_TOTAL]: 'cpod-total',
};

};

/**
 * Definição da quantidade de colunas (dentes) esperadas para cada índice epidemiológico.
 */
const QTD_COLUNAS_CEOD = 20;
const QTD_COLUNAS_CPOD = 32;

/**
 * Configuração de caminhos para os modelos de planilhas Excel (.xlsx).
 * @constant {string} LOCAL_ARQUIVOS - Pasta raiz dos arquivos de planilha.
 */
const LOCAL_ARQUIVOS = 'planilhas/';

/**
 * Mapeamento dos caminhos específicos para planilhas do índice ceo-d (Decíduos).
 */
const ARQUIVOS_CEOD = {
	TOTAL: `${LOCAL_ARQUIVOS}Total-ceo-d.xlsx`,
	POR_COMPONENTE: `${LOCAL_ARQUIVOS}PComp-ceo-d.xlsx`,
};

/**
 * Mapeamento dos caminhos específicos para planilhas do índice CPO-D (Permanentes).
 */
const ARQUIVOS_CPOD = {
	TOTAL: `${LOCAL_ARQUIVOS}Total-cpo-d.xlsx`,
	POR_COMPONENTE: `${LOCAL_ARQUIVOS}PComp-cpo-d.xlsx`,
};

/**
 * =======================================================================================
 * FUNÇÕES DOS BOTÕES DA TELA
 * =======================================================================================
 */

/**
 * Gerencia o download do modelo de planilha correspondente ao formulário ativo.
 */
function baixarPlanilhaModelo() {
	const tipoForm = verificaTipoFormulario();

	// Mapa de busca rápida (Lookup Table) em vez de switch/case
	const mapasArquivos = {
		[TIPO_FORMULARIO.CEOD_POR_COMPONENTE]: ARQUIVOS_CEOD.POR_COMPONENTE,
		[TIPO_FORMULARIO.CEOD_TOTAL]: ARQUIVOS_CEOD.TOTAL,
		[TIPO_FORMULARIO.CPOD_POR_COMPONENTE]: ARQUIVOS_CPOD.POR_COMPONENTE,
		[TIPO_FORMULARIO.CPOD_TOTAL]: ARQUIVOS_CPOD.TOTAL,
	};

	const caminhoArquivo = mapasArquivos[tipoForm];

	if (!caminhoArquivo) {
		alert('Arquivo não identificado para este formulário.');
		return;
	}

	// Disparo programático do download
	const link = document.createElement('a');
	link.href = caminhoArquivo;
	link.download = caminhoArquivo.split('/').pop();
	link.click();
}

/**
 * Cria um input de arquivo oculto para permitir a seleção de planilhas Excel pelo usuário.
 */
function selecionarArquivoPlanilha() {
	const entradaArquivo = document.createElement('input');
	entradaArquivo.type = 'file';
	entradaArquivo.accept = '.xlsx, .xls';

	// Ouve o evento de mudança antes de disparar o clique
	entradaArquivo.addEventListener('change', e => {
		const arquivo = e.target.files[0];
		if (arquivo) {
			processarArquivoSelecionado(arquivo);
		}
	});

	// Dispara a janela de seleção
	entradaArquivo.click();
}

/**
 * Inicia o processamento dos dados em tela para geração do histograma.
 */
function gerarHistograma() {
	// TODO: Implementar a lógica de geração do gráfico baseada nos inputs da tela
	console.log('Iniciando geração de histograma...');
}

/**
 * =======================================================================================
 * PROCESSAMENTO DE DADOS E PLANILHAS
 * =======================================================================================
 */

/**
 * Callback executado após a seleção de um arquivo. Lê os dados via biblioteca XLSX
 * e valida a compatibilidade entre a planilha e o formulário ativo na tela.
 * @param {File} file - O arquivo Excel selecionado.
 */
function processarArquivoSelecionado(file) {
	const tipoFormularioNaTela = verificaTipoFormulario();
	if (!tipoFormularioNaTela) {
		alert('Tipo de formulário não identificado na tela.');
		return;
	}

	const leitor = new FileReader();

	leitor.onload = e => {
		const workbook = XLSX.read(e.target.result, { type: 'array' });
		const primeiraAba = workbook.Sheets[workbook.SheetNames[0]];

		const dadosMatriz = XLSX.utils.sheet_to_json(primeiraAba, {
			header: 1,
			defval: '',
			blankrows: true,
		});

		// Validação da estrutura da planilha importada
		const tipoFormularioNaPlanilha = identificarTipoPlanilha(dadosMatriz);

		if (!tipoFormularioNaPlanilha) {
			alert('Planilha inválida ou não reconhecida.');
			return;
		}

		// Comparação de segurança: Planilha vs Seleção na Tela
		if (tipoFormularioNaPlanilha !== tipoFormularioNaTela) {
			return;
		}

		const planilhaFormatada = formataPlanilha(
			dadosMatriz,
			tipoFormularioNaPlanilha
		);
		console.log('Processamento concluído com sucesso:', planilhaFormatada);
	};

	leitor.readAsArrayBuffer(file);
}

/**
 * Varre a matriz de dados da planilha para extrair participantes e valores por dente.
 * @param {Array} dados - Matriz bruta de dados da planilha.
 * @param {number} tipoFormularioNaPlanilha - Tipo de formulário identificado.
 * @returns {Object} Objeto contendo o tipo, total de participantes e array de dados.
 */
function formataPlanilha(dados, tipoFormularioNaPlanilha) {
	const cabecalho = dados[0];
	const linhas = dados.slice(1);

	// Mapeia índices das colunas que possuem numeração de dentes
	const colunasDentes = cabecalho
		.map((h, i) => (/^\d+$/.test(h) ? i : null))
		.filter(i => i !== null);

	let totalParticipantes = 0;

	// Busca o total de participantes nas linhas da planilha
	for (const linha of linhas) {
		if (String(linha[0]).toLowerCase().includes('particip')) {
			for (const i of colunasDentes) {
				if (linha[i] !== '') {
					totalParticipantes = parseInt(linha[i]);
					break;
				}
			}
		}
	}

	const dadosFinais = [];
	const ehModeloTotal =
		tipoFormularioNaPlanilha === TIPO_FORMULARIO.CEOD_TOTAL ||
		tipoFormularioNaPlanilha === TIPO_FORMULARIO.CPOD_TOTAL;

	if (ehModeloTotal) {
		const linhaTotal = linhas.find(
			l => l[0] && String(l[0]).toLowerCase().includes('total')
		);
		for (const indiceColuna of colunasDentes) {
			let valor = linhaTotal?.[indiceColuna] ?? '';

			if (valor !== '') {
				valor = parseFloat(String(valor).replace(',', '.'));
				valor = isNaN(valor) ? '' : Number(valor.toFixed(2));
			}

			dadosFinais.push(valor);
		}
	} else {
		// Modelo por Componente
		for (const indiceColuna of colunasDentes) {
			for (const linha of linhas) {
				if (String(linha[0]).toLowerCase().includes('particip')) continue;
				let valor = linha[indiceColuna];
				if (valor === '') {
					dadosFinais.push('');
				} else {
					valor = parseFloat(String(valor).replace(',', '.').replace(/"/g, ''));
					dadosFinais.push(isNaN(valor) ? '' : Number(valor.toFixed(2)));
				}
			}
		}
	}

	return {
		tipo: DESCRICAO_TIPO_FORMULARIO[tipoFormularioNaPlanilha],
		totalParticipantes,
		dados: dadosFinais,
	};
}

/**
 * =======================================================================================
 * FUNÇÕES AUXILIARES E DE VALIDAÇÃO
 * =======================================================================================
 */

/**
 * Identifica o tipo de formulário ativo com base nos selects da interface.
 * @returns {number|null} ID do ENUM TIPO_FORMULARIO.
 */
function verificaTipoFormulario() {
	const indice = document.getElementById('selecao-indice').value;
	const distribuicao = document.getElementById('selecao-distribuicao').value;

	if (indice === 'ceo-d') {
		return distribuicao === 'total'
			? TIPO_FORMULARIO.CEOD_TOTAL
			: TIPO_FORMULARIO.CEOD_POR_COMPONENTE;
	}
	if (indice === 'cpo-d') {
		return distribuicao === 'total'
			? TIPO_FORMULARIO.CPOD_TOTAL
			: TIPO_FORMULARIO.CPOD_POR_COMPONENTE;
	}
	return null;
}

/**
 * Analisa a estrutura de uma matriz de dados para identificar o índice (CPO-D/ceo-d) e modo.
 * @param {Array} dadosMatriz - Dados brutos lidos do Excel.
 * @returns {number|null} ID do ENUM TIPO_FORMULARIO identificado na planilha.
 */
function identificarTipoPlanilha(dadosMatriz) {
	if (!dadosMatriz || dadosMatriz.length === 0) return null;

	const cabecalho = dadosMatriz[0];
	const indexCodigo = cabecalho.findIndex(h =>
		String(h).toLowerCase().includes('código')
	);

	if (indexCodigo === -1) return null;

	const colunasNumericas = cabecalho
		.slice(indexCodigo + 1)
		.filter(h => /^\d+$/.test(h));
	let tipoIndice = null;

	if (colunasNumericas.length === QTD_COLUNAS_CEOD) {
		tipoIndice = 'CEOD';
	} else if (colunasNumericas.length === QTD_COLUNAS_CPOD) {
		tipoIndice = 'CPOD';
	} else {
		return null;
	}

	const possuiTermosComponente = dadosMatriz.some(linha => {
		const primeiraColuna = String(linha[0]).toLowerCase();
		return (
			primeiraColuna.includes('cariado') ||
			primeiraColuna.includes('perdido') ||
			primeiraColuna.includes('obturado')
		);
	});

	const modo = possuiTermosComponente ? 'POR_COMPONENTE' : 'TOTAL';

	if (tipoIndice === 'CEOD') {
		return modo === 'TOTAL'
			? TIPO_FORMULARIO.CEOD_TOTAL
			: TIPO_FORMULARIO.CEOD_POR_COMPONENTE;
	} else {
		return modo === 'TOTAL'
			? TIPO_FORMULARIO.CPOD_TOTAL
			: TIPO_FORMULARIO.CPOD_POR_COMPONENTE;
	}
}


    return null;
}

}
