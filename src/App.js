import './App.css';
import { useEffect } from 'react';
const proto = require('./grpc/StockFeed_pb.js');
const grpc = require('./grpc/StockFeed_grpc_web_pb.js');
function App() {
  useEffect(() => {
    const request = new proto.Empty();
    const client = new grpc.StockFeedClient('http://localhost:8080');

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
