// @ts-check
import { StoreMapMixin } from 'c/leoStore';
import { LightningElement } from 'lwc';
import { dataContainerStore } from 'c/dataStore';
export default class HomeComponent extends StoreMapMixin(LightningElement, { data: dataContainerStore }) {
    get stateString() {
        return this.dataState && JSON.stringify(this.dataState.records, null, 2);
    }
}