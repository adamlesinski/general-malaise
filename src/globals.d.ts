// Missing property in DOM types.
declare interface MouseEvent {
    readonly deltaY: number;
}

declare namespace JSX {
    interface IntrinsicElements {
        ['map-view']: any,
        ['map-territory']: any,
        ['map-path']: any,
        ['map-troops']: any, 
        ['map-arrow']: any,
    }
}
