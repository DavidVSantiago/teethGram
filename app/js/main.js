import { t } from './i18n.js';

/**
 * ENUM para identificação dos tipos de formulários.
 */
export const TIPO_FORMULARIO = {
	CEOD_POR_COMPONENTE: 1,
	CEOD_TOTAL: 2,
	CPOD_POR_COMPONENTE: 3,
	CPOD_TOTAL: 4,
};

/**
 * Mapeamento do tipo de formulário para o nome do arquivo interno.
 */
export const DESCRICAO_TIPO_FORMULARIO = {
	[TIPO_FORMULARIO.CEOD_POR_COMPONENTE]: 'ceod-por-comp',
	[TIPO_FORMULARIO.CEOD_TOTAL]: 'ceod-total',
	[TIPO_FORMULARIO.CPOD_POR_COMPONENTE]: 'cpod-por-comp',
	[TIPO_FORMULARIO.CPOD_TOTAL]: 'cpod-total',
};

/**
 * Mapeamento do tipo de formulário para exibição amigável ao usuário.
 */
export const NOMES_EXIBICAO_FORMULARIO = {
	[TIPO_FORMULARIO.CEOD_POR_COMPONENTE]: 'ceo-d (Por Componente)',
	[TIPO_FORMULARIO.CEOD_TOTAL]: 'ceo-d (Total)',
	[TIPO_FORMULARIO.CPOD_POR_COMPONENTE]: 'CPO-D (Por Componente)',
	[TIPO_FORMULARIO.CPOD_TOTAL]: 'CPO-D (Total)',
};

export const QTD_COLUNAS_CEOD = 20;
export const QTD_COLUNAS_CPOD = 32;
export const LOCAL_ARQUIVOS = 'assets/planilhas/';

export const ARQUIVOS_CEOD = {
	TOTAL: `${LOCAL_ARQUIVOS}Total-ceo-d.xlsx`,
	POR_COMPONENTE: `${LOCAL_ARQUIVOS}PComp-ceo-d.xlsx`,
};

export const ARQUIVOS_CPOD = {
	TOTAL: `${LOCAL_ARQUIVOS}Total-cpo-d.xlsx`,
	POR_COMPONENTE: `${LOCAL_ARQUIVOS}PComp-cpo-d.xlsx`,
};

/**
 * =======================================================================================
 * FUNÇÕES DE AÇÃO DA TELA
 * =======================================================================================
 */

/**
 * Dispara o download automático do modelo de planilha correspondente ao formulário ativo na tela.
 */
export function baixarPlanilhaModelo() {
	const tipoForm = verificaTipoFormulario();

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

	const link = document.createElement('a');
	link.href = caminhoArquivo;
	link.download = caminhoArquivo.split('/').pop();
	link.click();
}

/**
 * Cria dinamicamente um input de arquivo e abre a janela de seleção para o usuário.
 */
export function selecionarArquivoPlanilha() {
	const entradaArquivo = document.createElement('input');
	entradaArquivo.type = 'file';
	entradaArquivo.accept = '.xlsx, .xls';

	entradaArquivo.addEventListener('change', (e) => {
		const arquivo = e.target.files[0];
		if (arquivo) {
			processarArquivoSelecionado(arquivo);
		}
	});

	entradaArquivo.click();
}

/**
 * Inicia a lógica de geração de gráficos a partir dos dados do formulário.
 */
export function gerarHistograma() {
	// TODO: Implementar a lógica de geração do gráfico baseada nos inputs da tela
	console.log('Iniciando geração de histograma...');
}

/**
 * =======================================================================================
 * PROCESSAMENTO DE DADOS E PLANILHAS
 * =======================================================================================
 */

/**
 * Lê o arquivo Excel selecionado, converte em matriz e processa os dados epidemiológicos.
 *
 * @param {File} file - O arquivo Excel selecionado pelo usuário.
 */
export function processarArquivoSelecionado(file) {
	const tipoFormularioNaTela = verificaTipoFormulario();

	if (!tipoFormularioNaTela) {
		alert('Tipo de formulário não identificado na tela.');
		return;
	}

	const leitor = new FileReader();

	leitor.onload = (e) => {
		const workbook = XLSX.read(e.target.result, { type: 'array' });
		const primeiraAba = workbook.Sheets[workbook.SheetNames[0]];

		const dadosMatriz = XLSX.utils.sheet_to_json(primeiraAba, {
			header: 1,
			defval: '',
			blankrows: true,
		});

		const tipoFormularioNaPlanilha = identificarTipoPlanilha(dadosMatriz);

		if (!tipoFormularioNaPlanilha) {
			alert('Planilha inválida ou não reconhecida.');
			return;
		}

		if (tipoFormularioNaPlanilha !== tipoFormularioNaTela) {
			const nomeTela = NOMES_EXIBICAO_FORMULARIO[tipoFormularioNaTela];
			const nomePlanilha = NOMES_EXIBICAO_FORMULARIO[tipoFormularioNaPlanilha];

			const conteudoHtml = /* html */ `
        <p>${t.modal.mensagemErro}</p>

        <div class="alerta-comparativo">
          <span><b>${t.modal.labelTela}</b> <strong>${nomeTela}</strong></span>
          <span><b>${t.modal.labelPlanilha}</b> <strong class="valor-planilha">${nomePlanilha}</strong></span>
        </div>
        <p class="alerta-dica">${t.modal.dicaErro}</p>
      `;

			exibirAlerta(t.modal.tituloErro, conteudoHtml);
			return;
		}

		const planilhaFormatada = formataPlanilha(dadosMatriz, tipoFormularioNaPlanilha);
		console.log('Processamento concluído com sucesso:', planilhaFormatada);
	};

	leitor.readAsArrayBuffer(file);
}

/**
 * Extrai os dados valiosos (participantes e valores por dente) da matriz bruta do Excel.
 *
 * @param {Array<Array>} dados - Matriz contendo as linhas e colunas lidas da planilha.
 * @param {number} tipoFormularioNaPlanilha - ID interno do tipo de índice e modo.
 * @returns {Object} Objeto com tipo, total de participantes e vetor de dados limpos.
 */
export function formataPlanilha(dados, tipoFormularioNaPlanilha) {
	const cabecalho = dados[0];
	const linhas = dados.slice(1);

	const colunasDentes = cabecalho
		.map((h, i) => (/^\d+$/.test(h) ? i : null))
		.filter((i) => i !== null);

	let totalParticipantes = 0;

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
		const linhaTotal = linhas.find((l) => l[0] && String(l[0]).toLowerCase().includes('total'));

		for (const indiceColuna of colunasDentes) {
			let valor = linhaTotal?.[indiceColuna] ?? '';

			if (valor !== '') {
				valor = parseFloat(String(valor).replace(',', '.'));
				valor = isNaN(valor) ? '' : Number(valor.toFixed(2));
			}

			dadosFinais.push(valor);
		}
	} else {
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
 * Lê os selects do DOM para identificar qual formulário está sendo exibido atualmente.
 *
 * @returns {number|null} ID interno do tipo de formulário.
 */
export function verificaTipoFormulario() {
	const indice = document.getElementById('selecao-indice')?.value;
	const distribuicao = document.getElementById('selecao-distribuicao')?.value;

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
 * Realiza uma checagem heurística no cabeçalho e linhas para inferir de qual índice
 * pertence a planilha importada.
 *
 * @param {Array<Array>} dadosMatriz - Dados brutos da planilha.
 * @returns {number|null} ID interno do tipo de formulário identificado ou null se inválido.
 */
export function identificarTipoPlanilha(dadosMatriz) {
	if (!dadosMatriz || dadosMatriz.length === 0) return null;

	const cabecalho = dadosMatriz[0];
	const indexCodigo = cabecalho.findIndex((h) => String(h).toLowerCase().includes('código'));

	if (indexCodigo === -1) return null;

	const colunasNumericas = cabecalho.slice(indexCodigo + 1).filter((h) => /^\d+$/.test(h));
	let tipoIndice = null;

	if (colunasNumericas.length === QTD_COLUNAS_CEOD) {
		tipoIndice = 'CEOD';
	} else if (colunasNumericas.length === QTD_COLUNAS_CPOD) {
		tipoIndice = 'CPOD';
	} else {
		return null;
	}

	const possuiTermosComponente = dadosMatriz.some((linha) => {
		const primeiraColuna = String(linha[0]).toLowerCase();
		return (
			primeiraColuna.includes('cariado') ||
			primeiraColuna.includes('perdido') ||
			primeiraColuna.includes('obturado')
		);
	});

	const modo = possuiTermosComponente ? 'POR_COMPONENTE' : 'TOTAL';

	if (tipoIndice === 'CEOD') {
		return modo === 'TOTAL' ? TIPO_FORMULARIO.CEOD_TOTAL : TIPO_FORMULARIO.CEOD_POR_COMPONENTE;
	} else {
		return modo === 'TOTAL' ? TIPO_FORMULARIO.CPOD_TOTAL : TIPO_FORMULARIO.CPOD_POR_COMPONENTE;
	}
}

/**
 * Exibe o modal de feedback para o usuário de forma imperativa.
 *
 * @param {string} titulo - Título a ser exibido no modal.
 * @param {string} htmlConteudo - Corpo de texto em formato HTML livre.
 */
export function exibirAlerta(titulo, htmlConteudo) {
	const modal = document.getElementById('janela-modal');
	if (!modal) return;

	document.getElementById('modal-titulo').textContent = titulo;
	document.getElementById('modal-mensagem').innerHTML = htmlConteudo;
	modal.style.display = 'flex';
}

/**
 * Oculta o modal de feedback.
 */
export function fecharModal() {
	const modal = document.getElementById('janela-modal');
	if (modal) modal.style.display = 'none';
}

/**
 * Intercepta cliques na tela inteira e direciona para a função correta
 * caso o alvo tenha um ID mapeado. Ideal para elementos recriados via innerHTML.
 */
document.addEventListener('click', (evento) => {
	const alvo = evento.target;

	// Usamos closest para garantir que funcione mesmo se o clique for no texto dentro do botão
	if (alvo.closest('#botao-baixar')) {
		baixarPlanilhaModelo();
	} else if (alvo.closest('#botao-selecionar-arquivo')) {
		selecionarArquivoPlanilha();
	} else if (alvo.closest('#botao-gerar')) {
		gerarHistograma();
	} else if (alvo.closest('#botao-fechar-modal')) {
		fecharModal();
	}
});
