const DEBUG_MODE = true;


let constants = {
    dieselToKWh: 10.5,      // kWh per liter of diesel
    kWhToHydrogen: 0.03,    // tons of hydrogen per kWh
    defaultValues: {
        trawler: {
            dieselConsumption: 140000,
            codCatch: 580
        },
        harbor: {
            minKWh: 200000,
            maxKWh: 250000,
            fishTons: 580
        },
        transport: {
            trucks: 20,
            dieselPer100km: 37.5,  // average of 35-40 change this for others?
            distance: 100
        },
        coldStorage: {
            kWhPerDay: 40000,
            days: 7
        },
        supermarket: {
            minKWh: 4000,
            maxKWh: 10000,
            area: {
                min: 800,
                max: 2500
            }
        }
    }
};



function createInputField(label, value, onChange) {
    const container = document.createElement('div');
    container.className = 'input-group';

    const labelElement = document.createElement('label');
    labelElement.textContent = label;

    const input = document.createElement('input');
    input.type = 'number';
    input.value = value;
    input.style.width = '80px';
    input.addEventListener('change', onChange);

    container.appendChild(labelElement);
    container.appendChild(input);
    return container;
}


/* //with rounding functionality, task for later
function createInputField(label, value, onChange, options = {}) {
    const container = document.createElement('div');
    container.className = 'input-group';

    const labelElement = document.createElement('label');
    labelElement.textContent = label;

    const input = document.createElement('input');
    input.type = 'number';

    // default formatting options
    const formatOptions = {
        decimals: options.decimals ?? 2,
        min: options.min ?? 0,
        max: options.max ?? Infinity,
        step: options.step ?? 1
    };


    input.step = formatOptions.step;
    input.min = formatOptions.min;
    input.max = formatOptions.max;


    input.value = value.toFixed(formatOptions.decimals);

    input.addEventListener('change', (e) => {
        // within min-max range
        let newValue = Math.max(formatOptions.min,
            Math.min(formatOptions.max, parseFloat(e.target.value)));

        // round
        e.target.value = newValue.toFixed(formatOptions.decimals);

        //replace with modified
        onChange(e);
    });

    container.appendChild(labelElement);
    container.appendChild(input);
    return container;
}
*/


function calculateHydrogen(dieselLiters) {
    const kWh = dieselLiters * constants.dieselToKWh;
    return kWh * constants.kWhToHydrogen;
}

function initializeFields() {


    const trawlerField = document.querySelector('.interactive-field[data-info="Trawler Info"]');
    trawlerField.innerHTML = '';
    trawlerField.appendChild(createInputField('Diesel (L):', constants.defaultValues.trawler.dieselConsumption,
        (e) => updateTrawlerCalculations(e.target.value)));
    trawlerField.appendChild(createInputField('Cod (tons):', constants.defaultValues.trawler.codCatch,
        (e) => updateTrawlerCalculations(null, e.target.value)));



    const harborField = document.querySelector('.interactive-field[data-info="Hafen Info"]');
    harborField.innerHTML = '';
    harborField.appendChild(createInputField('kWh:', constants.defaultValues.harbor.minKWh,
        (e) => updateHarborCalculations(e.target.value)));



    const transportField = document.querySelector('.interactive-field[data-info="Transport Info"]');
    transportField.innerHTML = '';
    transportField.appendChild(createInputField('Trucks:', constants.defaultValues.transport.trucks,
        (e) => updateTransportCalculations(e.target.value)));
    transportField.appendChild(createInputField('L/100km:', constants.defaultValues.transport.dieselPer100km,
        (e) => updateTransportCalculations(null, e.target.value)));



    const coldStorageField = document.querySelector('.interactive-field[data-info="Kühlhaus Info"]');
    coldStorageField.innerHTML = '';
    coldStorageField.appendChild(createInputField('kWh/day:', constants.defaultValues.coldStorage.kWhPerDay,
        (e) => updateColdStorageCalculations(e.target.value)));
    coldStorageField.appendChild(createInputField('Days:', constants.defaultValues.coldStorage.days,
        (e) => updateColdStorageCalculations(null, e.target.value)));



    const supermarketField = document.querySelector('.interactive-field[data-info="Supermarkt Info"]');
    supermarketField.innerHTML = '';
    supermarketField.appendChild(createInputField('kWh/day:', constants.defaultValues.supermarket.minKWh,
        (e) => updateSupermarketCalculations(e.target.value)));



    const constantsField = document.querySelector('.constants-field');
    constantsField.innerHTML = '';
    constantsField.appendChild(createInputField('Diesel to kWh:', constants.dieselToKWh,
        (e) => updateConstants('dieselToKWh', e.target.value)));
    constantsField.appendChild(createInputField('kWh to H₂:', constants.kWhToHydrogen,
        (e) => updateConstants('kWhToHydrogen', e.target.value)));
}

// update functions for each section, change later to oop model with self referencing field managing objects
function updateTrawlerCalculations(diesel, cod) {
    if (diesel){
        constants.defaultValues.trawler.dieselConsumption = parseFloat(diesel);
        console.log(calculateHydrogen(diesel));
    }
    if (cod) constants.defaultValues.trawler.codCatch = parseFloat(cod);

}

function updateHarborCalculations(kWh) {
    if (kWh) constants.defaultValues.harbor.minKWh = parseFloat(kWh);

}

function updateTransportCalculations(trucks, dieselConsumption) {
    if (trucks) constants.defaultValues.transport.trucks = parseFloat(trucks);
    if (dieselConsumption) constants.defaultValues.transport.dieselPer100km = parseFloat(dieselConsumption);

}

function updateColdStorageCalculations(kWhPerDay, days) {
    if (kWhPerDay) constants.defaultValues.coldStorage.kWhPerDay = parseFloat(kWhPerDay);
    if (days) constants.defaultValues.coldStorage.days = parseFloat(days);

}

function updateSupermarketCalculations(kWh) {
    if (kWh) constants.defaultValues.supermarket.minKWh = parseFloat(kWh);

}

function updateConstants(key, value) {
    constants[key] = parseFloat(value);

    initializeFields();
}



if (DEBUG_MODE) {
    const mapContainer = document.getElementById('mapContainer');
    let firstClick = null;

    mapContainer.addEventListener('click', (e) => {

        const rect = mapContainer.getBoundingClientRect();
        const relativeX = Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100));
        const relativeY = Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100));

        if (!firstClick) {
            firstClick = { x: relativeX, y: relativeY };
            console.log('First corner set:',
                `X: ${relativeX.toFixed(1)}%, Y: ${relativeY.toFixed(1)}%`,
                '\nClick again to set second corner');
        } else {
            const left = Math.min(firstClick.x, relativeX);
            const right = Math.max(firstClick.x, relativeX);
            const top = Math.min(firstClick.y, relativeY);
            const bottom = Math.max(firstClick.y, relativeY);

            console.log('Rectangle Position:');
            console.log(`style="left: ${left.toFixed(1)}%; top: ${top.toFixed(1)}%; right: ${(100-right).toFixed(1)}%; bottom: ${(100-bottom).toFixed(1)}%;"`);

            console.log('\nCorner Positions:');
            console.log(`Top-left: X: ${left.toFixed(1)}%, Y: ${top.toFixed(1)}%`);
            console.log(`Bottom-right: X: ${right.toFixed(1)}%, Y: ${bottom.toFixed(1)}%`);

            firstClick = null;
        }
    });
}


// ############################ Main Execution ############################
document.addEventListener('DOMContentLoaded', initializeFields);