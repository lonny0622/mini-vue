import { isHasChange, isObject } from "../shared";
import {
    isTracking,
    ReactiveEffect,
    trackEffects,
    triggerEffects,
} from "./effect";
import { reactive } from "./reactive";

class RefImpl {
    // 对象的值
    private _value: any;
    // 用于保存原始值
    private _rawValue: any;
    // 储存effect
    public dep: Set<ReactiveEffect>;
    // 是否为ref对象
    public __v_isRef = true;
    constructor(value: any) {
        // 保存原始值，便于之后对比
        this._rawValue = value;
        // value => reactive
        // 判断 value 是否是对象,如果是对象则将它转化成reactive
        this._value = convert(value);

        this.dep = new Set();
    }
    /**
     * 获取值时进行依赖追踪
     */
    get value() {
        trackRefValue(this);
        return this._value;
    }
    /**
     * 设置值时触发Effect
     */
    set value(newValue) {
        // 只有value的值改变后才触发trigger
        if (isHasChange(this._value, newValue)) {
            // 保存原始值
            this._rawValue = newValue;
            // 如果是对象则转化成reactive
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
/**
 * 进行依赖追踪
 * @param ref
 */
function trackRefValue(ref: RefImpl) {
    // 避免重复/或者调用了stop后追踪
    if (isTracking()) trackEffects(ref.dep);
}

/**
 * 将值转化为reactive对象
 * @param value
 * @returns
 */
function convert(value: any) {
    return isObject(value) ? reactive(value) : value;
}

/**
 * 创建ref对象
 * @param value
 * @returns
 */
export function ref(value: any) {
    return new RefImpl(value);
}
/**
 * 判断是否为ref对象
 * @param ref
 * @returns
 */
export function isRef(ref: any) {
    return !!ref.__v_isRef;
}

/**
 * 将对象的值暴露出来
 * @param ref
 * @returns
 */
export function unRef(ref: any) {
    //判断是不是ref对象
    return isRef(ref) ? ref.value : ref;
}

/**
 * ref代理对象，可以直接获取或者设置ref对象的值，而不是通过ref.value
 * @param objectWithRefs
 * @returns
 */
export function proxyRefs(objectWithRefs: any) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            // 判断是否为ref对象是就返回.value,不是就直接返回它本身
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            } else {
                return Reflect.set(target, key, value);
            }
        },
    });
}
