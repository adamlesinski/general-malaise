// Missing property in DOM types.
declare interface MouseEvent {
    readonly deltaY: number;
}

declare namespace JSX {
    interface IntrinsicElements {
        ['map-view']: any,
        ['map-terit']: any,
        ['map-troops']: any, 
    }
}