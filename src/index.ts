window.onload = function () {
    var bank = 34;

    const goldSpan = document.getElementById('current-gold')!;
    goldSpan.textContent = `${bank}`;

    const mapView = document.querySelector('map-view')!;

    mapView.addEventListener('map:selected', event => {
        if (event.target instanceof MapTerritory) {
            const terit = event.target;
            const tmpl = document.getElementById('territory-control-panel-tmpl')! as HTMLTemplateElement;
            const node = tmpl.content.cloneNode(true) as HTMLElement;
            node.querySelector('#territory-name')!.textContent = terit.name;
            if (terit.buildings.length === 0) {
                if (bank - 6 >= 0) {
                    const buildOutpostBtn = node.querySelector('#build-outpost-btn')!;
                    buildOutpostBtn.removeAttribute('disabled');
                    buildOutpostBtn.addEventListener('click', () => {
                        if (bank - 6 < 0) {
                            throw new Error('insufficient funds');
                        }
                        terit.setAttribute('buildings', 'outpost');
                        bank -= 6;
                        goldSpan.textContent = `${bank}`;
                        buildOutpostBtn.setAttribute('disabled', 'true');
                    });
                }
                if (bank - 12 >= 0) {
                    const buildBarracksBtn = node.querySelector('#build-barracks-btn')!;
                    buildBarracksBtn.removeAttribute('disabled');
                    buildBarracksBtn.addEventListener('click', () => {
                        if (bank - 12 < 0) {
                            throw new Error('insufficient funds');
                        }
                        terit.setAttribute('buildings', 'barracks');
                        bank -= 6;
                        goldSpan.textContent = `${bank}`;
                        buildBarracksBtn.setAttribute('disabled', 'true');
                    });
                }
            } else if (terit.buildings.contains('barracks') && bank > 0) {
                const deployBtn = node.querySelector('#deploy-btn')!;
                const deployInput = node.querySelector('#deploy-input')! as HTMLInputElement;
                deployInput.removeAttribute('disabled');
                deployInput.addEventListener('change', () => {
                    const amount = deployInput.value;
                    const cost = amount;
                    deployBtn.textContent = `Deploy ${amount} troops (-${cost})`;
                });
                deployBtn.removeAttribute('disabled');
                deployBtn.addEventListener('click', () => {
                    const amount = parseInt(deployInput.value);
                    if (amount < 1) {
                        throw new Error('must be a positive integer');
                    }
                    const cost = amount;
                    if (bank - cost < 0) {
                        throw new Error('insufficient funds');
                    }

                    let troops = terit.querySelector('map-troops') as MapTroops;
                    if (troops === null) {
                        troops = terit.appendChild(document.createElement('map-troops')) as MapTroops;
                    }
            
                    bank -= cost;
                    goldSpan.textContent = `${bank}`;
                    troops.setAttribute('amount', `${troops.amount + amount}`);
                    
                    deployInput.value = '1';
                    deployInput.dispatchEvent(new Event('change'));
                });
            }
            document.getElementById('contextual-panel')!.appendChild(node);
        } else if (event.target instanceof MapTroops) {
            const troops = event.target;
            const tmpl = document.getElementById('troops-control-panel-tmpl')! as HTMLTemplateElement;
            const node = tmpl.content.cloneNode(true) as HTMLElement;
            const terit = troops.parentElement! as MapTerritory;
            node.querySelector('#territory-name')!.textContent = terit.name;
            node.querySelector('#troop-amount')!.textContent = `${troops.amount}`;
            node.querySelector('#troop-moves')!.textContent = `${troops.moves}`;
            document.getElementById('contextual-panel')!.appendChild(node);
        }
    });

    mapView.addEventListener('map:deselected', () => {
        const panel = document.getElementById('contextual-panel')!;
        while (panel.firstChild) {
            panel.removeChild(panel.lastChild!);
        }
    });
};