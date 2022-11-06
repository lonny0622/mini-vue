import {
    mutableHandlers,
    ReactiveFlags,
    readonlyHandlers,
    shallowReadonlyHandlers,
} from "./baseHandlers";

export function reactive(raw: any) {
    return createActivityObject(raw, mutableHandlers);
}

export function readonly(raw: any) {
    return createActivityObject(raw, readonlyHandlers);
}

export function shallowReadonly(raw: any) {
    return createActivityObject(raw, shallowReadonlyHandlers);
}

export function isReactive(value: any) {
    return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value: any) {
    return !!value[ReactiveFlags.IS_READONLY];
}

export function isProxy(value: any) {
    return isReactive(value) || isReadonly(value);
}

function createActivityObject(raw: any, handlers: any) {
    return new Proxy(raw, handlers);
}
