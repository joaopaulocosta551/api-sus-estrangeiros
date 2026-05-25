import { useEffect, useState } from 'react';
import { fetchAttendances, importAttendances } from './api';
import './index.css';

interface Attendance {
  id: number;
  externalId: string;
  year: number;
  month: number;
  country: string;
  state: string;
  quantity: number;
}

function App() {
  const [data, setData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');
  const [importCount, setImportCount] = useState<number>(500); // Default to 500 for a richer dataset!
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchAttendances();
      setData(result);
      setError('');
    } catch (err) {
      setError('Falha ao conectar com a API. O servidor do Spring Boot está rodando na porta 8081?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImport = async (count: number) => {
    setImporting(true);
    try {
      await importAttendances(count);
      await loadData(); // Reload after importing
    } catch (err) {
      setError('Falha na importação. Verifique os logs do backend.');
    } finally {
      setImporting(false);
    }
  };

  // Filter data based on selected state
  const filteredData = selectedStateFilter === 'all' 
    ? data 
    : data.filter(item => item.state === selectedStateFilter);

  // --- STATS CALCULATIONS ---
  const totalAttendances = filteredData.reduce((acc, curr) => acc + curr.quantity, 0);

  // Group by State (Always use full data for state distribution chart, but other metrics reflect filtered data)
  const stateStats = Object.entries(
    data.reduce((acc, curr) => {
      acc[curr.state] = (acc[curr.state] || 0) + curr.quantity;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);

  const topState = stateStats[0]?.state || 'N/A';

  // Group by Country
  const countryStats = Object.entries(
    filteredData.reduce((acc, curr) => {
      acc[curr.country] = (acc[curr.country] || 0) + curr.quantity;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  const topCountry = countryStats[0]?.country || 'N/A';

  // Group by Month (Trend)
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthlyStats = Object.entries(
    filteredData.reduce((acc, curr) => {
      const key = `${curr.year}-${String(curr.month).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + curr.quantity;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([key, count]) => {
      const [year, monthStr] = key.split('-');
      const monthIdx = parseInt(monthStr, 10) - 1;
      return {
        label: `${monthNames[monthIdx]}/${year.substring(2)}`,
        rawDate: key,
        count,
      };
    })
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

  const averageMonthly = monthlyStats.length > 0 
    ? Math.round(totalAttendances / monthlyStats.length) 
    : 0;

  // List of unique states available for filtering
  const availableStates = Array.from(new Set(data.map(item => item.state))).sort();

  // --- SVG CHART PARAMETERS ---
  const svgHeight = 220;
  const svgWidth = 500;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 30;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const chartWidth = svgWidth - paddingLeft - paddingRight;

  return (
    <div className="glass-panel animate-fade-in">
      <header className="header">
        <div className="title-group">
          <h1>SUS Atendimentos</h1>
          <p>Painel Inteligente de Monitoramento de Estrangeiros no Brasil</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Filtro de Estado */}
          {data.length > 0 && (
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '12px',
                color: '#60a5fa',
                padding: '0.75rem 1rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
            >
              <option value="all">📍 Todos os Estados</option>
              {availableStates.map(st => (
                <option key={st} value={st}>📍 Estado: {st}</option>
              ))}
            </select>
          )}

          <select
            value={importCount}
            onChange={(e) => setImportCount(Number(e.target.value))}
            disabled={importing}
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              color: 'var(--text-main)',
              padding: '0.75rem 1rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'inherit'
            }}
          >
            <option value="100">100 registros</option>
            <option value="500">500 registros</option>
            <option value="1000">1.000 registros</option>
            <option value="2000">2.000 registros</option>
            <option value="5000">5.000 registros</option>
          </select>
          <button 
            className="btn" 
            onClick={() => handleImport(importCount)} 
            disabled={importing}
          >
            {importing ? <div className="spinner"></div> : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Importar
              </>
            )}
          </button>
        </div>
      </header>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.25)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
          Painel Geral (Dashboard)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          Registros Importados
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem 0' }}>
          <div className="spinner" style={{ width: '45px', height: '45px', borderWidth: '4px', borderTopColor: 'var(--primary)' }}></div>
        </div>
      ) : activeTab === 'dashboard' ? (
        <div className="animate-fade-in">
          {/* Metrics Row */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">
                Total Atendidos
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="metric-value">{totalAttendances}</div>
              <div className="metric-desc">Estrangeiros notificados no SUS</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">
                Estado Líder
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 0-10 10c0 5.25 10 12 10 12s10-6.75 10-12a10 10 0 0 0-10-10z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="metric-value">{topState}</div>
              <div className="metric-desc">Maior volume de registros</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">
                Principal Origem
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <div className="metric-value" style={{ fontSize: topCountry.length > 10 ? '1.7rem' : '2.2rem' }}>{topCountry}</div>
              <div className="metric-desc">Nacionalidade mais frequente</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">
                Média Mensal
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div className="metric-value">{averageMonthly}</div>
              <div className="metric-desc">Atendimentos por mês ativo</div>
            </div>
          </div>

          {totalAttendances === 0 ? (
            <div className="chart-card" style={{ justifyContent: 'center', alignItems: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Nenhum dado importado</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>Clique em "Importar Dados OpenDataSUS" no topo para carregar e modelar dados reais do SUS!</p>
            </div>
          ) : (
            <>
              {/* Charts Row */}
              <div className="dashboard-grid">
                {/* State Distribution SVG Bar Chart */}
                <div className="chart-card">
                  <div className="chart-title">
                    Distribuição por Estado (UF)
                    <span className="badge">Geral</span>
                  </div>
                  <div className="chart-container">
                    {stateStats.length > 0 && (
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%">
                        <defs>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                        {/* Horizontal Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                          const yVal = paddingTop + chartHeight * (1 - ratio);
                          const maxVal = Math.max(...stateStats.map(s => s.count), 1);
                          return (
                            <g key={idx}>
                              <line x1={paddingLeft} y1={yVal} x2={svgWidth - paddingRight} y2={yVal} className="svg-grid-line" />
                              <text x={paddingLeft - 8} y={yVal + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontWeight="600">
                                {Math.round(maxVal * ratio)}
                              </text>
                            </g>
                          );
                        })}
                        {/* Bars and labels */}
                        {stateStats.map((s, idx) => {
                          const maxVal = Math.max(...stateStats.map(x => x.count), 1);
                          const barHeight = (s.count / maxVal) * chartHeight;
                          const colWidth = chartWidth / stateStats.length;
                          const barWidth = Math.min(32, colWidth * 0.55);
                          const xVal = paddingLeft + idx * colWidth + (colWidth - barWidth) / 2;
                          const yVal = paddingTop + (chartHeight - barHeight);

                          return (
                            <g key={idx}>
                              <rect
                                x={xVal}
                                y={yVal}
                                width={barWidth}
                                height={barHeight}
                                fill="url(#barGrad)"
                                rx="6"
                                className="chart-bar"
                              />
                              <text
                                x={xVal + barWidth / 2}
                                y={svgHeight - 12}
                                fill="var(--text-main)"
                                fontSize="11"
                                fontWeight="700"
                                textAnchor="middle"
                              >
                                {s.state}
                              </text>
                              <text
                                x={xVal + barWidth / 2}
                                y={yVal - 6}
                                fill="white"
                                fontSize="10"
                                fontWeight="700"
                                textAnchor="middle"
                              >
                                {s.count}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    )}
                  </div>
                </div>

                {/* Country Breakdown (Progress Bars) */}
                <div className="chart-card">
                  <div className="chart-title">
                    Países de Origem
                    <span className="badge badge-country">Demografia</span>
                  </div>
                  <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', width: '100%' }}>
                    <div className="progress-list">
                      {countryStats.slice(0, 5).map((c, idx) => {
                        const percent = totalAttendances > 0 ? (c.count / totalAttendances) * 100 : 0;
                        const colors = [
                          'linear-gradient(90deg, #3b82f6, #60a5fa)',
                          'linear-gradient(90deg, #8b5cf6, #c084fc)',
                          'linear-gradient(90deg, #10b981, #34d399)',
                          'linear-gradient(90deg, #f59e0b, #fbbf24)',
                          'linear-gradient(90deg, #ec4899, #f472b6)'
                        ];
                        return (
                          <div className="progress-item" key={idx}>
                            <div className="progress-label-row">
                              <span className="progress-label-name">{c.country}</span>
                              <span className="progress-label-val">{c.count} ({Math.round(percent)}%)</span>
                            </div>
                            <div className="progress-bar-bg">
                              <div 
                                className="progress-bar-fill animate-fade-in" 
                                style={{ 
                                  width: `${percent}%`,
                                  background: colors[idx % colors.length]
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Trend Area Chart (Full Width) */}
              <div className="chart-card" style={{ minHeight: '300px' }}>
                <div className="chart-title">
                  Tendência de Atendimentos Mensais
                  <span className="badge" style={{ background: 'rgba(217, 70, 239, 0.15)', color: '#f472b6', borderColor: 'rgba(217, 70, 239, 0.25)' }}>Histórico</span>
                </div>
                <div className="chart-container" style={{ minHeight: '180px' }}>
                  {monthlyStats.length > 0 && (
                    <svg viewBox="0 0 1000 200" width="100%" height="100%">
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines */}
                      {[0, 0.5, 1].map((ratio, idx) => {
                        const yVal = 15 + 140 * (1 - ratio);
                        const maxVal = Math.max(...monthlyStats.map(m => m.count), 1);
                        return (
                          <g key={idx}>
                            <line x1="45" y1={yVal} x2="985" y2={yVal} className="svg-grid-line" />
                            <text x="35" y={yVal + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontWeight="600">
                              {Math.round(maxVal * ratio)}
                            </text>
                          </g>
                        );
                      })}

                      {(() => {
                        const maxVal = Math.max(...monthlyStats.map(m => m.count), 1);
                        const w = 940;
                        const h = 140;
                        const pts = monthlyStats.map((m, idx) => {
                          const x = 45 + idx * (w / (monthlyStats.length - 1 || 1));
                          const y = 15 + (h - (m.count / maxVal) * h);
                          return { x, y };
                        });

                        // Construct SVG path string for the line
                        const linePath = pts.reduce((acc, p, idx) => 
                          idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
                        , '');

                        // Construct SVG path string for the gradient fill area
                        const areaPath = pts.length > 0 
                          ? `${linePath} L ${pts[pts.length - 1].x} 155 L ${pts[0].x} 155 Z`
                          : '';

                        return (
                          <g>
                            {/* Gradient Area Fill */}
                            {areaPath && <path d={areaPath} fill="url(#areaGrad)" className="animate-fade-in" />}
                            
                            {/* Smooth Stroke Line */}
                            {linePath && (
                              <path
                                d={linePath}
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="chart-line"
                              />
                            )}

                            {/* Data points */}
                            {pts.map((p, idx) => (
                              <g key={idx}>
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r="5"
                                  fill="#8b5cf6"
                                  stroke="#ffffff"
                                  strokeWidth="2.5"
                                  className="chart-dot"
                                />
                                <text
                                  x={p.x}
                                  y={p.y - 10}
                                  fill="white"
                                  fontSize="9"
                                  fontWeight="700"
                                  textAnchor="middle"
                                >
                                  {monthlyStats[idx].count}
                                </text>
                                <text
                                  x={p.x}
                                  y="180"
                                  fill="var(--text-muted)"
                                  fontSize="10"
                                  fontWeight="600"
                                  textAnchor="middle"
                                >
                                  {monthlyStats[idx].label}
                                </text>
                              </g>
                            ))}
                          </g>
                        );
                      })()}
                    </svg>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="table-container animate-fade-in">
          <table>
            <thead>
              <tr>
                <th>ID Externo</th>
                <th>País de Origem</th>
                <th>Estado (UF)</th>
                <th>Período de Atendimento</th>
                <th>Qtd</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 1rem', opacity: 0.5 }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="9" y1="9" x2="15" y2="9"></line>
                      <line x1="9" y1="13" x2="15" y2="13"></line>
                      <line x1="9" y1="17" x2="15" y2="17"></line>
                    </svg>
                    Nenhum registro encontrado.  
                    <span style={{ display: 'block', fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                      Clique em "Importar Dados OpenDataSUS" no topo para puxar novos dados.
                    </span>
                  </td>
                </tr>
              ) : (
                data.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {item.externalId ? item.externalId.substring(0, 10) + '...' : 'N/A'}
                    </td>
                    <td>
                      <span className="badge badge-country">{item.country}</span>
                    </td>
                    <td>
                      <span className="badge">{item.state}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {String(item.month).padStart(2, '0')}/{item.year}
                    </td>
                    <td style={{ color: 'white', fontWeight: 700 }}>
                      {item.quantity}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
