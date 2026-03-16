import { useEffect, useMemo, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { RBAlert, RBButton, RBCard, RBInput, RBTable, RBTabs } from './components/reactbits/UI';
import { bankerAvoidance, buildGraphElements, detectDeadlock, randomSystem, runBatchSimulations } from './utils/algorithms';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

const emptyMatrix = (p, r) => Array.from({ length: p }, () => Array.from({ length: r }, () => 0));

export default function App() {
  const [dark, setDark] = useState(true);
  const [processes, setProcesses] = useState(4);
  const [resources, setResources] = useState(3);
  const [allocation, setAllocation] = useState(emptyMatrix(4, 3));
  const [request, setRequest] = useState(emptyMatrix(4, 3));
  const [available, setAvailable] = useState(Array.from({ length: 3 }, () => 1));
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('Simulation');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);


  useEffect(() => {
    fetch('/api/experiments').then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setHistory(data);
    }).catch(() => {});
  }, []);
  const resizeSystem = () => {
    setAllocation(emptyMatrix(processes, resources));
    setRequest(emptyMatrix(processes, resources));
    setAvailable(Array.from({ length: resources }, () => 1));
  };

  const updateCell = (setter, matrix, i, j, value) => {
    const next = matrix.map((row) => [...row]);
    next[i][j] = Number(value || 0);
    setter(next);
  };

  const runDetection = async () => {
    const start = performance.now();
    const detect = detectDeadlock(allocation, request, available);
    const banker = bankerAvoidance(allocation, request, available);
    const executionTime = Number((performance.now() - start).toFixed(3));
    const payload = { allocation, request, available, detect, banker, executionTime, createdAt: new Date().toISOString() };
    setResult(payload);
    setHistory((h) => [payload, ...h].slice(0, 10));
    await fetch('/api/experiments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
  };

  const randomize = () => {
    const s = randomSystem(processes, resources);
    setAllocation(s.allocation);
    setRequest(s.request);
    setAvailable(s.available);
  };

  const graphElements = useMemo(() => buildGraphElements(allocation, request), [allocation, request]);
  const perfPoints = useMemo(() => runBatchSimulations(processes, resources, 25), [processes, resources]);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ allocation, request, available, result }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deadlock-experiment.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'deadlock-chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen p-4 grid grid-cols-12 gap-4">
      <aside className="col-span-12 lg:col-span-2 space-y-4">
        <RBCard>
          <h1 className="font-bold mb-2">Deadlock Detection and Analysis Lab</h1>
          <RBButton className="w-full mb-2" onClick={() => setDark((d) => !d)}>{dark ? 'Light' : 'Dark'} Mode</RBButton>
          <RBTabs tabs={['Simulation', 'Learning', 'History']} active={tab} setActive={setTab} />
        </RBCard>
        <RBCard>
          <h2 className="font-semibold mb-2">System Config</h2>
          <label className="text-xs">Processes</label>
          <RBInput type="number" min={1} value={processes} onChange={(e) => setProcesses(Number(e.target.value))} />
          <label className="text-xs mt-2 block">Resources</label>
          <RBInput type="number" min={1} value={resources} onChange={(e) => setResources(Number(e.target.value))} />
          <RBButton className="w-full mt-2" onClick={resizeSystem}>Regenerate Tables</RBButton>
          <RBButton className="w-full mt-2 bg-emerald-600" onClick={randomize}>Generate Random System</RBButton>
        </RBCard>
      </aside>

      <main className="col-span-12 lg:col-span-7 space-y-4">
        {tab === 'Simulation' && (
          <>
            <RBCard>
              <h2 className="font-semibold mb-2">Allocation Matrix</h2>
              <RBTable
                headers={['Process', ...Array.from({ length: resources }, (_, i) => `R${i}`)]}
                rows={allocation.map((row, i) => (
                  <tr key={i} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-2">P{i}</td>
                    {row.map((v, j) => <td key={j} className="p-1"><RBInput type="number" value={v} onChange={(e) => updateCell(setAllocation, allocation, i, j, e.target.value)} /></td>)}
                  </tr>
                ))}
              />
              <h2 className="font-semibold my-2">Request Matrix</h2>
              <RBTable
                headers={['Process', ...Array.from({ length: resources }, (_, i) => `R${i}`)]}
                rows={request.map((row, i) => (
                  <tr key={i} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-2">P{i}</td>
                    {row.map((v, j) => <td key={j} className="p-1"><RBInput type="number" value={v} onChange={(e) => updateCell(setRequest, request, i, j, e.target.value)} /></td>)}
                  </tr>
                ))}
              />
              <div className="mt-2 grid grid-cols-3 gap-2">
                {available.map((v, i) => <RBInput key={i} type="number" value={v} onChange={(e) => { const n = [...available]; n[i] = Number(e.target.value || 0); setAvailable(n); }} />)}
              </div>
              <RBButton className="mt-3" onClick={runDetection}>Run Detection</RBButton>
            </RBCard>

            <RBCard>
              <h2 className="font-semibold mb-2">Resource Allocation Graph</h2>
              <CytoscapeComponent
                elements={graphElements}
                style={{ width: '100%', height: '320px' }}
                layout={{ name: 'cose' }}
                stylesheet={[
                  { selector: 'node[type="process"]', style: { shape: 'ellipse', 'background-color': '#6366f1', label: 'data(label)', color: '#fff', 'text-valign': 'center' } },
                  { selector: 'node[type="resource"]', style: { shape: 'round-rectangle', 'background-color': '#0ea5e9', label: 'data(label)', color: '#fff', 'text-valign': 'center' } },
                  { selector: 'edge[kind="request"]', style: { width: 2, 'line-color': '#f97316', 'target-arrow-color': '#f97316', 'target-arrow-shape': 'triangle' } },
                  { selector: 'edge[kind="allocation"]', style: { width: 2, 'line-color': '#10b981', 'target-arrow-color': '#10b981', 'target-arrow-shape': 'triangle' } }
                ]}
              />
            </RBCard>
          </>
        )}

        {tab === 'Learning' && (
          <RBCard>
            <h2 className="font-semibold">Learning Mode</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2 text-sm">
              <li>Deadlock occurs when processes wait forever for resources held by each other.</li>
              <li>Coffman conditions: mutual exclusion, hold-and-wait, no preemption, circular wait.</li>
              <li>Detection algorithm simulates completion using work and finish vectors.</li>
              <li>In RAG, cycles indicate potential deadlocks and become guaranteed deadlocks in single-instance systems.</li>
            </ul>
          </RBCard>
        )}

        {tab === 'History' && (
          <RBCard>
            <h2 className="font-semibold">Experiment History</h2>
            {history.map((h, i) => <button key={i} className="block w-full text-left p-2 mt-2 rounded bg-slate-200 dark:bg-slate-800" onClick={() => setResult(h)}>{new Date(h.createdAt).toLocaleString()} - {h.detect.deadlock ? 'Deadlock' : 'Safe'}</button>)}
          </RBCard>
        )}
      </main>

      <section className="col-span-12 lg:col-span-3 space-y-4">
        <RBCard>
          <h2 className="font-semibold mb-2">Analysis Dashboard</h2>
          {!result ? <RBAlert>Run simulation to view analytics.</RBAlert> : (
            <>
              <RBAlert variant={result.detect.deadlock ? 'danger' : 'success'}>
                {result.detect.deadlock ? 'Deadlock detected' : 'No deadlock detected'}
              </RBAlert>
              <p className="text-sm mt-2">Deadlocked processes: {result.detect.deadlocked.join(', ') || 'None'}</p>
              <p className="text-sm">Detection time: {result.executionTime} ms</p>
              <p className="text-sm">Banker (avoidance): {result.banker.safe ? 'Safe sequence exists' : 'Unsafe state'}</p>
            </>
          )}
        </RBCard>

        <RBCard>
          <h2 className="font-semibold mb-2">Comparison Mode</h2>
          <Bar
            data={{
              labels: ['Detection', 'Prevention', 'Avoidance'],
              datasets: [{
                label: 'Relative Deadlock Risk',
                data: [result?.detect.deadlock ? 100 : 20, 5, result?.banker.safe ? 15 : 60],
                backgroundColor: ['#f97316', '#10b981', '#6366f1']
              }]
            }}
          />
        </RBCard>

        <RBCard>
          <h2 className="font-semibold mb-2">Performance Analysis</h2>
          <Line data={{ labels: perfPoints.map((p) => `P${p.x}`), datasets: [{ label: 'Deadlock Probability', data: perfPoints.map((p) => p.y), borderColor: '#e11d48' }] }} />
          <div className="grid grid-cols-3 gap-2 mt-3">
            <RBButton onClick={exportJSON}>JSON</RBButton>
            <RBButton onClick={exportPNG} className="bg-sky-600">PNG</RBButton>
            <RBButton onClick={() => window.print()} className="bg-violet-600">PDF</RBButton>
          </div>
        </RBCard>
      </section>
    </div>
  );
}
