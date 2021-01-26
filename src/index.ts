type Observer<T> = (value: T) => void;

class Observable<T> {
    private _value: T;
    private _observers: Observer<T>[] = [];
    
    constructor(initialValue: T) {
        this._value = initialValue;
    }

    get value(): T {
        return this._value;
    }

    set value(newValue: T) {
        if (newValue !== this._value) {
            this._value = newValue;
            this._notify();
        }
    }

    update(f: (oldState: T) => T) {
        this._value = f(this._value);
        this._notify();
    }

    private _notify() {
        for (const observer of this._observers) {
            observer(this._value);
        }
    }

    observe(observer: Observer<T>) {
        this._observers.push(observer);
        observer(this._value);
    }

    unobserve(observer: Observer<T>) {
        const idx = this._observers.indexOf(observer);
        if (idx >= 0) {
            const lastObserver = this._observers.pop()!;
            if (idx < this._observers.length - 2) {
                this._observers[idx] = lastObserver;
            }
        }
    }
}

class Computed<T> extends Observable<T> {
    constructor(f: () => T, deps: Observable<any>[]) {
        super(f());
        const observer = () => this.value = f();
        for (const dep of deps) {
            dep.observe(observer);
        }
    }

    update(_: (oldState: T) => T) {
        throw new Error('Computed values are immutable');
    }

    set value(_: T) {
        throw new Error('Computed values are immutable');
    }
}

type Data = {
    troops: number,
    moves: number,
    buildings: string,
};

type TeritMap = { [key: string]: Data };

var bank = new Observable(34);
var terits = new Observable({
    'Arafan': {
        troops: 3,
        moves: 3,
        buildings: 'barracks'
    },
    'Moncton': {
        troops: 0,
        moves: 0,
        buildings: ''
    },
    'Creer': {
        troops: 0,
        moves: 0,
        buildings: ''
    }
} as TeritMap);

var teritsImmut = {
    'Arafan': {
        neighbours: [ 'Moncton', 'Creer' ]
    },
    'Moncton': {
        neighbours: [ 'Arafan', 'Creer' ]
    },
    'Creer': {
        neighbours: [ 'Moncton', 'Arafan' ]
    }
} as { [key: string]: { neighbours: string[] } };

function connectedTerits(src: string, max: number, m?: number): string[] {
    const move = m || 0;
    
    const terits: string[] = [];
    if (move > max) {
        return terits;
    }

    if (move !== 0) {
        terits.push(`${src}=${move}`);
    }
    
    for (const neighbour of teritsImmut[src].neighbours) {
        terits.push(...connectedTerits(neighbour, max, move + 1));
    }
    return terits;
}

window.onload = function () {    
    bank.observe(bank => {
        document.getElementById('current-gold')!.textContent = `${bank}`;
    });

    const mapView = document.querySelector('map-view')!;

    terits.observe((terits) => {
        for (const terit of <NodeListOf<MapTerritory>>mapView.querySelectorAll('map-terit')) {
            const data = terits[terit.name!];
            terit.setAttribute('buildings', data.buildings);
            let troops = terit.querySelector('map-troops');
            if (data.troops > 0) {
                if (troops === null) {
                    troops = terit.appendChild(document.createElement('map-troops'));
                    troops.setAttribute('moves', '0');
                }
                troops.setAttribute('amount', data.troops.toString());
            } else {
                if (troops) {
                    terit.removeChild(troops);
                }
            }
        }
    });

    let cleanup: (() => void)[] = [];

    const removePanel = () => {
        let current;
        while (current = cleanup.pop()) {
            current();
        }

        const panel = document.getElementById('contextual-panel')!;
        while (panel.firstChild) {
            panel.removeChild(panel.lastChild!);
        }
    };
    
    mapView.addEventListener('map:selected', event => {
        removePanel();
        if (event.target instanceof MapTerritory) {
            const terit = event.target;
            const node = document.createElement('territory-panel');
            node.setAttribute('bank', bank.value.toString());
            node.setAttribute('name', terit.name!);
            node.setAttribute('buildings', terit.buildings.toString());
            node.addEventListener('panel:buy', ((event: CustomEvent<BuyEvent>) => {
                if (bank.value - event.detail.cost < 0) {
                    throw new Error('insufficient funds');
                }
                bank.value -= event.detail.cost;
                terits.update((terits) => {
                    const data = terits[terit.name!];
                    const update = { ...data };
                    if (event.detail.product.kind === 'troops') {
                        update.troops += event.detail.product.amount;
                    } else if (event.detail.product.kind === 'outpost') {
                        const buildings = update.buildings.split(' ');
                        buildings.push('outpost');
                        update.buildings = buildings.join(' ').trim();
                    } else if (event.detail.product.kind === 'barracks') {
                        const buildings = update.buildings.split(' ');
                        buildings.push('barracks');
                        update.buildings = buildings.join(' ').trim();
                    }
                      
                    return {
                        ...terits,
                        [terit.name!]: update
                    };
                });
            }) as EventListener);
            const bankObserver = (bank: number) => {
                node.setAttribute('bank', bank.toString());
            };
            bank.observe(bankObserver);
            cleanup.push(() => bank.unobserve(bankObserver));
            const teritObserver = (t: TeritMap) => {
                node.setAttribute('buildings', t[terit.name!].buildings);
            };
            terits.observe(teritObserver);
            cleanup.push(() => terits.unobserve(teritObserver));
            document.getElementById('contextual-panel')!.appendChild(node);
        } else if (event.target instanceof MapTroops) {
            const troops = event.target;
            const terit = troops.parentElement! as MapTerritory;
            const node = document.createElement('troops-panel');
            node.setAttribute('territory', terit.name!);
            const teritObserver = (t: TeritMap) => {
                const troops = t[terit.name!];
                node.setAttribute('connected-territories', connectedTerits(terit.name!, troops.moves).join(' '));
                node.setAttribute('moves', troops.moves.toString());
                node.setAttribute('amount', troops.troops.toString());
            };
            terits.observe(teritObserver);
            cleanup.push(() => terits.unobserve(teritObserver));

            node.addEventListener('panel:move', ((event: CustomEvent<MoveTroops>) => {
                const action = event.detail;
                terits.update((oldState) => {
                    const src = {...oldState[action.src]};
                    const dst = {...oldState[action.dst]};
                    if (action.cost > src.moves) {
                        throw new Error('insufficient moves remaining');
                    }
                    if (action.amount > src.troops) {
                        throw new Error('insufficient troops');
                    }
                    
                    if (dst.troops === 0) {
                        dst.moves = src.moves - action.cost;
                    }
                    dst.troops += action.amount;
                    
                    src.troops -= action.amount;
                    if (src.troops === 0) {
                        src.moves = 0;
                    }
                    
                    return {
                        ...oldState,
                        [action.src]: src,
                        [action.dst]: dst
                    };
                });
            }) as EventListener);
            document.getElementById('contextual-panel')!.appendChild(node);
        }
    });

    mapView.addEventListener('map:deselected', () => {
        removePanel();
    });
};