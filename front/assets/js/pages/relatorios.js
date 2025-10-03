import { state } from '../state.js';

let prospectingChart = null;
export const initRelatoriosPage = () => {
    const prospectingData = state.reservations.reduce((acc, res) => {
        acc[res.referencia] = (acc[res.referencia] || 0) + 1;
        return acc;
    }, {});

    const labels = Object.keys(prospectingData);
    const data = Object.values(prospectingData);
    const total = data.reduce((a, b) => a + b, 0);

    const tableBody = document.getElementById('prospecting-table-body');
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

    const ctx = document.getElementById('prospecting-chart').getContext('2d');
    if (prospectingChart) prospectingChart.destroy();
    prospectingChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#4299E1', '#F56565', '#48BB78', '#ED8936', '#9F7AEA', '#38B2AC'],
                borderColor: '#FFFFFF',
                borderWidth: 2
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
};