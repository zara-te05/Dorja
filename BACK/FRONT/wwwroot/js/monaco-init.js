document.addEventListener('DOMContentLoaded', () => {
    require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@latest/min/vs' } });
    window.MonacoEnvironment = {
        getWorkerUrl: function (moduleId, label) {
            if (label === 'python') return './python.worker.bundle.js';
            return 'https://unpkg.com/monaco-editor@latest/min/vs/base/worker/workerMain.js';
        }
    };
    let editor;
    require(["vs/editor/editor.main"], function () {
        const getCurrentTheme = () => document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs-light';
        editor = monaco.editor.create(document.getElementById('editor'), {
            value: `# Escribe tu solución aquí\ndef procesar_numeros(lista):\n    suma_pares = 0\n    producto_impares = 1\n    \n    if not lista:\n        return (0, 1, None)\n        \n    mayor = lista[0]\n    \n    for num in lista:\n        if num % 2 == 0:\n            suma_pares += num\n        else:\n            producto_impares *= num\n        \n        if num > mayor:\n            mayor = num\n            \n    return (suma_pares, producto_impares, mayor)\n\n# Prueba tu función\nnumeros = [1, 2, 3, 4, 5, 9]\nresultado = procesar_numeros(numeros)\nprint(f"Resultado para {numeros}: {resultado}")`,
            language: 'python',
            theme: getCurrentTheme(),
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            renderLineHighlight: 'all',
            lineNumbers: 'on',
            wordWrap: 'on'
        });
        const outputContent = document.getElementById('output-content');
        const runBtn = document.getElementById('run-btn');
        const verifyBtn = document.getElementById('verify-btn');
        runBtn.addEventListener('click', async () => {
            const code = editor.getValue();
            outputContent.textContent = "Ejecutando...";
            verifyBtn.disabled = true;
            try {
                const result = await window.api.executePython(code);
                outputContent.textContent = result.output;
                if (result.success) {
                    verifyBtn.disabled = false;
                }
            } catch (error) {
                outputContent.textContent = `Error de comunicación:\n${error}`;
            }
        });
        const observer = new MutationObserver(() => { monaco.editor.setTheme(getCurrentTheme()); });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    });
});