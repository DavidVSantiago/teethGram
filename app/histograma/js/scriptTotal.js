class HistogramTotal {
  constructor(parent, dataSerie, dataLabel, position, distribuicao) {
    // Dados do gráfico
    this._dataSerie = dataSerie; // Array de valores numéricos
    this._dataLabel = dataLabel; // Array com os rótulos
    
    // TODO - gambiarra para resolver poblema nos labels - corrigir depois
    if(position==="bottom"){
      this._dataLabel.reverse();
    }

    this.position = position; // Posição do gráfico: normal ou invertido
    this._distribuicao = distribuicao; // Tipo de visualização:  "media" ou "percentual"

    // Container principal do gráfico
    this._container = document.createElement("div");
    this._container.classList.add("container");
    parent.appendChild(this._container);
  }
  // Método principal que gera o histograma
  generateHistogramTotal() {
    this._container.innerHTML = ""; // Limpa o contéudo anterior
    let maxDataSerieValue = this.findMax(this._dataSerie); // Encontra o maior valor da série
    ///////////////////// Cria e organiza as áreas visuais gráficas /////////////////////
    // Criação das areas
    const areaX = document.createElement("div");
    const areaY = document.createElement("div");
    const areaA = document.createElement("div");
    const areaB = document.createElement("div");
    const areaC = document.createElement("div");
    const areaD = document.createElement("div");

    // Atribuição de class para cada area
    areaX.classList.add("area-x");
    this._container.appendChild(areaX);

    areaY.classList.add("area-y");
    this._container.appendChild(areaY);

    areaA.classList.add("area-a");
    this._container.appendChild(areaA);

    areaB.classList.add("area-b");
    this._container.appendChild(areaB);

    areaC.classList.add("area-c");
    this._container.appendChild(areaC);

    areaD.classList.add("area-d");
    this._container.appendChild(areaD);

    ///////////////////// Cria a régua lateral com valores numéricos  /////////////////////

    const sideBar = document.createElement("div");
    sideBar.classList.add("side-bar");

    // Cria texto da régua
    const ruleText = document.createElement("div");
    ruleText.classList.add("rule-text");
    const text = document.createElement("p");

    // Definindo o conteúdo do texto com base no valor da variável _distribuicao
    text.innerHTML = this._distribuicao === "media" ? "Média" : "Percentual";

    // Adiciona o texto criado ao container ruleText
    ruleText.appendChild(text);

    // Adiciona o container da régua lateral (com o texto) à area 'sideBar'
    sideBar.appendChild(ruleText);

    /////

    // Cria régua numérica
    const ruleBar = document.createElement("div");
    ruleBar.classList.add("rule-bar");

    const step = maxDataSerieValue / 4; // Calcula o tamanho de cada intervalo dividindo o valor máximo em 4 partes iguais

    // Gera um array com os valores da régua: valor máximo, 3/4, 2/4, 1/4 e 0
    const ruleValues = [maxDataSerieValue, step * 3, step * 2, step, 0].map(
      (value) => parseFloat(value.toFixed(2)) // Arredonda cada valor para duas casas decimais
    );

    // Cria um elemento <span> para cada valor e o adiciona à barra da régua
    for (let i = 0; i < ruleValues.length; i++) {
      const ruleBarItem = document.createElement("span");
      ruleBarItem.classList.add("rule-bar-item");
      ruleBarItem.textContent = `${ruleValues[i]}-`; // Exibe o valor formatado
      ruleBar.appendChild(ruleBarItem);
    }

    // Adiciona a régua numérica ao sidebar e, em seguida, ao container da área A
    sideBar.appendChild(ruleBar);
    areaA.appendChild(sideBar);

    ///////////////////// Cria o gráfico  /////////////////////

    // Container que contém as barras do histograma
    const content = document.createElement("div");
    content.classList.add("data-content");

    //Define o layout em grade, com uma coluna por rótulo
    content.style.gridTemplateColumns = `repeat(${this._dataLabel.length}, auto)`;

    // Loop de criação de cada barra do histograma
    for (let i = 0; i < this._dataLabel.length; i++) {
      // Cria o contêiner individual da barra
      const bar = document.createElement("div");
      bar.classList.add("bar");

      // Cria o elemento que representa o preenchimento da barra
      const valueBar = document.createElement("span");
      valueBar.classList.add("value-bar");

      // Ajusta a altura da barra proporcionalmente ao valor em dataSerie
      // (valor atual / valor máximo) * 100 para converter em porcentagem
      valueBar.style.height = `${
        (this._dataSerie[i] / maxDataSerieValue) * 100
      }%`;

      // Insere o segmento preenchido dentro do contêiner da barra
      bar.appendChild(valueBar);

      // Adiciona a barra completa ao contêiner principal do gráfico
      content.appendChild(bar);
    }

    // Insere todo o conjunto de barras na área designada do layout (areaB)
    areaB.appendChild(content);

    ///////////////////// Cria os rótulos  /////////////////////

    // Cria o container para os rótulos abaixo das barras do gráfico
    const contentLabel = document.createElement("div");
    contentLabel.classList.add("label-content");

    // Define o layout de colunas do conteúdo de rótulos, com uma coluna por rótulo de barra
    contentLabel.style.gridTemplateColumns = `repeat(${this._dataLabel.length}, 1fr)`;

    // Loop para criar os rótulos das barras
    for (let i = 0; i < this._dataLabel.length; i++) {
      // Cria o contêiner individual do rótulo
      const barLabel = document.createElement("span");
      barLabel.classList.add("bar-label");

      barLabel.textContent = `${this._dataLabel[i]}`; // Define o texto do rótulo com o valor de dataLabel

      contentLabel.appendChild(barLabel); // Adiciona o rótulo ao container de rótulos
    }

    areaD.appendChild(contentLabel); // Adiciona o container de rótulos na área D do gráfico

    ///////////////////// Cria barras de legenda  /////////////////////

    // Loop para criar as barras de legendas
    for (let i = 0; i < this._dataLabel.length; i++) {
      // Cria um contêiner para a legenda de cada coluna
      const captionBar = document.createElement("div");
      captionBar.classList.add("caption-bar");

      // Cria o elemento <span> que exibirá o valor da coluna
      const legendaC = document.createElement("span");
      legendaC.classList.add("legendaTotal");
      legendaC.innerHTML = `${this._dataSerie[i].toFixed(2)}`; // Insere o valor numérico com 2 casas decimais

      captionBar.appendChild(legendaC);

      areaY.style.gridTemplateColumns = `repeat(${this._dataLabel.length}, auto)`; // Define o número de colunas da área Y (uma para cada label)
      areaY.appendChild(captionBar); // Adiciona a legenda completa na área do gráfico
    }

    // Condicional utilizando operador ternário para adicionar classes baseadas na posição
    this.position === "bottom"
      ? (this._container.classList.add("inverted-container"),
        ruleBar.classList.add("inverted-rule-bar"))
      : null;
  }
  // Função responsável por encontrar o maior valor dentro do array de dados (dataSerie)
  findMax() {
    // Converte o primeiro valor da série para número de ponto flutuante e o define como o valor inicial máximo
    let max = parseFloat(this._dataSerie[0]);

    // Itera sobre os demais elementos do array, começando do índice 1
    for (let i = 1; i < this._dataSerie.length; i++) {
      // Converte o valor atual para float e compara com o valor máximo atual
      if (parseFloat(this._dataSerie[i]) > max) {
        max = parseFloat(this._dataSerie[i]); // Atualiza a variável max se o valor atual for maior
      }
    }

    return max; // Retorna o maior valor encontrado na série
  }
}


