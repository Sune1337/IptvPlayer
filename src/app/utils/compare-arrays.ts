export function compareArrays<T>(arr1: Array<T>, arr2: Array<T>, compare: ((a: T, b: T) => boolean)): boolean {
  if (arr1.length != arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (!compare(arr1[i], arr2[i])) {
      return false;
    }
  }

  return true;
}
