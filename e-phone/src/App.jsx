import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// DADOS MOCKADOS (Simulando um banco de dados)
// ======================================================================================

const initialUsers = [
    { id: 1, email: 'admin@ephone.com', password: '123', nome: 'Admin Geral', role: 'admin', setorIds: [] },
    { id: 2, email: 'financeiro@ephone.com', password: '123', nome: 'Joana Silva', role: 'financeiro', setorIds: [] },
    { id: 3, email: 'user@ephone.com', password: '123', nome: 'Carlos Souza', role: 'user', setorIds: [1] },
    { id: 4, email: 'multi@ephone.com', password: '123', nome: 'Ana Pereira', role: 'user', setorIds: [2, 3] },
];

const initialSetores = [
    { id: 1, nome: 'Escola Matriz', cnpj: '11.111.111/0001-11', cr: 'CR100' },
    { id: 2, nome: 'Unidade Centro', cnpj: '22.222.222/0001-22', cr: 'CR200' },
    { id: 3, nome: 'Unidade Norte', cnpj: '33.333.333/0001-33', cr: 'CR300' },
];

const initialRamais = [
    { id: 1, numero: '1001', local: 'Recepção', tipoRamal: 'Físico', email: '', responsavelSetor: 'Escola Matriz', status: 'Ativo', valorMensal: 50.00 },
    { id: 2, numero: '1002', local: '', tipoRamal: 'Softphone', email: 'carlos@escola.com', responsavelSetor: 'Escola Matriz', status: 'Ativo', valorMensal: 35.50 },
    { id: 3, numero: '2001', local: 'Secretaria', tipoRamal: 'Físico', email: '', responsavelSetor: 'Unidade Centro', status: 'Inativo', valorMensal: 50.00 },
    { id: 4, numero: '3001', local: 'Diretoria', tipoRamal: 'Físico', email: '', responsavelSetor: 'Unidade Norte', status: 'Ativo', valorMensal: 50.00 },
];

const initialChips = [
    { id: 1, numero: '(11) 98888-1111', operadora: 'Vivo', responsavelSetor: 'Escola Matriz', status: 'Ativo', valorMensal: 79.90 },
    { id: 2, numero: '(21) 98888-2222', operadora: 'Claro', responsavelSetor: 'Unidade Centro', status: 'Ativo', valorMensal: 65.00 },
    { id: 3, numero: '(31) 98888-3333', operadora: 'TIM', responsavelSetor: 'Unidade Norte', status: 'Bloqueado', valorMensal: 49.90 },
    { id: 4, numero: '(11) 98888-4444', operadora: 'Vivo', responsavelSetor: 'Unidade Norte', status: 'Ativo', valorMensal: 79.90 },
];

// COMPONENTES REUTILIZÁVEIS
// ======================================================================================

const Modal = ({ children, isOpen, onClose, title }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

const SearchInput = ({ value, onChange, placeholder }) => (
    <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
    />
);

const Card = ({ children, className = '' }) => (
    <div className={`card ${className}`}>
        {children}
    </div>
);


// COMPONENTES PRINCIPAIS POR PERFIL
// ======================================================================================

// --------------------------- ADMIN DASHBOARD ---------------------------
const AdminDashboard = ({ data, setData }) => {
    const [activeTab, setActiveTab] = useState('Ramais');
    const [modalState, setModalState] = useState({ isOpen: false, type: '', data: null });
    const [searchTerm, setSearchTerm] = useState('');

    const openModal = (type, data = null) => setModalState({ isOpen: true, type, data });
    const closeModal = () => setModalState({ isOpen: false, type: '', data: null });

    const handleSave = (item) => {
        const { type } = modalState;
        const collection = type.toLowerCase();
        
        if (item.id) { // Edição
            setData(prevData => ({
                ...prevData,
                [collection]: prevData[collection].map(i => i.id === item.id ? item : i)
            }));
        } else { // Adição
            setData(prevData => ({
                ...prevData,
                [collection]: [...prevData[collection], { ...item, id: Date.now() }]
            }));
        }
        closeModal();
    };
    
    const renderContent = () => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        switch (activeTab) {
            case 'Ramais':
                const filteredRamais = data.ramais.filter(r => r.numero.includes(lowerCaseSearch) || r.responsavelSetor.toLowerCase().includes(lowerCaseSearch));
                return <RamaisChipsTable type="Ramais" data={filteredRamais} onEdit={(item) => openModal('Ramais', item)} />;
            case 'Chips':
                const filteredChips = data.chips.filter(c => c.numero.includes(lowerCaseSearch) || c.responsavelSetor.toLowerCase().includes(lowerCaseSearch));
                return <RamaisChipsTable type="Chips" data={filteredChips} onEdit={(item) => openModal('Chips', item)} />;
            case 'Usuários':
                const filteredUsers = data.users.filter(u => u.nome.toLowerCase().includes(lowerCaseSearch) || u.email.toLowerCase().includes(lowerCaseSearch));
                return <UsersTable data={filteredUsers} onEdit={(item) => openModal('Usuários', item)} />;
            case 'Setores':
                 const filteredSetores = data.setores.filter(s => s.nome.toLowerCase().includes(lowerCaseSearch) || s.cnpj.includes(lowerCaseSearch));
                return <SetoresTable data={filteredSetores} onEdit={(item) => openModal('Setores', item)} />;
            case 'Configurações':
                return <ConfiguracoesTab data={data} setData={setData} />;
            default:
                return null;
        }
    };

    const getFormForModal = () => {
        switch (modalState.type) {
            case 'Ramais':
                return <RamalForm item={modalState.data} setores={data.setores} onSave={handleSave} onCancel={closeModal} />;
            case 'Chips':
                return <ChipForm item={modalState.data} setores={data.setores} onSave={handleSave} onCancel={closeModal} />;
            case 'Usuários':
                return <UserForm item={modalState.data} setores={data.setores} onSave={handleSave} onCancel={closeModal} />;
            case 'Setores':
                return <SetorForm item={modalState.data} onSave={handleSave} onCancel={closeModal} />;
            default:
                return null;
        }
    };

    const showSearchAndAdd = ['Ramais', 'Chips', 'Usuários', 'Setores'].includes(activeTab);

    return (
        <div>
            <div className="tabs">
                {['Ramais', 'Chips', 'Usuários', 'Setores', 'Configurações'].map(tab => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setSearchTerm(''); }} className={activeTab === tab ? 'active' : ''}>{tab}</button>
                ))}
            </div>
            
            {showSearchAndAdd && (
                <div className="toolbar">
                    <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={`Buscar em ${activeTab}...`} />
                    <button className="btn-primary" onClick={() => openModal(activeTab)}>Adicionar Novo</button>
                </div>
            )}
            
            <div className="content">
                {renderContent()}
            </div>

            <Modal isOpen={modalState.isOpen} onClose={closeModal} title={`${modalState.data ? 'Editar' : 'Adicionar'} ${modalState.type}`}>
                {getFormForModal()}
            </Modal>
        </div>
    );
};

const RamaisChipsTable = ({ type, data, onEdit }) => (
    <div className="table-container">
        <table>
            <thead>
                <tr>
                    <th>Número</th>
                    {type === 'Ramais' && <th>Tipo</th>}
                    {type === 'Chips' && <th>Operadora</th>}
                    <th>Setor Responsável</th>
                    <th>Status</th>
                    <th>Valor Mensal</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                {data.map(item => (
                    <tr key={item.id}>
                        <td>{item.numero}</td>
                        {type === 'Ramais' && <td>{item.tipoRamal}</td>}
                        {type === 'Chips' && <td>{item.operadora}</td>}
                        <td>{item.responsavelSetor}</td>
                        <td><span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span></td>
                        <td>{item.valorMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td><button className="btn-secondary" onClick={() => onEdit(item)}>Editar</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const UsersTable = ({ data, onEdit }) => (
    <div className="table-container">
        <table>
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Perfil</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                {data.map(user => (
                    <tr key={user.id}>
                        <td>{user.nome}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td className="actions-cell">
                            <button className="btn-secondary" onClick={() => onEdit(user)}>Editar</button>
                            <button className="btn-warning" onClick={() => alert(`Senha para ${user.nome} resetada para '123456'`)}>Resetar Senha</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const SetoresTable = ({ data, onEdit }) => (
    <div className="table-container">
        <table>
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>CNPJ</th>
                    <th>Centro de Resultado (CR)</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                {data.map(setor => (
                    <tr key={setor.id}>
                        <td>{setor.nome}</td>
                        <td>{setor.cnpj}</td>
                        <td>{setor.cr}</td>
                        <td><button className="btn-secondary" onClick={() => onEdit(setor)}>Editar</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const ConfiguracoesTab = ({ data, setData }) => {
    const [dia, setDia] = useState(data.configuracoes?.diaFechamento || 25);

    const handleSave = () => {
        setData(prev => ({...prev, configuracoes: { diaFechamento: dia }}));
        alert('Configurações salvas!');
    }

    return (
        <Card>
            <h3>Configurações Gerais</h3>
            <div className="form-group">
                <label>Dia de Fechamento das Faturas</label>
                <input type="number" min="1" max="31" value={dia} onChange={e => setDia(parseInt(e.target.value))} />
            </div>
            <button className="btn-primary" onClick={handleSave}>Salvar</button>
        </Card>
    );
};

// Forms for Modals
const RamalForm = ({ item, setores, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item || { numero: '', tipoRamal: 'Físico', local: '', email: '', responsavelSetor: '', status: 'Ativo', valorMensal: 0 });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
            <div className="form-group"><label>Número</label><input name="numero" value={formData.numero} onChange={handleChange} required /></div>
            <div className="form-group"><label>Tipo Ramal</label><select name="tipoRamal" value={formData.tipoRamal} onChange={handleChange}><option>Físico</option><option>Softphone</option></select></div>
            {formData.tipoRamal === 'Físico' && <div className="form-group"><label>Local</label><input name="local" value={formData.local} onChange={handleChange} /></div>}
            {formData.tipoRamal === 'Softphone' && <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>}
            <div className="form-group"><label>Setor Responsável</label><select name="responsavelSetor" value={formData.responsavelSetor} onChange={handleChange} required><option value="">Selecione...</option>{setores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}</select></div>
            <div className="form-group"><label>Status</label><select name="status" value={formData.status} onChange={handleChange}><option>Ativo</option><option>Inativo</option></select></div>
            <div className="form-group"><label>Valor Mensal</label><input type="number" step="0.01" name="valorMensal" value={formData.valorMensal} onChange={e => setFormData(p => ({...p, valorMensal: parseFloat(e.target.value)}))} /></div>
            <div className="form-actions"><button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button><button type="submit" className="btn-primary">Salvar</button></div>
        </form>
    );
};

const ChipForm = ({ item, setores, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item || { numero: '', operadora: '', responsavelSetor: '', status: 'Ativo', valorMensal: 0 });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
            <div className="form-group"><label>Número</label><input name="numero" value={formData.numero} onChange={handleChange} required /></div>
            <div className="form-group"><label>Operadora</label><input name="operadora" value={formData.operadora} onChange={handleChange} required /></div>
            <div className="form-group"><label>Setor Responsável</label><select name="responsavelSetor" value={formData.responsavelSetor} onChange={handleChange} required><option value="">Selecione...</option>{setores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}</select></div>
            <div className="form-group"><label>Status</label><select name="status" value={formData.status} onChange={handleChange}><option>Ativo</option><option>Bloqueado</option><option>Cancelado</option></select></div>
            <div className="form-group"><label>Valor Mensal</label><input type="number" step="0.01" name="valorMensal" value={formData.valorMensal} onChange={e => setFormData(p => ({...p, valorMensal: parseFloat(e.target.value)}))} /></div>
            <div className="form-actions"><button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button><button type="submit" className="btn-primary">Salvar</button></div>
        </form>
    );
};

const UserForm = ({ item, setores, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item || { nome: '', email: '', password: '', role: 'user', setorIds: [] });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSetorChange = (e) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setFormData(prev => ({ ...prev, setorIds: selectedIds }));
    }
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
            <div className="form-group"><label>Nome</label><input name="nome" value={formData.nome} onChange={handleChange} required /></div>
            <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
            <div className="form-group"><label>Senha</label><input type="password" name="password" placeholder={item ? "Deixe em branco para não alterar" : ""} onChange={handleChange} /></div>
            <div className="form-group"><label>Perfil</label><select name="role" value={formData.role} onChange={handleChange}><option value="user">Usuário</option><option value="financeiro">Financeiro</option><option value="admin">Administrador</option></select></div>
            {formData.role === 'user' && (
                <div className="form-group">
                    <label>Setores Associados</label>
                    <select multiple name="setorIds" value={formData.setorIds} onChange={handleSetorChange} style={{ height: '120px' }}>
                        {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                </div>
            )}
            <div className="form-actions"><button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button><button type="submit" className="btn-primary">Salvar</button></div>
        </form>
    );
};

const SetorForm = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item || { nome: '', cnpj: '', cr: '' });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
            <div className="form-group"><label>Nome</label><input name="nome" value={formData.nome} onChange={handleChange} required /></div>
            <div className="form-group"><label>CNPJ</label><input name="cnpj" value={formData.cnpj} onChange={handleChange} required /></div>
            <div className="form-group"><label>Centro de Resultado (CR)</label><input name="cr" value={formData.cr} onChange={handleChange} required /></div>
            <div className="form-actions"><button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button><button type="submit" className="btn-primary">Salvar</button></div>
        </form>
    );
};


// --------------------------- FINANCEIRO DASHBOARD ---------------------------
const FinanceiroDashboard = ({ data }) => {
    const [activeTab, setActiveTab] = useState('Resumo de Faturas');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    const [detailedView, setDetailedView] = useState({ setor: null, month: null, year: null });

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value) }));
    };

    const { totalAprovado, totalPendente, chartData } = useMemo(() => {
        let aprovado = 0;
        let pendente = 0;
        const custosPorSetor = {};

        data.setores.forEach(setor => {
            const faturaAprovada = data.faturas.find(f => f.setorId === setor.id && f.month === filters.month && f.year === filters.year);
            const ramaisDoSetor = data.ramais.filter(r => r.responsavelSetor === setor.nome && r.status === 'Ativo');
            const chipsDoSetor = data.chips.filter(c => c.responsavelSetor === setor.nome && c.status === 'Ativo');
            const custoTotalSetor = [...ramaisDoSetor, ...chipsDoSetor].reduce((acc, item) => acc + item.valorMensal, 0);

            if (faturaAprovada) {
                aprovado += faturaAprovada.total;
                custosPorSetor[setor.nome] = faturaAprovada.total;
            } else {
                pendente += custoTotalSetor;
                custosPorSetor[setor.nome] = 0; // Ou pode ser o valor pendente, depende da regra
            }
        });

        const chartData = Object.entries(custosPorSetor).map(([name, total]) => ({ name, total }));

        return { totalAprovado: aprovado, totalPendente: pendente, chartData };
    }, [filters, data]);
    
    const renderContent = () => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        switch (activeTab) {
            case 'Consulta de Ramais':
                const filteredRamais = data.ramais.filter(r => r.numero.includes(lowerCaseSearch) || r.responsavelSetor.toLowerCase().includes(lowerCaseSearch));
                return <RamaisChipsTable type="Ramais" data={filteredRamais} onEdit={() => {}} />;
            case 'Consulta de Chips':
                const filteredChips = data.chips.filter(c => c.numero.includes(lowerCaseSearch) || c.responsavelSetor.toLowerCase().includes(lowerCaseSearch));
                return <RamaisChipsTable type="Chips" data={filteredChips} onEdit={() => {}} />;
            case 'Resumo de Faturas':
                return (
                    <div>
                        <Card className="filter-card">
                            <div className="form-group"><label>Mês:</label><input type="number" name="month" value={filters.month} onChange={handleFilterChange} min="1" max="12" /></div>
                            <div className="form-group"><label>Ano:</label><input type="number" name="year" value={filters.year} onChange={handleFilterChange} min="2020" /></div>
                        </Card>
                        <div className="summary-cards">
                            <Card><p>Total Aprovado</p><h3>{totalAprovado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></Card>
                            <Card><p>Total Pendente</p><h3>{totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></Card>
                        </div>
                        <Card>
                            <h3>Custos por Setor (Aprovados)</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(value) => `R$${value}`} />
                                    <Tooltip formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                    <Legend />
                                    <Bar dataKey="total" fill="#4a90e2" name="Total Aprovado" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                        <ConsultaDetalhada data={data} setDetailedView={setDetailedView} detailedView={detailedView} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div>
            <div className="tabs">
                {['Resumo de Faturas', 'Consulta de Ramais', 'Consulta de Chips'].map(tab => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setSearchTerm(''); }} className={activeTab === tab ? 'active' : ''}>{tab}</button>
                ))}
            </div>
            
            {activeTab !== 'Resumo de Faturas' && (
                <div className="toolbar">
                    <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={`Buscar em ${activeTab}...`} />
                </div>
            )}
            
            <div className="content">
                {renderContent()}
            </div>
        </div>
    );
};

const ConsultaDetalhada = ({ data, setDetailedView, detailedView }) => {
    const faturasAprovadas = data.faturas.filter(f => f.status === 'Aprovado');
    const setoresComFaturas = [...new Set(faturasAprovadas.map(f => f.setorId))].map(id => data.setores.find(s => s.id === id));
    
    const mesesDisponiveis = detailedView.setor ? 
        faturasAprovadas.filter(f => f.setorId === detailedView.setor.id).map(f => `${f.month}/${f.year}`) : [];

    const handleSetorChange = (e) => {
        const setorId = parseInt(e.target.value);
        const setor = data.setores.find(s => s.id === setorId);
        setDetailedView({ setor, month: null, year: null });
    };

    const handleMesChange = (e) => {
        const [month, year] = e.target.value.split('/').map(Number);
        setDetailedView(prev => ({ ...prev, month, year }));
    };

    const itensDaFatura = useMemo(() => {
        if (!detailedView.setor || !detailedView.month || !detailedView.year) return [];
        
        // Simulação: pegando os ativos daquele setor no momento da consulta.
        // Numa aplicação real, os itens seriam salvos com a fatura.
        const ramais = data.ramais.filter(r => r.responsavelSetor === detailedView.setor.nome && r.status === 'Ativo');
        const chips = data.chips.filter(c => c.responsavelSetor === detailedView.setor.nome && c.status === 'Ativo');
        return [...ramais.map(r => ({...r, tipo: 'Ramal'})), ...chips.map(c => ({...c, tipo: 'Chip'}))];
    }, [detailedView, data]);


    return (
        <Card>
            <h3>Consulta Detalhada de Fatura Aprovada</h3>
            <div className="detailed-view-filters">
                <div className="form-group">
                    <label>Selecione o Setor:</label>
                    <select onChange={handleSetorChange} value={detailedView.setor?.id || ''}>
                        <option value="">Selecione...</option>
                        {setoresComFaturas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                </div>
                {detailedView.setor && (
                    <div className="form-group">
                        <label>Selecione o Mês/Ano:</label>
                        <select onChange={handleMesChange} value={detailedView.month ? `${detailedView.month}/${detailedView.year}`: ''}>
                             <option value="">Selecione...</option>
                            {mesesDisponiveis.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {itensDaFatura.length > 0 && (
                <div className="table-container">
                    <h4>Itens da Fatura de {detailedView.setor.nome} - {detailedView.month}/{detailedView.year}</h4>
                    <table>
                        <thead>
                            <tr><th>Tipo</th><th>Número</th><th>Valor</th></tr>
                        </thead>
                        <tbody>
                            {itensDaFatura.map(item => (
                                <tr key={`${item.tipo}-${item.id}`}>
                                    <td>{item.tipo}</td>
                                    <td>{item.numero}</td>
                                    <td>{item.valorMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
};


// --------------------------- USER DASHBOARD ---------------------------
const UserDashboard = ({ currentUser, data, setData }) => {
    const userSetores = useMemo(() => data.setores.filter(s => currentUser.setorIds.includes(s.id)), [currentUser, data.setores]);
    const [activeTab, setActiveTab] = useState(userSetores[0]?.id || null);

    if (userSetores.length === 0) {
        return <p>Você não está associado a nenhum setor.</p>;
    }

    return (
        <div>
            <div className="tabs">
                {userSetores.map(setor => (
                    <button key={setor.id} onClick={() => setActiveTab(setor.id)} className={activeTab === setor.id ? 'active' : ''}>
                        {setor.nome}
                    </button>
                ))}
            </div>
            <div className="content">
                {activeTab && <SetorView setor={userSetores.find(s => s.id === activeTab)} data={data} setData={setData} />}
            </div>
        </div>
    );
};

const SetorView = ({ setor, data, setData }) => {
    const [searchRamais, setSearchRamais] = useState('');
    const [searchChips, setSearchChips] = useState('');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const faturaAtual = useMemo(() => {
        return data.faturas.find(f => f.setorId === setor.id && f.month === currentMonth && f.year === currentYear);
    }, [data.faturas, setor.id, currentMonth, currentYear]);

    const meusRamais = useMemo(() => {
        return data.ramais.filter(r => r.responsavelSetor === setor.nome && r.numero.includes(searchRamais));
    }, [data.ramais, setor.nome, searchRamais]);

    const meusChips = useMemo(() => {
        return data.chips.filter(c => c.responsavelSetor === setor.nome && c.numero.includes(searchChips));
    }, [data.chips, setor.nome, searchChips]);
    
    const valorFaturaAtual = useMemo(() => {
         const ramaisAtivos = data.ramais.filter(r => r.responsavelSetor === setor.nome && r.status === 'Ativo');
         const chipsAtivos = data.chips.filter(c => c.responsavelSetor === setor.nome && c.status === 'Ativo');
         return [...ramaisAtivos, ...chipsAtivos].reduce((acc, item) => acc + item.valorMensal, 0);
    }, [data, setor.nome]);

    const handleAprovar = () => {
        if (window.confirm(`Deseja aprovar a fatura de ${setor.nome} no valor de ${valorFaturaAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}?`)) {
            const novaFatura = {
                id: Date.now(),
                setorId: setor.id,
                month: currentMonth,
                year: currentYear,
                total: valorFaturaAtual,
                status: 'Aprovado'
            };
            setData(prev => ({ ...prev, faturas: [...prev.faturas, novaFatura] }));
            alert('Fatura aprovada com sucesso!');
        }
    };
    
    const historicoFaturas = data.faturas.filter(f => f.setorId === setor.id).sort((a,b) => new Date(b.year, b.month) - new Date(a.year, a.month));

    return (
        <div className="setor-view-grid">
            <div className="resumo-fatura">
                <Card>
                    <h3>Fatura Atual ({`${currentMonth}/${currentYear}`})</h3>
                    <p className="fatura-valor">{valorFaturaAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    {faturaAtual ? (
                        <p className="status-aprovado">Fatura Aprovada!</p>
                    ) : (
                        <button className="btn-primary" onClick={handleAprovar}>Aprovar Fatura</button>
                    )}
                </Card>
                <Card>
                    <h3>Histórico de Faturas</h3>
                    <ul className="historico-list">
                        {historicoFaturas.length > 0 ? historicoFaturas.map(f => (
                            <li key={f.id}>
                                <span>{f.month}/{f.year}</span>
                                <span>{f.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </li>
                        )) : <p>Nenhuma fatura aprovada.</p>}
                    </ul>
                </Card>
            </div>
            <div className="lista-ativos">
                <Card>
                    <div className="toolbar">
                        <h3>Meus Ramais</h3>
                        <SearchInput value={searchRamais} onChange={setSearchRamais} placeholder="Buscar ramal..." />
                    </div>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Número</th><th>Tipo</th><th>Status</th><th>Valor</th></tr></thead>
                            <tbody>
                                {meusRamais.map(r => <tr key={r.id}><td>{r.numero}</td><td>{r.tipoRamal}</td><td><span className={`status-badge status-${r.status.toLowerCase()}`}>{r.status}</span></td><td>{r.valorMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card>
                    <div className="toolbar">
                        <h3>Meus Chips</h3>
                        <SearchInput value={searchChips} onChange={setSearchChips} placeholder="Buscar chip..." />
                    </div>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Número</th><th>Operadora</th><th>Status</th><th>Valor</th></tr></thead>
                            <tbody>
                                {meusChips.map(c => <tr key={c.id}><td>{c.numero}</td><td>{c.operadora}</td><td><span className={`status-badge status-${c.status.toLowerCase()}`}>{c.status}</span></td><td>{c.valorMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};


// TELA DE LOGIN
// ======================================================================================
const LoginPage = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const success = onLogin(email, password);
        if (!success) {
            setError('Email ou senha inválidos.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>E-Phone</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Senha</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="btn-primary login-button">Entrar</button>
                </form>
            </div>
        </div>
    );
};


// COMPONENTE PRINCIPAL APP
// ======================================================================================
export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [data, setData] = useState({
        users: initialUsers,
        setores: initialSetores,
        ramais: initialRamais,
        chips: initialChips,
        faturas: [],
        configuracoes: { diaFechamento: 25 }
    });

    const handleLogin = (email, password) => {
        const user = data.users.find(u => u.email === email && u.password === password);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    const renderDashboard = () => {
        if (!currentUser) return null;
        switch (currentUser.role) {
            case 'admin':
                return <AdminDashboard data={data} setData={setData} />;
            case 'financeiro':
                return <FinanceiroDashboard data={data} />;
            case 'user':
                return <UserDashboard currentUser={currentUser} data={data} setData={setData} />;
            default:
                return <p>Perfil de usuário desconhecido.</p>;
        }
    };

    return (
        <>
            <style>{`
                :root {
                    --primary-color: #4a90e2;
                    --secondary-color: #f5a623;
                    --background-color: #f4f7f6;
                    --surface-color: #ffffff;
                    --text-color: #4a4a4a;
                    --border-color: #e0e0e0;
                    --success-color: #7ed321;
                    --danger-color: #d0021b;
                    --warning-color: #f8e71c;
                    --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                }
                body { margin: 0; font-family: var(--font-family); background-color: var(--background-color); color: var(--text-color); }
                .app-container { display: flex; flex-direction: column; min-height: 100vh; }
                
                /* Login Page */
                .login-container { display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                .login-box { background: var(--surface-color); padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; width: 100%; max-width: 400px; }
                .login-box h1 { color: var(--primary-color); margin-bottom: 2rem; }
                .login-button { width: 100%; margin-top: 1rem; }
                .error-message { color: var(--danger-color); font-size: 0.9em; margin-top: 1rem; }

                /* Layout */
                .header { background-color: var(--surface-color); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .header h1 { color: var(--primary-color); margin: 0; font-size: 1.5rem; }
                .header-user-info { display: flex; align-items: center; gap: 1.5rem; }
                .header-user-info span { font-size: 0.9em; }
                .header-user-info .user-role { background-color: #e7f3ff; color: var(--primary-color); padding: 0.2rem 0.6rem; border-radius: 12px; font-weight: 500; }
                .main-content { padding: 2rem; flex-grow: 1; }
                
                /* Tabs */
                .tabs { border-bottom: 1px solid var(--border-color); margin-bottom: 1.5rem; }
                .tabs button { background: none; border: none; padding: 1rem 1.5rem; cursor: pointer; font-size: 1rem; color: #9b9b9b; border-bottom: 3px solid transparent; transition: all 0.2s ease; }
                .tabs button.active { color: var(--primary-color); border-bottom-color: var(--primary-color); font-weight: 600; }
                
                /* Toolbar */
                .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .search-input { padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; width: 300px; font-size: 1rem; }
                
                /* Buttons */
                .btn-primary { background-color: var(--primary-color); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background-color 0.2s; }
                .btn-primary:hover { background-color: #357ABD; }
                .btn-secondary { background-color: #e0e0e0; color: var(--text-color); border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: background-color 0.2s; }
                .btn-secondary:hover { background-color: #c7c7c7; }
                .btn-warning { background-color: var(--secondary-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: background-color 0.2s; }
                
                /* Card */
                .card { background-color: var(--surface-color); padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 1.5rem; }
                
                /* Table */
                .table-container { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border-color); }
                th { color: #9b9b9b; font-weight: 500; font-size: 0.9em; text-transform: uppercase; }
                tbody tr:hover { background-color: #fafafa; }
                .actions-cell { display: flex; gap: 0.5rem; }
                
                /* Status Badge */
                .status-badge { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.8em; font-weight: 600; }
                .status-ativo { background-color: #e4f8d3; color: #5d9a1c; }
                .status-inativo, .status-bloqueado { background-color: #ffebe9; color: var(--danger-color); }

                /* Modal */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
                .modal-content { background-color: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem; }
                .close-button { background: none; border: none; font-size: 2rem; cursor: pointer; }
                
                /* Forms */
                .form-group { margin-bottom: 1.5rem; }
                .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
                .form-group input, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; box-sizing: border-box; font-size: 1rem; }
                .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }

                /* Financeiro Dashboard */
                .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
                .summary-cards h3 { margin: 0; font-size: 2rem; }
                .summary-cards p { margin: 0 0 0.5rem 0; color: #9b9b9b; }
                .filter-card { display: flex; gap: 1.5rem; align-items: center; }
                .detailed-view-filters { display: flex; gap: 1rem; margin-bottom: 1rem; }

                /* User Dashboard */
                .setor-view-grid { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; }
                .fatura-valor { font-size: 2.5rem; font-weight: bold; color: var(--primary-color); margin: 1rem 0; }
                .status-aprovado { color: var(--success-color); font-weight: bold; }
                .historico-list { list-style: none; padding: 0; margin: 0; }
                .historico-list li { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); }
                .historico-list li:last-child { border-bottom: none; }
                
                @media (max-width: 768px) {
                    .header { flex-direction: column; gap: 1rem; }
                    .main-content { padding: 1rem; }
                    .toolbar { flex-direction: column; gap: 1rem; align-items: stretch; }
                    .search-input { width: 100%; box-sizing: border-box; }
                    .setor-view-grid { grid-template-columns: 1fr; }
                    .actions-cell { flex-direction: column; }
                }
            `}</style>
            <div className="app-container">
                {!currentUser ? (
                    <LoginPage onLogin={handleLogin} />
                ) : (
                    <>
                        <header className="header">
                            <h1>E-Phone</h1>
                            <div className="header-user-info">
                                <span>Olá, <strong>{currentUser.nome}</strong></span>
                                <span className="user-role">{currentUser.role}</span>
                                <button className="btn-secondary" onClick={handleLogout}>Logout</button>
                            </div>
                        </header>
                        <main className="main-content">
                            {renderDashboard()}
                        </main>
                    </>
                )}
            </div>
        </>
    );
}
