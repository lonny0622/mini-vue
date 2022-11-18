import { getCurrentInstance } from "./component";

/**
 * 用于向后代组件传值
 * @param key
 * @param val
 */
export function provide(key: string, val: any) {
    // 获取当前组件实例
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 获取父组件的provides 并进行对比，如果相同则说明父组件也传递了provide,为了使后代能获取所有祖先传递的值，则需要继承父组件的provide
        // 然后再将值赋值给provide
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent?.provides;

        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }

        provides[key] = val;
    }
}
/**
 * 获取祖先组件传递过来的值
 * @param key
 * @param defaultValue 获取不到时返回这个默认值
 * @returns
 */
export function inject(key: string, defaultValue: any) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 从父组件的provides中查找所需的值，没有的话则返回默认值
        const parentProvides = currentInstance.parent?.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        } else {
            if (typeof defaultValue === "function") {
                return defaultValue();
            } else {
                return defaultValue;
            }
        }
    }
}
