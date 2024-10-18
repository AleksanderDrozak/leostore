# LeoStore 
### lightweight state manager for Salesforce LWC

LeoStore is a lightweight wrapper around the [Nanostores](https://github.com/nanostores/nanostores#vanilla-js) state manager adjusted for use in Salesforce Lightning Web Components (LWC). This library integrates the simplicity and performance of Nanostores into the Salesforce ecosystem, allowing for seamless state management in LWC projects.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Examples](./examples)
- [Credits](#credits)
- [License](#license)

## Installation
> Copy content of **leoStoreLibrary** to your project folder. Then add to your **sfdx-project.json** file
``` json 
{
  "packageDirectories": [
    // THIS SHOULD be added to your packageDirectories along other projects (remember about , after your other package)
    {
      "path": "leoStoreLibrary",
      "default": false
    }
  ...
  ],
  ...
}
```
Then deploy as any LWC, whole folder **lwc** from **leoStoreLibrary**

## Usage

> Mixin for LightningComponent (or it extension) that add state reactive variable that can be used in UI for rendering current state of provided as an argument for mixin store. State management is handled via library nanostores saved as LWC service in c/nanostores. Every store should be created in stores.js LWC service to avoid creating separate stores.

### Example 1

``` javascript
// atomStores.js
import { atom } from "c/nanostores";
export const alertMessageStore = atom('');
```

``` javascript
// alertContainer.js
import { alertMessageStore } from "c/atomStore";
import { StoreMixin } from 'c/leoStore';
export default class AlertContainer extends StoreMixin(LightningElement, alertMessageStore) { }
```

``` html
<!-- alertContainer.html -->
<template><span>{state}</span><template>
```

``` javascript
// homepage.js
import { alertMessageStore } from "c/atomStore";
export default class HomePage extends LightningElement {
    constructor() {
        alertMessageStore.set('Test Message');
    }
}
```

``` html
<!-- homepage.html -->
<template><c-alert-container></c-alert-container><template>
```

## Author
This library is created and maintained by **Aleksander Drożak**.

## Credits
This library is a wrapper around the fantastic [Nanostores](https://github.com/nanostores/nanostores#vanilla-js) state management system. All credits for the core functionality go to the [Nanostores team](https://github.com/nanostores/nanostores#vanilla-js). This project aims to provide a simple integration for Salesforce LWC while maintaining the lightweight, high-performance benefits of [Nanostores](https://github.com/nanostores/nanostores#vanilla-js).