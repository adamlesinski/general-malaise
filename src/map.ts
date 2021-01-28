const TOKEN_RADIUS = 20;

type MapSelection = MapTerritory | MapTroops | null;
interface MapSelectionDetail {
    current: MapSelection,
    previous: MapSelection,
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

class MapView extends MapElement {
    private _canvas: HTMLCanvasElement;
    private _ctx: CanvasRenderingContext2D | null = null;
    private _panning: boolean = false;
    private _anchorPoint: DOMPoint = new DOMPoint(0, 0);
    private _pointOfInterest: DOMPoint = new DOMPoint(0, 0);
    private _mapScale: number = 1.0;
    private _resizeObserver: ResizeObserver;
    private _mutationObserver: MutationObserver;
    private _selection: MapSelection = null;

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this._canvas = document.createElement('canvas');
        const style = document.createElement('style');
        style.textContent = `
            canvas {
                width: 100%;
                height: 100%;
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
            for (const record of records) {
                for (const removedNode of record.removedNodes) {
                    if (this._selection === removedNode) {
                        const oldSelection = this._selection;
                        this._selection = null;
                        this.dispatchEvent(new CustomEvent<MapSelectionDetail>('map:selection', { detail: { current: null, previous: oldSelection }}));
                    }
                }
            }
            this.invalidateMap();
        });
    }

    connectedCallback() {
        if (!this.isConnected) { return; }
        this._ctx = this._canvas.getContext('2d');

        this._canvas.addEventListener('mousemove', this._mouseMove);
        this._canvas.addEventListener('mousedown', this._mouseDown);
        this._canvas.addEventListener('mouseup', this._mouseUp);
        this._canvas.addEventListener('mouseleave', this._mouseUp);
        this._canvas.addEventListener('click', this._mouseClick);
        this._canvas.addEventListener('wheel', this._mouseWheel);
        this._resizeObserver.observe(this._canvas);
        this._mutationObserver.observe(this, {childList: true, subtree: true});

        this.invalidateMap();
    }

    disconnectedCallback() {
        this._canvas.removeEventListener('mousemove', this._mouseMove);
        this._canvas.removeEventListener('mousedown', this._mouseDown);
        this._canvas.removeEventListener('mouseup', this._mouseUp);
        this._canvas.removeEventListener('mouseleave', this._mouseUp);
        this._canvas.removeEventListener('click', this._mouseClick);
        this._canvas.removeEventListener('wheel', this._mouseWheel);
        this._resizeObserver.disconnect();
        this._mutationObserver.disconnect();
    }

    _mouseMove(event: MouseEvent) {
        if (this._panning) {
            // Handle panning.
            this._anchorPoint.x = event.offsetX;
            this._anchorPoint.y = event.offsetY;
            this.invalidateMap();
        }

        const newHover = this._pickTerritory(event);
        const oldHover = this.querySelector('.hover');
        if (newHover !== oldHover) {
            if (oldHover !== null) {
                oldHover.classList.remove('hover');
            }
            if (newHover !== null) {
                newHover.classList.add('hover');
            }
            this.invalidateMap();
        }
    }

    _mouseDown(event: MouseEvent) {
        this._panning = true;
        const transform = this._territoryInverseTransform();
        this._anchorPoint.x = event.offsetX;
        this._anchorPoint.y = event.offsetY;
        this._pointOfInterest = transform.transformPoint(this._anchorPoint);
    }

    _mouseUp(event: MouseEvent) {
        if (this._panning) {
            this._panning = false;
            const transform = this._territoryInverseTransform();
            this._anchorPoint.x = event.offsetX;
            this._anchorPoint.y = event.offsetY;
            this._pointOfInterest = transform.transformPoint(this._anchorPoint);
        }
    }

    _mouseClick(event: MouseEvent) {
        event.preventDefault();
        let selection: MapSelection = this._pickToken(event);
        if (selection === null) {
            selection = this._pickTerritory(event);
        };

        const oldSelection = this._selection;
        if (selection !== oldSelection) {
            this._selection = selection;
            this.dispatchEvent(new CustomEvent<MapSelectionDetail>('map:selection', { detail: { current: this._selection, previous: oldSelection }}));
            this.invalidateMap();
        }
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
        this._mapScale = Math.min(Math.max(.125, this._mapScale), 4);

        this.invalidateMap();
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
    
    _pickTerritory(event: MouseEvent): MapTerritory | null {
        const transform = this._territoryInverseTransform();
        const mapPoint = transform.transformPoint(new DOMPoint(event.offsetX, event.offsetY));
        for (const territory of <NodeListOf<MapTerritory>>this.querySelectorAll('map-terit')) {
            if (this._ctx!.isPointInPath(territory.path!, mapPoint.x, mapPoint.y)) {
                return territory;
            }
        }
        return null;
    }

    _pickToken(event: MouseEvent): MapTroops | null {
        const transform = this._territoryTransform();
        for (const token of this.querySelectorAll('map-troops')) {
            const terit = token.parentElement! as MapTerritory;
            const center = transform.transformPoint(terit.center);
            const dx = center.x - event.offsetX;
            const dy = center.y - event.offsetY;
            if ((dx * dx) + (dy * dy) < TOKEN_RADIUS * TOKEN_RADIUS) {
                return token as MapTroops;
            }
        }
        return null;
    }

    _render() {
        if (!this.isConnected || !this._ctx) { return; }
        
        // Check if the canvas needs to be resized.
        if (this._canvas.width != this._canvas.clientWidth
            || this._canvas.height != this._canvas.clientHeight) {
            this._canvas.width = this._canvas.clientWidth;
            this._canvas.height = this._canvas.clientHeight;
        }

        const ctx = this._ctx;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw the territories.
        ctx.save();
        const territoryTransform = this._territoryTransform();
        ctx.setTransform(territoryTransform);
        ctx.strokeStyle = 'black';
        for (const territory of <NodeListOf<MapTerritory>>this.querySelectorAll('map-terit')) {
            ctx.stroke(territory.path!);
        }
        
        // Draw hovered territory.
        const hoveredTerritory = this.querySelector('map-terit.hover') as MapTerritory;
        if (hoveredTerritory !== null && this._selection !== hoveredTerritory) {
            ctx.strokeStyle = 'green';
            ctx.stroke(hoveredTerritory.path!);
        }
        ctx.restore();
        
        // Draw the tokens.
        const tokenList = <NodeListOf<MapTroops>>this.querySelectorAll('map-troops');
        ctx.save();
        ctx.fillStyle = 'red';
        ctx.beginPath();
        for (const token of tokenList) {
            const terit = token.parentElement! as MapTerritory;
            const center = territoryTransform.transformPoint(terit.center);
            ctx.moveTo(center.x, center.y);
            ctx.arc(center.x, center.y, TOKEN_RADIUS, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();

        // Draw the text in the tokens.
        ctx.save();
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${TOKEN_RADIUS * 1.5}px sans-serif`;
        ctx.beginPath();
        for (const token of tokenList) {
            const terit = token.parentElement! as MapTerritory;
            const center = territoryTransform.transformPoint(terit.center);
            ctx.fillText(token.amount.toString(), center.x, center.y);
        }
        ctx.restore();

        // Draw the selected token.
        if (this._selection instanceof MapTroops) {
            // Draw selected token.
            ctx.save();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const terit = this._selection.parentElement! as MapTerritory;
            const center = territoryTransform.transformPoint(terit.center);
            ctx.arc(center.x, center.y, TOKEN_RADIUS, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    invalidateMap() {
        window.requestAnimationFrame(this._render);
    }
}

class ImmutableSet<T> extends Object {
    private _set: Set<T>;
    
    constructor(set: Set<T>) {
        super();
        this._set = set;
    }

    get length(): number {
        return this._set.size;
    }

    contains(key: T) {
        return this._set.has(key);
    }

    toString(): string {
        return Array.from(this._set.keys()).join(' ');
    }

    insert(value: T): ImmutableSet<T> {
        return new ImmutableSet(new Set([...this._set, value]));
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this._set.values()
    }
}

class MapTerritory extends MapElement {
    static get observedAttributes(): string[] {
        return ['name', 'neighbours', 'path', 'center', 'buildings'];
    }

    private _name: string | null = null;
    private _neighbours: string[] = [];
    private _path: Path2D | null = null;
    private _center: DOMPoint = new DOMPoint(0, 0);
    private _buildings: ImmutableSet<string> = new ImmutableSet(new Set());

    get name(): string | null { return this._name; }
    get neighbours(): string[] { return this._neighbours; }
    get path(): Path2D | null { return this._path; }
    get center(): DOMPoint { return this._center; }
    get buildings(): ImmutableSet<string> { return this._buildings; }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        switch (name) {
            case 'name': this._name = newValue; break;
            case 'neighbours': this._neighbours = newValue.split(' '); break;
            case 'path': this._path = new Path2D(newValue); break;
            case 'center': {
                const tokens = newValue.split(' ');
                if (tokens.length != 2) {
                    throw new Error('<map-terit> center attr must have 2 coordinates');
                }
                this._center.x = parseFloat(tokens[0].trim());
                this._center.y = parseFloat(tokens[1].trim());
                break;
            }
            case 'buildings': {
                const values = new Set<string>();
                if (newValue != '') {
                    for (const value of newValue.split(' ')) {
                        values.add(value.trim());
                    }
                }
                this._buildings = new ImmutableSet(values);
                break;
            }
        }
        this.invalidateMap();
    }
}

class MapTroops extends MapElement {
    static get observedAttributes(): string[] {
        return ['amount', 'moves'];
    }

    private _amount: number = 0;
    private _moves: number = 0;

    get amount(): number { return this._amount; }
    get moves(): number { return this._moves; }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        switch (name) {
            case 'amount': this._amount = parseInt(newValue); break;
            case 'moves': this._moves = parseInt(newValue); break;
        }
        this.invalidateMap();
    }
}

customElements.define('map-view', MapView);
customElements.define('map-terit', MapTerritory);
customElements.define('map-troops', MapTroops);
