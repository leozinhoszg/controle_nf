import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { relatorioAPI } from "../services/api";
import { getMonthKey, formatCurrency } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";

// Hook para contador animado
function useAnimatedCounter(target, duration = 800) {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return count;
}

// Saudacao baseada na hora
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

// Data formatada
function getFormattedDate() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Status class mapping
function getStatusBadgeClass(status) {
  const map = {
    atrasada: "status-atrasada",
    pendente: "status-pendente",
    ok: "status-ok",
    registrada: "status-registrada",
    nao_registrada: "status-nao-registrada",
    futuro: "status-futuro",
  };
  return map[status] || "status-pendente";
}

function getStatusLabel(status) {
  const map = {
    atrasada: "ATRASADA",
    pendente: "PENDENTE",
    ok: "OK",
    registrada: "REGISTRADA",
    nao_registrada: "NÃO REG.",
    futuro: "-",
  };
  return map[status] || status;
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const [stats, setStats] = useState({
    totalFornecedores: 0,
    totalContratos: 0,
    pendentes: 0,
    atrasadas: 0,
  });
  const [summary, setSummary] = useState({
    ok: 0,
    pendentes: 0,
    atrasadas: 0,
    total: 0,
  });
  const [atrasadas, setAtrasadas] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Contadores animados
  const animAtrasadas = useAnimatedCounter(stats.atrasadas);
  const animPendentes = useAnimatedCounter(stats.pendentes);
  const animFornecedores = useAnimatedCounter(stats.totalFornecedores);
  const animContratos = useAnimatedCounter(stats.totalContratos);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [resumoRes, tabelaRes] = await Promise.all([
        relatorioAPI.getResumo(),
        relatorioAPI.getTabela(),
      ]);

      const resumo = resumoRes.data || {};
      const tabela = tabelaRes.data || [];

      const mesAtual = getMonthKey();
      const hoje = new Date();
      const diaAtual = hoje.getDate();

      const medicoesAtrasadas = [];
      const medicoesPendentes = [];
      let okCount = 0;

      tabela.forEach((row) => {
        const statusSalvo = row.statusMensal?.[mesAtual];
        if (statusSalvo === "ok" || statusSalvo === "registrada") {
          okCount++;
          return;
        }

        const medicaoInfo = {
          fornecedorNome: row.fornecedor,
          contratoNumero: row.contrato,
          sequencia: row.sequencia,
          valor: row.valor,
          diaEmissao: row.diaEmissao,
        };

        if (diaAtual < row.diaEmissao) {
          medicoesPendentes.push({ ...medicaoInfo, status: "pendente" });
        } else {
          medicoesAtrasadas.push({ ...medicaoInfo, status: "atrasada" });
        }
      });

      const total = okCount + medicoesPendentes.length + medicoesAtrasadas.length;

      setStats({
        totalFornecedores: resumo.fornecedores || 0,
        totalContratos: resumo.contratos || 0,
        pendentes: resumo.pendentes || medicoesPendentes.length,
        atrasadas: resumo.atrasadas || medicoesAtrasadas.length,
      });

      setSummary({
        ok: okCount,
        pendentes: medicoesPendentes.length,
        atrasadas: medicoesAtrasadas.length,
        total,
      });

      setAtrasadas(medicoesAtrasadas.slice(0, 5));
      setPendentes(medicoesPendentes.slice(0, 5));
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ── Loading: Skeleton UI ──
  if (loading) {
    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Skeleton Header */}
        <div className="glass-card p-6">
          <div className="h-3 w-36 bg-base-300/50 rounded-full animate-pulse mb-3" />
          <div className="h-7 w-72 bg-base-300/50 rounded-full animate-pulse mb-2" />
          <div className="h-4 w-56 bg-base-300/50 rounded-full animate-pulse" />
        </div>

        {/* Skeleton Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card-glass p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 w-28 bg-base-300/50 rounded-full animate-pulse mb-3" />
                  <div className="h-9 w-14 bg-base-300/50 rounded-full animate-pulse mb-1" />
                  <div className="h-2.5 w-16 bg-base-300/50 rounded-full animate-pulse" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-base-300/30 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Summary Bar */}
        <div className="glass-card p-5">
          <div className="h-3 w-32 bg-base-300/50 rounded-full animate-pulse mb-4" />
          <div className="h-3 w-full bg-base-300/50 rounded-full animate-pulse mb-3" />
          <div className="flex gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 w-20 bg-base-300/50 rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        {/* Skeleton Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div className="h-5 w-44 bg-base-300/50 rounded-full animate-pulse mb-5" />
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex gap-4 mb-3">
                  <div className="h-4 w-32 bg-base-300/50 rounded-full animate-pulse" />
                  <div className="h-4 w-24 bg-base-300/50 rounded-full animate-pulse" />
                  <div className="h-4 w-12 bg-base-300/50 rounded-full animate-pulse" />
                  <div className="h-4 w-16 bg-base-300/50 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-8 text-center animate-fadeInUp max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-error/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-base-content/80 mb-2">
            Erro ao carregar dados
          </h3>
          <p className="text-sm text-base-content/50 mb-6">{error}</p>
          <button
            className="btn btn-primary btn-sm shadow-soft gap-2"
            onClick={loadDashboardData}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // ── Main Dashboard ──
  return (
    <div className="space-y-8">
      {/* ═══ Header com saudação ═══ */}
      <div
        className="glass-card p-6 relative overflow-hidden animate-fadeInUp"
        style={{ animationFillMode: "both" }}
      >
        {/* Orb decorativo */}
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-15 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(55% 0.2 255), transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(65% 0.18 200), transparent 70%)",
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-xs text-base-content/40 uppercase tracking-wider font-medium mb-1">
              {getFormattedDate()}
            </p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {getGreeting()},{" "}
              <span className="text-gradient">
                {usuario?.nome?.split(" ")[0] || "Usuário"}
              </span>
            </h1>
            <p className="text-base-content/50 text-sm mt-1">
              Visão geral do sistema de controle
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm shadow-soft gap-2 group"
            onClick={loadDashboardData}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Atualizar
          </button>
        </div>
      </div>

      {/* ═══ Cards de Estatísticas ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-animate">
        {/* Atrasadas */}
        <div className="stat-card-glass error group" aria-label={`Medições atrasadas: ${stats.atrasadas}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60 font-medium">
                Medições Atrasadas
              </p>
              <p className="text-3xl font-bold text-error mt-1">
                {animAtrasadas}
              </p>
              <p className="text-xs text-base-content/40 mt-0.5">neste mês</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-error"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Pendentes */}
        <div className="stat-card-glass warning group" aria-label={`Medições pendentes: ${stats.pendentes}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60 font-medium">
                Medições Pendentes
              </p>
              <p className="text-3xl font-bold text-warning mt-1">
                {animPendentes}
              </p>
              <p className="text-xs text-base-content/40 mt-0.5">neste mês</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Fornecedores */}
        <div className="stat-card-glass info group" aria-label={`Fornecedores: ${stats.totalFornecedores}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60 font-medium">
                Fornecedores
              </p>
              <p className="text-3xl font-bold text-info mt-1">
                {animFornecedores}
              </p>
              <p className="text-xs text-base-content/40 mt-0.5">cadastrados</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-info"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Contratos */}
        <div className="stat-card-glass success group" aria-label={`Contratos: ${stats.totalContratos}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/60 font-medium">
                Contratos
              </p>
              <p className="text-3xl font-bold text-success mt-1">
                {animContratos}
              </p>
              <p className="text-xs text-base-content/40 mt-0.5">ativos</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center icon-hover-float transition-transform group-hover:scale-110">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Barra de Resumo do Mês ═══ */}
      {summary.total > 0 && (
        <div
          className="glass-card p-5 animate-fadeInUp"
          style={{ animationDelay: "0.25s", animationFillMode: "both" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-base-content/70 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-base-content/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Resumo do Mês
            </h3>
            <span className="text-xs text-base-content/40">
              {summary.total} sequência{summary.total !== 1 ? "s" : ""} no total
            </span>
          </div>

          {/* Barra empilhada */}
          <div
            className="w-full h-3 rounded-full bg-base-300/40 overflow-hidden flex"
            role="progressbar"
            aria-valuenow={summary.ok}
            aria-valuemin={0}
            aria-valuemax={summary.total}
          >
            {summary.ok > 0 && (
              <div
                className="h-full bg-success transition-all duration-1000 ease-out rounded-l-full"
                style={{ width: `${(summary.ok / summary.total) * 100}%` }}
                title={`${summary.ok} em dia`}
              />
            )}
            {summary.pendentes > 0 && (
              <div
                className="h-full bg-warning transition-all duration-1000 ease-out"
                style={{
                  width: `${(summary.pendentes / summary.total) * 100}%`,
                }}
                title={`${summary.pendentes} pendentes`}
              />
            )}
            {summary.atrasadas > 0 && (
              <div
                className="h-full bg-error transition-all duration-1000 ease-out rounded-r-full"
                style={{
                  width: `${(summary.atrasadas / summary.total) * 100}%`,
                }}
                title={`${summary.atrasadas} atrasadas`}
              />
            )}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-xs text-base-content/60">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              <span>
                Em dia ({summary.ok})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-warning" />
              <span>
                Pendentes ({summary.pendentes})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-error" />
              <span>
                Atrasadas ({summary.atrasadas})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Listas de Medições ═══ */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeInUp"
        style={{ animationDelay: "0.35s", animationFillMode: "both" }}
      >
        {/* ── Medições Atrasadas ── */}
        <div className="glass-card glass-card-hover p-6 border-l-4 border-l-error">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Medições Atrasadas
            </h2>
            <Link
              to="/relatorio"
              className="btn btn-error btn-outline btn-xs gap-1 shadow-soft"
            >
              Ver todas
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {atrasadas.length === 0 ? (
            <div className="text-center py-10 animate-fadeIn">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-success/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-base-content/80">
                Tudo em dia!
              </h3>
              <p className="text-sm text-base-content/50 mt-1">
                Nenhuma medição atrasada neste mês
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm table-glass">
                <thead>
                  <tr className="text-base-content/50">
                    <th scope="col">Fornecedor</th>
                    <th scope="col">Contrato</th>
                    <th scope="col" className="text-center">Dia</th>
                    <th scope="col" className="text-right">Valor</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {atrasadas.map((m, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-base-200/30"
                      style={{
                        animation: "fadeInUp 0.3s ease forwards",
                        animationDelay: `${idx * 0.05}s`,
                        opacity: 0,
                      }}
                    >
                      <td className="font-medium">{m.fornecedorNome}</td>
                      <td className="text-base-content/70">
                        {m.contratoNumero}
                      </td>
                      <td className="text-center text-base-content/60">
                        {m.diaEmissao}
                      </td>
                      <td className="text-right text-sm text-base-content/70">
                        {formatCurrency(m.valor)}
                      </td>
                      <td>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getStatusBadgeClass(m.status)}`}
                        >
                          {getStatusLabel(m.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Medições Pendentes ── */}
        <div className="glass-card glass-card-hover p-6 border-l-4 border-l-warning">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Medições Pendentes
            </h2>
            <Link
              to="/relatorio"
              className="btn btn-warning btn-outline btn-xs gap-1 shadow-soft"
            >
              Ver todas
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {pendentes.length === 0 ? (
            <div className="text-center py-10 animate-fadeIn">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-info/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-info"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-base-content/80">
                Nenhuma medição pendente
              </h3>
              <p className="text-sm text-base-content/50 mt-1">
                Todas as medições foram processadas
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm table-glass">
                <thead>
                  <tr className="text-base-content/50">
                    <th scope="col">Fornecedor</th>
                    <th scope="col">Contrato</th>
                    <th scope="col" className="text-center">Dia</th>
                    <th scope="col" className="text-right">Valor</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendentes.map((m, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-base-200/30"
                      style={{
                        animation: "fadeInUp 0.3s ease forwards",
                        animationDelay: `${idx * 0.05}s`,
                        opacity: 0,
                      }}
                    >
                      <td className="font-medium">{m.fornecedorNome}</td>
                      <td className="text-base-content/70">
                        {m.contratoNumero}
                      </td>
                      <td className="text-center text-base-content/60">
                        {m.diaEmissao}
                      </td>
                      <td className="text-right text-sm text-base-content/70">
                        {formatCurrency(m.valor)}
                      </td>
                      <td>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getStatusBadgeClass(m.status)}`}
                        >
                          {getStatusLabel(m.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
