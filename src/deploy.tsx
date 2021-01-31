interface DeployPanelProps {
    remainingReinforcements: number,
    totalReinforcements: number,
}

function DeployPanel(props: DeployPanelProps) {
    return (
        <div style={{ backgroundColor: 'blue', display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}>
            <h1 style={{ padding: '8px', margin: 0, fontSize: '16pt', color: 'white' }}>DEPLOY</h1>
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <p style={{ color: 'white' }}>{props.remainingReinforcements} / {props.totalReinforcements}</p>
                <button>Finalize Deployment</button>
            </div>
        </div>
    );
}
