interface WebsocketProps {
    gameId: string,
    applyEvent: (event: GameEvent) => void,
}

function Websocket(props: WebsocketProps) {
    React.useEffect(() => {
        const ws = new WebSocket(`ws://${document.location.host}/api/v1/game/${props.gameId}/watch`);
        ws.onclose = event => {
            console.log("connection closed:", event);
        };
        ws.onmessage = event => {
            const message = JSON.parse(event.data) as GameEvent;
            props.applyEvent(message);
        };
        return () => { console.log('closing'); ws.close(); };  
    }, [props.gameId]);
    return null;
}
