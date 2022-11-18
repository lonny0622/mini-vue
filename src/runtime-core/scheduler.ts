const queue: any[] = [];

const p = Promise.resolve();
let isFlushPending = false;
/**
 * 通过Promise函数实现nextTick
 * @param fn
 * @returns
 */
export function nextTick(fn?: () => void) {
    return fn ? p.then(fn) : p;
}

/**
 * 将任务加入队列
 * @param job
 */
export function queueJobs(job: any) {
    if (!queue.includes(job)) {
        queue.push(job);
    }

    queueFlush();
}
/**
 * 执行任务
 */
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}
/**
 * 通过nextTick调用任务队列
 */
function queueFlush() {
    // 如果正在刷新阶段则暂停入队
    if (isFlushPending) return;
    isFlushPending = true;
    nextTick(flushJobs);
}
