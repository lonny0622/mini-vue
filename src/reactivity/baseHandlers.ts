import { track, trigger } from "./effect";

// 缓存处理
const get = createGetter();
const set = createSetter();

const readonlyGet = createGetter(true);
function createGetter(isReadonly = false) {
  return function get(target: any, key: string) {
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
