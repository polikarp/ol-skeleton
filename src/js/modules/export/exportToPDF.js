import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportVisibleMapToPdf(map) {
    map.renderSync();

    const mapElement = map.getTargetElement();

    const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scale: 2
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    pdf.addImage(imgData, 'PNG', 10, 10, 277, 190);
    pdf.save('map.pdf');
}


export function exportOpenLayersMapToPdf(map) {
    map.once('rendercomplete', function () {
        const mapSize = map.getSize();
        const mapCanvas = document.createElement('canvas');

        mapCanvas.width = mapSize[0];
        mapCanvas.height = mapSize[1];

        const mapContext = mapCanvas.getContext('2d');

        Array.prototype.forEach.call(
            map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
            function (canvas) {
                if (canvas.width > 0) {
                    const opacity = canvas.parentNode.style.opacity || canvas.style.opacity || 1;
                    mapContext.globalAlpha = Number(opacity);

                    const transform = canvas.style.transform;
                    let matrix = [1, 0, 0, 1, 0, 0];

                    if (transform && transform.startsWith('matrix')) {
                        matrix = transform
                            .match(/^matrix\(([^\(]*)\)$/)[1]
                            .split(',')
                            .map(Number);
                    }

                    CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);

                    mapContext.drawImage(canvas, 0, 0);
                }
            }
        );

        mapContext.globalAlpha = 1;
        mapContext.setTransform(1, 0, 0, 1, 0, 0);

        const imgData = mapCanvas.toDataURL('image/jpeg', 0.92);

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const pageWidth = 297;
        const pageHeight = 210;

        const margin = 10;
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (mapCanvas.height * imgWidth) / mapCanvas.width;

        pdf.addImage(
            imgData,
            'JPEG',
            margin,
            margin,
            imgWidth,
            Math.min(imgHeight, pageHeight - margin * 2)
        );

        pdf.save('map.pdf');
    });

    map.renderSync();
}