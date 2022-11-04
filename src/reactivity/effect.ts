class ReactiveEffect {
  private _fn: Function;
  public scheduler: Function | null = null;
  public deps = [];
  private _active = true;
  constructor(fn: Function, scheduler?: Function) {
    this._fn = fn;
    if (scheduler) this.scheduler = scheduler;
  }
  run() {
    activeEffect = this;
    return this._fn();
  }
  stop() {
    if (this._active) {
      cleanupEffect(this);
      this._active = false;
    }
  }
}
//删除effect
function cleanupEffect(effect: ReactiveEffect) {
  effect.deps.forEach((dep: any) => dep.delete(effect));
}
//用于保存不同对象的depsMap
const targetMap = new WeakMap();
export function track(target: object, key: any) {
  // target -> key -> dep
  // const dep = new Set();
  // 先获取到指定对象的depsMap
  let depsMap = targetMap.get(target);
  //如果不存在则添加一个
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  //如果该属性的dep还没有被映射上去，我们将这个dep映射到depsMap
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  //并存储effect
  dep.add(activeEffect);
  //同时保存对应的dep以方便调用stop时进行删除
  activeEffect.deps.push(dep);
}

export function trigger(target: object, key: any) {
  //先获取指定对象的depsMap，没有就直接返回
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  //首先我们要通过key获取这个属性的dep
  let dep = depsMap.get(key);
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

//保证只有一个活动的effect
let activeEffect: any;
export function effect(fn: Function, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner: any) {
  runner.effect.stop();
}
