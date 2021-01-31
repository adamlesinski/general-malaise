interface ControlPanelProps {
    territs: Map<string, TerritoryData>,
    players: Map<string, Player>,
    activePlayer: string,
}

function ControlPanel(props: ControlPanelProps) {
    const rows = [...props.players.values()].map(player => {
        const [territs, troops] = [...props.territs.values()]
            .filter(territ => territ.owner == player.name)
            .reduce(([prev_territs, prev_troops], territ) => {
                return [prev_territs + 1, prev_troops + territ.troops];
            }, [0, 0]);
        return (
            <tr key={player.name}>
                <td>{player.name}</td>
                <td>?</td>
                <td>{territs}</td>
                <td>{troops}</td>
                <td>?</td>
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