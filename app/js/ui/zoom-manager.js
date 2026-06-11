/**
 * Gerenciador de Zoom de Acessibilidade.
 * Aplica um scale() via classe CSS para contornar a limitação de zoom
 * nativo em layouts baseados em Viewport Width (vw).
 */
export const ZoomManager = {
	CHAVE_STORAGE: 'teethgram_zoom_ativo',

	init() {
		this.aplicarEstadoSalvo();
		this.configurarOuvinte();
	},

	/**
	 * Verifica o localStorage ao carregar a página e aplica o zoom se necessário.
	 */
	aplicarEstadoSalvo() {
		const isZoomSalvo = localStorage.getItem(this.CHAVE_STORAGE) === 'true';
		const elementoToggleZoom = document.getElementById('toggle-zoom');

		if (isZoomSalvo) {
			document.body.classList.add('zoom-ativo');
			if (elementoToggleZoom) {
				elementoToggleZoom.checked = true;
			}
		}
	},

	configurarOuvinte() {
		const elementoToggleZoom = document.getElementById('toggle-zoom');

		if (!elementoToggleZoom) return;

		elementoToggleZoom.addEventListener('change', (evento) => {
			const isZoomAtivo = evento.target.checked;

			if (isZoomAtivo) {
				document.body.classList.add('zoom-ativo');
				localStorage.setItem(this.CHAVE_STORAGE, 'true');
			} else {
				document.body.classList.remove('zoom-ativo');
				localStorage.setItem(this.CHAVE_STORAGE, 'false');
			}
		});
	},
};
