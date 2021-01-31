// Missing property in DOM types.
declare interface MouseEvent {
    readonly deltaY: number;
}

declare namespace JSX {
    interface IntrinsicElements {
        ['map-view']: any,
        ['map-territory']: any,
        ['map-troops']: any, 
    }
}

declare interface NodeList {
    groupBy<K>(keyFn: (node: Node) => K): Map<K, Node[]>;
}

declare interface NodeListOf<TNode> {
    groupBy<K>(keyFn: (node: TNode) => K): Map<K, TNode[]>;
}