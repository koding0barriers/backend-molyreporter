
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

async function generateBarGraph(data) {

    const width = 350; // px
    const height = 300; // px
    const backgroundColour = 'white';


    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });

    const config = {
        type: 'bar',
        data: {
            labels: Object.keys(data), // Disability names
            datasets: [{
                label: 'Disabilities Counts',
                data: Object.values(data), // Counts of each disability
                backgroundColor: [
                    'rgb(54, 162, 235)',
                    'rgb(255, 99, 132)'
                ],
                borderColor: [
                    // Border colors for each bar
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    const jpegBuffer = await chartJSNodeCanvas.renderToBuffer({
        ...config,
        options: {
            plugins: {
                outlabels: false,
                title: {
                    display: true,
                    text: 'Disabilities Affected',
                    font: {
                        size: 24
                    },
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                }
            },
            animation: false, // Disable animations
            elements: { arc: { borderWidth: 0 } }, // Style adjustments to reduce file size
            quality: 0.3 // Set JPEG quality 
        }
    }, 'image/jpeg');

    // Write the buffer to a file
    return jpegBuffer;
}

async function generateDoughnutChart(data, chartTitle) {
    const width = 350;
    const height = 300;

    const backgroundColour = 'white';

    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });
    const labels = data.map(item => `${item.category}: ${item.value}`);
    const values = data.map(item => item.value);
    const backgroundColors = [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 205, 86)',
    ];

    const config = {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                hoverOffset: 4
            }]
        },
        options: {
            plugins: {
                outlabels: false,
                title: {
                    display: true,
                    text: chartTitle,
                    font: {
                        size: 24
                    },
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                }
            },
            animation: false,
            elements: { arc: { borderWidth: 0 } }, // Style adjustments to reduce file size
            quality: 0.3
        }
    };

    const jpegBuffer = await chartJSNodeCanvas.renderToBuffer(config, 'image/jpeg');
    return jpegBuffer;

}


async function generateChart(score) {

    const width = 350; // px
    const height = 300; // px

    const backgroundColour = 'white';
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });
    const data = {
        labels: [
            'Compliance',
            'Non-Compliance'
        ],
        datasets: [{
            label: 'Compliance Score',
            data: [score, 100 - score],
            backgroundColor: [
                'rgb(54, 162, 235)',
                'rgb(255, 99, 132)'
            ],
            hoverOffset: 4
        }]
    };
    const config = {
        type: 'doughnut',
        data: data,
    };

    const jpegBuffer = await chartJSNodeCanvas.renderToBuffer({
        ...config,
        options: {
            plugins: {
                outlabels: false,
                title: {
                    display: true,
                    text: `Compliance Score ${score}%`,
                    font: {
                        size: 24
                    },
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                }
            },
            animation: false, // Disable animations
            elements: { arc: { borderWidth: 0 } }, // Style adjustments to reduce file size
            quality: 0.3 // Set JPEG quality 
        }
    }, 'image/jpeg');

    return jpegBuffer;

}


function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };
    return new Date(date).toLocaleDateString('en-US', options);
}

module.exports = {
    generateChart,
    generateBarGraph,
    generateDoughnutChart,
    formatDate
};
