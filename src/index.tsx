interface TerittoryData {
    troops: number,
    moves: number,
    buildings: ImmutableSet<string>,
};

const initialTerits: { [key: string]: TerittoryData } = {
    'Arafan': {
        troops: 3,
        moves: 3,
        buildings: new ImmutableSet(new Set(['barracks'])),
    },
    'Moncton': {
        troops: 0,
        moves: 0,
        buildings: new ImmutableSet(new Set()),
    },
    'Creer': {
        troops: 0,
        moves: 0,
        buildings: new ImmutableSet(new Set()),
    }
};

interface TerritoryImmutableProps {
    neighbours: string[],
    center: string,
    path: string,
}

const teritsImmut: { [key: string]: TerritoryImmutableProps } = {
    'Arafan': {
        neighbours: [ 'Moncton', 'Creer' ],
        center: '129.60227924168927 179.98075626239478',
        path: 'M 142.946 125.006 C 151.216 125.006 162.218 127.625 170.609 129.722 C 172.399 130.17 176.987 130.264 179.037 131.705 C 170.524 133.589 164.364 154.999 160.982 161.765 C 159.99 163.749 158.974 169.666 160.147 172.011 C 160.865 173.446 161.707 174.602 162.625 175.573 C 165.984 180.32 170.971 181.292 174.297 184.659 C 174.545 185.028 174.775 185.421 174.987 185.845 C 175.943 187.757 175.055 191.117 174.101 194.581 C 173.034 194.118 172.113 193.73 171.42 193.437 L 172.149 193.852 C 172.149 203.024 158.438 226.539 146.136 222.907 C 138.424 220.63 132.831 211.293 125.603 207.674 C 115.168 202.45 98.589 212.526 89.238 202.202 C 87.025 199.758 82.898 197.746 80.161 195.163 C 79.943 194.808 79.745 194.431 79.557 194.04 C 79.553 193.507 79.553 192.979 79.553 192.46 C 79.553 172.634 96.121 167.4 106.808 153.151 C 114.737 142.578 117.818 133.787 129.546 127.565 Z M 179.873 132.639 C 179.964 132.831 180.029 133.033 180.073 133.244 C 179.497 133.29 178.969 133.316 178.501 133.316 L 179.598 132.213 C 179.709 132.346 179.801 132.488 179.873 132.639 Z',
    },
    'Moncton': {
        neighbours: [ 'Arafan', 'Creer' ],
        center: '203.21465652428944 177.92228817989195',
        path: 'M 198.353 132.552 C 205.619 136.185 209.841 141.946 216.354 145.201 C 226.556 150.3 233.255 143.472 239.395 155.755 C 241.435 159.837 238.583 166.591 240.615 170.656 C 244.406 178.237 238.864 185.427 237.192 192.138 C 233.9 205.349 229.915 213.648 224.516 224.438 C 222.375 228.717 217.065 232.936 211.279 235.074 C 211.253 231.672 210.845 228.38 209.314 226.847 C 205.273 222.8 198.386 224.684 194.478 220.546 C 191.616 217.515 192.68 208.88 190.633 204.864 C 188.799 201.266 179.554 196.947 174.101 194.581 C 174.101 194.581 174.101 194.581 174.101 194.581 C 175.055 191.117 175.943 187.757 174.987 185.845 C 172.025 179.919 165.366 179.826 161.245 173.871 C 160.854 173.307 160.487 172.69 160.147 172.011 C 158.974 169.666 159.99 163.749 160.982 161.765 C 161.727 160.275 162.606 158.075 163.616 155.529 C 167.191 146.516 172.399 133.174 179.037 131.705 C 179.431 131.617 179.831 131.572 180.236 131.572 L 179.598 132.213 L 178.501 133.316 C 178.969 133.316 179.497 133.29 180.073 133.244 C 185.387 132.822 194.757 130.753 198.353 132.552 Z',
    },
    'Creer': {
        neighbours: [ 'Moncton', 'Arafan' ],
        center: '172.3106717085933 253.6544666406856',
        path: 'M 210.954 243.922 C 210.954 259.16 207.151 279.906 197.431 290.392 C 194.703 293.335 186.854 289.527 184.715 287.395 C 177.693 280.391 165.455 266.059 155.338 263.074 C 149.71 261.413 138.124 254.699 134.205 250.767 C 128.998 245.542 132.973 237.281 122.128 234.074 C 106.788 229.538 77.522 226.161 69.659 209.607 C 67.54 205.147 67.41 198.556 64.965 193.655 C 62.932 189.584 60.308 183.438 61.872 178.143 C 62.888 174.704 65.682 172.369 69.811 174.329 C 72.04 175.388 72.715 183.798 74.795 185.885 C 77.21 188.306 77.611 192.621 79.859 194.869 C 79.957 194.967 80.058 195.065 80.16 195.161 C 80.16 195.162 80.161 195.162 80.161 195.163 C 82.898 197.746 87.025 199.758 89.238 202.202 C 98.589 212.526 115.168 202.45 125.603 207.674 C 132.831 211.293 138.424 220.63 146.136 222.907 C 158.438 226.539 172.149 203.024 172.149 193.852 L 171.42 193.437 C 172.151 193.747 173.138 194.162 174.282 194.66 C 179.756 197.042 188.819 201.305 190.633 204.864 C 192.68 208.88 191.616 217.515 194.478 220.546 C 198.386 224.684 205.273 222.8 209.314 226.847 C 210.845 228.38 211.253 231.672 211.279 235.074 C 211.279 235.074 211.279 235.074 211.279 235.074 C 211.306 238.456 210.954 241.946 210.954 243.922 Z',
    }
};

function findConnectedTerittories(territories: { [key: string]: TerritoryImmutableProps }, src: string, maxDistance: number): Map<string, number> {
    const results = new Map<string, number>();
    const queue: [string, number][] = [];
    queue.push([src, 0]);
    while (queue.length > 0) {
        const [src, currentMove] = queue.shift()!;
        if (!results.has(src)) {
            results.set(src, currentMove);
        }
        if (currentMove + 1 <= maxDistance) {
            for (const neighbour of territories[src].neighbours) {
                queue.push([neighbour, currentMove + 1]);
            }
        }
    }
    results.delete(src);
    return results;
}

interface AppProps {
    bank: number,
}

function App(props: AppProps) {
    const [bank, setBank] = React.useState(props.bank);
    const [terits, setTerits] = React.useState(initialTerits);
    const [selection, setSelection] = React.useState(null as MapSelection);
    const mapRef = React.useRef(null as MapView | null);

    React.useEffect(() => {
        const mapView = mapRef.current!;
        const listener = ((event: CustomEvent<MapSelectionDetail>) => {
            setSelection(event.detail.current);
        }) as EventListener;
        mapView.addEventListener('map:selection', listener);
        return () => mapView.removeEventListener('map:selection', listener);
    }, [mapRef]);

    const renderedTerits = Object.entries(terits).map(([name, data]) => {
        const props = teritsImmut[name];
        return (
            <map-terit key={name} name={name} center={props.center} path={props.path} neighbours={props.neighbours} buildings={data.buildings}>
                { data.troops && <map-troops amount={data.troops} moves={data.moves} /> }
            </map-terit>
        );
    });

    let renderedPanel = null;
    if (selection instanceof MapTerritory) {
        const buyHandler = (action: BuyAction) => {
            setBank(bank => {
                if (bank - action.cost < 0) {
                    throw new Error('insufficient funds');
                }
                return bank - action.cost;
            });

            setTerits(terits => {
                const data = terits[selection.name!];
                const update = { ...data };
                if (action.kind == 'troops') {
                    update.troops += action.amount;
                } else if (action.kind == 'building') {
                    update.buildings = update.buildings.insert(action.building);
                }
                return {
                    ...terits,
                    [selection.name!]: update
                };
            });
        };
        const buildings = terits[selection.name!].buildings;
        renderedPanel = <TerritoryPanel name={selection.name!} bank={bank} buildings={buildings} onBuy={buyHandler} />;
    } else if (selection instanceof MapTroops) {
        const moveHandler = (action: MoveTroops) => {
            setTerits(oldState => {
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
        };
        const territoryName = (selection.parentElement! as MapTerritory).name!;
        const data = terits[territoryName];
        const connectedTerits = findConnectedTerittories(teritsImmut, territoryName, data.moves);
        renderedPanel = <TroopsPanel territory={territoryName} connectedTerritories={connectedTerits} amount={data.troops} moves={data.moves} onMove={moveHandler} />;
    }

    let buildingTotals: { [key: string]: number } = {
        outposts: 0,
        barracks: 0,
        mines: 0,
    };
    buildingTotals = Object.values(terits).reduce((sum, data) => { 
        for (const building of data.buildings) {
            sum[building] += 1;
        }
        return sum;
    }, buildingTotals);
    return (
        <React.Fragment>
            <div className="map-panel">
                <map-view ref={mapRef}>
                    {renderedTerits}
                </map-view>
            </div>
            <div className="control-panel" style={{padding: '8px'}}>
                <p>{bank} gold</p>
                <p>+4 gold next turn</p>
                <p>{buildingTotals.mines} operational mines</p>
                <p>{buildingTotals.outposts} outposts</p>
                <p>{buildingTotals.barracks} barracks</p>
                <div id="contextual-panel">
                    {renderedPanel}
                </div>
            </div>
        </React.Fragment>
    );
}

window.onload = function () {
    ReactDOM.render(<App bank={34} />, document.getElementById('app'));
};   
