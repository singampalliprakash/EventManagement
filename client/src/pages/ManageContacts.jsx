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
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', phone: '', email: '', group_label: 'General' }); }} className="btn btn-primary btn-sm" id="add-contact-btn">
          + Add
        </button>
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
