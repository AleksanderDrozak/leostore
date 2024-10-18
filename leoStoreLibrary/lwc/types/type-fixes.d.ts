type Constructor<T = any> = new (...args: any[]) => T;
type LightningElementClassType = Constructor<import('lwc').LightningElement & { render?(): string }>;

declare module "*.html" {
    const content: string;
    export default content;
}

declare module "lightning/*" {
    export function NavigationMixin(base: LightningElementClassType): LightningElementClassType
    export function loadScript(self, fileUrl): Promise
}

declare module "nanostores" {
    export * from "@types/nanostores"
}