import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contactService } from '../services/services';
import { useToast } from '../utils/helpers';

export default function ManageContacts() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', group_label: 'General' });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState(null); // 'phone' | 'csv'
  const [pendingContacts, setPendingContacts] = useState([]);
  const [importLoading, setImportLoading] = useState(false);

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
    if (!('contacts' in navigator && 'select' in navigator.contacts)) {
      showToast('Contact Picker not supported on this browser. Use CSV import instead!', 'warning');
      return;
    }

    try {
      const props = ['name', 'tel', 'email'];
      const opts = { multiple: true };
      const selected = await navigator.contacts.select(props, opts);
      
      if (selected.length > 0) {
        const formatted = selected.map(c => ({
          name: c.name?.[0] || 'Unknown',
          phone: c.tel?.[0]?.replace(/[^0-9]/g, '') || '',
          email: c.email?.[0] || '',
          group_label: 'General',
          selected: true
        })).filter(c => c.phone);
        
        setPendingContacts(formatted);
        setImportType('review');
      }
    } catch (err) {
      console.error(err);
      showToast('Import cancelled or failed', 'error');
    }
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
          <div className="modal-content card-glass" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-center mb-md">
              <h3>Import Contacts</h3>
              <button onClick={() => setShowImportModal(false)} className="btn-close">×</button>
            </div>

            {!importType ? (
              <div className="flex flex-col gap-md">
                <button onClick={handlePhoneImport} className="btn btn-glass btn-lg flex items-center justify-center gap-sm">
                  📱 Select from Phone
                </button>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>— OR —</div>
                <label className="btn btn-secondary btn-lg flex items-center justify-center gap-sm cursor-pointer">
                  📄 Upload CSV File
                  <input type="file" accept=".csv" hidden onChange={handleCsvUpload} />
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  CSV Format: Name, Phone, Email
                </p>
              </div>
            ) : importType === 'review' ? (
              <div className="flex flex-col flex-1 overflow-hidden">
                <p style={{ fontSize: '0.85rem', marginBottom: 'var(--space-sm)' }}>Found {pendingContacts.length} contacts. Select to add:</p>
                <div className="flex-1 overflow-y-auto mb-md pr-xs">
                  {pendingContacts.map((c, i) => (
                    <div key={i} className="flex items-center gap-sm p-sm mb-xs" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
                      <input 
                        type="checkbox" 
                        checked={c.selected} 
                        onChange={() => setPendingContacts(prev => prev.map((item, idx) => idx === i ? {...item, selected: !item.selected} : item))}
                      />
                      <div className="flex-1">
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.phone}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-sm">
                  <button onClick={() => setImportType(null)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                  <button onClick={submitImport} className="btn btn-primary" style={{ flex: 2 }} disabled={importLoading}>
                    {importLoading ? 'Saving...' : `Add ${pendingContacts.filter(c => c.selected).length} Contacts`}
                  </button>
                </div>
              </div>
            ) : null}
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
