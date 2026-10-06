import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { defaultAdmins } from '../../data/initialData';
import { AdminUser } from '../../types';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  Mail, 
  BadgeCheck, 
  X, 
  AlertCircle, 
  Sparkles,
  Lock,
  Calendar
} from 'lucide-react';

interface AdminsTabProps {
  currentAdmin: string;
}

export const AdminsTab: React.FC<AdminsTabProps> = ({ currentAdmin }) => {
  const { data, addAdmin, updateAdmin, deleteAdmin, isUserOnline } = useData();

  const adminList = data.admins && data.admins.length > 0 ? data.admins : defaultAdmins;

  // Creation modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Administrador Geral');
  const [newEmail, setNewEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit modal state
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Auto format username when name changes
  const handleNameChange = (val: string) => {
    setNewName(val);
    if (!newUsername) {
      const parts = (val || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().split(/\s+/);
      if (parts.length >= 2) {
        setNewUsername(`${parts[0]}.${parts[parts.length - 1]}`);
      } else if (parts.length === 1 && parts[0]) {
        setNewUsername(parts[0]);
      }
    }
  };

  const handleGeneratePassword = () => {
    const cleanUser = (newUsername || 'admin').replace(/[^a-z0-9]/gi, '');
    const currentYear = new Date().getFullYear();
    setNewPassword(`@${cleanUser}${currentYear}`);
    setShowPassword(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const cleanUser = newUsername.trim().toLowerCase();
    if (!newName.trim()) {
      setAddError('Por favor, informe o nome completo do administrador.');
      return;
    }
    if (!cleanUser) {
      setAddError('Por favor, informe o login de acesso do administrador.');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 4) {
      setAddError('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    const success = addAdmin({
      name: newName.trim(),
      username: cleanUser,
      password: newPassword.trim(),
      role: newRole.trim() || 'Administrador Geral',
      email: newEmail.trim() || undefined
    });

    if (success) {
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewRole('Administrador Geral');
      setNewEmail('');
      setShowPassword(false);
      setIsAddModalOpen(false);
    }
  };

  const openEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditName(admin.name);
    setEditUsername(admin.username);
    setEditPassword(admin.password);
    setEditRole(admin.role || 'Administrador Geral');
    setEditEmail(admin.email || '');
    setShowEditPassword(false);
    setEditError(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setEditError(null);

    const cleanUser = editUsername.trim().toLowerCase();
    if (!editName.trim()) {
      setEditError('Por favor, informe o nome completo.');
      return;
    }
    if (!cleanUser) {
      setEditError('Por favor, informe o login de usuário.');
      return;
    }
    if (!editPassword.trim() || editPassword.length < 4) {
      setEditError('A senha deve conter pelo menos 4 caracteres.');
      return;
    }

    const success = updateAdmin({
      ...editingAdmin,
      name: editName.trim(),
      username: cleanUser,
      password: editPassword.trim(),
      role: editRole.trim() || 'Administrador Geral',
      email: editEmail.trim() || undefined
    });

    if (success) {
      setEditingAdmin(null);
    }
  };

  const handleDelete = (admin: AdminUser) => {
    if (adminList.length <= 1) {
      alert('Não é possível excluir o único administrador cadastrado no sistema.');
      return;
    }

    const isSelf = (admin.username || '').toLowerCase() === (currentAdmin || '').toLowerCase();
    const message = isSelf
      ? `Atenção: Você está prestes a excluir o seu próprio usuário ("${admin.name || admin.username}"). Tem certeza que deseja continuar?`
      : `Deseja realmente remover o administrador "${admin.name || admin.username}" (@${admin.username})?`;

    if (window.confirm(message)) {
      deleteAdmin(admin.entity_id);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-zinc-200 overflow-hidden animate-fade-in">
      {/* Header bar */}
      <div className="p-4 sm:p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/70">
        <div>
          <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#6f2ef7]" />
            <span>Gestão de Administradores</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Cadastre novos gestores, atualize senhas e conceda acessos administrativos à plataforma
          </p>
        </div>
        <button
          onClick={() => {
            setAddError(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6f2ef7] to-[#5914e6] hover:from-[#6524f0] hover:to-[#500dd8] shadow-md shadow-purple-600/25 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Administrador</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Quick summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6f2ef7] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-purple-900 uppercase tracking-wider">Total de Admins</p>
              <p className="text-lg font-extrabold text-zinc-900">{adminList.length}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider">Sua Sessão Ativa</p>
              <p className="text-sm font-bold text-zinc-900 truncate">@{currentAdmin}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider">Privilégio</p>
              <p className="text-sm font-bold text-zinc-900">Acesso Total ao Sistema</p>
            </div>
          </div>
        </div>

        {/* Admins Grid Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Administradores Cadastrados ({adminList.length})
            </h4>
            <span className="text-[11px] text-zinc-400">
              Todos os administradores podem gerenciar escolas, turmas, notas e novos acessos
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminList.map((admin) => {
              const isCurrent = (admin.username || '').toLowerCase() === (currentAdmin || '').toLowerCase();
              const initials = (admin.name || admin.username || 'AD')
                .split(' ')
                .slice(0, 2)
                .map(n => n[0])
                .join('')
                .toUpperCase() || 'AD';

              return (
                <div
                  key={admin.entity_id}
                  className={`p-4 rounded-2xl bg-white border transition-all flex flex-col justify-between shadow-xs ${
                    isCurrent 
                      ? 'border-[#6f2ef7] ring-2 ring-purple-500/10' 
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6f2ef7] to-[#5914e6] text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="font-bold text-sm text-zinc-900 leading-tight">
                              {admin.name}
                            </h5>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                Você
                              </span>
                            )}
                            {(isUserOnline(admin.username) || isUserOnline(admin.entity_id)) && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Online
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-[#6f2ef7] mt-0.5">
                            @{admin.username}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-600 mb-4 bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Cargo / Função:</span>
                        <span className="font-semibold text-zinc-800">{admin.role || 'Administrador'}</span>
                      </div>

                      {admin.email && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400">E-mail:</span>
                          <span className="text-zinc-700 truncate max-w-[150px]">{admin.email}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Senha:</span>
                        <span className="font-mono text-zinc-600">••••••••</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-300" />
                      {admin.created_at ? new Date(admin.created_at).toLocaleDateString('pt-BR') : 'Ativo'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(admin)}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-[#6f2ef7] hover:bg-purple-50 transition"
                        title="Editar Administrador / Redefinir Senha"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(admin)}
                        disabled={adminList.length <= 1}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition disabled:opacity-30 disabled:hover:bg-transparent"
                        title={adminList.length <= 1 ? 'Não é possível excluir o único administrador' : 'Remover Administrador'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & Access Notice */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">Segurança dos Acessos Administrativos</p>
            <p className="text-amber-800 leading-relaxed">
              Todos os administradores cadastrados possuem permissão para criar, editar e excluir registros pedagógicos, além de adicionar outros gestores. Certifique-se de fornecer senhas seguras e guardá-las em local seguro.
            </p>
          </div>
        </div>
      </div>

      {/* Modal 1: Create New Administrator */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-zinc-100 animate-scale-up relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6f2ef7] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-zinc-900">Novo Administrador</h4>
                <p className="text-xs text-zinc-500">Preencha os dados de login do novo gestor</p>
              </div>
            </div>

            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Maria Clara de Sousa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Login de Acesso / Usuário *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="ex: maria.sousa"
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900 transition"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Utilizado para acessar o sistema na tela de login.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                    Senha de Acesso *
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-semibold text-[#6f2ef7] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Gerar Senha</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="new-admin-password"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite uma senha segura"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Cargo / Função
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900 bg-white transition"
                >
                  <option value="Administrador Geral">Administrador Geral</option>
                  <option value="Coordenador Pedagógico">Coordenador Pedagógico</option>
                  <option value="Gestor Administrativo">Gestor Administrativo</option>
                  <option value="Diretor Escolar">Diretor Escolar</option>
                  <option value="Secretário Escolar">Secretário Escolar</option>
                  <option value="Suporte Técnico">Suporte Técnico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  E-mail Institucional (Opcional)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ex: maria.sousa@escola.ce.gov.br"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900 transition"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6f2ef7] to-[#5914e6] hover:from-[#6524f0] hover:to-[#500dd8] shadow-md shadow-purple-600/25 transition active:scale-95"
                >
                  Cadastrar Administrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Existing Administrator */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-zinc-100 animate-scale-up relative">
            <button
              onClick={() => setEditingAdmin(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6f2ef7] flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-zinc-900">Editar Administrador</h4>
                <p className="text-xs text-zinc-500">Atualize os dados e a senha de @{editingAdmin.username}</p>
              </div>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Login de Acesso / Usuário *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <input
                    id="edit-admin-password"
                    name="editPassword"
                    type={showEditPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Cargo / Função
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900 bg-white transition"
                >
                  <option value="Administrador Geral">Administrador Geral</option>
                  <option value="Coordenador Pedagógico">Coordenador Pedagógico</option>
                  <option value="Gestor Administrativo">Gestor Administrativo</option>
                  <option value="Diretor Escolar">Diretor Escolar</option>
                  <option value="Secretário Escolar">Secretário Escolar</option>
                  <option value="Suporte Técnico">Suporte Técnico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  E-mail Institucional (Opcional)
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900 transition"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6f2ef7] to-[#5914e6] hover:from-[#6524f0] hover:to-[#500dd8] shadow-md shadow-purple-600/25 transition active:scale-95"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
