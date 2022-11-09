export const extend = Object.assign;

export const isObject = (val: any) => {
    return val !== null && typeof val === "object";
};

export const isHasChange = (oldValue: any, newValue: any) => {
    return !Object.is(oldValue, newValue);
};

export const hasOwn = (val: any, key: string) =>
    Object.prototype.hasOwnProperty.call(val, key);
