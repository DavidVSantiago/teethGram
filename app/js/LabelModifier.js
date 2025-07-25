
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
