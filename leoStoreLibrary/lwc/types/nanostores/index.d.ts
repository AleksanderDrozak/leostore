export {
  STORE_UNMOUNT_DELAY,
  onNotify,
  onStart,
  onMount,
  onBuild,
  onStop,
  onSet
} from './lifecycle'
export {
  WritableStore,
  MapStoreKeys,
  StoreValue,
  MapStore,
  AnyStore,
  Store,
  map
} from './map'
export {
  AnySyncTemplate,
  TemplateValue,
  TemplateStore,
  mapTemplate,
  MapTemplate
} from './map-template'
export { ReadableAtom, WritableAtom, atom, Atom } from './atom'
export { cleanTasks, startTask, allTasks, task } from './task'
export { action, actionFor, lastAction } from './action'
export { clean, cleanStores } from './clean-stores'
export { listenKeys } from './listen-keys'
export { keepMount } from './keep-mount'
export { computed } from './computed'
import { computed, StoreValue } from 'nanostores'
import { atom } from './atom'

/** @description Required to cast type of Generic method return type */
class Wrapper<T extends unknown> {
  wrapped(e: T) {
    return computed<T>(e);
  }
}

export type CreatedStore<Value = any> = ReturnType<Wrapper<Value>['wrapped']>;
export type StoreUnsubscriber = ReturnType<ReturnType<typeof atom>['subscribe']>;
export interface MapOfCreatedStores<StoreValue> {
  [key: string]: CreatedStore<StoreValue>;
}
export type KeysOfStoreMap<StoreMap> = { [key in `${keyof StoreMap}State`]: StoreValue<StoreMap[keyof StoreMap]> };
export type KeysOfStore<Store> = keyof Store;
export type CreatedStoreValue<Value = any> = ReturnType<Wrapper<Value>['wrapped']>;
