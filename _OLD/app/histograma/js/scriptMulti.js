class HistogramMulti {
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
  generateHistogramMulti() {
    this._container.innerHTML = ""; // Limpa o contéudo anterior

    let maxDataSerieValue = this.findMax(); // Encontra o maior valor da série

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

    ////////////////////////// GRÁFICO //////////////////////////
    const content = document.createElement("div");
    content.classList.add("data-content");
    content.style.gridTemplateColumns = `repeat(${this._dataLabel.length}, auto)`;

    for (let i = 0; i < this._dataLabel.length; i++) {
      const item = this._dataSerie[i];

      const bar = document.createElement("div");
      bar.classList.add("bar");

      const valueBar = document.createElement("div");
      valueBar.classList.add("value-bar-multi");

      const valueC = document.createElement("div");
      valueC.classList.add("valueC");
      valueC.style.height = `${(item.fieldC / maxDataSerieValue) * 100}%`;

      const valueP = document.createElement("div");
      valueP.classList.add("valueP");
      valueP.style.height = `${(item.fieldP / maxDataSerieValue) * 100}%`;

      const valueO = document.createElement("div");
      valueO.classList.add("valueO");
      valueO.style.height = `${(item.fieldO / maxDataSerieValue) * 100}%`;

      const soma = item.fieldC + item.fieldP + item.fieldO;
      valueBar.style.height = `${(soma / maxDataSerieValue) * 100}%`;

      valueBar.appendChild(valueO);
      valueBar.appendChild(valueP);
      valueBar.appendChild(valueC);
      bar.appendChild(valueBar);
      content.appendChild(bar);
    }

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

    // Cria as barras de legenda para cada item
    for (let i = 0; i < this._dataLabel.length; i++) {
      const item = this._dataSerie[i];

      // Contêiner da legenda para a coluna atual
      const captionBar = document.createElement("div");
      captionBar.classList.add("caption-bar");

      // Valor da coluna C
      const legendaC = document.createElement("span");
      legendaC.classList.add("legendaC");
      legendaC.innerHTML = `${item.fieldC.toFixed(2)}`;

      // Valor da coluna P
      const legendaP = document.createElement("span");
      legendaP.classList.add("legendaP");
      legendaP.innerHTML = `${item.fieldP.toFixed(2)}`;

      // Valor da coluna O
      const legendaO = document.createElement("span");
      legendaO.classList.add("legendaO");
      legendaO.innerHTML = `${item.fieldO.toFixed(2)}`;

      // Adiciona os valores ao contêiner
      captionBar.appendChild(legendaO);
      captionBar.appendChild(legendaP);
      captionBar.appendChild(legendaC);

      // Define as colunas da área Y conforme o número de labels
      areaY.style.gridTemplateColumns = `repeat(${this._dataLabel.length}, auto)`;

      // Adiciona a legenda ao gráfico
      areaY.appendChild(captionBar);
    }

    // Condicional utilizando operador ternário para adicionar classes baseadas na posição
    this.position === "bottom"
      ? (this._container.classList.add("inverted-container"),
        ruleBar.classList.add("inverted-rule-bar"))
      : null;
  }
  // Função responsável por encontrar o maior valor total (C + P + O) na série de dados
  findMax() {
    // Inicializa a variável max com 0, que será usada para armazenar o maior valor encontrado
    let max = 0;

    // Percorre todos os elementos da série de dados
    for (let i = 0; i < this._dataSerie.length; i++) {
      const item = this._dataSerie[i]; // Obtém o item atual (objeto com fieldC, fieldP, fieldO)

      const soma = item.fieldC + item.fieldP + item.fieldO; // Soma os três componentes do índice CPO-D

      // Verifica se a soma atual é maior que o valor máximo armazenado
      if (soma > max) {
        max = soma; // Atualiza o valor máximo
      }
    }
    return max; // Retorna o maior valor total encontrado na série
  }
}


