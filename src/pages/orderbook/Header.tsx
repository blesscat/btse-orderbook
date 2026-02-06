import { Link } from 'react-router-dom'
import type { ConnectionStatus } from '../../ws-manager'

interface HeaderProps {
  status: ConnectionStatus
}

export function Header({ status }: HeaderProps) {
  return (
    <div className="border-b border-[#1e2329] bg-[#181a20] px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div>
          <h1 className="font-['JetBrains_Mono'] text-2xl font-bold tracking-tight">Order Book</h1>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-sm text-[#8898aa]">BTCPFC</span>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  status === 'connected'
                    ? 'animate-pulse bg-green-500'
                    : status === 'connecting'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
              <span className="font-['JetBrains_Mono'] text-xs text-[#8898aa] capitalize">{status}</span>
            </div>
          </div>
        </div>
        <Link
          to="/"
          className="rounded-lg border border-[#2b3139] bg-[#1e2329] px-4 py-2 font-['JetBrains_Mono'] text-sm font-medium transition-colors hover:bg-[#2b3139]"
        >
          ← Back
        </Link>
      </div>
    </div>
  )
}
