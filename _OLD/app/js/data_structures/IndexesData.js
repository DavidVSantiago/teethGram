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
