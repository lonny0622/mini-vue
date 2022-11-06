import { computed } from "../computed";
import { reactive } from "../reactive";

describe("computed", () => {
    it("happy path", () => {
        const user = reactive({
            age: 1,
        });
        const age = computed(() => {
            return user.age;
        });
        expect(age.value).toBe(1);
    });
    it("should compute lazily", () => {
        const value = reactive({
            foo: 1,
        });
        const getter = jest.fn(() => {
            return value.foo;
        });
        const cValue = computed(getter);
        // lazy
        expect(getter).not.toHaveBeenCalled();

        expect(cValue.value).toBe(1);
        expect(getter).toHaveBeenCalledTimes(1);

        // 数据缓存不会重复调用
        expect(cValue.value).toBe(1);
        expect(getter).toHaveBeenCalledTimes(1);

        // 依赖变化时不会直接重新计算，而是调用get时进行计算并缓存
        value.foo = 2;
        expect(getter).toHaveBeenCalledTimes(1);
        // 依赖变化时重新计算
        expect(cValue.value).toBe(2);
        expect(getter).toHaveBeenCalledTimes(2);

        // 数据缓存不会重新计算
        cValue.value;
        expect(getter).toHaveBeenCalledTimes(2);
    });
});
