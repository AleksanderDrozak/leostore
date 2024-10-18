// @ts-check
import { LightningElement, api } from 'lwc';
import { StoreMixin } from 'c/leoStore';
import { alertMessageStore, errorMessageStore } from 'c/atomStore';
import { computed } from 'c/nanostores';
const messageStore = computed([alertMessageStore, errorMessageStore], (message, error) => ({ message, error }));
export default class AlertContainer extends StoreMixin(LightningElement, messageStore) {

    subscriptions = [];

    /** @type {ThemeValues} */
    _currentTheme = 'info';

    /** @type {string|null} */
    _message = null;

    @api set message(/**  @type {string} */ message) {
        this._message = message;
        this.theme = this._currentTheme;
    }

    get message() {
        return this.state.error || this.state.message || this._message;
    }

    @api set theme(/** @type {ThemeValues} }*/ newTheme) {
        this.updateTheme(newTheme);
        this._currentTheme = newTheme
    }

    get theme() {
        return this._currentTheme;
    }

    get container() {
        return this.template.querySelector('div');
    }

    get hasNoMessage() {
        return !this.message;
    }

    updateTheme(/** @type {ThemeValues} }*/ newTheme) {
        if (this.container) {
            const themeClassPrefix = 'slds-theme_';
            const currentThemeClass = Array.from(this.container.classList).find((/** @type {string} */ className) => className.includes(themeClassPrefix));
            if (currentThemeClass) {
                this.container.classList.remove(currentThemeClass);
            }
            this.container.classList.add(themeClassPrefix + newTheme);
        }
    }

    close() {
        this.dispatchEvent(new CustomEvent('closed'));
    }

}