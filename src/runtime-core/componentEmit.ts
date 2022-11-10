import { camelize, toHandlerKey } from "../shared";

export function emit(instance: any, event: string, ...args: any[]) {
    console.log("emit", event);
    const { props } = instance;
    // TPP 开发模式
    // 先去写一个特定的行为 =》 重构成通用的行为

    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}
