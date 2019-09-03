const isObject = function(a) {
  return a !== null && 'object' == typeof a && '[object Object]' === Object.prototype.toString.call(a);
};

/*
 * Examples:
 *
 */

const _PATH_SEPARATOR_ = '/';

const set = (input = {}, path, value, clone=false, separator=_PATH_SEPARATOR_) => {
  if (typeof input !== 'object') {
    throw 'Input needs to be either an object ({}) or array ([])';
  }

  path = `${path}`;

  if (clone) {
    if (Array.isArray(input)) {
      input = input.slice();
    } else if (isObject(input)) {
      input = { ...input };
    }
  }

  if (path[0] === separator) {
    path = path.slice(1);
  }

  const keys = path.split(separator);

  let current = input;
  let prev = null;
  let prevKey = null;

  while (keys.length) {
    let key = keys.shift();

    if (!isNaN(Number(key))) {
      key = Number(key);
    }

    if (keys.length === 0) {
      if (current && isObject(current) && isObject(value)) {
        current[key] = {...current, ...value};
        break;
      }

      if (value === undefined) {
        if (Array.isArray(current)) {
          current.splice(key, 1);
        } else {
          delete current[key];
        }
      } else {
        current[key] = value;
      }
      break;
    }

    if (typeof current[key] === 'undefined' || current[key] === null) {
      current[key] = isNaN(parseInt(keys[0])) ? {} : [];
    }

    prev = current;
    prevKey = key;
    current = current[key];
  }
  return input;
};

const resolve = (input, path, _default = undefined, separator=_PATH_SEPARATOR_) => {
  path = `${path}`;

  if (path[0] === separator) {
    path = path.slice(1);
  }
  const keys = path.split(separator);

  if (typeof input === 'undefined' || input === null) {
    return _default;
  }

  try {
    while(keys.length) {
      const key = keys.shift();

      if (typeof key !== 'undefined') {
        if (typeof input[key] === 'undefined' || input[key] === null) {
          return _default;
        }
        input = input[key];
      }
    }
  } catch (e) {
    return _default;
  }

  if (Array.isArray(input)) {
    return [...input];
  } else if (typeof input === 'object' && input !== null) {
    return {...input};
  }

  return input;
};

module.exports = {
  isObject: isObject,
  resolve: resolve,
  set: set
};
