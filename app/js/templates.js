/*
============================================================================
  TEMPLATES PARA A VISUALIZAÇÃO DE ÍNDICE TOTAL
============================================================================
*/

/**
 * Cria o HTML para um único dente na visualização detalhada.
 * @param {string | number} toothId - O identificador do dente.
 * @returns {string} Uma string HTML do input do dente.
 */
function createToothInputHTML(toothId) {
	return `
    <div class="tooth" id="tooth-${toothId}">
      <div class="label-content">
        <label for="tooth-${toothId}-total" class="tooth-number">${toothId}</label>
      </div>
      <input class="tooth-input" type="number" id="tooth-${toothId}-total" name="tooth-${toothId}-total" min="0" maxlength="6" inputmode="numeric" />
    </div>
  `;
}

/**
 * Gera o HTML para um lado de um quadrante.
 * @param {Array<string | number>} toothIds - Um array com os IDs dos dentes.
 * @returns {string} Uma string HTML com todos os inputs de dentes.
 */
function generateQuadrantSideHTML(toothIds) {
	return toothIds.map(createToothInputHTML).join('');
}

/**
 * Constrói o HTML completo para a visualização da arcada detalhada.
 * @param {object} config - O objeto de configuração para a arcada atual.
 * @returns {string} O HTML completo da arcada.
 */
export function buildTotalArchHTML(config) {
	const topArchHTML = `
    <div id="top-arch" class="teeth-group">
      <h4>Superiores</h4>
      <div class="labels-row"><p>Direito</p><p>Esquerdo</p></div>
      <div class="teeth-row">
        <div class="teeth-col">${generateQuadrantSideHTML(
					config.topRight
				)}</div>
        <div class="teeth-col">${generateQuadrantSideHTML(config.topLeft)}</div>
      </div>
    </div>
  `;

	const downArchHTML = `
    <div id="down-arch" class="teeth-group">
      <h4>Inferiores</h4>
      <div class="labels-row"><p>Direito</p><p>Esquerdo</p></div>
      <div class="teeth-row">
        <div class="teeth-col">${generateQuadrantSideHTML(
					config.downRight
				)}</div>
        <div class="teeth-col">${generateQuadrantSideHTML(
					config.downLeft
				)}</div>
      </div>
    </div>
  `;

	return topArchHTML + downArchHTML;
}

/*
============================================================================
  TEMPLATES PARA A VISUALIZAÇÃO DE ÍNDICE TOTAL POR COMPONENTE
============================================================================
*/

/**
 * Cria o HTML para um único dente na visualização "Total por Componente".
 * @param {string | number} toothId - O identificador do dente.
 * @returns {string} Uma string HTML do bloco CPO para o dente.
 */
function createToothCPO_HTML(toothId) {
	const safeId = String(toothId).replace('-', '_');
	return `
    <div class="tooth-component" id="tooth-${toothId}">
      <h3 class="tooth-header">${toothId}</h3>

      <div class="tooth-body">
        <div class="box">
          <input class="component-input" type="number" id="c-${toothId}" name="c-${toothId}" min="0" maxlength="3" />
        </div>
        <div class="box">
          <input class="component-input" type="number" id="p-${toothId}" name="p-${toothId}" min="0" maxlength="3" inputmode="numeric" />
        </div>
        <div class="box">
          <input class="component-input" type="number" id="o-${toothId}" name="o-${toothId}" min="0" maxlength="3" inputmode="numeric" />
        </div>
      </div>

      <div class="tooth-footer">
        <label for="c-${toothId}">C</label>
        <label for="p-${toothId}">P</label>
        <label for="o-${toothId}">O</label>
      </div>
    </div>
  `;
}

/**
 * Gera o HTML para um lado do quadrante com blocos CPO.
 * @param {Array<string|number>} toothIds - Array com os IDs dos dentes.
 * @returns {string} Uma string HTML com todos os blocos CPO.
 */
function generateCPOSideHTML(toothIds) {
	return toothIds.map(createToothCPO_HTML).join('');
}

/**
 * Constrói o HTML completo para a visualização "Total por Componente".
 * @param {object} config - O objeto de configuração para a arcada atual.
 * @returns {string} O HTML completo da arcada por componente.
 */
export function buildComponentViewHTML(config) {
	const topArchHTML = `
    <div id="top-arch" class="teeth-group">
      <h4>Superiores</h4>
      <div class="labels-row"><p>Direito</p><p>Esquerdo</p></div>
      <div class="teeth-row">
        <div class="teeth-col">${generateCPOSideHTML(config.topRight)}</div>
        <div class="teeth-col">${generateCPOSideHTML(config.topLeft)}</div>
      </div>
    </div>
  `;

	const downArchHTML = `
    <div id="down-arch" class="teeth-group">
      <h4>Inferiores</h4>
      <div class="labels-row"><p>Direito</p><p>Esquerdo</p></div>
      <div class="teeth-row">
        <div class="teeth-col">${generateCPOSideHTML(config.downRight)}</div>
        <div class="teeth-col">${generateCPOSideHTML(config.downLeft)}</div>
      </div>
    </div>
  `;

	return topArchHTML + downArchHTML;
}
