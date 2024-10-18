/** 
 * Implementation of centralized filtering and retrieval using store concept 
 * with local storage caching and pagination
 */
// @ts-check
import { map, computed, onSet, onMount } from "c/nanostores";

const dataStoreLocalStorageKey = 'dataStore';

const pages = 25;
const records = 100;
const perPage = records / pages;

/** @type {FilterQuery} */
const dataStoreInitDefault = {
    booleanFilter: null,
    additionalFilter: null,
    columns: [],
    filterByInfo: [],
    orderByInfo: [],
    totalNumberOfRecords: 0,
    listViewId: null,
    objectApiName: null,
    lastPage: pages,
    currentPage: 1
};

const getLocalStorageStoreValue = () => {
    try {
        return JSON.parse(localStorage.getItem(dataStoreLocalStorageKey));
    }
    catch {
        return null;
    }
}

/** @description read from local storage last version if not exists return default @type {FilterQuery} */
const dataStoreInit = getLocalStorageStoreValue() || dataStoreInitDefault;

/** @description simulate database @type {{id:number, name:string}[][]} */
const recordsPerPages = new Array(100).fill(null).map((_, index) => ({ id: index + 1, name: 'test' + (index + 1) })).reduce((all, one, i) => {
    const chunkIndex = Math.floor(i / perPage);
    all[chunkIndex] = [].concat((all[chunkIndex] || []), one);
    return all
}, []);


/** simulate call to api or apex to retrieve data */
function queryData(/** @type {FilterQuery} */ queryFilterBuilder) {
    return Promise.resolve({
        queryFilterBuilder,
        records: recordsPerPages[queryFilterBuilder.currentPage - 1] || recordsPerPages[0]
    })
}

/** input store, that only will be used as a source for dataContainerStore. Change to this store will trigger query to database and update */
export const filterQueryStore = map(dataStoreInit);

/** start saving changes to local storage when someone subscribes to dataStore */
onMount(filterQueryStore, () => {
    /** before sending notifications to subscribers of data store we save it in local storage */
    const unsubscribeForOnSet = onSet(filterQueryStore, ({ newValue }) => {
        localStorage.setItem(dataStoreLocalStorageKey, JSON.stringify(newValue));
    });

    /** remove subscription to avoid memory leaks, when last subscriber stopped subscribing */
    return unsubscribeForOnSet;
})

/** output store, that only will be used as a sink for data. Any time filterQueryStore, this tore will get new value via async function queryData, that will be executed */
export const dataContainerStore = computed(filterQueryStore, state => queryData(state));