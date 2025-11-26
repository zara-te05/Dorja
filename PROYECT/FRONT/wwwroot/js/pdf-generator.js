// pdf-generator.js
// Módulo para generar certificados en PDF

/**
 * Genera y descarga un certificado en PDF con los datos del usuario
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.nombre - Nombre del usuario
 * @param {string} userData.apellidoPaterno - Apellido paterno
 * @param {string} userData.apellidoMaterno - Apellido materno
 */
async function generateCertificatePDF(userData) {
    try {
        console.log('🎓 Generando certificado PDF para:', userData);

        // Obtener el nombre completo del usuario
        const nombreCompleto = `${userData.nombre} ${userData.apellidoPaterno} ${userData.apellidoMaterno}`;

        // Obtener la fecha actual
        const fecha = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Generar el HTML del certificado
        const certificateHTML = getCertificateHTML(nombreCompleto, fecha);

        // Crear un elemento temporal para el certificado
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = certificateHTML;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        // Opciones para html2pdf
        const options = {
            margin: 0,
            filename: `Certificado_${nombreCompleto.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'landscape'
            }
        };

        // Generar y descargar el PDF
        await html2pdf().from(tempDiv).set(options).save();

        // Limpiar el elemento temporal
        document.body.removeChild(tempDiv);

        console.log('✅ Certificado PDF generado y descargado exitosamente');

        // Mostrar mensaje de éxito
        showSuccessMessage('¡Certificado descargado! 🎉');

    } catch (error) {
        console.error('❌ Error al generar el PDF:', error);
        alert('Error al generar el certificado. Por favor, intenta de nuevo.');
    }
}

/**
 * Genera el HTML del certificado con los datos del usuario
 * @param {string} nombreCompleto - Nombre completo del usuario
 * @param {string} fecha - Fecha de emisión del certificado
 * @returns {string} HTML del certificado
 */
function getCertificateHTML(nombreCompleto, fecha) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Georgia', serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .certificate-container {
            background: white;
            width: 100%;
            max-width: 900px;
            padding: 60px;
            border: 20px solid #2c3e50;
            border-image: linear-gradient(45deg, #667eea, #764ba2) 1;
            position: relative;
        }

        .certificate-border {
            border: 3px solid #f39c12;
            padding: 40px;
            position: relative;
        }

        .corner-decoration {
            position: absolute;
            width: 80px;
            height: 80px;
            border: 3px solid #f39c12;
        }

        .corner-decoration.top-left {
            top: -3px;
            left: -3px;
            border-right: none;
            border-bottom: none;
        }

        .corner-decoration.top-right {
            top: -3px;
            right: -3px;
            border-left: none;
            border-bottom: none;
        }

        .corner-decoration.bottom-left {
            bottom: -3px;
            left: -3px;
            border-right: none;
            border-top: none;
        }

        .corner-decoration.bottom-right {
            bottom: -3px;
            right: -3px;
            border-left: none;
            border-top: none;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo {
            width: 100px;
            height: 100px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 48px;
            font-weight: bold;
        }

        .institution-name {
            font-size: 28px;
            color: #2c3e50;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .institution-subtitle {
            font-size: 16px;
            color: #7f8c8d;
            margin-bottom: 10px;
        }

        .certificate-title {
            font-size: 42px;
            color: #667eea;
            text-transform: uppercase;
            letter-spacing: 4px;
            margin: 30px 0;
            font-weight: bold;
        }

        .certificate-text {
            text-align: center;
            font-size: 18px;
            color: #34495e;
            line-height: 1.8;
            margin: 30px 0;
        }

        .student-name {
            font-size: 36px;
            color: #2c3e50;
            font-weight: bold;
            margin: 30px 0;
            padding: 10px 0;
            border-bottom: 2px solid #f39c12;
            display: inline-block;
        }

        .achievement {
            margin: 40px 0;
            font-size: 18px;
            color: #34495e;
            line-height: 2;
            text-align: center;
        }

        .achievement strong {
            color: #667eea;
            font-size: 20px;
        }

        .footer {
            display: flex;
            justify-content: space-around;
            margin-top: 60px;
            padding-top: 40px;
        }

        .signature-block {
            text-align: center;
            flex: 1;
            margin: 0 20px;
        }

        .signature-line {
            border-top: 2px solid #2c3e50;
            margin-bottom: 10px;
            padding-top: 10px;
        }

        .signature-name {
            font-weight: bold;
            color: #2c3e50;
            font-size: 16px;
        }

        .signature-title {
            color: #7f8c8d;
            font-size: 14px;
        }

        .date-location {
            text-align: center;
            margin-top: 30px;
            color: #7f8c8d;
            font-size: 14px;
        }

        .seal {
            position: absolute;
            bottom: 100px;
            right: 80px;
            width: 120px;
            height: 120px;
            border: 3px solid #e74c3c;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: #e74c3c;
            font-weight: bold;
            text-align: center;
            transform: rotate(-15deg);
            opacity: 0.3;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="certificate-border">
            <div class="corner-decoration top-left"></div>
            <div class="corner-decoration top-right"></div>
            <div class="corner-decoration bottom-left"></div>
            <div class="corner-decoration bottom-right"></div>

            <div class="header">
                <div class="logo">🎓</div>
                <div class="institution-name">PLATAFORMA EDUCATIVA DORJA</div>
                <div class="institution-subtitle">Aprendiendo Programación Paso a Paso</div>
            </div>

            <div style="text-align: center;">
                <div class="certificate-title">Certificado de Logro</div>
                
                <div class="certificate-text">
                    Por medio del presente se certifica que
                </div>

                <div class="student-name">${nombreCompleto}</div>

                <div class="certificate-text">
                    Ha completado exitosamente
                </div>

                <div class="achievement">
                    <strong>🏆 Su Primer Ejercicio de Programación 🏆</strong><br>
                    Demostrando dedicación, esfuerzo y las habilidades necesarias<br>
                    para iniciar su camino en el desarrollo de software.
                </div>

                <div class="certificate-text">
                    Este logro marca el inicio de un emocionante viaje de aprendizaje<br>
                    en el mundo de la programación.
                </div>
            </div>

            <div class="footer">
                <div class="signature-block">
                    <div class="signature-line">
                        <div class="signature-name">Plataforma Dorja</div>
                        <div class="signature-title">Sistema Educativo</div>
                    </div>
                </div>
            </div>

            <div class="date-location">
                ${fecha}
            </div>

            <div class="seal">
                SELLO<br>OFICIAL
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Muestra un mensaje de éxito temporal
 * @param {string} message - Mensaje a mostrar
 */
function showSuccessMessage(message) {
    // Crear el elemento del mensaje
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-size: 16px;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.5s ease-out;
    `;

    // Agregar animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Agregar al DOM
    document.body.appendChild(messageDiv);

    // Eliminar después de 5 segundos
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.5s ease-in';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 500);
    }, 5000);
}

// Exportar la función para uso global
window.generateCertificatePDF = generateCertificatePDF;
