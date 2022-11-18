import { proxyRefs } from "../reactivity";
import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { publicInstanceProxyHandlers } from "./componentPublishInstance";
import { initSlots, SlotChildren } from "./componentSlots";
import { Instance, VNode } from "./models";
/**
 * 创建组件实例
 * @param vnode
 * @param parent
 * @returns
 */
export function createComponentInstance(vnode: VNode, parent?: Instance) {
    const component: Instance = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        next: null,
        isMounted: false,
        subTree: {},
        emit: () => {},
    };

    // 绑定emit函数this指针
    component.emit = emit.bind(null, component) as any;

    return component;
}

/**
 * 初始化
 * @param instance
 */
export function setupComponent(instance: Instance) {
    initSlots(instance, instance.vnode.children as SlotChildren);
    initProps(instance, instance.vnode.props);
    setupStatefulComponent(instance);
}
/**
 * 初始化instance.proxy,调用setup函数并获取结果
 * @param instance
 */
function setupStatefulComponent(instance: Instance) {
    const Component = instance.type;

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
/**
 * 处理setup函数返回的结果
 * @param instance
 * @param setupResult
 */
function handleSetupResult(instance: Instance, setupResult: any) {
    if (typeof setupResult === "object") {
        // 确保在render函数中可以直接获取ref数据的值而不用通过.value
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}

/**
 * 完成setup阶段并将render函数赋值给组件实例
 * @param instance
 */
function finishComponentSetup(instance: Instance) {
    const Component = instance.type;

    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}

let currentInstance: Instance | null = null;
/**
 * 获取组件实例
 * @returns
 */
export function getCurrentInstance() {
    return currentInstance;
}

/**
 * 设置组件实例
 * @param instance
 */
export function setCurrentInstance(instance: Instance) {
    currentInstance = instance;
}

let compiler: Function;
/**
 * 注册compiler函数
 * @param _compiler
 */
export function registerRuntimeCompiler(_compiler: Function) {
    compiler = _compiler;
}
