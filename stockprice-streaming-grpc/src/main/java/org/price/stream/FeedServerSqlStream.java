package org.price.stream;

import io.github.cdimascio.dotenv.Dotenv;
import io.grpc.Context;
import io.grpc.Server;
import io.grpc.netty.shaded.io.grpc.netty.NettyServerBuilder;
import io.grpc.stub.StreamObserver;

import java.sql.*;

public class FeedServerSqlStream {
    // -- DB Configuration --
    public static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASS = dotenv.get("DB_PASS");
    private static final int PORT = Integer.parseInt(dotenv.get("GRPC_PORT"));

    public static void main(String[] args) throws Exception {
        System.out.println("🟢 Starting gRPC server on port 50051...");

        Server server = NettyServerBuilder.forPort(PORT)
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
            String tableName = symbol.replaceAll("[^a-zA-Z0-9_]", "");
            System.out.println("📡 Received request for symbol: " + tableName);

            String query = "SELECT id, date, open, high, low, close, volume FROM " + tableName + " WHERE id > ? ORDER BY id ASC";

            long lastId = 0L; // Track last-sent row ID
            Context ctx = Context.current();

            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS)) {
                while (!ctx.isCancelled()) {
                    boolean dataSent = false;
                    try (PreparedStatement stmt = conn.prepareStatement(query)) {
                        stmt.setLong(1, lastId);
                        try (ResultSet rs = stmt.executeQuery()) {
                            while (rs.next()) {
                                dataSent = true;
                                lastId = rs.getLong("id");
                                PriceUpdate update = PriceUpdate.newBuilder()
                                        .setDate(rs.getString("date"))
                                        .setOpen(rs.getDouble("open"))
                                        .setHigh(rs.getDouble("high"))
                                        .setLow(rs.getDouble("low"))
                                        .setClose(rs.getDouble("close"))
                                        .setVolume(rs.getLong("volume"))
                                        .build();

                                System.out.println("📤 Sending: " + update);
                                try {
                                    responseObserver.onNext(update);
                                } catch (Exception ex) {
                                    System.err.println("⚠️ Client probably disconnected. Stopping stream.");
                                    return;
                                }
                            }
                        }
                    }
                    if (!dataSent) {
                        Thread.sleep(1000); // Wait before polling again if no new data
                    }
                }
                System.out.println("✅ Completed streaming for symbol " + symbol + ".");
                responseObserver.onCompleted();
            } catch (Exception e) {
                System.err.println("❌ Server error: " + e.getMessage());
                e.printStackTrace();
                responseObserver.onError(e);
            }
        }
    }
}
