'use strict';

// toggle theme
document.querySelector('#toggleTheme').addEventListener('change', () => {
  document.body.classList.toggle('dark');
});

// calculator
const operations = {
  add(num1, num2) {
    return num1 + num2;
  },
  subtract(num1, num2) {
    return num1 - num2;
  },
  multiply(num1, num2) {
    return num1 * num2;
  },
  divide(num1, num2) {
    return num1 / num2;
  }
};

const operationSymbols = {
  add: '+',
  subtract: '-',
  multiply: 'x',
  divide: '/'
};

const round = num => {
  let result = Math.round((num + Number.EPSILON) * 10000) / 10000;
  if (result.toString().length > 13) {
    result = result.toExponential(3);
  }
  return result;
};

class Calculator {
  constructor(mainDisplay, operationDisplay) {
    this.mainDisplay = mainDisplay;
    this.operationDisplay = operationDisplay;
    this.clear();
  }

  updateMainDisplay(str) {
    this.mainDisplay.textContent = str;
  }

  updateOperationDisplay(str) {
    this.operationDisplay.textContent = str;
  }

  clear() {
    this.updateMainDisplay('0');
    this.updateOperationDisplay('');
    this.operationType = null;
    this.num1 = null;
    this.num2 = null;
    this.operatorPressed = false;
    this.currentNumberUpdated = false;
  }

  displayOperand(str) {
    const displayStr = this.mainDisplay.textContent;
    this.operatorPressed = false;
    // Initial display = "0", replace it by the first operand, e.g. "2" or "0."
    if (displayStr === '0') {
      this.mainDisplay.textContent = str === '.' ? `0${str}` : str;
      return;
    }
    // don't add "." if there's already one
    if (str === '.' && displayStr.includes('.')) {
      return;
    }
    // add numbers to the display if string length < 13
    if (displayStr.length < 13) this.mainDisplay.textContent += str;
  }

  isResultDisplayed() {
    return this.mainDisplay.textContent.includes('=');
  }

  getDisplayedNumber() {
    return +this.mainDisplay.textContent;
  }

  displayOperation(num1, operation, num2 = null) {
    const operationDisplayed = `${num1}${operationSymbols[operation]}${
      num2 ?? ''
    }`;
    this.updateOperationDisplay(operationDisplayed);
    this.updateMainDisplay('0');
    this.operatorPressed = true;
  }

  percentage() {
    let displayStr = this.mainDisplay.textContent;
    if (this.isResultDisplayed()) {
      if (displayStr.includes('Error')) return;
      // if there's a result on the display, get the result value and assign it to num1
      displayStr = displayStr.replace('= ', '');
      this.num1 = +displayStr / 100;
      this.updateOperationDisplay('');
      this.currentNumberUpdated = true;
    }
    this.updateMainDisplay(+displayStr / 100);
  }

  backspace() {
    if (this.isResultDisplayed()) {
      this.clear();
      return;
    }
    const displayStr = this.mainDisplay.textContent;
    const newStr = displayStr.length === 1 ? '0' : displayStr.slice(0, -1);
    this.updateMainDisplay(newStr);
  }

  calculate() {
    return this.operationType === 'divide' && this.num2 === 0
      ? false
      : operations[this.operationType](this.num1, this.num2);
  }

  operation(operationType) {
    // first operation, or num1 previously updated via percentage
    if (this.num1 === null || this.currentNumberUpdated) {
      this.operationType = operationType;
      this.num1 = this.getDisplayedNumber();
      // we'll display the operation that's being executed e.g: "5x"
      this.displayOperation(this.num1, this.operationType);
      this.currentNumberUpdated = false;
      return;
    }

    // if user had already selected an operation, update operation, e.g: "5x" -> "5+"
    if (this.operatorPressed) {
      this.operationType = operationType;
      this.displayOperation(this.num1, this.operationType);
      return;
    }

    if (this.isResultDisplayed()) {
      let display = this.mainDisplay.textContent;
      if (display.includes('Error')) return;
      this.num1 = +display.replace('= ', '');
    } else {
      // if user wants to chain operations, more than a pair of operands, e.g: 12+7-
      // we need to execute the current operation first, before starting the new one
      this.num2 = this.getDisplayedNumber();
      const result = this.calculate();
      // in case division by 0, result will be false
      if (result === false) {
        this.updateMainDisplay(`= Error`);
        return;
      }
      // store the result in num1 before continuing to the next operation
      this.num1 = result;
    }
    // display the new operation
    this.operationType = operationType;
    this.displayOperation(this.num1, this.operationType);
  }

  result() {
    // if operation is not defined, don't do anything
    if (!this.operationType) return;
    // define num2 depending on the user previous actions
    // if user presses equals straight after an operation without entering a second number
    if (this.operatorPressed) {
      // second number will be equal to the first number, e.g: 5+= 10
      this.num2 = this.num1;
    } else if (!this.currentNumberUpdated) {
      // if user didn't use the percentage button to update the display number
      let display = this.mainDisplay.textContent;
      // if there isn't a result on the display
      if (!this.isResultDisplayed()) {
        // get the number on the display to be the second operand
        this.num2 = +display;
      } else {
        // if there's a result, get the displayed number and assign to num1
        //e.g: 1+2=3, display: =3, user presses result again: =5 (num1 = 3, num2 = 2)
        if (display.includes('Error')) return;
        this.num1 = +display.replace('= ', '');
      }
    }
    // now we have num2 defined, let's do the calculation
    const result = this.calculate();
    if (result === false) {
      this.updateMainDisplay(`= Error`);
      return;
    }
    this.displayOperation(this.num1, this.operationType, this.num2);
    // display result
    this.updateMainDisplay(`= ${round(result)}`);
    this.operatorPressed = false;
    this.currentNumberUpdated = false;
  }
}

const mainDisplay = document.querySelector('.main-display');
const operationDisplay = document.querySelector('.operation-display');

const calculator = new Calculator(mainDisplay, operationDisplay);

const handleClick = e => {
  if (!e.target.closest('button')) return;
  const btnTarget = e.target.closest('button').dataset.target;
  if (btnTarget === 'operator') {
    const operationType = e.target.closest('button').dataset.operation;
    calculator.operation(operationType);
    return;
  }
  if (btnTarget === 'operand') {
    //if there's a result on the display, clear first
    if (calculator.isResultDisplayed()) calculator.clear();
    calculator.displayOperand(e.target.textContent);
    return;
  }
  // execute clear, backspace, percentage or result methods
  calculator[btnTarget]();
};

// Add Event Listener to the buttons container: event delegation
document.querySelector('.buttons').addEventListener('click', handleClick);

// keyboard support
window.addEventListener('keydown', function (e) {
  let key = document.querySelector(`button[data-key='${e.key}']`);
  if (e.key === ',') key = document.querySelector(`button[data-key='.']`);
  if (key) key.click();
});
