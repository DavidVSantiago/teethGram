import { t } from '../i18n.js';
import { ViewManager } from '../ui/view-manager.js';
import { FormRenderer } from '../ui/form-renderer.js';
import { UI } from '../ui/ui-feedback.js';
import { processarPlanilha, TIPO_FORMULARIO } from '../services/planilha-service.js';
import { converterFDIParaADA, COMPONENTES } from '../services/odontometria-config.js';

/**
 * Controlador responsável por orquestrar a interface do formulário e o fluxo de dados.
 * Atua como mediador entre a UI (View) e a lógica de negócios (Services).
 */
export const FormController = {
	estado: {
		indice: null,
		distribuicao: null,
	},

	/**
	 * Inicializa o controlador, configurando os eventos e realizando a primeira renderização.
	 */
	init() {
		this.setupListeners();
		this.renderizar();
	},

	/**
	 * Configura os ouvintes de eventos para os campos de seleção principais.
	 */
	setupListeners() {
		document.getElementById('selecao-indice')?.addEventListener('change', () => this.renderizar());

		document
			.getElementById('selecao-distribuicao')
			?.addEventListener('change', () => this.renderizar());

		document
			.getElementById('selecao-classificacao')
			?.addEventListener('change', () => this.atualizarSistemaNumeracao());
	},

	/**
	 * Renderiza a grade de dentes na tela com base nas opções selecionadas no filtro.
	 */
	renderizar() {
		const indice = document.getElementById('selecao-indice')?.value;
		const distribuicao = document.getElementById('selecao-distribuicao')?.value;
		const container = document.getElementById('container-formulario');

		// Evita re-renderização desnecessária se o estado não sofreu mutação
		if (this.estado.indice === indice && this.estado.distribuicao === distribuicao) {
			return;
		}

		ViewManager.mudarTituloCard(indice);
		this.atualizarOpcoesDistribuicao(indice);

		const sistema = FormRenderer.obterQuadrantes(indice);
		const ehTotal = distribuicao === 'total';

		// Define a configuração de componentes baseada no índice de forma limpa
		let configComp = null;
		if (!ehTotal) {
			configComp = indice === 'cpo-d' ? this.obterConfiguracaoCPOD() : this.obterConfiguracaoCEOD();
		}

		if (container) {
			container.innerHTML = FormRenderer.gerarEstruturaArcos(sistema, configComp);
		}

		// Atualiza o estado interno e sincroniza a numeração (FDI/ADA)
		this.estado = { indice, distribuicao };
		this.atualizarSistemaNumeracao();
	},

	/**
	 * Atualiza dinamicamente os textos das opções de distribuição
	 * para refletir a nomenclatura correta do índice (CPO-D vs ceo-d).
	 * * @param {string} indice - O índice epidemiológico selecionado ('cpo-d' ou 'ceo-d').
	 */
	atualizarOpcoesDistribuicao(indice) {
		const selectDist = document.getElementById('selecao-distribuicao');
		if (!selectDist) return;

		const textos = indice === 'cpo-d' ? t.filtros.opcoes?.permanente : t.filtros.opcoes?.deciduo;
		if (!textos) return;

		const opcaoC = selectDist.querySelector('option[value="componente-c"]');
		const opcaoP = selectDist.querySelector('option[value="componente-p"]');
		const opcaoO = selectDist.querySelector('option[value="componente-o"]');

		// Atualiza o DOM injetando os textos localizados
		if (opcaoC) opcaoC.textContent = textos.componenteC;
		if (opcaoP) opcaoP.textContent = textos.componenteP;
		if (opcaoO) opcaoO.textContent = textos.componenteO;
	},

	/**
	 * Atualiza os rótulos numéricos dos dentes (FDI ou ADA) de acordo com a seleção.
	 * Utiliza a função centralizada de conversão para manter o código DRY.
	 */
	atualizarSistemaNumeracao() {
		const sistemaAlvo = document.getElementById('selecao-classificacao')?.value;
		const titulos = document.querySelectorAll('[data-fdi]');

		titulos.forEach((el) => {
			const fdi = el.getAttribute('data-fdi');

			if (sistemaAlvo === 'ada') {
				el.textContent = converterFDIParaADA(fdi);
			} else {
				el.textContent = fdi;
			}
		});
	},

	/**
	 * Retorna a configuração de rótulos e identificadores para dentes permanentes (CPO-D).
	 * @returns {Object} Configuração de mapeamento.
	 */
	obterConfiguracaoCPOD() {
		return {
			idC: 'c',
			idPE: 'p',
			idO: 'o',
			rotulos: {
				C: t.formularios?.componentes?.cariado ?? 'C',
				P: t.formularios?.componentes?.perdido ?? 'P',
				O: t.formularios?.componentes?.obturado ?? 'O',
			},
		};
	},

	/**
	 * Retorna a configuração de rótulos e identificadores para dentes decíduos (ceo-d).
	 * @returns {Object} Configuração de mapeamento.
	 */
	obterConfiguracaoCEOD() {
		return {
			idC: 'c',
			idPE: 'e',
			idO: 'o',
			rotulos: {
				C: t.formularios?.componentes?.c_deciduo ?? 'c',
				P: t.formularios?.componentes?.e_deciduo ?? 'e',
				O: t.formularios?.componentes?.o_deciduo ?? 'o',
			},
		};
	},

	/**
	 * Gerencia a importação e leitura do arquivo de planilha.
	 * Aciona o serviço de processamento e lida com o feedback de interface.
	 * * @param {File} file - Arquivo enviado pelo input file.
	 */
	async handleImport(file) {
		try {
			const tipoEnum = this.obterTipoEnum();

			const selectClassificacao = document.getElementById('selecao-classificacao');
			const classificacaoSelecionada = selectClassificacao ? selectClassificacao.value : 'fdi';

			let componenteAlvo = 'TODOS';
			if (this.estado.distribuicao === 'componente-c') componenteAlvo = COMPONENTES.CARIADO;
			if (this.estado.distribuicao === 'componente-p') componenteAlvo = COMPONENTES.PERDIDO;
			if (this.estado.distribuicao === 'componente-o') componenteAlvo = COMPONENTES.OBTURADO;

			const dados = await processarPlanilha(
				file,
				tipoEnum,
				classificacaoSelecionada,
				componenteAlvo,
			);

			console.log('Sucesso na importação:', dados);

			// TODO: Preencher os inputs da tela com os "dados" retornados
		} catch (erro) {
			UI.notificarErroPlanilha(erro.message);
		}
	},

	/**
	 * Determina o tipo de formulário a ser processado com base no estado atual.
	 * @returns {number} O identificador do enumerador TIPO_FORMULARIO.
	 */
	obterTipoEnum() {
		const { indice, distribuicao } = this.estado;
		const ehTotal = distribuicao === 'total';

		if (indice === 'cpo-d') {
			return ehTotal ? TIPO_FORMULARIO.CPOD_TOTAL : TIPO_FORMULARIO.CPOD_POR_COMPONENTE;
		}

		return ehTotal ? TIPO_FORMULARIO.CEOD_TOTAL : TIPO_FORMULARIO.CEOD_POR_COMPONENTE;
	},
};
