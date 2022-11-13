export interface RuntimeDomApi {
    createElement: (type: string) => HTMLElement;
    patchProp: (
        el: HTMLElement,
        key: string,
        preVal: any,
        nextVal: any
    ) => void;
    insert: (
        child: HTMLElement,
        parent: HTMLElement,
        anchor?: HTMLElement | null
    ) => void;
    remove: (child: any) => void;
    setElementText: (el: HTMLElement, text: string) => void;
}
