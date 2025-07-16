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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);


const Dashboard = ({ streamData, setIsPaused, isPaused }) => {

    // close:126.6,
    // date:"1/6/2021 16:00:00",
    // high:131.05,
    // low:126.38,
    // open:127.72,
    // volume:155087970
    const [labels, setLabels] = useState([]);
    const [prices, setPrices] = useState([]);
    const prevLength = useRef(0);
    useEffect(() => {
        if (streamData.length > prevLength.current) {
            const newData = streamData.slice(prevLength.current);
            const newLabels = newData.map(item =>
                moment(item.date).format("DD/MM/YYYY HH:mm:ss")
            );
            const newPrices = newData.map(item => item.close);
            setLabels(prev => [...prev, ...newLabels]);
            setPrices(prev => [...prev, ...newPrices]);
            prevLength.current = streamData.length;
        }
    }, [streamData]);

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
        <div className='w-full'>
            <div className='grid grid-cols-5 gap-8'>
                {/* Chart and Totals */}
                <div className='col-span-3 h-[400px]'>
                    <div className='bg-[#FCF6F9] border-2 border-white shadow-md p-4 rounded-[20px]'>
                        <Line data={data} />
                    </div>
                </div>
            </div>
            <button onClick={() => setIsPaused(prev => !prev)}>
                {isPaused ? "Resume" : "Pause"}
            </button>
        </div>
    )
}

export default Dashboard