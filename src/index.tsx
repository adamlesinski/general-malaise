interface TerritoryData {
    owner: string,
    troops: number,
};

interface TerritoryImmutableProps {
    neighbours: string[],
    center: string,
    path: string,
}

const territsImmut = new Map<string, TerritoryImmutableProps>([
    [
        'Arafan',
        {
            neighbours: [ 'Moncton', 'Creer' ],
            center: '129.60227924168927 179.98075626239478',
            path: 'M 142.946 125.006 C 151.216 125.006 162.218 127.625 170.609 129.722 C 172.399 130.17 176.987 130.264 179.037 131.705 C 170.524 133.589 164.364 154.999 160.982 161.765 C 159.99 163.749 158.974 169.666 160.147 172.011 C 160.865 173.446 161.707 174.602 162.625 175.573 C 165.984 180.32 170.971 181.292 174.297 184.659 C 174.545 185.028 174.775 185.421 174.987 185.845 C 175.943 187.757 175.055 191.117 174.101 194.581 C 173.034 194.118 172.113 193.73 171.42 193.437 L 172.149 193.852 C 172.149 203.024 158.438 226.539 146.136 222.907 C 138.424 220.63 132.831 211.293 125.603 207.674 C 115.168 202.45 98.589 212.526 89.238 202.202 C 87.025 199.758 82.898 197.746 80.161 195.163 C 79.943 194.808 79.745 194.431 79.557 194.04 C 79.553 193.507 79.553 192.979 79.553 192.46 C 79.553 172.634 96.121 167.4 106.808 153.151 C 114.737 142.578 117.818 133.787 129.546 127.565 Z M 179.873 132.639 C 179.964 132.831 180.029 133.033 180.073 133.244 C 179.497 133.29 178.969 133.316 178.501 133.316 L 179.598 132.213 C 179.709 132.346 179.801 132.488 179.873 132.639 Z',
        },  
    ],
    [
        'Moncton',
        {
            neighbours: [ 'Arafan', 'Creer' ],
            center: '203.21465652428944 177.92228817989195',
            path: 'M 198.353 132.552 C 205.619 136.185 209.841 141.946 216.354 145.201 C 226.556 150.3 233.255 143.472 239.395 155.755 C 241.435 159.837 238.583 166.591 240.615 170.656 C 244.406 178.237 238.864 185.427 237.192 192.138 C 233.9 205.349 229.915 213.648 224.516 224.438 C 222.375 228.717 217.065 232.936 211.279 235.074 C 211.253 231.672 210.845 228.38 209.314 226.847 C 205.273 222.8 198.386 224.684 194.478 220.546 C 191.616 217.515 192.68 208.88 190.633 204.864 C 188.799 201.266 179.554 196.947 174.101 194.581 C 174.101 194.581 174.101 194.581 174.101 194.581 C 175.055 191.117 175.943 187.757 174.987 185.845 C 172.025 179.919 165.366 179.826 161.245 173.871 C 160.854 173.307 160.487 172.69 160.147 172.011 C 158.974 169.666 159.99 163.749 160.982 161.765 C 161.727 160.275 162.606 158.075 163.616 155.529 C 167.191 146.516 172.399 133.174 179.037 131.705 C 179.431 131.617 179.831 131.572 180.236 131.572 L 179.598 132.213 L 178.501 133.316 C 178.969 133.316 179.497 133.29 180.073 133.244 C 185.387 132.822 194.757 130.753 198.353 132.552 Z',
        },
    ],
    [
        'Creer',
        {
            neighbours: [ 'Moncton', 'Arafan' ],
            center: '172.3106717085933 253.6544666406856',
            path: 'M 210.954 243.922 C 210.954 259.16 207.151 279.906 197.431 290.392 C 194.703 293.335 186.854 289.527 184.715 287.395 C 177.693 280.391 165.455 266.059 155.338 263.074 C 149.71 261.413 138.124 254.699 134.205 250.767 C 128.998 245.542 132.973 237.281 122.128 234.074 C 106.788 229.538 77.522 226.161 69.659 209.607 C 67.54 205.147 67.41 198.556 64.965 193.655 C 62.932 189.584 60.308 183.438 61.872 178.143 C 62.888 174.704 65.682 172.369 69.811 174.329 C 72.04 175.388 72.715 183.798 74.795 185.885 C 77.21 188.306 77.611 192.621 79.859 194.869 C 79.957 194.967 80.058 195.065 80.16 195.161 C 80.16 195.162 80.161 195.162 80.161 195.163 C 82.898 197.746 87.025 199.758 89.238 202.202 C 98.589 212.526 115.168 202.45 125.603 207.674 C 132.831 211.293 138.424 220.63 146.136 222.907 C 158.438 226.539 172.149 203.024 172.149 193.852 L 171.42 193.437 C 172.151 193.747 173.138 194.162 174.282 194.66 C 179.756 197.042 188.819 201.305 190.633 204.864 C 192.68 208.88 191.616 217.515 194.478 220.546 C 198.386 224.684 205.273 222.8 209.314 226.847 C 210.845 228.38 211.253 231.672 211.279 235.074 C 211.279 235.074 211.279 235.074 211.279 235.074 C 211.306 238.456 210.954 241.946 210.954 243.922 Z',
        },
    ],
]);

interface Player {
    name: string,
    color: string,
    eliminated: boolean,
    reinforcements: number,
    troops: number,
    territories: number,
}

type DeployPhase = {
    reinforcements: number,
};

type AttackPhase = {};

type AdvancePhase = {
    from: string,
    to: string,
}

type ReinforcePhase = {}

type Phase = {
    deploy?: DeployPhase,
    attack?: AttackPhase,
    advance?: AdvancePhase,
    reinforce?: ReinforcePhase,
}

interface MapViewProps {
    className?: string,
    onSelected?: (name: string | null) => void,
    onHover?: (hover: Hover) => void,
    children?: React.ReactNode,
    overlays?: React.ReactElement[],
}

function MapView(props: MapViewProps) {
    const mapRef: React.Ref<MapViewElement> = React.useRef(null);
    React.useEffect(() => {
        if (props.onSelected) {
            const onSelected = props.onSelected;
            const mapView = mapRef.current!;
            const listener = (event: MapSelectionEvent) => {
                const territory = event.detail.target?.territory;
                if (territory) {
                    onSelected(territory.name);
                } else {
                    onSelected(null);
                }
            };
            mapView.addEventListener('map:selection', listener as EventListener);
            return () => mapView.removeEventListener('map:selection', listener as EventListener);
        }
    }, [props.onSelected]);
    React.useEffect(() => {
        if (props.onHover) {
            const onHover = props.onHover;
            const mapView = mapRef.current!;
            const listener = (event: MapHoverEvent) => {
                if (event.detail.target instanceof MapTerritoryElement) {
                    onHover({territory: event.detail.target.name, token: null});
                } else if (event.detail.target instanceof MapTroopsElement) {
                    const name = event.detail.target.territory?.name ?? null;
                    onHover({token: name, territory: null});
                } else {
                    onHover({territory: null, token: null});
                }
            };
            mapView.addEventListener('map:hover', listener as EventListener);
            return () => mapView.removeEventListener('map:hover', listener as EventListener);
        }
    }, [props.onHover]);
    React.useEffect(() => {
        mapRef.current?.invalidateMap();
    }, [props.overlays]);
    return (
        <React.Fragment>
            <map-view ref={mapRef} className="layer">{props.children}</map-view>
            <div id="overlays" className="layer">
                {props.overlays}
            </div>
        </React.Fragment>
    );
}

function useExpensiveRef<T>(initial: () => T) {
    const ref: React.Ref<T> = React.useRef(null);
    if (ref.current === null) {
        (ref.current as T) = initial();
    }
    return ref;
}

interface TrackingViewProps {
    children?: React.ReactNode,
}

function TrackingView(props: TrackingViewProps) {
    const ref: React.Ref<HTMLElement> = useExpensiveRef(() => {
        const div = document.createElement('div');
        return div;
    });
    React.useEffect(() => {
        const parent = document.querySelector('#overlays')!
        parent.appendChild(ref.current!);
        return () => ref.current!.remove();
    }, []);
    return ReactDOM.createPortal(props.children, ref.current!);
}

interface AppProps {
    player: string,
    gameId: string,
}

interface Hover {
    territory: string | null,
    token: string | null,
}

type GameState = {
    phase: Phase,
	active_player: string,
    players: Map<string, Player>,
	territs: Map<string, TerritoryData>,
}

type GameEvent = {
    deploy?: DeployEvent,
    attack?: AttackEvent,
    advance?: AdvanceEvent,
    phase_changed?: PhaseChangedEvent,
}

type DeployEvent = DeployRequest;
type AttackEvent = {
    player: string,
    defender: string,
    from: string,
    to: string,
    defender_rolls: number[],
    attacker_rolls: number[],
    attacker_losses: number,
    defender_losses: number,
    conquered: boolean,
}

type AdvanceEvent = MoveRequest;

type PhaseChangedEvent = {
    old_player: string,
    new_player: string,
    old_phase: Phase,
    new_phase: Phase,
}

async function fetchGameState(gameId: string): Promise<GameState> {
    const response = await fetch(`/api/v1/game/${gameId}`);
    const json = await response.json();
    if (!response.ok) {
        throw new Error(`failed to get game ${gameId}: ${json.error}`);
    }
    
    // Convert JSON objects to Maps
    const players = new Map();
    for (const player of json.players) {
        players.set(player.name, player);
    }
    const territs = new Map();
    for (const [name, territ] of Object.entries(json.territs)) {
        territs.set(name, territ);
    }
    return {...json, players: players, territs: territs};
}

function advanceGameState(current: GameState, event: GameEvent): GameState {
    console.log(`advancing game state with event: ${JSON.stringify(event)}`);
    if (event.deploy) {
        const updatedTerrits = new Map(current.territs);
        for (const [territName, troops] of Object.entries(event.deploy.deployments)) {
            const territ = {...updatedTerrits.get(territName)!};
            territ.troops += troops;
            updatedTerrits.set(territName, territ);
        }
        return {...current, territs: updatedTerrits };
    } else if (event.attack) {
        const updatedTerrits = new Map(current.territs);
        const fromTerrit = {...updatedTerrits.get(event.attack.from)!};
        fromTerrit.troops -= event.attack.attacker_losses;
        const toTerrit = {...updatedTerrits.get(event.attack.to)!};
        toTerrit.troops -= event.attack.defender_losses;
        if (event.attack.conquered) {
            toTerrit.owner = event.attack.player;
            toTerrit.troops = 1;
            fromTerrit.troops -= 1;
        }
        updatedTerrits.set(event.attack.from, fromTerrit);
        updatedTerrits.set(event.attack.to, toTerrit);
        return {...current, territs: updatedTerrits};
    } else if (event.advance) {
        const updatedTerrits = new Map(current.territs);
        const fromTerrit = {...updatedTerrits.get(event.advance.from)!};
        fromTerrit.troops -= event.advance.troops;
        const toTerrit = {...updatedTerrits.get(event.advance.to)!};
        toTerrit.troops += event.advance.troops;
        updatedTerrits.set(event.advance.from, fromTerrit);
        updatedTerrits.set(event.advance.to, toTerrit);
        return {...current, territs: updatedTerrits};
    } else if (event.phase_changed) {
        return {...current, active_player: event.phase_changed.new_player, phase: event.phase_changed.new_phase };
    } else {
        throw new Error('unrecognized event');
    }
}

function useGameState(gameId: string): [GameState | null, boolean, string | null, (event: GameEvent) => void] {
    type GameStateImpl = {
        error: string | null,
        loading: boolean,
        state: GameState | null,
    };
    const [state, setState] = React.useState<GameStateImpl>({ error: null, loading: true, state: null });
    React.useEffect(() => {
        fetchGameState(gameId)
            .then(gameState => setState({ error: null, loading: false, state: gameState }))
            .catch(err => setState(prev => { return { ...prev, error: err, loading: false }; }));
    }, [gameId]);
    const apply = (event: GameEvent) => {
        setState(prev => {
            if (prev.state === null) {
                throw new Error('cannot apply event to null game state');
            }
            return { ...prev, state: advanceGameState(prev.state, event) };
        });
    };
    return [state.state, state.loading, state.error, apply];
}

type ClientDeployState = {
    reinforcementsUsed: number,
    request: DeployRequest,
}

type ClientAdvanceState = {
    troops: number,
}

function App(props: AppProps) {
    const [gameState, gameStateLoading, gameStateError, applyEvent] = useGameState(props.gameId);
    const [clientDeployState, setClientDeployState] = React.useState<ClientDeployState|null>(null);
    const [clientAdvanceState, setClientAdvanceState] = React.useState<ClientAdvanceState|null>(null);
    const [selection, setSelection] = React.useState(null as string | null);
    const [hover, setHover] = React.useState({ territory: null, token: null } as Hover);

    let phasePanel = null;
    let controlPanel = null;
    let mapPanel = null;
    let nonRenderingComponents: React.ReactElement[] = [];
    if (gameStateLoading) {
        phasePanel = <LoadingGamePanel />
        controlPanel = <LoadingView />;
        mapPanel = <LoadingView />;
    } else if (gameStateError) {
        phasePanel = <ErrorGamePanel message={gameStateError} />
        controlPanel = <ErrorView />
        mapPanel = <ErrorView />
    } else if (gameState) {
        let overlays: React.ReactElement[] = [];
        let highlights: string[] = [];
        let arrows: React.ReactElement[] = [];
        let selectionHandler: ((name: string | null) => void) | undefined = undefined;

        controlPanel = <ControlPanel players={gameState.players} activePlayer={gameState.active_player} thisPlayer={props.player} />

        const phase = gameState.phase;
        if (gameState.active_player !== props.player) {
            phasePanel = <WaitingPanel />;
            nonRenderingComponents.push(<Websocket key="websocket" gameId={props.gameId} applyEvent={applyEvent} />);
        } else if (phase.deploy) {
            const localDeployState = clientDeployState ?? { reinforcementsUsed: 0, request: { player: props.player, deployments: {} }};
            const reinforcementsRemaining = phase.deploy.reinforcements - localDeployState.reinforcementsUsed;
            selectionHandler = name => setSelection(name);
            const onDeploy = async () => {
                const events = await sendAction(props.gameId, { deploy: localDeployState.request });
                for (const event of events) {
                    applyEvent(event);
                }
                setClientDeployState(null);
                setSelection(null);
            };
            phasePanel = <DeployPanel onDeploy={onDeploy} reinforcementsRemaining={reinforcementsRemaining} reinforcementsTotal={phase.deploy.reinforcements} />;
            if (selection && gameState.territs.get(selection)!.owner == props.player) {
                const deployment = localDeployState.request.deployments[selection] ?? 0;
                const onDeployChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                    const number = event.target.valueAsNumber;
                    setClientDeployState(prev => {
                        if (!prev) {
                            prev = { reinforcementsUsed: 0, request: { player: props.player, deployments: {} }};
                        }
                        const updates = {...prev.request.deployments, [selection]: number};
                        const used = Object.values(updates).reduce((sum, troops) => sum + troops, 0);
                        return {
                            reinforcementsUsed: used,
                            request: {...prev.request, deployments: updates}
                        };
                    });
                };
                overlays.push(
                    <TrackingView key="deploy">
                        <div className="dialog" data-tracking={selection}>
                            <input type="number" min="0" max={deployment + reinforcementsRemaining} value={deployment} onChange={onDeployChange}></input>
                        </div>
                    </TrackingView>
                );
            }
        } else if (phase.attack) {
            const territs = gameState.territs;
            selectionHandler = async (newSelection: string | null) => {
                if (newSelection && selection && territs.get(selection)!.owner == props.player && territs.get(newSelection)!.owner != props.player) {
                    console.log(`attacking from ${selection} to ${newSelection}`);
                    // This selection is an attack!
                    const request = {
                        attack: {
                            player: props.player,
                            from: selection,
                            to: newSelection,
                        }
                    };
                    const events = await sendAction(props.gameId, request);
                    for (const event of events) {
                        applyEvent(event);
                    }
                } else {
                    setSelection(newSelection);
                }
            };
            const onFinish = async () => {
                const events = await sendAction(props.gameId, { end_attack: { player: props.player } });
                for (const event of events) {
                    applyEvent(event);
                }
                setSelection(null);
            };
            phasePanel = <AttackPanel onFinish={onFinish} />

            if (hover && hover.token) {
                const name = hover.token;
                highlights = territsImmut.get(name)!.neighbours.filter(n => territs.get(n)!.owner != territs.get(name)!.owner);
            }

            if (selection) {
                const src = territs.get(selection)!;
                if (src.owner == props.player && src.troops > 1) {
                    const arrowTargets = territsImmut.get(selection)!.neighbours.filter(n => territs.get(n)!.owner != src.owner);
                    for (const target of arrowTargets) {
                        let color = "#f7756baa";
                        if (hover.token) {
                            if (hover.token == target) {
                                color = "#eb1c0c";
                            }
                        }
                        arrows.push(
                            <map-arrow key={`${selection}:${target}`} src={selection} dst={target} color={color} />
                        );
                    }
                }
            }
        } else if (phase.advance) {
            const advance = phase.advance;
            const from = gameState.territs.get(advance.from)!;
            const to = gameState.territs.get(advance.to)!;

            const onFinish = async () => {
                const request = {
                    advance: {
                        player: props.player,
                        from: advance.from,
                        to: advance.to,
                        troops: clientAdvanceState ? clientAdvanceState.troops : from.troops - 1,
                    }
                };
                const events = await sendAction(props.gameId, request);
                for (const event of events) {
                    applyEvent(event);
                }
                setClientAdvanceState(null);
                setSelection(advance.to);
            };
            phasePanel = <AdvancePanel onFinish={onFinish}/>
            
            const troops = clientAdvanceState ? clientAdvanceState.troops : from.troops - 1;
            const onAdvanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                setClientAdvanceState({ troops: event.target.valueAsNumber });
            };
            overlays.push(
                <TrackingView key="advance">
                    <div className="dialog" data-tracking={advance.to}>
                        <input type="number" min="0" max={from.troops - 1} value={troops} onChange={onAdvanceChange}></input>
                    </div>
                </TrackingView>
            );
            arrows.push(
                <map-arrow key="advance" src={advance.from} dst={advance.to} color="orange" />
            );
        } else if (phase.reinforce) {
            const onFinish = async () => {
                const events = await sendAction(props.gameId, { end_reinforce: { player: props.player }});
                for (const event of events) {
                    applyEvent(event);
                }
                setSelection(null);
            };
            phasePanel = <ReinforcePanel onFinish={onFinish}/>
        }

        const renderedTerrits = [...gameState.territs.entries()].map(([name, data]) => {
            const immut = territsImmut.get(name)!;
            let additionalTroops = 0;
            if (clientDeployState) {
                const deployments = clientDeployState.request.deployments[name];
                if (deployments) {
                    additionalTroops = deployments;
                }
            }
            const isHighlighted = highlights.includes(name);
            let isTokenSelected = selection == name && data.owner == props.player && data.troops > 1;
            let isTokenHovered = false;
            let isTerritHovered = false;
            if (hover.token) {
                isTokenHovered = hover.token == name;
                isTerritHovered = isTokenHovered;
            } else if (hover.territory) {
                isTerritHovered = hover.territory == name;
            }
            return (
                <map-territory 
                    key={name}
                    name={name}
                    center={immut.center}
                    path={immut.path}
                    neighbours={immut.neighbours.join(' ')}
                    hovered={isTerritHovered}>
                    <map-troops
                        amount={data.troops}
                        additional={additionalTroops}
                        color={gameState.players.get(data.owner)!.color}
                        selected={isTokenSelected}
                        hovered={isTokenHovered}
                        highlighted={isHighlighted} />
                </map-territory>
            );
        });

        mapPanel = (
            <MapView onSelected={selectionHandler} onHover={hover => setHover(hover)} overlays={overlays}>
                {renderedTerrits}
                {arrows}
            </MapView>
        );
    }

    return (
        <React.Fragment>
            <div className="phase-area">
                {phasePanel}
            </div>
            <div className="map-area viewport">
                {mapPanel}
            </div>
            <div className="control-area">
                {controlPanel}
            </div>
            {nonRenderingComponents}
        </React.Fragment>
    );
}

type ActionRequest = {
    deploy?: DeployRequest,
    attack?: AttackRequest,
    advance?: MoveRequest,
    end_attack?: EndPhaseRequest,
    end_reinforce?: EndPhaseRequest,
}

type DeployRequest = {
    player: string,
    deployments: { [territ: string]: number},
}

type AttackRequest = {
    player: string,
    from: string,
    to: string,
}

type MoveRequest = {
    player: string,
    from: string,
    to: string,
    troops: number,
}

type EndPhaseRequest = {
    player: string
}

async function sendAction(gameId: string, action: ActionRequest): Promise<GameEvent[]> {
    const response = await fetch(`/api/v1/game/${gameId}`, {
        method: 'POST',
        body: JSON.stringify(action),
    });
    const json = await response.json();
    if (!response.ok) {
        throw Error(`failed to send action: ${json.error}`);
    }
    return json as GameEvent[];
}

function LoadingView() {
    return (
        <div style={{width: '100%', height: '100%', textAlign: 'center', display: 'flex', alignItems: 'center'}}>
            <h2>Loading...</h2>
        </div>
    );
}

function ErrorView() {
    return (
        <div style={{width: '100%', height: '100%', textAlign: 'center', display: 'flex', alignItems: 'center'}}>
            <h2>ERROR</h2>
        </div>
    );
}

window.onload = function () {
    const params = window.location.search ? window.location.search : '?user=wahtever';
    const user = params.replace('?user=', '');
    console.log(`playing as ${user}`);
    ReactDOM.render(<App player={user} gameId="1" />, document.getElementById('app'));
};   
