// Declaration for missing experimental DOM API.
// [https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver].
declare class ResizeObserver {
    constructor(callback: (entries: ResizeObserverEntry[], observer?: ResizeObserver) => void);

    observe(element: Element | SVGElement, options?: ResizeObserverOptions): void;
    disconnect(): void;
}

declare interface ResizeObserverEntry {}

declare interface ResizeObserverOptions {
    box: 'content-box' | 'border-box' | 'device-pixel-content-box';
}

declare interface MouseEvent {
    readonly deltaY: number;
}