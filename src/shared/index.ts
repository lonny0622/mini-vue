export const extend = Object.assign;
export const EMPTY_OBJ = {};
export const isObject = (val: any) => {
    return val !== null && typeof val === "object";
};

export const isHasChange = (oldValue: any, newValue: any) => {
    return !Object.is(oldValue, newValue);
};

export const hasOwn = (val: any, key: string) =>
    Object.prototype.hasOwnProperty.call(val, key);

// add => Add
export const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// add-foo => addFoo
export const camelize = (str: string) => {
    return str.replace(/-(\w)/g, (_, c: string) => {
        return c ? c.toUpperCase() : "";
    });
};
export const toHandlerKey = (str: string) => {
    return str ? "on" + capitalize(str) : "";
};
