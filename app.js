document.addEventListener("DOMContentLoaded", () => {
    const { PDFDocument, rgb, degrees } = PDFLib;

    // --- Helper Function: Trigger Download ---
    function downloadFile(bytearray, filename, mimeType) {
        const blob = new Blob([bytearray], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- Helper Function: Get Final Filename ---
    function getFilename(inputElement, defaultName) {
        let name = inputElement.value.trim();
        if (name === "") name = defaultName;
        if (!name.toLowerCase().endsWith('.pdf')) name += '.pdf';
        return name;
    }

    // ==========================================
    // 1. MERGE PDF 
    // ==========================================
    let mergeFiles = [];
    document.getElementById('merge-upload').addEventListener('change', (e) => {
        mergeFiles = Array.from(e.target.files);
        document.getElementById('merge-count').textContent = `${mergeFiles.length} file(s) selected`;
    });

    document.getElementById('merge-btn').addEventListener('click', async () => {
        const status = document.getElementById('merge-status');
        if (mergeFiles.length < 2) { status.textContent = "Please select at least 2 files."; return; }
        status.textContent = "Merging... Please wait.";
        try {
            const mergedPdf = await PDFDocument.create();
            for (const file of mergeFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            const pdfBytes = await mergedPdf.save();
            downloadFile(pdfBytes, getFilename(document.getElementById('merge-filename'), 'Rezuan_Merged'), 'application/pdf');
            status.textContent = "Success!";
        } catch (error) {
            status.textContent = "Error merging files.";
            console.error(error);
        }
    });

    // ==========================================
    // 2. ROTATE PDF 
    // ==========================================
    let rotateFile = null;
    document.getElementById('rotate-upload').addEventListener('change', (e) => {
        rotateFile = e.target.files[0];
        document.getElementById('rotate-count').textContent = rotateFile ? '1 file selected' : '0 files selected';
    });

    document.getElementById('rotate-btn').addEventListener('click', async () => {
        const status = document.getElementById('rotate-status');
        if (!rotateFile) { status.textContent = "Please select a file."; return; }
        status.textContent = "Rotating... Please wait.";
        try {
            const arrayBuffer = await rotateFile.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            pdf.getPages().forEach((page) => {
                page.setRotation(degrees(page.getRotation().angle + 90));
            });
            const pdfBytes = await pdf.save();
            downloadFile(pdfBytes, getFilename(document.getElementById('rotate-filename'), 'Rezuan_Rotated'), 'application/pdf');
            status.textContent = "Success!";
        } catch (error) {
            status.textContent = "Error rotating file.";
            console.error(error);
        }
    });

    // ==========================================
    // 3. ADD WATERMARK 
    // ==========================================
    let watermarkFile = null;
    document.getElementById('watermark-upload').addEventListener('change', (e) => {
        watermarkFile = e.target.files[0];
        document.getElementById('watermark-count').textContent = watermarkFile ? '1 file selected' : '0 files selected';
    });

    document.getElementById('watermark-btn').addEventListener('click', async () => {
        const status = document.getElementById('watermark-status');
        const text = document.getElementById('watermark-text').value.trim() || 'CONFIDENTIAL';
        if (!watermarkFile) { status.textContent = "Please select a file."; return; }
        status.textContent = "Stamping... Please wait.";
        try {
            const arrayBuffer = await watermarkFile.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            pdf.getPages().forEach((page) => {
                const { width, height } = page.getSize();
                page.drawText(text, { x: width / 4, y: height / 2, size: 50, color: rgb(0.7, 0.7, 0.7), opacity: 0.5, rotate: degrees(45) });
            });
            const pdfBytes = await pdf.save();
            downloadFile(pdfBytes, getFilename(document.getElementById('watermark-filename'), 'Rezuan_Watermarked'), 'application/pdf');
            status.textContent = "Success!";
        } catch (error) {
            status.textContent = "Error adding watermark.";
            console.error(error);
        }
    });

    // ==========================================
    // 4. PAGE NUMBERS 
    // ==========================================
    let numberFile = null;
    document.getElementById('number-upload').addEventListener('change', (e) => {
        numberFile = e.target.files[0];
        document.getElementById('number-count').textContent = numberFile ? '1 file selected' : '0 files selected';
    });

    document.getElementById('number-btn').addEventListener('click', async () => {
        const status = document.getElementById('number-status');
        if (!numberFile) { status.textContent = "Please select a file."; return; }
        status.textContent = "Numbering... Please wait.";
        try {
            const arrayBuffer = await numberFile.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            pdf.getPages().forEach((page, index) => {
                const { width } = page.getSize();
                page.drawText(`${index + 1}`, { x: width / 2 - 5, y: 20, size: 12, color: rgb(0, 0, 0) });
            });
            const pdfBytes = await pdf.save();
            downloadFile(pdfBytes, getFilename(document.getElementById('number-filename'), 'Rezuan_Numbered'), 'application/pdf');
            status.textContent = "Success!";
        } catch (error) {
            status.textContent = "Error numbering file.";
            console.error(error);
        }
    });

    // ==========================================
    // 5. REMOVE PAGES 
    // ==========================================
    let removeFile = null;
    document.getElementById('remove-upload').addEventListener('change', (e) => {
        removeFile = e.target.files[0];
        document.getElementById('remove-count').textContent = removeFile ? '1 file selected' : '0 files selected';
    });

    document.getElementById('remove-btn').addEventListener('click', async () => {
        const status = document.getElementById('remove-status');
        const pagesInput = document.getElementById('remove-pages').value;
        if (!removeFile) { status.textContent = "Please select a file."; return; }
        if (!pagesInput) { status.textContent = "Please specify pages to remove."; return; }
        status.textContent = "Removing pages... Please wait.";
        try {
            const arrayBuffer = await removeFile.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const totalPages = pdf.getPageCount();
            const pagesToRemove = pagesInput.split(',').map(num => parseInt(num.trim()) - 1).filter(num => !isNaN(num) && num >= 0 && num < totalPages).sort((a, b) => b - a);
            pagesToRemove.forEach(index => pdf.removePage(index));
            const pdfBytes = await pdf.save();
            downloadFile(pdfBytes, getFilename(document.getElementById('remove-filename'), 'Rezuan_Trimmed'), 'application/pdf');
            status.textContent = "Success!";
        } catch (error) {
            status.textContent = "Error removing pages.";
            console.error(error);
        }
    });
});