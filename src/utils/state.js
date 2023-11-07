// @ts-check

// TODO: add recoil

export const storeItem = (key, value) => {
  localStorage[key] = value;
};

export const fetchItem = (key) => {
  let value = localStorage[key];
  try {
    value = JSON.parse(value);
  } catch (err) {
    console.error(`Failed to parse ${key} from localStorage`);
  }
  return value;
};
