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
		const botaoClicado = evento.target.closest('button');

		if (!botaoClicado) return;

		switch (botaoClicado.id) {
			case 'botao-selecionar-arquivo':
				abrirSeletorArquivo();
				break;

			case 'botao-baixar':
				baixarPlanilhaModelo();
				break;

			case 'botao-gerar':
				FormController.gerarHistograma?.();
				break;

			case 'botao-fechar-modal':
				UI.fecharModal();
				break;
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
