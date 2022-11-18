import { ShapeFlags } from "../shared/ShapeFlags";
import { Instance, VNode } from "./models";

export interface SlotChildren {
    [key: string]: (props: any) => VNode;
}
export interface Slots {
    [key: string]: (props: any) => VNode[];
}
/**
 * 初始化插槽
 * @param instance
 * @param children
 */
export function initSlots(instance: Instance, children: SlotChildren) {
    const { vnode } = instance;
    if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
        normalizeObjectSlots(children, instance.slots);
    }
}

/**
 * 设置插槽的值
 * @param children
 * @param slots
 */
function normalizeObjectSlots(children: SlotChildren, slots: Slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props: any) => normalizeSlotValue(value(props));
    }
}
/**
 * 将插槽的内容都转为数组
 * @param value
 * @returns
 */
function normalizeSlotValue(value: VNode | VNode[]) {
    return Array.isArray(value) ? value : [value];
}
