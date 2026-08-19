/**
 * Gerenciador de Zoom de Acessibilidade.
 * Aplica um scale() via classe CSS no body para contornar a limitação de zoom
 * nativo em layouts baseados em Viewport Width (vw).
 */
export class ZoomManager {
	/**
	 * Chave utilizada para persistência no LocalStorage.
	 * @type {string}
	 */
	static CHAVE_STORAGE = 'teethgram_zoom_ativo';

	/**
	 * Classe CSS aplicada ao body para disparar as regras de zoom/escala.
	 * @type {string}
	 */
	static CLASSE_ZOOM_ATIVO = 'zoom-ativo';

	/**
	 * Mapeamento dos estados possíveis de zoom.
	 * @readonly
	 * @type {Readonly<{ATIVO: string, INATIVO: string}>}
	 */
	static ESTADO_ZOOM = Object.freeze({
		ATIVO: 'true',
		INATIVO: 'false',
	});

	/**
	 * Inicializa o gerenciador carregando o estado salvo e configurando os ouvintes.
	 */
	static init() {
		this.carregarEstadoSalvo();
		this.configurarOuvinte();
	}

	/**
	 * Configura o ouvinte de eventos no checkbox/toggle de zoom do cabeçalho.
	 */
	static configurarOuvinte() {
		const elementoToggleZoom = document.getElementById('toggle-zoom');

		if (!elementoToggleZoom) return;

		elementoToggleZoom.addEventListener('change', (evento) => {
			this.setZoomAtivo(evento.target.checked);
		});
	}

	/**
	 * Persiste o estado do zoom no LocalStorage.
	 * @param {boolean} ativo - Flag indicando se o zoom está ativo.
	 */
	static persistirEstado(ativo) {
		const valorStorage = ativo ? this.ESTADO_ZOOM.ATIVO : this.ESTADO_ZOOM.INATIVO;
		localStorage.setItem(this.CHAVE_STORAGE, valorStorage);
	}

	/**
	 * Centraliza a validação e a aplicação da classe visual de zoom no DOM e UI.
	 * @param {boolean} ativo - Define se o zoom deve ser ativado ou desativado.
	 */
	static setZoomAtivo(ativo) {
		const ehAtivo = Boolean(ativo);

		document.body.classList.toggle(this.CLASSE_ZOOM_ATIVO, ehAtivo);
		this.persistirEstado(ehAtivo);

		const elementoToggleZoom = document.getElementById('toggle-zoom');
		if (elementoToggleZoom) {
			elementoToggleZoom.checked = ehAtivo;
		}
	}

	/**
	 * Verifica o LocalStorage ao carregar a página e aplica o zoom se salvo como ativo.
	 */
	static carregarEstadoSalvo() {
		const estadoSalvo = localStorage.getItem(this.CHAVE_STORAGE);
		const zoomAtivo = estadoSalvo === this.ESTADO_ZOOM.ATIVO;

		this.setZoomAtivo(zoomAtivo);
	}
}
