interface DeployPanelProps {
    reinforcementsRemaining: number,
    reinforcementsTotal: number,
    onDeploy: () => void,
}

function DeployPanel(props: DeployPanelProps) {
    return (
        <div style={{ backgroundColor: 'blue', display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}>
            <h1 style={{ padding: '8px', margin: 0, fontSize: '16pt', color: 'white' }}>DEPLOY</h1>
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
        <div style={{ backgroundColor: 'red', display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}>
            <h1 style={{ padding: '8px', margin: 0, fontSize: '16pt', color: 'white' }}>ATTACK</h1>
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
        <div style={{ backgroundColor: 'orange', display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}>
            <h1 style={{ padding: '8px', margin: 0, fontSize: '16pt', color: 'white' }}>ADVANCE</h1>
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
        <div style={{ backgroundColor: 'green', display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}>
            <h1 style={{ padding: '8px', margin: 0, fontSize: '16pt', color: 'white' }}>REINFORCE</h1>
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={props.onFinish}>Reinforce</button>
            </div>
        </div>
    );
}

function WaitingPanel() {
    return (
        <div style={{ backgroundColor: 'grey', display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}>
            <h1 style={{ padding: '8px', margin: 0, fontSize: '16pt', color: 'white' }}>WAITING</h1>
        </div>
    );
}

function LoadingGamePanel() {
    return (
        <div style={{ backgroundColor: 'grey', display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}>
            <h1 style={{ padding: '8px', margin: 0, fontSize: '16pt', color: 'white' }}>LOADING...</h1>
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