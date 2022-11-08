export function createComponentInstance(vnode: any) {
    const component = {
        vnode,
        type: vnode.type,
    };
}

export function setupComponent(instance: any) {
    // TODO:
    // initProps()
    // initSlots()

    setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
    const Component = instance.type;

    const { setup } = Component;

    if (setup) {
        // function or object
        const setupResult = setup();

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
}
