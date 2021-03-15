interface DeployPanelProps {
    remainingReinforcements: number,
    totalReinforcements: number,
    onDeploy: () => void,
}

function DeployPanel(props: DeployPanelProps) {
    return (
        <div style={{ backgroundColor: 'blue', display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}>
            <h1 style={{ padding: '8px', margin: 0, fontSize: '16pt', color: 'white' }}>DEPLOY</h1>
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <p style={{ color: 'white', paddingRight: '4px' }}>Remaining to deploy: {props.remainingReinforcements} / {props.totalReinforcements}</p>
                <button disabled={props.remainingReinforcements > 0} onClick={props.onDeploy}>Issue Deployment Orders</button>
            </div>
        </div>
    );
}

interface ActionPanelProps {
    onFinish: () => void,
}

function ActionPanel(props: ActionPanelProps) {
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