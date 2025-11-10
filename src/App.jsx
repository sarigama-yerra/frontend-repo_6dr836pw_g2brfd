import { useEffect, useMemo, useState } from 'react'

function formatCurrency(n) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [services, setServices] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [area, setArea] = useState(50)
  const [fixtures, setFixtures] = useState(4)
  const [projectName, setProjectName] = useState('New Plumbing Project')
  const [locationFactor, setLocationFactor] = useState(1.0)
  const [overheadPct, setOverheadPct] = useState(0.1)
  const [taxPct, setTaxPct] = useState(0.08)
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${baseUrl}/services`)
      .then(r => r.json())
      .then(setServices)
      .catch(() => setServices([]))
  }, [baseUrl])

  const toggle = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const totals = useMemo(() => {
    if (!quote) return null
    return {
      subtotal: quote.subtotal,
      overhead: quote.overhead,
      tax: quote.tax,
      total: quote.total,
    }
  }, [quote])

  const requestEstimate = async ()n  => {
    setLoading(true)
    setError('')
    try {
      const body = {
        project_name: projectName,
        area_sqm: Number(area) || 0,
        fixtures: Number(fixtures) || 0,
        service_ids: Array.from(selected),
        location_factor: Number(locationFactor) || 1,
        overhead_pct: Number(overheadPct) || 0,
        tax_pct: Number(taxPct) || 0,
      }
      const res = await fetch(`${baseUrl}/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Failed to get estimate')
      const data = await res.json()
      setQuote(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-100">
      <header className="sticky top-0 bg-white/70 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Plumbing Services & Cost Estimator</h1>
          <a href="/test" className="text-sm text-slate-600 hover:text-slate-900 underline">Health Check</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Select Services</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {services.map(s => (
              <button key={s.id}
                onClick={() => toggle(s.id)}
                className={`text-left p-4 rounded-lg border transition-all ${selected.has(s.id) ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200' : 'bg-white hover:bg-gray-50'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{s.name}</p>
                    <p className="text-sm text-slate-600">{s.description}</p>
                  </div>
                  <span className="text-sm font-medium text-slate-700">{formatCurrency(s.rate)} / {s.unit}</span>
                </div>
                {s.category && <p className="mt-2 inline-block text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{s.category}</p>}
              </button>
            ))}
          </div>
        </section>

        <aside className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Project Details</h2>
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-slate-600">Project Name</span>
              <input value={projectName} onChange={e=>setProjectName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Area (sqm) for area-based services</span>
              <input type="number" value={area} onChange={e=>setArea(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Fixtures count for fixture-based services</span>
              <input type="number" value={fixtures} onChange={e=>setFixtures(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="text-xs text-slate-600">Location factor</span>
                <input type="number" step="0.05" value={locationFactor} onChange={e=>setLocationFactor(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" />
              </label>
              <label className="block">
                <span className="text-xs text-slate-600">Overhead %</span>
                <input type="number" step="0.01" value={overheadPct} onChange={e=>setOverheadPct(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" />
              </label>
              <label className="block">
                <span className="text-xs text-slate-600">Tax %</span>
                <input type="number" step="0.01" value={taxPct} onChange={e=>setTaxPct(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" />
              </label>
            </div>
            <button onClick={requestEstimate} disabled={loading || selected.size===0} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold py-2 rounded">{loading ? 'Calculating...' : 'Get Estimate'}</button>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
        </aside>

        <section className="lg:col-span-3 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Estimate</h2>
          {!quote ? (
            <p className="text-slate-600">Choose services and calculate to see detailed costs.</p>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <p className="font-medium">{quote.project_name}</p>
                <div className="text-sm text-slate-600">Area: {quote.area_sqm} sqm · Fixtures: {quote.fixtures}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-2">Service</th>
                      <th className="text-left p-2">Unit</th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-right p-2">Rate</th>
                      <th className="text-right p-2">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((it, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{it.service_name}</td>
                        <td className="p-2">{it.unit}</td>
                        <td className="p-2 text-right">{it.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(it.rate)}</td>
                        <td className="p-2 text-right font-medium">{formatCurrency(it.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded p-3">
                  <p className="text-xs text-slate-600">Subtotal</p>
                  <p className="text-lg font-semibold">{formatCurrency(totals.subtotal)}</p>
                </div>
                <div className="bg-slate-50 rounded p-3">
                  <p className="text-xs text-slate-600">Overhead</p>
                  <p className="text-lg font-semibold">{formatCurrency(totals.overhead)}</p>
                </div>
                <div className="bg-slate-50 rounded p-3">
                  <p className="text-xs text-slate-600">Tax</p>
                  <p className="text-lg font-semibold">{formatCurrency(totals.tax)}</p>
                </div>
                <div className="bg-slate-50 rounded p-3">
                  <p className="text-xs text-slate-600">Total</p>
                  <p className="text-lg font-bold">{formatCurrency(totals.total)}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="py-8 text-center text-slate-500 text-sm">© {new Date().getFullYear()} Plumbing Co. All rights reserved.</footer>
    </div>
  )
}

export default App
