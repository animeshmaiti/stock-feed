package org.price.stream;

import io.github.cdimascio.dotenv.Dotenv;
import io.grpc.Context;
import io.grpc.Server;
import io.grpc.netty.shaded.io.grpc.netty.NettyServerBuilder;
import io.grpc.stub.StreamObserver;

import java.sql.*;

public class FeedServerDateFilter {
    public static final Dotenv dotenv = Dotenv.load();
    private static final String DB_URL = dotenv.get("DB_URL");
    private static final String DB_USER = dotenv.get("DB_USER");
    private static final String DB_PASS = dotenv.get("DB_PASS");
    private static final int PORT = Integer.parseInt(dotenv.get("GRPC_PORT"));

    public static void main(String[] args) throws Exception {
        System.out.println("🟢 Starting gRPC server on port " + PORT + "...");
        Server server = NettyServerBuilder.forPort(PORT)
                .addService(new StockFeedImpl())
                .build();

        server.start();
        System.out.println("✅ Server started on port " + PORT);

        server.awaitTermination();
    }

    static class StockFeedImpl extends StockFeedGrpc.StockFeedImplBase {

        @Override
        public void streamPrices(StockRequest request, StreamObserver<PriceUpdate> responseObserver) {
            String symbol = sanitizeSymbol(request.getSymbol());
            System.out.println("📡 Received request for symbol: " + symbol);

            long lastId = 0L;
            Context ctx = Context.current();

            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS)) {

                String maxDate = fetchMaxDate(conn, symbol);
                if (maxDate == null) {
                    System.err.println("⚠️ No data found for symbol " + symbol + ".");
                    responseObserver.onCompleted();
                    return;
                }

                String query = buildQuery(request, maxDate, symbol);
                System.out.println("⬇️ SQL: " + query);

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
                                responseObserver.onNext(update);
                            }
                        }
                    }
                    if (!dataSent) Thread.sleep(1000); // Poll again later
                }
                responseObserver.onCompleted();
                System.out.println("✅ Completed streaming for symbol " + symbol + ".");
            } catch (Exception e) {
                System.err.println("❌ Server error: " + e.getMessage());
                e.printStackTrace();
                try {
                    responseObserver.onError(e);      // only ONCE if something fails
                } catch (Exception ignore) {
                    // Already closed, ignore secondary errors
                }
            }
        }

        // Only allow safe table names (strict alphanumeric and underscores)
        private static String sanitizeSymbol(String symbol) {
            return symbol.replaceAll("[^a-zA-Z0-9_]", "");
        }

        // Fetch the latest date for the given symbol/table
        private static String fetchMaxDate(Connection conn, String tableName) throws SQLException {
            String sql = "SELECT MAX(date) FROM " + tableName;
            try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
                if (rs.next()) {
                    return rs.getString(1); // may return null if no data
                }
            }
            return null; // No rows
        }

        // Build the SQL query with appropriate date filtering
        private static String buildQuery(StockRequest request, String maxDate, String tableName) {
            String dateFilter = "";
            switch (request.getDateRange()) {
                case RECENT_MONTH -> dateFilter = " AND date >= DATE_SUB('" + maxDate + "', INTERVAL 1 MONTH)";
                case ONE_YEAR -> dateFilter = " AND date >= DATE_SUB('" + maxDate + "', INTERVAL 1 YEAR)";
                case FIVE_YEAR -> dateFilter = " AND date >= DATE_SUB('" + maxDate + "', INTERVAL 5 YEAR)";
                default -> dateFilter = "";
            }
            return "SELECT id, date, open, high, low, close, volume FROM " +
                    tableName + " WHERE id > ?" + dateFilter + " ORDER BY id ASC";
        }
    }
}
