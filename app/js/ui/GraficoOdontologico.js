import { DentesService } from '../services/DentesService.js';
import { t } from '../I18nManager.js';

/**
 * Renderiza o Gráfico Odontológico (CPO-D / ceod) em HTML5 Canvas.
 * Suporta as classificações FDI e ADA e diferentes distribuições visuais (C, P, O, Total).
 * Suporta renderização responsiva adaptando-se a unidades relativas.
 */
export class GraficoOdontologico {
	/**
	 * Inicializa a instância do gráfico com dimensão lógica base de 800x800.
	 * @param {string} seletorCanvas - Seletor CSS do elemento <canvas> (ex: '#drawing').
	 */
	constructor(seletorCanvas) {
		this.seletorCanvas = seletorCanvas;
		this.larguraBase = 800;
		this.alturaBase = 800;
		this.cores = ['#ff6360', '#68b766', '#6261fb', '#52525B']; // C, P, O, Total
		this.canvas = null;
		this.contexto = null;
		this.conectarCanvas();
	}

	/**
	 * Conecta ou reconecta a referência do elemento Canvas e seu contexto 2D.
	 */
	conectarCanvas() {
		if (!this.canvas || !this.canvas.isConnected) {
			this.canvas = document.querySelector(this.seletorCanvas);
			if (this.canvas) {
				this.contexto = this.canvas.getContext('2d');
			}
		}
	}

	/**
	 * Sincroniza a resolução interna do Canvas com a dimensão real renderizada no DOM.
	 */
	ajustarEscala() {
		if (!this.canvas) return;
		const dpr = window.devicePixelRatio || 1;
		const rect = this.canvas.getBoundingClientRect();
		const largura = rect.width || this.larguraBase;
		const altura = rect.height || largura;

		this.canvas.width = Math.round(largura * dpr);
		this.canvas.height = Math.round(altura * dpr);

		// Reseta transformações anteriores antes de aplicar a nova escala proporcional
		this.contexto.setTransform(1, 0, 0, 1, 0, 0);
		this.contexto.scale(this.canvas.width / this.larguraBase, this.canvas.height / this.alturaBase);
	}

	/**
	 * Formata valores numéricos para exibição no padrão brasileiro (,).
	 * @param {number} valor - Valor a ser formatado.
	 * @param {boolean} mostrarPorcentagem - Se exibe formato com 1 casa decimal.
	 * @returns {string} String formatada.
	 */
	formatarNumero(valor, mostrarPorcentagem) {
		const num = isNaN(valor) ? 0 : valor;
		const texto = mostrarPorcentagem ? (Number.isInteger(num) ? num : num.toFixed(1)) : Number.isInteger(num) ? num : num.toFixed(2);
		return String(texto).replace('.', ',');
	}

	/**
	 * Converte os dados brutos dos dentes em um Array ordenado por anatomia dental.
	 * @param {Object|Array} dados - Dados brutos dos dentes.
	 * @param {boolean} ehInferior - Indica se pertence à arcada inferior.
	 * @param {Object} [config={}] - Configurações completas do gráfico.
	 * @returns {Array<{label: string, values: number[]}>} Array estruturado e ordenado.
	 */
	transformarDados(dados, ehInferior, config = {}) {
		if (!dados || Array.isArray(dados)) return dados || [];
		const entradas = Object.entries(dados);
		if (!entradas.length) return [];

		const rawIndice = String(config.indice || '').toLowerCase();
		const ehDeciduo = config.ehDeciduo || ['ceo-d', 'ceod', 'dmtf'].includes(rawIndice);

		const mapa = ehDeciduo ? DentesService.MAPA_CONVERSAO.DECIDUO : DentesService.MAPA_CONVERSAO.PERMANENTE;
		const ehADA = config.classificacao === 'ADA';

		const extrair = (quad, inv) => {
			const ent = Object.entries(quad);
			if (inv) ent.reverse();
			return ent.map(([ada, fdi]) =>
				String(ehADA ? ada : fdi)
					.trim()
					.toUpperCase(),
			);
		};

		const ordem = ehInferior
			? [...extrair(mapa.inferiorDireito, true), ...extrair(mapa.inferiorEsquerdo, true)]
			: [...extrair(mapa.superiorDireito, false), ...extrair(mapa.superiorEsquerdo, false)];

		entradas.sort((a, b) => {
			const chaveA = String(a[0]).trim().toUpperCase();
			const chaveB = String(b[0]).trim().toUpperCase();

			const posA = ordem.indexOf(chaveA);
			const posB = ordem.indexOf(chaveB);
			return (posA === -1 ? 99 : posA) - (posB === -1 ? 99 : posB);
		});

		return entradas.map(([dente, c]) => ({
			label: dente,
			values: [c.c || 0, c.p !== undefined ? c.p : c.e || 0, c.o || 0],
		}));
	}

	/**
	 * Calcula a Média ou Porcentagem dos componentes (C, P, O) por dente.
	 * @param {number[]} values - Contagens absolutas [C, P, O].
	 * @param {Object} config - Configurações do gráfico.
	 * @param {number} totalGeral - Soma acumulada de todos os componentes da amostra.
	 * @returns {number[]} Array com valores calculados [C, P, O].
	 */
	calcularValores(values, config, totalGeral) {
		const [c, p, o] = values;
		if (config.mostrarPorcentagem) {
			const div = totalGeral > 0 ? totalGeral : 1;
			return [(c / div) * 100, (p / div) * 100, (o / div) * 100];
		}
		const part = config.totalParticipantes || 1;
		return [c / part, p / part, o / part];
	}

	/**
	 * Obtém o maior valor de uma arcada para definir o topo (teto) do eixo Y.
	 * @param {Array} dados - Dados da arcada.
	 * @param {Object} config - Configurações de filtro e exibição.
	 * @param {number} totalGeral - Total geral acumulado.
	 * @returns {number} Valor máximo da escala.
	 */
	obterMaiorValor(dados, config, totalGeral) {
		const dist = String(config.distribuicao || '')
			.toLowerCase()
			.replace(/_/g, '');
		let maior = 0;

		dados.forEach((d) => {
			const [vC, vP, vO] = this.calcularValores(d.values, config, totalGeral);
			let val = vC + vP + vO;
			if (dist === 'c') val = vC;
			else if (dist === 'p' || dist === 'e') val = vP;
			else if (dist === 'o') val = vO;

			if (val > maior) maior = val;
		});

		return maior > 0 ? maior : 1;
	}

	/**
	 * Desenha o título principal e o tamanho da amostra no topo do gráfico.
	 * @param {Object} config - Configuração global contendo parâmetros do relatório.
	 */
	desenharCabecalho(config) {
		const rawIndice = String(config.indice || '').toLowerCase();
		const ehDeciduo = config.ehDeciduo || ['ceo-d', 'ceod', 'dmtf'].includes(rawIndice);
		const titulo = ehDeciduo ? t?.principal?.tituloDeciduos : t?.principal?.tituloPermanentes;

		if (titulo) {
			this.contexto.font = 'bold 24px Arial';
			this.contexto.fillStyle = '#000';
			this.contexto.textAlign = 'center';
			this.contexto.fillText(titulo, 400, 40);
		}

		if (config.totalParticipantes) {
			this.contexto.font = 'italic 13px Arial';
			this.contexto.fillStyle = '#4B5563';
			const labelAmostra = t?.filtros?.rotuloTotalParticipantes || 'Participantes';
			this.contexto.fillText(`${labelAmostra}: n = ${config.totalParticipantes}`, 400, 65);
		}
	}

	/**
	 * Desenha um retângulo arredondado com texto centralizado (caixas numéricas).
	 * @param {number} x - Posição X.
	 * @param {number} y - Posição Y.
	 * @param {number} larg - Largura da caixa.
	 * @param {number} alt - Altura da caixa.
	 * @param {string} cor - Cor de fundo em formato Hex/RGB.
	 * @param {string} texto - Conteúdo do texto.
	 */
	desenharCaixaTexto(x, y, larg, alt, cor, texto) {
		this.contexto.fillStyle = cor;
		this.contexto.beginPath();
		if (typeof this.contexto.roundRect === 'function') {
			this.contexto.roundRect(x, y, larg, alt, 3);
		} else {
			this.contexto.rect(x, y, larg, alt);
		}
		this.contexto.fill();

		this.contexto.font = 'bold 11px Arial';
		this.contexto.fillStyle = '#FFF';
		this.contexto.textAlign = 'center';
		this.contexto.textBaseline = 'middle';
		this.contexto.fillText(texto, x + larg / 2, y + alt / 2);
	}

	/**
	 * Método principal que coordena a limpeza, cálculo e renderização de todo o gráfico.
	 * @param {Object} dadosSupBrutos - Dados brutos da arcada superior.
	 * @param {Object} dadosInfBrutos - Dados brutos da arcada inferior.
	 * @param {Object} [config={}] - Configurações injetadas pelo formulário/filtro.
	 */
	renderizar(dadosSupBrutos, dadosInfBrutos, config = {}) {
		this.conectarCanvas();
		if (!this.contexto) return;

		this.ajustarEscala();
		this.contexto.fillStyle = '#FFFFFF';
		this.contexto.fillRect(0, 0, this.larguraBase, this.alturaBase);

		const dadosSup = this.transformarDados(dadosSupBrutos, false, config);
		const dadosInf = this.transformarDados(dadosInfBrutos, true, config);

		let totalGeral = 0;
		[...dadosSup, ...dadosInf].forEach((d) => {
			totalGeral += d.values[0] + d.values[1] + d.values[2];
		});

		const maxSup = this.obterMaiorValor(dadosSup, config, totalGeral);
		const maxInf = this.obterMaiorValor(dadosInf, config, totalGeral);

		this.desenharCabecalho(config);

		// Rótulo Eixo Y Rotacionado (Centralizado na altura inteira do gráfico)
		const rotuloY = config.mostrarPorcentagem ? t?.processamento?.percentual : t?.processamento?.media;
		if (rotuloY) {
			this.contexto.save();
			this.contexto.translate(40, 395);
			this.contexto.rotate(-Math.PI / 2);
			this.contexto.font = 'bold 16px Arial';
			this.contexto.fillStyle = '#000';
			this.contexto.textAlign = 'center';
			this.contexto.fillText(rotuloY, 0, 0);
			this.contexto.restore();
		}

		// Eixo X Central
		this.contexto.font = 'bold 15px Arial';
		this.contexto.fillStyle = '#111827';
		this.contexto.textAlign = 'center';
		this.contexto.textBaseline = 'middle';
		this.contexto.fillText(t?.geracao?.rotuloEixoXCentral || 'Número do dente no arco', 400, 395);

		// Renderizar Arcadas
		if (dadosSup.length) {
			this.desenharArcada(dadosSup, maxSup, { posX: 80, posY: 165, baseY: 345, ehInf: false }, config, totalGeral);
		}
		if (dadosInf.length) {
			this.desenharArcada(dadosInf, maxInf, { posX: 80, posY: 455, baseY: 635, ehInf: true }, config, totalGeral);
		}

		this.desenharLegenda(config);
	}

	/**
	 * Renderiza uma arcada completa (barras, eixo Y, réguas e rótulos numéricos).
	 * @param {Array} dados - Dados estruturados da arcada.
	 * @param {number} maxVal - Valor máximo para cálculo de escala.
	 * @param {Object} pos - Coordenadas físicas { posX, posY, baseY, ehInf }.
	 * @param {Object} config - Configurações globais de exibição.
	 * @param {number} totalGeral - Soma acumulada dos componentes.
	 */
	desenharArcada(dados, maxVal, pos, config, totalGeral) {
		const { posX, posY, baseY, ehInf } = pos;
		const escalaY = (baseY - posY) / (maxVal || 1);
		const largUtil = this.larguraBase - posX - 70;
		const largEspaco = largUtil / dados.length;
		const largBarra = largEspaco * 0.85;
		const espacamento = largEspaco * 0.15;
		const dist = String(config.distribuicao || '')
			.toLowerCase()
			.replace(/_/g, '');
		const ehEmpilhado = dist.includes('totalcomponente');

		// Eixo Y e Réguas
		this.contexto.beginPath();
		this.contexto.strokeStyle = '#000';
		this.contexto.moveTo(posX - 8, posY);
		this.contexto.lineTo(posX - 8, baseY);
		this.contexto.stroke();

		for (let i = 0; i <= 4; i++) {
			const rot = (maxVal / 4) * i;
			const coordY = !ehInf ? baseY - rot * escalaY : posY + rot * escalaY;
			this.contexto.font = '11px Arial';
			this.contexto.fillStyle = '#000';
			this.contexto.textAlign = 'right';
			this.contexto.textBaseline = 'middle';
			this.contexto.fillText(this.formatarNumero(rot, config.mostrarPorcentagem), posX - 12, coordY);

			// Risquinho da régua do Eixo Y
			this.contexto.beginPath();
			this.contexto.moveTo(posX - 10, coordY);
			this.contexto.lineTo(posX - 6, coordY);
			this.contexto.stroke();
		}

		// Desenhar Barras e Rótulos dos Dentes
		dados.forEach((dado, i) => {
			const x = posX + i * (largBarra + espacamento);
			let y = !ehInf ? baseY : posY;
			const vals = this.calcularValores(dado.values, config, totalGeral);

			if (ehEmpilhado) {
				[0, 1, 2].forEach((idx) => {
					if (vals[idx] > 0) {
						const h = vals[idx] * escalaY;
						if (!ehInf) y -= h;
						this.contexto.fillStyle = this.cores[idx];
						this.contexto.fillRect(x, y, largBarra, h);
						if (ehInf) y += h;
					}
				});

				const ordemCaixas = ehInf ? [0, 1, 2] : [2, 1, 0];
				ordemCaixas.forEach((idx, iter) => {
					const caixaY = ehInf ? baseY + 12 + iter * 22 : posY - 80 + iter * 22;
					this.desenharCaixaTexto(x, caixaY, largBarra, 19, this.cores[idx], this.formatarNumero(vals[idx], config.mostrarPorcentagem));
				});
			} else {
				let val = vals[0];
				let idxCor = 0;

				if (dist === 'p' || dist === 'e') {
					val = vals[1];
					idxCor = 1;
				} else if (dist === 'o') {
					val = vals[2];
					idxCor = 2;
				} else if (dist === 'total') {
					val = vals[0] + vals[1] + vals[2];
					idxCor = 3;
				}

				if (val > 0) {
					const h = val * escalaY;
					if (!ehInf) y -= h;
					this.contexto.fillStyle = this.cores[idxCor];
					this.contexto.fillRect(x, y, largBarra, h);
				}

				const caixaY = ehInf ? baseY + 12 : posY - 28;
				this.desenharCaixaTexto(x, caixaY, largBarra, 19, this.cores[idxCor], this.formatarNumero(val, config.mostrarPorcentagem));
			}

			// Rótulo do Dente
			this.contexto.font = 'bold 13px Arial';
			this.contexto.fillStyle = '#000';
			this.contexto.textAlign = 'center';
			this.contexto.textBaseline = 'top';
			this.contexto.fillText(dado.label, x + largBarra / 2, ehInf ? posY - 28 : baseY + 12);
		});
	}

	/**
	 * Renderiza a legenda informativa no rodapé do Canvas.
	 * @param {Object} config - Configurações dinâmicas de exibição.
	 */
	desenharLegenda(config) {
		const dist = String(config.distribuicao || '')
			.toLowerCase()
			.replace(/_/g, '');
		const comp = t?.filtros?.opcoes?.permanente || {};

		let itens = [];
		if (dist.includes('totalcomponente')) {
			itens = [
				{ t: comp.componenteC || 'Cariados', c: this.cores[0] },
				{ t: comp.componenteP || 'Perdidos', c: this.cores[1] },
				{ t: comp.componenteO || 'Obturados', c: this.cores[2] },
			];
		} else if (dist === 'c') itens = [{ t: comp.componenteC || 'Cariados', c: this.cores[0] }];
		else if (dist === 'p' || dist === 'e') itens = [{ t: comp.componenteP || 'Perdidos', c: this.cores[1] }];
		else if (dist === 'o') itens = [{ t: comp.componenteO || 'Obturados', c: this.cores[2] }];
		else if (dist === 'total') itens = [{ t: t?.filtros?.opcoes?.total || 'Total', c: this.cores[3] }];

		if (!itens.length) return;

		this.contexto.font = 'bold 18px Arial';
		this.contexto.fillStyle = '#111827';
		this.contexto.textAlign = 'center';
		this.contexto.textBaseline = 'middle';
		this.contexto.fillText(t?.geracao?.legenda || 'Legenda', 400, 742);

		this.contexto.font = 'bold 13px Arial';

		// Mapeia itens calculando a largura dos textos apenas uma vez
		const itensComLargura = itens.map((item) => ({
			...item,
			larguraTexto: this.contexto.measureText(item.t || '').width,
		}));

		const largTotal = itensComLargura.reduce((acc, item) => acc + 22 + item.larguraTexto, 0) + (itens.length - 1) * 30;
		let x = 400 - largTotal / 2;

		this.contexto.textAlign = 'left';
		this.contexto.textBaseline = 'middle';

		itensComLargura.forEach((item) => {
			this.contexto.fillStyle = item.c;
			this.contexto.fillRect(x, 765, 14, 14);
			this.contexto.fillStyle = '#111827';
			this.contexto.fillText(item.t || '', x + 22, 772);
			x += 22 + item.larguraTexto + 30;
		});
	}
}
