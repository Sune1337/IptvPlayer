export class FullMatch<T> {

  private readonly lists: any[][];
  private readonly getKey: (item: any) => any;
  private readonly currentIndexes: number[];
  private readonly eof: boolean[];
  private readonly keys: any[];
  private firstMoveNext = true;
  private currentKey: any;

  public current: T[];

  constructor(list1: T[], list2: T[], getKey: (item: T) => string | number) {
    this.lists = [
      list1.slice().sort((a, b) => this.compareKeys(getKey(a), getKey(b))),
      list2.slice().sort((a, b) => this.compareKeys(getKey(a), getKey(b)))
    ];
    this.getKey = getKey;

    this.currentIndexes = new Array(2).fill(-1);
    this.eof = new Array(2).fill(false);
    this.keys = new Array(2);
    this.current = new Array(this.lists.length);
  }

  public moveNext = (): boolean => {
    if (this.firstMoveNext) {
      // Progress all lists for the first time.
      for (let index = 0; index < this.lists.length; index++) {
        this.moveNextInternal(index);
      }

      this.currentKey = this.getMinKey();
      this.firstMoveNext = false;
    } else {
      // Progress lists where key == currentKey.
      for (let index = 0; index < this.lists.length; index++) {
        if (this.keys[index] === this.currentKey) {
          this.moveNextInternal(index);
        }
      }

      this.currentKey = this.getMinKey();
    }

    // Check if all enumerators are eof.
    let eof = true;
    for (let index = 0; index < this.lists.length; index++) {
      if (!this.eof[index]) {
        eof = false;
        break;
      }
    }

    if (eof) {
      this.current = new Array(this.lists.length);
      return false;
    }

    // Iterate items and add matching items to data.
    const data = new Array(this.lists.length);
    for (let index = 0; index < this.lists.length; index++) {
      if (this.currentKey === this.keys[index]) {
        data[index] = this.lists[index][this.currentIndexes[index]];
      }
    }

    this.current = data;
    return true;
  }

  private moveNextInternal = (index: number): void => {
    if (this.eof[index]) {
      return;
    }

    this.currentIndexes[index]++;
    const eof = this.lists[index].length <= this.currentIndexes[index];
    this.eof[index] = eof;
    this.keys[index] = eof ? undefined : this.getKey(this.lists[index][this.currentIndexes[index]]);
  }

  private getMinKey = (): any => {
    let key: any = undefined;
    let firstValue = true;
    for (let index = 0; index < this.lists.length; index++) {
      if (!this.eof[index] && (firstValue || this.compareKeys(this.keys[index], key) < 0)) {
        key = this.keys[index];
        firstValue = false;
      }
    }

    return key;
  }

  private compareKeys(key1: any, key2: any): number {
    const type = typeof (key1 ?? key2);
    const val1 = key1 == null ? key2 : key1;
    const val2 = key1 == null ? key1 : key2;
    switch (type) {
      case 'string':
        return val1.localeCompare(val2);
      default:
        return val1 - val2;
    }
  }
}
