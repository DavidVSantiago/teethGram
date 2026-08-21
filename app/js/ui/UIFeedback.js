import { t } from '../I18nManager.js';

/**
 * Gerenciador de Feedback Visual e Modais da aplicação.
 * Centraliza alertas e interações imperativas com o usuário, isolando
 * a manipulação do DOM relacionada a avisos.
 */
export class UI {
	/**
	 * Referência para o listener ativo de teclado do modal.
	 * @type {Function|null}
	 * @private
	 */
	static _ouvinteTecladoAtivo = null;

	/**
	 * Escapa texto livre para uso seguro em blocos HTML internos, prevenindo vulnerabilidades XSS.
	 * @param {string|number} valor - O texto/conteúdo a ser sanitizado.
	 * @returns {string} String com entidades HTML codificadas.
	 */
	static escaparHtml(valor) {
		return String(valor ?? '')
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;');
	}

	/**
	 * Determina se uma mensagem já vem em formato HTML estruturado, sem necessidade de escaping.
	 * @param {string} mensagem - Texto do elemento a ser verificado.
	 * @returns {boolean} Retorna verdadeiro se contiver tags HTML conhecidas.
	 */
	static ehMensagemHtmlEstruturada(mensagem) {
		const texto = String(mensagem ?? '');
		return /<\/?(div|strong|p|ul|li|span|a|b|i)\b[^>]*>/i.test(texto);
	}

	/**
	 * Exibe um alerta no modal principal da interface e gerencia a trava de rolagem do body.
	 * @param {string} titulo - Título a ser exibido no cabeçalho do modal.
	 * @param {string} htmlConteudo - Conteúdo HTML estruturado para o corpo do modal.
	 */
	static exibirAlerta(titulo, htmlConteudo) {
		const modal = document.getElementById('janela-modal');
		const elementoTitulo = document.getElementById('modal-titulo');
		const elementoMensagem = document.getElementById('modal-mensagem');

		if (!modal || !elementoTitulo || !elementoMensagem) return;

		elementoTitulo.textContent = titulo;
		elementoMensagem.innerHTML = htmlConteudo;
		modal.style.display = 'flex';
		document.body.style.overflow = 'hidden';

		this._configurarEventosFechamento(modal);
	}

	/**
	 * Oculta o modal de feedback da interface e restaura a rolagem padrão da página.
	 */
	static fecharModal() {
		const modal = document.getElementById('janela-modal');

		if (modal) {
			modal.style.display = 'none';
		}
		document.body.style.overflow = 'auto';

		// Limpa ouvintes pendentes para evitar vazamento de memória
		if (this._ouvinteTecladoAtivo) {
			document.removeEventListener('keydown', this._ouvinteTecladoAtivo);
			this._ouvinteTecladoAtivo = null;
		}
	}

	/**
	 * Converte uma lista de mensagens de erro em HTML controlado para o modal.
	 * @param {Array<string>} listaErros - Vetor de mensagens de texto/HTML de erro.
	 * @returns {string} Markup HTML contendo a lista formatada.
	 */
	static formatarErrosParaHtml(listaErros) {
		const errosNormalizados =
			Array.isArray(listaErros) && listaErros.length > 0
				? listaErros
				: [t.modal?.erroDesconhecido ?? 'Erro desconhecido ao processar a planilha.'];

		const listaHtml = errosNormalizados
			.map((mensagemErro) => {
				const conteudoHtml = this.ehMensagemHtmlEstruturada(mensagemErro) ? String(mensagemErro) : this.escaparHtml(mensagemErro);

				return /* html */ `
          <li class="erro-item">
            <strong class="marcador-erro">•</strong> ${conteudoHtml}
          </li>
        `;
			})
			.join('');

		return /* html */ `
      <ul class="alerta-comparativo">
        ${listaHtml}
      </ul>
    `;
	}

	/**
	 * Notifica os erros de importação de planilha de forma organizada e legível.
	 * @param {Error & { code?: string, detalhes?: Array<string> }} erro - Objeto de erro estruturado.
	 */
	static notificarErroPlanilha(erro) {
		const mensagemBase = erro?.message ?? t.modal?.erroDesconhecido ?? 'Erro desconhecido ao processar a planilha.';
		const listaErros = Array.isArray(erro?.detalhes) && erro.detalhes.length > 0 ? erro.detalhes : [mensagemBase];

		const htmlEstruturado = /* html */ `
      <div class="modal-corpo">
        <p class="alerta-titulo">${t.modal?.inconsistencias ?? 'Inconsistências encontradas:'}</p>

        ${this.formatarErrosParaHtml(listaErros)}

        <div class="caixa-dica">
          <p class="alerta-dica">
            <strong>${t.modal?.dicaTitulo ?? 'Dica:'}</strong> ${t.modal?.dicaParticipantes ?? 'Verifique o total de participantes.'}
          </p>
        </div>
      </div>
    `;

		this.exibirAlerta(t.modal?.tituloErroImportacao ?? 'Erro na Importação', htmlEstruturado);
	}

	/**
	 * Configura os ouvintes de teclado e clique fora para facilitar o fechamento do modal.
	 * @param {HTMLElement} modal - Elemento do modal no DOM.
	 * @private
	 */
	static _configurarEventosFechamento(modal) {
		// Garante remoção de ouvinte anterior se houver
		if (this._ouvinteTecladoAtivo) {
			document.removeEventListener('keydown', this._ouvinteTecladoAtivo);
		}

		this._ouvinteTecladoAtivo = (evento) => {
			if (evento.key === 'Escape') {
				this.fecharModal();
			}
		};

		document.addEventListener('keydown', this._ouvinteTecladoAtivo);

		modal.onclick = (evento) => {
			if (evento.target === modal) {
				this.fecharModal();
			}
		};
	}

	/**
	 * Exibe o modal de feedback para erros de preenchimento no formulário da tela.
	 * @param {Array<{dente: string, motivo: string}>} erros - Lista de inconsistências encontradas.
	 */
	static notificarErroValidacaoFormulario(erros) {
		const listaErrosHtml = erros
			.map(
				(e) => `
        <li class="erro-item">
          <strong class="marcador-erro">•</strong> <strong>${this.escaparHtml(e.dente)}:</strong> ${this.escaparHtml(e.motivo)}
        </li>
      `,
			)
			.join('');

		const conteudoModal = `
      <div class="modal-corpo">
        <p class="alerta-titulo">${t.modal?.inconsistencias ?? 'Inconsistências encontradas:'}</p>
        <ul class="alerta-comparativo">
          ${listaErrosHtml}
        </ul>
        <div class="caixa-dica">
          <p class="alerta-dica">
            <strong>${t.modal?.dicaTitulo ?? 'Dica:'}</strong> ${t.modal?.dicaIncompleto ?? 'Preencha todos os campos antes de continuar.'}
          </p>
        </div>
      </div>
    `;

		this.exibirAlerta(t.modal?.tituloIncompleto ?? 'Informações Incompletas', conteudoModal);
	}
}
