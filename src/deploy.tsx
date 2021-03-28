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
    onFinish: () => void,
}

function ReinforcePanel(props: ReinforcePanelProps) {
    return (
        <div className="phase-panel" style={{ backgroundColor: 'green' }}>
            <h1>REINFORCE</h1>
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={props.onFinish}>Reinforce</button>
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