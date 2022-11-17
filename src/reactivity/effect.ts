import { extend } from "../shared";
export interface EffectOptions {
    scheduler?: Function;
    onStop?: Function;
}
export interface Runner extends Function {
    effect?: ReactiveEffect;
}

// 保证只有一个活动的effect
let activeEffect: any;
// 标记：是否需要跟踪，避免重复收集依赖
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
    /**
     * 调用该函数触发effect实现更新
     */
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
    /**
     * 停止触发更新
     */
    stop() {
        if (this._active) {
            // 清除effect
            cleanupEffect(this);
            // 如果设置了钩子函数，触发该函数
            if (this.onStop) {
                this.onStop();
            }
            // 并将活动状态设为FALSE
            this._active = false;
        }
    }
}
//删除effect
function cleanupEffect(effect: ReactiveEffect) {
    effect.deps.forEach((dep: Set<ReactiveEffect>) => dep.delete(effect));
    effect.deps.length = 0;
}
//用于保存不同对象的depsMap
const targetMap = new WeakMap();
/**
 * 依赖跟踪
 * @param target 对象
 * @param key 属性名
 * @returns
 */
export function track(target: object, key: string) {
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
    // 跟踪依赖
    trackEffects(dep);
}
/**
 * 跟踪依赖，将effect 添加到指定dep中
 * @param dep
 * @returns
 */
export function trackEffects(dep: Set<any>) {
    if (dep.has(activeEffect)) return;
    //并存储effect
    dep.add(activeEffect);
    //同时保存对应的dep以方便调用stop时进行删除
    activeEffect.deps.push(dep);
}
/**
 * 是否应该跟踪该依赖，只有当shouldTrack为true，并且effect活动时才会跟踪
 * @returns {Boolean}
 */
export function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
/**
 * 触发器
 * 获取到依赖对应的effect dep,并交给triggerEffects触发
 * @param target
 * @param key
 * @returns
 */
export function trigger(target: object, key: string) {
    //先获取指定对象的depsMap，没有就直接返回
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    //首先我们要通过key获取这个属性的dep
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
/**
 * 触发依赖对应的effect
 * @param dep
 */
export function triggerEffects(dep: Set<ReactiveEffect>) {
    if (dep) {
        //遍历dep运行里面的effect
        dep.forEach((effect: ReactiveEffect) => {
            // 如果用户设置了scheduler，则只触发scheduler
            if (effect.scheduler) {
                effect.scheduler();
            } else {
                effect.run();
            }
        });
    }
}
/**
 * 入口函数，创建effect,为之后的依赖收集等做初始化
 * @param fn
 * @param options
 * @returns 以函数方式调用runner，用户主动触发effect
 */
export function effect(fn: Function, options: EffectOptions = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner: Runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
/**
 * 停止触发effect
 * @param runner
 */
export function stop(runner: Runner) {
    runner.effect?.stop();
}
