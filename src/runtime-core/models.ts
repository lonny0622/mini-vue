export interface VNode {
    type: string | Symbol | Object;
    props?: any;
    children?: string | any[];
    shapeFlag: number;
    el: any;
}

export interface Instance {
    vnode: VNode;
    type: any;
    setupState: any;
    props: any;
    slots: any;
    proxy?: any;
    setup?: Function;
    render?: Function;
    emit: Function;
}
