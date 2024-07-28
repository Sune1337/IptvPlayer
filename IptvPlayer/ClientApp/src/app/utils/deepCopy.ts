export function deepCopy<T>(t: T): T {

  // Handle the 3 simple types, and null or undefined
  if (t == null || typeof t !== "object") return t;

  // Clone arrays.
  if (t instanceof Array) {
    // Clone object.
    let array = [];
    for (var i = 0, len = t.length; i < len; i++) {
      array[i] = deepCopy(t[i]);
    }
    return array as unknown as T;
  }

  // Clone objects.
  if (t instanceof Object) {
    // Clone object.
    let obj = {} as T;
    for (const k in t) {
      obj[k] = deepCopy(t[k]);
    }
    return obj;
  }

  throw new Error('Unable to copy obj! Its type isn\'t supported.');
}
