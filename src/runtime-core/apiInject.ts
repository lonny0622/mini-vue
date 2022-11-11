import { getCurrentInstance } from "./component";

export function provide(key: string, val: any) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent?.provides;

        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }

        provides[key] = val;
    }
}

export function inject(key: string, defaultValue: any) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent?.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        } else {
            if (typeof defaultValue === "function") {
                return defaultValue();
            } else {
                return defaultValue;
            }
        }
    }
}
