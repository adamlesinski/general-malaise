interface TerritoryData {
    owner: string,
    troops: number,
};

interface TerritoryImmutableProps {
    neighbours: string[],
    center: string,
    paths: string[],
    color: string,
}

type Region = {
    territs: string[],
    color: string,
    bonus: number,
}

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
    territsImmut: Map<string, TerritoryImmutableProps>,
    regions: Map<string, Region>,
}

type GameEvent = {
    deploy?: DeployEvent,
    attack?: AttackEvent,
    advance?: MoveEvent,
    reinforce?: MoveEvent,
    phase_changed?: PhaseChangedEvent,
    stats_changed?: StatsChangedEvent,
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

type MoveEvent = MoveRequest;

type PhaseChangedEvent = {
    old_player: string,
    new_player: string,
    old_phase: Phase,
    new_phase: Phase,
}

type StatsChangedEvent = {
    updates: { [name: string]: StatsUpdate },
}

type StatsUpdate = {
    territories: number,
    troops: number,
    reinforcements: number,
}

async function fetchGameState(gameId: string): Promise<GameState> {
    const response = await fetch(`/api/v1/game/${gameId}`);
    const json = await response.json();
    if (!response.ok) {
        throw new Error(`failed to get game ${gameId}: ${json.error}`);
    }

    const mapResponse = await fetch(`/api/v1/map/${json.map}`);
    const mapJson = await mapResponse.json();
    if (!response.ok) {
        throw new Error(`failed to get map ${json.map}: ${mapJson.error}`);
    }

    // Convert JSON objects to Maps
    
    const territsImmut = new Map();
    for (const [name, territ] of Object.entries(mapJson.territs)) {
        territsImmut.set(name, territ);
    }

    const regions = new Map();
    for (const [name, region] of Object.entries(mapJson.regions)) {
        regions.set(name, region);
    }
    
    const players = new Map();
    for (const player of json.players) {
        players.set(player.name, player);
    }
    const territs = new Map();
    for (const [name, territ] of Object.entries(json.territs)) {
        territs.set(name, territ);
    }
    return {...json, players: players, territs: territs, territsImmut: territsImmut, regions: regions};
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
    } else if (event.advance || event.reinforce) {
        const moveEvent = (event.advance || event.reinforce)!;
        const updatedTerrits = new Map(current.territs);
        const fromTerrit = {...updatedTerrits.get(moveEvent.from)!};
        fromTerrit.troops -= moveEvent.troops;
        const toTerrit = {...updatedTerrits.get(moveEvent.to)!};
        toTerrit.troops += moveEvent.troops;
        updatedTerrits.set(moveEvent.from, fromTerrit);
        updatedTerrits.set(moveEvent.to, toTerrit);
        return {...current, territs: updatedTerrits};
    } else if (event.phase_changed) {
        return {...current, active_player: event.phase_changed.new_player, phase: event.phase_changed.new_phase };
    } else if (event.stats_changed) {
        const players = new Map();
        for (const [name, update] of Object.entries(event.stats_changed.updates)) {
            players.set(name, {
                ...current.players.get(name)!,
                ...update
            });
        }
        return {...current, players: players};
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

type ClientReinforceState = {
    target: string,
    troops: number,
}

function App(props: AppProps) {
    const [gameState, gameStateLoading, gameStateError, applyEvent] = useGameState(props.gameId);
    const [clientDeployState, setClientDeployState] = React.useState<ClientDeployState|null>(null);
    const [clientAdvanceState, setClientAdvanceState] = React.useState<ClientAdvanceState|null>(null);
    const [clientReinforceState, setClientReinforceState] = React.useState<ClientReinforceState|null>(null);
    const [selection, setSelection] = React.useState<string|null>(null);
    const [hover, setHover] = React.useState<Hover>({ territory: null, token: null });

    let phasePanel = null;
    let controlPanels: React.ReactElement[] = [];
    let mapPanel = null;
    let nonRenderingComponents: React.ReactElement[] = [];
    if (gameStateLoading) {
        phasePanel = <LoadingGamePanel />
        controlPanels.push(<LoadingView key="loading" />);
        mapPanel = <LoadingView />;
    } else if (gameStateError) {
        phasePanel = <ErrorGamePanel message={gameStateError} />
        controlPanels.push(<ErrorView key="error" />);
        mapPanel = <ErrorView />
    } else if (gameState) {
        const territsImmut = gameState.territsImmut;
        const territs = gameState.territs;
        const phase = gameState.phase;
        let overlays: React.ReactElement[] = [];
        let highlights: string[] = [];
        let arrows: React.ReactElement[] = [];
        let selectionHandler: ((name: string | null) => void) | undefined = undefined;

        controlPanels.push(
            <ControlPanel key="player-stats" players={gameState.players} activePlayer={gameState.active_player} thisPlayer={props.player} />
        );

        {
            const hoveredTerrit = hover.territory || hover.token;
            if (hoveredTerrit) {
                const territData = territs.get(hoveredTerrit)!
                const territProps = territsImmut.get(hoveredTerrit)!;
                controlPanels.push(<div key="spacer" className="expand" />);
                controlPanels.push(<TerritoryDetails key="territ-details" name={hoveredTerrit} owner={territData.owner} troops={territData.troops} neighbours={territProps.neighbours} />);
            }
        }

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
            if (selection && territs.get(selection)!.owner == props.player) {
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
            selectionHandler = async (newSelection: string | null) => {
                if (newSelection && selection && territs.get(selection)!.owner == props.player && territs.get(newSelection)!.owner != props.player) {
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
            const from = territs.get(advance.from)!;

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
                let events;
                if (clientReinforceState) {
                    events = await sendAction(props.gameId, {
                        reinforce: {
                            player: props.player,
                            from: selection!,
                            to: clientReinforceState.target,
                            troops: clientReinforceState.troops,
                        }
                    });
                } else {
                    events = await sendAction(props.gameId, { end_reinforce: { player: props.player }});
                }
                for (const event of events) {
                    applyEvent(event);
                }
                setSelection(null);
                setClientReinforceState(null);
            };
            phasePanel = <ReinforcePanel onFinish={onFinish}/>
            selectionHandler = (name: string | null) => {
                if (!name) {
                    setSelection(null);
                    setClientReinforceState(null);
                    return;
                }
                const t = territs.get(name)!
                if (t.owner != props.player) {
                    setSelection(null);
                    setClientReinforceState(null);
                    return;
                }
                if (!selection || clientReinforceState) {
                    setSelection(name);
                    setClientReinforceState(null);
                    return;
                }
                if (selection != name) {
                    setClientReinforceState({target: name, troops: 0});
                }
            };

            if (selection) {
                const selectedTerrit = territs.get(selection)!;
                if (clientReinforceState) {
                    const onReinforceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                        const troops = event.target.valueAsNumber;
                        setClientReinforceState({target: clientReinforceState.target, troops: troops});
                    };
                    overlays.push(
                        <TrackingView key="reinforce">
                            <div className="dialog" data-tracking={clientReinforceState.target}>
                                <input type="number" min="0" max={selectedTerrit.troops - 1} value={clientReinforceState.troops} onChange={onReinforceChange}></input>
                            </div>
                        </TrackingView>
                    );
                    arrows.push(
                        <map-arrow key="reinforce" src={selection} dst={clientReinforceState.target} color="green" />
                    );
                }
            }
        }

        const renderedTerrits = [...territs.entries()].map(([name, data]) => {
            const immut = territsImmut.get(name)!;
            let troops = data.troops;
            let additionalTroops = 0;
            if (clientDeployState) {
                const deployments = clientDeployState.request.deployments[name];
                if (deployments) {
                    additionalTroops = deployments;
                }
            } else if (clientReinforceState) {
                if (clientReinforceState.target == name) {
                    troops += clientReinforceState.troops;
                } else if (selection == name) {
                    troops -= clientReinforceState.troops;
                }
            } else if (phase.advance) {
                const advanceTroops = clientAdvanceState ? clientAdvanceState.troops : territs.get(phase.advance.from)!.troops - 1;
                if (phase.advance.from == name) {
                    troops -= advanceTroops;
                } else if (phase.advance.to == name) {
                    troops += advanceTroops;
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
            const mapPaths = immut.paths.map((p, i) => <map-path key={`${name}:${i}`} path={p} />);
            return (
                <map-territory 
                    key={name}
                    name={name}
                    center={immut.center}
                    neighbours={immut.neighbours.join(' ')}
                    color={immut.color}
                    hovered={isTerritHovered}>
                    {mapPaths}
                    <map-troops
                        amount={troops}
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
            <div className="control-area stack">
                {controlPanels}
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
    reinforce?: MoveRequest,
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
