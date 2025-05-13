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
});