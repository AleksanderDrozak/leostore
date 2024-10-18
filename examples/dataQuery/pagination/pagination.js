// @ts-check
import { LightningElement } from 'lwc';
import { StoreMixin } from 'c/leoStore';
import { dataContainerStore, filterQueryStore } from 'c/dataStore';

export default class Pagination extends StoreMixin(LightningElement, dataContainerStore) {

    get paginationData() {
        return (this.state || {}).queryFilterBuilder;
    }

    get currentPage() {
        return this.paginationData.currentPage;
    }

    get lastPage() {
        return this.paginationData.lastPage;
    }

    get isLastPage() {
        return this.currentPage == this.lastPage;
    }

    get isFirstPage() {
        return this.currentPage == 1;
    }

    nextPage() {
        if (!this.isLastPage) {
            filterQueryStore.setKey('currentPage', this.currentPage + 1);
        }
    }

    previousPage() {
        if (!this.isFirstPage) {
            filterQueryStore.setKey('currentPage', this.currentPage - 1);
        }
    }

    goToFirstPage() {
        if (!this.isFirstPage) {
            filterQueryStore.setKey('currentPage', 1);
        }
    }

    goToLastPage() {
        if (!this.isLastPage) {
            filterQueryStore.setKey('currentPage', this.lastPage);
        }
    }
}