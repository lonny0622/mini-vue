const queue: any[] = [];

const p = Promise.resolve();
let isFlushPending = false;

export function nextTick(fn?: () => void) {
    return fn ? p.then(fn) : p;
}

export function queueJobs(job: any) {
    if (!queue.includes(job)) {
        queue.push(job);
    }

    queueFlush();
}

function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function queueFlush() {
    if (isFlushPending) return;
    isFlushPending = true;
    nextTick(flushJobs);
}