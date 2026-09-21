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
			'botao-image': () => this.salvarGrafico(),
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
	 * Executa o disparo do download do arquivo no navegador.
	 * @param {string} urlData - Data URL da imagem gerada.
	 * @param {string} nomeArquivo - Nome do arquivo a ser salvo.
	 */
	fazerDownload(urlData, nomeArquivo) {
		const linkDownload = document.createElement('a');
		linkDownload.href = urlData;
		linkDownload.download = nomeArquivo;
		linkDownload.click();
	}

	/**
	 * Realiza o download da imagem gerada no Canvas capturando o formato e a resolução (DPI) diretamente da interface.
	 *
	 * @param {number} qualidade - Valor entre 0 e 1 (aplicado apenas para jpeg). Default: 0.92.
	 */
	salvarGrafico(qualidade = 0.92) {
		const elementoCanvas = document.getElementById('drawing');
		if (!elementoCanvas) return;

		// Captura os valores diretamente dos seletores da interface
		const formatoSelecionado = document.getElementById('formato-imagem')?.value || 'png';
		const escalaDpi = parseInt(document.getElementById('resolucao-dpi')?.value || '1', 10);

		const extensao = formatoSelecionado.toLowerCase() === 'jpeg' ? 'jpg' : 'png';
		const mimeType = extensao === 'jpg' ? 'image/jpeg' : 'image/png';

		let canvasAlvo = elementoCanvas;

		if (escalaDpi > 1) {
			const canvasTemp = document.createElement('canvas');
			canvasTemp.width = elementoCanvas.width * escalaDpi;
			canvasTemp.height = elementoCanvas.height * escalaDpi;
			const ctxTemp = canvasTemp.getContext('2d');

			ctxTemp.drawImage(elementoCanvas, 0, 0, canvasTemp.width, canvasTemp.height);
			canvasAlvo = canvasTemp;
		}

		const imagemDataUrl = extensao === 'jpg' ? canvasAlvo.toDataURL(mimeType, qualidade) : canvasAlvo.toDataURL(mimeType);

		this.fazerDownload(imagemDataUrl, `histograma-teethgram.${extensao}`);
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
