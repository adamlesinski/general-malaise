window.onload = function () {
    var bank = 34;

    const goldSpan = document.getElementById('current-gold');
    goldSpan.innerText = `${bank}`;

    const mapView = document.querySelector('map-view');

    mapView.addEventListener('map:selected', event => {
        if (event.target instanceof MapTerritory) {
            const terit = event.target;
            const tmpl = document.getElementById('territory-control-panel-tmpl');
            const node = tmpl.content.cloneNode(true);
            node.querySelector('#territory-name').innerText = terit.name;
            if (terit.buildings.length === 0) {
                if (bank - 6 >= 0) {
                    const buildOutpostBtn = node.querySelector('#build-outpost-btn');
                    buildOutpostBtn.removeAttribute('disabled');
                    buildOutpostBtn.addEventListener('click', () => {
                        if (bank - 6 < 0) {
                            throw new Error('insufficient funds');
                        }
                        terit.setAttribute('buildings', 'outpost');
                        bank -= 6;
                        goldSpan.innerText = `${bank}`;
                        buildOutpostBtn.setAttribute('disabled', true);
                    });
                }
                if (bank - 12 >= 0) {
                    const buildBarracksBtn = node.querySelector('#build-barracks-btn');
                    buildBarracksBtn.removeAttribute('disabled');
                    buildBarracksBtn.addEventListener('click', () => {
                        if (bank - 12 < 0) {
                            throw new Error('insufficient funds');
                        }
                        terit.setAttribute('buildings', 'barracks');
                        bank -= 6;
                        goldSpan.innerText = `${bank}`;
                        buildBarracksBtn.setAttribute('disabled', true);
                    });
                }
            } else if (terit.buildings.contains('barracks') && bank > 0) {
                const deployBtn = node.querySelector('#deploy-btn');
                const deployInput = node.querySelector('#deploy-input');
                deployInput.removeAttribute('disabled');
                deployInput.addEventListener('change', () => {
                    const amount = deployInput.value;
                    const cost = amount;
                    deployBtn.innerText = `Deploy ${amount} troops (-${cost})`;
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

                    let troops = terit.querySelector('map-troops');
                    if (troops === null) {
                        troops = terit.appendChild(document.createElement('map-troops'));
                    }
            
                    bank -= cost;
                    goldSpan.innerText = `${bank}`;
                    troops.setAttribute('amount', troops.amount + amount);
                    
                    deployInput.value = 1;
                    deployInput.dispatchEvent(new Event('change'));
                });
            }
            document.getElementById('contextual-panel').appendChild(node);
        } else if (event.target instanceof MapTroops) {
            const troops = event.target;
            const tmpl = document.getElementById('troops-control-panel-tmpl');
            const node = tmpl.content.cloneNode(true);
            node.querySelector('#territory-name').innerText = troops.parentElement.name;
            node.querySelector('#troop-amount').innerText = troops.amount;
            node.querySelector('#troop-moves').innerText = troops.moves;
            document.getElementById('contextual-panel').appendChild(node);
        }
    });

    mapView.addEventListener('map:deselected', () => {
        const panel = document.getElementById('contextual-panel');
        while (panel.firstChild) {
            panel.removeChild(panel.lastChild);
        }
    });
};