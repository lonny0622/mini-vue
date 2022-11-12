export interface RuntimeApi {
    createElement: (type: string) => HTMLElement;
    patchProp: (
        el: HTMLElement,
        key: string,
        preVal: any,
        nextVal: any
    ) => void;
    insert: (el: HTMLElement, container: HTMLElement) => void;
    remove: (child: any) => void;
    setElementText: (el: HTMLElement, text: string) => void;
}
