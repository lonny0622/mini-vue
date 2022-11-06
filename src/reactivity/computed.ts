import { ReactiveEffect } from "./effect";

class ComputedImpl {
    private _getter: Function;
    // 标识是否需要重新计算
    private _dirty: boolean = true;
    // 缓存值
    private _value: any;

    private _effect: ReactiveEffect;

    constructor(getter: Function) {
        this._getter = getter;
        this._effect = new ReactiveEffect(getter, () => {
            // 依赖改变时修改标识，下次get时需要重新计算
            if (!this._dirty) this._dirty = true;
        });
    }
    get value() {
        // 依赖改变后第一次调用时计算并缓存，之后依赖没有变化时直接调用缓存的值
        if (this._dirty) {
            this._dirty = false;
            this._value = this._effect.run();
        }
        return this._value;
    }
}

export function computed(getter: Function) {
    return new ComputedImpl(getter);
}
