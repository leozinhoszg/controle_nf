/**
 * ProfileBadge - Componente de badge para perfis de acesso
 *
 * Exibe badges estilizados para diferentes tipos de perfis:
 * - Admin: Gradiente dourado com icone de escudo
 * - Perfil normal: Gradiente azul/roxo com icone de usuario
 * - Sem perfil: Estilo neutro com aviso
 */

export default function ProfileBadge({
  perfil,
  size = 'md',
  showIcon = true,
  className = ''
}) {
  // Tamanhos
  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  };

  const iconSizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  // Se nao tem perfil
  if (!perfil) {
    return (
      <span
        className={`
          inline-flex items-center font-medium rounded-full
          bg-base-300/50 text-base-content/60 border border-base-300
          ${sizes[size]} ${className}
        `}
      >
        {showIcon && (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        Sem perfil
      </span>
    );
  }

  // Badge para Admin
  if (perfil.isAdmin) {
    return (
      <span
        className={`
          inline-flex items-center font-semibold rounded-full
          bg-gradient-to-r from-amber-500 to-orange-500 text-white
          shadow-sm shadow-amber-500/30
          ${sizes[size]} ${className}
        `}
      >
        {showIcon && (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )}
        {perfil.nome}
      </span>
    );
  }

  // Badge para perfil normal - cores baseadas em hash do nome
  const getColorScheme = (name) => {
    const schemes = [
      { bg: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/30' },
      { bg: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/30' },
      { bg: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/30' },
      { bg: 'from-indigo-500 to-violet-500', shadow: 'shadow-indigo-500/30' },
      { bg: 'from-rose-500 to-red-500', shadow: 'shadow-rose-500/30' },
      { bg: 'from-sky-500 to-blue-500', shadow: 'shadow-sky-500/30' },
    ];

    // Hash simples baseado no nome
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return schemes[Math.abs(hash) % schemes.length];
  };

  const colorScheme = getColorScheme(perfil.nome);

  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full
        bg-gradient-to-r ${colorScheme.bg} text-white
        shadow-sm ${colorScheme.shadow}
        ${sizes[size]} ${className}
      `}
    >
      {showIcon && (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )}
      {perfil.nome}
    </span>
  );
}

/**
 * ProfileBadgeSimple - Versao simplificada sem gradiente
 * Para uso em tabelas ou listas onde o gradiente pode ser muito chamativo
 */
export function ProfileBadgeSimple({
  perfil,
  size = 'sm',
  className = ''
}) {
  const sizes = {
    xs: 'badge-xs',
    sm: 'badge-sm',
    md: '',
    lg: 'badge-lg'
  };

  if (!perfil) {
    return (
      <span className={`badge badge-ghost ${sizes[size]} ${className}`}>
        Sem perfil
      </span>
    );
  }

  if (perfil.isAdmin) {
    return (
      <span className={`badge badge-warning gap-1 ${sizes[size]} ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        {perfil.nome}
      </span>
    );
  }

  return (
    <span className={`badge badge-primary badge-outline ${sizes[size]} ${className}`}>
      {perfil.nome}
    </span>
  );
}

/**
 * PermissionBadge - Badge para permissoes individuais
 */
export function PermissionBadge({ permissao, size = 'xs' }) {
  const permissaoLabels = {
    dashboard: { label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    fornecedores: { label: 'Fornecedores', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    contratos: { label: 'Contratos', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    relatorio: { label: 'Relatórios', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    usuarios: { label: 'Usuários', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    perfis: { label: 'Perfis', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
  };

  const info = permissaoLabels[permissao] || { label: permissao, icon: 'M13 10V3L4 14h7v7l9-11h-7z' };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1'
  };

  const iconSizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded bg-base-200 text-base-content/80 ${sizes[size]}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={info.icon} />
      </svg>
      {info.label}
    </span>
  );
}
