type MoveTroops = {
    src: string,
    dst: string,
    cost: number,
    amount: number,
}

class TroopsPanel extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['amount', 'territory', 'moves', 'connected-territories'];
    }
    
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        const tmpl = document.getElementById('troops-panel-tmpl')! as HTMLTemplateElement;
        const root = this.shadowRoot!;
        root.appendChild(document.importNode(tmpl.content, true));
        const options = root.querySelector('#move-to-options')! as HTMLSelectElement;
        options.addEventListener('input', () => {
            if (options.selectedOptions.length === 0) {
                btn.setAttribute('disabled', 'true');
            } else {
                btn.removeAttribute('disabled');
            }
        });
        const btn = root.querySelector('#move-to-btn')!;
        btn.addEventListener('click', () => {
            const selection = options.selectedOptions.item(0);
            if (selection === null) {
                throw new Error('must select something');
            }

            const keyValue = selection.value.split('=');
            const src = this.getAttribute('territory')!;
            const dst = keyValue[0];
            const cost = parseInt(keyValue[1]);
            const amount = parseInt(this.getAttribute('amount') || '0');
            this.dispatchEvent(new CustomEvent<MoveTroops>('panel:move', { detail: { src: src, dst: dst, cost: cost, amount: amount }}));
        });
    }

    private _updatePossibleMoves(connectedTerritories: string, moves: string) {
        const movesRemaining = parseInt(moves);
        const options = this.shadowRoot!.querySelector('#move-to-options')! as HTMLSelectElement;
        const moveBtn = this.shadowRoot!.querySelector('#move-to-btn')!;
        options.innerText = '';
        
        if (movesRemaining === 0) {
            options.setAttribute('disabled', 'true');
            moveBtn.setAttribute('disabled', 'true');
            return;
        }
        options.removeAttribute('disabled');
        moveBtn.removeAttribute('disabled');

        if (connectedTerritories == '') {
            return;
        }

        for (const pair of connectedTerritories.split(' ')) {
            const keyValue = pair.split('=');
            const territory = keyValue[0];
            const moveCost = parseInt(keyValue[1]);

            if (moveCost <= movesRemaining) {
                const option = document.createElement('option');
                option.setAttribute('value', pair);
                option.textContent = territory;
                options.appendChild(option);
            }
        }
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        const root = this.shadowRoot!;
        switch (name) {
            case 'amount':
                root.querySelector('#troop-amount')!.textContent = newValue;
                break;
            case 'territory':
                root.querySelector('#territory-name')!.textContent = newValue;
                break;
            case 'moves':
                root.querySelector('#troop-moves')!.textContent = newValue;
                this._updatePossibleMoves(this.getAttribute('connected-territories') || '', newValue);
                break;
            case 'connected-territories': {
                this._updatePossibleMoves(newValue, this.getAttribute('moves') || '0');
                break;
            }
        }
    }
}

type BuyTroopsKind = {
    kind: 'troops',
    amount: number
}

type BuyOutpostKind = {
    kind: 'outpost'
}

type BuyBarracksKind = {
    kind: 'barracks'
}

type BuyProduct = BuyTroopsKind | BuyOutpostKind | BuyBarracksKind;

type BuyEvent = {
    product: BuyProduct,
    cost: number
}

class TerritoryPanel extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['name', 'bank', 'buildings'];
    }
    
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        const tmpl = document.getElementById('territory-panel-tmpl')! as HTMLTemplateElement;
        const root = this.shadowRoot!;
        root.appendChild(document.importNode(tmpl.content, true));
        
        const deployInput = root.querySelector('#deploy-input')! as HTMLInputElement;
        const troopCount = new Observable(1);
        deployInput.addEventListener('input', () => {
            if (deployInput.value == '') {
                troopCount.value = 0;
            } else {
                troopCount.value = deployInput.valueAsNumber;
            }
        });
        
        const deployBtn = root.querySelector('#deploy-btn')!;
        troopCount.observe((troopCount) => {
            deployBtn.textContent = `Deploy ${troopCount} troops (-${troopCount} gold)`;
        });
        deployBtn.addEventListener('click', () => {
            let troops = 0;
            if (deployInput.value != '') {
                troops = deployInput.valueAsNumber;
            }
            this.dispatchEvent(new CustomEvent<BuyEvent>('panel:buy', { detail: { product: {kind: 'troops', amount: troops }, cost: troops }}));
        });

        const buildOutpostBtn = root.querySelector('#build-outpost-btn')!;
        buildOutpostBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent<BuyEvent>('panel:buy', { detail: { product: {kind: 'outpost' }, cost: 6 }}));
        });
        const buildBarracksBtn = root.querySelector('#build-barracks-btn')!;
        buildBarracksBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('panel:buy', { detail: { product: { kind: 'barracks'}, cost: 12 }}));
        });
    }

    private _updateBank(bank: number, buildings: string) {
        const root = this.shadowRoot!;
        const deployBtn = root.querySelector('#deploy-btn')!;
        const deployInput = root.querySelector('#deploy-input')! as HTMLInputElement;
        const buildOutpostBtn = root.querySelector('#build-outpost-btn')!
        const buildBarracksBtn = root.querySelector('#build-barracks-btn')!
        
        deployInput.max = bank.toString();
        if (deployInput.valueAsNumber > bank) {
            deployInput.valueAsNumber = bank;
        }
        
        if (bank >= 12 && buildings == '') {
            buildBarracksBtn.removeAttribute('disabled');
        } else {
            buildBarracksBtn.setAttribute('disabled', 'true');
        }
        
        if (bank >= 6 && buildings == '') {
            buildOutpostBtn.removeAttribute('disabled');
        } else {
            buildOutpostBtn.setAttribute('disabled', 'true');
        }

        if (bank >= 1 && buildings.indexOf('barracks') !== -1) {
            deployBtn.removeAttribute('disabled');
            deployInput.removeAttribute('disabled');
        } else {
            deployBtn.setAttribute('disabled', 'true');
            deployInput.setAttribute('disabled', 'true');
            deployInput.valueAsNumber = 1;
        }
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        switch (name) {
            case 'name':
                this.shadowRoot!.querySelector('#territory-name')!.textContent = newValue;
                break;
            case 'bank': {
                this._updateBank(parseInt(newValue), this.getAttribute('buildings') || '');
                break;
            }
            case 'buildings':
                this._updateBank(parseInt(this.getAttribute('bank') || '0'), newValue);
                this.shadowRoot!.querySelector('#buildings')!.textContent = newValue.split(' ').join(', ');
                break;
        }
    }
}

customElements.define('troops-panel', TroopsPanel);
customElements.define('territory-panel', TerritoryPanel);
