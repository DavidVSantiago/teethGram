import { I18nManager } from './I18nManager.js';
import { FormController } from './controllers/FormController.js';
import { UI } from './ui/UIFeedback.js';
import { ThemeManager } from './ui/ThemeManager.js';
import { ZoomManager } from './ui/ZoomManager.js';
import { GraficoOdontologico } from './ui/GraficoOdontologico.js';

/**
 * Classe principal que orquestra a inicialização e os eventos globais da aplicação.
 */
class Application {
	constructor() {
		this.grafico = null;

		this.acoesGlobais = {
			'botao-selecionar-arquivo': () => this.abrirSeletorArquivo(),
			'botao-baixar': () => this.baixarPlanilhaModelo(),
			'botao-gerar': () => FormController.gerarHistograma(),
			'botao-fechar-modal': () => UI.fecharModal(),
			'botao-image': () => this.salvarGraficoComoPNG(),
		};
	}

	/**
	 * Inicializa os módulos principais e configura os ouvintes globais.
	 *
	 * @returns {Promise<void>}
	 */
	async init() {
		try {
			ThemeManager.init();
			ZoomManager.init();

			await I18nManager.init();

			this.grafico = new GraficoOdontologico('#drawing');
			FormController.registrarGrafico(this.grafico);

			FormController.init();
			this.configurarCliquesGlobais();
			this.configurarOuvinteIdiomas();
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
	 * Configura o ouvinte do evento de troca de idioma para evitar
	 * o scroll automático indesejado até o container do gráfico.
	 */
	configurarOuvinteIdiomas() {
		document.addEventListener('i18n:languageChanged', () => {
			const posicaoScrollAtual = window.scrollY;

			// Solicita a atualização do gráfico se ele estiver visível no formulário
			if (FormController.dadosHistogramaAtivos) {
				FormController.re - renderizarGraficoSemScroll();
			}

			// Restaura a posição exata da tela onde o usuário estava
			requestAnimationFrame(() => {
				window.scrollTo({
					top: posicaoScrollAtual,
					behavior: 'instant',
				});
			});
		});
	}

	/**
	 * Utilitário centralizado para disparar downloads de arquivos via navegador.
	 *
	 * @param {string} urlData - URL ou dados no formato DataURL.
	 * @param {string} nomeArquivo - Nome padrão para salvar o arquivo.
	 */
	fazerDownload(urlData, nomeArquivo) {
		const linkDownload = document.createElement('a');
		linkDownload.href = urlData;
		linkDownload.download = nomeArquivo;
		linkDownload.click();
	}

	/**
	 * Realiza o download da imagem gerada no Canvas em formato PNG.
	 */
	salvarGraficoComoPNG() {
		const elementoCanvas = document.getElementById('drawing');
		if (!elementoCanvas) return;

		const imagemDataUrl = elementoCanvas.toDataURL('image/png');
		this.fazerDownload(imagemDataUrl, 'histograma-teethgram.png');
	}

	/**
	 * Invoca a janela nativa de seleção de arquivos utilizando um input temporário.
	 */
	abrirSeletorArquivo() {
		const inputArquivo = document.createElement('input');
		inputArquivo.type = 'file';
		inputArquivo.accept = '.xlsx, .xls';
		inputArquivo.style.display = 'none';

		document.body.appendChild(inputArquivo);

		const limparInput = () => inputArquivo.remove();

		inputArquivo.addEventListener('change', (evento) => {
			const arquivoSelecionado = evento.target.files[0];
			if (arquivoSelecionado) {
				FormController.handleImport(arquivoSelecionado);
			}
			limparInput();
		});

		inputArquivo.addEventListener('cancel', limparInput);

		inputArquivo.click();
	}

	/**
	 * Realiza o download do modelo de planilha correspondente ao idioma ativo.
	 */
	baixarPlanilhaModelo() {
		const idiomaAtual = document.documentElement.lang || 'pt-BR';
		const idiomaFormatado = idiomaAtual.toLowerCase();
		const caminhoDoArquivo = `assets/planilhas/teethgram_${idiomaFormatado}.xlsx`;
		const nomeDownload = `modelo_teethgram_${idiomaFormatado}.xlsx`;

		this.fazerDownload(caminhoDoArquivo, nomeDownload);
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const app = new Application();
	app.init();
});
