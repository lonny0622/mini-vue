import { shallowReadonly } from "../reactivity/reactive";
import { initProps } from "./componentProps";
import { publicInstanceProxyHandlers } from "./componentPublishInstance";

export function createComponentInstance(vnode: any) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
    };
    return component;
}

export function setupComponent(instance: any) {
    // TODO:
    // initSlots()
    initProps(instance, instance.vnode.props);
    setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
    const Component = instance.type;

    //ctx
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
    const { setup } = Component;

    if (setup) {
        // function or object
        const setupResult = setup(shallowReadonly(instance.props));

        handleSetupResult(instance, setupResult);
    }
}

function handleSetupResult(instance: { setupState: any }, setupResult: any) {
    // function object
    // TODO: 后续要实现function
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance: any) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
