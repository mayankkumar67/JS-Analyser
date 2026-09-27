import * as parser from '@babel/parser';

export function parseAndGenerateSteps(codeText) {
  try {
    const ast = parser.parse(codeText, {
      sourceType: 'script',
      plugins: ['jsx', 'asyncGenerators']
    });

    return runSimulation(ast, codeText);
  } catch (err) {
    const errorLine = err.loc ? err.loc.line : 1;
    const errorCol = err.loc ? err.loc.column : 1;
    return {
      success: false,
      error: {
        message: err.message.replace(/\s*\(\d+:\d+\)$/, ''),
        line: errorLine,
        column: errorCol
      },
      steps: [
        {
          id: 1,
          type: 'error',
          line: errorLine,
          loc: { startLine: errorLine, startCol: errorCol, endLine: errorLine, endCol: errorCol + 5 },
          description: `Syntax Error at line ${errorLine}: ${err.message}`,
          detailedExplanation: `The JavaScript engine failed to parse the code due to a syntax error: "${err.message}". Please fix the code syntax to analyze execution steps.`,
          callStack: [],
          webApis: [],
          microtaskQueue: [],
          macrotaskQueue: [],
          consoleOutput: [{ id: 'err-1', text: `SyntaxError: ${err.message}`, type: 'error', line: errorLine }],
          variables: {},
          eventLoopState: {
            phase: 'ERROR',
            activePointer: 'none',
            activePhaseDescription: 'Parsing Error'
          }
        }
      ]
    };
  }
}

function runSimulation(ast, originalCode) {
  const steps = [];
  let stepIdCounter = 1;

  // State containers
  let callStack = [];
  let webApis = [];
  let microtaskQueue = [];
  let macrotaskQueue = [];
  let consoleOutput = [];
  let scope = {};
  let functionsMap = {}; // name -> ast node

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function addStep({
    type = 'sync',
    line = 1,
    loc = null,
    description = '',
    detailedExplanation = '',
    phase = 'CALL_STACK',
    activePointer = 'stack',
    activePhaseDescription = ''
  }) {
    steps.push({
      id: stepIdCounter++,
      type,
      line,
      loc: loc || { startLine: line, startCol: 0, endLine: line, endCol: 100 },
      description,
      detailedExplanation,
      callStack: clone(callStack),
      webApis: clone(webApis),
      microtaskQueue: clone(microtaskQueue),
      macrotaskQueue: clone(macrotaskQueue),
      consoleOutput: clone(consoleOutput),
      variables: clone(scope),
      eventLoopState: {
        phase,
        activePointer,
        activePhaseDescription: activePhaseDescription || description
      }
    });
  }

  // Helper to push microtasks respecting process.nextTick top priority
  function pushMicrotask(item) {
    if (item.type === 'process.nextTick') {
      // Find insertion index after existing nextTicks
      let insertIdx = 0;
      while (insertIdx < microtaskQueue.length && microtaskQueue[insertIdx].type === 'process.nextTick') {
        insertIdx++;
      }
      microtaskQueue.splice(insertIdx, 0, item);
    } else {
      microtaskQueue.push(item);
    }
  }

  // Initial Step
  callStack.push({
    id: 'frame-main',
    name: '(anonymous main script)',
    type: 'global',
    line: 1,
    code: 'Global Script Execution Context'
  });

  addStep({
    type: 'sync',
    line: 1,
    description: 'Global Execution Context created. Code evaluation begins.',
    detailedExplanation: 'The JS Engine creates the Global Execution Context and pushes `(anonymous main script)` onto the Call Stack. Synchronous execution begins top-to-bottom.',
    phase: 'CALL_STACK',
    activePointer: 'stack',
    activePhaseDescription: 'Executing Main Script'
  });

  // Pre-pass: Collect function declarations
  ast.program.body.forEach(node => {
    if (node.type === 'FunctionDeclaration' && node.id) {
      functionsMap[node.id.name] = node;
      scope[node.id.name] = `<function ${node.id.name}>`;
    }
  });

  // Execute body statements
  executeStatements(ast.program.body);

  // Synchronous script finishes
  const mainFrame = callStack.pop();
  addStep({
    type: 'sync',
    line: getLastLine(originalCode),
    description: 'Main script execution completed. Call Stack is now empty.',
    detailedExplanation: 'The main synchronous script has finished executing. The Global Execution Context is popped from the Call Stack. Control is handed over to the Event Loop.',
    phase: 'CHECKING_MICRO_QUEUE',
    activePointer: 'none',
    activePhaseDescription: 'Main Script Finished -> Event Loop Active'
  });

  // EVENT LOOP DRAIN PROCESS
  let eventLoopLoopGuard = 0;
  const MAX_EVENT_LOOP_TICKS = 150;

  while (
    (microtaskQueue.length > 0 || macrotaskQueue.length > 0 || webApis.length > 0) &&
    eventLoopLoopGuard < MAX_EVENT_LOOP_TICKS
  ) {
    eventLoopLoopGuard++;

    // 1. Process timers ready in Web APIs -> Macrotask Queue
    if (webApis.length > 0) {
      const readyTimers = [...webApis];
      webApis = [];

      readyTimers.forEach(timer => {
        macrotaskQueue.push({
          id: `macro-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          label: timer.label,
          type: 'setTimeout callback',
          sourceLine: timer.line,
          code: timer.codeStr || 'setTimeout callback',
          astNode: timer.astNode,
          args: timer.args || []
        });

        addStep({
          type: 'webapi',
          line: timer.line,
          description: `Web API timer elapsed (${timer.delay}ms). Callback moved to Macrotask Queue.`,
          detailedExplanation: `The Web API timer for \`${timer.label}\` completed after ${timer.delay}ms. Browser API moves the callback function into the Macrotask Queue (Callback Queue).`,
          phase: 'CHECKING_MACRO_QUEUE',
          activePointer: 'macrotask',
          activePhaseDescription: 'Web API Timer ready -> Macrotask Queue'
        });
      });
    }

    // 2. Process ALL Microtasks in Microtask Queue (including process.nextTick and Promise microtasks)
    if (microtaskQueue.length > 0) {
      addStep({
        type: 'eventloop_check',
        line: microtaskQueue[0].sourceLine || 1,
        description: `Event Loop checking Microtask Queue (${microtaskQueue.length} microtask(s) pending).`,
        detailedExplanation: 'Before inspecting macrotasks or rendering, the Event Loop drains the ENTIRE Microtask Queue (process.nextTick, Promise callbacks, queueMicrotask).',
        phase: 'DRAINING_MICROTASKS',
        activePointer: 'microtask',
        activePhaseDescription: 'Draining Microtask Queue'
      });

      while (microtaskQueue.length > 0 && eventLoopLoopGuard < MAX_EVENT_LOOP_TICKS) {
        const microtask = microtaskQueue.shift();

        // Push to Call Stack
        callStack.push({
          id: `frame-${microtask.id}`,
          name: microtask.label,
          type: microtask.type || 'microtask',
          line: microtask.sourceLine || 1,
          code: microtask.code || 'microtask callback'
        });

        addStep({
          type: 'microtask',
          line: microtask.sourceLine || 1,
          description: `Event Loop popped microtask \`${microtask.label}\` to Call Stack.`,
          detailedExplanation: `Microtask (\`${microtask.type}\`) popped from Microtask Queue into the Call Stack for execution.`,
          phase: 'CALL_STACK',
          activePointer: 'stack',
          activePhaseDescription: `Executing Microtask: ${microtask.label}`
        });

        // Execute microtask AST callback
        if (microtask.astNode) {
          executeCallbackNode(microtask.astNode, microtask.scopeValues);
        } else if (microtask.continuationStatements) {
          executeStatements(microtask.continuationStatements);
        }

        callStack.pop();

        addStep({
          type: 'microtask',
          line: microtask.sourceLine || 1,
          description: `Microtask \`${microtask.label}\` completed. Popped from Call Stack.`,
          detailedExplanation: `Execution of microtask callback completed. Frame removed from Call Stack.`,
          phase: 'DRAINING_MICROTASKS',
          activePointer: 'microtask',
          activePhaseDescription: 'Microtask Finished'
        });
      }
    }

    // 3. Process ONE Macrotask from Macrotask Queue (setTimeout, setImmediate)
    if (macrotaskQueue.length > 0 && microtaskQueue.length === 0) {
      addStep({
        type: 'eventloop_check',
        line: macrotaskQueue[0].sourceLine || 1,
        description: `Call Stack & Microtask Queue empty. Event Loop checking Macrotask Queue (${macrotaskQueue.length} pending).`,
        detailedExplanation: 'Since Call Stack is empty and Microtask Queue is completely drained, Event Loop picks ONE task from the Macrotask Queue.',
        phase: 'CHECKING_MACRO_QUEUE',
        activePointer: 'macrotask',
        activePhaseDescription: 'Event Loop picking Macrotask'
      });

      const macrotask = macrotaskQueue.shift();

      callStack.push({
        id: `frame-${macrotask.id}`,
        name: macrotask.label,
        type: macrotask.type || 'macrotask',
        line: macrotask.sourceLine || 1,
        code: macrotask.code || 'macrotask callback'
      });

      addStep({
        type: 'macrotask',
        line: macrotask.sourceLine || 1,
        description: `Event Loop popped Macrotask \`${macrotask.label}\` to Call Stack.`,
        detailedExplanation: `Macrotask callback moved onto Call Stack to execute.`,
        phase: 'CALL_STACK',
        activePointer: 'stack',
        activePhaseDescription: `Executing Macrotask: ${macrotask.label}`
      });

      if (macrotask.astNode) {
        executeCallbackNode(macrotask.astNode, macrotask.args);
      }

      callStack.pop();

      addStep({
        type: 'macrotask',
        line: macrotask.sourceLine || 1,
        description: `Macrotask \`${macrotask.label}\` execution finished. Popped from Call Stack.`,
        detailedExplanation: `Macrotask callback execution finished. Control returns to Event Loop.`,
        phase: 'CHECKING_MICRO_QUEUE',
        activePointer: 'none',
        activePhaseDescription: 'Macrotask Complete'
      });
    }
  }

  // ALL DONE
  addStep({
    type: 'finished',
    line: getLastLine(originalCode),
    description: 'Execution complete! Call stack, Microtasks, and Macrotasks are all empty.',
    detailedExplanation: 'The Event Loop has completed processing all synchronous code, promises, process.nextTick, setImmediate, and timer callbacks. Engine is idle.',
    phase: 'FINISHED',
    activePointer: 'none',
    activePhaseDescription: 'Event Loop Idle'
  });

  return {
    success: true,
    steps
  };

  // Helper functions for statement execution
  function executeStatements(statements) {
    if (!statements || !Array.isArray(statements)) return;

    for (const stmt of statements) {
      executeStatement(stmt);
    }
  }

  function executeStatement(stmt) {
    const line = stmt.loc ? stmt.loc.start.line : 1;
    const loc = stmt.loc ? {
      startLine: stmt.loc.start.line,
      startCol: stmt.loc.start.column,
      endLine: stmt.loc.end.line,
      endCol: stmt.loc.end.column
    } : null;

    switch (stmt.type) {
      case 'VariableDeclaration': {
        stmt.declarations.forEach(decl => {
          const varName = decl.id.name;
          let val = undefined;
          if (decl.init) {
            val = evaluateExpression(decl.init);
          }
          scope[varName] = val;

          addStep({
            type: 'sync',
            line,
            loc,
            description: `Declared variable \`${varName}\` = ${formatValue(val)}.`,
            detailedExplanation: `Variable \`${varName}\` declared and assigned value ${formatValue(val)} in current execution context scope.`,
            phase: 'CALL_STACK',
            activePointer: 'stack'
          });
        });
        break;
      }

      case 'ExpressionStatement': {
        evaluateExpression(stmt.expression, line, loc);
        break;
      }

      case 'FunctionDeclaration': {
        break;
      }

      case 'IfStatement': {
        const testResult = evaluateExpression(stmt.test, line, loc);
        addStep({
          type: 'sync',
          line,
          loc,
          description: `Evaluating if condition (${testResult ? 'true' : 'false'}).`,
          detailedExplanation: `If statement condition evaluated to ${testResult}.`,
          phase: 'CALL_STACK',
          activePointer: 'stack'
        });

        if (testResult) {
          if (stmt.consequent.type === 'BlockStatement') {
            executeStatements(stmt.consequent.body);
          } else {
            executeStatement(stmt.consequent);
          }
        } else if (stmt.alternate) {
          if (stmt.alternate.type === 'BlockStatement') {
            executeStatements(stmt.alternate.body);
          } else {
            executeStatement(stmt.alternate);
          }
        }
        break;
      }

      case 'ForStatement': {
        if (stmt.init) {
          if (stmt.init.type === 'VariableDeclaration') {
            executeStatement(stmt.init);
          } else {
            evaluateExpression(stmt.init, line, loc);
          }
        }

        let loopGuard = 0;
        while (loopGuard < 20) {
          loopGuard++;
          let testVal = true;
          if (stmt.test) {
            testVal = evaluateExpression(stmt.test, line, loc);
          }
          if (!testVal) break;

          if (stmt.body.type === 'BlockStatement') {
            executeStatements(stmt.body.body);
          } else {
            executeStatement(stmt.body);
          }

          if (stmt.update) {
            evaluateExpression(stmt.update, line, loc);
          }
        }
        break;
      }

      default:
        break;
    }
  }

  function evaluateExpression(expr, line = 1, loc = null) {
    if (!expr) return undefined;

    switch (expr.type) {
      case 'Literal':
      case 'NumericLiteral':
      case 'StringLiteral':
      case 'BooleanLiteral':
        return expr.value;

      case 'Identifier':
        return scope[expr.name];

      case 'BinaryExpression': {
        const left = evaluateExpression(expr.left, line, loc);
        const right = evaluateExpression(expr.right, line, loc);
        switch (expr.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return left / right;
          case '<=': return left <= right;
          case '>=': return left >= right;
          case '<': return left < right;
          case '>': return left > right;
          case '===': return left === right;
          case '==': return left == right;
          default: return left + right;
        }
      }

      case 'AssignmentExpression': {
        const varName = expr.left.name;
        const rightVal = evaluateExpression(expr.right, line, loc);
        let newVal = rightVal;
        if (expr.operator === '+=') newVal = (scope[varName] || 0) + rightVal;
        if (expr.operator === '-=') newVal = (scope[varName] || 0) - rightVal;
        if (expr.operator === '*=') newVal = (scope[varName] || 0) * rightVal;

        scope[varName] = newVal;

        addStep({
          type: 'sync',
          line,
          loc,
          description: `Updated variable \`${varName}\` = ${formatValue(newVal)}.`,
          detailedExplanation: `Reassigned variable \`${varName}\` to ${formatValue(newVal)} in scope.`,
          phase: 'CALL_STACK',
          activePointer: 'stack'
        });
        return newVal;
      }

      case 'UpdateExpression': {
        const varName = expr.argument.name;
        let val = scope[varName] || 0;
        if (expr.operator === '++') scope[varName] = val + 1;
        if (expr.operator === '--') scope[varName] = val - 1;
        return scope[varName];
      }

      case 'CallExpression': {
        return handleCallExpression(expr, line, loc);
      }

      case 'NewExpression': {
        if (expr.callee.name === 'Promise') {
          const executorNode = expr.arguments[0];
          let promiseResolved = false;

          const resolveFn = () => {
            promiseResolved = true;
          };

          callStack.push({
            id: `frame-promise-exec-${Date.now()}`,
            name: 'new Promise (executor)',
            type: 'sync',
            line,
            code: 'Promise Executor Callback'
          });

          addStep({
            type: 'sync',
            line,
            loc,
            description: '`new Promise(...)` constructor called. Executor runs synchronously!',
            detailedExplanation: 'Important: The function passed to `new Promise((resolve) => { ... })` runs SYNCHRONOUSLY immediately when created.',
            phase: 'CALL_STACK',
            activePointer: 'stack'
          });

          if (executorNode) {
            executeCallbackNode(executorNode, [resolveFn]);
          }

          callStack.pop();

          return {
            isPromise: true,
            then: (thenCbNode) => {
              pushMicrotask({
                id: `micro-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                label: 'Promise.then callback',
                type: 'Promise.then',
                sourceLine: line,
                code: getSourceSnippet(thenCbNode, originalCode) || 'Promise.then callback',
                astNode: thenCbNode
              });

              addStep({
                type: 'microtask',
                line,
                loc,
                description: '`.then()` called on resolved Promise. Callback queued to Microtask Queue.',
                detailedExplanation: 'When a Promise resolves, its `.then()` callbacks are appended to the Microtask Queue (Job Queue) to run after current synchronous task finishes.',
                phase: 'DRAINING_MICROTASKS',
                activePointer: 'microtask',
                activePhaseDescription: 'Queued to Microtask Queue'
              });
            }
          };
        }
        break;
      }

      default:
        break;
    }

    return undefined;
  }

  function handleCallExpression(expr, line, loc) {
    const callee = expr.callee;

    // 1. console.log(...)
    if (
      callee.type === 'MemberExpression' &&
      callee.object.name === 'console' &&
      callee.property.name === 'log'
    ) {
      const args = expr.arguments.map(arg => evaluateExpression(arg, line, loc));
      const logText = args.map(formatValue).join(' ');

      callStack.push({
        id: `frame-console-${Date.now()}`,
        name: `console.log("${logText.substring(0, 20)}")`,
        type: 'sync',
        line,
        code: `console.log(${logText})`
      });

      consoleOutput.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text: logText,
        type: 'log',
        line,
        timestamp: new Date().toLocaleTimeString()
      });

      addStep({
        type: 'sync',
        line,
        loc,
        description: `Executed \`console.log\` -> Output: "${logText}"`,
        detailedExplanation: `Call Stack pushes \`console.log\`. String/variables evaluated and printed to stdout console: "${logText}". Call stack pops frame.`,
        phase: 'CALL_STACK',
        activePointer: 'console'
      });

      callStack.pop();
      return undefined;
    }

    // 2. process.nextTick(cb)
    if (
      callee.type === 'MemberExpression' &&
      callee.object.name === 'process' &&
      callee.property.name === 'nextTick'
    ) {
      const callbackNode = expr.arguments[0];
      const cbSnippet = getSourceSnippet(callbackNode, originalCode) || 'process.nextTick callback';

      callStack.push({
        id: `frame-nextTick-${Date.now()}`,
        name: 'process.nextTick(...)',
        type: 'process.nextTick',
        line,
        code: 'process.nextTick(...)'
      });

      pushMicrotask({
        id: `micro-nexttick-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        label: 'process.nextTick callback',
        type: 'process.nextTick',
        sourceLine: line,
        code: cbSnippet,
        astNode: callbackNode
      });

      addStep({
        type: 'microtask',
        line,
        loc,
        description: 'Called `process.nextTick`. Callback queued to Microtask Queue (Highest Priority).',
        detailedExplanation: '`process.nextTick()` queues its callback at the head of the Microtask Queue. NextTick callbacks execute before Promise microtasks!',
        phase: 'DRAINING_MICROTASKS',
        activePointer: 'microtask',
        activePhaseDescription: 'Queued to Microtask Queue (process.nextTick)'
      });

      callStack.pop();
      return undefined;
    }

    // 3. setImmediate(cb)
    if (callee.name === 'setImmediate' || (callee.type === 'MemberExpression' && callee.property.name === 'setImmediate')) {
      const callbackNode = expr.arguments[0];
      const cbSnippet = getSourceSnippet(callbackNode, originalCode) || 'setImmediate callback';

      callStack.push({
        id: `frame-setImmediate-${Date.now()}`,
        name: 'setImmediate(...)',
        type: 'setImmediate',
        line,
        code: 'setImmediate(...)'
      });

      macrotaskQueue.push({
        id: `macro-immediate-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        label: 'setImmediate callback',
        type: 'setImmediate',
        sourceLine: line,
        code: cbSnippet,
        astNode: callbackNode
      });

      addStep({
        type: 'macrotask',
        line,
        loc,
        description: 'Called `setImmediate`. Callback queued to Macrotask Queue (Check Phase).',
        detailedExplanation: '`setImmediate()` inserts its callback into the Macrotask Queue (Check Phase). It runs on the next iteration of the Event Loop after microtasks.',
        phase: 'CHECKING_MACRO_QUEUE',
        activePointer: 'macrotask',
        activePhaseDescription: 'Queued to Macrotask Queue (setImmediate)'
      });

      callStack.pop();
      return undefined;
    }

    // 4. setTimeout(cb, delay)
    if (callee.name === 'setTimeout') {
      const callbackNode = expr.arguments[0];
      const delay = expr.arguments[1] ? evaluateExpression(expr.arguments[1], line, loc) : 0;

      callStack.push({
        id: `frame-settimeout-${Date.now()}`,
        name: `setTimeout(..., ${delay}ms)`,
        type: 'webapi',
        line,
        code: `setTimeout(..., ${delay})`
      });

      const timerId = `webapi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const cbSnippet = getSourceSnippet(callbackNode, originalCode) || 'setTimeout callback';

      webApis.push({
        id: timerId,
        label: `setTimeout (${delay}ms)`,
        delay,
        type: 'setTimeout',
        line,
        codeStr: cbSnippet,
        astNode: callbackNode
      });

      addStep({
        type: 'webapi',
        line,
        loc,
        description: `Called \`setTimeout\` with ${delay}ms delay. Registered timer in Web APIs.`,
        detailedExplanation: `\`setTimeout\` is delegated to the Browser Web APIs thread. Web API starts a background countdown timer of ${delay}ms. Call stack pops \`setTimeout\`.`,
        phase: 'CALL_STACK',
        activePointer: 'webapi',
        activePhaseDescription: 'Registered Web API Timer'
      });

      callStack.pop();
      return undefined;
    }

    // 5. queueMicrotask(cb)
    if (callee.name === 'queueMicrotask') {
      const callbackNode = expr.arguments[0];
      const cbSnippet = getSourceSnippet(callbackNode, originalCode) || 'queueMicrotask callback';

      callStack.push({
        id: `frame-queueMicrotask-${Date.now()}`,
        name: 'queueMicrotask(...)',
        type: 'microtask',
        line,
        code: 'queueMicrotask(...)'
      });

      pushMicrotask({
        id: `micro-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        label: 'queueMicrotask callback',
        type: 'queueMicrotask',
        sourceLine: line,
        code: cbSnippet,
        astNode: callbackNode
      });

      addStep({
        type: 'microtask',
        line,
        loc,
        description: 'Called `queueMicrotask`. Callback pushed to Microtask Queue.',
        detailedExplanation: '`queueMicrotask` explicitly inserts a callback into the Microtask Queue (Job Queue). Call stack pops `queueMicrotask`.',
        phase: 'DRAINING_MICROTASKS',
        activePointer: 'microtask'
      });

      callStack.pop();
      return undefined;
    }

    // 6. Promise.resolve().then(...)
    if (
      callee.type === 'MemberExpression' &&
      callee.property.name === 'then'
    ) {
      const objResult = evaluateExpression(callee.object, line, loc);
      const thenCbNode = expr.arguments[0];

      if (objResult && objResult.isPromise) {
        objResult.then(thenCbNode);
      } else {
        pushMicrotask({
          id: `micro-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          label: 'Promise.then callback',
          type: 'Promise.then',
          sourceLine: line,
          code: getSourceSnippet(thenCbNode, originalCode) || 'Promise.then callback',
          astNode: thenCbNode
        });

        addStep({
          type: 'microtask',
          line,
          loc,
          description: '`Promise.resolve().then(...)` queued callback into Microtask Queue.',
          detailedExplanation: 'Promise is already resolved. The `.then()` callback is queued into the Microtask Queue (Job Queue) immediately.',
          phase: 'DRAINING_MICROTASKS',
          activePointer: 'microtask'
        });
      }
      return undefined;
    }

    // 7. Promise.resolve() static call
    if (
      callee.type === 'MemberExpression' &&
      callee.object.name === 'Promise' &&
      callee.property.name === 'resolve'
    ) {
      return {
        isPromise: true,
        then: (thenCbNode) => {
          pushMicrotask({
            id: `micro-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            label: 'Promise.then callback',
            type: 'Promise.then',
            sourceLine: line,
            code: getSourceSnippet(thenCbNode, originalCode) || 'Promise.then callback',
            astNode: thenCbNode
          });

          addStep({
            type: 'microtask',
            line,
            loc,
            description: '`Promise.resolve().then()` callback added to Microtask Queue.',
            detailedExplanation: 'Resolved promise queued `.then()` callback to Microtask Queue.',
            phase: 'DRAINING_MICROTASKS',
            activePointer: 'microtask'
          });
        }
      };
    }

    // 8. User Function Invocation
    if (callee.type === 'Identifier') {
      const funcName = callee.name;
      const funcNode = functionsMap[funcName];

      if (funcNode) {
        callStack.push({
          id: `frame-func-${Date.now()}`,
          name: `${funcName}()`,
          type: funcNode.async ? 'async' : 'sync',
          line,
          code: `${funcName}() invocation`
        });

        addStep({
          type: 'sync',
          line,
          loc,
          description: `Function \`${funcName}()\` invoked. Pushed to Call Stack.`,
          detailedExplanation: `New Stack Frame \`${funcName}()\` pushed to Call Stack. Execution jumps inside function body.`,
          phase: 'CALL_STACK',
          activePointer: 'stack'
        });

        if (funcNode.async) {
          executeAsyncFunctionBody(funcNode.body.body, funcName, line);
        } else {
          executeStatements(funcNode.body.body);
        }

        callStack.pop();

        addStep({
          type: 'sync',
          line,
          loc,
          description: `Function \`${funcName}()\` completed. Popped from Call Stack.`,
          detailedExplanation: `Function \`${funcName}()\` finished executing body. Stack frame removed.`,
          phase: 'CALL_STACK',
          activePointer: 'stack'
        });
      }
    }

    return undefined;
  }

  function executeAsyncFunctionBody(statements, funcName, callerLine) {
    let awaitIndex = -1;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (
        stmt.type === 'ExpressionStatement' &&
        stmt.expression.type === 'AwaitExpression'
      ) {
        awaitIndex = i;
        break;
      }
    }

    if (awaitIndex !== -1) {
      const syncStatements = statements.slice(0, awaitIndex);
      executeStatements(syncStatements);

      const awaitStmt = statements[awaitIndex];
      const awaitLine = awaitStmt.loc ? awaitStmt.loc.start.line : callerLine;
      const awaitExpr = awaitStmt.expression.argument;

      addStep({
        type: 'sync',
        line: awaitLine,
        description: `Executing \`await\` expression inside \`${funcName}()\`.`,
        detailedExplanation: `Inside async function \`${funcName}()\`, the \`await\` expression evaluates synchronously, but pauses function execution and schedules remaining lines as a Microtask!`,
        phase: 'CALL_STACK',
        activePointer: 'stack'
      });

      evaluateExpression(awaitExpr, awaitLine);

      const continuationStatements = statements.slice(awaitIndex + 1);

      pushMicrotask({
        id: `micro-async-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        label: `${funcName}() continuation (after await)`,
        type: 'await continuation',
        sourceLine: awaitLine,
        code: `${funcName}() resumed after await`,
        continuationStatements
      });

      addStep({
        type: 'microtask',
        line: awaitLine,
        description: `\`${funcName}()\` paused at await. Continuation queued to Microtask Queue.`,
        detailedExplanation: `The rest of \`${funcName}()\` after \`await\` is packaged into a microtask continuation and pushed into the Microtask Queue. \`${funcName}()\` yields control back to caller.`,
        phase: 'DRAINING_MICROTASKS',
        activePointer: 'microtask'
      });
    } else {
      executeStatements(statements);
    }
  }

  function executeCallbackNode(node, args = []) {
    if (!node) return;

    if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
      if (node.body.type === 'BlockStatement') {
        executeStatements(node.body.body);
      } else {
        evaluateExpression(node.body);
      }
    }
  }
}

function formatValue(val) {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'function') return '[Function]';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function getLastLine(code) {
  return code.split('\n').length;
}

function getSourceSnippet(node, fullCode) {
  if (!node || !node.loc) return '';
  const lines = fullCode.split('\n');
  const start = node.loc.start.line - 1;
  const end = node.loc.end.line - 1;
  if (start === end) {
    return lines[start].substring(node.loc.start.column, node.loc.end.column);
  }
  return lines.slice(start, end + 1).join('\n');
}
