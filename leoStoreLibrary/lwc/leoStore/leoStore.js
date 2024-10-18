const PRIVATE_UNSUBSCRIBERS = Symbol('PrivateSubscriptions');

/**
 *  @description Mixin for LightningComponent (or it extension) that add state reactive variable that can be used in UI for rendering current state of provided as an argument for mixin store. State management is handled via library nanostores saved as LWC service in c/nanostores. Every store should be created in stores.js LWC service to avoid creating separate stores.
 * @example
 * ``` javascript
 *  // stores.js
 *  import { atom } from "c/nanostores";
 *  export const alertMessageStore = atom('');
 * ```
 *  ``` javascript
 *  // alertContainer.js
 *  import { alertMessageStore } from "c/atomStore";
 *  export default class AlertContainer extends StoreMixin(LightningElement, alertMessageStore) { }
 *  ```
 * ``` html
 * <!-- alertContainer.html -->
 * <template><span>{state}</span><template>
 * ```
 * ``` javascript
 * // testContainer.js
 *  import { alertMessageStore } from "c/atomStore";
 * export default class TestContainer extends LightningElement {
 *      constructor() {
 *          alertMessageStore.set('Test Message');
 *      }
 * }
 * ```
 * ``` html
 * <!-- testContainer.html -->
 * <template><c-alert-container></c-alert-container><template>
 * ```
 *  @template Store
 */
const StoreMixin = (/** @type {Constructor} */ Base, /** @type {Store} */ storeInstance) => {
    return class extends Base {

        /** @readonly */
        get state() {
            return this._state;
        }

        /**  @type {import('nanostores').StoreValue<Store>}  */
        _state;

        /** @type {Array<import('nanostores').StoreUnsubscriber>} */
        [PRIVATE_UNSUBSCRIBERS] = [];

        connectedCallback() {
            this._state = storeInstance.get();
            this[PRIVATE_UNSUBSCRIBERS].push(
                storeInstance.subscribe(
                    value => this._state = value
                )
            )
        }

        disconnectedCallback() {
            this[PRIVATE_UNSUBSCRIBERS].forEach(storeUnsubscriber => storeUnsubscriber())
        }
    };
}

/**
 *  @description Mixin for LightningComponent (or it extension) that add state reactive variable that can be used in UI for rendering current state of provided as an argument for mixin store. State management is handled via library nanostores saved as LWC service in c/nanostores. Every store should be created in stores.js LWC service to avoid creating separate stores. It is similar to StoreMixin but with difference that can accept multiple stores that can be listen separatly (in case of StoreMixin you can use compound method to combine two stores into one which is generaly prefered). Here store variables are created dynamicly based on keys in store map provided into mixin. To key will be added suffix "State" eg. { error:errorMessageStore } will produce errorState variable in class that can be used to retirve current state. Disclaimer due to dynamic setup of this variable, LWC framework is not able to track changes by default, so to trigger rerender when state changes you need to manualy setup variables in class;
 * @example
 * ``` javascript
 *  // stores.js
 *  import { LightningElement } from 'lwc';
 *  import { atom } from "c/nanostores";
 *  export const alertMessageStore = atom('');
 *  export const errorMessageStore = atom('');
 * ```
 *  ``` javascript
 *  // alertContainer.js
 *  import { alertMessageStore } from "c/atomStore";
 *  import { errorMessageStore } from "c/atomStore";
 *  export default class AlertContainer extends StoreMapMixin(LightningElement, {
 * alert:alertMessageStore,
 * error:errorMessageStore
 * }) {
 * // type {import('nanostores').StoreValue<typeof alertMessageStore>} 
 * alertState;
 * 
 * // type {import('nanostores').StoreValue<typeof errorMessageStore>} 
 * errorState;
 *  }
 *  ```
 * ``` html
 * <!-- alertContainer.html -->
 * <template><span>{errorState}</span><span>{alertState}</span><template>
 * ```
 * ``` javascript
 * // testContainer.js
 *  import { alertMessageStore } from "c/atomStore";
 *  import { errorMessageStore } from "c/atomStore";
 * export default class TestContainer extends LightningElement {
 *      constructor() {
 *          alertMessageStore.set('Test Message');
 *          errorMessageStore.set('Error');
 *      }
 * }
 * ```
 * ``` html
 * <!-- testContainer.html -->
 * <template><c-alert-container></c-alert-container><template>
 * ```
 *  @template Store
 */
const StoreMapMixin = (/** @type {Constructor} */ Base, /** @type {Store satisfies (import('nanostores').MapOfCreatedStores)} */ storesMap) => {
    const StoreMixin = class extends Base {

        /** @type {Array<import('nanostores').StoreUnsubscriber>} */
        [PRIVATE_UNSUBSCRIBERS] = [];

        connectedCallback() {
            /** @type {[string, import('nanostores').CreatedStore][]} */
            const stores = Object.entries(storesMap);
            stores.forEach(([storeKey, store]) => {
                this[storeKey + 'State'] = store.get();
                this[PRIVATE_UNSUBSCRIBERS].push(
                    store.subscribe(value => this[storeKey + 'State'] = value)
                );
            });
        }

        disconnectedCallback() {
            this[PRIVATE_UNSUBSCRIBERS].forEach(storeUnsubscribe => storeUnsubscribe())
        }
    };

    /** @type {Constructor<import('nanostores').KeysOfStoreMap<typeof storesMap>> & Constructor<StoreMixin>} */
    const returnConstructor = StoreMixin;

    return returnConstructor;
}

export { StoreMixin, StoreMapMixin };