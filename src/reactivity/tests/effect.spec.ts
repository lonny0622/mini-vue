import { effect, stop } from "../effect";
import { reactive } from "../reactive";

describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });

    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });
    expect(nextAge).toBe(11);

    //update
    user.age++;
    expect(nextAge).toBe(12);
  });
  it("should return effect runner", () => {
    // 1. effect(fn) -> function (runner) -> fn -> return
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });
    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });
  it("scheduler", () => {
    // 1. 通过 effect 的第二个参数给定的一个 scheduler 的 fn
    // 2. effect 第一次执行时还会执行 fn
    // 3. 当响应式对象 set update 不会执行 fn 而是执行 scheduler
    // 4. 如果说执行 runner 的时候，会再次执行 fn
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    // 第一次调用时会触发 effect 不会触发scheduler
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);

    // 再次调用时 不会触发effect 而是触发scheduler
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(dummy).toBe(1);

    //需要要调用指定的run触发
    run();
    expect(dummy).toBe(2);
  });
  it("stop", () => {
    let dummpy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummpy = obj.prop;
    });
    obj.prop = 2;
    expect(dummpy).toBe(2);
    // 调用stop后停止触发effect
    stop(runner);
    obj.prop = 3;
    // 手动正常触发
    runner();
    expect(dummpy).toBe(3);
  });
});
