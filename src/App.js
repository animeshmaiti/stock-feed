import './App.css';
import { useEffect } from 'react';
const { Empty } = require('./grpc/StockFeed_pb.js');
const { StockFeedClient } = require('./grpc/StockFeed_grpc_web_pb.js');

function App() {
  useEffect(() => {
    const client = new StockFeedClient('http://localhost:8080');
    const request = new Empty();
    const stream = client.streamPrices(request, {});

    stream.on('data', (response) => {
      console.log('📈 Price update:', response.toObject());
    });

    stream.on('error', (err) => {
      console.error('❌ Error:', err.message);
    });

    stream.on('end', () => {
      console.log('✅ Stream ended.');
    });
  }, []);
  return <div>gRPC Web Streaming Client</div>;
}

export default App;
