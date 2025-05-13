// filepath: /kernelsu-webui-module/kernelsu-webui-module/src/webui/script.js

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('execute-button');
    const output = document.getElementById('output');

    button.addEventListener('click', async () => {
        output.textContent = 'Executing...';
        try {
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ command: 'your-command-here' })
            });
            const data = await response.json();
            output.textContent = `Result: ${data.result}`;
        } catch (error) {
            output.textContent = `Error: ${error.message}`;
        }
    });

    const thermalToggle = document.querySelector('#thermal-toggle');
    if (thermalToggle) {
        thermalToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                disableThermal();
            }
        });
    }
});

// Example: Disable thermal throttling via KernelSU WebUI API
async function disableThermal() {
    try {
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: 'echo 0 > /sys/class/thermal/thermal_zone0/mode' })
        });
        const data = await response.json();
        if (data.result) {
            alert('Thermal throttling disabled!');
        } else {
            alert('Failed to disable thermal throttling.');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}