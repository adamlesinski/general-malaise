const TOKEN_RADIUS = 20;

class MapView extends HTMLElement {
    static get observedAttributes() {
        return [];
    }

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
        this.shadowRoot.append(style, this._canvas);
        
        this._render = this._render.bind(this);
        this._mouseMove = this._mouseMove.bind(this);
        this._mouseDown = this._mouseDown.bind(this);
        this._mouseUp = this._mouseUp.bind(this);
        this._mouseClick = this._mouseClick.bind(this);
        this._mouseWheel = this._mouseWheel.bind(this);
        this._resizeObserver = new ResizeObserver(() => {
            window.requestAnimationFrame(this._render);
        });

        this._territories = {};
        this._panning = false;
        this._anchorPoint = new DOMPoint(0, 0);
        this._pointOfInterest = new DOMPoint(0, 0);
        this._mapScale = 1.0;
        this._hoverTerritory = null;
        this._tokenSelected = null;
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

        window.requestAnimationFrame(this._render);
    }

    disconnectedCallback() {
        this._canvas.removeEventListener('mousemove', this._mouseMove);
        this._canvas.removeEventListener('mousedown', this._mouseDown);
        this._canvas.removeEventListener('mouseup', this._mouseUp);
        this._canvas.removeEventListener('mouseleave', this._mouseUp);
        this._canvas.removeEventListener('click', this._mouseClick);
        this._canvas.removeEventListener('wheel', this._mouseWheel);
        this._resizeObserver.unobserve(this._canvas);
    }

    _mouseMove(event) {
        if (this._panning) {
            // Handle panning.
            this._anchorPoint.x = event.offsetX;
            this._anchorPoint.y = event.offsetY;
            window.requestAnimationFrame(this._render);
        }

        const newHover = this._pickTerritory(event);
        if (newHover != this._hoverTerritory) {
            this._hoverTerritory = newHover;
            window.requestAnimationFrame(this._render);
        }
    }

    _mouseDown(event) {
        this._panning = true;
        const transform = this._territoryInverseTransform();
        this._anchorPoint.x = event.offsetX;
        this._anchorPoint.y = event.offsetY;
        this._pointOfInterest = transform.transformPoint(this._anchorPoint);
    }

    _mouseUp(event) {
        if (this._panning) {
            this._panning = false;
            const transform = this._territoryInverseTransform();
            this._anchorPoint.x = event.offsetX;
            this._anchorPoint.y = event.offsetY;
            this._pointOfInterest = transform.transformPoint(this._anchorPoint);
        }
    }

    _mouseClick(event) {
        event.preventDefault();
        const token = this._pickToken(event);
        if (token != this._tokenSelected) {
            this._tokenSelected = token;
            if (this._tokenSelected !== null) {
                console.info(`selected "${this._tokenSelected}" token`);
            } else {
                console.info('deselected token');
            }
            window.requestAnimationFrame(this._render);
        }
    }

    _mouseWheel(event) {
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

        window.requestAnimationFrame(this._render);
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
    
    _pickTerritory(event) {
        const transform = this._territoryInverseTransform();
        const mapPoint = transform.transformPoint(new DOMPoint(event.offsetX, event.offsetY));
        for (const territory of Object.values(this._territories)) {
            if (this._ctx.isPointInPath(territory.path, mapPoint.x, mapPoint.y)) {
                return territory.name;
            }
        }
        return null;
    }

    _pickToken(event) {
        const transform = this._territoryTransform();
        for (const territory of Object.values(this._territories)) {
            const center = transform.transformPoint(territory.center);
            const dx = center.x - event.offsetX;
            const dy = center.y - event.offsetY;
            if ((dx * dx) + (dy * dy) < TOKEN_RADIUS * TOKEN_RADIUS) {
                return territory.name;
            }
        }
        return null;
    }

    territoryAdded(terit) {
        this._territories[terit.name] = terit;
        window.requestAnimationFrame(this._render);
    }

    territoryRemoved(terit) {
        delete this._territories[terit.name];
        window.requestAnimationFrame(this._render);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this._canvas.setAttribute(name, newValue);
        window.requestAnimationFrame(this._render);
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
        for (const territory of Object.values(this._territories)) {
            if (territory.name == this._hoverTerritory) {
                ctx.strokeStyle = 'green';
                ctx.stroke(territory.path);
                ctx.strokeStyle = 'black';
            } else {
                ctx.stroke(territory.path);
            }
        }
        ctx.restore();
        
        // Draw the tokens.
        ctx.save();
        ctx.fillStyle = 'red';
        ctx.beginPath();
        for (const territory of Object.values(this._territories)) {
            const center = territoryTransform.transformPoint(territory.center);
            ctx.moveTo(center.x, center.y);
            ctx.arc(center.x, center.y, TOKEN_RADIUS, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();

        if (this._tokenSelected !== null) {
            // Draw selected token.
            ctx.save();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const center = territoryTransform.transformPoint(this._territories[this._tokenSelected].center);
            ctx.arc(center.x, center.y, TOKEN_RADIUS, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}

class MapTerritory extends HTMLElement {
    static get observedAttributes() {
        return ['name', 'neighbours', 'path', 'center'];
    }

    constructor() {
        super();
        this.name = null;
        this.neighbours = [];
        this.path = null;
        this.center = {
            x: 0,
            y: 0,
        };
    }

    connectedCallback() {
        if (this.isConnected) {
            if (!(this.parentElement instanceof MapView)) {
                throw new Error('parent of <map-terit> must be <map-view>');
            }
            this.parentElement.territoryAdded(this);
        }
    }

    disconnectedCallback() {
        this.parentElement.territoryRemoved(this);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'name': this.name = newValue; break;
            case 'neighbours': this.neighbours = newValue.split(' '); break;
            case 'path': this.path = new Path2D(newValue); break;
            case 'center': {
                const tokens = newValue.split(' ');
                if (tokens.length != 2) {
                    throw new Error('<map-terit> center attr must have 2 coordinates');
                }
                this.center.x = parseFloat(tokens[0]);
                this.center.y = parseFloat(tokens[1]);
                break;
            }
        }
    }
}

customElements.define('map-view', MapView);
customElements.define('map-terit', MapTerritory);
