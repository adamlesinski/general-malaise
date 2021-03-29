interface ControlPanelProps {
    players: Player[],
    activePlayer: string,
    thisPlayer: string,
    territs: Map<string, TerritoryData>,
}

function ControlPanel(props: ControlPanelProps) {
    const rows = props.players.map(player => {
        let playerName = <span style={{color: player.color}}>{player.name}</span>
        if (props.thisPlayer == player.name) {
            playerName = <b>{playerName}</b>
        }
        if (props.activePlayer == player.name) {
            playerName = <span>--&gt; {playerName} &lt;--</span>;
        }
        if (player.eliminated) {
            playerName = <s>{playerName}</s>;
        }
        
        return (
            <tr key={player.name}>
                <td>{playerName}</td>
                <td>{player.spoils.length}</td>
                <td>{player.territories}</td>
                <td>{player.troops}</td>
                <td>{player.reinforcements}</td>
            </tr>
        );
    });
    const spoils = props.players.find(p => p.name == props.thisPlayer)?.spoils.map(spoil => {
        let label: React.ReactElement | string = `[${spoil.name}]`;
        if (props.territs.get(spoil.name)!.owner == props.thisPlayer) {
            label = <b>{label}</b>
        }
        return <span key={spoil.name} style={{color: spoil.color}}>{label}</span>;
    });
    return (
        <React.Fragment>
            <table>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Spoils</th>
                        <th>Territs</th>
                        <th>Troops</th>
                        <th>Reinforcements</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
            <h3>Spoils</h3>
            <p>{spoils}</p>
        </React.Fragment>
    );
}

interface TerritoryDetailsProps {
    name: string,
    owner: string,
    troops: number,
    neighbours: Neighbour[],
}

function TerritoryDetails(props: TerritoryDetailsProps) {
    return (
        <div>
            <p><b>{props.name}</b></p>
            <p>Owned by <u>{props.owner}</u> with <b>{props.troops}</b> troops</p>
            <p>Neighbours: {props.neighbours.map(n => n.name).join(', ')}</p>
        </div>
    );
}