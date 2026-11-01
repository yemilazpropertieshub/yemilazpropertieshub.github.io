import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowRight, ArrowUpRight, BedDouble, Building2, CalendarDays, Check, ChevronDown,
  CircleHelp, Clock3, FileText, Filter, Home, KeyRound, LayoutDashboard, LogOut,
  Menu, MoreHorizontal, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles,
  Trash2, Users, Wallet, X,
} from 'lucide-react';
import './style.css';

const supabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  : null;
const currency = (value) => `₦${Number(value || 0).toLocaleString('en-NG')}`;
const dateLabel = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-NG', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';
const initials = (name = '') => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

const demoTenants = [
  { id: 'demo-1', full_name: 'Amara Okafor', notes: 'Meridian Residence · 4B', lease_start: '2025-01-15', status: 'active', rent_amount: 18500000 },
  { id: 'demo-2', full_name: 'Tunde Bakare', notes: 'Palm Court · 2A', lease_start: '2025-02-01', status: 'active', rent_amount: 12000000 },
  { id: 'demo-3', full_name: 'Nneka Eze', notes: 'The Olives · 5C', lease_start: '2024-12-12', status: 'notice', rent_amount: 9500000 },
  { id: 'demo-4', full_name: 'Oluwaseun Adebayo', notes: 'Cedar House · 1B', lease_start: '2024-11-20', status: 'active', rent_amount: 15000000 },
];
const nav = [
  { title: 'Workspace', links: [['Overview', LayoutDashboard], ['Properties', Building2], ['Tenants', Users], ['Payments & charges', Wallet]] },
  { title: 'People', links: [['Guarantors', ShieldCheck], ['Caretakers', KeyRound], ['Agents', Users]] },
];

function App() {
  const [page, setPage] = useState('Overview');
  const [tenants, setTenants] = useState(demoTenants);
  const [propertyRecords, setPropertyRecords] = useState([]);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [records, setRecords] = useState([]);
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [allocationTenant, setAllocationTenant] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All properties');
  const [auth, setAuth] = useState(null);
  const [signing, setSigning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) setAuth(data.session?.user || null); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setAuth(session?.user || null));
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const fields = auth
      ? '*'
      : 'id,name,address,city,listing_type,price,bedrooms,bathrooms,description,image_url,status,is_advertised';
    let request = supabase.from('properties').select(fields).order('created_at', { ascending: false });
    request = auth
      ? request.eq('owner_id', auth.id)
      : request.eq('status', 'available').eq('is_advertised', true);
    request.then(({ data, error }) => {
      if (!active) return;
      if (error) { if (auth) setToast(error.message); return; }
      setPropertyRecords(data || []);
    });
    if (auth) {
      Promise.all([
        supabase.from('tenants').select('*').eq('owner_id', auth.id).order('created_at', { ascending: false }),
        supabase.from('service_charges').select('*').eq('owner_id', auth.id).order('created_at', { ascending: false }),
      ]).then(([tenantResult, paymentResult]) => {
        if (!active) return;
        if (tenantResult.error) setToast(tenantResult.error.message);
        else setTenants(tenantResult.data || []);
        if (paymentResult.error) setToast(paymentResult.error.message);
        else setPaymentRecords(paymentResult.data || []);
      });
    } else {
      setTenants(demoTenants);
      setPaymentRecords([]);
    }
    return () => { active = false; };
  }, [auth]);

  useEffect(() => {
    if (!auth || !supabase) { setRecords([]); return; }
    if (page === 'Properties') { setRecords(propertyRecords); return; }
    if (page === 'Payments & charges') { setRecords(paymentRecords); return; }
    const table = { Guarantors: 'guarantors', Caretakers: 'staff', Agents: 'staff' }[page];
    if (!table) { setRecords([]); return; }
    let request = supabase.from(table).select('*').eq('owner_id', auth.id).order('created_at', { ascending: false });
    if (page === 'Caretakers') request = request.eq('role', 'caretaker');
    if (page === 'Agents') request = request.eq('role', 'agent');
    request.then(({ data, error }) => { if (error) setToast(error.message); else setRecords(data || []); });
  }, [auth, page, propertyRecords, paymentRecords]);

  const availableProperties = propertyRecords.filter((property) => property.status === 'available');
  const tenantProperty = (tenant) => propertyRecords.find((property) => property.id === tenant.property_id);
  const paidForTenant = (tenantId) => paymentRecords.some((payment) => payment.tenant_id === tenantId && payment.status === 'paid');
  const visibleTenants = useMemo(() => tenants.map((tenant) => ({
    ...tenant,
    name: tenant.full_name,
    initials: initials(tenant.full_name),
    property: tenantProperty(tenant)?.name || tenant.notes || 'Not allocated',
    date: dateLabel(tenant.lease_start),
    rent: currency(tenant.rent_amount),
    displayStatus: tenant.status === 'active' ? 'Active' : tenant.status === 'pending' ? 'Pending' : 'Renewal due',
  })), [tenants, propertyRecords]);

  async function login(event) {
    event.preventDefault();
    if (!supabase) { setToast('Supabase is not configured for this deployment.'); return; }
    setSigning(true);
    const form = new FormData(event.currentTarget);
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.get('email'), password: form.get('password') });
    setSigning(false);
    if (error) setToast(error.message);
    else { setAuth(data.user); setAuthModal(false); setToast('Signed in securely'); }
  }

  async function addTenant(event) {
    event.preventDefault();
    if (!auth || !supabase) { setToast('Sign in before saving tenant records.'); return; }
    const form = new FormData(event.currentTarget);
    const name = String(form.get('full_name')).trim();
    const propertyId = String(form.get('property_id') || '') || null;
    const amount = Number(form.get('rent_amount'));
    const firstPayment = Number(form.get('initial_payment') || 0);
    const leaseStart = String(form.get('lease_start'));
    const leaseEnd = String(form.get('lease_end'));
    if (propertyId && firstPayment <= 0) { setToast('Record a rent or deposit payment before allocating this property.'); return; }
    setSaving(true);
    const { data: tenant, error } = await supabase.from('tenants').insert({
      owner_id: auth.id, full_name: name, email: form.get('email') || null, phone: form.get('phone') || null,
      property_id: null, lease_start: leaseStart, lease_end: leaseEnd, rent_amount: amount,
      rent_frequency: form.get('rent_frequency'), deposit_amount: Number(form.get('deposit_amount') || 0),
      status: 'active', notes: form.get('notes') || null,
    }).select().single();
    if (error) { setSaving(false); setToast(error.message); return; }
    let nextPayments = paymentRecords;
    if (firstPayment > 0) {
      const { data: payment, error: paymentError } = await supabase.from('service_charges').insert({
        owner_id: auth.id, tenant_id: tenant.id, description: `Initial ${form.get('payment_type')} payment — ${name}`,
        category: form.get('payment_type'), amount: firstPayment, due_date: leaseStart,
        paid_at: form.get('payment_date') || new Date().toISOString().slice(0, 10), status: 'paid',
      }).select().single();
      if (paymentError) { setSaving(false); setToast(`Tenant saved, but payment could not be saved: ${paymentError.message}`); setTenants((current) => [tenant, ...current]); return; }
      nextPayments = [payment, ...paymentRecords];
      setPaymentRecords(nextPayments);
    }
    if (propertyId) {
      const { error: allocationError } = await supabase.rpc('allocate_property', { p_tenant_id: tenant.id, p_property_id: propertyId });
      if (allocationError) { setSaving(false); setToast(`Tenant and payment saved; allocate the property from Tenants: ${allocationError.message}`); setTenants((current) => [tenant, ...current]); return; }
      setPropertyRecords((current) => current.map((property) => property.id === propertyId ? { ...property, status: 'occupied', is_advertised: false } : property));
    }
    setTenants((current) => [tenant, ...current]);
    setSaving(false); setModal(false); setToast(propertyId ? 'Tenant, payment and property allocation saved.' : 'Tenant record saved. Record a payment, then allocate a property from Tenants.');
  }

  async function saveOtherRecord(event) {
    event.preventDefault();
    if (!auth || !supabase) { setToast('Sign in before saving portfolio records.'); return; }
    const form = new FormData(event.currentTarget);
    let table; let row;
    if (page === 'Properties') {
      table = 'properties';
      row = {
        name: form.get('name'), address: form.get('address') || null, city: form.get('city') || 'Lagos',
        listing_type: form.get('listing_type'), price: Number(form.get('price')), bedrooms: Number(form.get('bedrooms') || 0),
        bathrooms: Number(form.get('bathrooms') || 0), description: form.get('description') || null,
        image_url: form.get('image_url') || null, status: 'available', is_advertised: form.get('is_advertised') === 'on',
      };
    } else if (page === 'Payments & charges') {
      table = 'service_charges';
      const tenant = tenants.find((item) => item.id === form.get('tenant_id'));
      const status = form.get('status');
      row = {
        tenant_id: tenant?.id || null, property_id: tenant?.property_id || null,
        description: form.get('description'), category: form.get('category'), amount: Number(form.get('amount')),
        due_date: form.get('due_date') || null, status,
        paid_at: status === 'paid' ? (form.get('paid_at') || new Date().toISOString().slice(0, 10)) : null,
      };
    } else if (page === 'Guarantors') {
      table = 'guarantors'; row = { full_name: form.get('full_name'), email: form.get('email') || null, phone: form.get('phone') || null, relationship: form.get('relationship') || null, address: form.get('address') || null, occupation: form.get('occupation') || null };
    } else {
      table = 'staff'; row = { full_name: form.get('full_name'), role: page === 'Caretakers' ? 'caretaker' : 'agent', email: form.get('email') || null, phone: form.get('phone') || null, notes: form.get('notes') || null };
    }
    setSaving(true);
    const { data, error } = await supabase.from(table).insert({ ...row, owner_id: auth.id }).select().single();
    setSaving(false);
    if (error) { setToast(error.message); return; }
    if (page === 'Properties') setPropertyRecords((current) => [data, ...current]);
    if (page === 'Payments & charges') setPaymentRecords((current) => [data, ...current]);
    setRecords((current) => [data, ...current]); setModal(false);
    setToast(page === 'Properties' ? (data.is_advertised ? 'Property saved and advertised on the dashboard.' : 'Property saved. You can advertise it from Properties.') : 'Record saved to Supabase.');
  }

  async function deleteProperty(property) {
    if (!window.confirm(`Delete “${property.name}”? Linked tenants and payment history will be kept, but the property allocation will be cleared.`)) return;
    if (!auth || !supabase) { setToast('Sign in before deleting properties.'); return; }
    // Clear foreign-key references first so existing projects keep payment history when a property is removed.
    const { error: tenantError } = await supabase.from('tenants').update({ property_id: null }).eq('owner_id', auth.id).eq('property_id', property.id);
    if (tenantError) { setToast(tenantError.message); return; }
    const { error: chargeError } = await supabase.from('service_charges').update({ property_id: null }).eq('owner_id', auth.id).eq('property_id', property.id);
    if (chargeError) { setToast(chargeError.message); return; }
    const { error } = await supabase.from('properties').delete().eq('owner_id', auth.id).eq('id', property.id);
    if (error) { setToast(error.message); return; }
    setPropertyRecords((current) => current.filter((item) => item.id !== property.id));
    setTenants((current) => current.map((tenant) => tenant.property_id === property.id ? { ...tenant, property_id: null } : tenant));
    setToast('Property deleted. Tenant and payment records were kept.');
  }

  async function toggleAdvertisement(property) {
    if (!auth || !supabase) { setToast('Sign in before changing property advertisements.'); return; }
    if (property.status !== 'available') { setToast('Only unallocated properties can be advertised.'); return; }
    const nextValue = !property.is_advertised;
    const { error } = await supabase.from('properties').update({ is_advertised: nextValue }).eq('owner_id', auth.id).eq('id', property.id);
    if (error) { setToast(error.message); return; }
    setPropertyRecords((current) => current.map((item) => item.id === property.id ? { ...item, is_advertised: nextValue } : item));
    setToast(nextValue ? 'Property added to dashboard advertisements.' : 'Property advertisement removed from dashboard.');
  }

  async function allocateProperty(event) {
    event.preventDefault();
    if (!auth || !supabase || !allocationTenant) { setToast('Sign in before allocating a property.'); return; }
    const propertyId = new FormData(event.currentTarget).get('property_id') || null;
    if (propertyId && !paidForTenant(allocationTenant.id)) { setToast('Record a paid rent or deposit first.'); return; }
    setSaving(true);
    const { error } = await supabase.rpc('allocate_property', { p_tenant_id: allocationTenant.id, p_property_id: propertyId });
    setSaving(false);
    if (error) { setToast(error.message); return; }
    const oldProperty = tenantProperty(allocationTenant);
    setTenants((current) => current.map((tenant) => tenant.id === allocationTenant.id ? { ...tenant, property_id: propertyId } : tenant));
    setPropertyRecords((current) => current.map((property) => {
      if (property.id === propertyId) return { ...property, status: 'occupied', is_advertised: false };
      if (property.id === oldProperty?.id) return { ...property, status: 'available' };
      return property;
    }));
    setAllocationTenant(null); setToast(propertyId ? 'Property allocated to tenant.' : 'Property allocation removed.');
  }

  const visiblePayments = paymentRecords.filter((payment) => `${payment.description} ${payment.category} ${tenants.find((tenant) => tenant.id === payment.tenant_id)?.full_name || ''}`.toLowerCase().includes(query.toLowerCase()));
  const displayedTenants = visibleTenants.filter((tenant) => `${tenant.name} ${tenant.property}`.toLowerCase().includes(query.toLowerCase()));
  const dashboardAds = propertyRecords.filter((property) => property.status === 'available' && property.is_advertised);

  if (!auth) return <>
    <PublicLanding properties={dashboardAds} onSignIn={() => setAuthModal(true)}/>
    {authModal && <AuthDialog onSubmit={login} onClose={() => setAuthModal(false)} signing={signing}/>}
    {toast && <div className="toast"><Check size={16}/>{toast}<button onClick={() => setToast('')}><X size={15}/></button></div>}
  </>;

  return <>
    <div className="app-shell">
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark">Y<span>.</span></div><div><strong>yemilaz</strong><small>PROPERTIES</small></div><button className="mobile-close" onClick={() => setMenu(false)}><X size={19}/></button></div>
        <div className="workspace-pill"><div className="workspace-avatar">Y</div><span>Yemilaz Properties</span><ChevronDown size={15}/></div>
        <div className="side-scroll">{nav.map((group) => <div className="nav-group" key={group.title}><span className="nav-label">{group.title}</span>{group.links.map(([label, Icon]) => <button key={label} className={`nav-link ${page === label ? 'selected' : ''}`} onClick={() => { setPage(label); setMenu(false); }}><Icon size={18}/>{label}{label === 'Tenants' && <span className="nav-count">{auth ? tenants.length : demoTenants.length}</span>}</button>)}</div>)}</div>
        <div className="sidebar-bottom"><div className="upgrade-card"><Sparkles size={16}/><b>Property insights</b><p>See what’s happening across your portfolio.</p><button onClick={() => setToast('Insights are coming soon')}>Explore insights <ArrowRight size={14}/></button></div><div className="profile-row"><div className="profile-avatar">{auth ? initials(auth.email || 'YA') : 'YA'}</div><div><b>{auth?.email || 'Yemilaz Admin'}</b><small>{auth ? 'Property manager' : 'Preview workspace'}</small></div>{auth && <button className="icon-button" title="Sign out" onClick={() => supabase.auth.signOut()}><LogOut size={17}/></button>}</div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMenu(true)}><Menu size={19}/></button><div className="breadcrumb">Workspace <span>/</span> <b>{page}</b></div><div className="top-actions"><button className="help-btn" onClick={() => setToast('How can we help? Email hello@yemilazproperties.com')}><CircleHelp size={17}/><span>Help centre</span></button><div className="top-divider"/>{auth ? <button className="profile-avatar top-avatar" title={auth.email}>{initials(auth.email || 'YA')}</button> : <button className="sign-in" onClick={() => setAuthModal(true)}>Sign in</button>}</div></header>
        {page === 'Overview' ? <>
          <section className="welcome-row"><div><div className="eyebrow">{new Date().toLocaleDateString('en-NG', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()} <span className="live-dot"/></div><h1>Good morning, Yemilaz <span>✳</span></h1><p>Here’s what’s happening with your properties today.</p></div><button className="primary-button" onClick={() => { if (!auth) { setAuthModal(true); return; } setModal(true); }}><Plus size={17}/> Add a tenant</button></section>
          <section className="metric-grid"><Metric icon={Building2} label="Total properties" value={auth ? propertyRecords.length : '—'} note="Across your portfolio" color="lavender"/><Metric icon={Users} label="Active tenants" value={auth ? tenants.length : '—'} note="Lease records on file" color="mint"/><Metric icon={Wallet} label="Rent collected" value="—" note="Track recorded payments" color="peach"/><Metric icon={Clock3} label="Expiring soon" value="—" note="Lease dates on file" color="blue"/></section>
          <section className="content-grid"><div className="panel tenants-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR PORTFOLIO</span><h2>Recent tenants <span className="count-badge">{auth ? tenants.length : demoTenants.length}</span></h2></div><button className="text-button" onClick={() => setPage('Tenants')}>View all <ArrowRight size={15}/></button></div><div className="table-tools"><label className="search-box"><Search size={16}/><input placeholder="Search tenants..." value={query} onChange={(event) => setQuery(event.target.value)}/></label><button className="filter-button" onClick={() => setFilter(filter === 'All properties' ? 'Active only' : 'All properties')}><SlidersHorizontal size={15}/>{filter}<ChevronDown size={13}/></button></div><div className="table-wrap"><table><thead><tr><th>TENANT</th><th>PROPERTY</th><th>LEASE START</th><th>STATUS</th><th>ANNUAL RENT</th></tr></thead><tbody>{(auth ? displayedTenants : demoTenants.map((tenant) => ({ ...tenant, name: tenant.full_name, initials: initials(tenant.full_name), property: tenant.notes, date: dateLabel(tenant.lease_start), rent: currency(tenant.rent_amount), displayStatus: tenant.status === 'active' ? 'Active' : 'Renewal due' })).filter((tenant) => `${tenant.name} ${tenant.property}`.toLowerCase().includes(query.toLowerCase()))).slice(0, 5).map((tenant, index) => <tr key={tenant.id}><td><div className="tenant-cell"><div className={`tenant-avatar avatar-${index % 4}`}>{tenant.initials}</div><b>{tenant.name}</b></div></td><td>{tenant.property}</td><td>{tenant.date}</td><td><span className={`status ${tenant.displayStatus === 'Active' ? 'active' : 'renewal'}`}><i/>{tenant.displayStatus}</span></td><td className="rent-cell">{tenant.rent}</td></tr>)}</tbody></table>{auth && displayedTenants.length === 0 && <div className="empty-state">No tenant records yet.</div>}</div><div className="panel-footer"><span>{auth ? `Showing ${Math.min(displayedTenants.length, 5)} of ${tenants.length} tenants` : 'Preview data'}</span><button onClick={() => setPage('Tenants')}>Manage tenants <ArrowUpRight size={14}/></button></div></div>
            <div className="right-column"><div className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow">THE LATEST</span><h2>Portfolio reminders</h2></div></div><div className="activity-list"><Activity icon={Check} tone="green" title="Properties ready to advertise" text={`${dashboardAds.length} available properties featured`} time="Dashboard listings"/><Activity icon={FileText} tone="purple" title="Payment records" text={`${paymentRecords.length} rent and service records`} time="Payments & charges"/><Activity icon={CalendarDays} tone="orange" title="Tenant allocations" text={`${tenants.filter((tenant) => tenant.property_id).length} properties allocated`} time="Tenant directory"/></div><button className="activity-link" onClick={() => setPage('Payments & charges')}>View payments <ArrowRight size={14}/></button></div><div className="reminder-card"><div className="reminder-icon"><Building2 size={17}/></div><div><span className="eyebrow">AVAILABLE LISTINGS</span><h3>{availableProperties.length} unallocated properties</h3><p>Advertise an available property from Properties.</p></div><ArrowUpRight className="reminder-arrow" size={17}/></div></div>
          </section>
          <section className="listings-section"><div className="listings-heading"><div><span className="eyebrow">AVAILABLE TO RENT OR BUY</span><h2>Dashboard advertisements</h2></div><button className="text-button" onClick={() => setPage('Properties')}>Manage properties <ArrowRight size={15}/></button></div>{dashboardAds.length ? <div className="property-grid">{dashboardAds.map((property) => <PropertyCard key={property.id} property={property}/>)}</div> : <div className="empty-management"><span><Building2 size={23}/></span><h3>No advertised properties yet</h3><p>Add an available property, then choose “Advertise” in Properties to show it here.</p><button className="secondary-button" onClick={() => { if (!auth) { setAuthModal(true); return; } setPage('Properties'); setModal(true); }}><Plus size={15}/> Add a property</button></div>}</section>
        </> : <ManagementPage
          page={page} tenants={visibleTenants} records={page === 'Properties' ? propertyRecords : page === 'Payments & charges' ? visiblePayments : records}
          query={query} setQuery={setQuery} openModal={() => { if (!auth) { setAuthModal(true); return; } setModal(true); }}
          onDeleteProperty={deleteProperty} onToggleAdvertisement={toggleAdvertisement}
          onAllocate={(tenant) => { if (!auth) { setAuthModal(true); return; } setAllocationTenant(tenant); }}
          onRecordPayment={() => setPage('Payments & charges')} hasPaid={paidForTenant}
        />}
        <footer className="site-footer"><span>© 2026 Yemilaz Properties</span><span>Thoughtful living, beautifully managed.</span></footer>
      </main>
    </div>

    {modal && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(false)}><form className="modal" onSubmit={page === 'Tenants' || page === 'Overview' ? addTenant : saveOtherRecord}>
      <div className="modal-heading"><div><span className="eyebrow">PORTFOLIO MANAGEMENT</span><h2>{page === 'Tenants' || page === 'Overview' ? 'Register tenant' : `Add ${page === 'Payments & charges' ? 'payment or charge' : page === 'Properties' ? 'property' : page === 'Guarantors' ? 'guarantor' : page.slice(0, -1).toLowerCase()} record`}</h2><p>Save the details to your private Supabase workspace.</p></div><button type="button" className="icon-button" onClick={() => setModal(false)}><X size={19}/></button></div>
      {(page === 'Tenants' || page === 'Overview') ? <>
        <label>Tenant’s full name<input required name="full_name" placeholder="e.g. Amara Okafor"/></label>
        <div className="form-row"><label>Email<input name="email" type="email"/></label><label>Phone<input name="phone"/></label></div>
        <div className="form-row"><label>Lease start<input required name="lease_start" type="date"/></label><label>Lease end<input required name="lease_end" type="date"/></label></div>
        <div className="form-row"><label>Rent amount (₦)<input required name="rent_amount" type="number" min="0" step="0.01"/></label><label>Rent frequency<select name="rent_frequency"><option value="yearly">Yearly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></label></div>
        <div className="form-row"><label>First payment (₦)<input name="initial_payment" type="number" min="0" step="0.01" defaultValue="0"/><small>Enter a paid rent/deposit amount before allocating a property.</small></label><label>Payment type<select name="payment_type"><option value="rent">Rent</option><option value="deposit">Deposit</option></select></label></div>
        <div className="form-row"><label>Payment date<input name="payment_date" type="date"/></label><label>Allocate available property<select name="property_id" defaultValue=""><option value="">Leave unallocated</option>{availableProperties.map((property) => <option key={property.id} value={property.id}>{property.name} · {currency(property.price)}</option>)}</select><small>Allocation requires a first payment above zero.</small></label></div>
        <label>Notes<input name="notes" placeholder="Unit, references or other details"/></label>
      </> : page === 'Properties' ? <>
        <label>Property name<input required name="name" placeholder="e.g. Meridian Residence"/></label>
        <div className="form-row"><label>Listing type<select name="listing_type"><option value="rent">For rent</option><option value="sale">For sale</option></select></label><label>Price (₦)<input required name="price" type="number" min="0"/></label></div>
        <div className="form-row"><label>Address<input name="address"/></label><label>City<input name="city" defaultValue="Lagos"/></label></div>
        <div className="form-row"><label>Bedrooms<input name="bedrooms" type="number" min="0"/></label><label>Bathrooms<input name="bathrooms" type="number" min="0"/></label></div>
        <label>Property image URL<input name="image_url" type="url" placeholder="https://…"/></label><label>Description<textarea name="description" rows="3"/></label>
        <label className="checkbox-row"><input type="checkbox" name="is_advertised" defaultChecked/> Advertise on the dashboard while available</label>
      </> : page === 'Payments & charges' ? <>
        <label>Payment / charge description<input required name="description" placeholder="e.g. January rent or generator servicing"/></label>
        <div className="form-row"><label>Tenant<select name="tenant_id" defaultValue=""><option value="">Property / general charge</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.full_name}</option>)}</select></label><label>Category<select name="category"><option value="rent">Rent</option><option value="deposit">Deposit</option><option value="utilities">Utilities</option><option value="maintenance">Maintenance</option><option value="security">Security</option><option value="cleaning">Cleaning</option><option value="other">Other</option></select></label></div>
        <div className="form-row"><label>Amount (₦)<input required name="amount" type="number" min="0" step="0.01"/></label><label>Status<select name="status"><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="waived">Waived</option></select></label></div>
        <div className="form-row"><label>Due date<input name="due_date" type="date"/></label><label>Paid date<input name="paid_at" type="date"/></label></div>
      </> : page === 'Guarantors' ? <>
        <label>Guarantor’s full name<input required name="full_name"/></label><div className="form-row"><label>Phone<input name="phone"/></label><label>Email<input name="email" type="email"/></label></div><div className="form-row"><label>Relationship to tenant<input name="relationship"/></label><label>Occupation<input name="occupation"/></label></div><label>Address<input name="address"/></label>
      </> : <>
        <label>Full name<input required name="full_name"/></label><div className="form-row"><label>Phone<input name="phone"/></label><label>Email<input name="email" type="email"/></label></div><label>Notes<input name="notes" placeholder="Assigned properties or details"/></label>
      </>}
      <div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button><button className="primary-button" disabled={saving}><Plus size={16}/>{saving ? 'Saving…' : 'Save record'}</button></div>
    </form></div>}

    {allocationTenant && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setAllocationTenant(null)}><form className="modal" onSubmit={allocateProperty}><div className="modal-heading"><div><span className="eyebrow">PROPERTY ALLOCATION</span><h2>{allocationTenant.property_id ? 'Change tenant property' : 'Allocate a property'}</h2><p>{allocationTenant.full_name} · allocation is available after a rent or deposit payment is recorded.</p></div><button type="button" className="icon-button" onClick={() => setAllocationTenant(null)}><X size={19}/></button></div><label>Available property<select required name="property_id" defaultValue=""><option value="">Select a property</option>{availableProperties.map((property) => <option key={property.id} value={property.id}>{property.name} · {currency(property.price)}</option>)}</select></label>{!paidForTenant(allocationTenant.id) && <p className="setup-note">Record a paid rent or deposit under Payments & charges before allocating a property.</p>}<div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setAllocationTenant(null)}>Cancel</button><button className="primary-button" disabled={saving || !paidForTenant(allocationTenant.id)}>Allocate property</button></div></form></div>}

    {toast && <div className="toast"><Check size={16}/>{toast}<button onClick={() => setToast('')}><X size={15}/></button></div>}
  </>;
}

function PublicLanding({ properties, onSignIn }) {
  return <div className="public-site">
    <header className="public-nav"><a className="public-brand" href="#top"><span className="brand-mark">Y<span>.</span></span><span><b>yemilaz</b><small>PROPERTIES</small></span></a><nav><a href="#homes">Find a home</a><a href="#about">About us</a><button className="sign-in" onClick={onSignIn}><KeyRound size={15}/> Manager sign in</button></nav></header>
    <main id="top">
      <section className="public-hero"><div className="public-hero-copy"><span className="public-eyebrow"><i/> THOUGHTFUL LIVING IN LAGOS</span><h1>Find a place<br/>to <em>call yours.</em></h1><p>Considered homes and dependable property care, brought together by Yemilaz Properties.</p><div className="public-hero-actions"><a className="primary-button" href="#homes">Explore available homes <ArrowRight size={16}/></a><button className="public-text-button" onClick={onSignIn}>Property manager? Sign in</button></div><div className="public-trust"><span><Check size={14}/> Carefully selected homes</span><span><Check size={14}/> Personal service</span></div></div><div className="public-hero-photo"><img src="/lagos-home.png" alt="A contemporary home in Lagos"/><div className="hero-photo-note"><span className="live-dot"/> YEMILAZ PROPERTIES <b>Homes for a better everyday.</b></div></div></section>
      <section className="public-listings" id="homes"><div className="public-section-heading"><div><span className="public-eyebrow">THE CURRENT COLLECTION</span><h2>Homes worth coming home to.</h2><p>Browse properties currently available to rent or buy.</p></div><span className="public-count">{properties.length} {properties.length === 1 ? 'home' : 'homes'} available</span></div>{properties.length ? <div className="property-grid">{properties.map((property) => <PropertyCard key={property.id} property={property}/>)}</div> : <div className="public-empty"><Building2 size={25}/><h3>New homes are on the way.</h3><p>Check back soon for available Yemilaz Properties listings.</p></div>}</section>
      <section className="public-about" id="about"><div><span className="public-eyebrow">PROPERTY, MADE PERSONAL</span><h2>Good homes.<br/>Thoughtful care.</h2></div><p>From discovering your next home to keeping every detail in order, Yemilaz Properties brings people and places together with clarity, care and local expertise.</p><button className="about-signin" onClick={onSignIn}>Property manager sign in <ArrowUpRight size={15}/></button></section>
    </main>
    <footer className="public-footer"><a className="public-brand" href="#top"><span className="brand-mark">Y<span>.</span></span><span><b>yemilaz</b><small>PROPERTIES</small></span></a><span>Thoughtful living, beautifully managed.</span><span>© {new Date().getFullYear()} Yemilaz Properties</span></footer>
  </div>;
}

function AuthDialog({ onSubmit, onClose, signing }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal" onSubmit={onSubmit}><div className="modal-heading"><div><span className="eyebrow">YEMILAZ PROPERTIES</span><h2>Manager sign in</h2><p>Sign in to manage properties, tenants and payments.</p></div><button type="button" className="icon-button" onClick={onClose}><X size={19}/></button></div><label>Email address<input required name="email" type="email" placeholder="you@example.com"/></label><label>Password<input required name="password" type="password" placeholder="Your password"/></label><div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={signing}><KeyRound size={15}/>{signing ? 'Signing in…' : 'Sign in'}</button></div></form></div>;
}

function PropertyCard({ property }) {
  return <article className="property-card"><div className="property-image" style={{ backgroundImage: `url(${property.image_url || '/lagos-home.png'})` }}><span className="property-tag">{property.listing_type === 'sale' ? 'For sale' : 'For rent'}</span></div><div className="property-info"><span className="property-area">{[property.address, property.city].filter(Boolean).join(', ') || 'Lagos'}</span><h3>{property.name}</h3><div className="property-features"><span><BedDouble size={15}/>{property.bedrooms || 0} beds</span><span><Home size={14}/>{property.bathrooms || 0} baths</span></div><div className="property-price"><b>{currency(property.price)}</b><span>{property.listing_type === 'rent' ? '/ year' : ''}</span><a href={`mailto:hello@yemilazproperties.com?subject=${encodeURIComponent(`Property enquiry: ${property.name}`)}`} aria-label={`Enquire about ${property.name}`}><ArrowUpRight size={16}/></a></div></div></article>;
}

function Metric({ icon: Icon, label, value, note, color }) {
  return <div className="metric-card"><div className="metric-top"><span className={`metric-icon ${color}`}><Icon size={18}/></span></div><div className="metric-value">{value}</div><div className="metric-label">{label}</div><div className="metric-note">{note}</div></div>;
}

function Activity({ icon: Icon, tone, title, text, time }) {
  return <div className="activity-item"><span className={`activity-icon ${tone}`}><Icon size={15}/></span><div className="activity-copy"><b>{title}</b><span>{text}</span><small>{time}</small></div></div>;
}

function ManagementPage({ page, tenants, records, query, setQuery, openModal, onDeleteProperty, onToggleAdvertisement, onAllocate, onRecordPayment, hasPaid }) {
  const copy = {
    Properties: ['Property portfolio', 'Delete properties, manage availability, and choose which available homes appear on the dashboard.'],
    Tenants: ['Tenant directory', 'Register tenants, record payments, and allocate available properties after payment.'],
    'Payments & charges': ['Payments & service charges', 'Record every rent payment, deposit, utility, maintenance and other property charge.'],
    Guarantors: ['Guarantor records', 'Keep tenant guarantor details available when you need them.'],
    Caretakers: ['Caretaker directory', 'Coordinate on-site teams across your properties.'],
    Agents: ['Agent directory', 'Your trusted partners for letting and sales.'],
  }[page] || ['Portfolio overview', 'Your properties at a glance.'];
  const columns = {
    Properties: [['Property', 'name'], ['City', 'city'], ['Listing', 'listing_type'], ['Price', 'price'], ['Availability', 'status']],
    'Payments & charges': [['Description', 'description'], ['Tenant', 'tenant_name'], ['Category', 'category'], ['Amount', 'amount'], ['Due date', 'due_date'], ['Status', 'status']],
    Guarantors: [['Name', 'full_name'], ['Phone', 'phone'], ['Email', 'email'], ['Relationship', 'relationship']],
    Caretakers: [['Name', 'full_name'], ['Phone', 'phone'], ['Email', 'email'], ['Notes', 'notes']],
    Agents: [['Name', 'full_name'], ['Phone', 'phone'], ['Email', 'email'], ['Notes', 'notes']],
  }[page] || [];
  const filtered = records.filter((record) => {
    const tenantName = tenants.find((tenant) => tenant.id === record.tenant_id)?.full_name || '';
    return `${Object.values(record).join(' ')} ${tenantName}`.toLowerCase().includes(query.toLowerCase());
  });
  const value = (key, item) => {
    if (key === 'price' || key === 'amount') return currency(item);
    if (key === 'tenant_name') return tenants.find((tenant) => tenant.id === item.tenant_id)?.full_name || 'General/property charge';
    if (key === 'status') return item === 'available' ? 'Available' : item === 'occupied' ? 'Occupied' : item === 'under_offer' ? 'Under offer' : item === 'sold' ? 'Sold' : item || '—';
    return item || '—';
  };
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">WORKSPACE / {page.toUpperCase()}</div><h1>{copy[0]}</h1><p>{copy[1]}</p></div><button className="primary-button" onClick={openModal}><Plus size={17}/>{page === 'Tenants' ? 'Register a tenant' : page === 'Properties' ? 'Add a property' : page === 'Payments & charges' ? 'Record a payment' : 'Add a record'}</button></div>
    <div className="panel management-panel"><div className="panel-heading"><div><h2>{page}</h2><span className="management-sub">{page === 'Tenants' ? `${tenants.length} tenant records` : `${records.length} records`}</span></div><button className="filter-button" onClick={onRecordPayment}><Filter size={15}/> Filters <ChevronDown size={13}/></button></div><label className="search-box wide-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${page.toLowerCase()}...`}/></label>
      {page === 'Tenants' ? <div className="table-wrap"><table><thead><tr><th>TENANT</th><th>PROPERTY</th><th>LEASE START</th><th>STATUS</th><th>RENT</th><th>PAYMENT</th><th>ACTION</th></tr></thead><tbody>{tenants.filter((tenant) => `${tenant.name} ${tenant.property}`.toLowerCase().includes(query.toLowerCase())).map((tenant, index) => <tr key={tenant.id}><td><div className="tenant-cell"><div className={`tenant-avatar avatar-${index % 4}`}>{tenant.initials}</div><b>{tenant.name}</b></div></td><td>{tenant.property}</td><td>{tenant.date}</td><td><span className={`status ${tenant.displayStatus === 'Active' ? 'active' : 'renewal'}`}><i/>{tenant.displayStatus}</span></td><td className="rent-cell">{tenant.rent}</td><td>{hasPaid(tenant.id) ? 'Payment recorded' : 'No payment'}</td><td><div className="row-actions"><button className="secondary-button compact-button" onClick={() => hasPaid(tenant.id) ? onAllocate(tenant) : onRecordPayment()}>{tenant.property_id ? 'Change property' : hasPaid(tenant.id) ? 'Allocate' : 'Record payment'}</button></div></td></tr>)}</tbody></table>{tenants.length === 0 && <EmptyState title="No tenants yet" text="Register a tenant to start recording leases and payments."/>}</div>
      : filtered.length ? <div className="table-wrap"><table><thead><tr>{columns.map(([label]) => <th key={label}>{label.toUpperCase()}</th>)}{page === 'Properties' && <th>ACTION</th>}</tr></thead><tbody>{filtered.map((record, index) => <tr key={record.id || index}>{columns.map(([label, key]) => <td key={key}>{value(key, key === 'tenant_name' ? record : record[key])}</td>)}{page === 'Properties' && <td><div className="row-actions"><button className="secondary-button compact-button" disabled={record.status !== 'available'} onClick={() => onToggleAdvertisement(record)}>{record.is_advertised ? 'Hide ad' : 'Advertise'}</button><button className="danger-button" title={`Delete ${record.name}`} onClick={() => onDeleteProperty(record)}><Trash2 size={15}/><span>Delete</span></button></div></td>}</tr>)}</tbody></table></div>
      : <EmptyState title={`No ${page.toLowerCase()} yet`} text={page === 'Properties' ? 'Add a property, then choose whether to advertise it on the dashboard.' : page === 'Payments & charges' ? 'Record rent, deposit and service payments here.' : `Add your first ${page.toLowerCase()} record to get started.`} action={openModal}/>}</div>
    </section>;
}

function EmptyState({ title, text, action }) {
  return <div className="empty-management"><span><Building2 size={23}/></span><h3>{title}</h3><p>{text}</p>{action && <button className="secondary-button" onClick={action}><Plus size={15}/> Add a record</button>}</div>;
}

createRoot(document.getElementById('root')).render(<App/>);
