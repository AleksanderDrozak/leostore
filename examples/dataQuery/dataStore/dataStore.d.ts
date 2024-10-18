type FilterQuery = {
    columns: string[],
    objectApiName: string,
    additionalFilter: string,
    booleanFilter: string,
    listViewId: string,
    filterByInfo: FilterMessageFilteringInfo[],
    orderByInfo: FilterMessageOrderingInfo[],
    currentPage: number,
    lastPage: number,
    totalNumberOfRecords: number
}

type FilterMessageFilteringInfo = {
    fieldApiName: string,
    operator: string,
    value: string
}

type FilterMessageOrderingInfo = {
    fieldApiName: string,
    isAscending: boolean
}

type FilterMessageChannelMessage = {
    filterData: FilterMessage
}

type FilterQueryDataResponse = {
    queryFilterBuilder: FilterQuery,
    records: Object[]
}

function queryData(data: { queryFilterBuilder: FilterQuery }): FilterQueryDataResponse;