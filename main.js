import {modalSystem} from './intro.js';

const DEBUG_MODE = false;

let constants = { // TODO hydrogen mass is closer to kg than tons; factor 1000
    dieselToKWh: 10.5,      // kWh per liter of diesel
    kWhToHydrogen: 0.00003,    // tons of hydrogen per kWh //edit: this is not tons per kWh, but kg per kWh, so 0.03 needs to be corrected to 0.00003
    values: {
        trawler: {
            defaultDieselConsumption: 140000,
            defaultCodCatch: 580,
            ratio: 140000 / 580, // dieselLiters per cod ton
        },
        harbor: {
            defaultMinKWh: 200000,
            defaultMaxKWh: 250000,
            defaultAvgKWh: 225000,
            ratio: 225000 / 580, // kWh per cod ton
        },
        transport: {
            defaultTrucks: 20,
            defaultDistance: 100,
            tonsPerTruck: 580/20,
            dieselPer100km: 37.5,  // average of 35-40 change this for others?
            distance: 100
        },
        coldStorage: {
            maxCapacity: 5000, // tons for which the cold storage is designed, and the kwh per day applies
            kWhPerDay: 40000, // kWh per day for the cold storage, assuming lower or equal to maxCapacity
            maxCapRatio: 40000/5000, // kWh per ton for the cold storage
            days: 7
        },
        supermarket: {
            minKWh: 4000,
            maxKWh: 10000,
            //maxDays: 7, //if the fish is stored longer than 7 days, it needs to
            kWhPerMarketPerDay: (4000+10000)/2,
            tonsPerSupermarket: 15, // TODO: Add tooltip : "Anstatt der realistischen 15 kg pro Supermarkt pro Tag wird hier von 15 Tonnen ausgegangen"
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

//will contain a list of lists
//inner list are all of the variables necessary for an input
//[label:Str, defaultVal:int, ratio:float(optional), currentVal:float, htmlElement:HTMLElement(will be set by the baseclass itsef)]
class DTO { //proxy object?
    constructor(config){
        this.dataset = config;
        this.mass = 0;
        this.kWh = 0;
    }

    *forEach() {
        for (const property in this) {
            if (this.hasOwnProperty(property)) {
                yield { property, value: this[property] };
            }
        }
    }

    *forEachValue() {
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
        return `Mass: \t${this.mass},\nDataset: \n`+JSON.stringify(this.dataset, null, 2);//"\t");
    }

    setHtmlElement(index, element){
        this.dataset[index][4] = element;
    }

    setValue(index, value){
        this.dataset[index][3] = value;
    }

    getValue(index){
        return this.dataset[index][3] !== null ? this.dataset[index][3] : this.dataset[index][1];
    }

    getLabel(index){
        return this.dataset[index][0];
    }


    getHtmlElement(index){
        return this.dataset[index][4];
    }

    setKWh(kWh){
        this.kWh = Number(kWh);
    }

    getKWh(){
        return Number(this.kWh);
    }

    setMass(mass){
        this.mass = mass;
    }

    getMass(){
        return this.mass;
    }

    getList(index){
        return this.dataset[index];
    }

    getCustomIndex(indexObject, indexInner){
        return this.dataset[indexObject][indexInner];
    }


}


class BaseClassStripped {
    constructor(chartName, querySelectorStr, config, updaterMethod, loopExitCallback = null) {
        //this.parentField = document.querySelector('.interactive-field[data-info="Trawler Info"]');
        this.parentField = document.querySelector(querySelectorStr);
        this.dataset = config;
        //this.updateCallback = updateCallback || (() => {});
        this.element = this.createElement();
        this.next = null; // For linked loop
        this.updaterMethod = updaterMethod;
        this.label = chartName;
        this.initializeFields();
        this.disableUpdate = false; // Flag to prevent unwanted recursion
        this.loopExitCallback = loopExitCallback || (() => {}); // used to update the results tab when finished
    }

    initializeFields() {
        for (const { label, defaultVal, ratio, currentVal, htmlElement, iterator } of this.dataset.forEachValue()) {
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
        container.labelElement = labelElement; // Store the label element in the container under the labelElement property


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
        //temporarily disable with flag, when adjusting the html elements to prevent unwanted recursion
        if( this.disableUpdate) {
            console.warn('Update disabled, returning early');
            return;
        }

        this.preUpdate(htmlElement);

    }

    preUpdate(changedElement) {
        if(glob_temp_log)console.warn('preupdate start');
        const newMass = this.updaterMethod(this.dataset, changedElement, 0);

        // Pass 'this' as the originalCaller the node we started from
        //after updating the dto, load all the values into the html elements

        this.adjustHTMLfromDTO(this.dataset);

        if(newMass < 0) {
            console.warn('New mass is undefined or negative, indicating that the mass remains unchanged; returning early');
            return;
        }else if(newMass === undefined || newMass == null){ //mass doesnt change, but values need updating; see updateConstants
            this.next.updateNeighbors(newMass, this);
            console.warn('mass is undefined, constants induced value refresh; calling updateNeighbors nevertheless');
        }else{
            this.next.updateNeighbors(newMass, this);
        }



    }

    recalculate(){
        this.updaterMethod();
    }

    updateNeighbors(newMass, originalCaller) {
        if (this === originalCaller) {
            this.loopExitCallback();
            return;
        }

        if(originalCaller === globalThis.constantsField) {
            if(glob_temp_log)console.log('Updating neighbors from constants field');
            this.updaterMethod(this.dataset, originalCaller, newMass)
        }else{
            if(glob_temp_log)console.log(`normal update`);
            this.updaterMethod(this.dataset, null, newMass);
        }

        this.adjustHTMLfromDTO(this.dataset);

        this.next.updateNeighbors(newMass, originalCaller);
    }


    adjustHTMLfromDTO(dto) {
        this.disableUpdate = true; // temporarily disable updates to prevent recursion
        //console.log(`Adjusting HTML elements for ${this.label} with dataset: ${dto.toString()}`);
        for (const { label, defaultVal, ratio, currentVal, htmlElement, iterator } of dto.forEachValue()) {
            const inputElement = htmlElement.querySelector('input');
            //console.log(`Adjusting HTML element: ${htmlElement}, input: ${htmlElement.querySelector('input')}, value: ${htmlElement.querySelector('input').value} for ${label}: currentVal=${currentVal}, defaultVal=${defaultVal}`);
            if (inputElement) {
                //inputElement.value = currentVal !== null ? Number(currentVal).toFixed(2) : defaultVal;
                //inputElement.value = currentVal !== null ? Number(currentVal).toLocaleString(undefined, { maximumFractionDigits: 2 }): defaultVal;

                if(this.getName()!== '_Constants') { //TODO!! fix this ugly piece of hardcoded edgecase bullshit
                    // change the prototype of the method in the instantiation process instead; see also updateNeighbors
                    inputElement.value = currentVal !== null ? parseFloat(Number(currentVal).toFixed(2)) : defaultVal;
                }else{
                    inputElement.value = currentVal !== null ? Number(currentVal) : defaultVal;
                }
                }
        }

        if(glob_temp_log)console.log(`Adjusted HTML elements for ${this.label} with dataset: ${dto.toString()}`);

        this.disableUpdate = false; // reenable updates after adjustment
    }

    notifyUpdate() {
        console.log(`Updated: ${this.label} -> ${this.value}`);
    }

    /*insertAfter(newNode) { //confusing name
        newNode.next = this.next;
        this.next = newNode;
    } */

    insertBefore(newNode) {
        //newNode.next = this; //who wrote this shit //now the loop will kinda crash if its not closed correctly
        this.next = newNode
        //if(newNode.next === null) newNode.next = this;
    }

    getName(){
        return this.label;
    }

    getKWh(){
        return this.dataset.getKWh();
    }

    toString(){
        return this.dataset.toString();
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

//[label:Str, defaultVal:int, ratio:float(optional), currentVal:float, htmlElement:HTMLElement(will be set by the baseclass itsef)]

function initializeFields() {
    // create a mutable callback container, to avoid circular dependency issues
    const callbackContainer = {
        callback: () => {} // placeholder
    };
    // helper function that calls the current callback
    const loopExitCallback = () => callbackContainer.callback();
//all of this shouldnt be necessary, the error was elsewhere

    const trawler = new BaseClassStripped('Trawler','.interactive-field[data-info="Trawler Info"]', new DTO([
        ['Cod (tons):', constants.values.trawler.defaultCodCatch, constants.values.trawler.defaultCodCatch/constants.values.trawler.defaultDieselConsumption, null, null], //ratio is codTons/dieselLiters
        ['Diesel (L):', constants.values.trawler.defaultDieselConsumption, null, null, null], //ratio is dieselLiters/kwh set by the constants object
        ['kWh:', 0, null, null, null],
        ['H₂ (tons):', 0, null, null, null]
    ]), updateTrawlerCalculations, loopExitCallback);

    const harbor = new BaseClassStripped('Harbor', '.interactive-field[data-info="Hafen Info"]', new DTO([
        ['kWh:', constants.values.harbor.defaultMinKWh, null, null, null],
        ['H₂ (tons):', 0, null, null, null]
    ]), updateHarborCalculations, loopExitCallback);

    const transport = new BaseClassStripped('Transport', '.interactive-field[data-info="Transport Info"]', new DTO([
        ['Trucks:', constants.values.transport.defaultTrucks, null, null, null],
        ['Distance (km):', 100, null, null, null],
        ['kWh:', 0, null, null, null],
        ['H₂ (tons):', 0, null, null, null]
    ]), updateTransportCalculations, loopExitCallback);

    const coldStorage = new BaseClassStripped('Cold Storage', '.interactive-field[data-info="Kühlhaus Info"]', new DTO([
        ['Days:', constants.values.coldStorage.days, null, null, null],
        ['kWh/day:', constants.values.coldStorage.kWhPerDay, null, null, null],
        ['H₂ (tons):', 0, null, null, null]

    ]), updateColdStorageCalculations, loopExitCallback);

    const supermarket = new BaseClassStripped('Supermarkets', '.interactive-field[data-info="Supermarkt Info"]', new DTO([
        //['Supermarkets: ', 10, null, null, null], //figure out average supermarket cod ton supply
        ['Days:', constants.values.coldStorage.days, null, null, null],
        ['kWh/day:', constants.values.supermarket.minKWh, null, null, null],
        ['H₂ (tons):', 0, null, null, null]
    ]), updateSupermarketCalculations, loopExitCallback);


    DTO.prototype.getDieselToKwh = function () {
        return this.getValue(0); // Assuming the diesel to kWh value is at index 0
    }
    DTO.prototype.getKWhToHydrogen = function () {
        return this.getValue(1); // Assuming the kWh to Hydrogen value is at index 1
    }
    DTO.prototype.getTruckLitresPer100km = function () {
        return this.getValue(2); // Assuming the truck litres per 100km value is at index 2
    }
    DTO.prototype.getShipLitresPerTon = function () {
        return this.getValue(3); // Assuming the ship litres per ton value is at index 3
    }
    DTO.prototype.getTonsSoldPerSupermarket = function () {
        return this.getValue(4); // Assuming the tons sold per supermarket value is at index 4
    }
    DTO.prototype.getHarborKWhPerTon = function () {
        return this.getValue(5); // Assuming the harbor kWh per ton value is at index 5
    }

    globalThis.constantsField = new BaseClassStripped('_Constants', '.constants-field', new DTO([
        ['Diesel to kWh:', constants.dieselToKWh, null, null, null],
        ['kWh to H₂:', constants.kWhToHydrogen, null, null, null],
        ['Truck litres per 100km:', constants.values.transport.dieselPer100km, null, null, null],
        ['Ship litres per ton:', constants.values.trawler.ratio, null, null, null],
        ['Tons sold per Supermarket:', constants.values.supermarket.tonsPerSupermarket, null, null, null],
        ['Harbor kWh per ton:', constants.values.harbor.ratio, null, null, null],

    ]), updateConstants, loopExitCallback);

   /* // unreadable dynamically add methods to the DTO prototype for constantsField
    constantsField.dataset.forEachValue(({ label, iterator }) => {
        const methodName = `get${label.replace(/[^a-zA-Z0-9]/g, '')}`; // create a method name by sanitizing the label
        DTO.prototype[methodName] = function () {
            return this.getValue(iterator);
        };
    }); */



    const fieldsList = [ trawler, harbor, transport, coldStorage, supermarket ];


    //Overwrite the createElement method for the results field only using prototype
    //Additionally create a new Method for updating own pie chart and results field
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
    BaseClassStripped.prototype.updateResultsField = function (fieldsList, chart) {
        let totalKWh = 0;
        const labels = [];
        const data = [];

        //gather labels and kWh values
        for (const field of fieldsList) {
            const label = field.getName();
            const kWh = Number(field.getKWh());

            //console.log(`Field: ${label}, kWh: ${kWh}`);
            labels.push(label);
            data.push(kWh);
            totalKWh += kWh;
        }

        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update();

        const totalH2 = totalKWh * constants.kWhToHydrogen;
        this.dataset.setValue(0, totalKWh);
        this.dataset.setValue(1, totalH2);
        //this.dataset.getHtmlElement(0).querySelector('input').value = totalKWh;
        //this.dataset.getHtmlElement(1).querySelector('input').value = totalH2;
        this.adjustHTMLfromDTO(this.dataset);
    };

    const resultsField = new BaseClassStripped('_Results', '.results-field', new DTO([
        ['Total kWh:', 0, null, null, null],
        ['Total H₂ (tons):', 0, null, null, null]
    ]), updateResults, loopExitCallback);

    BaseClassStripped.prototype.createElement = originalUpdateValue;
    //BaseClassStripped.prototype.updateResultsField = null; // reset the method to its original state


    //will insert the calling field before the passed field, name might be misleading
    constantsField.insertBefore(trawler);
    trawler.insertBefore(harbor);
    harbor.insertBefore(transport);
    transport.insertBefore(coldStorage);
    coldStorage.insertBefore(supermarket);
    supermarket.insertBefore(resultsField);
    resultsField.insertBefore(constantsField);


    const chartRef = initializeChart();
    callbackContainer.callback = () => {
        //console.log('Loop exit callback called');
        //console.log('results field:' + resultsField.toString());
        resultsField.updateResultsField(fieldsList, chartRef);
    };



}


function initializeChart() {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    const data = {
        labels: ['Trawler', 'Harbor', 'Transport', 'Cold Storage', 'Supermarket'],
        datasets: [{
            label: 'Results: ',
            data: [300, 50, 100, 150, 240], //dummy data, change that
            backgroundColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)',
                'rgb(75, 192, 192)',
                'rgb(153, 102, 255)'
            ],
            hoverOffset: 4
        }]
    };

    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 0.55,
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'start',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    };

    return new Chart(ctx, config);
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

const glob_temp_log = false;

function getChangedIndex(dto, changedElement){
    let index = -1;
    //compare this.dataset with dto.getDataset
    //console.log("\t\t this dataset" + this.dataset.toString());
    //console.log("\t\t this dto" + dto.getDataset().toString());

    if(changedElement === constants){

    }


    //dto.forEachValue(({ label, defaultVal, ratio, currentVal, htmlElement, iterator }) => {
    //for (const { label, defaultVal, ratio, currentVal, htmlElement, iterator } of this.dataset.forEachValue()) { //this refers to the caller; and the base class
    for (const { label, defaultVal, ratio, currentVal, htmlElement, iterator } of dto.forEachValue()) {
        if(glob_temp_log)console.log(`Label: ${label}, Default Value: ${defaultVal}, Ratio: ${ratio}, Current Value: ${currentVal}, Iterator: ${iterator}`);
        if (label === changedElement.labelElement.textContent) {
            if(glob_temp_log)console.log(`found element label: ${label}, iterator: ${iterator}, htmlElement: ${htmlElement}`)
            index = iterator;
        }
    }
    // });

    return index;

}


// update functions for each section, change later to oop model with self referencing field managing objects
//trawler dto contains: //codTons, dieselLiters, kWh, hydrogen
function updateTrawlerCalculations(dto, changedElement = null, newMass) {
    if(changedElement === globalThis.constantsField){ // custom edgecase to avoid having to change method signature; recalculate every constant dependent field
        const codTons = dto.getValue(0);
        const dieselLiters = codTons * globalThis.constantsField.dataset.getShipLitresPerTon();
        const kWh = dieselLiters * globalThis.constantsField.dataset.getDieselToKwh();
        const hydrogen = kWh * globalThis.constantsField.dataset.getKWhToHydrogen();

        dto.setValue(0, codTons);
        dto.setValue(1, dieselLiters);
        dto.setValue(2, kWh);
        dto.setValue(3, hydrogen);
        return;
    }


    if (changedElement === null){
        //induced update, changed different element, recalculate based on new mass
        if(glob_temp_log)console.log("prechange:", dto.toString());
        //for this element the recalculation is easy since we can just save the newMass as codTons and recursively call this method to simulate a change of codTons
        dto.setValue(0, newMass); //set codTons to newMass
        dto.getHtmlElement(0).querySelector('input').value = newMass; //update the html element to reflect the new value;
        //only needed because baseclass would do this after the recursive call, but because we are doing this recursively, and simulate a manual change of codTons, we need to do this here
        //seems like an architectural flaw, but this workaround will do for now
        updateTrawlerCalculations(dto, dto.getHtmlElement(0), newMass); //simulate manual change of codTons, to avoid redundant code //superficial kwh and mass fields also get updated here
        if(glob_temp_log)console.log("postchange:", dto.toString());

        return newMass; //return new mass; technically only needed for initial caller, like could be the case in below code
    }
    //determine changed value -> update other values based on that
    //push everything into the dto (necessary??)
    //new mass?


    const index = getChangedIndex(dto, changedElement);
    dto.setValue(index, changedElement.querySelector('input').value); //push changed value into the dto!

    switch (index) {
        case 0: //codTons changed
            if(glob_temp_log)console.log("codTons changed, index: " + index);
            //update dieselLiters, kWh and hydrogen based on codTons
            const codTons_dto0 = dto.getValue(0);
            const dieselLiters_dto0 = codTons_dto0 * globalThis.constantsField.dataset.getShipLitresPerTon();
            const kWh_dto0 = dieselLiters_dto0 * globalThis.constantsField.dataset.getDieselToKwh(); //constants.dieselToKWh; // TODO pull from constants
            const hydrogen_dto0 = kWh_dto0*globalThis.constantsField.dataset.getKWhToHydrogen(); //calculateHydrogen(dieselLiters_dto0); // TODO pull from constants

            dto.setValue(1, dieselLiters_dto0);
            dto.setValue(2, kWh_dto0);
            dto.setValue(3, hydrogen_dto0);
            break;
        case 1: //dieselLiters changed
            if(glob_temp_log)console.log("dieselLiters changed, index: " + index);
            //update codTons, kWh and hydrogen based on dieselLiters
            const dieselLiters_dto1 = dto.getValue(1);
            const codTons_dto1 = dieselLiters_dto1 / globalThis.constantsField.dataset.getShipLitresPerTon(); //constants.values.trawler.ratio; // TODO pull from constants
            const kWh_dto1 = dieselLiters_dto1 * globalThis.constantsField.dataset.getDieselToKwh() //constants.dieselToKWh;    // TODO pull from constants
            const hydrogen_dto1 = kWh_dto1*globalThis.constantsField.dataset.getKWhToHydrogen(); //calculateHydrogen(dieselLiters_dto1); // TODO pull from constants

            dto.setValue(0, codTons_dto1);
            dto.setValue(2, kWh_dto1);
            dto.setValue(3, hydrogen_dto1);
            break;
        case 2: //kWh changed
            if(glob_temp_log)console.log("kWh changed, index: " + index);
            //update codTons, dieselLiters and hydrogen based on kWh
            const kWh_dto2 = dto.getValue(2);
            const dieselLiters_dto2 = kWh_dto2 / globalThis.constantsField.dataset.getDieselToKwh(); //constants.dieselToKWh; // TODO pull from constants
            const codTons_dto2 = dieselLiters_dto2 / globalThis.constantsField.dataset.getShipLitresPerTon(); // constants.values.trawler.ratio; // TODO pull from constants
            const hydrogen_dto2 = kWh_dto2 * globalThis.constantsField.dataset.getKWhToHydrogen(); //calculateHydrogen(dieselLiters_dto2); // TODO pull from constants

            dto.setValue(0, codTons_dto2);
            dto.setValue(1, dieselLiters_dto2);
            dto.setValue(3, hydrogen_dto2);
            break;
        case 3: //hydrogen changed
            if(glob_temp_log)console.log("hydrogen changed, index: " + index);
            //update codTons, dieselLiters and kWh based on hydrogen
            const hydrogen_dto3 = dto.getValue(3);
            const kWh_dto3 = hydrogen_dto3 / globalThis.constantsField.dataset.getKWhToHydrogen(); //constants.kWhToHydrogen; // TODO pull from constants
            const dieselLiters_dto3 = kWh_dto3 / globalThis.constantsField.dataset.getDieselToKwh(); //constants.dieselToKWh; // TODO pull from constants
            const codTons_dto3 = dieselLiters_dto3 / globalThis.constantsField.dataset.getShipLitresPerTon(); //constants.values.trawler.ratio; // TODO pull from constants

            dto.setValue(0, codTons_dto3);
            dto.setValue(1, dieselLiters_dto3);
            dto.setValue(2, kWh_dto3);
            break;
        default:
            console.warn(`Unknown index: ${index}`);
            break;
    }


    if(glob_temp_log)console.log("passed element: " + changedElement);
    if(glob_temp_log)console.log(changedElement.labelElement.textContent);

    if(glob_temp_log)console.log("changing value at. "+dto.getLabel(index));
    //dto.setValue(index, changedElement.querySelector('input').value);

    for (const { label, defaultVal, ratio, currentVal, htmlElement, iterator } of dto.forEachValue()) {
        if(glob_temp_log)console.log(`Label: ${label}, Default Value: ${defaultVal}, Ratio: ${ratio}, Current Value: ${currentVal}, Iterator: ${iterator}`);

    }

        /*console.log(dto.toString());
        dto.forEachValue().forEach(({ label, defaultVal, ratio, currentVal, htmlElement }) => {
            if(htmlElement === changedElement){
                console.log('changed element');
            }else{
            console.log('not found', label, defaultVal, ratio, currentVal, htmlElement);
            }
        });*/

    dto.setKWh(dto.getValue(2));
    dto.setMass(dto.getValue(0))
    return dto.getValue(0); //return codTons, needed if this updater method was the initial caller and the new mass is to be passed to the next updater method
}

function updateHarborCalculations(dto, changedElement = null, newMass) {
    if(changedElement === globalThis.constantsField){ // custom edgecase to avoid having to change method signature; recalculate every constant dependent field
        const codTons = dto.getMass();
        const kWh = codTons * globalThis.constantsField.dataset.getHarborKWhPerTon();

        updateHarborCalculations(dto, dto.getHtmlElement(0), newMass); //simulate manual change of kWh, to avoid redundant code

        dto.setValue(0, kWh);
        return codTons; //return new mass; technically only needed for initial caller, like could be the case in below code
    }


    if (changedElement === null){
        //induced update, changed different element, recalculate based on new mass

        const kWh = newMass * constants.values.harbor.ratio; //calculate kWh based on new mass //neednt be pulled from constantsfield; doesnt change
        dto.setValue(0, kWh);
        dto.getHtmlElement(0).querySelector('input').value = kWh; //update the html element to reflect the new value;
        //only needed because baseclass would do this after the recursive call, but because we are doing this recursively, and simulate a manual change of kWh, we need to do this here
        //seems like an architectural flaw, but this workaround will do for now

        updateHarborCalculations(dto, dto.getHtmlElement(0), newMass); //simulate manual change of kWh, to avoid redundant code


        return newMass; //return new mass; technically only needed for initial caller, like could be the case in below code

    }

    const index = getChangedIndex(dto, changedElement);
    dto.setValue(index, changedElement.querySelector('input').value);

    switch (index) {
        case 0: //kWh changed
            //update hydrogen based on kWh
            const kWh_dto0 = dto.getValue(0);
            const hydrogen_dto0 = kWh_dto0 * globalThis.constantsField.dataset.getKWhToHydrogen(); //constants.kWhToHydrogen; // TODO pull from constants
            dto.setValue(1, hydrogen_dto0);
            break;

        case 1: //hydrogen changed
            if(glob_temp_log)console.log("hydrogen changed, index: " + index);
            //update kWh based on hydrogen
            const hydrogen_dto1 = dto.getValue(1);
            const kWh_dto1 = hydrogen_dto1 / globalThis.constantsField.dataset.getKWhToHydrogen(); //constants.kWhToHydrogen; // TODO pull from constants
            dto.setValue(0, kWh_dto1);
            break;
        default:
            console.warn(`Unknown index: ${index}`);
            break;
    }

    dto.setKWh(dto.getValue(0));
    if(glob_temp_log)console.log("harbor kWh: " + dto.getValue(0));
    if(glob_temp_log)console.log(dto.getValue(0) / constants.values.harbor.ratio + "harbor update");
    dto.setMass(dto.getValue(0) / constants.values.harbor.ratio);
    return dto.getValue(0) / constants.values.harbor.ratio;
}

function updateTransportCalculations(dto, changedElement = null, newMass) {
    if(changedElement === globalThis.constantsField){ // custom edgecase to avoid having to change method signature; recalculate every constant dependent field
        //const codTons = dto.getMass();
        //const numTrucks = Math.ceil(codTons / constants.values.transport.tonsPerTruck);

        updateTransportCalculations(dto, dto.getHtmlElement(0), newMass); //simulate manual change of numTrucks, to avoid redundant code; in this case newMass shoudld be null

        return dto.getMass(); // technically only needed for initial caller
    }


    //console.log('update transport calculations, new mass: ', newMass, "changedElement: ", changedElement);

    //dto contains: numTrucks, distance, kWh, H2(tons)
    if (changedElement === null) { //induced change; update mass and simulate mass dependent field change through single call recursion
        const numTrucks = Math.ceil(newMass / constants.values.transport.tonsPerTruck); //calculate new number of trucks based on mass // neednt be pulled from constantsfield; doesnt change
        dto.setValue(0, numTrucks);
        dto.getHtmlElement(0).querySelector('input').value = numTrucks; //update the html element to reflect the new value;
        //only needed because baseclass, which would do this through the eventdriven approach, fires after the recursive call,
        // but because the field has its old value, which is then read in when we simulate a manual change of codTons, we need to do this here
        //seems like an architectural flaw, but this workaround will do for now

        updateTransportCalculations(dto, dto.getHtmlElement(0), newMass); //simulate manual change of numTrucks, to avoid redundant code
        return newMass; //return new mass; technically only needed for initial caller, like could be the case in below code
    }
        if(glob_temp_log)console.log('transport changed element: ', changedElement.labelElement.textContent);

        const index = getChangedIndex(dto, changedElement);

        dto.setValue(index, changedElement.querySelector('input').value);
        //push changed value into the dto!
        switch (index) {
            case 0: case 1: //numTrucks or distance changed; behave equal
                //numTrucks, equals mass
                //distance unaffected; calculate kWh and hydrogen based on numTrucks
                const dto0_numTrucks = dto.getValue(0);
                const dto0_distance = dto.getValue(1);

                const dto0_dieselLitres =  (dto0_numTrucks * dto0_distance / 100) * globalThis.constantsField.dataset.getTruckLitresPer100km() //constants.values.transport.dieselPer100km; //TODO pull from constants
                const dto0_kWh = dto0_dieselLitres * globalThis.constantsField.dataset.getDieselToKwh(); //constants.dieselToKWh; //TODO pull from constants
                const dto0_hydrogen = dto0_kWh * globalThis.constantsField.dataset.getKWhToHydrogen(); //calculateHydrogen(dto0_dieselLitres); //TODO pull from constants

                dto.setValue(2, dto0_kWh);
                dto.setValue(3, dto0_hydrogen);

                //dto.getHtmlElement(2).querySelector('input').value = dto0_kWh;
                //dto.getHtmlElement(3).querySelector('input').value = dto0_hydrogen;



                break;
            case 2: //kWh; numTrucks gets changed by different mass; distance gets changed by different kwh
                //calculate new distance
                const dto2_kWh = dto.getValue(2);
                const dto2_numTrucks = dto.getValue(0);

                const dto2_hydrogen = dto2_kWh*globalThis.constantsField.dataset.getKWhToHydrogen(); //constants.kWhToHydrogen; //TODO pull from constants
                //const dto2_distance = dto2_kWh / (dto2_numTrucks.getValue() * constants.values.transport.dieselPer100km / 100 * constants.dieselToKWh); //TODO pull from constants
                //const dto2_distance = (dto2_kWh / dto2_numTrucks) * (1/constants.dieselToKWh) * constants.values.transport.dieselPer100km; //TODO pull from constants

                //const dto2_distance = ((dto2_kWh / dto2_numTrucks) / constants.dieselToKWh) / constants.values.transport.dieselPer100km*100; //TODO pull from constants
                const dto2_distance = ((dto2_kWh / dto2_numTrucks) / globalThis.constantsField.dataset.getDieselToKwh()) / globalThis.constantsField.dataset.getTruckLitresPer100km()*100;

                dto.setValue(1, dto2_distance);
                dto.setValue(3, dto2_hydrogen);

                break;
            case 3: //hydrogen
                //calculate hydrogen based on kWh
                const dto3_hydrogen = dto.getValue(3);
                const dto3_numTrucks = dto.getValue(0);

                const dto3_kWh = dto3_hydrogen / globalThis.constantsField.dataset.getKWhToHydrogen();//constants.kWhToHydrogen; //TODO pull from constants
                //const dto3_distance = ((dto3_kWh / dto3_numTrucks) / constants.dieselToKWh) / constants.values.transport.dieselPer100km*100; //TODO pull from constants
                const dto3_distance = ((dto3_kWh / dto3_numTrucks) / globalThis.constantsField.dataset.getDieselToKwh()) / globalThis.constantsField.dataset.getTruckLitresPer100km()*100;
                dto.setValue(2, dto3_kWh);
                dto.setValue(1, dto3_distance);


                break;
            default:
                console.warn(`Unknown index: ${index}`);
                break;


        }


    dto.setKWh(dto.getValue(2));
        //index case
    dto.setMass(dto.getValue(0) * constants.values.transport.tonsPerTruck); //field not needed here // neednt be pulled from constantsfield; doesnt change
    return dto.getValue(0) * constants.values.transport.tonsPerTruck;  //return calculated mass, needed if this updater method was the initial caller and the new mass is to be passed to the next updater method


}

//TODO adjust mechanisms, kwh/day consumption will realistically not correlate linearly with mass
function updateColdStorageCalculations(dto, changedElement = null, newMass) {
    if(changedElement === globalThis.constantsField){ // custom edgecase to avoid having to change method signature; recalculate every constant dependent field
        const codTons = dto.getMass();
        updateColdStorageCalculations(dto, null, codTons); //simulate change, to avoid redundant code; execute induced change
        return codTons; // technically only needed for initial caller
    }

    //dto contains: days, kWh per day, H2(tons)
    if (changedElement === null) { //induced change; update mass and simulate mass dependent field change through single call recursion
        //TODO test first if kwh/day has been changed before to avoid overwriting user changed settings unnoticed

        //the cold storage is designed for 5000 tons; if that threshold is exceeded, additional kWh will be added;
        // if the limit is subceeded, we calculate with a static power consumption of the maximum capacity
        let kWhPerDay;
        if(newMass > constants.values.coldStorage.maxCapacity) {
            kWhPerDay = newMass * constants.values.coldStorage.maxCapRatio; //calculate new kWh per day based on mass
        }else{
            kWhPerDay = constants.values.coldStorage.kWhPerDay; //dto.getValue(1); //use the static value //TODO
        }


        dto.setValue(1, kWhPerDay);
        dto.getHtmlElement(1).querySelector('input').value = kWhPerDay; //update the html element to reflect the new value;
        //only needed because baseclass, which would do this through the eventdriven approach, fires after the recursive call,
        // but because the field has its old value, which is then read in when we simulate a manual change of codTons, we need to do this here
        //seems like an architectural flaw, but this workaround will do for now

        dto.setMass(newMass); // the only time we have access to newMass

        updateColdStorageCalculations(dto, dto.getHtmlElement(1), newMass); //simulate manual change of numTrucks, to avoid redundant code
        return newMass; //return new mass; technically only needed for initial caller, like could be the case in below code
    }

    const index = getChangedIndex(dto, changedElement);
    dto.setValue(index, changedElement.querySelector('input').value);

    switch (index) {
        case 0: //days changed
            if(glob_temp_log)console.log("days changed, index: " + index);
            //update kWh and hydrogen based on days
            const days_dto0 = dto.getValue(0);
            const kWh_dto0 = dto.getValue(1);
            const hydrogen_dto0 = kWh_dto0 * days_dto0 * globalThis.constantsField.dataset.getKWhToHydrogen();//constants.kWhToHydrogen; // TODO pull from constants

            dto.setValue(2, hydrogen_dto0);
            break;
        case 1: //kWh per day changed
            if(glob_temp_log)console.log("kWh per day changed, index: " + index);
            //update days and hydrogen based on kWh per day
            const kWh_dto1 = dto.getValue(1);
            const days_dto1 = dto.getValue(0);
            const hydrogen_dto1 = kWh_dto1 * days_dto1 * globalThis.constantsField.dataset.getKWhToHydrogen();//constants.kWhToHydrogen; // TODO pull from constants

            dto.setValue(2, hydrogen_dto1);
            break;
        case 2: //hydrogen changed -> extend days
            if(glob_temp_log)console.log("hydrogen changed, index: " + index);
            //update days and kWh per day based on hydrogen
            const hydrogen_dto2 = dto.getValue(2);
            const kWh_tot_dto2 = hydrogen_dto2 /  globalThis.constantsField.dataset.getKWhToHydrogen();//constants.kWhToHydrogen; // TODO pull from constants
            const kWh_per_day_dto2 = dto.getValue(1);
            const days_dto2 = Math.ceil( kWh_tot_dto2/ kWh_per_day_dto2);

            dto.setValue(0, days_dto2);
            break;

    }

    dto.setKWh(dto.getValue(1) * dto.getValue(0)); //set kWh to days * kWh per day
    return -1 //changes here dont have an effect on mass, and i cant return the original mass; return -1 is a signal and edge case implemented in the base class and prevents recursive call
    //TODO return dtos mass instead; implement consistent mass field updating first
}

//TODO change so cod tons relates to new field numMarkets
function updateSupermarketCalculations(dto, changedElement = null, newMass) {
    if(changedElement === globalThis.constantsField){ // custom edgecase to avoid having to change method signature; recalculate every constant dependent field
        const codTons = dto.getMass();
        updateSupermarketCalculations(dto, null, codTons); //simulate change, to avoid redundant code; execute induced change
        return codTons; // technically only needed for initial caller
    }

    //dto contains: days, kWh per day, H2(tons)
    if (changedElement === null) { //induced change; update mass and simulate mass dependent field change through single call recursion
        dto.setMass(newMass);

        /*const days = dto.getValue(0);
        const kWhPerDay = dto.getValue(1);
        const tonsPerDayPerSupermarket = globalThis.constantsField.dataset.getTonsSoldPerSupermarket();

        const kWh = days * kWhPerDay * (newMass/tonsPerDayPerSupermarket);
        const hydrogen = kWh * globalThis.constantsField.dataset.getKWhToHydrogen();



        dto.setValue(2, hydrogen);
        dto.getHtmlElement(2).querySelector('input').value = hydrogen; //update the html element to reflect the new value;
        //only needed because baseclass, which would do this through the eventdriven approach, fires after the recursive call,
        // but because the field has its old value, which is then read in when we simulate a manual change of codTons, we need to do this here
        //seems like an architectural flaw, but this workaround will do for now

        dto.setMass(newMass); // the only time we have access to newMass
        */
        updateSupermarketCalculations(dto, dto.getHtmlElement(1), newMass); //simulate manual change of numTrucks, to avoid redundant code
        return newMass; //return new mass; technically only needed for initial caller, like could be the case in below code
    }

    const index = getChangedIndex(dto, changedElement);
    dto.setValue(index, changedElement.querySelector('input').value);

    switch (index) {
        case 0: case 1://days or kWh per day changed; behave equal
            if(glob_temp_log)console.log("days changed, index: " + index);
            //update kWh and hydrogen based on days
            const days_dto0 = dto.getValue(0);
            const kWh_dto0 = dto.getValue(1);
            const hydrogen_dto0 = days_dto0 * kWh_dto0 * dto.getMass()/globalThis.constantsField.dataset.getKWhToHydrogen();

            dto.setValue(2, hydrogen_dto0);
            break;

        case 2: //hydrogen changed -> extend days
            if(glob_temp_log)console.log("hydrogen changed, index: " + index);
            //update days and kWh per day based on hydrogen
            const hydrogen_dto2 = dto.getValue(2);
            const kWh_tot_dto2 = hydrogen_dto2 /  globalThis.constantsField.dataset.getKWhToHydrogen();
            const kWh_per_day_dto2 = dto.getValue(1);
            const imaginaryNumMarkets = dto.getMass() / globalThis.constantsField.dataset.getTonsSoldPerSupermarket(); //all of this is flawed
            const days_dto2 = Math.ceil(( kWh_tot_dto2/imaginaryNumMarkets) / kWh_per_day_dto2);

            dto.setValue(0, days_dto2);
            break;

    }

    dto.setKWh(dto.getValue(2) / globalThis.constantsField.dataset.getKWhToHydrogen());
    //dto.setMass(dto.getValue(0) * globalThis.constantsField.dataset.getTonsSoldPerSupermarket()); //mass set individually

    return -1 //changes here dont have an effect on mass, and i cant return the original mass; return -1 is a signal and edge case implemented in the base class and prevents recursive call
    //TODO return dtos mass instead; implement consistent mass field updating first
}

function updateConstants(dto, changedElement = null, newMass) {
   //because of this hardcoded edgecase stuff up there, the changed element will be the constantsField
    if( changedElement === null) {
        return;
    }

    const index= getChangedIndex(dto, changedElement);
    dto.setValue(index, changedElement.querySelector('input').value);

}

function updateResults(dto, changedElement = null, newMass) {
    if (glob_temp_log) {
        console.log(`update results: ${dto}`);
    }
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


//############################### MAIN ########################################

document.addEventListener('DOMContentLoaded', initializeFields);

let cleanup;
if (cleanup) cleanup();
cleanup = await modalSystem.openDialog(); //await to ensure the popup is visible before the buggy loading
