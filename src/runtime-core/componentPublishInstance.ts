import { hasOwn } from "../shared";
import { Instance } from "./models";
// 引入关键字
const publicPropertiesMap: any = {
    $el: (i: Instance) => i.vnode.el,
    $slots: (i: Instance) => i.slots,
    $props: (i: Instance) => i.props,
};

/**
 * Proxy处理函数，使组件可以通过this.$获取需要的数据
 */
export const publicInstanceProxyHandlers = {
    get({ _: instance }: any, key: string) {
        const { setupState, props } = instance;

        if (hasOwn(setupState, key)) {
            return setupState[key];
        } else if (hasOwn(props, key)) {
            return props[key];
        }

        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};
