import { extend } from "../shared";
import { EffectOptions } from "./models";

//保证只有一个活动的effect
let activeEffect: any;
let shouldTrack: boolean = false;
export class ReactiveEffect {
    // effect函数
    private _fn: Function;
    // 传入 scheduler 时会在状态改变时调用 scheduler 而不是 effect
    public scheduler: Function | null = null;
    // 保存所有依赖便于stop清空
    public deps = [];
    // 用于记录当前跟踪状态，调用stop后停止跟踪，不会自动触发effect
    private _active = true;
    // 调用 stop 时触发这个函数做一些额外的处理
    public onStop?: () => void;
    constructor(fn: Function, scheduler?: Function) {
        this._fn = fn;
        if (scheduler) this.scheduler = scheduler;
    }
    run() {
        activeEffect = this;
        // 会收集依赖
        // shouldTrack来做区分
        if (!this._active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();

        // reset
        shouldTrack = false;

        return result;
    }
    stop() {
        if (this._active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this._active = false;
        }
    }
}
//删除effect
function cleanupEffect(effect: ReactiveEffect) {
    effect.deps.forEach((dep: any) => dep.delete(effect));
    effect.deps.length = 0;
}
//用于保存不同对象的depsMap
const targetMap = new WeakMap();
export function track(target: object, key: any) {
    if (!isTracking()) return;
    // target -> key -> dep
    // const dep = new Set();
    // 先获取到指定对象的depsMap
    let depsMap = targetMap.get(target);
    //如果不存在则添加一个
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let dep: Set<any> = depsMap.get(key);
    //如果该属性的dep还没有被映射上去，我们将这个dep映射到depsMap
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    trackEffects(dep);
}

export function trackEffects(dep: Set<any>) {
    if (dep.has(activeEffect)) return;
    //并存储effect
    dep.add(activeEffect);
    //同时保存对应的dep以方便调用stop时进行删除
    activeEffect.deps.push(dep);
}

export function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}

export function trigger(target: object, key: any) {
    //先获取指定对象的depsMap，没有就直接返回
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    //首先我们要通过key获取这个属性的dep
    let dep = depsMap.get(key);
    triggerEffects(dep);
}

export function triggerEffects(dep: Set<any>) {
    if (dep) {
        //遍历dep运行里面的effect
        dep.forEach((effect: ReactiveEffect) => {
            if (effect.scheduler) {
                effect.scheduler();
            } else {
                effect.run();
            }
        });
    }
}

export function effect(fn: Function, options: EffectOptions = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner: any = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

export function stop(runner: any) {
    runner.effect.stop();
}
