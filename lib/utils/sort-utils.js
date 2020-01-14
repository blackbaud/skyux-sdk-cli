
/**
 * Compares two strings and returns the result.
 * @param {*} a The first string.
 * @param {*} b The second string.
 */
function stringCompare(a, b) {
  if (a > b) {
    return 1;
  }

  if (a < b) {
    return -1;
  }

  return 0;
}

/**
 * Sorts an object's keys and returns the result.
 * @param {*} obj The object with keys to be sorted.
 */
function sortedKeys(obj) {
  return Object.keys(obj).sort(stringCompare);
}

module.exports = {
  stringCompare,
  sortedKeys
};
