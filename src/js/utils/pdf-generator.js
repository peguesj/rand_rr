export function generatePDF(content, margins) {
    const tempContainer = document.createElement('div');
    const clone = content.cloneNode(true);
    
    clone.style.cssText = `
        width: 8.5in;
        background: white;
        position: relative;
        box-shadow: none;
        margin: 0;
        padding: 0;
    `;

    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = `
        padding: ${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in;
        box-sizing: border-box;
    `;
    
    Array.from(clone.children).forEach(child => contentWrapper.appendChild(child));
    clone.appendChild(contentWrapper);
    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);
    
    const options = {
        filename: 'resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false
        },
        jsPDF: { 
            unit: 'in',
            format: 'letter',
            orientation: 'portrait'
        }
    };

    return html2pdf().set(options)
        .from(clone)
        .save()
        .then(() => {
            document.body.removeChild(tempContainer);
        });
}
