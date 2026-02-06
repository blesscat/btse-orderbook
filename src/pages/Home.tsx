import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-4xl font-bold text-gray-800">BTSE OrderBook Demo</h1>
        <p className="mb-8 text-gray-600">Real-time order book data from BTSE Futures WebSocket</p>
        <Link
          to="/orderbook"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          View Trading OrderBook
        </Link>
      </div>
    </div>
  )
}
