import {
  mutableHandlers,
  ReactiveFlags,
  readonlyHandlers,
} from "./baseHandlers";

export function reactive(raw: any) {
  return createActivityObject(raw, mutableHandlers);
}

export function readonly(raw: any) {
  return createActivityObject(raw, readonlyHandlers);
}

export function isReactive(value: any) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value: any) {
  return !!value[ReactiveFlags.IS_READONLY];
}

function createActivityObject(raw: any, handlers: any) {
  return new Proxy(raw, handlers);
}
