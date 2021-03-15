const TOKEN_RADIUS = 20;
const TOKEN_ADDITIONAL_RADIUS = 10;

type MapSelection = MapTroopsElement;
type MapHoverTarget = MapTerritoryElement | MapTroopsElement;

class MapSelectionEvent extends CustomEvent<{ target: MapSelection | null}> {
    constructor(target: MapSelection | null) {
        super('map:selection', {
            detail: {
                target: target,
            }
        });
    }
}

class MapHoverEvent extends CustomEvent<{ target: MapHoverTarget | null }> {
    constructor(target: MapHoverTarget | null) {
        super('map:hover', {
            detail: {
                target: target,
            }
        });
    }
}

class MapElement extends HTMLElement {
    constructor() {
        super();
    }

    invalidateMap() {
        if (this.parentElement instanceof MapElement) {
            this.parentElement.invalidateMap();
        }
    }
}

class MapViewElement extends MapElement {
    private _canvas: HTMLCanvasElement;
    private _ctx: CanvasRenderingContext2D | null = null;
    private _renderRequest: number | null = null;
    private _panning: boolean = false;
    private _mouseDownOrigin: DOMPoint | null = null;
    private _ignoreClick: boolean = false;
    private _anchorPoint: DOMPoint = new DOMPoint(0, 0);
    private _pointOfInterest: DOMPoint = new DOMPoint(0, 0);
    private _mapScale: number = 1.0;
    private _resizeObserver: ResizeObserver;
    private _mutationObserver: MutationObserver;
    private _lastHover: MapHoverTarget | null = null;

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this._canvas = document.createElement('canvas');
        const style = document.createElement('style');
        style.textContent = `
            canvas {
                width: 100%;
                height: 100%;
                touch-action: none;
            }
        `;
        this.shadowRoot!.append(style, this._canvas);
        
        this._render = this._render.bind(this);
        this._mouseMove = this._mouseMove.bind(this);
        this._mouseDown = this._mouseDown.bind(this);
        this._mouseUp = this._mouseUp.bind(this);
        this._mouseClick = this._mouseClick.bind(this);
        this._mouseWheel = this._mouseWheel.bind(this);
        this._resizeObserver = new ResizeObserver(() => {
            this.invalidateMap();
        });
        this._mutationObserver = new MutationObserver(records => {
            this.invalidateMap();
        });
    }

    connectedCallback() {
        if (!this.isConnected) { return; }
        this._ctx = this._canvas.getContext('2d');

        this._canvas.addEventListener('pointermove', this._mouseMove);
        this._canvas.addEventListener('pointerdown', this._mouseDown);
        this._canvas.addEventListener('click', this._mouseClick);
        this._canvas.addEventListener('wheel', this._mouseWheel);
        this._resizeObserver.observe(this._canvas);
        this._mutationObserver.observe(this, {childList: true, subtree: true});

        this.invalidateMap();
    }

    disconnectedCallback() {
        this._canvas.removeEventListener('mousemove', this._mouseMove);
        this._canvas.removeEventListener('mousedown', this._mouseDown);
        this._canvas.removeEventListener('click', this._mouseClick);
        this._canvas.removeEventListener('wheel', this._mouseWheel);
        this._resizeObserver.disconnect();
        this._mutationObserver.disconnect();
    }

    _mouseMove(event: MouseEvent) {
        if (this._mouseDownOrigin !== null && !this._panning) {
            const dx = event.offsetX - this._mouseDownOrigin.x;
            const dy = event.offsetY - this._mouseDownOrigin.y;
            const distanceSquared = (dx * dx) + (dy * dy);
            if (distanceSquared > 5*5) {
                // The mouse has moved enough to mark this as a pan.
                this._panning = true;
                const transform = this._territoryInverseTransform();
                this._anchorPoint.x = this._mouseDownOrigin.x;
                this._anchorPoint.y = this._mouseDownOrigin.y;
                this._pointOfInterest = transform.transformPoint(this._anchorPoint);
                this._mouseDownOrigin = null;
            }
        }
        
        if (this._panning) {
            // Handle panning.
            this._anchorPoint.x = event.offsetX;
            this._anchorPoint.y = event.offsetY;
            this.invalidateMap();
        }

        let newHover: MapHoverTarget | null = this._pickToken(event);
        if (!newHover) {
            newHover = this._pickTerritory(event);
        }
        if (newHover !== this._lastHover) {
            this._lastHover = newHover;
            this.dispatchEvent(new MapHoverEvent(newHover));
        }
    }

    _mouseDown(event: MouseEvent) {
        this._ignoreClick = false;
        this._mouseDownOrigin = new DOMPoint(event.offsetX, event.offsetY);
        this._canvas.addEventListener('pointerup', this._mouseUp);
        this._canvas.addEventListener('pointerleave', this._mouseUp);
    }

    _mouseUp(event: MouseEvent) {
        this._mouseDownOrigin = null;
        if (this._panning) {
            this._panning = false;
            this._ignoreClick = true;
            const transform = this._territoryInverseTransform();
            this._anchorPoint.x = event.offsetX;
            this._anchorPoint.y = event.offsetY;
            this._pointOfInterest = transform.transformPoint(this._anchorPoint);

            this._canvas.removeEventListener('mouseup', this._mouseUp);
            this._canvas.removeEventListener('mouseleave', this._mouseUp);    
        }
    }

    _mouseClick(event: MouseEvent) {
        event.preventDefault();
        if (this._ignoreClick) {
            return;
        }
        this.dispatchEvent(new MapSelectionEvent(this._pickToken(event)));
    }

    _mouseWheel(event: MouseEvent) {
        event.preventDefault();
        if (this._panning) {
            return;
        }

        const transform = this._territoryInverseTransform();
        this._anchorPoint.x = event.offsetX;
        this._anchorPoint.y = event.offsetY;
        this._pointOfInterest = transform.transformPoint(this._anchorPoint);

        this._mapScale += event.deltaY * -0.01;

        // Restrict scale
        this._mapScale = Math.min(Math.max(1.0, this._mapScale), 8);

        this.invalidateMap();
    }

    _updateOverlays(transform: DOMMatrix) {
        for (const overlay of document.getElementById('overlays')!.querySelectorAll('[data-tracking]') as NodeListOf<HTMLElement>) {
            const territ = this.querySelector(`map-territory[name=${overlay.getAttribute('data-tracking')}]`) as MapTerritoryElement;
            const center = transform.transformPoint(territ.center);
            const newLeft = `${center.x - (50 * 0.5)}px`;
            const newTop = `${center.y - (50 + TOKEN_RADIUS)}px`;
            if (overlay.style.left != newLeft) {
                overlay.style.left = newLeft;
            }
            if (overlay.style.top != newTop) {
                overlay.style.top = newTop;
            }
        }
    }
    
    _territoryTransform() {
        let transform = new DOMMatrix([1, 0, 0, 1, 0, 0]);
        transform.translateSelf(-this._pointOfInterest.x * this._mapScale, -this._pointOfInterest.y * this._mapScale); 
        transform.scaleSelf(this._mapScale, this._mapScale);
        transform.translateSelf(this._anchorPoint.x / this._mapScale, this._anchorPoint.y / this._mapScale);
        return transform;
    }
    
    _territoryInverseTransform() {
        let transform = this._territoryTransform();
        transform.invertSelf();
        return transform;
    }
    
    _pickTerritory(event: MouseEvent): MapTerritoryElement | null {
        const transform = this._territoryInverseTransform();
        const mapPoint = transform.transformPoint(new DOMPoint(event.offsetX, event.offsetY));
        for (const territory of this.querySelectorAll('map-territory') as NodeListOf<MapTerritoryElement>) {
            if (this._ctx!.isPointInPath(territory.path!, mapPoint.x, mapPoint.y)) {
                return territory;
            }
        }
        return null;
    }

    _pickToken(event: MouseEvent): MapTroopsElement | null {
        const transform = this._territoryTransform();
        for (const token of this.querySelectorAll('map-troops')) {
            const territ = token.parentElement! as MapTerritoryElement;
            const center = transform.transformPoint(territ.center);
            const dx = center.x - event.offsetX;
            const dy = center.y - event.offsetY;
            if ((dx * dx) + (dy * dy) < TOKEN_RADIUS * TOKEN_RADIUS) {
                return token as MapTroopsElement;
            }
        }
        return null;
    }

    _render() {
        this._renderRequest = null;
        if (!this.isConnected || !this._ctx) { return; }
        
        // Check if the canvas needs to be resized.
        const expectedCanvasWidth = Math.floor(this._canvas.clientWidth * window.devicePixelRatio);
        const expectedCanvasHeight = Math.floor(this._canvas.clientHeight * window.devicePixelRatio);
        if (this._canvas.width != expectedCanvasWidth
            || this._canvas.height != expectedCanvasHeight) {
            this._canvas.width = expectedCanvasWidth;
            this._canvas.height = expectedCanvasHeight;
        }

        const ctx = this._ctx;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Draw the territories.
        ctx.save();
        const territoryTransform = this._territoryTransform();
        ctx.setTransform(ctx.getTransform().multiplySelf(territoryTransform));
        ctx.strokeStyle = 'black';
        for (const territory of this.querySelectorAll('map-territory') as NodeListOf<MapTerritoryElement>) {
            ctx.stroke(territory.path!);
        }
        
        // Draw hovered territory.
        const hoveredTerrit = this.querySelector('map-territory[hovered=true]') as MapTerritoryElement | null;
        if (hoveredTerrit) {
            ctx.strokeStyle = 'green';
            ctx.stroke(hoveredTerrit.path);
        }
        ctx.restore();
        
        // Draw the tokens.
        const tokenList = this.querySelectorAll('map-troops') as NodeListOf<MapTroopsElement>;
        const tokenColorMap = tokenList.groupBy(node => node.color);
        for (const [color, tokens] of tokenColorMap) {
            ctx.save();
            ctx.fillStyle = color;
            ctx.beginPath();
            for (const token of tokens) {
                const territ = token.parentElement! as MapTerritoryElement;
                const center = territoryTransform.transformPoint(territ.center);
                ctx.moveTo(center.x, center.y);
                ctx.arc(center.x, center.y, TOKEN_RADIUS, 0, Math.PI * 2);

                if (token.additional) {
                    const distance = TOKEN_RADIUS + TOKEN_ADDITIONAL_RADIUS;
                    const additionalX = center.x + (distance * Math.sin(Math.PI / 4));
                    const additionalY = center.y - (distance * Math.cos(Math.PI / 4));
                    ctx.moveTo(additionalX, additionalY);
                    ctx.arc(additionalX, additionalY, TOKEN_ADDITIONAL_RADIUS, 0, Math.PI * 2);
                }
            }
            ctx.fill();
            ctx.restore();
        }

        // Draw the text in the tokens.
        ctx.save();
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${TOKEN_RADIUS * 1.5}px sans-serif`;
        ctx.beginPath();
        for (const token of tokenList) {
            const territ = token.parentElement! as MapTerritoryElement;
            const center = territoryTransform.transformPoint(territ.center);
            ctx.fillText(token.amount.toString(), center.x, center.y);
        }
        ctx.font = `${TOKEN_ADDITIONAL_RADIUS * 1.5}px sans-serif`;
        for (const token of tokenList) {
            if (token.additional) {
                const territ = token.parentElement! as MapTerritoryElement;
                const center = territoryTransform.transformPoint(territ.center);
                const distance = TOKEN_RADIUS + TOKEN_ADDITIONAL_RADIUS;
                const additionalX = center.x + (distance * Math.sin(Math.PI / 4));
                const additionalY = center.y - (distance * Math.cos(Math.PI / 4));
                ctx.fillText(`+${token.additional}`, additionalX, additionalY);
            }
        }
        ctx.restore();

        // Draw the arrows.
        const arrowList = this.querySelectorAll('map-arrow') as NodeListOf<MapArrowElement>;
        for (const arrowElement of arrowList) {
            ctx.save();
            ctx.fillStyle = arrowElement.color;
            const srcEl = this.querySelector(`map-territory[name=${arrowElement.src}]`)! as MapTerritoryElement;
            const dstEl = this.querySelector(`map-territory[name=${arrowElement.dst}]`)! as MapTerritoryElement;
            const src = territoryTransform.transformPoint(srcEl.center);
            const dst = territoryTransform.transformPoint(dstEl.center);
            ctx.translate(src.x, src.y);
            const dx = dst.x - src.x;
            const dy = dst.y - src.y;
            const distance = Math.sqrt((dx * dx) + (dy * dy)) - (TOKEN_RADIUS * 2);
            const bodyLength = distance * 0.8;
            const arrowSize = distance * 0.2;
            ctx.rotate(Math.atan2(dy, dx));
            ctx.beginPath();
            ctx.moveTo(TOKEN_RADIUS, 0);
            ctx.lineTo(TOKEN_RADIUS + bodyLength, -arrowSize * 0.33);
            ctx.lineTo(TOKEN_RADIUS + bodyLength, -arrowSize * 0.66);
            ctx.lineTo(TOKEN_RADIUS + distance, 0);
            ctx.lineTo(TOKEN_RADIUS + bodyLength, arrowSize * 0.66);
            ctx.lineTo(TOKEN_RADIUS + bodyLength, arrowSize * 0.33);
            ctx.lineTo(TOKEN_RADIUS, 0);
            ctx.fill();
            ctx.restore();
        }

        // Draw the selected token.
        const selectedTerrit = this.querySelector('map-troops[selected=true]') as MapTerritoryElement | null;
        if (selectedTerrit) {
            ctx.save();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const territ = selectedTerrit.parentElement! as MapTerritoryElement;
            const center = territoryTransform.transformPoint(territ.center);
            ctx.arc(center.x, center.y, TOKEN_RADIUS, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw the highlighted tokens.
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 5]);
        for (const token of tokenList) {
            if (token.highlighted) {
                ctx.beginPath();
                const territ = token.parentElement! as MapTerritoryElement;
                const center = territoryTransform.transformPoint(territ.center);
                ctx.arc(center.x, center.y, TOKEN_RADIUS, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();

        ctx.restore();
        this._updateOverlays(territoryTransform);
    }

    invalidateMap() {
        if (this._renderRequest == null) {
            this._renderRequest = window.requestAnimationFrame(this._render);
        }
    }
}

class MapTerritoryElement extends MapElement {
    static get observedAttributes(): string[] {
        return ['name', 'neighbours', 'path', 'center', 'hovered'];
    }

    private _name: string = '';
    private _neighbours: string[] = [];
    private _path: Path2D = new Path2D();
    private _center: DOMPoint = new DOMPoint(0, 0);
    private _hovered: boolean = false;

    get name(): string { return this._name; }
    get neighbours(): string[] { return this._neighbours; }
    get path(): Path2D { return this._path; }
    get center(): DOMPoint { return this._center; }
    get hovered(): boolean { return this._hovered; }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        switch (name) {
            case 'name': this._name = newValue; break;
            case 'neighbours': this._neighbours = newValue.split(' '); break;
            case 'path': this._path = new Path2D(newValue); break;
            case 'center': {
                const tokens = newValue.split(' ');
                if (tokens.length != 2) {
                    throw new Error('<map-territory> center attr must have 2 coordinates');
                }
                this._center.x = parseFloat(tokens[0].trim());
                this._center.y = parseFloat(tokens[1].trim());
                break;
            }
            case 'hovered': this._hovered = (newValue.toLowerCase() == 'true'); break;
        }
        this.invalidateMap();
    }
}

class MapTroopsElement extends MapElement {
    static get observedAttributes(): string[] {
        return ['amount', 'additional', 'color', 'highlighted', 'selected'];
    }

    private _amount: number = 0;
    private _additional: number = 0;
    private _color: string = 'black';
    private _highlighted: boolean = false;
    private _selected: boolean = false;

    get amount(): number { return this._amount; }
    get additional(): number { return this._additional; }
    get color(): string { return this._color; }
    get highlighted(): boolean { return this._highlighted; }
    get selected(): boolean { return this._selected; }

    get territory(): MapTerritoryElement | null {
        return this.parentElement as MapTerritoryElement | null;
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        switch (name) {
            case 'amount': this._amount = parseInt(newValue); break;
            case 'additional': this._additional = parseInt(newValue); break;
            case 'color': this._color = newValue; break;
            case 'highlighted': this._highlighted = (newValue.toLowerCase() == 'true'); break;
            case 'selected': this._selected = (newValue.toLowerCase() == 'true'); break;
        }
        this.invalidateMap();
    }
}

class MapArrowElement extends MapElement {
    static get observedAttributes(): string[] {
        return ['src', 'dst', 'color'];
    }

    private _src: string = '';
    private _dst: string = '';
    private _color: string = '#000000';

    get src(): string { return this._src; }
    get dst(): string { return this._dst; }
    get color(): string { return this._color; }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        switch (name) {
            case 'src': this._src = newValue; break;
            case 'dst': this._dst = newValue; break;
            case 'color': this._color = newValue; break;
        }
        this.invalidateMap();
    }
}

customElements.define('map-view', MapViewElement);
customElements.define('map-territory', MapTerritoryElement);
customElements.define('map-troops', MapTroopsElement);
customElements.define('map-arrow', MapArrowElement);
