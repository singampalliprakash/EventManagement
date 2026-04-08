import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contactService } from '../services/services';
import { useToast } from '../utils/helpers';
import { Contacts } from '@capacitor-community/contacts';
import { Capacitor } from '@capacitor/core';

export default function ManageContacts() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', group_label: 'General' });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState(null); // 'phone' | 'csv' | 'bulk'
  const [pendingContacts, setPendingContacts] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadContacts(); }, []);

  const loadContacts = async () => {
    try {
      const res = await contactService.getAll();
      setContacts(res.data.contacts);
    } catch { showToast('Failed to load contacts', 'error'); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone) { showToast('Name and phone are required', 'error'); return; }
    try {
      if (editId) {
        await contactService.update(editId, form);
        showToast('Contact updated!');
      } else {
        await contactService.create(form);
        showToast('Contact added! 👤');
      }
      setForm({ name: '', phone: '', email: '', group_label: 'General' });
      setShowForm(false);
      setEditId(null);
      loadContacts();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handlePhoneImport = async () => {
    if (!Capacitor.isNativePlatform()) {
      showToast('Phone contacts are only available in the real mobile app! Please use CSV or Add manually here.', 'info');
      return;
    }

    setImportLoading(true);
    try {
      // 1. Explicitly check and request permission
      const permResult = await Contacts.requestPermissions();
      if (permResult.contacts !== 'granted') {
        showToast('Contact permission is required to import from your phone.', 'warning');
        return;
      }

      // 2. Fetch all contacts (this is the multi-select way)
      const res = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
          emails: true,
        }
      });
      
      const raw = res.contacts || [];
      
      if (raw.length === 0) {
        showToast('No contacts found on this phone.', 'warning');
        return;
      }

      // 3. Format into our review list (cleaning up phone numbers)
      const formatted = raw.map(c => ({
        name: c.name?.display || 'Unknown',
        phone: c.phones?.[0]?.number?.replace(/[^0-9+]/g, '') || '',
        email: c.emails?.[0]?.address || '',
        group_label: 'General',
        selected: false
      })).filter(c => c.phone.length > 5); // Filter out junk/blank numbers

      if (formatted.length === 0) {
        showToast('No valid phone numbers found in your contact list.', 'error');
        return;
      }

      // 4. Open the Bulk Selector Modal
      setPendingContacts(formatted);
      setImportType('bulk');
      setShowImportModal(true);
      setSearchTerm('');
      
    } catch (err) {
      console.error('Contact import error:', err);
      showToast('Native import failed. Please try CSV upload.', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const handleBulkImport = async () => {
    const selected = pendingContacts.filter(c => c.selected);
    if (selected.length === 0) {
      showToast('No contacts selected! Check some boxes first 👤', 'warning');
      return;
    }

    setImportLoading(true);
    try {
      const res = await contactService.bulkCreate(selected.map(c => ({
        name: c.name,
        phone: c.phone,
        email: c.email,
        group_label: c.group_label
      })));
      
      showToast(res.data?.message || `${selected.length} contacts imported! 🚀`);
      setShowImportModal(false);
      setPendingContacts([]);
      setSearchTerm('');
      loadContacts();
    } catch (err) {
      console.error('Bulk Import Error:', err);
      showToast(err.response?.data?.error || 'Failed to import bulk contacts', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const toggleSelectAll = (val) => {
    const filtered = getFilteredContacts();
    const filteredIds = filtered.map(f => f.phone + f.name);
    setPendingContacts(prev => prev.map(c => {
      if (filteredIds.includes(c.phone + c.name)) {
        return { ...c, selected: val };
      }
      return c;
    }));
  };

  const toggleOne = (contact) => {
    setPendingContacts(prev => prev.map(c => {
      if (c.phone === contact.phone && c.name === contact.name) {
        return { ...c, selected: !c.selected };
      }
      return c;
    }));
  };

  const getFilteredContacts = () => {
    if (!searchTerm) return pendingContacts.slice(0, 150); 
    const lower = searchTerm.toLowerCase();
    return pendingContacts.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      c.phone.includes(searchTerm)
    ).slice(0, 150);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const results = [];
      
      // Simple CSV Parse (Name, Phone, Email)
      lines.forEach((line, index) => {
        if (index === 0 && line.toLowerCase().includes('name')) return; // Skip header
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          results.push({
            name: parts[0],
            phone: parts[1].replace(/[^0-9]/g, ''),
            email: parts[2] || '',
            group_label: 'General',
            selected: true
          });
        }
      });

      if (results.length > 0) {
        setPendingContacts(results);
        setImportType('review');
      } else {
        showToast('No valid contacts found in file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const submitImport = async () => {
    const toImport = pendingContacts.filter(c => c.selected);
    if (toImport.length === 0) { showToast('No contacts selected', 'error'); return; }

    setImportLoading(true);
    try {
      const res = await contactService.bulkCreate(toImport);
      showToast(res.data.message);
      setShowImportModal(false);
      setPendingContacts([]);
      setImportType(null);
      loadContacts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Bulk import failed', 'error');
    }
    setImportLoading(false);
  };

  const editContact = (contact) => {
    setForm({ name: contact.name, phone: contact.phone, email: contact.email || '', group_label: contact.group_label || 'General' });
    setEditId(contact.id);
    setShowForm(true);
  };

  const deleteContact = async (contactId) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await contactService.delete(contactId);
      showToast('Contact deleted');
      loadContacts();
    } catch { showToast('Failed to delete', 'error'); }
  };

  // Group contacts by label
  const grouped = contacts.reduce((acc, c) => {
    const label = c.group_label || 'General';
    if (!acc[label]) acc[label] = [];
    acc[label].push(c);
    return acc;
  }, {});

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <ToastContainer />

      <div className="flex items-center justify-between mb-lg">
        <h1>Contacts</h1>
        <div className="flex gap-xs">
          <button onClick={() => setShowImportModal(true)} className="btn btn-secondary btn-sm" id="import-contacts-btn">
            📥 Import
          </button>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', phone: '', email: '', group_label: 'General' }); }} className="btn btn-primary btn-sm" id="add-contact-btn">
            + Add
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card mb-md" style={{ padding: 'var(--space-md)' }}>
          <h4 style={{ marginBottom: 'var(--space-md)' }}>{editId ? 'Edit Contact' : 'Add Contact'}</h4>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" placeholder="Contact name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone * (with country code)</label>
            <input className="form-input" placeholder="919876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Group</label>
            <select className="form-input" value={form.group_label} onChange={(e) => setForm({ ...form, group_label: e.target.value })}>
              <option value="General">General</option>
              <option value="Family">Family</option>
              <option value="Friends">Friends</option>
              <option value="Colleagues">Colleagues</option>
              <option value="Neighbors">Neighbors</option>
            </select>
          </div>
          <div className="flex gap-sm">
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button onClick={handleSubmit} className="btn btn-primary" style={{ flex: 1 }}>{editId ? 'Update' : 'Add Contact'}</button>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => !importLoading && setShowImportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ minHeight: '60vh', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-md)', paddingBottom: 'var(--space-md)' }}>
              <div className="flex justify-between items-center" style={{ width: '100%' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>
                  {(!importType) ? 'Import Contacts' : (importType === 'bulk' || importType === 'review' ? 'Select Contacts' : 'Importing...')}
                </h3>
                <button 
                  onClick={() => { setShowImportModal(false); setPendingContacts([]); setImportType(null); }} 
                  className="modal-close" 
                  style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ×
                </button>
              </div>
              
              {(importType === 'bulk' || importType === 'review') && (
                <div style={{ width: '100%', marginTop: '4px' }}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="🔍 Search name or number..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ borderRadius: '16px', padding: '14px 20px', background: 'rgba(255,255,255,0.03)' }}
                    />
                  </div>
                  <div className="flex justify-between items-center" style={{ padding: '0 4px' }}>
                    <label className="flex items-center gap-sm cursor-pointer" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <input 
                        type="checkbox" 
                        onChange={(e) => toggleSelectAll(e.target.checked)} 
                        style={{ width: '18px', height: '18px' }}
                      />
                      Select All ({getFilteredContacts().length})
                    </label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                      {pendingContacts.filter(c => c.selected).length} Selected
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
              {!importType ? (
                <div className="flex flex-col gap-md" style={{ paddingTop: 'var(--space-sm)' }}>
                  <button onClick={handlePhoneImport} className="btn btn-primary btn-lg flex items-center justify-center gap-sm" disabled={importLoading} style={{ padding: '24px', fontSize: '1.1rem', borderRadius: '24px', boxShadow: '0 8px 24px rgba(65, 105, 225, 0.3)' }}>
                    {importLoading ? <span className="spinner"></span> : '📱 Select from Phone'}
                  </button>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', margin: 'var(--space-md) 0' }}>— OR —</div>
                  <label className="btn btn-secondary btn-lg flex items-center justify-center gap-sm cursor-pointer" style={{ width: '100%', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                    📄 Upload CSV File
                    <input type="file" accept=".csv" hidden onChange={handleCsvUpload} />
                  </label>
                </div>
              ) : importType === 'bulk' || importType === 'review' ? (
                <div className="flex flex-col gap-sm" style={{ paddingBottom: '20px' }}>
                  {getFilteredContacts().map((contact, idx) => (
                    <div 
                      key={idx} 
                      className="card" 
                      onClick={() => toggleOne(contact)}
                      style={{ 
                        padding: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px', 
                        cursor: 'pointer',
                        background: contact.selected ? 'rgba(65, 105, 225, 0.12)' : 'rgba(255,255,255,0.02)',
                        border: contact.selected ? '1px solid var(--primary-light)' : '1px solid transparent',
                        transform: contact.selected ? 'scale(1.01)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                        borderRadius: '16px'
                      }}
                    >
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        border: `2px solid ${contact.selected ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
                        background: contact.selected ? 'var(--primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '0.8rem',
                      }}>
                        {contact.selected && '✓'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{contact.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{contact.phone}</div>
                      </div>
                    </div>
                  ))}
                  {getFilteredContacts().length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      No contacts found matching "{searchTerm}"
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {(importType === 'bulk' || importType === 'review') && (
              <div style={{ padding: 'var(--space-md)', background: 'var(--bg-card)', borderTop: '1px solid var(--border-glass-light)', zIndex: 100 }}>
                <button 
                  onClick={handleBulkImport} 
                  className="btn btn-primary btn-block btn-lg" 
                  disabled={importLoading || pendingContacts.filter(c => c.selected).length === 0}
                  style={{ boxShadow: '0 8px 32px rgba(65, 105, 225, 0.4)', borderRadius: '20px', padding: '18px' }}
                >
                  {importLoading ? <span className="spinner"></span> : `Import ${pendingContacts.filter(c => c.selected).length} Contacts 🔥`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {contacts.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="icon">👥</div>
          <h3>No contacts yet</h3>
          <p>Add contacts to send event invitations via WhatsApp!</p>
        </div>
      ) : (
        Object.entries(grouped).map(([label, groupContacts]) => (
          <div key={label} className="mb-lg">
            <div className="flex items-center gap-sm mb-sm">
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{label}</h3>
              <span className="badge badge-primary">{groupContacts.length}</span>
            </div>
            <div className="flex flex-col gap-sm">
              {groupContacts.map((contact) => (
                <div key={contact.id} className="card" style={{ padding: 'var(--space-md)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-md">
                      <div style={{
                        width: '40px', height: '40px', borderRadius: 'var(--radius-full)',
                        background: 'linear-gradient(135deg, var(--primary), var(--accent-pink))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 600, fontSize: '0.9rem', flexShrink: 0,
                      }}>
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem' }}>{contact.name}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{contact.phone}</p>
                        {contact.email && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{contact.email}</p>}
                      </div>
                    </div>
                    <div className="flex gap-xs">
                      <button onClick={() => editContact(contact)} style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontSize: '0.9rem', padding: '4px' }}>✏️</button>
                      <button onClick={() => deleteContact(contact.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.9rem', padding: '4px' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
