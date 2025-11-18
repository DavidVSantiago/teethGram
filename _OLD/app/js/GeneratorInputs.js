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

  createInputs(dataList, indexFdiList, radioEscolhido);
}

function createInputs(dataList, indexFdiList, radioEscolhido) {
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
