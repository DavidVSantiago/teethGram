// Importa as funções que constroem o HTML de um arquivo separado.
import { buildTotalArchHTML, buildComponentViewHTML } from './templates.js';

// Elementos do DOM centralizados para fácil acesso e manutenção.
const elements = {
	index: document.getElementById('indexSelect'),
	distributionSelector: document.getElementById('distSelect'),
	classificationSelect: document.getElementById('toothClassificationSelect'),
	archContainer: document.getElementById('permanentTeethContainer'),
};

// Objeto de estado para gerenciar as escolhas do usuário.
const state = {
	index: 'cpo_d',
	distribution: 'total',
	classificationType: 'fdi',
};

// Objeto de configuração estático com os dados para cada tipo de arcada dentária.
const archRenderConfigs = {
	cpo_d: {
		fdi: {
			topRight: [18, 17, 16, 15, 14, 13, 12, 11],
			topLeft: [21, 22, 23, 24, 25, 26, 27, 28],
			downRight: [31, 32, 33, 34, 35, 36, 37, 38].reverse(),
			downLeft: [48, 47, 46, 45, 44, 43, 42, 41].reverse(),
		},
		ada: {
			topRight: Array.from({ length: 8 }, (_, i) => i + 1),
			topLeft: Array.from({ length: 8 }, (_, i) => i + 9),
			downRight: Array.from({ length: 8 }, (_, i) => i + 17),
			downLeft: Array.from({ length: 8 }, (_, i) => i + 25),
		},
	},
	ceo_d: {
		fdi: {
			topRight: [55, 54, 53, 52, 51],
			topLeft: [61, 62, 63, 64, 65],
			downRight: [71, 72, 73, 74, 75].reverse(),
			downLeft: [85, 84, 83, 82, 81].reverse(),
		},
		ada: {
			topRight: ['A', 'B', 'C', 'D', 'E'],
			topLeft: ['F', 'G', 'H', 'I', 'J'],
			downRight: ['K', 'L', 'M', 'N', 'O'],
			downLeft: ['T', 'S', 'R', 'Q', 'P'].reverse(),
		},
	},
};

/**
 * Função central que atualiza a interface do usuário.
 */
function updateUI() {
	const { index, distribution, classificationType } = state;
	const config = archRenderConfigs[index]?.[classificationType];

	if (config) {
		if (distribution === 'total') {
			// Pega o HTML do template e injeta no DOM.
			elements.archContainer.innerHTML = buildTotalArchHTML(config);
		} else {
			// Pega o HTML do outro template e injeta no DOM.
			elements.archContainer.innerHTML = buildComponentViewHTML(config);
		}
	} else {
		elements.archContainer.innerHTML = '<p>Configuração não encontrada.</p>';
		console.error(
			`Configuração não encontrada para: ${index}, ${classificationType}`
		);
	}
}

/*
============================================================================
  EVENT LISTENERS
============================================================================
*/

elements.index.addEventListener('change', event => {
	if (event.target.value != state.index) {
		state.index = event.target.value;
		updateUI();
	}
});

elements.distributionSelector.addEventListener('change', event => {
	const newValue = event.target.value;
	const oldValue = state.distribution;

	state.distribution = newValue;

	if ((newValue === 'total') !== (oldValue === 'total')) {
		updateUI();
	}
});

elements.classificationSelect.addEventListener('change', event => {
	if (event.target.value != state.classificationType) {
		state.classificationType = event.target.value;
		updateUI();
	}
});

/* ============================================================================
  INICIALIZAÇÃO
============================================================================
*/
updateUI();
