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
            <h1>ATTACK</h1>
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
            <h1>ADVANCE</h1>
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
        <div style={{ backgroundColor: 'grey', display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}>
            <h1 style={{ padding: '8px', margin: 0, fontSize: '16pt', color: 'white' }}>ERROR</h1>
            <p>{props.message}</p>
        </div>
    );
}