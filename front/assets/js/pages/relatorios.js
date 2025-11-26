import { state } from '../state.js';

let prospectingChart = null;

export const initRelatoriosPage = () => {
    const prospectingData = state.reservations.reduce((acc, res) => {
        const ref = res.referencia || 'Outro';
        acc[ref] = (acc[ref] || 0) + 1;
        return acc;
    }, {});

    const labels = Object.keys(prospectingData);
    const data = Object.values(prospectingData);
    const total = data.reduce((a, b) => a + b, 0);

    const tableBody = document.getElementById('prospecting-table-body');
    if (tableBody) {
        tableBody.innerHTML = '';
        labels.forEach((label, index) => {
            const count = data[index];
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            const row = `<tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${label}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${count}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${percentage}%</td>
            </tr>`;
            tableBody.innerHTML += row;
        });
        tableBody.innerHTML += `<tr class="bg-gray-50 font-bold"><td class="px-6 py-4 text-sm">TOTAL</td><td class="px-6 py-4 text-sm text-center">${total}</td><td class="px-6 py-4 text-sm text-center">100%</td></tr>`;
    }

    const ctxCanvas = document.getElementById('prospecting-chart');
    if (!ctxCanvas) return;

    const ctx = ctxCanvas.getContext('2d');
    
    if (prospectingChart) prospectingChart.destroy();

    if (window.ChartDataLabels) {
        Chart.register(ChartDataLabels);
    }

    prospectingChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#4299E1', '#F56565', '#48BB78', '#ED8936', '#9F7AEA', '#38B2AC', '#718096'],
                borderColor: '#FFFFFF',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    enabled: true
                },
                datalabels: {
                    color: '#ffffff',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    formatter: (value, ctx) => {
                        if (total === 0) return '0%';
                        let percentage = ((value / total) * 100).toFixed(1) + "%";
                        return percentage;
                    },
                    display: (context) => {
                        const value = context.dataset.data[context.dataIndex];
                        return (value / total) > 0.02;
                    }
                }
            }
        }
    });
};