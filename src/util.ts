declare interface NodeList {
    groupBy<K>(keyFn: (node: Node) => K): Map<K, Node[]>;
}

declare interface NodeListOf<TNode> {
    groupBy<K>(keyFn: (node: TNode) => K): Map<K, TNode[]>;
}

NodeList.prototype.groupBy = function<K>(keyFn: (node: Node) => K): Map<K, Node[]> {
    const groups = new Map<K, Node[]>();
    this.forEach(node => {
        const key = keyFn(node);
        const nodes = groups.get(key);
        if (nodes !== undefined) {
            nodes.push(node);
        } else {
            groups.set(key, [node]);
        }
    });
    return groups;
};
