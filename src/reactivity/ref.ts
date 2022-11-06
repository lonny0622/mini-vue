import { isHasChange, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
    private _value: any;
    private _rawValue: any;
    public dep: Set<any>;
    constructor(value: any) {
        // 保存原始值，便于之后对比
        this._rawValue = value;
        // value => reactive
        // 判断 value 是否是对象,如果是对象则将它转化成reactive
        this._value = convert(value);

        this.dep = new Set();
    }

    get value() {
        trackRefValue(this);
        return this._value;
    }
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

export function ref(value: any) {
    return new RefImpl(value);
}

function trackRefValue(ref: RefImpl) {
    if (isTracking()) trackEffects(ref.dep);
}

function convert(value: any) {
    return isObject(value) ? reactive(value) : value;
}
