export function detectDeadlock(allocation, request, available) {
  const n = allocation.length;
  const m = available.length;
  const work = [...available];
  const finish = Array(n).fill(false);
  const steps = [];
  let progress = true;

  while (progress) {
    progress = false;
    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;
      const canRun = request[i].every((need, r) => need <= work[r]);
      steps.push({ process: `P${i}`, action: canRun ? 'executed' : 'blocked', work: [...work] });
      if (canRun) {
        for (let r = 0; r < m; r++) work[r] += allocation[i][r];
        finish[i] = true;
        progress = true;
      }
    }
  }

  const deadlocked = finish.map((done, i) => (!done ? `P${i}` : null)).filter(Boolean);
  return {
    deadlock: deadlocked.length > 0,
    deadlocked,
    finish,
    steps,
    finalWork: work
  };
}

export function bankerAvoidance(allocation, request, available) {
  const res = detectDeadlock(allocation, request, available);
  return { safe: !res.deadlock, sequence: res.steps.filter((s) => s.action === 'executed').map((s) => s.process) };
}

export function randomSystem(processes, resources) {
  const allocation = Array.from({ length: processes }, () => Array.from({ length: resources }, () => Math.floor(Math.random() * 3)));
  const request = Array.from({ length: processes }, () => Array.from({ length: resources }, () => Math.floor(Math.random() * 4)));
  const available = Array.from({ length: resources }, () => Math.floor(Math.random() * 5));
  return { allocation, request, available };
}

export function buildGraphElements(allocation, request) {
  const processes = allocation.map((_, i) => ({ data: { id: `P${i}`, label: `P${i}`, type: 'process' } }));
  const resources = allocation[0].map((_, i) => ({ data: { id: `R${i}`, label: `R${i}`, type: 'resource' } }));
  const edges = [];

  allocation.forEach((row, p) => row.forEach((val, r) => {
    if (val > 0) edges.push({ data: { id: `a-${p}-${r}`, source: `R${r}`, target: `P${p}`, kind: 'allocation', weight: val } });
  }));

  request.forEach((row, p) => row.forEach((val, r) => {
    if (val > 0) edges.push({ data: { id: `q-${p}-${r}`, source: `P${p}`, target: `R${r}`, kind: 'request', weight: val } });
  }));

  return [...processes, ...resources, ...edges];
}

export function runBatchSimulations(baseP = 5, baseR = 4, runs = 20) {
  const points = [];
  for (let p = 2; p <= baseP + 4; p++) {
    let deadlocks = 0;
    for (let i = 0; i < runs; i++) {
      const s = randomSystem(p, baseR);
      if (detectDeadlock(s.allocation, s.request, s.available).deadlock) deadlocks++;
    }
    points.push({ x: p, y: Number((deadlocks / runs).toFixed(2)) });
  }
  return points;
}
