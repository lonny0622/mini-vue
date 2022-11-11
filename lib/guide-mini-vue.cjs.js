'use strict';

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
        else {
            return createVNode(Fragment, {}, slot);
        }
    }
}

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const isHasChange = (oldValue, newValue) => {
    return !Object.is(oldValue, newValue);
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
// add => Add
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
// add-foo => addFoo
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

//保证只有一个活动的effect
let activeEffect;
let shouldTrack = false;
class ReactiveEffect {
    constructor(fn, scheduler) {
        // 传入 scheduler 时会在状态改变时调用 scheduler 而不是 effect
        this.scheduler = null;
        // 保存所有依赖便于stop清空
        this.deps = [];
        // 用于记录当前跟踪状态，调用stop后停止跟踪，不会自动触发effect
        this._active = true;
        this._fn = fn;
        if (scheduler)
            this.scheduler = scheduler;
    }
    run() {
        activeEffect = this;
        // 会收集依赖
        // shouldTrack来做区分
        if (!this._active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        // reset
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this._active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this._active = false;
        }
    }
}
//删除effect
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => dep.delete(effect));
    effect.deps.length = 0;
}
//用于保存不同对象的depsMap
const targetMap = new WeakMap();
function track(target, key) {
    if (!isTracking())
        return;
    // target -> key -> dep
    // const dep = new Set();
    // 先获取到指定对象的depsMap
    let depsMap = targetMap.get(target);
    //如果不存在则添加一个
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    //如果该属性的dep还没有被映射上去，我们将这个dep映射到depsMap
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    //并存储effect
    dep.add(activeEffect);
    //同时保存对应的dep以方便调用stop时进行删除
    activeEffect.deps.push(dep);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trigger(target, key) {
    //先获取指定对象的depsMap，没有就直接返回
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    //首先我们要通过key获取这个属性的dep
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    if (dep) {
        //遍历dep运行里面的effect
        dep.forEach((effect) => {
            if (effect.scheduler) {
                effect.scheduler();
            }
            else {
                effect.run();
            }
        });
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

// 缓存处理
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__V_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow)
            return res;
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            // 依赖收集
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        // 给出警告
        console.warn(`该 ${target} 为 readonly 无法为 ${key} 赋值`);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(target, handlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} must be an object!`);
        return target;
    }
    return new Proxy(target, handlers);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        // 保存原始值，便于之后对比
        this._rawValue = value;
        // value => reactive
        // 判断 value 是否是对象,如果是对象则将它转化成reactive
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 只有value的值改变后才触发trigger
        if (isHasChange(this._value, newValue)) {
            // 保存原始值
            this._rawValue = newValue;
            // 如果是对象则转化成reactive
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
function trackRefValue(ref) {
    if (isTracking())
        trackEffects(ref.dep);
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    //判断是不是ref对象
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            // 判断是否为ref对象是就返回.value,不是就直接返回它本身
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}

function emit(instance, event, ...args) {
    console.log("emit", event);
    const { props } = instance;
    // TPP 开发模式
    // 先去写一个特定的行为 =》 重构成通用的行为
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initSlots(instance, instance.vnode.children);
    initProps(instance, instance.vnode.props);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
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
function handleSetupResult(instance, setupResult) {
    // function object
    // TODO: 后续要实现function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, val) {
    var _a;
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = val;
    }
}
function inject(key, defaultValue) {
    var _a;
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            else {
                return defaultValue;
            }
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                //先转换成虚拟节点(vnode),所有的逻辑操作都会基于 vnode做处理
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, } = options;
    function render(vnode, container, parentComponent) {
        // patch
        //
        patch(null, vnode, container, parentComponent);
    }
    function patch(n1, n2, container, parentComponent) {
        const { type, shapeFlag } = n2;
        // Fragment -> 只渲染 children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 判断是不是 element
                // 是element 就应该处理 element
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
        }
    }
    function processFragment(n1, n2, container, parentComponent) {
        // Implement
        mountChildren(n2, container, parentComponent);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2);
        }
    }
    function patchElement(n1, n2, container) {
        console.log("patchElement");
        console.log({ n1, n2 });
        const oldProps = (n1 === null || n1 === void 0 ? void 0 : n1.props) || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1 === null || n1 === void 0 ? void 0 : n1.el);
        patchProps(el, oldProps, newProps);
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode, el, parentComponent);
        }
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container);
    }
    function mountChildren(vnode, container, parentComponent) {
        if (vnode.children && Array.isArray(vnode.children))
            vnode.children.forEach((v) => {
                patch(null, v, container, parentComponent);
            });
    }
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initialVnode, container, parentComponent) {
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    function setupRenderEffect(instance, initialVnode, container) {
        effect(() => {
            var _a, _b;
            if (!instance.isMounted) {
                console.log("init");
                const { proxy } = instance;
                const subTree = (instance.subTree =
                    (_a = instance.render) === null || _a === void 0 ? void 0 : _a.call(proxy));
                console.log(subTree);
                // vnode => patch
                // vnode => element => mountElement
                patch(null, subTree, container, instance);
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log("update");
                const { proxy } = instance;
                const subTree = (_b = instance.render) === null || _b === void 0 ? void 0 : _b.call(proxy);
                console.log({ subTree });
                const prevSubTree = instance.subTree;
                console.log({ prevSubTree });
                instance.subTree = subTree;
                // vnode => patch
                // vnode => element => mountElement
                patch(prevSubTree, subTree, container, instance);
                // initialVnode.el = subTree.el;
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    // console.log("-------------createElement----------------");
    return document.createElement(type);
}
function patchProp(el, key, preVal, nextVal) {
    // console.log("---------------patchProp------------------");
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, container) {
    // console.log("----------------insert--------------------");
    container.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
