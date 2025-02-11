const DEBUG_MODE = false;

//class to manage the fields and their updates
/*class BaseField {
    constructor(label, value, onUpdate) {
        this.label = label;
        this.value = value;
        this.onUpdate = onUpdate || (() => {});
        this.element = this.createElement();
        this.next = null; // Circular linked list reference
    }

    createElement() {
        const container = document.createElement('div');
        container.className = 'input-group';

        const labelElement = document.createElement('label');
        labelElement.textContent = this.label;

        this.input = document.createElement('input');
        this.input.type = 'number';
        this.input.value = this.value;
        this.input.style.width = '80px';

        this.input.addEventListener('change', (e) => this.updateValue(e.target.value));

        container.appendChild(labelElement);
        container.appendChild(this.input);
        return container;
    }

    updateValue(newValue) {
        this.value = parseFloat(newValue);
        this.onUpdate(this.value); // Call external update function if provided
        if (this.next) {
            this.next.notifyUpdate(); // Propagate update in the loop
        }
    }

    notifyUpdate() {
        console.log(`"${this.label}" updated to ${this.value}` , this);
    }

    notifyNeighbors(caller) {
        this.notifyUpdate();
        if (this.next && this.next !== caller) {
            this.next.notifyNeighbors();
        }else{
            //exit loop
        }
    }

    insertAfter(newNode) {
        newNode.next = this.next;
        this.next = newNode;
    }
}
*/


let constants = {
    dieselToKWh: 10.5,      // kWh per liter of diesel
    kWhToHydrogen: 0.03,    // tons of hydrogen per kWh
    values: {
        trawler: {
            defaultDieselConsumption: 140000,
            defaultCodCatch: 580,
            ratio: 140000 / 580,
        },
        harbor: {
            defaultMinKWh: 200000,
            defaultMaxKWh: 250000,
            defaultAvgKWh: 225000,
            ratio: 225000 / 580,
        },
        transport: {
            defaultTrucks: 20,
            defaultDistance: 100,

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

class BaseField {
    constructor(label, value, updateCallback) {
        this.label = label;
        this.value = value;
        this.updateCallback = updateCallback || (() => {});
        this.element = this.createElement();
        this.next = null; // For linked loop
    }

    createElement() {
        const container = document.createElement('div');
        container.className = 'input-group';

        const labelElement = document.createElement('label');
        labelElement.textContent = this.label;

        this.input = document.createElement('input');
        this.input.type = 'number';
        this.input.value = this.value;
        this.input.style.width = '93%';
        this.input.addEventListener('change', (e) => this.updateValue(e.target.value));

        container.appendChild(labelElement);
        container.appendChild(this.input);
        return container;
    }

    updateValue(newValue) {
        this.value = parseFloat(newValue);
        this.updateCallback(this.value);
        if (this.next) {
            this.next.notifyUpdate();
        }
    }

    notifyUpdate() {
        console.log(`Updated: ${this.label} -> ${this.value}`);
    }

    insertAfter(newNode) {
        newNode.next = this.next;
        this.next = newNode;
    }
}





class BaseClass {
    constructor(querySelectorStr, valueFields, updateCallback) {
        this.parentField = document.querySelector('.interactive-field[data-info="Trawler Info"]');
        this.value = value;
        this.updateCallback = updateCallback || (() => {});
        this.element = this.createElement();
        this.next = null; // For linked loop
    }

    createCommonField(htmlElement){
        //creates kwh and h2 field, common for every element
    }

    createElement() {
        const container = document.createElement('div');
        container.className = 'input-group';

        const labelElement = document.createElement('label');
        labelElement.textContent = this.label;

        this.input = document.createElement('input');
        this.input.type = 'number';
        this.input.value = this.value;
        this.input.style.width = '93%';
        this.input.addEventListener('change', (e) => this.updateValue(e.target.value));

        container.appendChild(labelElement);
        container.appendChild(this.input);
        return container;
    }

    updateValue(newValue) {
        this.value = parseFloat(newValue);
        this.updateCallback(this.value);
        if (this.next) {
            this.next.notifyUpdate();
        }
    }

    notifyUpdate() {
        console.log(`Updated: ${this.label} -> ${this.value}`);
    }

    insertAfter(newNode) {
        newNode.next = this.next;
        this.next = newNode;
    }
}

//will contain a list of lists
//inner list are all of the variables necessary for an input
//[label:Str, defaultVal:int, ratio:float(optional), currentVal:float, htmlElement:HTMLElement(will be set by the baseclass itsef)]
class DTO { //proxy object?
    constructor(config){
        this.dataset = config;
        this.mass = 0;
    }

    *foreach() {
        for (const property in this) {
            if (this.hasOwnProperty(property)) {
                yield { property, value: this[property] };
            }
        }
    }

    *foreachValue() {
        let i = 0;
        for (const list of this.dataset) {
            yield {
                label: list[0], //string
                defaultVal: list[1], //int
                ratio: list[2] || null, //float
                currentVal: list[3] || list[1], //float
                htmlElement: list[4] || null, //HTMLElement
                iterator: i++
            };
        }
    }
    toString(){
        return JSON.stringify(this.dataset);
    }

    setHtmlElement(index, element){
        this.dataset[index][4] = element;
    }

    getHtmlElement(index){
        return this.dataset[index][4];
    }

    getList(index){
        return this.dataset[index];
    }

    getCustomIndex(indexObject, indexInner){
        return this.dataset[indexObject][indexInner];
    }
}


class BaseClassStripped {
    constructor(querySelectorStr, config, updaterMethod) {
        //this.parentField = document.querySelector('.interactive-field[data-info="Trawler Info"]');
        this.parentField = document.querySelector(querySelectorStr);
        this.dataset = config;
        //this.updateCallback = updateCallback || (() => {});
        this.element = this.createElement();
        this.next = null; // For linked loop
        this.updaterMethod = updaterMethod;
        this.initializeFields();
    }

    initializeFields() {
        for (const { label, defaultVal, ratio, currentVal, htmlElement, iterator } of this.dataset.foreachValue()) {
            //const {container, inputField} =this.createElement(label, defaultVal, currentVal);
            const container = this.createElement(label, defaultVal);
            this.parentField.appendChild(container);
            this.dataset.setHtmlElement(iterator, container);
        }
    }

    /*createCommonField(htmlElement){
        //creates kwh and h2 field, common for every element scrapped that idea
    }*/

    createElement(label, defaultVal) {
        const container = document.createElement('div');
        container.className = 'input-group';

        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        container.labelElement = labelElement; // Store the label element in the container


        const defaultValInput = document.createElement('input');
        defaultValInput.type = 'number';
        defaultValInput.value = defaultVal;
        defaultValInput.style.width = '93%';
        defaultValInput.addEventListener('change', (e) => this.updateValue(container));//this.updateValue(e.target.value));

        container.appendChild(labelElement);
        container.appendChild(defaultValInput);

        //return {container, defaultValInput};
        return container;
    }

    /*updateValue(newValue) {
        this.value = parseFloat(newValue);
        this.updateCallback(this.value);
        if (this.next) {
            this.next.notifyUpdate();
        }
    }*/

    updateValue(htmlElement) {
        this.preUpdate(htmlElement);
    }

    preUpdate(changedElement){
       const newMass = this.updaterMethod(this.dataset, changedElement);
       this.updateNeighbors(newMass, this);

    }

    recalculate(){
        this.updaterMethod();
    }

    updateNeighbors(newMass, caller){
        if (this.next && this.next !== caller) {
            this.next.updateValue(newMass);
            this.next.updateNeighbors(newMass, caller);
        }else{
            //exit loop
        }
    }

    notifyUpdate() {
        console.log(`Updated: ${this.label} -> ${this.value}`);
    }

    insertAfter(newNode) {
        newNode.next = this.next;
        this.next = newNode;
    }
}



function calculateHydrogen(dieselLiters) {
    const kWh = dieselLiters * constants.dieselToKWh;
    return kWh * constants.kWhToHydrogen;
}

/*function initializeFields() {


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
}*/


function initializeFields() {
    const trawler = new BaseClassStripped('.interactive-field[data-info="Trawler Info"]', new DTO([
        ['Cod (tons):', constants.values.trawler.defaultCodCatch, null, null, null],
        ['Diesel (L):', constants.values.trawler.defaultDieselConsumption, null, null, null],
        ['kWh:', 0, null, null, null],
        ['H₂ (tons):', 0, null, null, null]
    ]), updateTrawlerCalculations);

    const harbor = new BaseClassStripped('.interactive-field[data-info="Hafen Info"]', new DTO([
        ['kWh:', constants.values.harbor.defaultMinKWh, null, null, null],
        ['H₂ (tons):', 0, null, null, null]
    ]), updateHarborCalculations);

    const transport = new BaseClassStripped('.interactive-field[data-info="Transport Info"]', new DTO([
        ['Trucks:', constants.values.transport.defaultTrucks, null, null, null],
        ['Distance (km):', 100, null, null, null],
        ['kWh:', 0, null, null, null],
        ['H₂ (tons):', 0, null, null, null]
    ]), updateTransportCalculations);

    const coldStorage = new BaseClassStripped('.interactive-field[data-info="Kühlhaus Info"]', new DTO([
        ['kWh/day:', constants.values.coldStorage.kWhPerDay, null, null, null],
        ['Days:', constants.values.coldStorage.days, null, null, null]
    ]), updateColdStorageCalculations);

    const supermarket = new BaseClassStripped('.interactive-field[data-info="Supermarkt Info"]', new DTO([
        ['kWh/day:', constants.values.supermarket.minKWh, null, null, null]
    ]), updateSupermarketCalculations);

    const constantsField = new BaseClassStripped('.constants-field', new DTO([
        ['Diesel to kWh:', constants.dieselToKWh, null, null, null],
        ['kWh to H₂:', constants.kWhToHydrogen, null, null, null],
        ['Truck litres per 100km:', constants.values.transport.dieselPer100km, null, null, null],
        ['Ship litres per ton:', constants.values.trawler.ratio, null, null, null],
        ['Supermarket tons per m^2:', constants.values.supermarket.minKWh, null, null, null]

    ]), updateConstants);



    //Overwrite the createElement method for the results field only using prototype
    const originalUpdateValue = BaseClassStripped.prototype.createElement();
    BaseClassStripped.prototype.createElement = function (label, defaultVal) {
        const container = document.createElement('div');
        container.className = 'input-group';

        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        container.labelElement = labelElement;

        const defaultValInput = document.createElement('input');
        defaultValInput.type = 'number';
        defaultValInput.value = defaultVal;
        defaultValInput.style.width = '93%';
        defaultValInput.disabled = true;

        container.appendChild(labelElement);
        container.appendChild(defaultValInput);

        return container;
    };
    const resultsField = new BaseClassStripped('.results-field', new DTO([
        ['Total H₂ (tons):', 0, null, null, null]
    ]), updateResults);
    BaseClassStripped.prototype.createElement = originalUpdateValue;


    constantsField.insertAfter(trawler);
    trawler.insertAfter(harbor);
    harbor.insertAfter(transport);
    transport.insertAfter(coldStorage);
    coldStorage.insertAfter(supermarket);
    supermarket.insertAfter(constantsField);
    constantsField.insertAfter(resultsField);




}



function initializeFields_dpr() {
    const fieldGroups = [
        {
            selector: '.interactive-field[data-info="Trawler Info"]',
            fields: [
                new BaseField('Diesel (L):', constants.defaultValues.trawler.dieselConsumption, updateTrawlerCalculations),
                new BaseField('Cod (tons):', constants.defaultValues.trawler.codCatch, (value) => updateTrawlerCalculations(null, value))
            ]
        },
        {
            selector: '.interactive-field[data-info="Hafen Info"]',
            fields: [
                new BaseField('kWh:', constants.defaultValues.harbor.minKWh, updateHarborCalculations)
            ]
        },
        {
            selector: '.interactive-field[data-info="Transport Info"]',
            fields: [
                new BaseField('Trucks:', constants.defaultValues.transport.trucks, updateTransportCalculations),
                new BaseField('L/100km:', constants.defaultValues.transport.dieselPer100km, (value) => updateTransportCalculations(null, value))
            ]
        },
        {
            selector: '.interactive-field[data-info="Kühlhaus Info"]',
            fields: [
                new BaseField('kWh/day:', constants.defaultValues.coldStorage.kWhPerDay, updateColdStorageCalculations),
                new BaseField('Days:', constants.defaultValues.coldStorage.days, (value) => updateColdStorageCalculations(null, value))
            ]
        },
        {
            selector: '.interactive-field[data-info="Supermarkt Info"]',
            fields: [
                new BaseField('kWh/day:', constants.defaultValues.supermarket.minKWh, updateSupermarketCalculations)
            ]
        },
        {
            selector: '.constants-field',
            fields: [
                new BaseField('Diesel to kWh:', constants.dieselToKWh, (value) => updateConstants('dieselToKWh', value)),
                new BaseField('kWh to H₂:', constants.kWhToHydrogen, (value) => updateConstants('kWhToHydrogen', value))
            ]
        }
    ];

    fieldGroups.forEach(group => {
        const container = document.querySelector(group.selector);
        if (container) {
            container.innerHTML = '';
            group.fields.forEach(field => container.appendChild(field.element));
        }
    });
}



// update functions for each section, change later to oop model with self referencing field managing objects
function updateTrawlerCalculations(dto, changedElement = null) {
    console.log(dto.toString());
    dto.foreachValue().forEach(({ label, defaultVal, ratio, currentVal, htmlElement }) => {
        if(htmlElement === changedElement){
            console.log('changed element');
        }else{
        console.log('not found', label, defaultVal, ratio, currentVal, htmlElement);
        }
    });
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

function updateResults() {

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