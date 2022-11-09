const publicPropertiesMap: any = {
    $el: (i: any) => i.vnode.el,
};

export const publicInstanceProxyHandlers = {
    get({ _: instance }: any, key: string) {
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }

        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};
