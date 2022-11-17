import { extend, isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive, readonly } from "./reactive";

export const enum ReactiveFlags {
    IS_REACTIVE = "__V_isReactive",
    IS_READONLY = "__v_isReadonly",
}

export interface Handlers {
    get: (target: any, key: string) => any;
    set: (target: any, key: string, value: any) => any;
}

// 缓存处理
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
/**
 * 创建get函数
 * @param isReadonly 是否只读
 * @param shallow 是否为shallowReadonly
 * @returns
 */
function createGetter(isReadonly = false, shallow = false) {
    return function get(target: any, key: string) {
        // 调用这个两个属性时特殊处理，并返回对应的布尔值
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        } else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }

        const res = Reflect.get(target, key);
        // 如果为shallowReadonly只用将表层设置为readonly
        if (shallow) return res;
        // 其他则需要递归给前提对象也做reactive/readonly处理
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }

        if (!isReadonly) {
            // 依赖收集
            track(target, key);
        }
        return res;
    };
}
/**
 * c创建set函数
 * @returns
 */
function createSetter() {
    return function set(target: any, key: string, value: any) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
// 用于作为reactive对象中Proxy的handlers
export const mutableHandlers: Handlers = {
    get,
    set,
};
// 用于作为readonly对象中Proxy的handlers
export const readonlyHandlers: Handlers = {
    get: readonlyGet,
    set(target: any, key: string, value: any) {
        // 给出警告
        console.warn(`该 ${target} 为 readonly 无法为 ${key} 赋值`);
        return true;
    },
};
// 用于作为shallowReadonly对象中Proxy的handlers
export const shallowReadonlyHandlers: Handlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});
