import './App.css';
import { useEffect, useRef, useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
const { Empty } = require('./grpc/StockFeed_pb.js');
const { StockFeedClient } = require('./grpc/StockFeed_grpc_web_pb.js');

function App() {
  // const streamStarted = useRef(false);
  const [stockData, setStockData] = useState([]);
  const streamRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const startStream = () => {
    const client = new StockFeedClient('http://localhost:8080');
    const request = new Empty();
    const stream = client.streamPrices(request, {});
    streamRef.current = stream;

    stream.on('data', (response) => {
      setStockData(prev => [...prev, response.toObject()]);
    });

    stream.on('error', (err) => console.error('❌ Error:', err.message));
    stream.on('end', () => console.log('✅ Stream ended.'));
  };
  // useEffect(() => {
  //   if (streamStarted.current) return;
  //   streamStarted.current = true;
  //   const client = new StockFeedClient('http://localhost:8080');
  //   const request = new Empty();
  //   const stream = client.streamPrices(request, {});

  //   stream.on('data', (response) => {
  //     setStockData(prevData => [...prevData, response.toObject()]);
  //     console.log('📈 Price update:', response.toObject());
  //   });

  //   stream.on('error', (err) => {
  //     console.error('❌ Error:', err.message);
  //   });

  //   stream.on('end', () => {
  //     console.log('✅ Stream ended.');
  //   });
  // }, []);
  useEffect(() => {
  if (!isPaused) startStream();
  return () => {
    if (streamRef.current) {
      streamRef.current.cancel(); // stop stream
      streamRef.current = null;
    }
  };
}, [isPaused]);
  return (
    <>
      <Dashboard streamData={stockData} setIsPaused={setIsPaused} isPaused={isPaused} />
    </>
  );
}

export default App;
