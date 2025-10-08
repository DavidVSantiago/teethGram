class TriData {
  constructor() {
    this.fieldC = "$";
    this.fieldP = "$";
    this.fieldO = "$";
    this.labelFieldC = "C";
    this.labelFieldP = "P";
    this.labelFieldO = "O";
  }
}

class Index {
  constructor(size) {
    this.dataList = new Array(size);
    this.triDataList = [];

    for (let i = 0; i < size; i++) {
      this.triDataList.push(new TriData());
    }
  }
  getDataList() {
    return this.dataList;
  }
  getIndexFdiList() {
    return this.indexFDI;
  }
  getIndexAdaList() {
    return this.indexADA;
  }

  setData(valor, index) {
    this.dataList[index] = parseFloat(valor);
  }
}

class CPO_D extends Index {
  constructor() {
    super(32);
    this.indexFdiList = [
      18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 38, 37,
      36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48,
    ];
    this.indexAdaList = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
    ];
  }
}

class CEO_D extends Index {
  constructor() {
    super(20);
    this.indexFdiList = [
      55, 54, 53, 52, 51, 61, 62, 63, 64, 65, 75, 74, 73, 72, 71, 81, 82, 83,
      84, 85,
    ];
    this.indexAdaList = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
    ];
  }
}


function updateLabel(value, typeName) {
  let labelsArray = getAllLabels();

  let teethIndex;

  if (typeName === "cpo") {
    teethIndex = new CPO_D();
  } else if (typeName === "ceo") {
    teethIndex = new CEO_D();
  }

  if (value === "fdi") {
    labelFDI(labelsArray, teethIndex);
  } else if (value === "ada") {
    labelADA(labelsArray, teethIndex);
  }
}

// respoável por add um novo valor ao label com os padrões fdi
function labelFDI(labelsArray, teethIndex) {
  for (let i = 0; i < teethIndex.dataList.length; i++) {
    labelsArray[i].textContent = teethIndex.indexFdiList[i];
  }
}

// respoável por add um novo valor ao label com os padrões ada
function labelADA(labelsArray, teethIndex) {
  for (let i = 0; i < teethIndex.dataList.length; i++) {
    labelsArray[i].textContent = teethIndex.indexAdaList[i];
  }
}

// função criar um array com todos os labels
function getAllLabels() {
  let labels = document.querySelectorAll(".label-name");

  return Array.from(labels);
}


const blockTopRight2 = document.getElementById("input-block-top-right");
const blockTopLeft2 = document.getElementById("input-block-top-left");
const blockBottomRight2 = document.getElementById("input-block-bottom-right");
const blockBottomLeft2 = document.getElementById("input-block-bottom-left");

function createInputsByIndexMultiple(typeName, radioEscolhido) {
  blockTopRight2.innerHTML = " ";
  blockTopLeft2.innerHTML = " ";
  blockBottomRight2.innerHTML = " ";
  blockBottomLeft2.innerHTML = " ";

  let indexInstance;

  if (typeName === "cpo") {
    indexInstance = new CPO_D();
  } else if (typeName === "ceo") {
    indexInstance = new CEO_D();
  }

  createInputs(indexInstance, radioEscolhido);
}

function createInputs(indexInstance, radioEscolhido) {
  const { dataList, triDataList } = indexInstance;

  for (let i = 0; i < dataList.length; i++) {
    const inputSection = document.createElement("div");
    inputSection.classList.add("input-mult");

    const inputTitle = document.createElement("div");
    inputTitle.classList.add("title-input-mult");
    inputTitle.classList.add("label-name");
    inputTitle.textContent = indexInstance.indexFdiList[i];
    inputSection.appendChild(inputTitle);

    const inputMultValues = document.createElement("div");
    inputMultValues.classList.add("mult-values");
    inputSection.appendChild(inputMultValues);

    createMultivaluedValues(inputMultValues, triDataList[i], radioEscolhido);

    // divição dos inputs por grupos (Superior e Inferior)
    if (i < dataList.length / 2) {
      var dataListNumber = dataList.length / 2 / 2;

      if (i < dataListNumber) {
        blockTopRight2.appendChild(inputSection);
      } else if ((i) => dataListNumber) {
        blockTopLeft2.appendChild(inputSection);
      }
    } else {
      var dataListNumber = (dataList.length * 75) / 100;

      if (i < dataListNumber) {
        blockBottomRight2.appendChild(inputSection);
      } else if ((i) => dataListNumber) {
        blockBottomLeft2.appendChild(inputSection);
      }
    }
  }
}

function createMultivaluedValues(inputMultValues, triData, radioEscolhido) {
  const labels = [triData.labelFieldC, triData.labelFieldP, triData.labelFieldO];
  const fields = [triData.fieldC, triData.fieldP, triData.fieldO];

  labels.forEach((labelText, index) => {
    const valueDiv = document.createElement("div");
    valueDiv.classList.add("value");

    const labelElement = document.createElement("label");
    labelElement.textContent = labelText;
    valueDiv.appendChild(labelElement);

    const inputElement = document.createElement("input");
    inputElement.type = "number";
    inputElement.value = fields[index];
    inputElement.min = "0";
    inputElement.step = "0.01";

    if (radioEscolhido === "media") {
      inputElement.max = "1";
    } else {
      inputElement.max = "100";
    }

    inputElement.classList.add("input-field");

    // Limitador manual de valor ao digitar
    inputElement.addEventListener("input", function () {
      const val = parseFloat(this.value);
      if (radioEscolhido === "media" && val > 1) {
        this.value = 1;
      } else if (radioEscolhido !== "media" && val > 100) {
        this.value = 100;
      }
    });

    valueDiv.appendChild(inputElement);

    inputMultValues.appendChild(valueDiv);
  });
}

const blockTopRight = document.getElementById("input-block-top-right");
const blockTopLeft = document.getElementById("input-block-top-left");
const blockBottomRight = document.getElementById("input-block-bottom-right");
const blockBottomLeft = document.getElementById("input-block-bottom-left");

function createInputsByIndex(typeName, radioEscolhido) {
  blockTopRight.innerHTML = " ";
  blockTopLeft.innerHTML = " ";
  blockBottomRight.innerHTML = " ";
  blockBottomLeft.innerHTML = " ";

  let dataList, indexFdiList;

  if (typeName === "cpo") {
    ({ dataList, indexFdiList } = new CPO_D()); //Destructuring (Desestruturação de Objetos)
  } else if (typeName === "ceo") {
    ({ dataList, indexFdiList } = new CEO_D()); //Destructuring (Desestruturação de Objetos)
  }

  createInputs2(dataList, indexFdiList, radioEscolhido);
}

function createInputs2(dataList, indexFdiList, radioEscolhido) {
  for (let i = 0; i < dataList.length; i++) {
    // crianção da div
    const inputSection = document.createElement("div");
    inputSection.classList.add("input-section");

    //criação do label
    const label = document.createElement("label");
    label.classList.add("label-name");
    label.textContent = indexFdiList[i];
    inputSection.appendChild(label);

    //criação do input(number)
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "0.01";

    if (radioEscolhido === "media") {
      input.max = "1";
    } else {
      input.max = "100";
    }

    input.classList.add("input-field");

    // Limitador manual de valor ao digitar
    input.addEventListener("input", function () {
      const val = parseFloat(this.value);
      if (radioEscolhido === "media" && val > 1) {
        this.value = 1;
      } else if (radioEscolhido !== "media" && val > 100) {
        this.value = 100;
      }
    });

    inputSection.appendChild(input);

    // divição dos inputs por grupos (Superior e Inferior)
    if (i < dataList.length / 2) {
      var dataListNumber = dataList.length / 2 / 2;

      if (i < dataListNumber) {
        blockTopRight.appendChild(inputSection);
      } else if ((i) => dataListNumber) {
        blockTopLeft.appendChild(inputSection);
      }
    } else {
      var dataListNumber = (dataList.length * 75) / 100;

      if (i < dataListNumber) {
        blockBottomRight.appendChild(inputSection);
      } else if ((i) => dataListNumber) {
        blockBottomLeft.appendChild(inputSection);
      }
    }
  }
}


// Instâncias de CPO_D e CEO_D
const cpo_d = new CPO_D();
const ceo_d = new CEO_D();

// Variáveis de manipulação do DOM na tela inicial
const cpoBtn = document.getElementById("permanent-teeth");
const ceoBtn = document.getElementById("deciduous-teeth");
const toothSection = document.getElementById("data-section");
const titleSection = document.getElementById("section-title");

// Variáveis de manipulação do DOM na seção de formulário e entrada
const generateInputBtn = document.getElementById("generate-input");
const selectElement = document.getElementById("index-entry");
const boxInputSection = document.getElementById("input-container");
const errorMessage = document.getElementById("error-message");

//Variáveis referente aos botões
const btnGenerateHistogram = document.getElementById("generate-histogram");

//Variáveis Globais
var typeName = null;
var isButtonClicked = false;
let radioEscolhido = null;

const histogramSection = document.getElementById("box-histogram-render");

// Variável global para armazenar o valor escolhido
let modoEscolhido = null;

// Pega os radios
const radios = document.querySelectorAll('input[name="modo_distribuicao"]');

// Verifica se algum já está marcado ao carregar a página
const selecionadoInicial = document.querySelector(
  'input[name="modo_distribuicao"]:checked'
);
if (selecionadoInicial) {
  radioEscolhido = selecionadoInicial.value;
  console.log("Valor inicial:", radioEscolhido);
}

// Escuta as mudanças nos radios
radios.forEach((radio) => {
  radio.addEventListener("change", () => {
    if (radio.checked) {
      radioEscolhido = radio.value;
      console.log("Usuário escolheu:", radioEscolhido);
    }
  });
});

// Função para adicionar ou remover opções do select
function manipulateSelectOptions(optionText, optionValue) {
  selectElement.innerHTML = ""; // Limpa todas as opções

  const newOption = new Option(optionText, optionValue);
  const defaultOption = new Option("TOTAL", "total"); // Opção padrão do sistema
  selectElement.add(defaultOption); // Adiciona opção padrão
  selectElement.add(newOption); // Adiciona a nova opção
}

function updateSection(title, sectionValue, optionText, optionValue) {
  boxInputSection.style.display = "none";
  titleSection.innerHTML = title;
  manipulateSelectOptions(optionText, optionValue);
  toothSection.style.display = "block";
  typeName = sectionValue;
}

// Eventos na tela inicial
cpoBtn.addEventListener("click", () =>
  updateSection(
    "Dentes Permanentes",
    "cpo",
    "TOTAL POR COMPONENTES (CPO)",
    "cpo"
  )
);
ceoBtn.addEventListener("click", () =>
  updateSection("Dentes Decíduos", "ceo", "TOTAL POR COMPONENTES (ceo)", "ceo")
);

// Eventos na seção de formulário e entrada
generateInputBtn.addEventListener("click", () => {
  const optionValue = selectElement.value;

  boxInputSection.style.display = "block";
  histogramSection.style.display = "none";

  console.log(radioEscolhido);

  if (optionValue === "total") {
    console.log(typeName);
    createInputsByIndex(typeName, radioEscolhido);
  } else {
    console.log(typeName);
    createInputsByIndexMultiple(typeName, radioEscolhido);
  }

  // Só reseta a classificação dos dentes para "FDI" a partir do segundo clique
  if (isButtonClicked) {
    const toothClassificationElement = document.getElementById(
      "tooth-classification"
    );
    toothClassificationElement.value = "fdi";
  }

  // Marca que o botão foi clicado
  isButtonClicked = true;
});

// Seleciona o elemento <select> pelo ID
const selectElementTooth = document.getElementById("tooth-classification");

// Adiciona um ouvinte de evento para o evento 'change'
selectElementTooth.addEventListener("change", (event) => {
  // Obtém o valor da opção selecionada
  const value = event.target.value;
  console.log(value);
  updateLabel(value, typeName);
  histogramSection.style.display = "none";
});

// // Função para salvar os valores dos inputs nos objetos das classes
// function saveInputValues() {
//   // Seleciona todos os inputs com a classe "input-field"
//   const allInputs = document.querySelectorAll(".input-field");

//   // Verifica o tipo (permanente ou decíduo) e seleciona o objeto correspondente
//   const indexObject = typeName === "cpo" ? cpo_d : ceo_d;

//   // Itera sobre os inputs e armazena o valor no objeto adequado
//   allInputs.forEach((input, idx) => {
//     const valor = input.value;

//     if (valor !== "") {
//       // Define o valor em dataList ou triDataList conforme necessário
//       indexObject.setData(valor, idx);
//     }
//   });
// }

function saveInputValues() {
  const allInputs = document.querySelectorAll(".input-field");

  const indexObject = typeName === "cpo" ? cpo_d : ceo_d;

  // Caso o indexObject tenha triDataList, usamos ela
  const isTriData = !!indexObject.triDataList;

  if (selectElement.value != "total") {
    for (let i = 0; i < allInputs.length; i += 3) {
      const idx = i / 3;
      const triData = indexObject.triDataList[idx];

      triData.fieldC = parseFloat(allInputs[i].value) || 0;
      triData.fieldP = parseFloat(allInputs[i + 1].value) || 0;
      triData.fieldO = parseFloat(allInputs[i + 2].value) || 0;

      // Se quiser, pode calcular um total e jogar no dataList também:
      indexObject.setData(triData.fieldA + triData.fieldB + triData.fieldC, idx);
    }
  } else {
    // Caso com apenas um input por item
    allInputs.forEach((input, idx) => {
      const valor = input.value;
      if (valor !== "") {
        indexObject.setData(valor, idx);
      }
    });
  }
}

//Validação dos campos de input
function validateField() {
  // Selecionar todos os inputs, pertecente a uma class generica "input-field"
  const allInputs = document.querySelectorAll(".input-field");
  let allFilled = true; //flag de retorno

  // Verifica se todos os inputs estão preenchidos
  allInputs.forEach((input) => {
    if (input.value === "") {
      allFilled = false;
    }
  });

  return allFilled;
}

btnGenerateHistogram.addEventListener("click", () => {
  const optionValue = selectElement.value;

  if (optionValue === "total") {
    histogramTotal();
  } else {
    histogramMulti();
  }
});

function histogramTotal() {
  const isValidated = validateField();
  const value = selectElementTooth.value;
  let dadosDentes, labelDentes, espaco_superior, espaco_inferior;

  espaco_superior = document.getElementById(
    "section-histogram-render-superior"
  );
  espaco_inferior = document.getElementById(
    "section-histogram-render-inferior"
  );

  if (isValidated) {
    histogramSection.style.display = "flex";

    espaco_superior.style.width = "100%";
    espaco_superior.style.maxWidth = "500px";
    espaco_superior.style.minWidth = "300px";
    espaco_superior.style.height = "500px";
    espaco_superior.textContent = " ";

    espaco_inferior.style.width = "100%";
    espaco_inferior.style.maxWidth = "500px";
    espaco_inferior.style.minWidth = "300px";
    espaco_inferior.style.height = "500px";
    espaco_inferior.textContent = " ";

    console.log("Campos preenchidos");
    errorMessage.style.display = "none";
    // Salva os valores preenchidos
    saveInputValues();

    if (typeName == "cpo") {
      dadosDentes = cpo_d.dataList;
      if (value === "fdi") {
        labelDentes = cpo_d.indexFdiList;
      } else if (value === "ada") {
        labelDentes = cpo_d.indexAdaList;
      }
    } else {
      dadosDentes = ceo_d.dataList;
      if (value === "fdi") {
        labelDentes = ceo_d.indexFdiList;
      } else if (value === "ada") {
        labelDentes = ceo_d.indexAdaList;
      }
    }

    // separar o array de dados em dois
    let meio = Math.ceil(dadosDentes.length / 2); // Arredonda para cima para lidar com arrays ímpares
    const dadosDentesSuperior = dadosDentes.slice(0, meio); // Primeira metade
    const dadosDentesInferior = dadosDentes.slice(meio); // Segunda metade

    // separar o array de dados em dois
    meio = Math.ceil(labelDentes.length / 2); // Arredonda para cima para lidar com arrays ímpares
    const labelDentesSuperior = labelDentes.slice(0, meio); // Primeira metade
    const labelDentesInferior = labelDentes.slice(meio); // Segunda metade

    let distribuicao = radioEscolhido;

    let histogram_superior = new HistogramTotal(
      espaco_superior,
      dadosDentesSuperior,
      labelDentesSuperior,
      "top",
      distribuicao
    );

    console.log(dadosDentes);

    histogram_superior.generateHistogramTotal(); // para renderizar na tela

    let histogram_inferior = new HistogramTotal(
      espaco_inferior,
      dadosDentesInferior,
      labelDentesInferior,
      "bottom",
      distribuicao
    );
    console.log(dadosDentes);
    histogram_inferior.generateHistogramTotal(); // para renderizar na tela
    document.getElementById("histogram-legend-section").style.display = "flex";
    document.getElementById("histogram-legend-section-cpo").style.display =
      "none";
  } else {
    console.log("Não estão preenchidos");
    errorMessage.style.display = "block";
  }
}

function histogramMulti() {
  const isValidated = validateField();
  const value = selectElementTooth.value;
  let dadosDentes = [],
    labelDentes,
    espaco_superior,
    espaco_inferior;

  espaco_superior = document.getElementById(
    "section-histogram-render-superior"
  );
  espaco_inferior = document.getElementById(
    "section-histogram-render-inferior"
  );

  if (isValidated) {
    histogramSection.style.display = "flex";
    espaco_superior.style.width = "100%";
    espaco_superior.style.maxWidth = "500px";
    espaco_superior.style.minWidth = "300px";
    espaco_superior.style.height = "500px";
    espaco_superior.textContent = " ";

    espaco_inferior.style.width = "100%";
    espaco_inferior.style.maxWidth = "500px";
    espaco_inferior.style.minWidth = "300px";
    espaco_inferior.style.height = "500px";
    espaco_inferior.textContent = " ";

    console.log("Campos preenchidos");
    errorMessage.style.display = "none";
    // Salva os valores preenchidos
    saveInputValues();

    if (typeName == "cpo") {
      dadosDentes = cpo_d.triDataList;
      if (value === "fdi") {
        labelDentes = cpo_d.indexFdiList;
      } else if (value === "ada") {
        labelDentes = cpo_d.indexAdaList;
      }
    } else {
      dadosDentes = ceo_d.triDataList;
      if (value === "fdi") {
        labelDentes = ceo_d.indexFdiList;
      } else if (value === "ada") {
        labelDentes = ceo_d.indexAdaList;
      }
    }

    // separar o array de dados em dois
    let meio = Math.ceil(dadosDentes.length / 2); // Arredonda para cima para lidar com arrays ímpares
    const dadosDentesSuperior = dadosDentes.slice(0, meio); // Primeira metade
    const dadosDentesInferior = dadosDentes.slice(meio); // Segunda metade

    // separar o array de dados em dois
    meio = Math.ceil(labelDentes.length / 2); // Arredonda para cima para lidar com arrays ímpares
    const labelDentesSuperior = labelDentes.slice(0, meio); // Primeira metade
    const labelDentesInferior = labelDentes.slice(meio); // Segunda metade

    let distribuicao = radioEscolhido;

    let histogram_superior = new HistogramMulti(
      espaco_superior,
      dadosDentesSuperior,
      labelDentesSuperior,
      "top",
      distribuicao
    );

    console.log(dadosDentes);

    histogram_superior.generateHistogramMulti(); // para renderizar na tela

    let histogram_inferior = new HistogramMulti(
      espaco_inferior,
      dadosDentesInferior,
      labelDentesInferior,
      "bottom",
      distribuicao
    );
    console.log(dadosDentes);
    histogram_inferior.generateHistogramMulti(); // para renderizar na tela

    document.getElementById("histogram-legend-section-cpo").style.display =
      "flex";
    document.getElementById("histogram-legend-section").style.display = "none";
  } else {
    console.log("Não estão preenchidos");
    errorMessage.style.display = "block";
  }
}
