export interface VNode {
    type: string;
    props?: any;
    children?: string | any[];
    shapeFlag: number;
    el: any;
}
