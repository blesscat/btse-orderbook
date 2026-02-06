export function Features() {
  return (
    <div className="mt-8 rounded-xl border border-[#1e2329] bg-[#181a20] p-6">
      <h3 className="mb-4 font-['JetBrains_Mono'] text-xl font-semibold">Features</h3>
      <ul className="space-y-2 text-sm text-[#8898aa]">
        <li>✓ Show max 8 quotes for both buy and sell</li>
        <li>✓ Format number with commas as thousands separators</li>
        <li>✓ Add hover background color on whole row</li>
        <li>✓ Last price color style with background animation</li>
        <li>✓ Quote total formula (cumulative)</li>
        <li>✓ Accumulative total size percentage bar</li>
        <li>✓ Quote highlight animation on new quotes and size changes</li>
      </ul>
    </div>
  )
}
