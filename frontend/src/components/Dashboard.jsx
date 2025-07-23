import 'chartjs-adapter-moment';
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { useGlobalContext } from '../context/globalContext';
import Sidebar from './Sidebar';
Chart.defaults.color = '#fff';
Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    TimeScale,
    Title,
    Tooltip,
    Legend,
    ArcElement
);


const Dashboard = () => {
    const { stockData, isPaused, selectedStock, filterDate } = useGlobalContext();
    const [labels, setLabels] = useState([]);
    const [prices, setPrices] = useState([]);
    const prevLength = useRef(0);
    useEffect(() => {
        if (!isPaused) {
            prevLength.current = 0;  // 👈 Reset tracking pointer
            setLabels([]);           // 👈 Optional: clear chart labels
            setPrices([]);           // 👈 Optional: clear chart prices
        }
    }, [isPaused]);
    useEffect(() => {
        prevLength.current = 0;
        setLabels([]);
        setPrices([]);
    }, [selectedStock, filterDate]);
    useEffect(() => {
        if (stockData.length > prevLength.current) {
            const newData = stockData.slice(prevLength.current);
            const newLabels = newData.map(item => item.date);
            const newPrices = newData.map(item => item.close);
            setLabels(prev => [...prev, ...newLabels]);
            setPrices(prev => [...prev, ...newPrices]);
            prevLength.current = stockData.length;
        }
    }, [stockData]);
    const options = {
        responsive: true,
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    displayFormats: {
                        day: 'DD/MM/YYYY',
                    },
                },
                ticks: {
                    maxTicksLimit: 7,
                    callback: function (value) {
                        return moment(value).format('DD/MM/YYYY');
                    },
                },
            },
            y: {
                beginAtZero: false,
            },
        },
    };
    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Stock Prices',
                data: prices,
                fill: false,
                backgroundColor: 'rgb(75, 192, 192)',
                borderColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.2,
            }
        ],
    };
    return (
        <div className="w-full mt-1">
            <div className="flex justify-center gap-8">

                {/* Sidebar (1 column) */}
                <Sidebar />

                {/* Chart (3 columns) */}
                <div className="col-span-3 h-full w-[800px]">
                    <div className="bg-[#1d2b42] border border-slate-500 shadow-md p-4 rounded-[20px]">
                        <Line data={data} options={options} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard