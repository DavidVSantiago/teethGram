import { inicializarI18n } from './i18n.js';
import { FormController } from './controllers/form-controller.js';
import { UI } from './ui/ui-feedback.js';
import { ThemeManager } from './ui/theme-manager.js';
import { ZoomManager } from './ui/zoom-manager.js';

/**
 * Ponto de entrada da aplicação (Entry Point).
 */
document.addEventListener('DOMContentLoaded', async () => {
	try {
		ThemeManager.init();
		ZoomManager.init();

		await inicializarI18n();
		FormController.init();
		configurarCliquesGlobais();

		console.log('TeethGram: Aplicação inicializada com sucesso.');
	} catch (erro) {
		console.error('Falha crítica na inicialização da aplicação:', erro);
	}
});

/**
 * Ponto de entrada da aplicação (Entry Point).
 * Responsabilidade: Inicializar os módulos principais e configurar ouvintes globais.
 */
document.addEventListener('DOMContentLoaded', async () => {
	try {
		ThemeManager.init();

		await inicializarI18n();
		FormController.init();
		configurarCliquesGlobais();

		console.log('TeethGram: Aplicação inicializada com sucesso.');
	} catch (erro) {
		console.error('Falha crítica na inicialização da aplicação:', erro);
	}
});

/**
 * Agrupa todos os ouvintes de clique da aplicação usando Delegação de Eventos.
 * Direciona o fluxo baseado no ID do elemento clicado.
 */
function configurarCliquesGlobais() {
	document.addEventListener('click', (evento) => {
		const elementoClicado = evento.target;
		const botaoClicado = elementoClicado.closest('button');

		if (!botaoClicado) return;

		switch (botaoClicado.id) {
			case 'botao-selecionar-arquivo':
				abrirSeletorArquivo();
				break;

			case 'botao-baixar':
				baixarPlanilhaModelo();
				break;

			case 'botao-gerar':
				if (typeof FormController.gerarHistograma === 'function') {
					FormController.gerarHistograma();
				} else {
					console.error('Método gerarHistograma não implementado em FormController.');
				}
				break;

			case 'botao-fechar-modal':
				UI.fecharModal();
				break;

			default:
				break;
		}
	});
}

/**
 * Cria um input temporário para invocar a janela nativa de seleção de arquivos.
 */
function abrirSeletorArquivo() {
	const inputArquivo = document.createElement('input');
	inputArquivo.type = 'file';
	inputArquivo.accept = '.xlsx, .xls';

	inputArquivo.addEventListener('change', (evento) => {
		const arquivoSelecionado = evento.target.files[0];

		if (arquivoSelecionado) {
			FormController.handleImport(arquivoSelecionado);
		}
	});

	inputArquivo.click();
}

/**
 * Realiza o download do modelo de planilha correspondente ao idioma ativo na interface.
 */
function baixarPlanilhaModelo() {
	const idiomaAtual = document.documentElement.lang || 'pt-BR';

	const idiomaFormatado = idiomaAtual.toLowerCase();
	const caminhoDoArquivo = `assets/planilhas/teethgram_${idiomaFormatado}.xlsx`;

	const linkDeDownload = document.createElement('a');
	linkDeDownload.href = caminhoDoArquivo;
	linkDeDownload.download = `modelo_teethgram_${idiomaFormatado}.xlsx`;

	linkDeDownload.click();
}
