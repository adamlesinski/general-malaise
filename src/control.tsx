interface ControlPanelProps {
    players: Map<string, Player>,
    activePlayer: string,
    thisPlayer: string,
}

function ControlPanel(props: ControlPanelProps) {
    const rows = [...props.players.values()].map(player => {
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
                <td>?</td>
                <td>{player.territories}</td>
                <td>{player.troops}</td>
                <td>{player.reinforcements}</td>
            </tr>
        );
    });
    return (
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
    );
}