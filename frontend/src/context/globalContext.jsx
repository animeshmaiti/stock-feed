import { StockRequest,DateRange } from '../grpc/StockFeed_pb.js';
import { StockFeedClient } from '../grpc/StockFeed_grpc_web_pb.js';
import { createContext, useState, useContext, useEffect, useRef } from 'react';

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    const [stockData, setStockData] = useState([]);
    const streamRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    const [selectedStock, setSelectedStock] = useState("AAPL");
    const [filterDate, setFilterDate] = useState(DateRange.RECENT_MONTH);
    const startStream = () => {
        const client = new StockFeedClient('http://localhost:8080');
        // const request = new Empty();
        const request = new StockRequest();
        request.setSymbol(selectedStock); // need to work on the backend to handle this
        request.setDateRange(filterDate);
        const stream = client.streamPrices(request, {});
        streamRef.current = stream;

        stream.on('data', (response) => {
            setStockData(prev => [...prev, response.toObject()]);
        });

        stream.on('error', (err) => console.error('❌ Error:', err.message));
        stream.on('end', () => console.log('✅ Stream ended.'));
    };
    useEffect(() => {
        if (streamRef.current) {
            streamRef.current.cancel();
            streamRef.current = null;
        }
        if (!isPaused) {
            setStockData([]);
            startStream();
        }
        return () => {
            if (streamRef.current) {
                streamRef.current.cancel();
                streamRef.current = null;
            }
        };
    }, [isPaused, selectedStock,filterDate]);

    return (
        <GlobalContext.Provider value={{
            stockData,
            selectedStock,setSelectedStock,
            isPaused,setIsPaused,
            filterDate,setFilterDate
        }}>
            {children}
        </GlobalContext.Provider>
    )
};

export const useGlobalContext = () => {
    return useContext(GlobalContext);
}