export const TO_DISPLAY_STRING = Symbol("toDisplayString");
export const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");

export interface HelperMapName {
    [key: symbol]: string;
}

export const helperMapName: HelperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};
