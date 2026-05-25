import { useEffect, useState } from 'react';
import { fetchAttendances, fetchDashboardStats, importAttendances, fetchImportStatus, cancelImportAttendances } from './api';
import type { DashboardStats } from './api';
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

const BRAZILIAN_STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' }
];

function App() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tableData, setTableData] = useState<Attendance[]>([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // Non-blocking background sync status
  const [cancelling, setCancelling] = useState(false); // Synchronization cancellation state
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');
  const [importCount, setImportCount] = useState<number | 'all_records'>(500); // Default to 500
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');

  const loadStats = async (stateFilter: string) => {
    // Only show full-screen loader on initial mount, not during live-background sync polling
    if (!stats) setLoading(true);
    try {
      const result = await fetchDashboardStats(stateFilter);
      setStats(result);
      setError('');
    } catch (err) {
      setError('Falha ao carregar estatísticas do painel. O servidor do Spring Boot está rodando na porta 8081?');
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (page: number, stateFilter: string) => {
    if (tableData.length === 0) setTableLoading(true);
    try {
      const result = await fetchAttendances(page, pageSize, stateFilter);
      setTableData(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setCurrentPage(result.number);
      setError('');
    } catch (err) {
      setError('Falha ao conectar com a API para obter registros paginados.');
    } finally {
      setTableLoading(false);
    }
  };

  // Poll background synchronization status periodically
  useEffect(() => {
    const checkSyncStatus = async () => {
      try {
        const result = await fetchImportStatus();
        setIsSyncing(result.isImporting);
      } catch (err) {
        // Silently fail status polling
      }
    };

    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 4000); // Poll status every 4 seconds
    return () => clearInterval(interval);
  }, []);

  // Poll database stats and table data dynamically while sync is actively importing in the background
  useEffect(() => {
    if (!isSyncing) return;

    const reloadData = () => {
      loadStats(selectedStateFilter);
      if (activeTab === 'table') {
        loadTableData(currentPage, selectedStateFilter);
      }
    };

    const interval = setInterval(reloadData, 5000); // Live update frontend every 5 seconds
    return () => clearInterval(interval);
  }, [isSyncing, selectedStateFilter, activeTab, currentPage]);

  // Load stats when state filter changes
  useEffect(() => {
    loadStats(selectedStateFilter);
  }, [selectedStateFilter]);

  // Load table data when active tab changes to table, or page changes, or state filter changes
  useEffect(() => {
    if (activeTab === 'table') {
      loadTableData(currentPage, selectedStateFilter);
    }
  }, [activeTab, currentPage, selectedStateFilter]);

  const handleImport = async (count: number | 'all_records') => {
    setImporting(true);
    try {
      // Map 'all_records' to 50000 limit which covers the entire foreigners dataset for SP
      const limit = count === 'all_records' ? 50000 : count;
      await importAttendances(limit);
      
      setIsSyncing(true); // Switch to live syncing state immediately
      setError('');
      
      // Load initial batch data
      await loadStats(selectedStateFilter);
      if (activeTab === 'table') {
        await loadTableData(0, selectedStateFilter);
      } else {
        setCurrentPage(0);
      }
    } catch (err) {
      setError('Falha ao iniciar a sincronização com o OpenDataSUS.');
    } finally {
      setImporting(false);
    }
  };

  const handleCancelSync = async () => {
    setCancelling(true);
    try {
      await cancelImportAttendances();
      setIsSyncing(false); // Instantly trigger UI off-state
    } catch (err) {
      setError('Falha ao solicitar o cancelamento da sincronização.');
    } finally {
      setCancelling(false);
    }
  };

  // --- STATS CALCULATIONS ---
  const totalAttendances = stats?.total || 0;
  const globalTotalAttendances = stats?.globalTotal || 0; // Absolute total of database, unfiltered!
  const stateStats = stats?.stateStats || [];
  const topState = stateStats[0]?.state || 'N/A';
  const countryStats = stats?.countryStats || [];
  const topCountry = countryStats[0]?.country || 'N/A';
  const monthlyStats = stats?.monthlyStats || [];
  const averageMonthly = monthlyStats.length > 0 
    ? Math.round(totalAttendances / monthlyStats.length) 
    : 0;

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
          <select
            value={selectedStateFilter}
            onChange={(e) => {
              setSelectedStateFilter(e.target.value);
              setCurrentPage(0); // Reset table page to 0 when filter changes
            }}
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
            {BRAZILIAN_STATES.map(st => (
              <option key={st.uf} value={st.uf}>📍 {st.uf} - {st.name}</option>
            ))}
          </select>

          <select
            value={importCount}
            onChange={(e) => {
              const val = e.target.value;
              setImportCount(val === 'all_records' ? 'all_records' : parseInt(val, 10));
            }}
            disabled={importing || isSyncing}
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
              fontFamily: 'inherit',
              opacity: (importing || isSyncing) ? 0.5 : 1
            }}
          >
            <option value="100">100 registros</option>
            <option value="500">500 registros</option>
            <option value="1000">1.000 registros</option>
            <option value="2000">2.000 registros</option>
            <option value="5000">5.000 registros</option>
            <option value="all_records">Todos os registros (Base Completa)</option>
          </select>
          <button 
            className="btn" 
            onClick={() => handleImport(importCount)} 
            disabled={importing || isSyncing}
            title="Buscar e sincronizar registros da API pública OpenDataSUS em segundo plano"
            style={{
              opacity: (importing || isSyncing) ? 0.55 : 1
            }}
          >
            {importing ? <div className="spinner"></div> : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                {isSyncing ? 'Sincronizando...' : 'Sincronizar SUS'}
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

      {/* NON-BLOCKING GLOWING LIVE SYNC BANNER */}
      {isSyncing && (
        <div className="live-sync-banner" style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '16px',
          color: '#60a5fa',
          padding: '1rem 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 600,
          fontSize: '0.95rem',
          transition: 'all 0.5s ease',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="spinner" style={{ 
              width: '18px', 
              height: '18px', 
              borderWidth: '2.5px', 
              borderTopColor: '#60a5fa', 
              margin: 0,
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>Sincronização Ativa: Os dados do SUS estão sendo importados em segundo plano. Os gráficos e contadores estão atualizando ao vivo!</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleCancelSync}
              disabled={cancelling}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            >
              {cancelling ? 'Parando...' : 'Parar Sincronização'}
            </button>
            <span className="badge" style={{ 
              background: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              padding: '0.25rem 0.6rem', 
              borderRadius: '6px', 
              fontSize: '0.75rem',
              fontWeight: 800,
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)'
            }}>AO VIVO</span>
          </div>
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
              {/* Unfiltered global total, showing all loaded rows in the database */}
              <div className="metric-value">{globalTotalAttendances.toLocaleString()}</div>
              <div className="metric-desc">Total acumulado na base de dados</div>
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
              <div className="metric-value">{averageMonthly.toLocaleString()}</div>
              <div className="metric-desc">Atendimentos por mês ativo</div>
            </div>
          </div>

          {totalAttendances === 0 ? (
            <div className="chart-card" style={{ justifyContent: 'center', alignItems: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Nenhum dado encontrado para o filtro</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>Clique em "Sincronizar SUS" no topo ou mude o filtro para carregar registros!</p>
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
                                 {Math.round(maxVal * ratio).toLocaleString()}
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
                                {s.count.toLocaleString()}
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
                              <span className="progress-label-val">{c.count.toLocaleString()} ({Math.round(percent)}%)</span>
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

              {/* Monthly Trend Area Chart (Optimized Vertical Space & Dynamically Spaced Month Labels) */}
              <div className="chart-card" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>
                  Tendência de Atendimentos Mensais
                  <span className="badge" style={{ background: 'rgba(217, 70, 239, 0.15)', color: '#f472b6', borderColor: 'rgba(217, 70, 239, 0.25)' }}>Histórico</span>
                </div>
                
                <div className="chart-container" style={{ flexGrow: 1, minHeight: '260px' }}>
                  {monthlyStats.length > 0 && (
                    <svg viewBox="0 0 1000 280" width="100%" height="100%">
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines (5 ratios instead of 3 for premium density) */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const yVal = 20 + 200 * (1 - ratio);
                        const maxVal = Math.max(...monthlyStats.map(m => m.count), 1);
                        return (
                          <g key={idx}>
                            <line x1="45" y1={yVal} x2="985" y2={yVal} className="svg-grid-line" />
                            <text x="35" y={yVal + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontWeight="700">
                              {Math.round(maxVal * ratio).toLocaleString()}
                            </text>
                          </g>
                        );
                      })}

                      {(() => {
                        const maxVal = Math.max(...monthlyStats.map(m => m.count), 1);
                        const w = 940;
                        const h = 200; // Increased SVG line height span
                        const pts = monthlyStats.map((m, idx) => {
                          const x = 45 + idx * (w / (monthlyStats.length - 1 || 1));
                          const y = 20 + (h - (m.count / maxVal) * h);
                          return { x, y };
                        });

                        // Construct SVG path string for the line
                        const linePath = pts.reduce((acc, p, idx) => 
                          idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
                        , '');

                        // Construct SVG path string for the gradient fill area
                        const areaPath = pts.length > 0 
                          ? `${linePath} L ${pts[pts.length - 1].x} 220 L ${pts[0].x} 220 Z`
                          : '';

                        // Decide spacing frequency based on month density
                        // Show at most 10-12 labels to completely avoid overlapping on crowded timelines
                        const labelSkipFrequency = Math.max(1, Math.ceil(monthlyStats.length / 10));

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
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="chart-line"
                              />
                            )}

                            {/* Data points */}
                            {pts.map((p, idx) => {
                              // Only show numeric values directly above dots if dataset is small (<= 15 points)
                              const showNumericDotLabel = monthlyStats.length <= 15;
                              
                              // Dynamically display month labels to prevent squeezing
                              const showMonthLabel = idx % labelSkipFrequency === 0 || idx === monthlyStats.length - 1;

                              return (
                                <g key={idx}>
                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r="6"
                                    fill="#8b5cf6"
                                    stroke="#ffffff"
                                    strokeWidth="3"
                                    className="chart-dot"
                                  />
                                  
                                  {showNumericDotLabel && (
                                    <text
                                      x={p.x}
                                      y={p.y - 12}
                                      fill="white"
                                      fontSize="9"
                                      fontWeight="800"
                                      textAnchor="middle"
                                    >
                                      {monthlyStats[idx].count.toLocaleString()}
                                    </text>
                                  )}

                                  {showMonthLabel && (
                                    <g>
                                      <line x1={p.x} y1="220" x2={p.x} y2="225" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                                      <text
                                        x={p.x}
                                        y="245"
                                        fill="var(--text-muted)"
                                        fontSize="10"
                                        fontWeight="700"
                                        textAnchor="middle"
                                      >
                                        {monthlyStats[idx].label}
                                      </text>
                                    </g>
                                  )}
                                </g>
                              );
                            })}
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
          {tableLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem 0' }}>
              <div className="spinner" style={{ width: '45px', height: '45px', borderWidth: '4px', borderTopColor: 'var(--primary)' }}></div>
            </div>
          ) : (
            <>
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
                  {tableData.length === 0 ? (
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
                          Clique em "Sincronizar SUS" no topo para puxar novos dados.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    tableData.map(item => (
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

              {/* PAGINATION CONTROLLER */}
              {totalPages > 1 && (
                <div className="pagination-footer" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  borderTop: '1px solid var(--glass-border)',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                    Exibindo <span style={{ color: 'var(--text-main)' }}>{(currentPage * pageSize) + 1}</span> - <span style={{ color: 'var(--text-main)' }}>{Math.min((currentPage + 1) * pageSize, totalElements)}</span> de <span style={{ color: 'var(--primary)' }}>{totalElements.toLocaleString()}</span> registros
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      style={{
                        background: currentPage === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        color: currentPage === 0 ? 'rgba(255, 255, 255, 0.2)' : 'white',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Anterior
                    </button>

                    {/* Page Numbers */}
                    {(() => {
                      const pages = [];
                      const startPage = Math.max(0, currentPage - 2);
                      const endPage = Math.min(totalPages - 1, startPage + 4);
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            style={{
                              background: currentPage === i ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                              border: currentPage === i ? 'none' : '1px solid var(--glass-border)',
                              color: 'white',
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              transition: 'all 0.2s ease',
                              boxShadow: currentPage === i ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none'
                            }}
                          >
                            {i + 1}
                          </button>
                        );
                      }
                      return pages;
                    })()}

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPage === totalPages - 1}
                      style={{
                        background: currentPage === totalPages - 1 ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        color: currentPage === totalPages - 1 ? 'rgba(255, 255, 255, 0.2)' : 'white',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
