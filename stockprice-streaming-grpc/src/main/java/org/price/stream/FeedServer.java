package org.price.stream;

import io.grpc.Context;
import io.grpc.Server;
import io.grpc.netty.shaded.io.grpc.netty.NettyServerBuilder;
import io.grpc.stub.StreamObserver;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.net.URL;

public class FeedServer {
    public static void main(String[] args) throws IOException, InterruptedException {
        System.out.println("🟢 Starting gRPC server on port 50051...");

        Server server = NettyServerBuilder.forPort(50051)
                .addService(new StockFeedImpl())
                .build();

        server.start();
        System.out.println("✅ Server started on port 50051");

        server.awaitTermination();
    }

    static class StockFeedImpl extends StockFeedGrpc.StockFeedImplBase {
        @Override
        public void streamPrices(StockRequest request, StreamObserver<PriceUpdate> responseObserver) {
            String symbol = request.getSymbol();
            System.out.println("📡 Received request for symbol: " + symbol);

            String csvFileName = symbol + ".csv";
            try {
                URL resource = FeedServer.class.getClassLoader().getResource(csvFileName);
                if (resource == null) {
                    String msg = "❌ File not found in resources: " + csvFileName;
                    System.err.println(msg);
                    responseObserver.onError(
                            new RuntimeException(msg)
                    );
                    return;
                }

                try (BufferedReader br = new BufferedReader(new FileReader(resource.getFile()))) {
                    String line;
                    int count = 0;
                    br.readLine(); // skip CSV header
                    Context ctx = Context.current();
                    while (!ctx.isCancelled() && (line = br.readLine()) != null) {
                        String[] parts = line.split(",");
                        if (parts.length < 6) {
                            System.err.println("⚠️ Skipping invalid line: " + line);
                            continue;
                        }

                        PriceUpdate update = PriceUpdate.newBuilder()
                                .setDate(parts[0])
                                .setOpen(Double.parseDouble(parts[1]))
                                .setHigh(Double.parseDouble(parts[2]))
                                .setLow(Double.parseDouble(parts[3]))
                                .setClose(Double.parseDouble(parts[4]))
                                .setVolume(Long.parseLong(parts[5]))
                                .build();

                        System.out.println("📤 Sending (" + (++count) + "): " + update);
                        try {
                            responseObserver.onNext(update);
                        } catch (Exception ex) {
                            System.err.println("⚠️ Client probably disconnected. Stopping stream.");
                            break;
                        }
                        Thread.sleep(1000); // 1 second delay
                    }
                    System.out.println("✅ Completed streaming " + count + " updates for " + symbol + ".");
                    responseObserver.onCompleted();
                }
            } catch (Exception e) {
                System.err.println("❌ Server error: " + e.getMessage());
                e.printStackTrace();
                responseObserver.onError(e);
            }
        }
    }
}
