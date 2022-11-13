export interface VNode {
    type: string | Symbol | Object;
    props?: any;
    children?: string | any[];
    component: Instance | null;
    shapeFlag: number;
    key?: string;
    el: any;
}

export interface Instance {
    vnode: VNode;
    type: any;
    setupState: any;
    props: any;
    slots: any;
    next?: VNode | null;
    update?: any;
    isMounted: boolean;
    subTree: any;
    proxy?: any;
    setup?: Function;
    render?: Function;
    parent?: Instance;
    provides: any;
    emit: Function;
}
