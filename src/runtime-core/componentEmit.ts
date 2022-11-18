import { camelize, toHandlerKey } from "../shared";

/**
 * 实现emit的功能子组件调用父组件函数
 * @param instance
 * @param event
 * @param args
 */
export function emit(instance: any, event: string, ...args: any[]) {
    const { props } = instance;
    // TPP 开发模式
    // 先去写一个特定的行为 =》 重构成通用的行为

    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}
