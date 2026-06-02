import { ViewManager } from '../ui/view-manager.js';
import { FormRenderer } from '../ui/form-renderer.js';
import { UI } from '../ui/ui-feedback.js';
import { processarPlanilha, TIPO_FORMULARIO } from '../services/planilha-service.js';
import { COMPONENTES } from '../services/dentes-service.js';

/**
 * Controlador responsável por orquestrar a interface do formulário e o fluxo de dados.
 * Atua estritamente como mediador (sem tocar diretamente no DOM).
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
		const elementoSelecaoIndice = document.getElementById('selecao-indice');
		const elementoSelecaoDistribuicao = document.getElementById('selecao-distribuicao');
		const elementoSelecaoClassificacao = document.getElementById('selecao-classificacao');

		if (elementoSelecaoIndice) {
			elementoSelecaoIndice.addEventListener('change', () => this.renderizar());
		}

		if (elementoSelecaoDistribuicao) {
			elementoSelecaoDistribuicao.addEventListener('change', () => this.renderizar());
		}

		if (elementoSelecaoClassificacao) {
			elementoSelecaoClassificacao.addEventListener('change', (evento) => {
				const sistemaAlvoSelecionado = evento.target.value;
				FormRenderer.atualizarSistemaNumeracao(sistemaAlvoSelecionado);
			});
		}
	},

	/**
	 * Renderiza a grade de dentes na tela com base nas opções selecionadas no filtro.
	 */
	renderizar() {
		const elementoSelecaoIndice = document.getElementById('selecao-indice');
		const elementoSelecaoDistribuicao = document.getElementById('selecao-distribuicao');
		const containerFormulario = document.getElementById('container-formulario');

		if (!elementoSelecaoIndice || !elementoSelecaoDistribuicao || !containerFormulario) {
			console.warn('FormController: Elementos base não encontrados para renderização.');
			return;
		}

		const valorIndiceAtual = elementoSelecaoIndice.value;
		const valorDistribuicaoAtual = elementoSelecaoDistribuicao.value;

		if ( this.estado.indice === valorIndiceAtual && this.estado.distribuicao === valorDistribuicaoAtual ) {
			return;
		}

		ViewManager.mudarTituloCard(valorIndiceAtual);
		FormRenderer.atualizarOpcoesDistribuicao(valorIndiceAtual);

		const quadrantesDoSistema = FormRenderer.obterQuadrantes(valorIndiceAtual);
		const ehDistribuicaoTotal = valorDistribuicaoAtual === 'total';

		let configuracaoComponentes = null;

		if (!ehDistribuicaoTotal) {
			configuracaoComponentes =
				valorIndiceAtual === 'cpo-d'
					? FormRenderer.obterConfiguracaoCPOD()
					: FormRenderer.obterConfiguracaoCEOD();
		}

		containerFormulario.innerHTML =
			FormRenderer.gerarEstruturaArcos( quadrantesDoSistema, configuracaoComponentes );

		this.estado = { indice: valorIndiceAtual, distribuicao: valorDistribuicaoAtual };

		const elementoSelecaoClassificacao = document.getElementById('selecao-classificacao');
		const sistemaAlvo = elementoSelecaoClassificacao ? elementoSelecaoClassificacao.value : 'fdi';

		FormRenderer.atualizarSistemaNumeracao(sistemaAlvo);
		FormRenderer.atualizarEstadoInputs(valorIndiceAtual, valorDistribuicaoAtual);
	},

	/**
	 * Gerencia a importação e leitura do arquivo de planilha.
	 * Aciona o serviço de processamento e lida com o feedback de interface.
	 * @param {File} file - Arquivo enviado pelo input file.
	 */
	async handleImport(file) {
		try {
			const tipoDeFormularioEnum = this.obterTipoEnum();
			const elementoSelecaoClassificacao = document.getElementById('selecao-classificacao');
			const classificacaoSelecionada = elementoSelecaoClassificacao
				? elementoSelecaoClassificacao.value
				: 'fdi';

			let componenteAlvoSelecionado = 'TODOS';

			if (this.estado.distribuicao === 'componente-c') {
				componenteAlvoSelecionado = COMPONENTES.CARIADO;
			} else if (this.estado.distribuicao === 'componente-p') {
				componenteAlvoSelecionado = COMPONENTES.PERDIDO;
			} else if (this.estado.distribuicao === 'componente-o') {
				componenteAlvoSelecionado = COMPONENTES.OBTURADO;
			}

			const resultadoProcessamento = await processarPlanilha(
				file,
				tipoDeFormularioEnum,
				classificacaoSelecionada,
				componenteAlvoSelecionado,
			);

			this.preencherDadosNaTela(
				resultadoProcessamento.dados,
				resultadoProcessamento.totalParticipantes,
				componenteAlvoSelecionado,
				classificacaoSelecionada,
			);
		} catch (erroDeImportacao) {
			UI.notificarErroPlanilha(erroDeImportacao.message);
		}
	},

	/**
	 * Distribui os dados processados da planilha para os respectivos inputs do HTML.
	 * @param {Map} dadosMap - O mapa contendo os dentes e seus valores.
	 * @param {number} totalParticipantes - O número total de pacientes lido da planilha.
	 * @param {string} componenteAlvo - Indica se estamos preenchendo TODOS ou um específico.
	 * @param {string} classificacaoSelecionada - O sistema de numeração alvo (ex: 'fdi' ou 'ada').
	 */
	preencherDadosNaTela(dadosMap, totalParticipantes, componenteAlvo, classificacaoSelecionada) {
		const inputTotalParticipantes = document.getElementById('total-participantes');

		if (inputTotalParticipantes) {
			inputTotalParticipantes.value = totalParticipantes;
		}

		const ehDistribuicaoTotal = this.estado.distribuicao === 'total';
		const configuracaoComponentes =
			this.estado.indice === 'cpo-d'
				? FormRenderer.obterConfiguracaoCPOD()
				: FormRenderer.obterConfiguracaoCEOD();

		dadosMap.forEach((valorExtraido, chaveDoDente) => {
			if (ehDistribuicaoTotal) {
				FormRenderer.injetarValorNoInput(
					chaveDoDente,
					'total',
					valorExtraido,
					classificacaoSelecionada,
				);
			} else if (componenteAlvo === 'TODOS') {
				FormRenderer.injetarValorNoInput(
					chaveDoDente,
					configuracaoComponentes.idC,
					valorExtraido.cariado,
					classificacaoSelecionada,
				);
				FormRenderer.injetarValorNoInput(
					chaveDoDente,
					configuracaoComponentes.idPE,
					valorExtraido.perdido,
					classificacaoSelecionada,
				);
				FormRenderer.injetarValorNoInput(
					chaveDoDente,
					configuracaoComponentes.idO,
					valorExtraido.obturado,
					classificacaoSelecionada,
				);
			} else {
				const mapaDeSufixos = {
					[COMPONENTES.CARIADO]: configuracaoComponentes.idC,
					[COMPONENTES.PERDIDO]: configuracaoComponentes.idPE,
					[COMPONENTES.OBTURADO]: configuracaoComponentes.idO,
				};

				const sufixoDoInput = mapaDeSufixos[componenteAlvo] || '';
				FormRenderer.injetarValorNoInput(
					chaveDoDente,
					sufixoDoInput,
					valorExtraido,
					classificacaoSelecionada,
				);
			}
		});
	},

	/**
	 * Determina o tipo de formulário a ser processado com base no estado atual.
	 * @returns {number} O identificador numérico do enumerador TIPO_FORMULARIO.
	 */
	obterTipoEnum() {
		const { indice, distribuicao } = this.estado;
		const ehDistribuicaoTotal = distribuicao === 'total';

		if (indice === 'cpo-d') {
			return ehDistribuicaoTotal ? TIPO_FORMULARIO.CPOD_TOTAL : TIPO_FORMULARIO.CPOD_POR_COMPONENTE;
		}

		return ehDistribuicaoTotal ? TIPO_FORMULARIO.CEOD_TOTAL : TIPO_FORMULARIO.CEOD_POR_COMPONENTE;
	},
};
