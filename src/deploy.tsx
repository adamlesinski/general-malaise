interface LobbyPanelProps {
    onStartGame?: () => void,
    onJoinGame?: () => void,
}

function LobbyPanel(props: LobbyPanelProps) {
    let button = null;
    if (props.onStartGame) {
        button = <button onClick={props.onStartGame}>Start Game</button>;
    } else if (props.onJoinGame) {
        button = <button onClick={props.onJoinGame}>Join Game</button>;
    }
    return (
        <div className="phase-panel" style={{ backgroundColor: 'grey' }}>
            <h1>LOBBY</h1>
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end'}}>
                {button}
            </div>
        </div>
    );
}

interface SpoilsPanelProps {
    thisPlayer: string,
    spoils: Spoil[],
    mandatory: boolean,
    territs: Map<string, TerritoryData>,
    onPlaySpoils: (spoils: string[]) => void,
}

function SpoilsPanel(props: SpoilsPanelProps) {
    const [selections, setSelections] = React.useState<Set<string>>(() => new Set());
    const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelections(prev => {
            const updated = new Set(prev);
            if (event.target.checked) {
                updated.add(event.target.name);
            } else {
                updated.delete(event.target.name);
            }
            return updated;
        });
    };
    const spoils = props.spoils.map(spoil => {
        let label: React.ReactElement | string = spoil.name;
        if (props.territs.get(spoil.name)?.owner == props.thisPlayer) {
            label = <b>{label}</b>
        }
        return (
            <div key={spoil.name}>
                <input type="checkbox" name={spoil.name} onChange={changeHandler}/>
                <label htmlFor={spoil.name}><span style={{color: spoil.color}}>{label}</span></label>
            </div>
        );
    });
    let red = 0;
    let green = 0;
    let blue = 0;
    for (const selection of selections.values()) {
        const spoil = props.spoils.find(s => s.name == selection)!;
        switch (spoil.color) {
            case 'red': red += 1; break;
            case 'green': green += 1; break;
            case 'blue': blue += 1; break;
        }
    }
    const enabled = red == 3 || green == 3 || blue == 3 || (red == 1 && green == 1 && blue == 1);
    return (
        <div className="phase-panel" style={{ backgroundColor: 'blue' }}>
            <h1>PLAY SPOILS</h1>
            <div style={{ flexGrow: 1, display: 'flex', backgroundColor: 'white' }}>
                {spoils}
            </div>
            <button disabled={!enabled} onClick={() => props.onPlaySpoils([...selections.values()])}>Play Spoils</button>
            <button disabled={props.mandatory} onClick={() => props.onPlaySpoils([])}>Skip</button>
        </div>
    );
}

interface DeployPanelProps {
    reinforcementsRemaining: number,
    reinforcementsTotal: number,
    onDeploy: () => void,
}

function DeployPanel(props: DeployPanelProps) {
    return (
        <div className="phase-panel" style={{ backgroundColor: 'blue' }}>
            <h1>DEPLOY</h1>
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <p style={{ color: 'white', paddingRight: '4px' }}>Remaining to deploy: {props.reinforcementsRemaining} / {props.reinforcementsTotal}</p>
                <button disabled={props.reinforcementsRemaining > 0} onClick={props.onDeploy}>Issue Deployment Orders</button>
            </div>
        </div>
    );
}

interface AttackPanelProps {
    onFinish: () => void,
}

function AttackPanel(props: AttackPanelProps) {
    return (
        <div className="phase-panel" style={{ backgroundColor: 'red' }}>
            <h1 className="dark">ATTACK</h1>
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={props.onFinish}>End attack</button>
            </div>
        </div>
    );
}

interface AdvancePanelProps {
    onFinish: () => void,
}

function AdvancePanel(props: AdvancePanelProps) {
    return (
        <div className="phase-panel" style={{ backgroundColor: 'orange' }}>
            <h1 className="dark">ADVANCE</h1>
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={props.onFinish}>Advance</button>
            </div>
        </div>
    );
}

interface ReinforcePanelProps {
    skip: boolean,
    onFinish: () => void,
}

function ReinforcePanel(props: ReinforcePanelProps) {
    return (
        <div className="phase-panel" style={{ backgroundColor: 'green' }}>
            <h1>REINFORCE</h1>
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={props.onFinish}>{props.skip ? 'Skip' : 'Reinforce'}</button>
            </div>
        </div>
    );
}

function WaitingPanel() {
    return (
        <div className="phase-panel" style={{ backgroundColor: 'grey' }}>
            <h1>WAITING</h1>
        </div>
    );
}

function EliminatedPanel() {
    return (
        <div className="phase-panel" style={{ backgroundColor: 'black' }}>
            <h1>ELIMINATED</h1>
        </div>
    );
}

function VictoryPanel() {
    return (
        <div className="phase-panel" style={{ backgroundColor: 'purple' }}>
            <h1>VICTORY</h1>
        </div>
    );
}

function LoadingGamePanel() {
    return (
        <div className="phase-panel" style={{ backgroundColor: 'grey' }}>
            <h1>LOADING...</h1>
        </div>
    );
}

interface ErrorGamePanelProps {
    message: string
}

function ErrorGamePanel(props: ErrorGamePanelProps) {
    return (
        <div style={{ backgroundColor: 'grey' }}>
            <h1>ERROR</h1>
            <p>{props.message}</p>
        </div>
    );
}