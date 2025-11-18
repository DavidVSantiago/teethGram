

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
