package org.price.stream;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.stub.StreamObserver;

import java.util.Scanner;
import java.util.concurrent.CountDownLatch;

public class FeedClient {
    public static void main(String[] args) throws InterruptedException {
        System.out.println("Client starting...");

        ManagedChannel channel = ManagedChannelBuilder.forAddress("localhost", 50051)
                .usePlaintext()
                .build();

        StockFeedGrpc.StockFeedStub stub = StockFeedGrpc.newStub(channel);

        // Get symbol from user (you could hardcode or use args[] as well)
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter stock symbol to stream: ");
        String symbol = scanner.nextLine().trim();
        if (symbol.isEmpty()) {
            symbol = "AAPL"; // default
            System.out.println("No symbol entered, using default: AAPL");
        }

        StockRequest request = StockRequest.newBuilder()
                .setSymbol(symbol)
                .setDateRange(DateRange.RECENT_MONTH)
                .build();

        CountDownLatch latch = new CountDownLatch(1); // wait until stream ends

        System.out.println("Calling streamPrices for symbol: " + symbol + "...");

        stub.streamPrices(request, new StreamObserver<PriceUpdate>() {
            @Override
            public void onNext(PriceUpdate value) {
                System.out.println("✅ Received: " + value);
            }

            @Override
            public void onError(Throwable t) {
                System.err.println("❌ Error: " + t.getMessage());
                latch.countDown();
            }

            @Override
            public void onCompleted() {
                System.out.println("✅ Stream completed.");
                latch.countDown();
            }
        });

        latch.await(); // or until completed
        channel.shutdown();
    }
}