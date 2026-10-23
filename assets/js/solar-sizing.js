(function () {
    'use strict';

    const limits = {
        dailyWh: [1, 1000000], sunHours: [0.1, 24], losses: [0, 90],
        margin: [0, 100], days: [0.1, 30], depth: [1, 100],
        delivery: [1, 100], voltage: [1, 1000], panelWatts: [1, 2000],
        peakWatts: [0, 1000000], surgeWatts: [0, 1000000]
    };

    function calculate(values) {
        for (const [name, [min, max]] of Object.entries(limits)) {
            if (typeof values[name] !== 'number' || !Number.isFinite(values[name]) || values[name] < min || values[name] > max) {
                throw new RangeError('Check ' + name + ': enter a number from ' + min + ' to ' + max + '.');
            }
        }
        if (values.surgeWatts < values.peakWatts) {
            throw new RangeError('Startup peak must be at least the simultaneous running load.');
        }
        const arrayWatts = values.dailyWh / (values.sunHours * (1 - values.losses / 100)) * (1 + values.margin / 100);
        const panelCount = Math.ceil(arrayWatts / values.panelWatts - 1e-12);
        const batteryWh = values.dailyWh * values.days / (values.depth / 100 * values.delivery / 100);
        return {
            arrayWatts, panelCount, installedWatts: panelCount * values.panelWatts,
            batteryWh, batteryAh: batteryWh / values.voltage,
            continuousWatts: values.peakWatts * 1.25,
            surgeWatts: values.surgeWatts
        };
    }

    if (typeof module !== 'undefined' && module.exports) module.exports = { calculate };
    if (typeof document === 'undefined') return;
    const form = document.getElementById('solar-calculator');
    if (!form) return;
    const results = document.getElementById('solar-results');
    const error = document.getElementById('solar-error');
    const format = (value, digits = 0) => value.toLocaleString('en-US', { maximumFractionDigits: digits });

    function clearResults() {
        results.hidden = true;
        error.hidden = true;
    }

    form.addEventListener('input', clearResults);
    form.addEventListener('reset', clearResults);
    form.addEventListener('invalid', clearResults, true);
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        clearResults();
        try {
            const values = {};
            for (const name of Object.keys(limits)) values[name] = form.elements.namedItem(name).valueAsNumber;
            const result = calculate(values);
            document.getElementById('solar-array').textContent = format(Math.ceil(result.arrayWatts)) + ' W target';
            document.getElementById('solar-panels').textContent = result.panelCount + ' × ' + format(values.panelWatts) + ' W panels = ' + format(result.installedWatts) + ' W';
            document.getElementById('solar-battery').textContent = format(result.batteryWh / 1000, 2) + ' kWh nominal';
            document.getElementById('solar-ah').textContent = 'At least ' + format(Math.ceil(result.batteryAh)) + ' Ah at ' + format(values.voltage, 2) + ' V nominal';
            document.getElementById('solar-inverter').textContent = result.continuousWatts === 0 ? 'No AC load entered' : 'At least ' + format(Math.ceil(result.continuousWatts)) + ' W continuous';
            document.getElementById('solar-surge').textContent = result.surgeWatts === 0 ? 'DC-only estimate. Check DC converter and battery current limits.' : 'Must also support ' + format(result.surgeWatts) + ' W startup peak for the required duration.';
            document.getElementById('solar-assumptions').textContent = format(values.dailyWh) + ' Wh/day, ' + format(values.sunHours, 2) + ' peak sun hours, ' + format(values.losses, 2) + '% total solar losses, ' + format(values.margin, 2) + '% array reserve, ' + format(values.days, 2) + ' days of storage, ' + format(values.depth, 2) + '% usable discharge and ' + format(values.delivery, 2) + '% battery-to-load efficiency.';
            results.hidden = false;
            results.focus();
        } catch (exception) {
            error.textContent = exception.message;
            error.hidden = false;
            error.focus();
        }
    });
})();
