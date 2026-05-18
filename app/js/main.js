import { inicializarI18n } from './i18n.js';
import { FormController } from './controllers/form-controller.js';
import { UI } from './ui/ui-feedback.js';

/**
 * Ponto de entrada da aplicação (Entry Point).
 * Aguarda o carregamento completo do DOM antes de inicializar os módulos.
 */
document.addEventListener('DOMContentLoaded', async () => {
	try {
		await inicializarI18n();

		FormController.init();

		configurarCliquesGlobais();

		console.log('TeethGram: Aplicação inicializada com sucesso.');
	} catch (erro) {
		console.error('Falha crítica na inicialização:', erro);
	}
});

/**
 * Agrupa todos os ouvintes de clique da aplicação usando Delegação de Eventos.
 * Garante que elementos recriados dinamicamente continuem respondendo aos cliques.
 */
function configurarCliquesGlobais() {
	document.addEventListener('click', (evento) => {
		const alvo = evento.target;

		// Botão: Selecionar Arquivo (Importar Planilha)
		if (alvo.closest('#botao-selecionar-arquivo')) {
			abrirSeletorArquivo();
		}

		// Botão: Baixar Modelo de Planilha
		if (alvo.closest('#botao-baixar')) {
			baixarPlanilhaModelo();
		}

		// Botão: Gerar Histograma / Gráfico
		if (alvo.closest('#botao-gerar')) {
			FormController.gerarHistograma?.();
		}

		// Botão: Fechar Modal de Alerta
		if (alvo.closest('#botao-fechar-modal')) {
			UI.fecharModal();
		}
	});
}

/**
 * Cria um input temporário, simulando o clique do usuário para abrir
 * a janela de seleção de arquivos do sistema operacional.
 */
function abrirSeletorArquivo() {
	const entrada = document.createElement('input');
	entrada.type = 'file';
	entrada.accept = '.xlsx, .xls';

	entrada.onchange = (e) => {
		const arquivo = e.target.files[0];
		if (arquivo) {
			FormController.handleImport(arquivo);
		}
	};

	entrada.click();
}

/**
 * Realiza o download do modelo de planilha correspondente ao idioma ativo.
 */
function baixarPlanilhaModelo() {
	const idioma = document.documentElement.lang || 'pt-br';
	const caminho = `assets/planilhas/teethgram_${idioma}.xlsx`;

	const link = document.createElement('a');
	link.href = caminho;
	link.download = `modelo_teethgram_${idioma}.xlsx`;

	link.click();
}
