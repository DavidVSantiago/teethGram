import { I18nManager } from './I18nManager.js';
import { FormController } from './controllers/FormController.js';
import { UI } from './ui/UIFeedback.js';
import { ThemeManager } from './ui/ThemeManager.js';
import { ZoomManager } from './ui/ZoomManager.js';

/**
 * Classe principal que orquestra a inicialização e os eventos globais da aplicação.
 */
class Application {
	constructor() {
		this.acoesGlobais = {
			'botao-selecionar-arquivo': () => this.abrirSeletorArquivo(),
			'botao-baixar': () => this.baixarPlanilhaModelo(),
			'botao-gerar': () => FormController.gerarHistograma(),
			'botao-fechar-modal': () => UI.fecharModal(),
		};
	}

	/**
	 * Inicializa os módulos principais e configura os ouvintes globais.
	 */
	async init() {
		try {
			ThemeManager.init();
			ZoomManager.init();

			await I18nManager.init();

			FormController.init();
			this.configurarCliquesGlobais();
		} catch (erro) {
			console.error('Falha crítica na inicialização da aplicação:', erro);
		}
	}

	/**
	 * Agrupa todos os ouvintes de clique da aplicação usando Delegação de Eventos.
	 */
	configurarCliquesGlobais() {
		document.addEventListener('click', (evento) => {
			const elementoClicado = evento.target;
			const botaoClicado = elementoClicado.closest('button');

			if (!botaoClicado) return;

			const executarAcao = this.acoesGlobais[botaoClicado.id];

			if (typeof executarAcao === 'function') {
				executarAcao();
			}
		});
	}

	/**
	 * Cria um input temporário para invocar a janela nativa de seleção de arquivos.
	 */
	abrirSeletorArquivo() {
		const inputArquivo = document.createElement('input');
		inputArquivo.type = 'file';
		inputArquivo.accept = '.xlsx, .xls';
		inputArquivo.style.display = 'none';

		document.body.appendChild(inputArquivo);

		inputArquivo.addEventListener('change', (evento) => {
			const arquivoSelecionado = evento.target.files[0];

			if (arquivoSelecionado) {
				FormController.handleImport(arquivoSelecionado);
			}

			inputArquivo.remove();
		});

		inputArquivo.addEventListener('cancel', () => {
			inputArquivo.remove();
		});

		inputArquivo.click();
	}

	/**
	 * Realiza o download do modelo de planilha correspondente ao idioma ativo.
	 */
	baixarPlanilhaModelo() {
		const idiomaAtual = document.documentElement.lang || 'pt-BR';
		const idiomaFormatado = idiomaAtual.toLowerCase();
		const caminhoDoArquivo = `assets/planilhas/teethgram_${idiomaFormatado}.xlsx`;

		const linkDeDownload = document.createElement('a');
		linkDeDownload.href = caminhoDoArquivo;
		linkDeDownload.download = `modelo_teethgram_${idiomaFormatado}.xlsx`;

		linkDeDownload.click();
	}
}

// Ponto de entrada da aplicação (Entry Point)
document.addEventListener('DOMContentLoaded', () => {
	const app = new Application();
	app.init();
});
