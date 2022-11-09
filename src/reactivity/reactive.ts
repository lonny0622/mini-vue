import { isObject } from "../shared";
import {
    mutableHandlers,
    ReactiveFlags,
    readonlyHandlers,
    shallowReadonlyHandlers,
} from "./baseHandlers";

export function reactive(raw: any) {
    return createReactiveObject(raw, mutableHandlers);
}

export function readonly(raw: any) {
    return createReactiveObject(raw, readonlyHandlers);
}

export function shallowReadonly(raw: any) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
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

function createReactiveObject(target: any, handlers: any) {
    if (!isObject(target)) {
        console.warn(`target ${target} must be an object!`);
        return target;
    }
    return new Proxy(target, handlers);
}
