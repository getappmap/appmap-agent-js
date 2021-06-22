export class Counter {
  constructor() {
    this.value = 0;
  }
  increment() {
    return (this.value += 1);
  }
}
