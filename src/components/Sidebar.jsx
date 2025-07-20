import { useGlobalContext } from "../context/globalContext";
import { DateRange } from "../grpc/StockFeed_pb.js"; // adjust import as needed

const DATE_FILTER_OPTIONS = [
    { label: "All", value: DateRange.ALL },
    { label: "Recent Month", value: DateRange.RECENT_MONTH },
    { label: "1 Year", value: DateRange.ONE_YEAR },
    { label: "5 Years", value: DateRange.FIVE_YEAR }
];

const Sidebar = () => {
    const { selectedStock, setSelectedStock, isPaused, setIsPaused, setFilterDate, filterDate } = useGlobalContext();
    const STOCK_OPTIONS = ["AAPL", "RELIANCE", "TCS"];
    return (
        <div className="col-span-1 h-full w-60">
            <div className="bg-white border shadow-md p-4 rounded-[20px] flex flex-col gap-4">
                <h2 className="text-lg font-semibold mb-2">Stocks</h2>

                {STOCK_OPTIONS.map((symbol) => (
                    <button
                        key={symbol}
                        onClick={() => setSelectedStock(symbol)}
                        className={`px-4 py-2 rounded ${selectedStock === symbol
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-black hover:bg-blue-100"
                            }`}
                    >
                        {symbol}
                    </button>
                ))}
                <label className="block text-sm mb-1" htmlFor="filter-select">Filter by Date:</label>
                <select
                    id="filter-select"
                    className="border rounded px-3 py-1 text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={filterDate}
                    onChange={e => setFilterDate(Number(e.target.value))}
                >
                    {DATE_FILTER_OPTIONS.map(opt =>
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    )}
                </select>
                <hr className="my-2" />

                <button
                    onClick={() => setIsPaused((prev) => !prev)}
                    className="px-4 py-2 bg-purple-600 text-white rounded"
                >
                    {isPaused ? "Resume" : "Pause"}
                </button>
            </div>
        </div>
    )
}

export default Sidebar