import { isObject } from "../shared";
import {
    Handlers,
    mutableHandlers,
    ReactiveFlags,
    readonlyHandlers,
    shallowReadonlyHandlers,
} from "./baseHandlers";

/**
 * 响应式处理数据
 * @param raw
 * @returns
 */
export function reactive(raw: any) {
    return createReactiveObject(raw, mutableHandlers);
}

/**
 * 将数据/对象设为只读
 * @param raw
 * @returns
 */
export function readonly(raw: any) {
    return createReactiveObject(raw, readonlyHandlers);
}

/**
 * 只将对象本身设置为只读，但是对象内的属性不设置为只读（对象内属性的指针可以改变）
 * @param raw
 * @returns
 */
export function shallowReadonly(raw: any) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
/**
 * 判断一个数据是否为响应式的
 * @param value
 * @returns
 */
export function isReactive(value: any) {
    return !!value[ReactiveFlags.IS_REACTIVE];
}

/**
 * 判断一个数据是否为只读的
 * @param value
 * @returns
 */
export function isReadonly(value: any) {
    return !!value[ReactiveFlags.IS_READONLY];
}

/**
 * 判断一个对象是否为代理对象
 * @param value
 * @returns
 */
export function isProxy(value: any) {
    return isReactive(value) || isReadonly(value);
}

/**
 * 创建一个响应式对象
 * @param target
 * @param handlers 传入Proxy的handlers
 * @returns
 */
function createReactiveObject(target: any, handlers: Handlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} must be an object!`);
        return target;
    }
    return new Proxy(target, handlers);
}
