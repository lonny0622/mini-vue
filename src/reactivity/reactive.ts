import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

export function reactive(raw: any) {
  return createActivityObject(raw, mutableHandlers);
}

export function readonly(raw: any) {
  return createActivityObject(raw, readonlyHandlers);
}

function createActivityObject(raw: any, handlers: any) {
  return new Proxy(raw, handlers);
}
