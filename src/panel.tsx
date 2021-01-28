type MoveTroops = {
    src: string,
    dst: string,
    cost: number,
    amount: number,
}

interface TroopsPanelProps {
    territory: string,
    amount: number,
    moves: number,
    connectedTerritories: Map<string, number>,
    onMove: (action: MoveTroops) => void,
}

function TroopsPanel(props: TroopsPanelProps) {
    const selectRef = React.useRef<HTMLSelectElement>(null);
    const handleClick = () => {
        const selectEl = selectRef.current!;
        const selection = selectEl.selectedOptions.item(0);
        if (selection === null) {
            throw new Error('must select something');
        }

        const keyValue = selection.value.split('=');
        const src = props.territory;
        const dst = keyValue[0];
        const cost = parseInt(keyValue[1]);
        props.onMove({ src: props.territory, dst: dst, cost: cost, amount: props.amount });
    };
    const moveOptions = Array.from(props.connectedTerritories.entries(), ([t, m]) => {
        return <option key={t} value={`${t}=${m}`}>{t}</option>;
    });
    return (
        <React.Fragment>
            <h3>{props.amount} troops</h3>
            <h4>In {props.territory}</h4>
            <p>{props.moves} moves remaining</p>
            <div>
                <select ref={selectRef} required disabled={props.moves === 0}>
                    {moveOptions}
                </select>
                <button disabled={props.moves === 0} onClick={handleClick}>Move</button>
            </div>
        </React.Fragment>
    );
}

type BuyTroopsAction = {
    kind: 'troops',
    amount: number,
    cost: number,
}

type BuyBuildingAction = {
    kind: 'building',
    building: string,
    cost: number,
}

type BuyAction = BuyTroopsAction | BuyBuildingAction;

interface TerritoryPanelProps {
    name: string,
    bank: number,
    buildings: ImmutableSet<string>,
    onBuy: (action: BuyAction) => void,
}

function TerritoryPanel(props: TerritoryPanelProps) {
    const [troopCount, setTroopCount] = React.useState(1);

    const inputHandler = (event: React.FormEvent<HTMLInputElement>) => {
        const inputElement = event.target as HTMLInputElement;
        setTroopCount(inputElement.value == '' ? 0 : inputElement.valueAsNumber);
    };
    const buyTroopsHandler = () => {
        props.onBuy({
            kind: 'troops',
            amount: troopCount,
            cost: troopCount,
        });
    };
    const buyOutpostHandler = () => {
        props.onBuy({
            kind: 'building',
            building: 'outpost',
            cost: 6,
        });
    };
    const buyBarracksHandler = () => {
        props.onBuy({
            kind: 'building',
            building: 'barracks',
            cost: 12,
        });
    };
    const hasBuilding = props.buildings.length > 0;
    const hasBarracks = props.buildings.contains('barracks');
    const isBuyTroopsDisabled = !hasBarracks || props.bank < 1;
    return (
        <React.Fragment>
            <h3>{props.name}</h3>
            <p>Buildings: {props.buildings}</p>
            <div>
                <button disabled={isBuyTroopsDisabled} onClick={buyTroopsHandler}>Deploy ${troopCount} troops (-${troopCount} gold)</button>
                <input type="number" defaultValue="1" min="1" max={props.bank} disabled={isBuyTroopsDisabled} onInput={inputHandler} />
            </div>
            <button disabled={props.bank < 6 || hasBuilding} onClick={buyOutpostHandler}>Build outpost (-6 gold)</button>
            <button disabled={props.bank < 12 || hasBuilding} onClick={buyBarracksHandler}>Build barracks (-12 gold)</button>
        </React.Fragment>
    );
}
