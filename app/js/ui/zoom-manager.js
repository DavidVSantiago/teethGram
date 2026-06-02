/**
 * Gerenciador de Zoom de Acessibilidade.
 * Aplica um scale() via classe CSS para contornar a limitação de zoom
 * nativo em layouts baseados em Viewport Width (vw).
 */
export const ZoomManager = {
	init() {
		this.configurarOuvinte();
	},

	configurarOuvinte() {
		const elementoToggleZoom = document.getElementById('toggle-zoom');

		if (!elementoToggleZoom) return;

		elementoToggleZoom.addEventListener('change', (evento) => {
			const isZoomAtivo = evento.target.checked;

			if (isZoomAtivo) {
				document.body.classList.add('zoom-ativo');
			} else {
				document.body.classList.remove('zoom-ativo');
			}
		});
	},
};
