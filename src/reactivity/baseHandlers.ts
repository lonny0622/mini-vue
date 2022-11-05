import { track, trigger } from "./effect";

export const enum ReactiveFlags {
  IS_REACTIVE = "__V_isReactive",
  IS_READONLY = "__v_isReadonly",
}

// 缓存处理
const get = createGetter();
const set = createSetter();

const readonlyGet = createGetter(true);
function createGetter(isReadonly = false) {
  return function get(target: any, key: string) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);
    if (!isReadonly) {
      // 依赖收集
      track(target, key);
    }
    return res;
  };
}

function createSetter() {
  return function set(target: any, key: string, value: any) {
    const res = Reflect.set(target, key, value);
    // 触发依赖
    trigger(target, key);
    return res;
  };
}

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target: any, key: string, value: any) {
    // 给出警告
    console.warn("该对象为readonly");
    return true;
  },
};
