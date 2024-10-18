// https://github.com/nanostores/nanostores#vanilla-js
let tasks = 0;
let resolves = [];
/** @type {import('nanostores').startTask} */
function startTask() {
  tasks += 1;
  return () => {
    tasks -= 1;
    if (tasks === 0) {
      const prevResolves = resolves;
      resolves = [];
      for (const i of prevResolves) i();
    }
  };
}
/** @type {import('nanostores').task} */
function task(cb) {
  const endTask = startTask();
  const calledCallback = cb();

  if (calledCallback instanceof Promise) {
    return calledCallback.finally(endTask);
  }

  return Promise.resolve(endTask()).then(() => calledCallback);
}
/** @type {import('nanostores').allTasks} */
function allTasks() {
  if (tasks === 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    resolves.push(resolve);
  });
}
/** @type {import('nanostores').cleanTasks} */
function cleanTasks() {
  tasks = 0;
}

/** @type {import('nanostores').clean} */
const clean = Symbol('clean');

/** @type {import('nanostores').cleanStores} */
function cleanStores(...stores) {
  cleanTasks();
  for (const store of stores) {
    if (store) {
      if (store.mocked) delete store.mocked;
      if (store[clean]) store[clean]();
    }
  }
};

// node_modules/nanostores/lifecycle/index.js
const START = 0;
const STOP = 1;
const SET = 2;
const NOTIFY = 3;
const BUILD = 4;
const MOUNT = 5;
const UNMOUNT = 6;
const REVERT_MUTATION = 10;


function on(object, listener, eventKey, mutateStore) {
  object.events = object.events || {};
  if (!object.events[eventKey + REVERT_MUTATION]) {
    object.events[eventKey + REVERT_MUTATION] = mutateStore((eventProps) => {
      object.events[eventKey].reduceRight((event, l) => (l(event), event), {
        shared: {},
        ...eventProps,
      });
    });
  }
  object.events[eventKey] = object.events[eventKey] || [];
  object.events[eventKey].push(listener);
  return () => {
    const currentListeners = object.events[eventKey];
    const index = currentListeners.indexOf(listener);
    currentListeners.splice(index, 1);
    if (!currentListeners.length) {
      delete object.events[eventKey];
      object.events[eventKey + REVERT_MUTATION]();
      delete object.events[eventKey + REVERT_MUTATION];
    }
  };
};

/** @type {import('nanostores').onStart} */
function onStart(store, listener) {
  return on(store, listener, START, (runListeners) => {
    const originListen = store.listen;
    store.listen = (arg) => {
      if (!store.lc && !store.starting) {
        store.starting = true;
        runListeners();
        delete store.starting;
      }
      return originListen(arg);
    };
    return () => {
      store.listen = originListen;
    };
  });
}

/** @type {import('nanostores').onStop} */
function onStop(store, listener) {
  return on(store, listener, STOP, (runListeners) => {
    const originOff = store.off;
    store.off = () => {
      runListeners();
      originOff();
    };
    return () => {
      store.off = originOff;
    };
  });
}

/** @type {import('nanostores').onSet} */
function onSet(store, listener) {
  return on(store, listener, SET, (runListeners) => {
    const originSet = store.set;
    const originSetKey = store.setKey;
    if (store.setKey) {
      store.setKey = (changed, changedValue) => {
        let isAborted;
        const abort = () => {
          isAborted = true;
        };
        runListeners({
          abort,
          changed,
          newValue: { ...store.value, [changed]: changedValue },
        });
        if (!isAborted) return originSetKey(changed, changedValue);
      };
    }
    store.set = (newValue) => {
      let isAborted;
      const abort = () => {
        isAborted = true;
      };
      runListeners({ abort, newValue });
      if (!isAborted) return originSet(newValue);
    };
    return () => {
      store.set = originSet;
      store.setKey = originSetKey;
    };
  });
}

/** @type {import('nanostores').onNotify} */
function onNotify(store, listener) {
  return on(store, listener, NOTIFY, (runListeners) => {
    const originNotify = store.notify;
    store.notify = (changed) => {
      let isAborted;
      const abort = () => {
        isAborted = true;
      };
      runListeners({ abort, changed });
      if (!isAborted) return originNotify(changed);
    };
    return () => {
      store.notify = originNotify;
    };
  });
}

/** @type {import('nanostores').onNotify} */
function onBuild(Template, listener) {
  return on(Template, listener, BUILD, (runListeners) => {
    const originBuild = Template.build;
    Template.build = (...args) => {
      const store = originBuild(...args);
      runListeners({ store });
      return store;
    };
    return () => {
      Template.build = originBuild;
    };
  });
}

const STORE_UNMOUNT_DELAY = /** @type {const} */ (1e3);

/** @type {import('nanostores').onMount} */
function onMount(store, initialize) {
  const listener = (payload) => {
    const destroy = initialize(payload);
    if (destroy) store.events[UNMOUNT].push(destroy);
  };
  return on(store, listener, MOUNT, (runListeners) => {
    const originListen = store.listen;
    store.listen = (...args) => {
      if (!store.lc && !store.active) {
        store.active = true;
        runListeners();
      }
      return originListen(...args);
    };
    const originOff = store.off;
    store.events[UNMOUNT] = [];
    store.off = () => {
      originOff();
      setTimeout(() => {
        if (store.active && !store.lc) {
          store.active = false;
          for (const destroy of store.events[UNMOUNT]) destroy();
          store.events[UNMOUNT] = [];
        }
      }, STORE_UNMOUNT_DELAY);
    };
    if (true) {
      const originClean = store[clean];
      store[clean] = () => {
        for (const destroy of store.events[UNMOUNT]) destroy();
        store.events[UNMOUNT] = [];
        store.active = false;
        originClean();
      };
    }
    return () => {
      store.listen = originListen;
      store.off = originOff;
    };
  });
};

/** @type {import('nanostores').lastAction} */
const lastAction = Symbol();

const doAction = (store, actionName, cb, args) => {
  const tracker = { ...store };
  tracker.set = (...setArgs) => {
    store[lastAction] = actionName;
    store.set(...setArgs);
    delete store[lastAction];
  };
  if (store.setKey) {
    tracker.setKey = (...setArgs) => {
      store[lastAction] = actionName;
      store.setKey(...setArgs);
      delete store[lastAction];
    };
  }
  const result = cb(tracker, ...args);
  if (result instanceof Promise) {
    const endTask = startTask();
    return result.finally(endTask);
  }
  return result;
};

/** @type {import('nanostores').action} */
const action = (store, actionName, cb) => (...args) => doAction(store, actionName, cb, args);


/** 
 * @type {import('nanostores').actionFor} 
 * @description !AVOID USING, template is not used, better use action
*/
const actionFor = (Template, actionName, cb) => (store, ...rest) => doAction(store, actionName, cb, rest);

// node_modules/nanostores/atom/index.js
const listenerQueue = [];
let notifyId = 0;

/** @type {import('nanostores').atom} */
function atom(initialValue, level) {
  let currentListeners;
  let nextListeners = [];
  const store = {
    lc: 0,
    l: level || 0,
    value: initialValue,
    set(data) {
      store.value = data;
      store.notify();
    },
    get() {
      if (!store.lc) {
        store.listen(() => {
        })();
      }
      return store.value;
    },
    notify(changedKey) {
      currentListeners = nextListeners;
      const runListenerQueue = !listenerQueue.length;
      for (let i = 0; i < currentListeners.length; i += 2) {
        listenerQueue.push(
          currentListeners[i],
          store.value,
          changedKey,
          currentListeners[i + 1],
        );
      }
      if (runListenerQueue) {
        notifyId++;
        for (let i = 0; i < listenerQueue.length; i += 4) {
          let skip = false;
          for (let j = i + 7; j < listenerQueue.length; j += 4) {
            if (listenerQueue[j] < listenerQueue[i + 3]) {
              skip = true;
              break;
            }
          }
          if (skip) {
            listenerQueue.push(
              listenerQueue[i],
              listenerQueue[i + 1],
              listenerQueue[i + 2],
              listenerQueue[i + 3],
            );
          } else {
            listenerQueue[i](listenerQueue[i + 1], listenerQueue[i + 2]);
          }
        }
        listenerQueue.length = 0;
      }
    },
    listen(listener, listenerLevel) {
      if (nextListeners === currentListeners) {
        nextListeners = nextListeners.slice();
      }
      store.lc = nextListeners.push(listener, listenerLevel || store.l) / 2;
      return () => {
        if (nextListeners === currentListeners) {
          nextListeners = nextListeners.slice();
        }
        const index = nextListeners.indexOf(listener);
        if (~index) {
          nextListeners.splice(index, 2);
          store.lc--;
          if (!store.lc) store.off();
        }
      };
    },
    subscribe(cb, listenerLevel) {
      const unbind = store.listen(cb, listenerLevel);
      cb(store.value);
      return unbind;
    },
    off() {
    },
    /* It will be called on last listener unsubscribing.
           We will redefine it in onMount and onStop. */
  };
  if (true) {
    store[clean] = () => {
      nextListeners = [];
      store.lc = 0;
      store.off();
    };
  }
  return store;
};

/** @type {import('nanostores').map} */
function map(value = {}) {
  const store = atom(value);
  store.setKey = function (key, newValue) {
    if (typeof newValue === 'undefined') {
      if (key in store.value) {
        store.value = { ...store.value };
        delete store.value[key];
        store.notify(key);
      }
    } else if (store.value[key] !== newValue) {
      store.value = {
        ...store.value,
        [key]: newValue,
      };
      store.notify(key);
    }
  };
  return store;
};

/** @type {import('nanostores').mapTemplate} */
function mapTemplate(init) {
  const Template = (id, ...args) => {
    if (!Template.cache[id]) {
      Template.cache[id] = Template.build(id, ...args);
    }
    return Template.cache[id];
  };
  Template.build = (id, ...args) => {
    const store = map({ id });
    onMount(store, () => {
      let destroy;
      if (init) destroy = init(store, id, ...args);
      return () => {
        delete Template.cache[id];
        if (destroy) destroy();
      };
    });
    return store;
  };
  Template.cache = {};
  if (true) {
    Template[clean] = () => {
      for (const id in Template.cache) {
        Template.cache[id][clean]();
      }
      Template.cache = {};
    };
  }
  return Template;
}

/** @type {import('nanostores').listenKeys} */
function listenKeys(store, keys, listener) {
  const keysSet = /* @__PURE__ */ new Set([...keys, void 0]);
  return store.listen((value, changed) => {
    if (keysSet.has(changed)) {
      listener(value, changed);
    }
  });
}

/** @type {import('nanostores').keepMount} */
function keepMount(store) {
  store.listen(() => void 0);
}

/** @type {import('nanostores').computed} */
const computed = (stores, cb) => {
  if (!Array.isArray(stores)) stores = [stores];
  let diamondNotifyId;
  let diamondArgs = [];
  const run = () => {
    const args = stores.map((store) => store.get());
    if (diamondNotifyId !== notifyId || args.some((arg, i) => arg !== diamondArgs[i])) {
      diamondNotifyId = notifyId;
      diamondArgs = args;
      Promise.resolve(cb(...args)).then(derived.set);
    }
  };
  let derived = atom(void 0, Math.max(...stores.map((s) => s.l)) + 1);
  onMount(derived, () => {
    const unbinds = stores.map((store) => store.listen(run, derived.l));
    run();
    return () => {
      for (const unbind of unbinds) unbind();
    };
  });
  return derived;
};

export {
  STORE_UNMOUNT_DELAY,
  onNotify,
  onStart,
  onMount,
  onBuild,
  onStop,
  onSet,
  cleanTasks, startTask, allTasks, task,
  action, actionFor, lastAction,
  clean, cleanStores,
  mapTemplate,
  listenKeys,
  keepMount,
  computed,
  atom,
  map,
};
