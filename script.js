document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const qrTypeRadios = document.querySelectorAll('input[name="qr-type"]');
    const urlInput = document.getElementById('url-input');
    const whatsappInput = document.getElementById('whatsapp-input');
    const qrText = document.getElementById('qr-text');
    const countryCode = document.getElementById('country-code');
    const whatsappNumber = document.getElementById('whatsapp-number');
    const whatsappMessage = document.getElementById('whatsapp-message');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const qrCodeDiv = document.getElementById('qr-code');
    const errorMessage = document.getElementById('error-message');
    const whatsappPreview = document.getElementById('whatsapp-preview');
    const qrColor = document.getElementById('qr-color');
    const bgColor = document.getElementById('bg-color');
    const qrSize = document.getElementById('qr-size');

    let currentQRCode = null;

    // Initialize
    generateSampleQR();

    // Event listeners
    qrTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleQRTypeChange);
    });

    generateBtn.addEventListener('click', generateQRCode);
    downloadBtn.addEventListener('click', downloadQRCode);
    
    // WhatsApp number validation
    whatsappNumber.addEventListener('input', validateWhatsAppNumber);
    countryCode.addEventListener('change', validateWhatsAppNumber);

    // Regenerate QR code when settings change
    qrColor.addEventListener('change', generateQRCode);
    bgColor.addEventListener('change', generateQRCode);
    qrSize.addEventListener('change', generateQRCode);

    function handleQRTypeChange() {
        const selectedType = document.querySelector('input[name="qr-type"]:checked').value;
        
        if (selectedType === 'url') {
            urlInput.classList.remove('hidden');
            whatsappInput.classList.add('hidden');
            whatsappPreview.classList.add('hidden');
        } else {
            urlInput.classList.add('hidden');
            whatsappInput.classList.remove('hidden');
        }
        
        // Clear any existing errors
        hideError();
    }

    function validateWhatsAppNumber() {
        const number = whatsappNumber.value.trim();
        const code = countryCode.value;
        
        if (number && code) {
            // Remove any non-digit characters
            const cleanNumber = number.replace(/\D/g, '');
            
            // Basic validation for phone number length
            if (cleanNumber.length < 5) {
                showError('Please enter a valid phone number');
                return false;
            }
            
            if (!code) {
                showError('Please select a country code');
                return false;
            }
            
            hideError();
            return true;
        }
        return false;
    }

    function generateQRCode() {
        const selectedType = document.querySelector('input[name="qr-type"]:checked').value;
        let text = '';

        if (selectedType === 'url') {
            text = qrText.value.trim();
            if (!text) {
                showError('Please enter a URL!');
                return;
            }
            
            // Validate and format URL
            text = formatURL(text);
            if (!text) {
                showError('Please enter a valid URL!');
                return;
            }
            
        } else { // WhatsApp
            if (!validateWhatsAppNumber()) {
                showError('Please enter a valid WhatsApp number and select country code!');
                return;
            }

            const number = whatsappNumber.value.replace(/\D/g, '');
            const code = countryCode.value;
            const message = encodeURIComponent(whatsappMessage.value.trim());
            
            // Format: https://wa.me/1234567890?text=Hello
            text = `https://wa.me/${code}${number}`;
            if (message) {
                text += `?text=${message}`;
            }
            
            // Show preview
            whatsappPreview.textContent = `WhatsApp: ${code}${number}` + (message ? ` - "${whatsappMessage.value}"` : '');
            whatsappPreview.classList.remove('hidden');
        }

        hideError();
        generateQRImage(text);
    }

    function formatURL(url) {
        // Remove any extra spaces
        url = url.trim();
        
        // Check if it's already a valid URL with protocol
        try {
            // If it has http:// or https://, validate it
            if (url.startsWith('http://') || url.startsWith('https://')) {
                new URL(url);
                return url;
            }
            
            // If it's a domain name, add https://
            if (url.includes('.') && !url.includes(' ')) {
                // Basic domain validation
                const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
                const simpleDomain = url.replace(/^www\./, '').split('/')[0];
                
                if (domainRegex.test(simpleDomain)) {
                    return 'https://' + url;
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    function generateQRImage(text) {
        console.log('Generating QR for:', text); // Debug log
        
        // Clear previous QR code
        if (currentQRCode) {
            currentQRCode.clear();
            qrCodeDiv.innerHTML = '';
        }

        try {
            // Generate new QR code
            currentQRCode = new QRCode(qrCodeDiv, {
                text: text,
                width: parseInt(qrSize.value),
                height: parseInt(qrSize.value),
                colorDark: qrColor.value,
                colorLight: bgColor.value,
                correctLevel: QRCode.CorrectLevel.H
            });

            // Enable download button
            downloadBtn.disabled = false;

            // Add animation
            setTimeout(() => {
                const img = qrCodeDiv.querySelector('img');
                if (img) {
                    img.style.opacity = '0';
                    img.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => {
                        img.style.opacity = '1';
                    }, 50);
                }
            }, 100);

        } catch (error) {
            showError('Error generating QR code: ' + error.message);
            console.error('QR Code Error:', error);
        }
    }

    function generateSampleQR() {
        // Clear any existing content
        qrCodeDiv.innerHTML = '';
        
        // Generate a sample QR code on load
        currentQRCode = new QRCode(qrCodeDiv, {
            text: "https://www.example.com",
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        downloadBtn.disabled = false;
    }

    function downloadQRCode() {
        const img = qrCodeDiv.querySelector('img');
        if (!img) {
            showError('No QR code to download!');
            return;
        }

        try {
            // Create a temporary canvas to ensure high quality download
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = parseInt(qrSize.value);
            
            canvas.width = size;
            canvas.height = size;
            
            // Draw background
            ctx.fillStyle = bgColor.value;
            ctx.fillRect(0, 0, size, size);
            
            // Draw the QR code image
            ctx.drawImage(img, 0, 0, size, size);
            
            // Get QR type for filename
            const selectedType = document.querySelector('input[name="qr-type"]:checked').value;
            let filename = `qr-code-${selectedType}-${Date.now()}.png`;
            
            // Create download link
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            showError('Error downloading QR code: ' + error.message);
            console.error('Download Error:', error);
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        downloadBtn.disabled = true;
        whatsappPreview.classList.add('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }
});