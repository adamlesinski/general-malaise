interface TerritoryData {
    owner: string,
    troops: number,
};

const initialTerrits = new Map<string, TerritoryData>([
    [
        'Arafan',
        {
            owner: 'hawflakes',
            troops: 3,
        },  
    ],
    [
        'Moncton',
        {
            owner: 'hawflakes',
            troops: 1,
        },
    ],
    [
        'Creer',
        {
            owner: 'wahtever',
            troops: 1,
        },
    ],
]);

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
}

const players = new Map<string, Player>([
    [
        'hawflakes',
        {
            name: 'hawflakes', color: 'red',
        },
    ],
    [
        'wahtever',
        {
            name: 'wahtever',
            color: 'green',
        },
    ],
]);

type DeployPhase = {
    phase: 'deploy',
    totalReinforcements: number,
    remainingReinforcements: number,
    deployments: Map<string, number>,
};

type AttackPhase = {
    phase: 'attack',
};

type AdvancePhase = {
    phase: 'advance',
}

type Phase = DeployPhase | AttackPhase | AdvancePhase;

interface MapViewProps {
    className?: string,
    onSelected?: (name: string | null) => void,
    onHover?: (hover: Hover) => void,
    children?: React.ReactNode,
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
    return <map-view ref={mapRef} className={props.className}>{props.children}</map-view>;
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

function App(props: AppProps) {
    const [territs, setTerrits] = React.useState(initialTerrits);
    const [phase, setPhase] = React.useState<Phase>(() => { return { phase: 'deploy', totalReinforcements: 10, remainingReinforcements: 10, deployments: new Map() }; });
    const [selection, setSelection] = React.useState(null as string | null);
    const [hover, setHover] = React.useState({ territory: null, token: null } as Hover);

    let phasePanel = null;
    let deployDialog: React.ReactElement | null = null;
    let highlights: string[] = [];
    let arrows: React.ReactElement[] = [];
    let selectionHandler: ((name: string | null) => void) | undefined = undefined;
    switch (phase.phase) {
        case 'advance': {
            const onFinish = () => {};
            phasePanel = <AdvancePanel onFinish={onFinish} />;
            break;
        }
        case 'attack': {
            selectionHandler = (name: string | null) => {
                setSelection(prev => {
                    if (name && prev && territs.get(prev)!.owner == props.player && territs.get(name)!.owner != props.player) {
                        const request = {
                            attack: {
                                player: props.player,
                                from: prev,
                                to: name,
                            }
                        };
                        sendAction(props.gameId, request).then(result => {
                            const attackResult = result[0].attack;
                            setTerrits(prev => {
                                const update = new Map(prev);
                                const from = {...update.get(attackResult.from)!};
                                const to = {...update.get(attackResult.to)!};
                                from.troops -= attackResult.attacker_losses;
                                to.troops -= attackResult.defender_losses;
                                if (attackResult.conquered) {
                                    to.owner = from.owner;
                                    from.troops -= 1;
                                    to.troops = 1;
                                }
                                update.set(attackResult.from, from);
                                update.set(attackResult.to, to);
                                if (result[1] && result[1].phase_changed) {
                                    setPhase({ phase: result[1].phase_changed.new_phase });
                                }
                                return update;
                            });
                        }).catch(err => {
                            console.error('failed to send attack request:', err);
                        });
                        console.log(`attack from ${prev} to ${name}`);
                        return prev;
                    }
                    return name;
                });
            };
            const onFinish = () => {};
            phasePanel = <ActionPanel onFinish={onFinish} />

            if (hover && hover.token) {
                const name = hover.token;
                highlights = territsImmut.get(name)!.neighbours.filter(n => territs.get(n)!.owner != territs.get(name)!.owner);
            }

            if (selection) {
                const src = territs.get(selection)!;
                if (src.owner == props.player) {
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
            break;
        }
        case 'deploy': {
            selectionHandler = name => setSelection(name);
            const onDeploy = async () => {
                const deployments: { [territ: string]: Number } = {};
                for (const [territ, deployment] of phase.deployments.entries()) {
                    deployments[territ] = deployment;
                }
                const request = {
                    deploy: {
                        player: props.player,
                        deployments: deployments,
                    }
                };
                const result = await sendAction(props.gameId, request);
                setTerrits(previous => {
                    const update = new Map(previous);
                    for (const [territ, deployment] of phase.deployments.entries()) {
                        update.get(territ)!.troops += deployment;
                    }
                    return update;
                });
                setPhase({ phase: 'attack'});
            };
            phasePanel = <DeployPanel onDeploy={onDeploy} remainingReinforcements={phase.remainingReinforcements} totalReinforcements={phase.totalReinforcements} />;
            if (selection) {
                const deployment = phase.deployments.get(selection) ?? 0;
                
                const onDeployChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                    const number = event.target.valueAsNumber;
                    setPhase(previous => {
                        if (previous.phase == 'deploy') {
                            previous.deployments.set(selection, number);
                            let usedReinforcements = 0;
                            for (const deployment of previous.deployments.values()) {
                                usedReinforcements += deployment;
                            }
                            return {
                                ...previous,
                                remainingReinforcements: previous.totalReinforcements - usedReinforcements,
                            };
                        }
                        return previous;
                    });
                };
                
                deployDialog = (
                    <TrackingView>
                        <div className="dialog" data-tracking={selection}>
                            <input type="number" min="0" max={phase.remainingReinforcements + deployment} value={deployment} onChange={onDeployChange}></input>
                        </div>
                    </TrackingView>
                );
            }
            break;
        }
    }

    const renderedTerrits = [...territs].map(([name, data]) => {
        const immut = territsImmut.get(name)!;
        let additionalTroops = 0;
        if (phase.phase == 'deploy') {
            const deployments = phase.deployments.get(name);
            if (deployments) {
                additionalTroops = deployments;
            }
        }
        const isHighlighted = highlights.includes(name);
        const isTokenSelected = selection == name && territs.get(selection)!.owner == props.player;
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
                    color={players.get(data.owner)!.color}
                    selected={isTokenSelected}
                    hovered={isTokenHovered}
                    highlighted={isHighlighted} />
            </map-territory>
        );
    });

    return (
        <React.Fragment>
            <div className="phase-area">
                {phasePanel}
            </div>
            <div className="map-area viewport">
                <MapView className="layer" onSelected={selectionHandler} onHover={hover => setHover(hover)}>
                    {renderedTerrits}
                    {arrows}
                </MapView>
                <div id="overlays" className="layer">
                    {deployDialog}
                </div>
            </div>
            <div className="control-area">
                <ControlPanel territs={territs} players={players} activePlayer={'hawflakes'} />
            </div>
        </React.Fragment>
    );
}

type ActionRequest = {
    deploy?: DeployRequest,
    attack?: AttackRequest,
}

type DeployRequest = {
    player: string,
    deployments: { [territ: string]: Number},
}

type AttackRequest = {
    player: string,
    from: string,
    to: string,
}

async function sendAction(gameId: string, action: ActionRequest) {
    const response = await fetch(`/api/v1/game/${gameId}`, {
        method: 'POST',
        body: JSON.stringify(action),
    });
    const json = await response.json();
    if (!response.ok) {
        throw Error(`failed to send action: ${json.error}`);
    }
    return json;
}

window.onload = function () {
    ReactDOM.render(<App player="wahtever" gameId="1" />, document.getElementById('app'));
};   
