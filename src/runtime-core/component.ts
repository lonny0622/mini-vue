import { proxyRefs } from "../reactivity";
import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { publicInstanceProxyHandlers } from "./componentPublishInstance";
import { initSlots } from "./componentSlots";
import { Instance } from "./models";

export function createComponentInstance(vnode: any, parent?: Instance) {
    const component: Instance = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => {},
    };

    component.emit = emit.bind(null, component) as any;

    return component;
}

export function setupComponent(instance: Instance) {
    initSlots(instance, instance.vnode.children);
    initProps(instance, instance.vnode.props);
    setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: Instance) {
    const Component = instance.type;

    //ctx
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
    const { setup } = Component;

    if (setup) {
        setCurrentInstance(instance);

        // function or object
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        currentInstance = null;
        handleSetupResult(instance, setupResult);
    }
}

function handleSetupResult(instance: Instance, setupResult: any) {
    // function object
    // TODO: 后续要实现function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance: Instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

let currentInstance: Instance | null = null;

export function getCurrentInstance() {
    return currentInstance;
}

export function setCurrentInstance(instance: Instance) {
    currentInstance = instance;
}
