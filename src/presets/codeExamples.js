export const CODE_PRESETS = [
  {
    id: 'basic-event-loop',
    title: '1. Basic Event Loop (Promise vs setTimeout)',
    difficulty: 'Beginner',
    description: 'Classic interview question demonstrating the priority of synchronous code, Microtasks (Promise), and Macrotasks (setTimeout).',
    code: `console.log('1. Script start');

setTimeout(() => {
  console.log('2. setTimeout callback (Macrotask)');
}, 0);

Promise.resolve().then(() => {
  console.log('3. Promise.then callback (Microtask)');
});

console.log('4. Script end');`
  },
  {
    id: 'nexttick-setimmediate',
    title: '2. Node.js Event Loop (process.nextTick & setImmediate)',
    difficulty: 'Advanced',
    description: 'Demonstrates how process.nextTick runs before Promise microtasks, and setImmediate runs in the Macrotask Check phase.',
    code: `console.log('1. Start script');

setTimeout(() => {
  console.log('2. setTimeout 0ms');
}, 0);

setImmediate(() => {
  console.log('3. setImmediate callback');
});

Promise.resolve().then(() => {
  console.log('4. Promise.then callback');
});

process.nextTick(() => {
  console.log('5. process.nextTick (Top Microtask Priority)');
});

console.log('6. End script');`
  },
  {
    id: 'async-await-order',
    title: '3. Async / Await Execution Flow',
    difficulty: 'Intermediate',
    description: 'Shows how code inside an async function runs synchronously until the first `await`, after which the remainder is queued as a microtask.',
    code: `async function async1() {
  console.log('1. async1 start');
  await async2();
  console.log('2. async1 end (after await microtask)');
}

async function async2() {
  console.log('3. async2 body');
}

console.log('4. Script start');

setTimeout(() => {
  console.log('5. setTimeout (Macrotask)');
}, 0);

async1();

new Promise((resolve) => {
  console.log('6. Promise constructor');
  resolve();
}).then(() => {
  console.log('7. Promise.then (Microtask)');
});

console.log('8. Script end');`
  },
  {
    id: 'nested-microtasks',
    title: '4. Chained & Nested Microtasks',
    difficulty: 'Intermediate',
    description: 'Demonstrates how microtasks created inside other microtasks are processed in the SAME loop iteration before macrotasks.',
    code: `console.log('1. Start');

setTimeout(() => {
  console.log('2. Macrotask 1');
}, 0);

Promise.resolve().then(() => {
  console.log('3. Microtask 1');
  return Promise.resolve();
}).then(() => {
  console.log('4. Microtask 2 (chained)');
});

queueMicrotask(() => {
  console.log('5. queueMicrotask 1');
  queueMicrotask(() => {
    console.log('6. Nested queueMicrotask');
  });
});

console.log('7. End');`
  },
  {
    id: 'multiple-timers',
    title: '5. Web API Timers & Delays',
    difficulty: 'Beginner',
    description: 'Observe how Web APIs handle countdown timers and move callbacks into the Macrotask Queue based on delay.',
    code: `console.log('1. Script Start');

setTimeout(() => {
  console.log('2. Timer 100ms done');
}, 100);

setTimeout(() => {
  console.log('3. Timer 0ms done');
}, 0);

Promise.resolve().then(() => {
  console.log('4. Microtask executed');
});

console.log('5. Script End');`
  },
  {
    id: 'starvation',
    title: '6. Microtask Queue Starvation',
    difficulty: 'Advanced',
    description: 'Shows how an infinite chain of microtasks starves the macrotask queue (setTimeout never gets to run!).',
    code: `console.log('1. Start execution');

setTimeout(() => {
  console.log('2. Macrotask callback (Should run eventually)');
}, 0);

function scheduleMicrotask(count) {
  if (count >= 3) return;
  Promise.resolve().then(() => {
    console.log('3. Microtask step ' + count);
    scheduleMicrotask(count + 1);
  });
}

scheduleMicrotask(1);

console.log('4. End synchronous script');`
  },
  {
    id: 'variables-scope',
    title: '7. Variables & Scope with Async Code',
    difficulty: 'Beginner',
    description: 'Track variable values, closures, and state mutations across event loop phases.',
    code: `let count = 0;
console.log('Initial count:', count);

count += 10;

setTimeout(() => {
  count += 5;
  console.log('Inside setTimeout count:', count);
}, 0);

Promise.resolve().then(() => {
  count *= 2;
  console.log('Inside Microtask count:', count);
});

console.log('Final sync count:', count);`
  }
];
