import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowUpRight, BedDouble, Building2, CalendarDays, Check, ChevronDown,
  CircleHelp, Clock3, FileText, Filter, Home, KeyRound, LayoutDashboard, LogOut, MessageCircle, UserRound,
  Menu, MoreHorizontal, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles,
  Trash2, Users, Wallet, X, MapPin, Heart, Bell, Wrench, Download, PenLine, AlertTriangle, Eye, Phone, Mail, Camera,
} from 'lucide-react';
import './style.css';

const supabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  : null;
const currency = (value) => `₦${Number(value || 0).toLocaleString('en-NG')}`;
const DEFAULT_AGREEMENT_TERMS = `1. Rent and other agreed charges must be paid in the amount, currency, manner and by the due dates stated in the signed agreement. The landlord or authorized manager should provide a receipt or written acknowledgement for each payment received. Any change to the amount or payment schedule must be recorded in writing and handled in accordance with applicable law.\n\n2. Any security deposit must be recorded separately from rent, with its amount, permitted purpose, custody and return or deduction terms stated in the signed agreement. Any deduction at the end of the tenancy should be itemized and supported by a reasonable explanation, subject to applicable law.\n\n3. The property may be used only for the purpose and by the occupants or activities permitted in the signed agreement. The tenant must not assign, sublet, share possession, or materially change the use of the premises without any approval required by the agreement and applicable law.\n\n4. Each party is responsible for the repairs, maintenance, services and costs assigned to them by the signed agreement and applicable law. The tenant should take reasonable care of the premises and promptly report damage, defects, leaks, safety hazards or other issues that may worsen or cause harm.\n\n5. Alterations, installations or structural work require the written approval specified in the signed agreement and any permits required by law. The tenant must not interfere with utility meters, safety systems, fixtures or shared services.\n\n6. The landlord or authorized representative may access the premises for a lawful purpose, including inspection, repair or an emergency, subject to the notice, consent and access requirements in the signed agreement and applicable law.\n\n7. Renewal, rent review, notices, breach, termination, possession and handover are governed by the signed agreement and applicable law. No notice or record in this template alone authorizes a lockout, utility disconnection, seizure of belongings or eviction without the legally required process. At handover, the parties should record the condition of the property, return of keys and any outstanding account.\n\n8. These are general template terms for discussion and completion by the parties. The signed agreement, any completed schedules and applicable law govern the parties’ rights. Obtain review from a qualified local property lawyer before use; adapt the terms to the property, transaction, location and parties.`;
const DEFAULT_PROPERTY_RULES = `1. Permitted use: Use the premises only for the activity, occupancy and purpose stated in the signed agreement and allowed by applicable planning, licensing and safety requirements. Obtain any written approval required before changing the use or operating activity.\n\n2. Care and cleanliness: Keep the premises, fixtures, entrances and shared access areas reasonably clean, orderly and unobstructed. Store goods, tools, equipment, waste and vehicles only in suitable designated areas.\n\n3. Protection of property: Take reasonable care of buildings, land boundaries, fittings, equipment, crops, trees and supplied services, as applicable. Do not remove, damage or alter fixtures, structures, fences, utilities or shared equipment without required written approval.\n\n4. Safety and hazards: Keep exits, access routes and emergency equipment clear. Use machinery, electrical equipment, water and other services responsibly. Do not store or use hazardous, flammable or prohibited materials except as permitted by law and the signed agreement.\n\n5. Reporting and repairs: Promptly notify the landlord or authorized manager of damage, leaks, faults, boundary concerns, pest issues, unsafe conditions, security incidents or other matters that may cause injury, loss or further damage. Do not carry out work requiring a qualified professional unless authorized and appropriately qualified.\n\n6. Neighbours and access: Avoid unreasonable noise, nuisance, harassment, obstruction or interference with neighbours, other occupants or lawful business activity. Permit agreed access for inspection, maintenance or repair in accordance with the signed agreement and applicable law; emergencies should be reported promptly.\n\n7. Waste and environment: Dispose of refuse, wastewater, chemicals and other materials through approved methods. Do not dump, burn, pollute, damage soil or water, or create a fire or environmental hazard. For agricultural or undeveloped land, follow applicable land-use, environmental and safety requirements.\n\n8. These rules should be adapted to the particular home, shop, office, store, farm, land or other property. They apply alongside the signed agreement and applicable law. Where requirements conflict, the signed agreement and applicable law take precedence.`;
const localDateISO = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const addDaysISO = (value, days) => { const [year, month, day] = String(value).split('-').map(Number); const date = new Date(year, month - 1, day + days); return localDateISO(date); };
const dateLabel = (value) => {
  if (!value) return '—';
  const text = String(value).trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  let date;
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    date = new Date(Number(year), Number(month) - 1, Number(day));
    if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return '—';
  } else {
    date = new Date(text);
  }
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-NG', { month: 'short', day: '2-digit', year: 'numeric' });
};
const initials = (name = '') => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const displayPersonName = (name = '') => String(name).trim().toLocaleLowerCase().replace(/(^|[\s'-])([a-z])/g, (_, separator, letter) => `${separator}${letter.toLocaleUpperCase()}`);
const brandName = (value = 'Yemilaz Properties') => String(value).trim() || 'Yemilaz Properties';

function AccountProfilePhoto({ auth, className = '' }) {
  const [photo, setPhoto] = useState(auth?.user_metadata?.avatar_url || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);
  useEffect(() => {
    setPhoto(auth?.user_metadata?.avatar_url || '');
    const sync = (event) => setPhoto(event.detail || '');
    window.addEventListener('account-avatar-updated', sync);
    return () => window.removeEventListener('account-avatar-updated', sync);
  }, [auth?.id, auth?.user_metadata?.avatar_url]);
  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !auth?.id || !supabase) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { setMessage('Choose a JPG, PNG or WebP image.'); return; }
    if (file.size > 4 * 1024 * 1024) { setMessage('Choose an image smaller than 4 MB.'); return; }
    setBusy(true); setMessage('');
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${auth.id}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
    if (uploadError) { setBusy(false); setMessage(uploadError.message); return; }
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    const { error } = await supabase.auth.updateUser({ data: { avatar_url: url } });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setPhoto(url); window.dispatchEvent(new CustomEvent('account-avatar-updated', { detail: url })); setMessage('Profile photo updated.');
  }
  return <span className={`account-photo-control ${className}`} title={message || 'Change profile photo'}><button type="button" className="profile-avatar account-photo-button" aria-label="Change profile photo" onClick={() => inputRef.current?.click()} disabled={busy}>{photo ? <img src={photo} alt=""/> : initials(auth?.user_metadata?.full_name || auth?.email || 'YA')}{busy ? <span className="account-photo-loading">…</span> : <i><Camera size={11}/></i>}</button><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload}/>{message && <span className="account-photo-status" role="status">{message}</span>}</span>;
}
const isShortLetProperty = (property) => property?.listing_type === 'rent' && (['day', 'week'].includes(property.price_period) || /short.stay|hotel\s*\/\s*guesthouse/i.test(property.property_type || ''));

function BrandSymbol({ className = '' }) {
  return <img className={className} src="/yemilaz-mark.svg?v=4" alt="" aria-hidden="true" draggable="false"/>;
}

function BrandLockup({ name, className = '' }) {
  return <div className={`brand-lockup ${className}`}><BrandSymbol/><span><b>{brandName(name)}</b><small>PROPERTY MANAGEMENT</small></span></div>;
}

function PropertyHelpAssistant() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([{ from: 'assistant', text: 'Hello! I can help you find your way around Yemilaz Properties. What would you like to know?' }]);
  const threadRef = useRef(null);
  useEffect(() => { if (open && threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; }, [messages, open]);
  const prompts = ['Find a property', 'Create an account', 'Send a complaint', 'Manage my property'];
  function answer(question) {
    const q = question.toLowerCase();
    if (/pay|fee|deposit|rent due|refund|payment/.test(q)) return 'Check the written agreement for the amount, due date, payee and refund conditions, and request a receipt for every payment. Yemilaz Properties listings are not payment instructions; verify payment details directly with the authorized property representative.';
    if (/manage|management|dashboard|portfolio|workspace/.test(q)) return 'Property owners can use their account to manage listings, properties, tenants, staff, documents, maintenance, messages and complaints. Choose Property portal to sign in. If you need a different role later, submit an account upgrade request with supporting documents for administrator review.';
    if (/account|sign.?up|register|tenant|agent|caretaker|lawyer/.test(q)) return 'Choose Property portal, then create an account and select the profile that fits you. Tenants and property professionals can be linked to a property by its owner or manager. If you need a different role later, submit an account upgrade request with supporting documents for administrator review.';
    if (/complain|complaint|repair|maintenance|issue/.test(q)) return 'You can lodge a complaint from the Complaint room or your signed-in property account. Choose the property and the relevant recipient. Replies and unread complaint messages appear in your case list and notifications.';
    if (/message|notification|reply/.test(q)) return 'Use Property conversations in your account to message the linked people for a property. New replies and complaint updates appear in Notifications; open the conversation to read them.';
    if (/document|pdf|sign|agreement|download/.test(q)) return 'Signed-in users can review and download documents shared with their account from the tenancy documents or shared property files area. If a document is missing, ask the property manager to confirm it was linked to your profile.';
    if (/staff|team|permission|role/.test(q)) return 'Property owners and administrators can invite staff and assign access according to their responsibilities. Give each person only the access they need, and review or remove access when their work changes.';
    if (/help|contact|person|human|support/.test(q)) return 'You can reach the support team at hello@yemilazproperties.com. For a property-specific dispute, use the private complaint room so the relevant participants can follow the case.';
    if (/find|search|listing|rent|buy|sale|property|home|shop|office|warehouse|farm|land/.test(q)) return 'Browse available homes, shops, offices, warehouses, land and farms from “Find a property” on the homepage. Open a listing to review its details and contact the advertiser. Confirm price, ownership and terms independently before making a payment.';
    return 'I can help with property listings, account types, messages, complaints, tenancy documents, payments and property management. You can also email hello@yemilazproperties.com for further assistance.';
  }
  function send(value = draft) {
    const text = value.trim();
    if (!text) return;
    setMessages((current) => [...current, { from: 'you', text }, { from: 'assistant', text: answer(text) }]);
    setDraft('');
  }
  return <aside className={`property-help-assistant ${open ? 'is-open' : ''}`} aria-label="Yemilaz help assistant">
    {open && <section className="assistant-panel" aria-label="Chat with the help assistant">
      <header className="assistant-header"><span className="assistant-avatar"><Sparkles size={17}/></span><span><b>Yemilaz Help</b><small><i/> Here to guide you</small></span><button type="button" aria-label="Close assistant" onClick={() => setOpen(false)}><X size={18}/></button></header>
      <div className="assistant-thread" ref={threadRef} aria-live="polite">{messages.map((message, index) => <p className={`assistant-message ${message.from}`} key={`${index}-${message.from}`}>{message.text}</p>)}</div>
      {messages.length === 1 && <div className="assistant-prompts">{prompts.map((prompt) => <button type="button" key={prompt} onClick={() => send(prompt)}>{prompt}</button>)}</div>}
      <form className="assistant-compose" onSubmit={(event) => { event.preventDefault(); send(); }}><input aria-label="Ask a question" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask a question…" maxLength={500}/><button type="submit" aria-label="Send question" disabled={!draft.trim()}><ArrowRight size={17}/></button></form>
      <div className="assistant-footnote">Need a person? <a href="mailto:hello@yemilazproperties.com">Email support</a><br/>For urgent safety concerns, contact local emergency services.</div>
    </section>}
    <button type="button" className="assistant-launcher" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span className="assistant-launcher-icon">{open ? <X size={19}/> : <MessageCircle size={19}/>}</span><span>{open ? 'Close help' : 'How can we help?'}</span></button>
  </aside>;
}

function BrandWatermark() {
  return <div className="brand-watermark" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <BrandSymbol key={index}/>)}</div>;
}

function ScrollNavigation() {
  const [position, setPosition] = useState({ top: 0, bottom: false });
  useEffect(() => {
    const update = () => setPosition({ top: window.scrollY, bottom: window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24 });
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); observer.disconnect(); };
  }, []);
  return <div className="scroll-navigation" aria-label="Page navigation">
    {position.top > 180 && <button type="button" aria-label="Back to top" title="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp size={18}/><span>Top</span></button>}
    {!position.bottom && <button type="button" aria-label="Go to bottom" title="Go to bottom" onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}><ArrowDown size={18}/><span>Bottom</span></button>}
  </div>;
}

function AuthLoadingScreen({ onContinue }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setSlow(true), 3500); return () => window.clearTimeout(timer); }, []);
  return <main className="auth-loading-screen" aria-live="polite">
    <div className="auth-loading-card">
      <div className="auth-loading-logo"><BrandSymbol logo="horizon"/></div>
      <span className="eyebrow">YEMILAZ PROPERTIES</span>
      <h1>{slow ? 'Still connecting securely' : 'Preparing your property account'}</h1>
      <p>{slow ? 'The connection is taking longer than usual. You can continue and try signing in again when the network is ready.' : 'We’re checking your sign-in and loading the property information connected to your account.'}</p>
      <div className="auth-loading-track" role="progressbar" aria-label="Connecting"><span/></div>
      <small>{slow ? 'Please check your internet connection.' : 'This usually takes just a moment.'}</small>
      {slow && <button type="button" className="primary-button" onClick={onContinue}>Continue to sign in <ArrowRight size={16}/></button>}
    </div>
  </main>;
}

function BrandingFields({ profile, defaultBusinessName = 'Yemilaz Properties' }) {
  const [name, setName] = useState(profile?.business_name ?? defaultBusinessName);
  const [template, setTemplate] = useState(profile?.brand_template || 'jade');
  return <><div className="form-section-title">Your website identity</div>
    <label>Business / website name<input required name="business_name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Adeola Homes"/></label>
    <label>Professional colour template<select name="brand_template" value={template} onChange={(event) => setTemplate(event.target.value)}><option value="jade">Jade &amp; brass</option><option value="midnight">Midnight coast</option><option value="terracotta">Heritage clay</option><option value="plum">Orchid &amp; slate</option></select></label>
    <div className={`brand-preview theme-${template}`}><BrandLockup name={name || 'Your property brand'}/><span>Official Yemilaz Properties brand mark</span></div>
  </>;
}

const nav = [
  { title: 'Dashboard', links: [['Overview', LayoutDashboard, 'Dashboard']] },
  { title: 'Portfolio & tenancy', links: [['Properties', Building2], ['Tenants', Users], ['Rent schedule', CalendarDays, 'Rent & lease schedule'], ['Payments & charges', Wallet], ['Property insights', Sparkles, 'Portfolio insights']] },
  { title: 'Property operations', links: [['Maintenance', Wrench], ['Inspections', Check], ['Property incidents', ShieldCheck, 'Incident reports'], ['Property notices', Bell, 'Property updates'], ['Complaints', CircleHelp]] },
  { title: 'Lettings & enquiries', links: [['Short-let requests', CalendarDays, 'Short-stay enquiries'], ['Enquiries', FileText, 'Listing enquiries'], ['Public profile enquiries', MessageCircle, 'Public profile messages'], ['Property requests', FileText, 'Property wanted requests'], ['Viewing requests', CalendarDays], ['Viewing calendar', CalendarDays], ['Listing reports', ShieldCheck]] },
  { title: 'People & team', links: [['Guarantors', ShieldCheck], ['Caretakers', KeyRound], ['Agents', Users], ['Lawyers', ShieldCheck], ['Staff payments', Wallet]] },
  { title: 'Messages & records', links: [['Property messages', MessageCircle, 'Messages'], ['Notifications', Bell], ['Documents & signatures', PenLine, 'Agreements & signatures'], ['Property documents', FileText, 'Property files'], ['Email delivery', Bell, 'Document delivery']] },
  { title: 'Account & oversight', links: [['Landlord profile', UserRound], ['Community spotlight', Sparkles], ['Security & privacy', ShieldCheck], ['Tenant profile requests', UserRound, 'Tenant profile corrections'], ['Audit history', Clock3], ['Account upgrades', UserRound, 'Role change requests']] },
];
const navLabels = Object.fromEntries(nav.flatMap(({ links }) => links.map(([route, , label]) => [route, label || route])));
const portalRoleLabels = { landlord: 'Landlord', property_developer: 'Property developer', tenant: 'Tenant', agent: 'Agent', caretaker: 'Caretaker', lawyer: 'Lawyer', property_seeker: 'Property seeker', complainant: 'Community member' };

function AccountPortalSwitcher({ roles = [], activeRole, onSelect }) {
  if (roles.length < 2) return null;
  return <label className="account-portal-switcher"><span>Switch profile</span><select aria-label="Choose an account profile" value={activeRole} onChange={(event) => onSelect(event.target.value)}>{roles.map((item) => <option key={item.role} value={item.role}>{portalRoleLabels[item.role] || item.role}{item.role === activeRole ? ' · current' : ''}</option>)}</select><ChevronDown size={14}/></label>;
}

function scrollToPublicProfileSettings(attempt = 0) {
  const settings = document.getElementById('community-spotlight-settings');
  if (!settings) { if (attempt < 12) window.setTimeout(() => scrollToPublicProfileSettings(attempt + 1), 250); return; }
  settings.scrollIntoView({ behavior: 'smooth', block: 'center' });
  settings.focus({ preventScroll: true });
}

function App() {
  const [page, setPage] = useState(() => { const search = new URLSearchParams(window.location.search); return search.get('portal') === 'admin' ? (search.get('adminPage') || 'Overview') : 'Overview'; });
  const [tenants, setTenants] = useState([]);
  const [propertyRecords, setPropertyRecords] = useState([]);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [staffRecords, setStaffRecords] = useState([]);
  const [landlordProfile, setLandlordProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [authModal, setAuthModal] = useState(false);
  const [authRegistrationRole, setAuthRegistrationRole] = useState('');
  const [allocationTenant, setAllocationTenant] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All properties');
  const [auth, setAuth] = useState(null);
  const [authChecking, setAuthChecking] = useState(Boolean(supabase));
  const [accountRole, setAccountRole] = useState('landlord');
  const [accountPortals, setAccountPortals] = useState([]);
  const [stakeholderCases, setStakeholderCases] = useState([]);
  const [tenantAccount, setTenantAccount] = useState(null);
  const [staffAccount, setStaffAccount] = useState(null);
  const [staffAssignments, setStaffAssignments] = useState([]);
  const [tenantContacts, setTenantContacts] = useState([]);
  const [tenantDocuments, setTenantDocuments] = useState([]);
  const [tenantDocsBusy, setTenantDocsBusy] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isPlatformReviewer, setIsPlatformReviewer] = useState(false);
  const [platformPermissions, setPlatformPermissions] = useState([]);
  const [adminChecked, setAdminChecked] = useState(false);
  const [authNotice, setAuthNotice] = useState(null);
  const [signing, setSigning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialPaymentTotal, setInitialPaymentTotal] = useState(0);
  const [transactionActionId, setTransactionActionId] = useState(null);
  const [sendingTenant, setSendingTenant] = useState(null);
  const [downloadingTenant, setDownloadingTenant] = useState(null);
  const [toast, setToast] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [showComplaintRoom, setShowComplaintRoom] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [complaintMessages, setComplaintMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [mfaChallenge, setMfaChallenge] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    document.title = auth
      ? `${landlordProfile?.business_name || 'Yemilaz Properties'} · Yemilaz Properties`
      : 'Yemilaz Properties | Find your place';
  }, [auth, landlordProfile]);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    const sessionFailsafe = window.setTimeout(() => { if (active) setAuthChecking(false); }, 8000);
    const currentUrl = new URL(window.location.href);
    const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ''));
    const authError = hashParams.get('error_code') || hashParams.get('error');
    if (authError) {
      const expired = authError === 'otp_expired' || /expired|invalid/i.test(hashParams.get('error_description') || '');
      setAuthNotice({ kind: 'error', expired, message: expired ? 'This confirmation link has expired. Request a fresh Yemilaz Properties confirmation email below.' : 'We could not confirm this link. Check that it is complete, then request a fresh confirmation email.' });
      window.history.replaceState({}, document.title, `${currentUrl.pathname}${currentUrl.search}`);
    }
    const confirmationHash = currentUrl.searchParams.get('token_hash');
    if (currentUrl.searchParams.get('auth') === 'confirm' && confirmationHash) {
      supabase.auth.verifyOtp({ token_hash: confirmationHash, type: 'email' }).then(({ error }) => {
        if (!active) return;
        window.history.replaceState({}, document.title, currentUrl.pathname);
        setAuthNotice(error
          ? { kind: 'error', expired: true, message: 'This Yemilaz Properties confirmation link has expired or was already used. Request a fresh email below.' }
          : { kind: 'success', message: 'Your Yemilaz Properties landlord profile is confirmed. Your property dashboard is ready.' });
      });
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
        let user = data.session?.user || null; setAuth(user);
      if (!user) setAdminChecked(true);
      const joinRole = new URLSearchParams(window.location.search).get('join');
      if (!user && ['tenant', 'agent', 'caretaker', 'lawyer'].includes(joinRole)) setAuthModal(true);
      if (user) {
        const { data: activeAccount } = await supabase.rpc('is_platform_account_active');
        if (activeAccount === false) { await supabase.auth.signOut(); setAuth(null); setToast('This account is suspended. Contact Yemilaz Properties support.'); return; }
        const { data: admin } = await supabase.rpc('is_platform_admin');
        const { data: reviewer } = await supabase.rpc('is_platform_account_reviewer');
        const { data: permissions } = await supabase.rpc('get_my_platform_permissions');
        if (active) { setIsPlatformAdmin(admin === true); setIsPlatformReviewer(reviewer === true); setPlatformPermissions(permissions || []); setAdminChecked(true); }
        const [{ data: profile }, { data: portals }] = await Promise.all([
          supabase.from('stakeholder_profiles').select('user_id,role,staff_id').eq('user_id', user.id).maybeSingle(),
          supabase.rpc('get_my_portal_options'),
        ]);
        if (active) {
          const options = portals?.length ? portals : [{ role: profile?.role || user.user_metadata?.account_role || 'landlord', staff_id: profile?.staff_id || null }];
          setAccountPortals(options);
          const saved = window.localStorage.getItem(`yemilaz-active-portal:${user.id}`);
          setAccountRole(options.some((item) => item.role === saved) ? saved : options[0].role);
        }
      }
    }).finally(() => { if (active) { window.clearTimeout(sessionFailsafe); setAuthChecking(false); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuth(session?.user || null);
      if (session?.user) {
        supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(async ({data,error})=>{if(error||data?.nextLevel!=='aal2'||data?.currentLevel==='aal2')return;const {data:factors}=await supabase.auth.mfa.listFactors();const factor=factors?.totp?.find(item=>item.status==='verified');if(!factor)return;const {data:challenge}=await supabase.auth.mfa.challenge({factorId:factor.id});if(challenge)setMfaChallenge({factorId:factor.id,challengeId:challenge.id});});
        setAdminChecked(false);
        supabase.rpc('is_platform_account_active').then(async ({ data: activeAccount }) => { if (activeAccount === false) { await supabase.auth.signOut(); setToast('This account is suspended. Contact Yemilaz Properties support.'); } });
        Promise.all([supabase.rpc('is_platform_admin'),supabase.rpc('is_platform_account_reviewer'),supabase.rpc('get_my_platform_permissions')]).then(([{data:admin},{data:reviewer},{data:permissions}])=>{setIsPlatformAdmin(admin===true);setIsPlatformReviewer(reviewer===true);setPlatformPermissions(permissions||[]);setAdminChecked(true);});
        Promise.all([supabase.from('stakeholder_profiles').select('user_id,role,staff_id').eq('user_id', session.user.id).maybeSingle(), supabase.rpc('get_my_portal_options')]).then(([{ data: profile }, { data: portals }]) => {
          const options = portals?.length ? portals : [{ role: profile?.role || session.user.user_metadata?.account_role || 'landlord', staff_id: profile?.staff_id || null }];
          setAccountPortals(options);
          const saved = window.localStorage.getItem(`yemilaz-active-portal:${session.user.id}`);
          setAccountRole(options.some((item) => item.role === saved) ? saved : options[0].role);
        });
      } else { setIsPlatformAdmin(false); setIsPlatformReviewer(false); setPlatformPermissions([]); setAccountRole('landlord'); setAccountPortals([]); setAdminChecked(true); setMfaChallenge(null); }
      if (event === 'SIGNED_IN' && new URLSearchParams(window.location.search).get('auth') === 'confirmed') {
        setAuthNotice({ kind: 'success', message: 'Your Yemilaz Properties profile is confirmed. Your account is ready.' });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      if (event === 'PASSWORD_RECOVERY') setAuthNotice({ kind: 'reset', message: 'Choose a new password for your Yemilaz Properties account.' });
    });
    return () => { active = false; window.clearTimeout(sessionFailsafe); subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    if (auth && accountRole === 'tenant') {
      setTenants([]); setPaymentRecords([]); setStaffRecords([]); setLandlordProfile(null); setStaffAccount(null); setStaffAssignments([]);
      const loadTenantProperty = async () => {
        const member = accountPortals.find((item) => item.role === 'tenant');
        let tenantQuery = supabase.from('tenants').select('property_id');
        tenantQuery = member?.tenant_id ? tenantQuery.eq('id', member.tenant_id) : tenantQuery.ilike('email', auth.email).order('created_at', { ascending: false }).limit(1);
        const { data: tenant, error } = await tenantQuery.maybeSingle();
        if (!active) return;
        if (error) { setToast(error.message); return; }
        if (!tenant?.property_id) { setPropertyRecords([]); return; }
        const { data: property, error: propertyError } = await supabase.from('properties').select('id,name,address,city,state,country,property_type,property_size,intended_use,price,price_period,bedrooms,bathrooms,description,status').eq('id', tenant.property_id).maybeSingle();
        if (!active) return;
        if (propertyError) setToast(propertyError.message); else setPropertyRecords(property ? [property] : []);
      };
      loadTenantProperty();
      return () => { active = false; };
    }
    if (auth && ['agent', 'caretaker', 'lawyer'].includes(accountRole)) {
      setTenants([]); setPaymentRecords([]); setStaffRecords([]); setLandlordProfile(null); setTenantAccount(null);
      const loadStaffWorkspace = async () => {
        const member = accountPortals.find((item) => item.role === accountRole);
        const { data: profile, error: profileError } = member?.staff_id
          ? { data: { staff_id: member.staff_id }, error: null }
          : await supabase.from('stakeholder_profiles').select('staff_id').eq('user_id', auth.id).eq('role', accountRole).maybeSingle();
        if (!active) return;
        if (profileError || !profile?.staff_id) { setToast(profileError?.message || 'Your staff profile is not linked yet. Ask the landlord to resend your invitation.'); return; }
        const { data: staff, error: staffError } = await supabase.from('staff').select('id,owner_id,full_name,role,email,phone,permanent_address,property_id,notes').eq('id', profile.staff_id).maybeSingle();
        if (!active) return;
        if (staffError || !staff) { setToast(staffError?.message || 'Your staff record could not be found.'); return; }
        setStaffAccount(staff);
        const assignmentsQuery = supabase.from('tenants').select('id,full_name,email,phone,property_id,lease_start,lease_end,status').order('full_name');
        const assignmentField = staff.role === 'agent' ? 'agent_id' : staff.role === 'caretaker' ? 'caretaker_id' : 'lawyer_id';
        const { data: assignments, error: assignmentError } = await assignmentsQuery.eq(assignmentField, staff.id);
        if (!active) return;
        if (assignmentError) { setToast(assignmentError.message); return; }
        const rows = assignments || []; setStaffAssignments(rows);
        const ids = [...new Set([staff.property_id, ...rows.map((item) => item.property_id)].filter(Boolean))];
        if (!ids.length) { setPropertyRecords([]); return; }
        const { data: assignedProperties, error: propertyError } = await supabase.from('properties').select('id,name,address,city,state,country,status').in('id', ids);
        if (active) { if (propertyError) setToast(propertyError.message); else setPropertyRecords(assignedProperties || []); }
      };
      loadStaffWorkspace();
      return () => { active = false; };
    }
    if (auth && ['stakeholder','property_seeker','complainant'].includes(accountRole)) {
      setTenants([]); setPaymentRecords([]); setStaffRecords([]); setLandlordProfile(null); setStaffAccount(null); setStaffAssignments([]); setTenantAccount(null);
      supabase.from('properties').select('id,owner_id,name,address,city,state,country,listing_type,property_type,property_size,intended_use,price,price_period,bedrooms,bathrooms,description,amenities,image_url,image_urls,status,is_advertised,verification_status,viewing_notes,view_count')
        .then(({ data }) => { if (active) setPropertyRecords(data || []); });
      return () => { active = false; };
    }
    const fields = auth
      ? '*'
      : 'id,owner_id,name,address,city,state,country,latitude,longitude,listing_type,property_type,property_size,intended_use,price,price_period,bedrooms,bathrooms,description,amenities,image_url,image_urls,status,is_advertised,verification_status,viewing_notes,view_count';
    let request = supabase.from('properties').select(fields).order('created_at', { ascending: false });
    request = auth
      ? request.eq('owner_id', auth.id)
      : request.in('status', ['available','reserved']).eq('is_advertised', true);
    request.then(({ data, error }) => {
      if (!active) return;
      if (error) { if (auth) setToast(error.message); return; }
      setPropertyRecords(data || []);
    });
    if (auth) {
      Promise.all([
        supabase.from('tenants').select('*').eq('owner_id', auth.id).order('created_at', { ascending: false }),
        supabase.from('service_charges').select('*').eq('owner_id', auth.id).order('created_at', { ascending: false }),
        supabase.from('staff').select('*').eq('owner_id', auth.id).order('full_name'),
        supabase.from('landlord_profiles').select('*').eq('user_id', auth.id).maybeSingle(),
      ]).then(([tenantResult, paymentResult, staffResult, profileResult]) => {
        if (!active) return;
        if (tenantResult.error) setToast(tenantResult.error.message);
        else setTenants(tenantResult.data || []);
        if (paymentResult.error) setToast(paymentResult.error.message);
        else setPaymentRecords(paymentResult.data || []);
        if (!staffResult.error) setStaffRecords(staffResult.data || []);
        if (profileResult.error) setToast(profileResult.error.message);
        else setLandlordProfile(profileResult.data);
      });
    } else {
      setTenants([]);
      setPaymentRecords([]);
    }
    return () => { active = false; };
  }, [auth, accountRole, accountPortals]);

  useEffect(() => {
    if (!auth || !supabase) { setNotifications([]); return undefined; }
    let active = true;
    const refresh = () => supabase.from('user_notifications').select('*').eq('user_id', auth.id).order('created_at', { ascending: false }).limit(100)
      .then(({ data, error }) => { if (active && !error) setNotifications(data || []); });
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [auth?.id, accountRole, page]);

  useEffect(() => {
    if (!auth || !supabase) return undefined;
    const check = async () => {
      const { data, error } = await supabase.rpc('is_platform_account_active');
      if (!error && data === false) { await supabase.auth.signOut(); setToast('This account has been suspended by Yemilaz Properties administration.'); }
    };
    const timer = window.setInterval(check, 30000);
    return () => window.clearInterval(timer);
  }, [auth?.id]);

  async function markNotificationRead(item) {
    if (!auth || !supabase) return;
    const { error } = await supabase.from('user_notifications').update({ read_at: new Date().toISOString() }).eq('id', item.id).eq('user_id', auth.id);
    if (!error) setNotifications((current) => current.map((notice) => notice.id === item.id ? { ...notice, read_at: new Date().toISOString() } : notice));
  }

  async function markComplaintNotificationsRead(complaintId) {
    if (!auth || !supabase || !complaintId) return;
    const unread = notifications.filter((notice) => notice.category === 'complaint_message' && notice.target_id === complaintId && !notice.read_at);
    if (!unread.length) return;
    const readAt = new Date().toISOString();
    const ids = unread.map((notice) => notice.id);
    const { error } = await supabase.from('user_notifications').update({ read_at: readAt }).in('id', ids).eq('user_id', auth.id);
    if (!error) setNotifications((current) => current.map((notice) => ids.includes(notice.id) ? { ...notice, read_at: readAt } : notice));
  }

  const complaintUnreadCounts = useMemo(() => notifications.reduce((counts, notice) => {
    if (notice.category === 'complaint_message' && !notice.read_at && notice.target_id) counts[notice.target_id] = (counts[notice.target_id] || 0) + 1;
    return counts;
  }, {}), [notifications]);

  async function setAccountStatus(person) {
    if (!person.user_id) { setToast('No login account is linked to this directory record yet.'); return; }
    const next = person.account_status === 'suspended' ? 'active' : 'suspended';
    const reason = next === 'suspended' ? window.prompt(`Reason for suspending ${person.full_name || person.email || 'this account'}?`) : null;
    if (next === 'suspended' && reason === null) return;
    if (next === 'suspended' && !reason.trim()) { setToast('Enter a reason before suspending this account.'); return; }
    const { error } = await supabase.rpc('set_platform_account_status', { p_user_id: person.user_id, p_status: next, p_reason: reason });
    if (error) { setToast(error.message); return; }
    setToast(next === 'suspended' ? 'Account suspended. They will be signed out on their next session check.' : 'Account reactivated.');
  }

  useEffect(() => {
    if (!auth || !['stakeholder', 'tenant', 'agent', 'caretaker','lawyer','property_seeker','complainant'].includes(accountRole) || !supabase) { setStakeholderCases([]); setTenantAccount(null); setTenantContacts([]); return; }
    const refresh = () => supabase.from('property_complaints').select('*').or(`authenticated_reporter_id.eq.${auth.id},other_participant_id.eq.${auth.id}`).order('created_at', { ascending: false })
      .then(({ data, error }) => { if (error) setToast(error.message); else setStakeholderCases(data || []); });
    if (accountRole === 'tenant') {
      const membership = accountPortals.find((item) => item.role === 'tenant');
      let tenantQuery = supabase.from('tenants').select('*');
      tenantQuery = membership?.tenant_id ? tenantQuery.eq('id', membership.tenant_id) : tenantQuery.ilike('email', auth.email).order('created_at', { ascending: false }).limit(1);
      tenantQuery.maybeSingle().then(async ({ data, error }) => {
      if (error) { setToast(error.message); return; }
      setTenantAccount(data || null);
      const { data: contacts, error: contactsError } = await supabase.rpc('list_tenant_complaint_recipients');
      if (contactsError) setToast(contactsError.message);
      else setTenantContacts((contacts || []).map((contact) => ({ ...contact, id: contact.user_id })));
      });
    }
    refresh(); const timer = window.setInterval(refresh, 12000);
    return () => window.clearInterval(timer);
  }, [auth, accountRole, accountPortals]);

  async function registerLandlord(event) {
    event.preventDefault();
    if (!supabase) { setToast('Yemilaz Properties sign-up is temporarily unavailable. Please try again later.'); return; }
    setSigning(true);
    const form = new FormData(event.currentTarget);
    const accountRoleForSignup = form.get('account_role') || 'landlord';
    const inviteCode = String(form.get('invite_code') || '').trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: form.get('email'), password: form.get('password'),
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}?auth=confirmed`,
        data: { account_role: accountRoleForSignup, stakeholder_kind: form.get('stakeholder_kind') || 'stakeholder', full_name: form.get('full_name'), phone: form.get('phone'), permanent_address: form.get('permanent_address'), business_name: form.get('business_name') || 'Yemilaz Properties', brand_template: form.get('brand_template') || 'jade', brand_logo: form.get('brand_logo') || 'horizon', invite_code: inviteCode },
      },
    });
    setSigning(false);
    const duplicateAccount = Boolean(data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)
      || Boolean(error && /already registered|already exists|user exists|duplicate user/i.test(error.message || ''));
    if (duplicateAccount) return { existingAccount: true, email: String(form.get('email') || '').trim(), role: accountRoleForSignup === 'stakeholder' && form.get('stakeholder_kind') === 'stakeholder' ? 'complainant' : form.get('stakeholder_kind') || accountRoleForSignup };
    if (error) setToast(/tenant record|matching staff invitation|email address/i.test(error.message) ? 'We could not match this signup to a landlord’s tenant or staff record. Open the latest invitation and use its email address.' : accountRoleForSignup === 'landlord' && /database error|invite|access code/i.test(error.message) ? 'That landlord access code is invalid, expired, or already used. Ask the platform administrator for a new code.' : 'We could not create this Yemilaz Properties account. Check the details and try again.');
    else { setAuthModal(false); setAuthNotice({ kind: 'pending', message: 'We have sent a confirmation email from Yemilaz Properties. Confirm your email to activate your account.' }); }
  }

  async function resendConfirmation(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    if (!supabase || !email) return;
    setSigning(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}?auth=confirmed` } });
    setSigning(false);
    if (error) setToast('We could not resend the Yemilaz Properties confirmation email. Check the address or try again later.');
    else setAuthNotice({ kind: 'pending', message: 'A new confirmation email has been requested from Yemilaz Properties. Use the newest message in your inbox.' });
  }

  async function saveLandlordProfile(event) {
    event.preventDefault();
    if (!auth || !supabase) return;
    const form = new FormData(event.currentTarget);
    const profile = {
      user_id: auth.id, full_name: form.get('full_name'), business_name: form.get('business_name'),
      brand_template: form.get('brand_template') || 'jade', brand_logo: form.get('brand_logo') || 'horizon',
      phone: form.get('phone') || null, business_address: form.get('business_address') || null,
      lawyer_name: form.get('lawyer_name') || null, lawyer_email: form.get('lawyer_email') || null,
      allow_direct_tenant_complaints: form.get('allow_direct_tenant_complaints') === 'on',
      agreement_terms: form.get('agreement_terms'), house_rules: form.get('house_rules'), receive_wanted_requests: form.get('receive_wanted_requests') === 'on', updated_at: new Date().toISOString(),
    };
    setSaving(true);
    const { data, error } = await supabase.from('landlord_profiles').upsert(profile).select().single();
    setSaving(false);
    if (error) { setToast(error.message); return; }
    setLandlordProfile(data); setToast('Landlord profile and document templates saved.');
  }

  async function sendTenantPackets(tenantId) {
    if (!import.meta.env.VITE_DOCUMENT_API_URL) { setToast('Set VITE_DOCUMENT_API_URL and deploy the Node document service before sending PDFs.'); return; }
    if (!supabase) return;
    setSendingTenant(tenantId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_DOCUMENT_API_URL.replace(/\/$/, '')}/api/tenant-packets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ tenantId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not send tenant documents');
      const sent = result.deliveries.filter((item) => item.status === 'sent').length;
      const failed = result.deliveries.filter((item) => item.status === 'failed');
      setToast(`${sent} individual PDF email${sent === 1 ? '' : 's'} sent${failed.length ? `; failed for ${failed.map((item) => item.role).join(', ')}` : ''}.`);
    } catch (sendError) {
      setToast(sendError.message === 'Failed to fetch'
        ? 'Cannot reach the PDF service. Check that Render is Live and its FRONTEND_ORIGINS exactly matches this website, then open the service /health address.'
        : `PDF delivery failed: ${sendError.message}`);
    } finally { setSendingTenant(null); }
  }

  async function sendRecordDocument(event) {
    if (!import.meta.env.VITE_DOCUMENT_API_URL || !supabase) return { ok: false, error: 'PDF email service is not configured.' };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return { ok: false, error: 'Your sign-in session has expired.' };
      const response = await fetch(`${import.meta.env.VITE_DOCUMENT_API_URL.replace(/\/$/, '')}/api/record-document`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ event }),
      });
      const result = await response.json();
      if (!response.ok) return { ok: false, error: result.error || 'PDF copy could not be created.' };
      const failed = (result.recipients || []).filter((recipient) => recipient.status !== 'sent');
      return { ok: !failed.length, title: result.title, error: failed.length ? `PDF saved, but email failed for ${failed.map((recipient) => recipient.email).join(', ')}.` : '' };
    } catch (error) {
      return { ok: false, error: error.message === 'Failed to fetch' ? 'The PDF email service could not be reached.' : error.message };
    }
  }

  function paymentDocumentEvent(charge, tenant, type = 'payment') {
    const paid = charge.status === 'paid';
    return {
      type,
      title: type === 'payment_update' ? 'Payment record updated' : paid ? 'Payment receipt' : 'Payment charge record',
      summary: `${charge.description || 'Property payment'} has been recorded as ${String(charge.status || 'unpaid').replaceAll('_', ' ')}. This record is for ${tenant?.full_name || 'the property account'}.`,
      tenantId: charge.tenant_id || tenant?.id || null, propertyId: charge.property_id || tenant?.property_id || null,
      details: [
        { label: 'Description', value: charge.description || 'Property payment' },
        { label: 'Category', value: charge.category || 'other' },
        { label: 'Amount', value: currency(charge.amount) },
        { label: 'Record status', value: String(charge.status || 'unpaid').replaceAll('_', ' ') },
        { label: 'Due date', value: charge.due_date ? dateLabel(charge.due_date) : 'Not specified' },
        { label: 'Payment date', value: charge.paid_at ? dateLabel(charge.paid_at) : 'Not paid / not recorded' },
        ...(charge.period_start || charge.period_end ? [{ label: 'Payment period', value: `${charge.period_start ? dateLabel(charge.period_start) : 'Not specified'} to ${charge.period_end ? dateLabel(charge.period_end) : 'Not specified'}` }] : []),
      ],
    };
  }

  async function notifyTenantTeamAssignment(tenantId, previousStaffIds = []) {
    if (!import.meta.env.VITE_DOCUMENT_API_URL || !supabase) return { ok: false, error: 'Email service URL is not configured.' };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return { ok: false, error: 'Your sign-in session has expired.' };
      const response = await fetch(`${import.meta.env.VITE_DOCUMENT_API_URL.replace(/\/$/, '')}/api/tenant-assignment-notifications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ tenantId, previousStaffIds }),
      });
      const result = await response.json();
      if (!response.ok) return { ok: false, error: result.error || 'Email notifications could not be sent.' };
      return result.failed?.length ? { ok: false, sent: result.sent || 0, error: `Email could not be delivered to ${result.failed.map((item) => item.email).join(', ')}.` } : { ok: true, sent: result.sent || 0 };
    } catch (error) { return { ok: false, error: error.message === 'Failed to fetch' ? 'The email service could not be reached.' : error.message }; }
  }

  async function sendProfileInvitation(role, recordId) {
    if (!import.meta.env.VITE_DOCUMENT_API_URL || !supabase) {
      setToast('The person was saved, but profile invitations need the Render email service URL configured.'); return false;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Please sign in again before sending an invitation.');
      const response = await fetch(`${import.meta.env.VITE_DOCUMENT_API_URL.replace(/\/$/, '')}/api/profile-invitations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ role, recordId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The invitation could not be sent.');
      setToast(`Signup invitation sent to ${result.email}.`); return true;
    } catch (error) {
      setToast(error.message === 'Failed to fetch'
        ? 'The person was saved, but the Render email service could not be reached. Check that the service is Live and FRONTEND_ORIGINS includes this website.'
        : `The person was saved, but the invitation email failed: ${error.message}`);
      return false;
    }
  }

  async function downloadTenantPdfs(tenantId) {
    if (!import.meta.env.VITE_DOCUMENT_API_URL || !supabase) { setToast('Set up the Node document service before downloading PDFs.'); return; }
    setDownloadingTenant(tenantId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_DOCUMENT_API_URL.replace(/\/$/, '')}/api/tenant-packets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ tenantId, action: 'download' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not generate PDFs');
      const bytes = Uint8Array.from(atob(result.zipBase64), (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = result.filename || `Yemilaz-tenant-documents-${tenantId}.zip`;
      document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
      setToast(`Document pack downloaded: ${result.documentCount || 'multiple'} tenancy PDFs, ${result.copyCount || 'multiple'} recipient copies, and ${result.receiptCount ?? 0} payment receipts.`);
    } catch (downloadError) {
      setToast(downloadError.message === 'Failed to fetch'
        ? 'Cannot reach the PDF service. Check that Render is Live and its FRONTEND_ORIGINS exactly matches this website, then open the service /health address.'
        : `PDF generation failed: ${downloadError.message}`);
    }
    finally { setDownloadingTenant(null); }
  }

  async function downloadTenantPortalDocuments() {
    if (!tenantAccount?.id || !import.meta.env.VITE_DOCUMENT_API_URL || !supabase) { setToast('Your tenancy document pack is not available yet. Ask your landlord to finish setup.'); return; }
    setTenantDocsBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_DOCUMENT_API_URL.replace(/\/$/, '')}/api/tenant-packets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ tenantId: tenantAccount.id, action: 'tenant-download' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not prepare your documents');
      const bytes = Uint8Array.from(atob(result.zipBase64), (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = result.filename || 'Yemilaz-tenancy-documents.zip';
      document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
      setToast(`Your document pack is ready: ${result.documentCount} documents and ${result.receiptCount} receipts.`);
    } catch (error) { setToast(`Could not download documents: ${error.message}`); }
    finally { setTenantDocsBusy(false); }
  }

  useEffect(() => {
    if (!auth || !supabase) { setRecords([]); return; }
    if (page === 'Properties') { setRecords(propertyRecords); return; }
    if (page === 'Payments & charges') { setRecords(paymentRecords); return; }
    const table = { Guarantors: 'guarantors', Caretakers: 'staff', Agents: 'staff', Lawyers: 'staff', 'Staff payments': 'staff_payment_records', Enquiries: 'property_enquiries', 'Public profile enquiries': 'public_profile_messages', 'Short-let requests': 'property_enquiries', 'Property requests': 'property_wanted_requests', 'Viewing requests': 'property_viewing_requests', 'Viewing calendar': 'property_viewing_requests', 'Listing reports': 'property_listing_reports', Complaints: 'property_complaints', Maintenance: 'maintenance_requests' }[page];
    if (!table) { setRecords([]); return; }
    if (page === 'Short-let requests') {
      const ids = propertyRecords.filter(isShortLetProperty).map((property) => property.id);
      if (!ids.length) { setRecords([]); return; }
    }
    let request = supabase.from(table).select('*').order('created_at', { ascending: false });
    if (!['Complaints','Property requests','Public profile enquiries'].includes(page)) request = request.eq('owner_id', auth.id);
    if (page === 'Public profile enquiries') request = request.eq('profile_user_id', auth.id);
    if (page === 'Short-let requests') request = request.in('property_id', propertyRecords.filter(isShortLetProperty).map((property) => property.id));
    if (page === 'Caretakers') request = request.eq('role', 'caretaker');
    if (page === 'Agents') request = request.eq('role', 'agent');
    if (page === 'Lawyers') request = request.eq('role', 'lawyer');
    if (page === 'Complaints' && !isPlatformAdmin && !platformPermissions.includes('complaints_read')) request = request.eq('landlord_id', auth.id);
    request.then(({ data, error }) => { if (error) setToast(error.message); else setRecords((data || []).map((item) => ({ ...item, property_name: propertyRecords.find((property) => property.id === item.property_id)?.name || 'Property listing', staff_name: staffRecords.find((staff) => staff.id === item.staff_id)?.full_name || 'Team member', tenant_name: tenants.find((tenant) => tenant.id === item.tenant_id)?.full_name || '—' }))); });
  }, [auth, page, propertyRecords, paymentRecords, staffRecords, tenants, isPlatformAdmin, platformPermissions]);

  useEffect(() => {
    if (!auth || !adminChecked || new URLSearchParams(window.location.search).get('portal') !== 'admin' || isPlatformAdmin) return;
    const firstWorkPage = platformPermissions.includes('listing_verification') ? 'Listing verification' : platformPermissions.includes('complaints_read') ? 'Complaints' : 'Account upgrade review';
    setPage(firstWorkPage);
  }, [auth, adminChecked, isPlatformAdmin, platformPermissions]);

  useEffect(() => {
    if (!activeComplaint || !supabase) { setComplaintMessages([]); return; }
    const refresh = () => supabase.from('property_complaint_messages').select('*').eq('complaint_id', activeComplaint.id).order('created_at')
      .then(({ data, error }) => { if (error) setToast(error.message); else setComplaintMessages(data || []); });
    refresh(); const timer = window.setInterval(refresh, 7000);
    return () => window.clearInterval(timer);
  }, [activeComplaint]);

  async function addComplaintMessage(event) {
    event.preventDefault();
    if (!auth || !activeComplaint) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const { data, error } = await supabase.from('property_complaint_messages').insert({ complaint_id: activeComplaint.id, sender_id: auth.id, message: form.get('message') }).select().single();
    if (error) { setToast(error.message); return; }
    setComplaintMessages((current) => [...current, data]); formElement.reset();
  }

  async function changeComplaintResolution(action) {
    if (!activeComplaint) return;
    const rpcName = action === 'approve' ? 'approve_complaint_resolution' : action === 'rework' ? 'request_complaint_rework' : 'propose_complaint_resolution';
    const { error } = await supabase.rpc(rpcName, { p_complaint_id: activeComplaint.id });
    if (error) { setToast(error.message); return; }
    const { data } = await supabase.from('property_complaints').select('*').eq('id', activeComplaint.id).single();
    setActiveComplaint(data); setRecords((current) => current.map((item) => item.id === data.id ? data : item));
    setToast(action === 'approve' ? 'Resolution approved. The complaint is closed.' : action === 'rework' ? 'The case is reopened for further discussion.' : 'Resolution proposed. The other participant must approve it.');
  }

  const availableProperties = propertyRecords.filter((property) => property.status === 'available');
  const todayISO = localDateISO();
  const renewalCutoffISO = addDaysISO(todayISO, 30);
  const tenantProperty = (tenant) => propertyRecords.find((property) => property.id === tenant.property_id);
  const paidForTenant = (tenantId) => paymentRecords.some((payment) => payment.tenant_id === tenantId && payment.status === 'paid');
  const visibleTenants = useMemo(() => tenants.map((tenant) => ({
    ...tenant,
    name: tenant.full_name,
    initials: initials(tenant.full_name),
    property: tenantProperty(tenant)?.name || tenant.notes || 'Not allocated',
    assignedTeam: [
      tenant.agent_id && staffRecords.find((person) => person.id === tenant.agent_id) ? `Agent: ${staffRecords.find((person) => person.id === tenant.agent_id).full_name}` : null,
      tenant.caretaker_id && staffRecords.find((person) => person.id === tenant.caretaker_id) ? `Caretaker: ${staffRecords.find((person) => person.id === tenant.caretaker_id).full_name}` : null,
      tenant.lawyer_id && staffRecords.find((person) => person.id === tenant.lawyer_id) ? `Lawyer: ${staffRecords.find((person) => person.id === tenant.lawyer_id).full_name}` : null,
    ].filter(Boolean).join(' · ') || 'No assigned team member',
    date: dateLabel(tenant.lease_start),
    rent: currency(tenant.rent_amount),
    displayStatus: tenant.status === 'active' && tenant.lease_end && tenant.lease_end < todayISO ? 'Lease ended · review' : tenant.status === 'active' && tenant.lease_end && tenant.lease_end <= renewalCutoffISO ? 'Renewal due' : tenant.status === 'active' ? 'Active' : tenant.status === 'pending' ? 'Pending' : 'Inactive',
  })), [tenants, propertyRecords, staffRecords, todayISO, renewalCutoffISO]);
  const leasesNeedingRenewal = tenants.filter((tenant) => tenant.status === 'active' && tenant.lease_end && tenant.lease_end >= todayISO && tenant.lease_end <= renewalCutoffISO);
  const leasesPastEnd = tenants.filter((tenant) => tenant.status === 'active' && tenant.lease_end && tenant.lease_end < todayISO);
  const overdueRent = paymentRecords.filter((record) => record.category === 'rent' && record.status === 'unpaid' && record.due_date && record.due_date < todayISO);
  const overdueRentTotal = overdueRent.reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const otherUnpaidCharges = paymentRecords.filter((record) => record.category !== 'rent' && record.status === 'unpaid');
  const otherUnpaidTotal = otherUnpaidCharges.reduce((sum, record) => sum + Number(record.amount || 0), 0);

  async function login(event, adminOnly = false, additionalProfileRole = null) {
    event.preventDefault();
    if (!supabase) { setToast('Yemilaz Properties sign-in is temporarily unavailable. Please try again later.'); return; }
    setSigning(true);
    const form = new FormData(event.currentTarget);
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.get('email'), password: form.get('password') });
    setSigning(false);
    if (error) setToast('Those Yemilaz Properties sign-in details could not be verified. Check your email and password.');
    else {
      const { data: activeAccount, error: statusError } = await supabase.rpc('is_platform_account_active');
      if (statusError || activeAccount !== true) {
        await supabase.auth.signOut(); setAuth(null);
        setToast(statusError ? 'Account status could not be verified. Please try again shortly.' : 'This account is suspended. Contact Yemilaz Properties support.');
        return;
      }
    }
    if (!error && adminOnly) {
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_platform_admin');
      const { data: workPermissions, error: permissionsError } = await supabase.rpc('get_my_platform_permissions');
      const { data: reviewerAccess, error: reviewerError } = await supabase.rpc('is_platform_account_reviewer');
      if (adminError || permissionsError || reviewerError || (isAdmin !== true && !(workPermissions || []).length && reviewerAccess !== true)) {
        await supabase.auth.signOut();
        setAuth(null); setIsPlatformAdmin(false); setAdminChecked(true);
        setToast('Access denied. This account has not been granted platform administrator or staff work access.');
      } else {
        setIsPlatformAdmin(isAdmin === true); setPlatformPermissions(workPermissions || []); setIsPlatformReviewer(reviewerAccess === true); setAdminChecked(true); setAuth(data.user); setAuthModal(false);
        setToast('Signed in to Yemilaz Properties administration.');
      }
    } else if (!error && additionalProfileRole) {
      setToast(''); setAuth(data.user); setAuthModal(false);
      const destination = new URL(window.location.href);
      destination.searchParams.set('portal', 'account');
      destination.searchParams.set('section', 'add-profile');
      destination.searchParams.set('requestedRole', additionalProfileRole);
      window.location.replace(destination);
    } else if (!error) {
      setToast('');
      setAuthModal(false);
      const destination = new URL(window.location.href);
      destination.searchParams.delete('portal');
      window.location.replace(destination);
    }
  }

  async function requestPasswordReset(email) {
    if (!supabase || !email) { setToast('Enter your account email first.'); return; }
    setSigning(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${window.location.pathname}?auth=reset` });
    setSigning(false);
    if (error) setToast('We could not send a password reset email. Check the email address and try again.');
    else { setAuthModal(false); setAuthNotice({ kind: 'pending', message: 'If an account exists for that address, we have sent a password reset link.' }); }
  }

  async function saveNewPassword(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('new_password') || '');
    if (password.length < 8 || password !== form.get('confirm_password')) { setToast('Use at least 8 characters and make sure both passwords match.'); return; }
    setSigning(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSigning(false);
    if (error) setToast('We could not update your password. Request a fresh reset email and try again.');
    else setAuthNotice({ kind: 'password-success', message: 'Your password has been updated.' });
  }

  function updateInitialPaymentTotal(formElement) {
    if (!['Tenants', 'Overview'].includes(page)) return;
    const form = new FormData(formElement);
    const rent = Number(form.get('initial_rent_payment') || 0);
    const deposit = Number(form.get('initial_deposit_payment') || 0);
    const amounts = form.getAll('move_in_charge_amount').map((value) => Number(value || 0));
    const statuses = form.getAll('move_in_charge_status').map(String);
    setInitialPaymentTotal(rent + deposit + amounts.reduce((sum, amount, index) => sum + (statuses[index] === 'paid' ? amount : 0), 0));
  }

  async function addTenant(event) {
    event.preventDefault();
    if (!auth || !supabase) { setToast('Sign in before saving tenant records.'); return; }
    const form = new FormData(event.currentTarget);
    const name = String(form.get('full_name')).trim();
    const propertyId = String(form.get('property_id') || '') || null;
    const amount = Number(form.get('rent_amount'));
    const firstRentPayment = Number(form.get('initial_rent_payment') || 0);
    const firstDepositPayment = Number(form.get('initial_deposit_payment') || 0);
    const rentPaymentDate = String(form.get('rent_payment_date') || localDateISO());
    const depositPaymentDate = String(form.get('deposit_payment_date') || localDateISO());
    const leaseStart = String(form.get('lease_start'));
    const leaseEnd = String(form.get('lease_end'));
    const extraNames = form.getAll('move_in_charge_description').map((value) => String(value).trim());
    const extraCategories = form.getAll('move_in_charge_category').map(String);
    const extraAmounts = form.getAll('move_in_charge_amount').map((value) => Number(value || 0));
    const extraStatuses = form.getAll('move_in_charge_status').map(String);
    const extraDates = form.getAll('move_in_charge_date').map((value) => String(value || ''));
    const extraPeriodStarts = form.getAll('move_in_charge_period_start').map((value) => String(value || ''));
    const extraPeriodEnds = form.getAll('move_in_charge_period_end').map((value) => String(value || ''));
    const additionalCharges = extraNames.map((description, index) => ({
      description, category: extraCategories[index], amount: extraAmounts[index], status: extraStatuses[index],
      paid_at: extraStatuses[index] === 'paid' ? (extraDates[index] || localDateISO()) : null,
      due_date: extraStatuses[index] === 'unpaid' ? (extraDates[index] || null) : null,
      period_start: extraPeriodStarts[index] || null, period_end: extraPeriodEnds[index] || null,
    }));
    if (!String(form.get('email') || '').trim() || !String(form.get('guarantor_email') || '').trim()) {
      setToast('Tenant and guarantor email addresses are required for individual PDF delivery.'); return;
    }
    if (!landlordProfile?.lawyer_email) { setToast('Add the lawyer’s email in Landlord profile before registering a tenant.'); return; }
    if (!Number.isFinite(amount) || amount <= 0) { setToast('Enter a rent amount greater than zero.'); return; }
    if (!leaseStart || !leaseEnd || leaseEnd < leaseStart) { setToast('Enter a valid lease end date that is on or after the lease start date.'); return; }
    if (firstRentPayment < 0 || firstRentPayment > amount) { setToast('Enter no more than one rent period in Rent received. Record any deposit separately.'); return; }
    if (firstDepositPayment < 0) { setToast('Deposit received cannot be less than zero.'); return; }
    if (additionalCharges.some((charge) => !charge.description || !['security', 'utilities', 'cleaning', 'maintenance', 'other'].includes(charge.category) || !Number.isFinite(charge.amount) || charge.amount <= 0 || !['paid', 'unpaid'].includes(charge.status) || Boolean(charge.period_start) !== Boolean(charge.period_end) || (charge.period_start && charge.period_end < charge.period_start))) { setToast('Complete each added charge with a description, type, positive amount and status. Enter both period dates and make sure the end is not before the start.'); return; }
    if (propertyId && firstRentPayment + firstDepositPayment <= 0) { setToast('Record a rent or deposit payment before allocating this property.'); return; }
    setSaving(true);
    const { data: tenant, error } = await supabase.from('tenants').insert({
      owner_id: auth.id, full_name: name, email: form.get('email') || null, phone: form.get('phone') || null,
      permanent_address: String(form.get('permanent_address') || '').trim() || null,
      property_id: null, lease_start: leaseStart, lease_end: leaseEnd, rent_amount: amount,
      rent_frequency: form.get('rent_frequency'), deposit_amount: firstDepositPayment,
      first_rent_paid_at: firstRentPayment >= amount ? rentPaymentDate : null,
      agent_id: form.get('agent_id') || null, caretaker_id: form.get('caretaker_id') || null, lawyer_id: form.get('lawyer_id') || null,
      status: 'active', notes: form.get('notes') || null,
    }).select().single();
    if (error) { setSaving(false); setToast(error.message); return; }
    const { error: guarantorError } = await supabase.from('guarantors').insert({
      owner_id: auth.id, tenant_id: tenant.id, full_name: form.get('guarantor_name'),
      email: form.get('guarantor_email'), phone: form.get('guarantor_phone') || null,
      relationship: form.get('guarantor_relationship') || null, occupation: form.get('guarantor_occupation') || null,
      address: form.get('guarantor_address') || null,
    });
    if (guarantorError) { if (tenant.first_rent_paid_at) await supabase.from('tenants').update({ first_rent_paid_at: null }).eq('owner_id', auth.id).eq('id', tenant.id); setSaving(false); setToast(`Tenant saved but guarantor details failed: ${guarantorError.message}`); setTenants((current) => [tenant, ...current]); return; }
    let nextPayments = paymentRecords;
    const initialPayments = [
      ...(firstRentPayment > 0 ? [{ owner_id: auth.id, tenant_id: tenant.id, property_id: propertyId, description: `Initial rent payment — ${name}`, category: 'rent', amount: firstRentPayment, due_date: leaseStart, paid_at: rentPaymentDate, status: 'paid' }] : []),
      ...(firstDepositPayment > 0 ? [{ owner_id: auth.id, tenant_id: tenant.id, property_id: propertyId, description: `Initial deposit received — ${name}`, category: 'deposit', amount: firstDepositPayment, due_date: null, paid_at: depositPaymentDate, status: 'paid' }] : []),
      ...additionalCharges.map((charge) => ({ owner_id: auth.id, tenant_id: tenant.id, property_id: propertyId, description: `${charge.description} — ${name}`, category: charge.category, amount: charge.amount, due_date: charge.due_date, paid_at: charge.paid_at, period_start: charge.period_start, period_end: charge.period_end, status: charge.status })),
    ];
    if (initialPayments.length) {
      const { data: payments, error: paymentError } = await supabase.from('service_charges').insert(initialPayments).select();
      if (paymentError) { if (tenant.first_rent_paid_at) await supabase.from('tenants').update({ first_rent_paid_at: null }).eq('owner_id', auth.id).eq('id', tenant.id); setSaving(false); setToast(`Tenant saved, but initial payment records could not be saved: ${paymentError.message}`); setTenants((current) => [tenant, ...current]); return; }
      if (firstRentPayment > 0 && firstRentPayment < amount) {
        const { error: balanceError } = await supabase.from('service_charges').update({ amount: amount - firstRentPayment }).eq('owner_id', auth.id).eq('tenant_id', tenant.id).eq('category', 'rent').eq('due_date', leaseStart).eq('status', 'unpaid').like('description', 'Scheduled rent · %');
        if (balanceError) { setTenants((current) => [{ ...tenant, property_id: null }, ...current]); setPaymentRecords([...payments, ...paymentRecords]); setSaving(false); setToast(`Tenant and receipts were saved, but the remaining first-period rent balance could not be updated: ${balanceError.message}`); return; }
      }
      nextPayments = [...payments, ...paymentRecords];
      setPaymentRecords(nextPayments);
    }
    if (propertyId) {
      const { error: allocationError } = await supabase.rpc('allocate_property', { p_tenant_id: tenant.id, p_property_id: propertyId });
      if (allocationError) { setSaving(false); setToast(`Tenant and payment saved; allocate the property from Tenants: ${allocationError.message}`); setTenants((current) => [tenant, ...current]); return; }
      setPropertyRecords((current) => current.map((property) => property.id === propertyId ? { ...property, status: 'occupied', is_advertised: false } : property));
    }
    setTenants((current) => [{ ...tenant, property_id: propertyId }, ...current]);
    setSaving(false); setModal(false);
    const recordCopyWarnings = [];
    const registrationPdf = await sendRecordDocument({
      type: 'tenant_registration', title: 'New tenancy registration',
      summary: `${name} has been registered as a tenant${propertyId ? ' and linked to a property' : ''}.`,
      tenantId: tenant.id, propertyId,
      details: [
        { label: 'Tenant', value: name }, { label: 'Lease start', value: dateLabel(leaseStart) },
        { label: 'Lease end', value: dateLabel(leaseEnd) }, { label: 'Rent amount', value: `${currency(amount)} per ${String(form.get('rent_frequency') || 'period')}` },
        ...(firstRentPayment ? [{ label: 'Initial rent received', value: currency(firstRentPayment) }] : []),
        ...(firstDepositPayment ? [{ label: 'Deposit received', value: currency(firstDepositPayment) }] : []),
        ...additionalCharges.map((charge) => ({ label: charge.description, value: `${currency(charge.amount)} · ${charge.status}${charge.period_start ? ` · ${dateLabel(charge.period_start)} to ${dateLabel(charge.period_end)}` : ''}` })),
      ],
    });
    if (!registrationPdf.ok) recordCopyWarnings.push(registrationPdf.error);
    for (const charge of nextPayments.filter((item) => item.tenant_id === tenant.id)) {
      const paymentPdf = await sendRecordDocument(paymentDocumentEvent(charge, { ...tenant, property_id: propertyId }, 'payment'));
      if (!paymentPdf.ok) recordCopyWarnings.push(paymentPdf.error);
    }
    await sendTenantPackets(tenant.id);
    await sendProfileInvitation('tenant', tenant.id);
    if (tenant.agent_id || tenant.caretaker_id || tenant.lawyer_id) {
      const notification = await notifyTenantTeamAssignment(tenant.id);
      if (!notification.ok) recordCopyWarnings.push(notification.error);
      const assignmentPdf = await sendRecordDocument({
        type: 'team_assignment', title: 'Property team assignment update',
        summary: `The property team has been assigned to support ${name}.`, tenantId: tenant.id, propertyId,
        details: [
          { label: 'Assigned agent', value: staffRecords.find((person) => person.id === tenant.agent_id)?.full_name || 'Not assigned' },
          { label: 'Assigned caretaker', value: staffRecords.find((person) => person.id === tenant.caretaker_id)?.full_name || 'Not assigned' },
          { label: 'Assigned lawyer', value: staffRecords.find((person) => person.id === tenant.lawyer_id)?.full_name || 'Not assigned' },
        ],
      });
      if (!assignmentPdf.ok) recordCopyWarnings.push(assignmentPdf.error);
    }
    if (recordCopyWarnings.length) setToast(`Tenant registration is complete. Some PDF or email copies need attention: ${[...new Set(recordCopyWarnings)].join(' ')}`);
  }

  async function saveOtherRecord(event) {
    event.preventDefault();
    if (!auth || !supabase) { setToast('Sign in before saving portfolio records.'); return; }
    const form = new FormData(event.currentTarget);
    let table; let row; let evidenceFile = null;
    let uploadedPhotoPaths = [];
    if (page === 'Properties') {
      const images = form.getAll('images').filter((file) => file instanceof File && file.size > 0);
      if (images.length > 5) { setToast('Choose no more than five property photos.'); return; }
      const invalidImage = images.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024);
      if (invalidImage) { setToast('Photos must be JPG, PNG or WebP files no larger than 5 MB each.'); return; }
      setSaving(true);
      const photoUrls = [];
      for (const image of images) {
        const path = `${auth.id}/${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from('property-images').upload(path, image, {
          cacheControl: '3600', upsert: false, contentType: image.type,
        });
        if (uploadError) {
          if (uploadedPhotoPaths.length) await supabase.storage.from('property-images').remove(uploadedPhotoPaths);
          setSaving(false); setToast(`Photo upload failed: ${uploadError.message}`); return;
        }
        uploadedPhotoPaths.push(path);
        photoUrls.push(supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl);
      }
      table = 'properties';
      row = {
        name: form.get('name'), address: form.get('address') || null, city: form.get('city') || null,
        state: form.get('state') || null, country: form.get('country') || 'Nigeria', latitude: form.get('latitude') ? Number(form.get('latitude')) : null, longitude: form.get('longitude') ? Number(form.get('longitude')) : null,
        listing_type: form.get('listing_type'), price: Number(form.get('price')), price_period: form.get('listing_type') === 'rent' ? (form.get('price_period') || 'year') : 'one-time',
        bedrooms: Number(form.get('bedrooms') || 0), property_type: form.get('property_type') || 'House', property_size: String(form.get('property_size') || '').trim() || null,
        intended_use: String(form.get('intended_use') || '').trim() || null, amenities: String(form.get('amenities') || '').split(',').map((value) => value.trim()).filter(Boolean),
        bathrooms: Number(form.get('bathrooms') || 0), description: form.get('description') || null,
        image_url: photoUrls[0] || null, image_urls: photoUrls, status: 'available', is_advertised: form.get('is_advertised') === 'on',
      };
    } else if (page === 'Payments & charges') {
      evidenceFile = form.get('evidence');
      if (evidenceFile instanceof File && evidenceFile.size > 10 * 1024 * 1024) { setToast('Payment evidence must be 10 MB or smaller.'); return; }
      if (evidenceFile instanceof File && evidenceFile.size > 0 && !['image/jpeg','image/png','image/webp','application/pdf'].includes(evidenceFile.type)) { setToast('Payment evidence must be a JPG, PNG, WebP or PDF file.'); return; }
      table = 'service_charges';
      const tenant = tenants.find((item) => item.id === form.get('tenant_id'));
      const status = form.get('status');
      const isRenewalRent = Boolean(tenant) && form.get('category') === 'rent' && String(form.get('description') || '').toLowerCase().startsWith('renewal rent');
      const requestedMonths = form.get('lease_extension_months') ? Number(form.get('lease_extension_months')) : null;
      row = {
        tenant_id: tenant?.id || null, property_id: tenant?.property_id || null,
        description: form.get('description'), category: form.get('category'), amount: Number(form.get('amount')),
        due_date: form.get('due_date') || null, status: isRenewalRent && status === 'paid' ? 'unpaid' : status,
        paid_at: isRenewalRent ? null : status === 'paid' ? (form.get('paid_at') || new Date().toISOString().slice(0, 10)) : null,
        lease_extension_months: isRenewalRent ? requestedMonths : null,
      };
    } else if (page === 'Guarantors') {
      table = 'guarantors'; row = { full_name: form.get('full_name'), email: form.get('email') || null, phone: form.get('phone') || null, relationship: form.get('relationship') || null, address: form.get('address') || null, occupation: form.get('occupation') || null };
    } else {
      table = 'staff'; row = { full_name: form.get('full_name'), role: page === 'Caretakers' ? 'caretaker' : page === 'Lawyers' ? 'lawyer' : 'agent', email: form.get('email') || null, phone: form.get('phone') || null, notes: form.get('notes') || null };
    }
    setSaving(true);
    let renewalEndDate = null;
    let paymentPdfWarning = '';
    let { data, error } = await supabase.from(table).insert({ ...row, owner_id: auth.id }).select().single();
    if (!error && page === 'Payments & charges' && data.tenant_id && form.get('category') === 'rent' && String(form.get('description') || '').toLowerCase().startsWith('renewal rent') && form.get('status') === 'paid') {
      const extended = await supabase.rpc('set_rent_payment_status', { p_charge_id: data.id, p_status: 'paid', p_paid_at: form.get('paid_at') || localDateISO(), p_reason: null, p_duration_months: row.lease_extension_months });
      if (extended.error) { setSaving(false); setToast(`Renewal was saved as unpaid because the lease could not be extended: ${extended.error.message}`); setPaymentRecords((current) => [data, ...current]); setModal(false); return; }
      data = extended.data;
      const { data: updatedTenants } = await supabase.from('tenants').select('*').eq('owner_id', auth.id);
      if (updatedTenants) {
        setTenants(updatedTenants);
        renewalEndDate = updatedTenants.find((item) => item.id === data.tenant_id)?.lease_end || null;
      }
    }
    if (!error && page === 'Payments & charges' && evidenceFile instanceof File && evidenceFile.size > 0) {
      const safeName = evidenceFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${auth.id}/${data.id}/${crypto.randomUUID()}-${safeName}`;
      const uploaded = await supabase.storage.from('payment-evidence').upload(path, evidenceFile, { contentType: evidenceFile.type, upsert: false });
      if (uploaded.error) { setSaving(false); setToast(`Charge saved, but evidence upload failed: ${uploaded.error.message}`); return; }
      const updated = await supabase.from('service_charges').update({ evidence_path: path, evidence_uploaded_at: new Date().toISOString() }).eq('owner_id', auth.id).eq('id', data.id).select().single();
      if (updated.error) { setSaving(false); setToast(`Charge saved, but evidence link could not be saved: ${updated.error.message}`); return; }
      data = updated.data;
    }
    setSaving(false);
    if (error) {
      if (uploadedPhotoPaths.length) await supabase.storage.from('property-images').remove(uploadedPhotoPaths);
      setToast(error.message); return;
    }
    if (page === 'Properties') setPropertyRecords((current) => [data, ...current]);
    if (page === 'Payments & charges') setPaymentRecords((current) => [data, ...current]);
    setRecords((current) => [data, ...current]); setModal(false);
    if (page === 'Payments & charges') {
      const pdfResult = await sendRecordDocument(paymentDocumentEvent(data, tenants.find((item) => item.id === data.tenant_id), 'payment'));
      if (!pdfResult.ok) paymentPdfWarning = ` PDF/email copy needs attention: ${pdfResult.error}`;
    }
    if (page === 'Caretakers' || page === 'Agents' || page === 'Lawyers') {
      setToast('Record saved. Sending profile invitation…');
      if (data.email) await sendProfileInvitation(data.role, data.id);
      else setToast('Record saved. Add an email address to send a profile invitation.');
    } else setToast(`${renewalEndDate ? `Renewal recorded. The lease now ends ${dateLabel(renewalEndDate)}.` : page === 'Properties' ? (data.is_advertised ? 'Property saved and advertised on the dashboard.' : 'Property saved. You can advertise it from Properties.') : page === 'Payments & charges' && !paymentPdfWarning ? 'Payment recorded. A labelled PDF copy was emailed and saved to property documents.' : 'Record saved to your Yemilaz Properties account.'}${paymentPdfWarning}`);
  }

  async function deleteProperty(property, confirmed = false) {
    if (!confirmed) {
      setToast('');
      setConfirmReason('');
      setConfirmDialog({ title: 'Delete this property?', message: `Delete “${property.name}”?`, detail: 'Linked tenant and payment records will be kept, but their property allocation will be cleared.', confirmLabel: 'Delete property', variant: 'danger', onConfirm: () => deleteProperty(property, true) });
      return;
    }
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

  async function requestListingVerification(property) {
    if (!auth || !supabase) return;
    const { error } = await supabase.from('properties').update({ verification_status: 'pending' }).eq('owner_id', auth.id).eq('id', property.id).neq('verification_status', 'verified');
    if (error) { setToast(error.message); return; }
    setPropertyRecords((current) => current.map((item) => item.id === property.id ? { ...item, verification_status: item.verification_status === 'verified' ? 'verified' : 'pending' } : item));
    setToast('Verification request noted. The Yemilaz team will review ownership documents separately.');
  }

  async function updateViewingStatus(request, status) {
    if (!auth || !supabase) return;
    const { error } = await supabase.from('property_viewing_requests').update({ status }).eq('owner_id', auth.id).eq('id', request.id);
    if (error) { setToast(error.message); return; }
    setRecords((current) => current.map((item) => item.id === request.id ? { ...item, status } : item));
  }

  async function markPublicProfileMessageRead(message) {
    if (!auth || !supabase) return;
    const { data, error } = await supabase.from('public_profile_messages').update({ status: 'read', read_at: new Date().toISOString() }).eq('profile_user_id', auth.id).eq('id', message.id).select().single();
    if (error) { setToast(error.message); return; }
    setRecords((current) => current.map((item) => item.id === data.id ? { ...item, ...data } : item));
  }

  async function updateListingReport(report, status) {
    if (!auth || !supabase) return;
    const { error } = await supabase.from('property_listing_reports').update({ status }).eq('owner_id', auth.id).eq('id', report.id);
    if (error) { setToast(error.message); return; }
    setRecords((current) => current.map((item) => item.id === report.id ? { ...item, status } : item));
  }

  async function updatePropertyStatus(property, status) {
    const tenant = tenants.find((item) => item.property_id === property.id);
    if (tenant && status !== 'occupied') { setToast('Remove or change this tenant allocation before changing the property status.'); return; }
    if (!tenant && status === 'occupied') { setToast('Register and allocate a tenant to mark this property as rented.'); return; }
    const isAdvertised = status === 'reserved' ? property.is_advertised : status === 'available' ? property.is_advertised : false;
    const { error } = await supabase.from('properties').update({ status, is_advertised: isAdvertised }).eq('owner_id', auth.id).eq('id', property.id);
    if (error) { setToast(error.message); return; }
    setPropertyRecords((current) => current.map((item) => item.id === property.id ? { ...item, status, is_advertised: isAdvertised } : item));
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
  const displayedTenants = visibleTenants.filter((tenant) => `${tenant.name} ${tenant.property}`.toLowerCase().includes(query.toLowerCase()) && (filter !== 'Active only' || tenant.displayStatus === 'Active'));
  const dashboardAds = propertyRecords.filter((property) => property.status === 'available' && property.is_advertised);
  const publicListings = propertyRecords.filter((property) => ['available','reserved'].includes(property.status) && property.is_advertised);

  async function submitComplaint(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!supabase) { setToast('Complaint submissions are temporarily unavailable. Please try again later.'); return; }
    const form = new FormData(formElement);
    const complaint = {
      complainant_name: form.get('name'), email: form.get('email'), phone: form.get('phone') || null,
      stakeholder_role: form.get('role'), property_id: form.get('property_id') || null, property_address: form.get('property'), category: form.get('category'),
      other_participant_email: form.get('recipient_email') || form.get('other_participant_email') || null,
      subject: form.get('subject'), details: form.get('details'),
    };
    const insertQuery = supabase.from('property_complaints').insert(complaint);
    const { data, error } = auth ? await insertQuery.select().single() : await insertQuery;
    if (error) { setToast('We could not submit your complaint. Please try again.'); return false; }
    if (data && auth) setStakeholderCases((current) => [data, ...current]);
    formElement.reset(); setToast('Your complaint has been submitted securely. Our team will review it.');
    return true;
  }

  async function savePersonEdit(event) {
    event.preventDefault();
    if (!auth || !supabase || !editingPerson) return;
    const form = new FormData(event.currentTarget);
    const kind = editingPerson.kind;
    if (kind === 'charge') {
      const status = form.get('status');
      const tenant = tenants.find((item) => item.id === form.get('tenant_id'));
      const isRenewalRent = editingPerson.category === 'rent' && String(editingPerson.description || '').toLowerCase().startsWith('renewal rent');
      const requestedMonths = isRenewalRent && form.get('lease_extension_months') ? Number(form.get('lease_extension_months')) : null;
      const durationChanged = requestedMonths !== (editingPerson.lease_extension_months || null);
      const shouldSyncRenewal = isRenewalRent && ['paid', 'unpaid'].includes(status) && (status !== editingPerson.status || (status === 'paid' && durationChanged));
      const row = { tenant_id: tenant?.id || null, property_id: tenant?.property_id || editingPerson.property_id || null, description: form.get('description'), category: form.get('category'), amount: Number(form.get('amount')), due_date: form.get('due_date') || null, paid_at: isRenewalRent ? editingPerson.paid_at : status === 'paid' ? (form.get('paid_at') || new Date().toISOString().slice(0, 10)) : null, period_start: form.get('period_start') || null, period_end: form.get('period_end') || null, status: isRenewalRent ? editingPerson.status : status, lease_extension_months: isRenewalRent && status === 'paid' ? editingPerson.lease_extension_months : requestedMonths, edited_at: new Date().toISOString(), edited_by: auth.id };
      setSaving(true);
      const { data: savedRow, error: saveError } = await supabase.from('service_charges').update(row).eq('owner_id', auth.id).eq('id', editingPerson.id).select().single();
      let data = savedRow, error = saveError;
      if (!error && shouldSyncRenewal) {
        const result = await supabase.rpc('set_rent_payment_status', { p_charge_id: editingPerson.id, p_status: status, p_paid_at: status === 'paid' ? (form.get('paid_at') || localDateISO()) : null, p_reason: null, p_duration_months: requestedMonths });
        data = result.data; error = result.error;
      }
      setSaving(false);
      if (error) { setToast(error.message); return; }
      setPaymentRecords((current) => current.map((item) => item.id === data.id ? data : item));
      const pdfResult = await sendRecordDocument(paymentDocumentEvent(data, tenant || tenants.find((item) => item.id === data.tenant_id), 'payment_update'));
      let renewedLeaseEnd = null;
      if (isRenewalRent && shouldSyncRenewal) {
        const { data: updatedTenants } = await supabase.from('tenants').select('*').eq('owner_id', auth.id);
        if (updatedTenants) {
          setTenants(updatedTenants);
          renewedLeaseEnd = updatedTenants.find((item) => item.id === (tenant?.id || editingPerson.tenant_id))?.lease_end || null;
        }
      }
      setEditingPerson(null); setToast(`${isRenewalRent && status === 'paid' && renewedLeaseEnd ? `Renewal recorded. The lease has been extended through ${dateLabel(renewedLeaseEnd)}.` : 'Transaction updated and saved.'}${pdfResult.ok ? ' A clearly labelled PDF copy was emailed and saved to property documents.' : ` PDF/email copy needs attention: ${pdfResult.error}`}`); return;
    }
    const table = kind === 'tenant' ? 'tenants' : kind === 'guarantor' ? 'guarantors' : 'staff';
    if (kind === 'tenant' && (!form.get('lease_start') || !form.get('lease_end') || form.get('lease_end') < form.get('lease_start') || Number(form.get('rent_amount')) <= 0)) { setToast('Enter valid tenancy dates and a rent amount greater than zero.'); return; }
    const tenantExtraNames = kind === 'tenant' ? form.getAll('move_in_charge_description').map((value) => String(value).trim()) : [];
    const tenantExtraCategories = kind === 'tenant' ? form.getAll('move_in_charge_category').map(String) : [];
    const tenantExtraAmounts = kind === 'tenant' ? form.getAll('move_in_charge_amount').map((value) => Number(value || 0)) : [];
    const tenantExtraStatuses = kind === 'tenant' ? form.getAll('move_in_charge_status').map(String) : [];
    const tenantExtraDates = kind === 'tenant' ? form.getAll('move_in_charge_date').map((value) => String(value || '')) : [];
    const tenantExtraPeriodStarts = kind === 'tenant' ? form.getAll('move_in_charge_period_start').map((value) => String(value || '')) : [];
    const tenantExtraPeriodEnds = kind === 'tenant' ? form.getAll('move_in_charge_period_end').map((value) => String(value || '')) : [];
    const tenantExtraCharges = tenantExtraNames.map((description, index) => ({
      description, category: tenantExtraCategories[index], amount: tenantExtraAmounts[index], status: tenantExtraStatuses[index],
      paid_at: tenantExtraStatuses[index] === 'paid' ? (tenantExtraDates[index] || localDateISO()) : null,
      due_date: tenantExtraStatuses[index] === 'unpaid' ? (tenantExtraDates[index] || null) : null,
      period_start: tenantExtraPeriodStarts[index] || null, period_end: tenantExtraPeriodEnds[index] || null,
    }));
    if (tenantExtraCharges.some((charge) => !charge.description || !['security', 'utilities', 'cleaning', 'maintenance', 'other'].includes(charge.category) || !Number.isFinite(charge.amount) || charge.amount <= 0 || !['paid', 'unpaid'].includes(charge.status) || Boolean(charge.period_start) !== Boolean(charge.period_end) || (charge.period_start && charge.period_end < charge.period_start))) { setToast('Complete each added charge with a description, type, positive amount and status. Enter both period dates and make sure the end is not before the start.'); return; }
    const row = kind === 'tenant'
      ? { full_name: form.get('full_name'), email: form.get('email') || null, phone: form.get('phone') || null, permanent_address: String(form.get('permanent_address') || '').trim() || null, rent_amount: Number(form.get('rent_amount') || 0), rent_frequency: form.get('rent_frequency') || 'yearly', lease_start: form.get('lease_start') || null, lease_end: form.get('lease_end') || null, agent_id: form.get('agent_id') || null, caretaker_id: form.get('caretaker_id') || null, lawyer_id: form.get('lawyer_id') || null, notes: form.get('notes') || null }
      : kind === 'guarantor'
        ? { full_name: form.get('full_name'), email: form.get('email') || null, phone: form.get('phone') || null, relationship: form.get('relationship') || null, occupation: form.get('occupation') || null, address: form.get('address') || null }
        : { full_name: form.get('full_name'), email: form.get('email') || null, phone: form.get('phone') || null, role: form.get('role') || editingPerson.role, notes: form.get('notes') || null };
    setSaving(true);
    const { data, error } = await supabase.from(table).update(row).eq('owner_id', auth.id).eq('id', editingPerson.id).select().single();
    if (error) { setSaving(false); setToast(error.message); return; }
    let assignmentEmailWarning = '';
    if (kind === 'tenant') {
      setTenants((current) => current.map((item) => item.id === data.id ? { ...item, ...data } : item));
      const oldAssignments = [editingPerson.agent_id, editingPerson.caretaker_id, editingPerson.lawyer_id].filter(Boolean);
      const assignmentsChanged = ['agent_id','caretaker_id','lawyer_id'].some((field) => (editingPerson[field] || null) !== (data[field] || null));
      if (assignmentsChanged) {
        const notification = await notifyTenantTeamAssignment(data.id, oldAssignments);
        if (!notification.ok) assignmentEmailWarning = `Assignment email notifications need attention: ${notification.error}`;
        const assignmentPdf = await sendRecordDocument({
          type: 'team_assignment', title: 'Property team assignment update',
          summary: `The assigned property team for ${data.full_name} has been updated.`, tenantId: data.id, propertyId: data.property_id,
          details: [
            { label: 'Tenant', value: data.full_name },
            { label: 'Assigned agent', value: staffRecords.find((person) => person.id === data.agent_id)?.full_name || 'Not assigned' },
            { label: 'Assigned caretaker', value: staffRecords.find((person) => person.id === data.caretaker_id)?.full_name || 'Not assigned' },
            { label: 'Assigned lawyer', value: staffRecords.find((person) => person.id === data.lawyer_id)?.full_name || 'Not assigned' },
          ],
        });
        if (!assignmentPdf.ok) assignmentEmailWarning += `${assignmentEmailWarning ? ' ' : ''}Team update PDF/email needs attention: ${assignmentPdf.error}`;
      }
      const tenantUpdatePdf = await sendRecordDocument({
        type: 'tenant_registration', title: 'Tenant profile update',
        summary: `The tenancy details for ${data.full_name} have been updated.`, tenantId: data.id, propertyId: data.property_id,
        details: [
          { label: 'Tenant', value: data.full_name }, { label: 'Rent', value: `${currency(data.rent_amount)} per ${data.rent_frequency || 'period'}` },
          { label: 'Lease start', value: data.lease_start ? dateLabel(data.lease_start) : 'Not recorded' },
          { label: 'Lease end', value: data.lease_end ? dateLabel(data.lease_end) : 'Not recorded' },
        ],
      });
      if (!tenantUpdatePdf.ok) assignmentEmailWarning += `${assignmentEmailWarning ? ' ' : ''}Tenant update PDF/email needs attention: ${tenantUpdatePdf.error}`;
      if (tenantExtraCharges.length) {
        const newCharges = tenantExtraCharges.map((charge) => ({ owner_id: auth.id, tenant_id: data.id, property_id: data.property_id || null, description: `${charge.description} — ${data.full_name}`, category: charge.category, amount: charge.amount, due_date: charge.due_date, paid_at: charge.paid_at, period_start: charge.period_start, period_end: charge.period_end, status: charge.status }));
        const { data: insertedCharges, error: chargeError } = await supabase.from('service_charges').insert(newCharges).select();
        if (chargeError) { setSaving(false); setEditingPerson(null); setToast(`Tenant details were saved, but the new charge could not be recorded: ${chargeError.message}${assignmentEmailWarning ? ` ${assignmentEmailWarning}` : ''}`); return; }
        if (insertedCharges) setPaymentRecords((current) => [...insertedCharges, ...current]);
      }
      const { data: charges } = await supabase.from('service_charges').select('*').eq('owner_id', auth.id).order('created_at', { ascending: false }); if (charges) setPaymentRecords(charges);
    }
    else if (kind === 'staff') { setStaffRecords((current) => current.map((item) => item.id === data.id ? { ...item, ...data } : item)); setRecords((current) => current.map((item) => item.id === data.id ? { ...item, ...data } : item)); }
    else setRecords((current) => current.map((item) => item.id === data.id ? { ...item, ...data } : item));
    setSaving(false);
    setEditingPerson(null); setToast(assignmentEmailWarning ? `${editingPerson.focusTeam ? 'Property team saved.' : 'Tenant details saved.'} ${assignmentEmailWarning}` : kind === 'tenant' ? editingPerson.focusTeam ? 'Property team updated. The tenant and affected staff were notified.' : 'Tenant details updated. A labelled PDF copy was emailed and saved to property documents.' : 'Contact details updated.');
  }

  async function voidTransaction(record, confirmed = false, reason = '') {
    if (!auth || !supabase || record.status === 'voided') { setConfirmError('This transaction is unavailable or already voided. Refresh the ledger and try again.'); return false; }
    if (!confirmed) {
      setToast('');
      setConfirmError('');
      setConfirmReason('');
      setConfirmDialog({ title: 'Void this transaction?', message: `${currency(record.amount)} · ${record.description}`, detail: 'This transaction will remain in the ledger and be excluded from payment totals. Add a reason for the audit history.', confirmLabel: 'Void transaction', variant: 'warning', requireReason: true, onConfirm: (reasonText) => voidTransaction(record, true, reasonText) });
      return;
    }
    if (!reason.trim()) { setConfirmError('Enter a reason before voiding this transaction.'); return false; }
    setTransactionActionId(record.id);
    let data, error;
    try {
      const isRenewalRent = record.category === 'rent' && String(record.description || '').toLowerCase().startsWith('renewal rent');
      if (isRenewalRent) {
        ({ data, error } = await supabase.rpc('set_rent_payment_status', { p_charge_id: record.id, p_status: 'voided', p_paid_at: null, p_reason: reason.trim(), p_duration_months: record.lease_extension_months || null }));
        if (!error) {
          const { data: updatedTenants } = await supabase.from('tenants').select('*').eq('owner_id', auth.id);
          if (updatedTenants) setTenants(updatedTenants);
        }
      } else {
        ({ data, error } = await supabase.from('service_charges').update({ status: 'voided', voided_at: new Date().toISOString(), voided_by: auth.id, void_reason: reason.trim() }).eq('owner_id', auth.id).eq('id', record.id).select().single());
      }
    }
    catch (requestError) { const message = `Could not void this transaction: ${requestError.message || 'Connection error. Please try again.'}`; setConfirmError(message); setToast(message); return false; }
    finally { setTransactionActionId(null); }
    if (error) { const message = `Could not void this transaction: ${error.message}`; setConfirmError(message); setToast(message); return false; }
    setPaymentRecords((current) => current.map((item) => item.id === data.id ? data : item));
    const pdfResult = await sendRecordDocument(paymentDocumentEvent({ ...data, status: 'voided' }, tenants.find((item) => item.id === data.tenant_id), 'payment_update'));
    setToast('Transaction voided. Its history has been kept.');
    if (!pdfResult.ok) setToast(`Transaction voided. PDF/email copy needs attention: ${pdfResult.error}`);
    setConfirmError('');
    return true;
  }

  async function setTransactionPaid(record, status, confirmed = false) {
    if (!auth || !supabase || !['paid', 'unpaid'].includes(status) || record.status === 'voided') { setConfirmError('This transaction is unavailable or already voided. Refresh the ledger and try again.'); return false; }
    if (status === 'unpaid' && record.status === 'paid' && !confirmed) {
      setToast('');
      setConfirmError('');
      setConfirmReason('');
      setConfirmDialog({ title: 'Mark this payment as unpaid?', message: record.description, detail: 'The recorded payment date will be cleared and this charge will count as outstanding again.', confirmLabel: 'Mark as unpaid', variant: 'warning', onConfirm: () => setTransactionPaid(record, status, true) });
      return;
    }
    setTransactionActionId(record.id);
    let data, error, renewalEndDate = null;
    try {
      const isRenewalRent = record.category === 'rent' && String(record.description || '').toLowerCase().startsWith('renewal rent');
      if (isRenewalRent) {
        ({ data, error } = await supabase.rpc('set_rent_payment_status', { p_charge_id: record.id, p_status: status, p_paid_at: status === 'paid' ? localDateISO() : null, p_reason: null, p_duration_months: record.lease_extension_months || null }));
        if (!error) {
          const { data: updatedTenants, error: tenantError } = await supabase.from('tenants').select('*').eq('owner_id', auth.id);
          if (tenantError) console.warn('Lease updated; tenant list will refresh on reload.', tenantError.message);
          else if (updatedTenants) {
            setTenants(updatedTenants);
            if (status === 'paid') renewalEndDate = updatedTenants.find((tenant) => tenant.id === record.tenant_id)?.lease_end || null;
          }
        }
      } else {
        ({ data, error } = await supabase.from('service_charges').update({ status, paid_at: status === 'paid' ? localDateISO() : null, edited_at: new Date().toISOString(), edited_by: auth.id }).eq('owner_id', auth.id).eq('id', record.id).select().single());
      }
    }
    catch (requestError) { const message = `Could not update this payment: ${requestError.message || 'Connection error. Please try again.'}`; setConfirmError(message); setToast(message); return false; }
    finally { setTransactionActionId(null); }
    if (error) { const message = `Could not update this payment: ${error.message}`; setConfirmError(message); setToast(message); return false; }
    setPaymentRecords((current) => current.map((item) => item.id === data.id ? data : item));
    const paymentPdf = await sendRecordDocument(paymentDocumentEvent(data, tenants.find((item) => item.id === data.tenant_id), 'payment_update'));
    setToast(`${status === 'paid' && renewalEndDate ? `Renewal recorded. The lease now ends ${dateLabel(renewalEndDate)}.` : status === 'paid' ? 'Payment recorded as paid.' : 'Payment marked unpaid.'}${paymentPdf.ok ? ' A labelled PDF copy was emailed and saved to property documents.' : ` PDF/email copy needs attention: ${paymentPdf.error}`}`);
    setConfirmError('');
    return true;
  }

  async function deleteUnpaidTransaction(record, confirmed = false) {
    if (!auth || !supabase || record.status !== 'unpaid') { setConfirmError('Only unpaid charges can be deleted. Refresh the ledger and try again.'); return false; }
    if (!confirmed) {
      setToast('');
      setConfirmError('');
      setConfirmReason('');
      setConfirmDialog({ title: 'Delete this unpaid charge?', message: `${record.description} · ${currency(record.amount)}`, detail: 'This charge will be permanently removed from the ledger. Paid and voided transaction history is not affected.', confirmLabel: 'Delete charge', variant: 'danger', onConfirm: () => deleteUnpaidTransaction(record, true) });
      return;
    }
    setTransactionActionId(record.id);
    let data, error;
    try { ({ data, error } = await supabase.from('service_charges').delete().eq('owner_id', auth.id).eq('id', record.id).eq('status', 'unpaid').select('id').maybeSingle()); }
    catch (requestError) { const message = `Could not delete this charge: ${requestError.message || 'Connection error. Please try again.'}`; setConfirmError(message); setToast(message); return false; }
    finally { setTransactionActionId(null); }
    if (error) { const message = `Could not delete this charge: ${error.message}`; setConfirmError(message); setToast(message); return false; }
    if (!data) { const message = 'No ledger row was deleted. It may have changed or the account may not have delete access. Refresh the ledger and try again.'; setConfirmError(message); setToast(message); return false; }
    setPaymentRecords((current) => current.filter((item) => item.id !== record.id));
    setRecords((current) => current.filter((item) => item.id !== record.id));
    setToast('Unpaid charge deleted. Paid and voided history remains protected.');
    setConfirmError('');
    return true;
  }

  async function deletePerson(record, kind, confirmed = false) {
    const names = { tenant: 'tenant', guarantor: 'guarantor', staff: record.role === 'caretaker' ? 'caretaker' : record.role === 'lawyer' ? 'lawyer' : 'agent' };
    const label = names[kind];
    const warning = kind === 'tenant' ? ' This also removes linked payment and guarantor records.' : kind === 'staff' ? ' Tenant records will remain, but this person will be unassigned.' : '';
    if (!confirmed) {
      setToast('');
      setConfirmReason('');
      setConfirmDialog({ title: `Delete this ${label}?`, message: record.full_name, detail: warning.trim() || 'This person will be removed from your records.', confirmLabel: `Delete ${label}`, variant: 'danger', onConfirm: () => deletePerson(record, kind, true) });
      return;
    }
    if (!auth || !supabase) return;
    const table = kind === 'tenant' ? 'tenants' : kind === 'guarantor' ? 'guarantors' : 'staff';
    const { error } = await supabase.from(table).delete().eq('owner_id', auth.id).eq('id', record.id);
    if (error) { setToast(error.message); return; }
    if (kind === 'tenant') {
      setTenants((current) => current.filter((item) => item.id !== record.id));
      setPaymentRecords((current) => current.filter((item) => item.tenant_id !== record.id));
      if (record.property_id) {
        const { error: propertyError } = await supabase.from('properties').update({ status: 'available' }).eq('owner_id', auth.id).eq('id', record.property_id).eq('status', 'occupied');
        if (!propertyError) setPropertyRecords((current) => current.map((item) => item.id === record.property_id ? { ...item, status: 'available' } : item));
      }
    }
    else if (kind === 'staff') { setStaffRecords((current) => current.filter((item) => item.id !== record.id)); setRecords((current) => current.filter((item) => item.id !== record.id)); }
    else setRecords((current) => current.filter((item) => item.id !== record.id));
    setToast(`${label[0].toUpperCase()}${label.slice(1)} deleted.`);
  }

  async function runConfirmedAction() {
    if (!confirmDialog || confirmBusy || (confirmDialog.requireReason && !confirmReason.trim())) return;
    setConfirmBusy(true);
    try {
      const succeeded = await confirmDialog.onConfirm(confirmReason);
      if (succeeded === false) return;
      setConfirmDialog(null);
      setConfirmReason('');
    } catch (error) {
      setConfirmError(`The action could not be completed: ${error?.message || 'Please try again.'}`);
    } finally {
      setConfirmBusy(false);
    }
  }

  function switchAccountPortal(role) {
    if (!accountPortals.some((item) => item.role === role) || role === accountRole) return;
    window.localStorage.setItem(`yemilaz-active-portal:${auth.id}`, role);
    setAccountRole(role);
    setPage('Overview');
    setMenu(false);
    setTenantAccount(null);
    setStaffAccount(null);
    setToast(`Switched to your ${portalRoleLabels[role] || role} profile.`);
  }

  const portal = new URLSearchParams(window.location.search).get('portal');
  if (authChecking && (portal === 'account' || portal === 'admin' || portal === 'review')) return <AuthLoadingScreen onContinue={() => setAuthChecking(false)}/>;
  if(mfaChallenge)return <MfaVerificationGate onVerify={async code=>{const {error}=await supabase.auth.mfa.verify({...mfaChallenge,code});if(error)return error.message;setMfaChallenge(null);return '';}} onSignOut={()=>supabase.auth.signOut()}/>;
  if (portal === 'admin' && auth && (!adminChecked || (!isPlatformAdmin && !platformPermissions.length && !isPlatformReviewer))) return <AdminAccessScreen checking={!adminChecked} onSignOut={() => supabase.auth.signOut()}/>;
  if (portal === 'review' && auth && (!adminChecked || !isPlatformReviewer)) return <AdminAccessScreen checking={!adminChecked} onSignOut={() => supabase.auth.signOut()}/>;

  if (!auth) return <div className="brand-site theme-jade"><BrandWatermark logo="horizon"/><ScrollNavigation/><PropertyHelpAssistant/>
    {portal === 'admin' || portal === 'account'
      ? <LoginPortal audience={portal} onSubmit={(event) => login(event, portal === 'admin')} onForgotPassword={requestPasswordReset} signing={signing} onRegister={(role) => { setAuthRegistrationRole(role); setAuthModal(true); }} onAdminSignIn={() => window.location.assign(`${window.location.pathname}?portal=admin`)}/>
      : showComplaintRoom ? <PublicComplaintRoom properties={dashboardAds} onBack={() => setShowComplaintRoom(false)} onSubmit={submitComplaint}/> : <PublicLanding properties={publicListings} onSignIn={() => { window.location.assign(`${window.location.pathname}?portal=account`); }} onAdminSignIn={() => { window.location.assign(`${window.location.pathname}?portal=admin`); }} onComplaint={() => setShowComplaintRoom(true)}/>}
    {authModal && <AuthDialog initialRole={authRegistrationRole} onSubmit={login} onSignUp={registerLandlord} onExistingAccountSignIn={(event, role) => login(event, false, role)} onForgotPassword={requestPasswordReset} onClose={() => setAuthModal(false)} signing={signing}/>}
    {confirmDialog && <div className="confirm-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !confirmBusy && (setConfirmDialog(null), setConfirmReason(''), setConfirmError(''))}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message"><div className={`confirm-icon ${confirmDialog.variant || 'danger'}`}><AlertTriangle size={22}/></div><span className="eyebrow">{confirmDialog.variant === 'warning' ? 'REVIEW THIS CHANGE' : 'CONFIRM ACTION'}</span><h2 id="confirm-dialog-title">{confirmDialog.title}</h2><p id="confirm-dialog-message" className="confirm-message">{confirmDialog.message}</p><p className="confirm-detail">{confirmDialog.detail}</p>{confirmError && <p className="confirm-error" role="alert">{confirmError}</p>}{confirmDialog.requireReason && <label className="confirm-reason">Reason for voiding<textarea autoFocus rows={3} value={confirmReason} onChange={(event) => { setConfirmReason(event.target.value); setConfirmError(''); }} maxLength={500} placeholder="Add a short reason for the transaction history"/></label>}<div className="confirm-actions"><button type="button" className="secondary-button" disabled={confirmBusy} onClick={() => { setConfirmDialog(null); setConfirmReason(''); setConfirmError(''); }}>Cancel</button><button type="button" className={`confirm-submit ${confirmDialog.variant || 'danger'}`} disabled={confirmBusy || (confirmDialog.requireReason && !confirmReason.trim())} onClick={runConfirmedAction}>{confirmBusy ? 'Please wait…' : confirmDialog.confirmLabel || 'Confirm'}</button></div></section></div>}
    {authNotice && <AuthNoticeDialog notice={authNotice} onClose={() => setAuthNotice(null)} onResend={resendConfirmation} onUpdatePassword={saveNewPassword} signing={signing}/>}
    {toast && <div className="toast" role="status" aria-live="polite"><Check size={16}/>{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15}/></button></div>}
  </div>;

  if (portal === 'account' && new URLSearchParams(window.location.search).get('section') === 'add-profile') return <AdditionalAccountProfilePage auth={auth} role={accountRole} availablePortals={accountPortals} canReview={isPlatformReviewer} requestedRole={new URLSearchParams(window.location.search).get('requestedRole') || ''} onSwitchPortal={switchAccountPortal} onOpenReview={() => window.location.assign(`${window.location.pathname}?portal=review`)} onSignOut={() => supabase.auth.signOut()}/>;
  if (portal === 'account' && new URLSearchParams(window.location.search).get('section') === 'community') return <CommunitySpotlightPage auth={auth} role={accountRole} tenant={tenantAccount} staff={staffAccount} notifications={notifications} onReadNotification={markNotificationRead} availablePortals={accountPortals} onSwitchPortal={switchAccountPortal} onSignOut={() => supabase.auth.signOut()}/>;

  if (portal === 'review' && auth) return <><PlatformUpgradeReview client={supabase} isAdmin={isPlatformAdmin} onBack={() => window.location.assign(`${window.location.pathname}?portal=account`)} onManageStaff={() => window.location.assign(`${window.location.pathname}?portal=admin&adminPage=Platform%20staff`)}/><PropertyHelpAssistant/></>;

  if (portal !== 'admin' && ['agent', 'caretaker', 'lawyer'].includes(accountRole)) return <><StaffPortal auth={auth} role={accountRole} availablePortals={accountPortals} onSwitchPortal={switchAccountPortal} staff={staffAccount} tenants={staffAssignments} properties={propertyRecords} cases={stakeholderCases} activeComplaint={activeComplaint} setActiveComplaint={setActiveComplaint} messages={complaintMessages} onSend={addComplaintMessage} onResolution={changeComplaintResolution} onSubmitComplaint={submitComplaint} notifications={notifications} onReadNotification={markNotificationRead} complaintUnreadCounts={complaintUnreadCounts} onOpenComplaint={(item) => { markComplaintNotificationsRead(item.id); setActiveComplaint(item); }} onSignOut={() => supabase.auth.signOut()} toast={toast} onClearToast={() => setToast('')} canReviewUpgrades={isPlatformReviewer} onOpenUpgradeReview={() => window.location.assign(`${window.location.pathname}?portal=review`)}/><ScrollNavigation/><PropertyHelpAssistant/></>;
  if (portal !== 'admin' && ['stakeholder', 'tenant','property_seeker','complainant'].includes(accountRole)) return <><StakeholderPortal auth={auth} role={accountRole} availablePortals={accountPortals} onSwitchPortal={switchAccountPortal} tenant={tenantAccount} contacts={tenantContacts} cases={stakeholderCases} activeComplaint={activeComplaint} setActiveComplaint={setActiveComplaint} messages={complaintMessages} onSend={addComplaintMessage} onResolution={changeComplaintResolution} properties={propertyRecords} onSubmitComplaint={submitComplaint} notifications={notifications} onReadNotification={markNotificationRead} complaintUnreadCounts={complaintUnreadCounts} onOpenComplaint={(item) => { markComplaintNotificationsRead(item.id); setActiveComplaint(item); }} onSignOut={() => supabase.auth.signOut()} toast={toast} onClearToast={() => setToast('')} onDownloadDocuments={downloadTenantPortalDocuments} tenantDocsBusy={tenantDocsBusy} canReviewUpgrades={isPlatformReviewer} onOpenUpgradeReview={() => window.location.assign(`${window.location.pathname}?portal=review`)}/><ScrollNavigation/><PropertyHelpAssistant/></>;

  return <>
    <div className={`app-shell theme-${landlordProfile?.brand_template || 'jade'}`}>
      <ScrollNavigation/><PropertyHelpAssistant/>
      <BrandWatermark logo={landlordProfile?.brand_logo || 'horizon'}/>
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="brand"><BrandLockup name={landlordProfile?.business_name || 'Yemilaz Properties'} logo={landlordProfile?.brand_logo || 'horizon'} className="workspace-brand"/><button className="mobile-close" onClick={() => setMenu(false)}><X size={19}/></button></div>
        <div className="workspace-pill"><div className="workspace-avatar">{initials(landlordProfile?.business_name || 'Y')}</div><span>{landlordProfile?.business_name || 'Property portfolio'}</span><ChevronDown size={15}/></div>
        <div className="side-scroll">{(portal === 'admin' ? [{ title: 'Platform administration', links: [...(isPlatformAdmin ? [['Platform staff', Users], ['Contact directory', Users], ['Landlord access', KeyRound], ['Complaints', CircleHelp], ['Profile standing', ShieldCheck]] : platformPermissions.includes('complaints_read') ? [['Complaints', CircleHelp]] : []), ...(isPlatformAdmin || platformPermissions.includes('listing_verification') ? [['Listing verification', ShieldCheck]] : []), ...(isPlatformAdmin || isPlatformReviewer ? [['Account upgrade review', ShieldCheck]] : [])] }] : [...nav, ...(isPlatformAdmin ? [{ title: 'Administration', links: [['Platform staff', Users], ['Contact directory', Users], ['Landlord access', KeyRound], ['Listing verification', ShieldCheck], ['Account upgrade review', ShieldCheck], ['Profile standing', ShieldCheck]] }] : [])]).map((group) => <div className="nav-group" key={group.title}><span className="nav-label">{group.title}</span>{group.links.map(([route, Icon, displayLabel = route]) => <button key={route} aria-current={page === route ? 'page' : undefined} className={`nav-link ${page === route ? 'selected' : ''}`} onClick={() => { setPage(route); setMenu(false); }}><Icon size={18} aria-hidden="true"/><span className="nav-link-label">{displayLabel}</span>{route === 'Tenants' && auth && <span className="nav-count" aria-label={`${tenants.length} tenants`}>{tenants.length}</span>}{route === 'Notifications' && notifications.some((notice) => !notice.read_at) && <span className="nav-count" aria-label={`${notifications.filter((notice) => !notice.read_at).length} unread notifications`}>{notifications.filter((notice) => !notice.read_at).length}</span>}</button>)}</div>)}</div>
        <div className="sidebar-bottom"><div className="upgrade-card"><Sparkles size={16}/><b>Portfolio insights</b><p>See what’s happening across your properties and tenancies.</p><button onClick={() => { setPage('Property insights'); setMenu(false); }}>View insights <ArrowRight size={14}/></button></div><div className="profile-row"><AccountProfilePhoto auth={auth} /><div><b>{auth?.email || 'Yemilaz Admin'}</b><small>{auth ? 'Property manager' : 'Preview mode'}</small></div></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open property management navigation" onClick={() => setMenu(true)}><Menu size={19}/></button><nav className="breadcrumb" aria-label="Breadcrumb"><span className="breadcrumb-workspace">{landlordProfile?.business_name || 'Yemilaz Properties'}</span><span className="breadcrumb-separator">/</span><b aria-current="page">{navLabels[page] || (page === 'Overview' ? 'Dashboard' : page)}</b><small className="platform-context">Property management</small></nav><div className="top-actions">{auth && portal !== 'admin' && <><AccountPortalSwitcher roles={accountPortals} activeRole={accountRole} onSelect={switchAccountPortal}/><button className="homepage-visibility-shortcut" onClick={() => setPage('Community spotlight')}><Sparkles size={15}/><span>Community spotlight</span></button></>}<button className="header-notifications" aria-label={`Notifications${notifications.some((notice) => !notice.read_at) ? `, ${notifications.filter((notice) => !notice.read_at).length} unread` : ''}`} onClick={() => setPage('Notifications')}><Bell size={17}/>{notifications.some((notice) => !notice.read_at) && <i>{notifications.filter((notice) => !notice.read_at).length}</i>}</button><button className="help-btn" onClick={() => setToast('How can we help? Email hello@yemilazproperties.com')}><CircleHelp size={17}/><span>Help centre</span></button><div className="top-divider"/>{auth ? <><AccountProfilePhoto auth={auth} className="top-avatar"/><button className="top-logout" onClick={() => supabase.auth.signOut()}><LogOut size={15}/><span>Log out</span></button></> : <button className="sign-in" onClick={() => setAuthModal(true)}>Sign in</button>}</div></header>
        {page === 'Profile standing' && portal === 'admin' && isPlatformAdmin ? <ProfileStandingAdminPage client={supabase}/> : page === 'Platform staff' && isPlatformAdmin ? <PlatformStaffPage client={supabase}/> : page === 'Listing verification' && (isPlatformAdmin || platformPermissions.includes('listing_verification')) ? <ListingVerificationPage client={supabase}/> : page === 'Complaints' && portal === 'admin' && !isPlatformAdmin && platformPermissions.includes('complaints_read') ? <ComplaintInbox records={records} activeComplaint={activeComplaint} setActiveComplaint={setActiveComplaint} messages={complaintMessages} onSend={addComplaintMessage} onResolution={changeComplaintResolution} currentUserId={auth.id} onNew={() => {}} allowNew={false} readOnly unreadCounts={complaintUnreadCounts} onOpenComplaint={(item) => setActiveComplaint(item)}/> : ['Audit history','Security & privacy','Property documents','Inspections','Property incidents','Email delivery','Property messages','Property notices','Tenant profile requests'].includes(page) ? <OperationsHub page={page} auth={auth} tenants={tenants} properties={propertyRecords} isAdmin={isPlatformAdmin} onRecordDocument={sendRecordDocument}/> : page === 'Property insights' ? <PropertyInsights properties={propertyRecords} tenants={tenants} payments={paymentRecords} onNavigate={setPage} onExport={() => exportPortfolioCsv(propertyRecords, tenants, paymentRecords)}/> : page === 'Notifications' ? <NotificationsPage notices={notifications} onRead={markNotificationRead}/> : page === 'Rent schedule' ? <RentSchedulePage charges={paymentRecords} tenants={tenants} onNavigate={setPage} onSetTransactionPaid={setTransactionPaid}/> : page === 'Maintenance' ? <MaintenancePage records={records} properties={propertyRecords} tenants={tenants} staff={staffRecords} userId={auth?.id} onRecordDocument={sendRecordDocument} onSave={async (row, invoice) => { const { data, error } = await supabase.from('maintenance_requests').insert(row).select().single(); if (error) { setToast(error.message); return false; } let saved=data; if(invoice instanceof File&&invoice.size){if(invoice.size>20*1024*1024){setToast('Invoice must be smaller than 20 MB. Request saved without the file.');}else{const path=`${auth.id}/${data.id}/${invoice.name.replace(/[^\w.-]/g,'_')}`;const {error:uploadError}=await supabase.storage.from('maintenance-invoices').upload(path,invoice,{contentType:invoice.type});if(uploadError)setToast(`Request saved, but invoice upload failed: ${uploadError.message}`);else{const updated=await supabase.from('maintenance_requests').update({invoice_path:path}).eq('id',data.id).select().single();if(!updated.error)saved=updated.data;}}}setRecords((current) => [saved, ...current]); const tenant=tenants.find((item)=>item.id===saved.tenant_id); const pdf=await sendRecordDocument({type:'maintenance',title:`Maintenance request: ${saved.title}`,summary:saved.description,tenantId:saved.tenant_id,propertyId:saved.property_id,details:[{label:'Priority',value:saved.priority},{label:'Status',value:saved.status},{label:'Reported',value:dateLabel(saved.created_at?.slice(0,10))}]}); setToast(pdf.ok?'Maintenance request recorded. A labelled PDF copy was emailed and saved to property documents.':`Maintenance request recorded. PDF/email copy needs attention: ${pdf.error}`); return true; }} onUpdate={async (item, values) => { const { data, error } = await supabase.from('maintenance_requests').update(values).eq('id', item.id).eq('owner_id', auth.id).select().single(); if (error) setToast(error.message); else { setRecords((current) => current.map((row) => row.id === data.id ? data : row)); const note = values.resolution_notes?.trim() || `Request status updated to ${(values.status || item.status).replaceAll('_',' ')}.`; const updateResult = await supabase.from('maintenance_request_updates').insert({ owner_id: auth.id, request_id: item.id, tenant_id: item.tenant_id, author_id: auth.id, body: note }); if (updateResult.error) setToast(`Maintenance status saved, but tenant update could not be sent: ${updateResult.error.message}`); const tenant=tenants.find((person)=>person.id===item.tenant_id); const pdf=await sendRecordDocument({type:'maintenance',title:'Maintenance status update',summary:note,tenantId:item.tenant_id,propertyId:item.property_id,details:[{label:'Request',value:item.title},{label:'New status',value:String(values.status||item.status).replaceAll('_',' ')},{label:'Updated',value:dateLabel(new Date().toISOString().slice(0,10))}]}); if(!pdf.ok)setToast(`Maintenance updated. PDF/email copy needs attention: ${pdf.error}`); } }}/> : page === 'Documents & signatures' ? <TenancySignaturesPage tenants={tenants} profile={landlordProfile} auth={auth}/> : page === 'Viewing calendar' ? <ViewingCalendarPage requests={records} onUpdate={updateViewingStatus} properties={propertyRecords}/> : page === 'Overview' ? <>
          <section className="welcome-row"><div><div className="eyebrow">{new Date().toLocaleDateString('en-NG', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()} <span className="live-dot"/></div><h1>Good morning, {landlordProfile?.full_name?.split(' ')[0] || 'Landlord'} <span>✳</span></h1><p>Here’s what’s happening with your properties today.</p></div><button className="primary-button" onClick={() => { if (!auth) { setAuthModal(true); return; } setInitialPaymentTotal(0); setModal(true); }}><Plus size={17}/> Add a tenant</button></section>

          <section className="metric-grid"><Metric icon={Building2} label="Total properties" value={auth ? propertyRecords.length : '—'} note="Across your portfolio" color="lavender"/><Metric icon={Users} label="Active tenants" value={auth ? tenants.filter((tenant) => tenant.status === 'active' && (!tenant.lease_end || tenant.lease_end >= todayISO)).length : '—'} note="Current lease records" color="mint"/><Metric icon={Wallet} label="Overdue rent" value={auth ? currency(overdueRentTotal) : '—'} note={`${overdueRent.length} unpaid rent ${overdueRent.length === 1 ? 'record' : 'records'}`} color="peach"/><Metric icon={Wallet} label="Other unpaid charges" value={auth ? currency(otherUnpaidTotal) : '—'} note={`${otherUnpaidCharges.length} outstanding ${otherUnpaidCharges.length === 1 ? 'charge' : 'charges'} · utilities, deposits & services`} color="peach"/><Metric icon={Clock3} label="Renewals due soon" value={auth ? leasesNeedingRenewal.length : '—'} note={`${leasesPastEnd.length} lease${leasesPastEnd.length === 1 ? '' : 's'} ended · review`} color="blue"/></section>
          {(overdueRent.length > 0 || otherUnpaidCharges.length > 0 || leasesNeedingRenewal.length > 0 || leasesPastEnd.length > 0) && <section className="panel attention-panel"><div><span className="eyebrow">NEEDS YOUR ATTENTION</span><h2>Balances and lease reminders</h2><p>Review unpaid rent, other unpaid charges and lease end dates. Lease end is a prompt to review renewal or next steps; no eviction action is automatic.</p></div><div className="attention-actions">{overdueRent.length > 0 && <button className="attention-action overdue" onClick={() => setPage('Rent schedule')}><b>{overdueRent.length} overdue rent {overdueRent.length === 1 ? 'item' : 'items'}</b><small>{currency(overdueRentTotal)} outstanding · Review rent schedule</small></button>}{otherUnpaidCharges.length > 0 && <button className="attention-action" onClick={() => { setQuery(''); setPage('Payments & charges'); }}><b>{otherUnpaidCharges.length} other unpaid {otherUnpaidCharges.length === 1 ? 'charge' : 'charges'}</b><small>{currency(otherUnpaidTotal)} outstanding · View payments & charges</small></button>}{leasesNeedingRenewal.length > 0 && <button className="attention-action" onClick={() => setPage('Tenants')}><b>{leasesNeedingRenewal.length} renewal {leasesNeedingRenewal.length === 1 ? 'due' : 'dates due'} within 30 days</b><small>Contact the tenant and record the agreed renewal</small></button>}{leasesPastEnd.length > 0 && <button className="attention-action overdue" onClick={() => setPage('Tenants')}><b>{leasesPastEnd.length} lease{leasesPastEnd.length === 1 ? '' : 's'} ended · review</b><small>Check occupancy, agreement terms and required notice steps</small></button>}</div></section>}
          <section className="content-grid"><div className="panel tenants-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR PORTFOLIO</span><h2>Recent tenants {auth && <span className="count-badge">{tenants.length}</span>}</h2></div><button className="text-button" onClick={() => setPage('Tenants')}>View all <ArrowRight size={15}/></button></div><div className="table-tools"><label className="search-box"><Search size={16}/><input placeholder="Search tenants..." value={query} onChange={(event) => setQuery(event.target.value)}/></label><button className="filter-button" onClick={() => setFilter(filter === 'All properties' ? 'Active only' : 'All properties')}><SlidersHorizontal size={15}/>{filter}<ChevronDown size={13}/></button></div><div className="table-wrap"><table><thead><tr><th>TENANT</th><th>PROPERTY / ASSIGNED TEAM</th><th>LEASE START</th><th>STATUS</th><th>ANNUAL RENT</th></tr></thead><tbody>{(auth ? displayedTenants : []).slice(0, 5).map((tenant, index) => <tr key={tenant.id}><td><div className="tenant-cell"><div className={`tenant-avatar avatar-${index % 4}`}>{tenant.initials}</div><b>{tenant.name}</b></div></td><td>{tenant.property}<small className="directory-subline">{tenant.assignedTeam || 'No assigned team member'}</small></td><td>{tenant.date}</td><td><span className={`status ${tenant.displayStatus === 'Active' ? 'active' : 'renewal'}`}><i/>{tenant.displayStatus}</span></td><td className="rent-cell">{tenant.rent}</td></tr>)}</tbody></table>{auth && displayedTenants.length === 0 && <div className="empty-state">No tenant records yet.</div>}{!auth && <div className="empty-state">Sign in to view your tenant records.</div>}</div><div className="panel-footer"><span>{auth ? `Showing ${Math.min(displayedTenants.length, 5)} of ${tenants.length} tenants` : 'Your tenant records appear after sign in'}</span><button onClick={() => setPage('Tenants')}>Manage tenants <ArrowUpRight size={14}/></button></div></div>
            <div className="right-column"><div className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow">THE LATEST</span><h2>Portfolio reminders</h2></div></div><div className="activity-list"><Activity icon={Check} tone="green" title="Properties ready to advertise" text={`${dashboardAds.length} available properties featured`} time="Dashboard listings"/><Activity icon={FileText} tone="purple" title="Payment records" text={`${paymentRecords.length} rent and service records`} time="Payments & charges"/><Activity icon={CalendarDays} tone="orange" title="Tenant allocations" text={`${tenants.filter((tenant) => tenant.property_id).length} properties allocated`} time="Tenant directory"/></div><button className="activity-link" onClick={() => setPage('Payments & charges')}>View payments <ArrowRight size={14}/></button></div><div className="reminder-card"><div className="reminder-icon"><Building2 size={17}/></div><div><span className="eyebrow">AVAILABLE LISTINGS</span><h3>{availableProperties.length} unallocated properties</h3><p>Advertise an available property from Properties.</p></div><ArrowUpRight className="reminder-arrow" size={17}/></div></div>
          </section>
          <section className="listings-section"><div className="listings-heading"><div><span className="eyebrow">AVAILABLE TO RENT OR BUY</span><h2>Dashboard advertisements</h2></div><button className="text-button" onClick={() => setPage('Properties')}>Manage properties <ArrowRight size={15}/></button></div>{dashboardAds.length ? <div className="property-grid">{dashboardAds.map((property) => <PropertyCard key={property.id} property={property}/>)}</div> : <div className="empty-management"><span><Building2 size={23}/></span><h3>No advertised properties yet</h3><p>Add an available property, then choose “Advertise” in Properties to show it here.</p><button className="secondary-button" onClick={() => { if (!auth) { setAuthModal(true); return; } setPage('Properties'); setModal(true); }}><Plus size={15}/> Add a property</button></div>}</section>
        </> : page === 'Community spotlight' ? <CommunitySpotlightContent auth={auth}/> : page === 'Account upgrades' ? <AccountUpgradePanel client={supabase} auth={auth} role={accountRole} availableRoles={accountPortals} canReview={isPlatformReviewer} onOpenReview={() => setPage('Account upgrade review')}/> : page === 'Account upgrade review' && isPlatformReviewer ? <PlatformUpgradeReview client={supabase} isAdmin={isPlatformAdmin} onBack={() => setPage('Account upgrades')} onManageStaff={() => window.location.assign(`${window.location.pathname}?portal=admin&adminPage=Platform%20staff`)}/> : page === 'Landlord profile' ? <LandlordProfilePage profile={landlordProfile} email={auth.email} onSave={saveLandlordProfile} saving={saving}/> : page === 'Contact directory' && isPlatformAdmin ? <PlatformContactDirectory client={supabase} onSetStatus={setAccountStatus}/> : page === 'Landlord access' && isPlatformAdmin ? <PlatformAccessPage client={supabase}/> : page === 'Listing verification' && isPlatformAdmin ? <ListingVerificationPage client={supabase}/> : page === 'Complaints' ? showComplaintRoom ? <PublicComplaintRoom properties={propertyRecords} tenants={tenants} roleDefault="Landlord" onBack={() => setShowComplaintRoom(false)} onSubmit={submitComplaint}/> : <ComplaintInbox records={records} activeComplaint={activeComplaint} setActiveComplaint={setActiveComplaint} messages={complaintMessages} onSend={addComplaintMessage} onResolution={changeComplaintResolution} currentUserId={auth.id} onNew={() => setShowComplaintRoom(true)} unreadCounts={complaintUnreadCounts} onOpenComplaint={(item) => { markComplaintNotificationsRead(item.id); setActiveComplaint(item); }}/> : <ManagementPage
          page={page} tenants={visibleTenants} records={page === 'Properties' ? propertyRecords : page === 'Payments & charges' ? visiblePayments : records}
          query={query} setQuery={setQuery} openModal={() => { if (!auth) { setAuthModal(true); return; } setInitialPaymentTotal(0); setModal(true); }}
          onDeleteProperty={deleteProperty} onToggleAdvertisement={toggleAdvertisement}
          onEditPerson={(record, kind, focusTeam = false) => setEditingPerson({ ...record, kind, focusTeam })} onDeletePerson={deletePerson}
          onRequestVerification={requestListingVerification}
          onUpdateViewingStatus={updateViewingStatus}
          onUpdateListingReport={updateListingReport}
          onMarkProfileMessageRead={markPublicProfileMessageRead}
          onUpdatePropertyStatus={updatePropertyStatus}
          onAllocate={(tenant) => { if (!auth) { setAuthModal(true); return; } setAllocationTenant(tenant); }}
          onRecordPayment={() => setPage('Payments & charges')} onEditTransaction={(record) => setEditingPerson({ ...record, kind: 'charge' })} onVoidTransaction={voidTransaction} onSetTransactionPaid={setTransactionPaid} onDeleteTransaction={deleteUnpaidTransaction} transactionActionId={transactionActionId} onSendPacket={sendTenantPackets} sendingTenant={sendingTenant}
          onDownloadPdfs={downloadTenantPdfs} downloadingTenant={downloadingTenant} hasPaid={paidForTenant}
        />}
        <footer className="site-footer"><BrandLockup name={landlordProfile?.business_name || 'Yemilaz Properties'} className="site-footer-brand"/><span>© {new Date().getFullYear()} {landlordProfile?.business_name || 'Yemilaz Properties'}</span><span>Property management and records by Yemilaz Properties.</span></footer>
      </main>
    </div>

    {modal && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(false)}><form className="modal" onInput={(event) => updateInitialPaymentTotal(event.currentTarget)} onChange={(event) => updateInitialPaymentTotal(event.currentTarget)} onSubmit={page === 'Tenants' || page === 'Overview' ? addTenant : saveOtherRecord}>
      <div className="modal-heading"><div><span className="eyebrow">PORTFOLIO MANAGEMENT</span><h2>{page === 'Tenants' || page === 'Overview' ? 'Register tenant' : `Add ${page === 'Payments & charges' ? 'payment or charge' : page === 'Properties' ? 'property' : page === 'Guarantors' ? 'guarantor' : page.slice(0, -1).toLowerCase()} record`}</h2><p>Save these details to your Yemilaz Properties records.</p></div><button type="button" className="icon-button" onClick={() => setModal(false)}><X size={19}/></button></div>
      {(page === 'Tenants' || page === 'Overview') ? <>
        <div className="form-section-title">Tenant details</div>
        <label>Tenant’s full name<input required name="full_name" placeholder="e.g. Amara Okafor"/></label>
        <div className="form-row"><label>Tenant email<input required name="email" type="email" autoComplete="email"/></label><label>Tenant phone<input name="phone" type="tel" autoComplete="tel"/></label></div>
        <label>Permanent address <small>(optional)</small><input name="permanent_address" autoComplete="street-address" placeholder="Tenant’s current home address"/></label>
        <div className="form-section-title">Tenancy terms</div>
        <div className="form-row"><label>Lease start<input required name="lease_start" type="date"/></label><label>Lease end<input required name="lease_end" type="date"/></label></div>
        <div className="form-row"><label>Rent amount (₦)<input required name="rent_amount" type="number" min="0" step="0.01"/></label><label>Rent frequency<select name="rent_frequency"><option value="yearly">Yearly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></label></div>
        <div className="form-section-title">Move-in payment records</div>
        <p className="payment-entry-help">Record rent and the refundable deposit separately. A deposit is kept in the ledger as a deposit and does not count as rent paid.</p>
        <div className="payment-entry-group"><b>Rent received</b><div className="form-row"><label>Amount received (₦)<input name="initial_rent_payment" type="number" min="0" step="0.01" defaultValue="0"/><small>Enter up to one rent period. A full rent amount marks the first period as paid.</small></label><label>Date received<input name="rent_payment_date" type="date"/><small>For an existing tenant, enter the actual historical receipt date.</small></label></div></div>
        <div className="payment-entry-group"><b>Deposit received</b><div className="form-row"><label>Amount received (₦)<input name="initial_deposit_payment" type="number" min="0" step="0.01" defaultValue="0"/><small>Keep this separate from rent; it will not create rent credit.</small></label><label>Date received<input name="deposit_payment_date" type="date"/><small>Use the actual date the deposit was received.</small></label></div></div>
        <MoveInChargesEditor />
        <div className="move-in-payment-total"><span>Total received at move-in</span><strong>{currency(initialPaymentTotal)}</strong><small>Includes rent, deposit and additional charges marked paid.</small></div>
        <div className="form-row"><label>Allocate available property<select name="property_id" defaultValue=""><option value="">Leave unallocated</option>{availableProperties.map((property) => <option key={property.id} value={property.id}>{property.name} · {currency(property.price)}</option>)}</select><small>Allocation requires a recorded rent or deposit receipt above zero.</small></label></div>
        <div className="form-section-title">Guarantor details · required for their copy</div>
        <label>Guarantor’s full name<input required name="guarantor_name"/></label>
        <div className="form-row"><label>Guarantor email<input required name="guarantor_email" type="email"/></label><label>Guarantor phone<input name="guarantor_phone"/></label></div>
        <div className="form-row"><label>Relationship<input name="guarantor_relationship"/></label><label>Occupation<input name="guarantor_occupation"/></label></div>
        <label>Guarantor address<input name="guarantor_address"/></label>
        <div className="form-section-title">Property team <small>(optional)</small></div>
        <p className="setup-note">Assign an agent, caretaker, lawyer, or any combination. You can leave these blank and add a team member later. Assigned people and the tenant receive an in-app and email update when the team changes.</p>
        <div className="form-row"><label>Agent<select name="agent_id" defaultValue=""><option value="">No agent</option>{staffRecords.filter((person) => person.role === 'agent' && person.email).map((person) => <option key={person.id} value={person.id}>{person.full_name} · {person.email}</option>)}</select></label><label>Caretaker<select name="caretaker_id" defaultValue=""><option value="">No caretaker</option>{staffRecords.filter((person) => person.role === 'caretaker' && person.email).map((person) => <option key={person.id} value={person.id}>{person.full_name} · {person.email}</option>)}</select></label></div>
        <label>Lawyer<select name="lawyer_id" defaultValue=""><option value="">No assigned lawyer</option>{staffRecords.filter((person) => person.role === 'lawyer' && person.email).map((person) => <option key={person.id} value={person.id}>{person.full_name} · {person.email}</option>)}</select></label>
        <label>Notes<input name="notes" placeholder="Unit, references or other details"/></label>
      </> : page === 'Properties' ? <>
        <label>Property name<input required name="name" placeholder="e.g. Meridian Plaza, 2 plots in Ibadan, or Greenfield Farm"/></label>
        <div className="form-row"><label>Property type<select name="property_type"><optgroup label="Residential"><option>House</option><option>Apartment</option><option>Duplex</option><option>Room</option><option>Short-stay accommodation</option></optgroup><optgroup label="Commercial"><option>Shop / Retail</option><option>Office</option><option>Store / Warehouse</option><option>Industrial / Workshop</option><option>Hotel / Guesthouse</option><option>Mixed-use building</option></optgroup><optgroup label="Land & agriculture"><option>Residential land / plot</option><option>Commercial land</option><option>Farmland</option><option>Farm estate</option></optgroup><optgroup label="Other"><option>Parking space</option><option>Event space</option><option>Other property</option></optgroup></select></label><label>Listing type<select name="listing_type"><option value="rent">For rent / lease</option><option value="sale">For sale</option></select></label></div>
        <div className="form-row"><label>Price (₦)<input required name="price" type="number" min="0"/></label><label>Rent period<select name="price_period"><option value="year">Per year</option><option value="month">Per month</option><option value="week">Per week</option><option value="day">Per day</option></select><small>Used for rental listings; sales use a one-time asking price.</small></label></div>
        <div className="form-row"><label>Property size <small>(optional; include units)</small><input name="property_size" maxLength="120" placeholder="e.g. 120 sqm, 2 plots, 6,000 sqm"/></label><label>Suitable use <small>(optional)</small><input name="intended_use" maxLength="160" placeholder="e.g. retail, storage, crop farming"/></label></div>
        <label>Street address / location description<input name="address" placeholder="Street, area, plot reference, or landmark"/></label>
        <LocationFields /><div className="form-row"><label>Map latitude <small>(optional)</small><input name="latitude" type="number" min="-90" max="90" step="any" placeholder="e.g. 7.3775"/></label><label>Map longitude <small>(optional)</small><input name="longitude" type="number" min="-180" max="180" step="any" placeholder="e.g. 3.9470"/></label></div>
        <div className="form-row"><label>Bedrooms <small>(optional, for residential property)</small><input name="bedrooms" type="number" min="0"/></label><label>Bathrooms <small>(optional, for residential property)</small><input name="bathrooms" type="number" min="0"/></label></div>
        <label>Property photos<input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple/><small>Upload up to 5 JPG, PNG or WebP photos, maximum 5 MB each. Use clear, current photos and avoid personal or identifying information.</small></label><label>Amenities<input name="amenities" placeholder="Parking, generator, security, garden"/><small>Separate amenities with commas.</small></label><label>Description<textarea name="description" rows="3"/></label>
        <label className="checkbox-row"><input type="checkbox" name="is_advertised" defaultChecked/> Advertise on the dashboard while available</label>
      </> : page === 'Payments & charges' ? <>
        <div className="form-section-title">Charge details</div>
        <label>What is this payment for?<input required name="description" placeholder="e.g. November rent or generator servicing"/></label>
        <div className="form-row"><label>Tenant<select name="tenant_id" defaultValue=""><option value="">Property / general charge</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.full_name}</option>)}</select></label><label>Category<select name="category"><option value="rent">Rent</option><option value="deposit">Deposit</option><option value="utilities">Utilities</option><option value="maintenance">Maintenance</option><option value="security">Security</option><option value="cleaning">Cleaning</option><option value="other">Other</option></select></label></div>
        <label>Renewal duration <small>(only used when the description starts with “Renewal rent”)</small><select name="lease_extension_months" defaultValue=""><option value="">Use the original agreement term</option><option value="1">1 month</option><option value="3">3 months</option><option value="6">6 months</option><option value="9">9 months</option><option value="12">12 months</option><option value="18">18 months</option><option value="24">24 months</option></select><small>The new end date is calculated from the tenant’s current lease end date.</small></label>
        <div className="form-row"><label>Amount (₦)<input required name="amount" type="number" min="0" step="0.01"/><small>Enter the amount for this one rent period or charge.</small></label><label>Record status<select name="status"><option value="paid">Paid in full</option><option value="unpaid">Unpaid / due</option><option value="waived">Waived</option></select></label></div>
        <div className="form-section-title">Dates and receipt</div>
        <p className="payment-entry-help">Use the due date for when payment is expected and the paid date for when money was actually received. Leave paid date blank for an unpaid item.</p>
        <div className="form-row"><label>Due date<input name="due_date" type="date"/></label><label>Paid date<input name="paid_at" type="date"/></label></div><label>Receipt or payment evidence <small>(optional, private; up to 10 MB)</small><input name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"/></label>
      </> : page === 'Guarantors' ? <>
        <label>Guarantor’s full name<input required name="full_name"/></label><div className="form-row"><label>Phone<input name="phone"/></label><label>Email<input name="email" type="email"/></label></div><div className="form-row"><label>Relationship to tenant<input name="relationship"/></label><label>Occupation<input name="occupation"/></label></div><label>Address<input name="address"/></label>
      </> : <>
        <label>Full name<input required name="full_name"/></label><div className="form-row"><label>Phone<input name="phone"/></label><label>Email<input name="email" type="email"/></label></div><label>Notes<input name="notes" placeholder="Assigned properties or details"/></label>
      </>}
      <div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button><button className="primary-button" disabled={saving}><Plus size={16}/>{saving ? 'Saving…' : 'Save record'}</button></div>
    </form></div>}

    {editingPerson?.kind === 'charge' && <TransactionEditModal transaction={editingPerson} tenants={tenants} saving={saving} onSave={savePersonEdit} onClose={() => setEditingPerson(null)}/>}
    {editingPerson && editingPerson.kind !== 'charge' && <EditPersonModal person={editingPerson} staff={staffRecords} saving={saving} onSave={savePersonEdit} onClose={() => setEditingPerson(null)}/>}

    {allocationTenant && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setAllocationTenant(null)}><form className="modal" onSubmit={allocateProperty}><div className="modal-heading"><div><span className="eyebrow">PROPERTY ALLOCATION</span><h2>{allocationTenant.property_id ? 'Change tenant property' : 'Allocate a property'}</h2><p>{allocationTenant.full_name} · allocation is available after a rent or deposit payment is recorded.</p></div><button type="button" className="icon-button" onClick={() => setAllocationTenant(null)}><X size={19}/></button></div><label>Available property<select required name="property_id" defaultValue=""><option value="">Select a property</option>{availableProperties.map((property) => <option key={property.id} value={property.id}>{property.name} · {currency(property.price)}</option>)}</select></label>{!paidForTenant(allocationTenant.id) && <p className="setup-note">Record a paid rent or deposit under Payments & charges before allocating a property.</p>}<div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setAllocationTenant(null)}>Cancel</button><button className="primary-button" disabled={saving || !paidForTenant(allocationTenant.id)}>Allocate property</button></div></form></div>}

    {confirmDialog && <div className="confirm-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !confirmBusy && (setConfirmDialog(null), setConfirmReason(''), setConfirmError(''))}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message"><div className={`confirm-icon ${confirmDialog.variant || 'danger'}`}><AlertTriangle size={22}/></div><span className="eyebrow">{confirmDialog.variant === 'warning' ? 'REVIEW THIS CHANGE' : 'CONFIRM ACTION'}</span><h2 id="confirm-dialog-title">{confirmDialog.title}</h2><p id="confirm-dialog-message" className="confirm-message">{confirmDialog.message}</p><p className="confirm-detail">{confirmDialog.detail}</p>{confirmError && <p className="confirm-error" role="alert">{confirmError}</p>}{confirmDialog.requireReason && <label className="confirm-reason">Reason for voiding<textarea autoFocus rows={3} value={confirmReason} onChange={(event) => { setConfirmReason(event.target.value); setConfirmError(''); }} maxLength={500} placeholder="Add a short reason for the transaction history"/></label>}<div className="confirm-actions"><button type="button" className="secondary-button" disabled={confirmBusy} onClick={() => { setConfirmDialog(null); setConfirmReason(''); setConfirmError(''); }}>Cancel</button><button type="button" className={`confirm-submit ${confirmDialog.variant || 'danger'}`} disabled={confirmBusy || (confirmDialog.requireReason && !confirmReason.trim())} onClick={runConfirmedAction}>{confirmBusy ? 'Please wait…' : confirmDialog.confirmLabel || 'Confirm'}</button></div></section></div>}
    {authNotice && <AuthNoticeDialog notice={authNotice} onClose={() => setAuthNotice(null)} onResend={resendConfirmation} onUpdatePassword={saveNewPassword} signing={signing}/>}
    {toast && <div className="toast" role="status" aria-live="polite"><Check size={16}/>{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15}/></button></div>}
  </>;
}

const PUBLIC_POLICIES = [
  { id: 'fees-payment', title: 'Fees and payment terms', summary: 'Understand the costs, payment recipient, deadlines, receipts and refund terms to confirm before you commit.', sections: [
    ['Prices and charges', 'The advertised price and listing details are supplied by the property advertiser and may change. Before making a decision, request a written breakdown of rent or purchase price, security deposit, agency or professional fees, service charges, utilities, taxes where applicable, payment deadlines and any other amount due. Ask which charges are one-off, recurring or refundable.'],
    ['Payment safety and receipts', 'Confirm the exact recipient, account details and purpose through a trusted contact method before paying. Be cautious if payment instructions or bank details change unexpectedly; independently verify the change with a known contact. Pay only after confirming the property and the recipient’s authority. Request and keep a receipt for every payment, together with any written confirmation of the amount and what it covers.'],
    ['Refunds and platform payments', 'Ask the property owner or manager to explain any cancellation, refund, deposit-return or late-payment terms in writing before payment. Unless a clearly identified payment checkout is presented for a specific service, Yemilaz Properties does not receive or hold money for a property listing. Do not treat an enquiry or viewing request as an instruction to pay.']
  ]},
  { id: 'tenancy-safety', title: 'Tenancy, property use and safety', summary: 'Practical steps for checking a property, reviewing an agreement, documenting handover and responding to safety concerns.', sections: [
    ['Before you agree', 'Arrange an in-person inspection where possible and confirm the property address, condition, permitted use, access arrangements and included facilities. Ask for evidence that the person advertising is authorized to let or sell the property. Check that the details in the agreement match the property and the people involved.'],
    ['Agreement and handover', 'Read the complete written agreement before signing. Pay attention to duration, renewal, termination, repairs, responsibilities, deposits, notice requirements and any restrictions on use. Keep a signed copy and receipts for payments. At handover, record the property’s condition, meter readings where relevant, keys and any items supplied; share the record with the other party.'],
    ['Personal and property safety', 'Do not share keys, identity documents, passwords or sensitive payment information with an unverified person. Arrange viewings safely and tell someone you trust where you are going. For immediate danger or a medical emergency, contact local emergency services first, then notify the property manager through a known channel. Use “Report this listing” to flag suspicious or inaccurate adverts. These are general safety suggestions and do not replace professional advice.']
  ]},
  { id: 'privacy', title: 'Privacy notice', summary: 'Learn what information may be submitted, why it is used, who can access it and how to raise a privacy request.', sections: [
    ['Information and use', 'When using this website, you may provide contact details, enquiry or viewing information, account and profile details, complaint messages, property details and documents you choose to share. We use submitted information to operate the service, route requests to relevant property contacts, provide account features, help prevent misuse and respond to support or privacy requests.'],
    ['Who may access information', 'Information is available to people who need it for the relevant request or property relationship, such as the assigned property contacts and service providers supporting the website. Complaint records are limited to people linked to the case and authorized platform administrators. Please avoid including passwords, payment card details or unrelated sensitive information in messages or uploads.'],
    ['Retention and your choices', 'We retain information for as long as needed to provide the service, maintain relevant records and address legitimate operational or safety needs. You may contact us to ask about your information, request a correction or ask for deletion. Some records may need to be kept for operational or legal reasons. To make a privacy request, email hello@yemilazproperties.com from an address where we can reply; do not send your password or full payment credentials.']
  ]},
  { id: 'website-terms', title: 'Website terms', summary: 'The basic rules for using listings, enquiries, viewing requests, complaints and other website features.', sections: [
    ['Listings and property decisions', 'Property listings are supplied by their advertisers. Details can change, and a listing is not a guarantee that a property is available, suitable or accurately described. Verify important information directly and independently before relying on it. A listing, enquiry, message or viewing request does not itself create a tenancy, sale, reservation or payment obligation. Any agreement is made separately between the relevant parties.'],
    ['Your use of the website', 'Provide accurate information when submitting an enquiry, viewing request, listing report, complaint or account details. Use the website lawfully. Do not impersonate another person, submit knowingly false reports, interfere with other users or systems, attempt unauthorized access, or share content you are not entitled to provide. Use complaint and messaging tools respectfully and only for relevant property matters.'],
    ['Service information and changes', 'Website features and listing information may be updated, changed or unavailable from time to time. We may restrict access where reasonably necessary to protect the service or its users. These website terms do not replace a signed property agreement, payment terms agreed with an owner or manager, or advice from a qualified professional. Please have these terms reviewed for your business and local requirements before relying on them as formal legal documents.']
  ]}
];

const PUBLIC_FEATURES = [
  { id: 'property-marketplace', category: 'Discover and connect', title: 'Property marketplace', icon: Search, summary: 'Browse advertised homes, commercial spaces, land and other available properties.', detail: 'Visitors can explore public listings and narrow results by location, property type, rent or sale, and budget. Property seekers can save favourites on the current browser and open a listing to review its details.', audience: 'Property seekers, buyers, renters and advertisers', steps: ['Browse current listings', 'Filter by location, property type and budget', 'Open a listing to review details and contact its advertiser'] },
  { id: 'enquiries-viewings', category: 'Discover and connect', title: 'Enquiries and viewings', icon: MapPin, summary: 'Send a listing enquiry, ask for a viewing or report an advert for review.', detail: 'Each listing has its own contact actions. An enquiry or viewing request is sent to the listing manager for follow-up; a viewing is not confirmed until the property contact replies.', audience: 'Property seekers and listing managers', steps: ['Choose an available listing', 'Submit your contact details and request', 'Continue arrangements directly with the listing contact'] },
  { id: 'property-records', category: 'Manage a portfolio', title: 'Property records', icon: Building2, summary: 'Keep property details, availability, use and advertising status together in your account.', detail: 'Landlords can maintain records for different kinds of property, including residential and commercial spaces, land and other rentable or saleable property. Listing details can be advertised publicly when marked available.', audience: 'Landlords, property owners and developers', steps: ['Create or update a property record', 'Record its address, type, price and status', 'Advertise available property on the marketplace'] },
  { id: 'tenant-management', category: 'Manage a portfolio', title: 'Tenant and tenancy records', icon: Users, summary: 'Register tenant contact and lease details, then connect a tenant login to the matching record.', detail: 'A tenant account is matched using the email the landlord recorded. Linked tenants can access their tenancy details, assigned property, relevant contacts and documents from their own portal.', audience: 'Landlords and registered tenants', steps: ['Add the tenant and required contact details', 'Record lease and property information', 'The tenant signs up using the registered email address'] },
  { id: 'team-roles', category: 'Manage a portfolio', title: 'Property team accounts', icon: KeyRound, summary: 'Connect agents, caretakers and lawyers to the properties and people they support.', detail: 'Landlords create the staff record first. The team member then signs up with the same email so the account can be linked to the correct assignment. Access is role based and administrator accounts use a separate sign-in.', audience: 'Landlords, agents, caretakers and property lawyers', steps: ['Register a team member and choose their role', 'Assign relevant property or tenancy work', 'Team member activates the profile using the registered email'] },
  { id: 'payments-charges', category: 'Manage a portfolio', title: 'Payments and charges', icon: Wallet, summary: 'Record property payments and charges, review transaction history and manage corrections.', detail: 'The landlord account keeps a record of transactions and related charges for the property portfolio. Confirm the actual payment recipient and retain receipts; recording a transaction in the website does not itself transfer money.', audience: 'Landlords and authorized property staff', steps: ['Record a payment or charge against the relevant property or tenant', 'Review the transaction in the ledger', 'Correct or void a record when appropriate'] },
  { id: 'rent-schedule', category: 'Manage a portfolio', title: 'Rent schedule', icon: CalendarDays, summary: 'Review upcoming and overdue rent entries alongside recorded payment status.', detail: 'The schedule organizes lease-based rent entries so property managers can follow due dates and see which records have been marked paid. It is a management record, not an automatic bank collection service.', audience: 'Landlords and property managers', steps: ['Add a tenant with lease and rent details', 'Review due and upcoming entries', 'Update the payment record when funds are received'] },
  { id: 'maintenance', category: 'Coordinate property work', title: 'Maintenance requests', icon: Wrench, summary: 'Submit property issues and keep a record of assigned maintenance work.', detail: 'Tenants can report maintenance issues through their portal. Property teams can review requests, assign work and track updates so the people involved can follow the issue.', audience: 'Tenants, caretakers, agents and landlords', steps: ['Describe the issue and its priority', 'Property staff review and assign the request', 'Keep status and completion details with the property record'] },
  { id: 'messages-complaints', category: 'Coordinate property work', title: 'Messages and complaints', icon: CircleHelp, summary: 'Keep property conversations and complaint updates linked to the people involved.', detail: 'Linked participants can use property conversations and the complaint room to send and follow relevant messages. Unread counts help recipients see that a reply or case update is waiting in their account.', audience: 'Landlords, tenants, agents, caretakers and assigned lawyers', steps: ['Choose an eligible linked contact or submit a case', 'The recipient sees the message or pending complaint in their account', 'Participants continue the conversation and review replies'] },
  { id: 'documents-signatures', category: 'Coordinate property work', title: 'Property documents', icon: FileText, summary: 'Prepare property documents, record typed signatures and make shared files available to linked accounts.', detail: 'Documents can be prepared and shared with the relevant property participants. The signature workflow records typed names and timestamps; it is not represented as a certified electronic-signature service. Available documents can be viewed or downloaded from the associated account.', audience: 'Landlords, tenants and linked property participants', steps: ['Prepare the document for the relevant tenancy or property', 'Share it with the intended participants', 'Review, sign where requested and download available copies'] },
  { id: 'notifications', category: 'Stay informed and in control', title: 'Notifications', icon: Bell, summary: 'See account notices and pending complaint or message activity in the property portal.', detail: 'In-account notification controls help participants review new property activity and mark notices as read. The website’s visible pending counts are a reminder to open and review the related conversation.', audience: 'All registered portal roles', steps: ['A relevant message or case update is recorded', 'The recipient sees an unread indicator in their account', 'Open the item to review the update'] },
  { id: 'property-insights', category: 'Stay informed and in control', title: 'Portfolio overview and reports', icon: Clock3, summary: 'See portfolio summaries and review property, rent, lease and maintenance information.', detail: 'The landlord account brings key property records into an overview and provides property insights for reviewing occupancy, recorded finances and operational items. Report values reflect the records entered in the account.', audience: 'Landlords and property managers', steps: ['Maintain accurate property, tenancy and payment records', 'Review portfolio summaries and available reports', 'Use the information to follow up on items needing attention'] },
  { id: 'account-administration', category: 'Stay informed and in control', title: 'Account administration', icon: ShieldCheck, summary: 'Keep role access separate and let authorized administrators review and manage accounts.', detail: 'The platform administrator has a dedicated login and can review registered contacts and linked account status. Authorized account controls include suspending and reactivating an account when needed.', audience: 'Authorized platform administrators', steps: ['Sign in through the separate administration page', 'Review people and account status', 'Suspend or reactivate access when appropriate'] },
];
const FEATURE_CATEGORIES = [...new Set(PUBLIC_FEATURES.map((item) => item.category))];

function FeatureCard({ feature, onOpen }) {
  const Icon = feature.icon;
  return <button type="button" className="public-feature-card" onClick={() => onOpen(feature.id)}><span className="feature-card-icon"><Icon size={19}/></span><span className="feature-card-category">{feature.category}</span><b>{feature.title}</b><span className="feature-card-summary">{feature.summary}</span><span className="feature-card-link">Explore feature <ArrowRight size={14}/></span></button>;
}

function PublicMemberMessageDialog({ member, onClose }) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (!supabase) { setFeedback('Messaging is temporarily unavailable. Please try again later.'); return; }
    const form = new FormData(event.currentTarget);
    setBusy(true); setFeedback('');
    const { error } = await supabase.rpc('send_public_profile_message', {
      p_public_profile_id: member.profile_id,
      p_sender_name: String(form.get('sender_name') || ''),
      p_sender_email: String(form.get('sender_email') || ''),
      p_sender_phone: String(form.get('sender_phone') || ''),
      p_subject: String(form.get('subject') || ''),
      p_message: String(form.get('message') || ''),
      p_website: String(form.get('website') || ''),
    });
    setBusy(false);
    if (error) setFeedback(error.message);
    else setSent(true);
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal public-member-message-modal" role="dialog" aria-modal="true" aria-labelledby="public-member-message-title"><div className="modal-heading"><div><span className="eyebrow">PRIVATE WEBSITE MESSAGE</span><h2 id="public-member-message-title">Message {member.display_name}</h2><p>Your note will be delivered to this member’s Yemilaz portal. They can reply to your email.</p></div><button type="button" className="icon-button" aria-label="Close message form" onClick={onClose}><X size={18}/></button></div>{sent ? <div className="public-message-success"><span><Check size={20}/></span><h3>Message sent</h3><p>Your message has been delivered privately. The member can reply using the email address you provided.</p><button className="primary-button" onClick={onClose}>Done</button></div> : <form onSubmit={submit}><div className="form-row"><label>Your name<input required name="sender_name" minLength="2" maxLength="120" autoComplete="name"/></label><label>Email for reply<input required name="sender_email" type="email" maxLength="254" autoComplete="email"/></label></div><label>Phone number <small>(optional)</small><input name="sender_phone" type="tel" maxLength="40" autoComplete="tel"/></label><label>Subject<input required name="subject" minLength="2" maxLength="120" placeholder="What would you like to discuss?"/></label><label>Your message<textarea required name="message" minLength="10" maxLength="3000" rows="5" placeholder="Write a clear message for this member…"/></label><label className="public-message-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>{feedback && <p className="public-message-feedback" role="alert">{feedback}</p>}<div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy || !supabase}>{busy ? 'Sending…' : 'Send private message'}</button></div><p className="public-message-privacy">Your contact details and message are shared with this member so they can respond. Yemilaz Properties will not display your message publicly.</p></form>}</section></div>;
}

function PublicLanding({ properties, onSignIn, onAdminSignIn, onComplaint }) {
  const [policyPage, setPolicyPage] = useState(() => window.location.hash === '#about-us' ? 'about-us' : window.location.hash === '#short-lets' ? 'short-lets' : window.location.hash.startsWith('#policy=') ? decodeURIComponent(window.location.hash.slice(8)) : window.location.hash.startsWith('#feature=') ? decodeURIComponent(window.location.hash.slice(9)) : '');
  const [publicMenuOpen, setPublicMenuOpen] = useState(false);
  useEffect(() => { const sync = () => setPolicyPage(window.location.hash === '#about-us' ? 'about-us' : window.location.hash === '#short-lets' ? 'short-lets' : window.location.hash.startsWith('#policy=') ? decodeURIComponent(window.location.hash.slice(8)) : window.location.hash.startsWith('#feature=') ? decodeURIComponent(window.location.hash.slice(9)) : ''); window.addEventListener('hashchange', sync); window.addEventListener('popstate', sync); return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('popstate', sync); }; }, []);
  useEffect(() => { const policy = PUBLIC_POLICIES.find((item) => item.id === policyPage); const feature = PUBLIC_FEATURES.find((item) => item.id === policyPage); document.title = policy ? `${policy.title} | Yemilaz Properties` : feature ? `${feature.title} | Yemilaz Properties` : policyPage === 'about-us' ? 'About us | Yemilaz Properties' : policyPage === 'short-lets' ? 'Short stays | Yemilaz Properties' : 'Yemilaz Properties | Find your place'; }, [policyPage]);
  function openPolicy(id) { window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#policy=${id}`); setPolicyPage(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function openFeature(id) { window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#feature=${id}`); setPolicyPage(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function openShortLets() { window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#short-lets`); setPolicyPage('short-lets'); setPublicMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function closeShortLets() { window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#top`); setPolicyPage(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function closeFeature() { window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#features`); setPolicyPage(''); window.setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); }
  function openAbout() { window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#about-us`); setPolicyPage('about-us'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function closeAbout() { window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#top`); setPolicyPage(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function closePolicy() { window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#support`); setPolicyPage(''); window.setTimeout(() => document.getElementById('support')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); }
  const [filters, setFilters] = useState({ country: '', state: '', city: '', listing_type: '', property_type: '', min: '', max: '' });
  const shortLetListings = properties.filter(isShortLetProperty);
  const [shortLetSearch, setShortLetSearch] = useState('');
  const [marketOverview, setMarketOverview] = useState({ rows: [], loading: true, error: false });
  const [featuredMembers, setFeaturedMembers] = useState([]);
  const [contactMember, setContactMember] = useState(null);
  useEffect(() => {
    let active = true;
    if (!supabase) { setMarketOverview({ rows: [], loading: false, error: true }); return () => { active = false; }; }
    supabase.rpc('get_property_market_overview').then(({ data, error }) => {
      if (active) setMarketOverview({ rows: error ? [] : (data || []), loading: false, error: Boolean(error) });
    }).catch(() => { if (active) setMarketOverview({ rows: [], loading: false, error: true }); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    if (!supabase) return () => { active = false; };
    supabase.rpc('get_homepage_member_spotlight').then(({ data, error }) => {
      if (active) setFeaturedMembers(error ? [] : (data || []));
    }).catch(() => { if (active) setFeaturedMembers([]); });
    return () => { active = false; };
  }, []);
  const [mapMode, setMapMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [leadMode, setLeadMode] = useState('');
  const [leadMessage, setLeadMessage] = useState('');
  const [wantedOpen, setWantedOpen] = useState(false);
  const [wantedMessage, setWantedMessage] = useState('');
  const [favourites, setFavourites] = useState(() => { try { return JSON.parse(localStorage.getItem('yemilaz-favourites') || '[]'); } catch { return []; } });
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedSearches, setSavedSearches] = useState(() => { try { return JSON.parse(localStorage.getItem('yemilaz-saved-searches') || '[]'); } catch { return []; } });
  useEffect(() => {
    const propertyId = new URLSearchParams(window.location.search).get('property');
    if (propertyId) setSelected(properties.find((item) => item.id === propertyId) || null);
  }, [properties]);
  const openProperty = (property) => {
    setSelected(property);
    const url = new URL(window.location.href); url.searchParams.set('property', property.id);
    window.history.replaceState({}, '', url);
  };
  const closeProperty = () => {
    setSelected(null);
    const url = new URL(window.location.href); url.searchParams.delete('property');
    window.history.replaceState({}, '', url);
  };
  const cities = [...new Set(properties.map((item) => item.city).filter(Boolean))].sort();
  const states = [...new Set(properties.map((item) => item.state).filter(Boolean))].sort();
  const countries = [...new Set(properties.map((item) => item.country).filter(Boolean))].sort();
  const filtered = properties.filter((item) => (!filters.country || item.country === filters.country)
    && (!filters.state || item.state === filters.state) && (!filters.city || item.city === filters.city)
    && (!filters.listing_type || item.listing_type === filters.listing_type)
    && (!filters.property_type || item.property_type === filters.property_type)
    && (!filters.min || Number(item.price) >= Number(filters.min)) && (!filters.max || Number(item.price) <= Number(filters.max)));
  const visibleListings = savedOnly ? filtered.filter((item) => favourites.includes(item.id)) : filtered;
  const locatedListing = visibleListings.find((item) => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)));
  const mapQuery = locatedListing ? `${locatedListing.latitude},${locatedListing.longitude}` : [filters.city, filters.state, filters.country].filter(Boolean).join(', ') || visibleListings.map((item) => [item.city, item.state, item.country].filter(Boolean).join(', ')).join(' | ');
  const toggleFavourite = (propertyId) => setFavourites((current) => {
    const next = current.includes(propertyId) ? current.filter((id) => id !== propertyId) : [...current, propertyId];
    localStorage.setItem('yemilaz-favourites', JSON.stringify(next)); return next;
  });
  useEffect(() => {
    const activePolicy = PUBLIC_POLICIES.find((item) => item.id === policyPage);
    const activeFeature = PUBLIC_FEATURES.find((item) => item.id === policyPage);
    const title = selected ? `${selected.name} in ${selected.city || selected.state || selected.country} | Yemilaz Properties` : activePolicy ? `${activePolicy.title} | Yemilaz Properties` : activeFeature ? `${activeFeature.title} | Yemilaz Properties` : policyPage === 'about-us' ? 'About us | Yemilaz Properties' : 'Yemilaz Properties | Find your place';
    document.title = title;
    let description = document.querySelector('meta[name="description"]');
    if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.append(description); }
    description.content = selected?.description || activeFeature?.summary || 'Discover homes, shops, offices, warehouses, land and farms for rent or sale with Yemilaz Properties.';
    for (const [property, content] of [['og:title', title], ['og:description', description.content], ['og:image', selected?.image_url ? new URL(selected.image_url, window.location.origin).href : new URL('/lagos-home.png', window.location.origin).href]]) {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute('property', property); document.head.append(tag); }
      tag.content = content;
    }
    if (selected && supabase) {
      const key = `listing-view:${selected.id}`;
      if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); supabase.rpc('record_property_listing_view', { p_property_id: selected.id }); }
    }
    return () => { document.title = 'Yemilaz Properties | Find your place'; };
  }, [selected, policyPage]);
  async function submitListingLead(event) {
    event.preventDefault();
    if (!supabase || !selected) return;
    const form = new FormData(event.currentTarget);
    if (leadMode === 'shortlet' && String(form.get('check_out')) <= String(form.get('check_in'))) { setLeadMessage('Check-out must be after check-in.'); return; }
    const table = leadMode === 'viewing' ? 'property_viewing_requests' : leadMode === 'report' ? 'property_listing_reports' : 'property_enquiries';
    const row = leadMode === 'report'
      ? { property_id: selected.id, owner_id: selected.owner_id, reporter_email: form.get('email') || null, reason: form.get('reason'), details: form.get('details') || null }
      : leadMode === 'viewing'
        ? { property_id: selected.id, owner_id: selected.owner_id, name: form.get('name'), email: form.get('email'), phone: form.get('phone') || null, requested_at: new Date(form.get('requested_at')).toISOString(), note: form.get('message') || null }
        : { property_id: selected.id, owner_id: selected.owner_id, name: form.get('name'), email: form.get('email'), phone: form.get('phone') || null, message: leadMode === 'shortlet' ? `SHORT-LET BOOKING REQUEST\nCheck-in: ${form.get('check_in')}\nCheck-out: ${form.get('check_out')}\nGuests: ${form.get('guests')}\n\nGuest note: ${form.get('message') || 'No additional note.'}\n\nThis is a request only; host confirmation is required.` : form.get('message') };
    const { error } = await supabase.from(table).insert(row);
    if (error) { setLeadMessage('We could not submit your request. Please try again later.'); return; }
    setLeadMessage(leadMode === 'report' ? 'Thank you. Our team will review this report.' : leadMode === 'shortlet' ? 'Your stay request was sent to the host. Your dates are not reserved until the host confirms.' : 'Your request was added to the property manager’s private inbox.');
    setLeadMode('');
  }
  return <div className="public-site">
    <header className="public-nav"><a className="public-brand" href="#top" onClick={policyPage ? (event) => { event.preventDefault(); policyPage === 'about-us' ? closeAbout() : policyPage === 'short-lets' ? closeShortLets() : PUBLIC_FEATURES.some((item) => item.id === policyPage) ? closeFeature() : closePolicy(); } : undefined} aria-label="Yemilaz Properties home"><BrandLockup name="Yemilaz Properties" logo="horizon"/></a><button className="public-menu-toggle" aria-label={publicMenuOpen ? 'Close main navigation' : 'Open main navigation'} aria-expanded={publicMenuOpen} onClick={() => setPublicMenuOpen((open) => !open)}>{publicMenuOpen ? <X size={20}/> : <Menu size={20}/>}<span>{publicMenuOpen ? 'Close' : 'Menu'}</span></button><nav className={publicMenuOpen ? 'is-open' : ''} aria-label="Main navigation">{policyPage ? <>{PUBLIC_FEATURES.some((item) => item.id === policyPage) && <button className="public-text-button" onClick={() => { setPublicMenuOpen(false); closeFeature(); }}>All features</button>}<button className="public-text-button" onClick={() => { setPublicMenuOpen(false); policyPage === 'about-us' ? closeAbout() : policyPage === 'short-lets' ? closeShortLets() : PUBLIC_FEATURES.some((item) => item.id === policyPage) ? closeFeature() : closePolicy(); }}>Back to website</button><a href="#support" onClick={(event) => { event.preventDefault(); setPublicMenuOpen(false); closePolicy(); }}>Help &amp; policies</a></> : <><a href="#homes" onClick={() => setPublicMenuOpen(false)}>Find a property</a><button className="public-text-button" onClick={openShortLets}>Short lets</button><a href="#features" onClick={() => setPublicMenuOpen(false)}>Platform features</a><a href="#about" onClick={(event) => { event.preventDefault(); setPublicMenuOpen(false); openAbout(); }}>About us</a><a href="#support" onClick={() => setPublicMenuOpen(false)}>Help &amp; policies</a></>}<button className="sign-in" onClick={() => { setPublicMenuOpen(false); onSignIn(); }}><KeyRound size={15}/> Property portal</button></nav></header>
    <main id="top">
      {policyPage ? <>{policyPage === 'short-lets' ? <ShortLetsPage properties={shortLetListings} search={shortLetSearch} onSearch={setShortLetSearch} onOpen={openProperty} onBack={closeShortLets} onSignIn={onSignIn}/> : policyPage === 'about-us' ? <section className="public-policy-page about-page"><button className="policy-back-link" onClick={closeAbout}><ArrowLeft size={15}/> Back to website</button><article><span className="public-eyebrow">PROPERTY, MADE PERSONAL</span><h1>Property made easier to find, use and manage.</h1><p className="policy-intro">Yemilaz Properties connects people with places and gives property owners and their teams practical tools to manage the relationships around them.</p><section><h2>A platform for every kind of property</h2><p>Explore and advertise homes, apartments, shops, offices, warehouses, land, farms and other spaces for rent, lease or sale. Short-let hosts can share furnished stays and receive booking requests from prospective guests.</p></section><section><h2>Support for the whole property journey</h2><p>Browse listings, compare details, contact advertisers and request viewings or short stays. Property owners and authorized teams can maintain property and tenancy records, coordinate maintenance, share documents, communicate with linked participants and follow complaint updates from their accounts.</p></section><section><h2>Designed for the people involved</h2><p>Different property relationships call for different tools. The platform supports property seekers, owners, landlords, developers, short-let hosts, tenants, estate agents, caretakers, lawyers and other participants. Account access is organized around the selected role and, where relevant, the person’s connection to a property or team.</p></section><section><h2>Clear information. Thoughtful decisions.</h2><p>We aim to make property details and communication easier to follow. Listing information and transaction arrangements are provided by the relevant advertisers and parties. Before committing, inspect the property where possible, confirm the advertiser’s authority, verify all charges and payment details, and review the written terms.</p></section><section><h2>Here when you need us</h2><p>For website assistance or general questions, email <a href="mailto:hello@yemilazproperties.com">hello@yemilazproperties.com</a>. For a listing question, contact its advertiser. For a concern involving your account or a property relationship, use the relevant message or complaint option so the right participants can follow up.</p></section><div className="about-page-actions"><button className="primary-button" onClick={closeAbout}>Explore properties <ArrowRight size={15}/></button><button className="secondary-button" onClick={() => { closeAbout(); window.setTimeout(() => document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' }), 0); }}>Help &amp; policies</button></div></article></section> : PUBLIC_POLICIES.find((policy) => policy.id === policyPage) ? <section className="public-policy-page"><button className="policy-back-link" onClick={closePolicy}><ArrowLeft size={15}/> Back to Help, policies &amp; support</button>{PUBLIC_POLICIES.filter((policy) => policy.id === policyPage).map((policy) => <article key={policy.id}><span className="public-eyebrow">YEMILAZ PROPERTIES · WEBSITE INFORMATION</span><h1>{policy.title}</h1><p className="policy-intro">{policy.summary}</p>{policy.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}{policy.id === 'privacy' && <p className="policy-contact">Privacy questions or requests: <a href="mailto:hello@yemilazproperties.com">hello@yemilazproperties.com</a></p>}</article>)}<p className="support-legal-note">These general website guidelines are provided for information and do not replace the terms of a specific property agreement or advice from a qualified professional. Please have the policies reviewed for your business and local requirements before relying on them as formal legal documents.</p></section> : PUBLIC_FEATURES.find((feature) => feature.id === policyPage) ? (() => { const feature = PUBLIC_FEATURES.find((item) => item.id === policyPage); const Icon = feature.icon; return <section className="public-feature-detail"><button className="policy-back-link" onClick={closeFeature}><ArrowLeft size={15}/> Back to all features</button><div className="feature-detail-hero"><span className="public-eyebrow">YEMILAZ PROPERTIES · {feature.category.toUpperCase()}</span><span className="feature-detail-icon"><Icon size={25}/></span><h1>{feature.title}</h1><p className="policy-intro">{feature.summary}</p></div><div className="feature-detail-content"><article><h2>How it works</h2><p>{feature.detail}</p><h2>Typical steps</h2><ol>{feature.steps.map((step) => <li key={step}>{step}</li>)}</ol><h2>Who it helps</h2><p>{feature.audience}</p>{feature.id === 'documents-signatures' && <p className="feature-detail-note">Typed signatures and timestamps are recorded; this is not a certified electronic-signature service.</p>}</article><aside><span className="public-eyebrow">YOUR PROPERTY ACCOUNT</span><p>Access depends on your account role and relationship to the property.</p><button className="primary-button" onClick={onSignIn}><KeyRound size={15}/> Open your property portal</button><button className="secondary-button" onClick={closeFeature}>Browse all platform features</button></aside></div><section className="related-features"><span className="public-eyebrow">EXPLORE NEXT</span><h2>Related platform features</h2><div className="related-feature-grid">{PUBLIC_FEATURES.filter((item) => item.id !== feature.id && item.category === feature.category).slice(0,3).map((item) => <FeatureCard key={item.id} feature={item} onOpen={openFeature}/>)}</div></section></section>; })() : <section className="public-policy-page"><h1>Policy page not found</h1><p>Choose a policy from Help, policies &amp; support.</p><button className="secondary-button" onClick={closePolicy}>Back to Help, policies &amp; support</button></section>}</> : <>
      <section className="public-hero"><div className="public-hero-copy"><span className="public-eyebrow"><i/> A BETTER WAY TO FIND YOUR PLACE</span><h1>Room to live.<br/>Space to <em>grow.</em></h1><p>Discover homes, shops, offices, warehouses, land and farms to rent or buy. Find the right space for the life or business you’re building.</p><div className="public-hero-actions"><a className="primary-button" href="#homes">Explore properties <ArrowRight size={16}/></a><button className="public-text-button" onClick={() => { setWantedOpen(true); setWantedMessage(''); }}>Tell us what you’re looking for</button></div><div className="public-hero-trust"><span><span className="trust-icon"><Check size={14}/></span><b>Spaces for every purpose</b><small>Homes · work · land</small></span><span><span className="trust-icon"><ShieldCheck size={14}/></span><b>Property care in one place</b><small>Discover · connect · manage</small></span></div></div><div className="public-hero-photo"><img src="/lagos-home.png" alt="Contemporary architecture framed by tropical landscaping"/><div className="hero-photo-kicker"><span className="hero-photo-kicker-icon"><Building2 size={17}/></span><span><b>Find space for what’s next</b><small>Explore properties across Nigeria</small></span><span className="hero-photo-kicker-arrow"><ArrowUpRight size={16}/></span></div><div className="hero-photo-note"><span className="live-dot"/> YEMILAZ PROPERTIES <b>Property, made clearer.</b></div><div className="hero-image-index"><span>01</span><i/> SPACES WITH POSSIBILITY</div></div><div className="hero-category-rail" aria-label="Property types"><span>FIND YOUR PLACE</span><a href="#homes">Homes</a><a href="#homes">Commercial</a><a href="#homes">Land &amp; farms</a><a href="#short-lets" onClick={(event) => { event.preventDefault(); openShortLets(); }}>Short stays</a><a href="#homes">For rent or sale</a></div></section>
      <section className="market-overview" aria-labelledby="market-overview-title"><div className="market-overview-heading"><div><span className="public-eyebrow">NIGERIA · ADVERTISED LISTING TRENDS</span><h2 id="market-overview-title">Market overview</h2><p>See how asking prices are moving across comparable property listings.</p></div><span className="market-period"><span/> 30-day movement</span></div>{marketOverview.loading ? <div className="market-empty"><span className="market-loading-dot"/> Gathering market observations…</div> : marketOverview.rows.length ? <div className="market-columns">{[{title:'Top gainers',icon:ArrowUpRight,positive:true},{title:'Top decliners',icon:ArrowDown,positive:false}].map((group) => { const Icon=group.icon; const rows=marketOverview.rows.filter((row) => group.positive ? Number(row.movement_percent)>0 : Number(row.movement_percent)<0).sort((a,b) => group.positive ? Number(b.movement_percent)-Number(a.movement_percent) : Number(a.movement_percent)-Number(b.movement_percent)).slice(0,4); return <article className={`market-card ${group.positive?'is-positive':'is-negative'}`} key={group.title}><div className="market-card-title"><span className="market-icon"><Icon size={19}/></span><div><h3>{group.title}</h3><small>Observed asking-price movement</small></div></div>{rows.length ? <ol>{rows.map((row,index) => <li key={`${row.state}-${row.city}-${row.property_type}-${row.listing_type}-${row.price_period}-${index}`}><div className="market-area"><b>{[row.city,row.state].filter(Boolean).join(', ') || row.state || 'Nigeria'}</b><small>{row.property_type || 'Property'} · {row.listing_type==='sale'?'For sale':`For rent${row.price_period?` / ${row.price_period}`:''}`}</small></div><span className="market-change">{Number(row.movement_percent)>0?'+':''}{Number(row.movement_percent).toFixed(1)}%</span><strong>{currency(row.current_median)}</strong><small className="market-sample">{row.comparable_listings} comparable listings</small></li>)}</ol> : <p className="market-no-results">No qualifying {group.positive?'increases':'declines'} yet. We show a trend only when at least three comparable listings have a 30-day price history.</p>}</article>; })}</div> : <div className="market-empty"><span className="market-empty-mark"><Building2 size={19}/></span><div><b>{marketOverview.error?'Market history is not available yet':'Market history is building'}</b><p>{marketOverview.error?'Market trends will appear here when the overview service is available.':'Price changes are recorded from advertised listings over time. Trends will appear after 30 days of observations and only for groups with at least three comparable listings.'}</p></div></div>}<p className="market-method-note">These are median advertised prices on Yemilaz Properties, not verified sale prices or an official Nigerian property index. Comparable groups are separated by area, property type, rent or sale, and rental period.</p></section>
      {featuredMembers.length > 0 && <section className="community-spotlight" aria-labelledby="community-spotlight-title"><div className="community-spotlight-heading"><div><span className="public-eyebrow">A TRUSTED PROPERTY COMMUNITY</span><h2 id="community-spotlight-title">Meet the people behind better property experiences.</h2><p>Opted-in members with Established standing or higher, selected to rotate on the homepage.</p></div><button className="secondary-button" onClick={onSignIn}>Create your account <ArrowRight size={14}/></button></div><div className="community-spotlight-grid">{featuredMembers.map((member, index) => { const role = String(member.account_role || 'member').replaceAll('_', ' '); const roleTitle = role.charAt(0).toUpperCase() + role.slice(1); return <article className="community-spotlight-card" key={`${member.display_name}-${index}`}><span className="community-member-icon"><Users size={18}/></span><span className="community-member-role">{roleTitle}</span><h3>{member.display_name}</h3><b>{member.topic}</b><p>{member.tagline}</p><span className="community-member-level"><ShieldCheck size={13}/> {member.level_label} standing</span>{(member.contact_phone || member.contact_email || member.contact_address) && <div className="community-member-contacts">{member.contact_phone && <a href={`tel:${member.contact_phone.replace(/[^+\d]/g, '')}`}><Phone size={13}/>{member.contact_phone}</a>}{member.contact_email && <a href={`mailto:${member.contact_email}`}><Mail size={13}/>{member.contact_email}</a>}{member.contact_address && <span><MapPin size={13}/>{member.contact_address}</span>}</div>}<button type="button" className="primary-button community-message-button" onClick={() => setContactMember(member)}><MessageCircle size={14}/>Message member</button></article>; })}</div></section>}      <section className="public-listings" id="homes"><div className="public-section-heading"><div><span className="public-eyebrow">THE CURRENT COLLECTION</span><h2>Find a space that fits your plans.</h2><p>Browse homes, commercial spaces, land and farms by location, budget and property type. Reserved, rented and sold listings are clearly marked. Confirm fees and terms with the listing manager before any commitment.</p></div><span className="public-count">{filtered.length} advertised {filtered.length === 1 ? 'listing' : 'listings'}</span></div>
        <div className="listing-filters" role="search" aria-label="Filter property listings">{[['country','Country',countries],['state','State',states],['city','City',cities],['listing_type','Rent or sale',['rent','sale']],['property_type','Property type',[...new Set(properties.map((item) => item.property_type).filter(Boolean))]]].map(([key,label,options]) => <label key={key}>{label}<select aria-label={label} value={filters[key]} onChange={(event) => setFilters((value) => ({ ...value, [key]: event.target.value }))}><option value="">All</option>{options.map((option) => <option key={option} value={option}>{key === 'listing_type' ? option === 'rent' ? 'For rent' : 'For sale' : option}</option>)}</select></label>)}<label>Min price<input aria-label="Minimum price" inputMode="numeric" type="number" min="0" value={filters.min} onChange={(event) => setFilters((value) => ({ ...value, min: event.target.value }))}/></label><label>Max price<input aria-label="Maximum price" inputMode="numeric" type="number" min="0" value={filters.max} onChange={(event) => setFilters((value) => ({ ...value, max: event.target.value }))}/></label><button className="secondary-button" onClick={() => setFilters({ country:'',state:'',city:'',listing_type:'',property_type:'',min:'',max:'' })}>Clear filters</button></div>
        <div className="listing-view-tools"><span>{favourites.length} saved {favourites.length === 1 ? 'property' : 'properties'}</span><button className="secondary-button" onClick={() => setSavedOnly((value) => !value)}><Heart size={15}/>{savedOnly ? 'Show all properties' : 'Show saved properties'}</button><button className="secondary-button" onClick={() => { const searches=[{filters,name:`${filters.city||filters.state||filters.country||'All locations'} · ${filters.listing_type||'rent or sale'}`,savedAt:new Date().toISOString()},...savedSearches].slice(0,10); localStorage.setItem('yemilaz-saved-searches',JSON.stringify(searches)); setSavedSearches(searches); }}><Check size={15}/> Save this search</button>{savedSearches.length>0&&<select aria-label="Load a saved search" defaultValue="" onChange={(event)=>{const search=savedSearches[Number(event.target.value)];if(search){setFilters(search.filters);setSavedOnly(false);}}}><option value="">Load saved search ({savedSearches.length})</option>{savedSearches.map((search,index)=><option key={`${search.savedAt}-${index}`} value={index}>{search.name}</option>)}</select>}<button className="secondary-button" onClick={() => setMapMode((value) => !value)}><MapPin size={15}/>{mapMode ? 'Hide map' : 'Browse map'}</button></div>
        {mapMode && mapQuery && <iframe className="listing-map" title="Map of matching property locations" loading="lazy" src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}/>}
        {visibleListings.length ? <div className="property-grid">{visibleListings.map((property) => <PropertyCard key={property.id} property={property} onOpen={() => openProperty(property)} isFavourite={favourites.includes(property.id)} onFavourite={() => toggleFavourite(property.id)}/>)}</div> : <div className="public-empty"><Building2 size={25}/><h3>{savedOnly ? 'No saved properties match.' : 'No properties match those filters.'}</h3><p>{savedOnly ? 'Save a listing with the heart button to build your shortlist.' : 'Try broadening your search or clear the filters.'}</p></div>}</section>

      <section className="public-features" id="features"><div className="public-features-heading"><div><span className="public-eyebrow">PROPERTY TOOLS FOR EVERY STAGE</span><h2>Tools for the whole property journey.</h2><p>From finding a place to coordinating the people, records and day-to-day work around it.</p></div><span className="feature-total">{PUBLIC_FEATURES.length} connected capabilities</span></div><nav className="feature-category-nav" aria-label="Feature categories">{FEATURE_CATEGORIES.map((category) => <a key={category} href={`#feature-category-${category.toLowerCase().replaceAll(' ','-').replaceAll('&','and')}`}>{category}</a>)}</nav>{FEATURE_CATEGORIES.map((category) => <div className="feature-category-group" id={`feature-category-${category.toLowerCase().replaceAll(' ','-').replaceAll('&','and')}`} key={category}><div className="feature-category-heading"><h3>{category}</h3><span>{PUBLIC_FEATURES.filter((feature) => feature.category === category).length} features</span></div><div className="public-feature-grid">{PUBLIC_FEATURES.filter((feature) => feature.category === category).map((feature) => <FeatureCard key={feature.id} feature={feature} onOpen={openFeature}/>)}</div></div>)}</section>
      <section className="public-about" id="about"><div><span className="public-eyebrow">PROPERTY, MADE PERSONAL</span><h2>Good spaces.<br/>Thoughtful care.</h2></div><p>Yemilaz Properties brings landlords, tenants and trusted property professionals together with clarity, care and local expertise.</p><button className="about-signin" onClick={openAbout}>Read more about us <ArrowRight size={15}/></button></section>
      <section className="public-support" id="support"><div className="support-heading"><div><span className="public-eyebrow">CLEAR INFORMATION BEFORE YOU COMMIT</span><h2>Help, policies &amp; support</h2></div><p className="support-intro">Quick guidance for property enquiries, agreements and using Yemilaz Properties.</p></div><div className="support-grid">{PUBLIC_POLICIES.map((policy) => <article key={policy.id}><div><h3>{policy.title}</h3><p>{policy.summary}</p></div><button className="policy-more-link" onClick={() => openPolicy(policy.id)}>Read more <ArrowRight size={14}/></button></article>)}<article className="support-contact"><div><h3>Need a hand?</h3><p>For listing questions, contact the advertiser. For website support, email <a href="mailto:hello@yemilazproperties.com">hello@yemilazproperties.com</a>.</p></div><button className="policy-more-link" onClick={onComplaint}>Open complaint room <ArrowRight size={14}/></button></article></div><details className="support-faq"><summary>Frequently asked questions <span>10 answers</span></summary>
        <details className="faq-item"><summary>1. What types of properties can I find here?</summary><p>Listings may include homes, apartments, shops, offices, warehouses, land, farms and other property or spaces offered for rent or sale. Use the filters and listing description to check the intended use.</p></details>
        <details className="faq-item"><summary>2. How do I enquire about a property?</summary><p>Open the listing, review its details and use the enquiry form to send your name, contact details and question to the listing manager. Avoid including passwords, bank details or unnecessary sensitive information.</p></details>
        <details className="faq-item"><summary>3. How do I arrange a viewing?</summary><p>Open a listing and submit a viewing request with your preferred date and contact details. The property contact must confirm the appointment; a request is not a confirmed viewing until you receive that confirmation.</p></details>
        <details className="faq-item"><summary>4. Are all listings and advertisers verified?</summary><p>Verification indicators are shown only where the platform has recorded a verification check. They are not a guarantee of property condition, ownership, availability or transaction safety. Independently inspect the property and confirm the advertiser’s authority.</p></details>
        <details className="faq-item"><summary>5. What fees should I confirm before paying?</summary><p>Ask for a written total and breakdown covering rent or price, deposit, agency or professional fees, service charges, utilities, taxes where applicable, due dates and refund terms. Confirm the recipient and obtain a receipt for every payment.</p></details>
        <details className="faq-item"><summary>6. Does Yemilaz Properties collect listing payments on this website?</summary><p>Unless a clearly identified payment checkout is presented for a specific service, listing payments are arranged with the property owner or manager. Do not pay an account supplied unexpectedly; independently verify the recipient and payment instructions first.</p></details>
        <details className="faq-item"><summary>7. How can I report a suspicious or inaccurate advert?</summary><p>Use “Report this listing” on the property detail page and provide the reason and any helpful details. Do not send money or documents while you are unsure about a listing. Contact support if you cannot access the report option.</p></details>
        <details className="faq-item"><summary>8. How do I lodge or follow up on a complaint?</summary><p>Use the complaint room and provide a clear subject, property details and description. If you have an account, sign in to continue the case and review replies. Share only information relevant to resolving the issue.</p></details>
        <details className="faq-item"><summary>9. Who can see my enquiry or complaint information?</summary><p>Your enquiry is routed to the relevant listing contact. A complaint is available to its linked participants and authorized platform administrators. Use the privacy contact above to ask about your personal information.</p></details>
        <details className="faq-item"><summary>10. What should I do before signing an agreement or moving in?</summary><p>Inspect the property, confirm who is authorized to let or sell it, agree the full costs and responsibilities in writing, read the complete agreement, keep a signed copy and obtain receipts. Record the condition at handover and keep a safe contact route for repairs or urgent concerns.</p></details>
      </details><p className="support-legal-note">These general website guidelines are provided for information and do not replace the terms of a specific property agreement or advice from a qualified professional. Please have the policies reviewed for your business and local requirements before relying on them as formal legal documents.</p></section>
      </>}
    </main>
    <footer className="public-footer"><div className="footer-main"><a className="public-brand" href="#top"><BrandLockup name="Yemilaz Properties" logo="horizon"/></a><p>Property, made clearer.<br/><span>Discover, connect and manage spaces across Nigeria.</span></p><nav aria-label="Footer navigation"><a href="#homes">Find a property</a><a href="#features">Platform features</a><button onClick={onComplaint}>Complaint room</button><a href="mailto:hello@yemilazproperties.com">Contact</a></nav><div className="footer-account"><button onClick={onSignIn}>Property portal</button><button onClick={onAdminSignIn}>Administration</button></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Yemilaz Properties</span><div>{PUBLIC_POLICIES.map((policy) => <button key={policy.id} onClick={() => openPolicy(policy.id)}>{policy.title}</button>)}</div><span>Made for every kind of property.</span></div></footer>
    {wantedOpen && <WantedRequestDialog message={wantedMessage} setMessage={setWantedMessage} onClose={() => setWantedOpen(false)}/>}
    {contactMember && <PublicMemberMessageDialog member={contactMember} onClose={() => setContactMember(null)}/>}
    {selected && <div className="modal-backdrop listing-detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && (closeProperty(), setLeadMode(''))}><section className="modal listing-detail" role="dialog" aria-modal="true" aria-labelledby="listing-detail-title"><div className="modal-heading"><div><span className="eyebrow">{selected.property_type || 'PROPERTY'} · {selected.listing_type === 'sale' ? 'FOR SALE' : 'FOR RENT / LEASE'}</span><h2 id="listing-detail-title">{selected.name}</h2><p><MapPin size={13}/>{[selected.address,selected.city,selected.state,selected.country].filter(Boolean).join(', ')}</p></div><button className="icon-button" aria-label="Close property details" onClick={closeProperty}><X size={18}/></button></div><PropertyGallery property={selected}/><div className="detail-price"><b>{currency(selected.price)}</b><span>{selected.listing_type === 'rent' ? `/ ${({year:'year',month:'month',week:'week',day:'day'}[selected.price_period] || 'year')}` : ' asking price'}</span></div><p className="fee-note">Before paying, confirm all agency fees, deposits, service charges, payment dates, and refund terms directly with the listing manager.</p><div className="property-features">{selected.property_size && <span>{selected.property_size}</span>}{selected.intended_use && <span>Suitable for {selected.intended_use}</span>}{/^(house|apartment|duplex|room|short-stay)/i.test(selected.property_type || '') && <><span><BedDouble size={15}/>{selected.bedrooms || 0} beds</span><span><Home size={14}/>{selected.bathrooms || 0} baths</span></>}<span>{selected.status === 'occupied' ? (selected.listing_type === 'sale' ? 'Unavailable' : 'Rented') : selected.status === 'reserved' || selected.status === 'under_offer' ? 'Reserved' : selected.status === 'sold' ? 'Sold' : 'Available'}</span></div><p className="listing-description">{selected.description || 'Contact the listing manager for more details.'}</p>{(selected.amenities || []).length > 0 && <div><b>Features and facilities</b><div className="amenity-list">{selected.amenities.map((amenity) => <span key={amenity}>{amenity}</span>)}</div></div>}<div className="listing-actions">{selected.status === 'available' ? <><button className="primary-button" onClick={() => setLeadMode(isShortLetProperty(selected) ? 'shortlet' : 'enquiry')}>{isShortLetProperty(selected) ? 'Request to book' : 'Enquire'}</button><button className="secondary-button" onClick={() => setLeadMode('viewing')}>Request a viewing</button></> : <b className="listing-status-note">This listing is not currently available. Contact the listing manager about its status.</b>}<button className="text-button" onClick={() => setLeadMode('report')}>Report this listing</button><button className="secondary-button" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy listing link</button><a className="secondary-button" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${encodeURIComponent([selected.address,selected.city,selected.state,selected.country].filter(Boolean).join(', '))}`}><MapPin size={14}/> Map</a></div>
      {leadMessage && <p className="lead-feedback" role="status">{leadMessage}</p>}{leadMode === 'shortlet' ? <ShortLetBookingForm onSubmit={submitListingLead} onCancel={() => setLeadMode('')}/> : leadMode && <form className="listing-lead-form" onSubmit={submitListingLead}><h3>{leadMode === 'report' ? 'Report a listing' : leadMode === 'viewing' ? 'Request a viewing' : 'Send an enquiry'}</h3>{leadMode !== 'report' && <div className="form-row"><label>Your name<input required name="name" autoComplete="name"/></label><label>Email<input required name="email" type="email" autoComplete="email"/></label></div>}{leadMode === 'report' && <><label>Your email (optional)<input name="email" type="email"/></label><label>Reason<select required name="reason"><option value="">Choose a reason</option><option>Incorrect information</option><option>Suspicious or fraudulent</option><option>Already rented or sold</option><option>Inappropriate content</option><option>Other</option></select></label></>}{leadMode !== 'report' && <label>Phone <small>Optional</small><input name="phone" type="tel" autoComplete="tel"/></label>}{leadMode === 'viewing' && <label>Preferred date and time<input required name="requested_at" type="datetime-local" min={new Date().toISOString().slice(0,16)}/></label>}<label>{leadMode === 'report' ? 'Details (optional)' : leadMode === 'viewing' ? 'Note (optional)' : 'Message'}<textarea name={leadMode === 'report' ? 'details' : 'message'} required={leadMode === 'enquiry'} rows="3" maxLength="2000"/></label><button className="primary-button" disabled={!supabase}>{supabase ? 'Send request' : 'Service unavailable'}</button></form>}</section></div>}
  </div>;
}

function ShortLetBookingForm({ onSubmit, onCancel }) {
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() - new Date().getTimezoneOffset() * 60000 + 86400000).toISOString().slice(0, 10);
  return <form className="listing-lead-form shortlet-booking-form" onSubmit={onSubmit}><span className="public-eyebrow">BOOKING REQUEST</span><h3>Request a short stay</h3><p>Send your dates to the host. Your stay is not confirmed until the host replies.</p><div className="form-row"><label>Your name<input required name="name" autoComplete="name"/></label><label>Email<input required name="email" type="email" autoComplete="email"/></label></div><div className="form-row"><label>Phone <small>Optional</small><input name="phone" type="tel" autoComplete="tel"/></label><label>Guests<input required name="guests" type="number" min="1" max="20" defaultValue="1"/></label></div><div className="form-row"><label>Check-in<input required name="check_in" type="date" min={today}/></label><label>Check-out<input required name="check_out" type="date" min={tomorrow}/></label></div><label>Message to the host <small>Optional</small><textarea name="message" rows="3" maxLength="1500" placeholder="Share an arrival-time or accommodation question."/></label><div className="row-actions"><button className="primary-button" disabled={!supabase}>Send stay request</button><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button></div></form>;
}

function ShortLetsPage({ properties, search, onSearch, onOpen, onBack, onSignIn }) {
  const q = search.trim().toLowerCase();
  const matches = properties.filter((property) => !q || `${property.name} ${property.address || ''} ${property.city || ''} ${property.state || ''} ${property.property_type || ''} ${property.description || ''}`.toLowerCase().includes(q));
  return <section className="shortlet-page">
    <button className="policy-back-link" onClick={onBack}><ArrowLeft size={15}/> Back to website</button>
    <div className="shortlet-hero"><div><span className="public-eyebrow">FLEXIBLE STAYS ACROSS NIGERIA</span><h1>Short stays,<br/><em>made simpler.</em></h1><p>Find furnished accommodation for a night, a week or a few weeks. Review the details, send your dates and confirm arrangements directly with the host.</p><button className="primary-button" onClick={onSignIn}>List your short-let <ArrowRight size={16}/></button></div><aside className="shortlet-trust-card"><span><CalendarDays size={18}/><b>Choose your dates</b><small>Tell the host when you plan to arrive and leave.</small></span><span><MessageCircle size={18}/><b>Ask the host</b><small>Confirm availability, house rules and total costs.</small></span><span><ShieldCheck size={18}/><b>Confirm before paying</b><small>A request is not a booking until the host confirms it.</small></span></aside></div>
    <div className="shortlet-listings" id="short-let-listings"><div className="shortlet-heading"><div><span className="public-eyebrow">AVAILABLE STAYS</span><h2>Explore short-let accommodation</h2><p>{properties.length} advertised {properties.length === 1 ? 'stay' : 'stays'} across Nigeria</p></div><label className="shortlet-search"><Search size={16}/><input aria-label="Search short-let stays" placeholder="Search by place or property" value={search} onChange={(event) => onSearch(event.target.value)}/></label></div>
      {matches.length ? <div className="property-grid">{matches.map((property) => <PropertyCard key={property.id} property={property} onOpen={() => onOpen(property)}/>)}</div> : <div className="public-empty"><Building2 size={25}/><h3>{properties.length ? 'No short stays match that search.' : 'New short stays are on the way.'}</h3><p>{properties.length ? 'Try a different area or property name.' : 'Advertised daily and weekly stays will appear here as hosts publish them.'}</p></div>}
    </div>
    <p className="shortlet-note">Prices and availability are supplied by each host. Confirm the stay dates, occupancy, included services, house rules, fees, cancellation and refund terms directly with the host. Yemilaz Properties does not confirm or collect payment for a booking request on this page.</p>
  </section>;
}

function PublicComplaintRoom({ properties, tenants = [], recipients = [], roleDefault = '', onBack, onSubmit }) {
  const [role, setRole] = useState(roleDefault);
  const [propertyId, setPropertyId] = useState('');
  return <div className="public-site complaint-site"><header className="public-nav"><button className="public-brand complaint-back" onClick={onBack}><BrandLockup name="Yemilaz Properties" logo="horizon"/></button><button className="sign-in" onClick={onBack}>Back to homes</button></header><main className="complaint-main"><div className="complaint-intro"><span className="public-eyebrow">A SHARED SPACE FOR PROPERTY CONCERNS</span><h1>Complaint room</h1><p>Landlords and tenants can open a case and continue the conversation in their private account. Create or sign in to a Tenant or complainant account before lodging if you need ongoing chat and two-party resolution approval.</p></div><form className="panel complaint-form" onSubmit={onSubmit}><div className="form-row"><label>Your full name<input required name="name" autoComplete="name"/></label><label>Email address<input required name="email" type="email" autoComplete="email"/></label></div><div className="form-row"><label>Phone number <small>(optional)</small><input name="phone" type="tel" autoComplete="tel"/></label><label>Your role<select required name="role" value={role} onChange={(event) => setRole(event.target.value)}><option value="">Select your connection</option><option>Landlord</option><option>Tenant</option><option>Agent</option><option>Caretaker</option><option>Buyer or seller</option><option>Other</option></select></label></div><label>Link an advertised property<select name="property_id" value={propertyId} required={role === 'Landlord' || role === 'Tenant'} onChange={(event) => setPropertyId(event.target.value)}><option value="">Not listed / enter address below</option>{properties.map((item) => <option key={item.id} value={item.id}>{item.name} · {[item.city,item.state].filter(Boolean).join(', ')}</option>)}</select></label>{role === 'Tenant' && (roleDefault === 'Tenant' || recipients.length > 0) && <label>Send complaint to<select name="recipient_email" required defaultValue=""><option value="">Choose landlord, assigned agent or caretaker</option>{recipients.filter((contact) => ['landlord','agent','caretaker'].includes(contact.role) && contact.email).map((contact) => <option key={contact.user_id || contact.id} value={contact.email}>{contact.full_name} · {contact.role}</option>)}</select><small>The recipient and platform administrators can access this conversation. If the landlord has disabled direct complaints, only assigned agents and caretakers are listed.</small>{roleDefault === 'Tenant' && recipients.length === 0 && <small role="alert">No eligible recipient is linked yet. Ask your landlord to enable direct complaints or assign an agent/caretaker who has a website account.</small>}</label>}{role === 'Landlord' && tenants.length > 0 && <label>Tenant involved<select name="other_participant_email" required={role === 'Landlord'} defaultValue=""><option value="">Choose a tenant</option>{tenants.filter((tenant) => tenant.email && (!propertyId || tenant.property_id === propertyId)).map((tenant) => <option key={tenant.id} value={tenant.email}>{tenant.full_name} · {tenant.email}</option>)}</select><small>They can join the conversation after creating a complaint account with this email address.</small></label>}<label>Property address or name<input required name="property" placeholder="Address, building or listing name"/></label><div className="form-row"><label>Issue type<select required name="category" defaultValue=""><option value="" disabled>Select a category</option><option>Repairs and maintenance</option><option>Rent or payment</option><option>Property access</option><option>Conduct or safety</option><option>Agreement or documentation</option><option>Other</option></select></label><label>Complaint subject<input required name="subject" maxLength="120"/></label></div><label>What happened?<textarea required name="details" rows="6" maxLength="5000" placeholder="Include relevant dates and what outcome you are seeking."/></label><p className="complaint-privacy">Complaints linked to a listed property appear in the manager’s private inbox. Anonymous submissions are intake only; sign in to continue the conversation.</p><button className="primary-button" type="submit" disabled={roleDefault === 'Tenant' && recipients.length === 0}><FileText size={16}/> Submit complaint</button></form></main><footer className="public-footer complaint-footer"><a className="public-brand" href="/" aria-label="Yemilaz Properties home"><BrandLockup name="Yemilaz Properties"/></a><span>© {new Date().getFullYear()} Yemilaz Properties</span><span>We’ll handle your concern with care.</span></footer></div>;
}

function LoginPortal({ audience, onSubmit, onForgotPassword, signing, onRegister, onAdminSignIn }) {
  const [showPassword, setShowPassword] = useState(false);
  const admin = audience === 'admin';
  return <main className={`login-portal-page ${admin ? 'admin-login-page' : 'member-login-page'}`}>
    <header className="login-portal-header"><a href="/" aria-label="Yemilaz Properties home"><BrandLockup name="Yemilaz Properties" logo="horizon"/></a><a className="login-home-link" href="/">Back to website</a></header>
    <div className="login-portal-layout"><section className="login-portal-story"><span className="public-eyebrow"><i/>{admin ? 'SECURE PLATFORM ACCESS' : 'YOUR PROPERTY COMMUNITY'}</span><h1>{admin ? 'Administration centre' : 'Property, from search to management'}</h1><p>{admin ? 'Secure access for approved Yemilaz Properties administrators.' : 'Find, rent, buy, lease or manage homes, shops, offices, land and farms across Nigeria — including short stays.'}</p>{admin ? <div className="login-security-note"><ShieldCheck size={19}/><span><b>Administrator access only</b><small>Access is checked against the platform administrator list after sign-in.</small></span></div> : <div className="login-role-list"><span><Search size={16}/> Property seekers</span><span><Building2 size={16}/> Owners &amp; developers</span><span><KeyRound size={16}/> Short-let hosts</span><span><Users size={16}/> Tenants</span><span><Users size={16}/> Agents, caretakers &amp; lawyers</span></div>}</section>
      <section className="login-form-card"><span className="eyebrow">{admin ? 'YEMILAZ PROPERTIES ADMINISTRATION' : 'YEMILAZ PROPERTIES'}</span><h2>{admin ? 'Administrator sign in' : 'Welcome back'}</h2><p>{admin ? 'Sign in with your authorized administrator account.' : 'Sign in to find, manage, or keep up with the properties connected to you.'}</p><form onSubmit={onSubmit}><label>Email address<input required name="email" type="email" autoComplete="username" placeholder="you@example.com"/></label><label>Password<input required name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password"/></label><label className="show-password"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)}/> Show password</label><button type="button" className="auth-toggle login-forgot" onClick={(event) => { const form = event.currentTarget.form; onForgotPassword(form?.elements.email?.value?.trim()); }}>Forgot password?</button><button className="primary-button login-submit" disabled={signing}><KeyRound size={16}/>{signing ? 'Signing in…' : admin ? 'Sign in to administration' : 'Sign in to your portal'}</button></form>{!admin && <div className="login-register"><b>New to Yemilaz Properties?</b><p>Choose your account type and we’ll show the registration details for that profile.</p><div className="login-register-buttons"><button className="secondary-button" onClick={() => onRegister('')}>Create an account</button></div><div className="login-register-invited"><Check size={15}/> If you received an invitation, open its email link to finish setting up your profile.</div></div>}{admin && <div className="login-admin-help">Administrator accounts are created and authorized by the platform owner. Registration is not available from this page.</div>}</section></div>
    {!admin && <button className="login-admin-link" onClick={onAdminSignIn}>Platform administrator? Open the administration sign in</button>}
  </main>;
}

function AdminAccessScreen({ checking, onSignOut }) {
  return <main className="admin-access-screen"><div className="admin-access-card"><BrandLockup name="Yemilaz Properties" logo="horizon"/><div className="admin-access-icon"><ShieldCheck size={25}/></div><span className="eyebrow">YEMILAZ PROPERTIES ADMINISTRATION</span><h1>{checking ? 'Verifying administrator access' : 'Administrator access required'}</h1><p>{checking ? 'Checking this account’s platform permissions…' : 'This account is not authorized to open the administration centre. Sign out and use an approved administrator account.'}</p>{!checking && <button className="primary-button" onClick={onSignOut}><LogOut size={15}/> Sign out</button>}</div></main>;
}

function AuthDialog({ onSubmit, onSignUp, onExistingAccountSignIn, onForgotPassword, onClose, signing, initialRole = '' }) {
  const [showPassword, setShowPassword] = useState(false);
  const [existingAccountRole, setExistingAccountRole] = useState('');
  const [existingEmail, setExistingEmail] = useState('');
  const invitationParams = new URLSearchParams(window.location.search);
  const requestedJoinRole = invitationParams.get('join');
  const inviteRole = ['tenant', 'agent', 'caretaker', 'lawyer'].includes(requestedJoinRole) ? requestedJoinRole : null;
  const invitedEmail = inviteRole ? (invitationParams.get('email') || '') : '';
  const [createAccount, setCreateAccount] = useState(Boolean(inviteRole));
  const [role, setRole] = useState(inviteRole || initialRole);
  const [roleConfirmed, setRoleConfirmed] = useState(Boolean(inviteRole || initialRole));
  const emailRef = useRef(null);
  const ownerWorkspace = role === 'landlord' || role === 'property_developer' || role === 'shortlet_host';
  const roleNames = { landlord: 'property owner', property_developer: 'property developer', shortlet_host: 'short-let host', property_seeker: 'property seeker', tenant: 'tenant', agent: 'estate agent', caretaker: 'caretaker', lawyer: 'lawyer', stakeholder: 'complainant' };
  const roleName = roleNames[role] || 'property member';
  const roleOptions = [
    { id: 'property_seeker', title: 'Property seeker', description: 'Browse places to rent or buy and follow property enquiries.', icon: Search, access: 'Open registration' },
    { id: 'landlord', title: 'Property owner', description: 'Manage your properties, tenants, payments and team.', icon: Home, access: 'Owner access code required' },
    { id: 'shortlet_host', title: 'Short-let host', description: 'Advertise furnished stays and manage booking enquiries.', icon: KeyRound, access: 'Host access code required' },
    { id: 'agent', title: 'Estate agent', description: 'Join a landlord’s property team and manage assigned work.', icon: Users, access: 'Use your registered invitation email' },
    { id: 'property_developer', title: 'Property developer', description: 'Advertise developments and manage property records.', icon: Building2, access: 'Owner access code required' },
    { id: 'tenant', title: 'Tenant', description: 'Open your tenancy, documents and property messages.', icon: KeyRound, access: 'Use the email on your tenancy record' },
    { id: 'caretaker', title: 'Caretaker', description: 'Access assigned properties and communicate with the team.', icon: ShieldCheck, access: 'Use your registered invitation email' },
    { id: 'lawyer', title: 'Property lawyer', description: 'Access property matters and conversations you are assigned to.', icon: FileText, access: 'Use your registered invitation email' },
    { id: 'stakeholder', title: 'Other complainant', description: 'Continue a property-related complaint or conversation.', icon: MessageCircle, access: 'Open registration' },
  ];
  const signupDescription = inviteRole
    ? `You were invited as a ${roleName}. Use the email address from your invitation to connect your profile to the right property team.`
    : role === 'property_seeker'
      ? 'Create a profile to take part in property conversations and keep your property enquiries connected to your account.'
      : role === 'tenant'
        ? 'Use the email your landlord saved on your tenancy record to connect to your property.'
        : ownerWorkspace
          ? role === 'property_developer' ? 'Create a developer account for your properties and listings.' : role === 'shortlet_host' ? 'Create a short-let host account to advertise stays and manage booking enquiries.' : 'Create a private property account for your properties, tenants and team.'
          : `Create your ${roleName} profile with the same email registered by the property owner.`;
  const choosingRole = createAccount && !roleConfirmed && !inviteRole;
  const phoneRequired = ownerWorkspace;
  async function submitSignup(event) {
    if (existingAccountRole) return onExistingAccountSignIn(event, existingAccountRole);
    const result = await onSignUp(event);
    if (result?.existingAccount) {
      setExistingAccountRole(result.role); setExistingEmail(result.email); setRole(result.role); setRoleConfirmed(true); setCreateAccount(false); setShowPassword(false);
    }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form key={existingAccountRole ? `existing-${existingAccountRole}` : createAccount ? 'signup-form' : 'signin-form'} className={`modal auth-dialog ${createAccount ? 'auth-dialog-signup' : ''} ${choosingRole ? 'auth-dialog-role-picker' : ''}`} onSubmit={existingAccountRole ? submitSignup : createAccount ? submitSignup : onSubmit}>
    <div className="modal-heading"><div><span className="eyebrow">YEMILAZ PROPERTIES</span><h2>{existingAccountRole ? 'Sign in to add a profile' : createAccount ? choosingRole ? 'Choose your account type' : `Create ${roleName} profile` : 'Sign in'}</h2><p>{existingAccountRole ? `An account already uses ${existingEmail}. Sign in with the password you originally chose; we’ll take you to the request for your additional ${roleName} profile.` : createAccount ? choosingRole ? 'Select the profile that fits you. The next step will show the registration details for that account.' : signupDescription : 'Sign in to your property account, tenant details, or complaint conversations.'}</p></div><button type="button" className="icon-button" aria-label="Close sign in" onClick={onClose}><X size={19}/></button></div>
    {createAccount && <>
      {!inviteRole && (choosingRole ? <fieldset className="signup-account-fieldset"><legend>Account type <span aria-hidden="true">*</span></legend><div className="signup-account-types">{roleOptions.map(({ id, title, description, icon: Icon, access }) => <button key={id} type="button" className={`signup-account-option ${role === id ? 'selected' : ''}`} aria-pressed={role === id} onClick={() => { setRole(id); setRoleConfirmed(true); }}><span className="signup-option-icon"><Icon size={18}/></span><span className="signup-option-check"><Check size={13}/></span><b>{title}</b><small>{description}</small><em>{access}</em></button>)}</div></fieldset> : <div className="signup-selected-role"><span>ACCOUNT TYPE</span><b>{roleOptions.find((item) => item.id === role)?.title || roleName}</b>{!inviteRole && <button type="button" className="auth-toggle" onClick={() => setRoleConfirmed(false)}>Change</button>}</div>)}
      {roleConfirmed && <>
      <input type="hidden" name="account_role" value={ownerWorkspace ? 'landlord' : 'stakeholder'}/><input type="hidden" name="stakeholder_kind" value={role}/>
      <label>Your full name<input required name="full_name" autoComplete="name"/></label>
      <label>Phone number{phoneRequired ? ' *' : ' (optional)'}<input required={phoneRequired} name="phone" type="tel" autoComplete="tel"/></label>
      {ownerWorkspace ? <><label>Business address<input required name="permanent_address" autoComplete="street-address"/></label><BrandingFields defaultBusinessName=""/><label>Yemilaz Properties access code<input required name="invite_code" autoComplete="one-time-code" placeholder="Enter your one-time invitation code"/><small>{role === 'shortlet_host' ? 'Short-let host accounts require an administrator-issued access code.' : 'Property owner and developer accounts require a current administrator-issued code.'}</small></label></> : role === 'property_seeker' ? <p className="setup-note">You can explore advertised properties without an account. This profile helps keep your enquiries and property conversations together.</p> : role === 'stakeholder' ? <p className="setup-note">Create an account to continue a property complaint or conversation. Use the same email address connected to the case when one is already open.</p> : <p className="setup-note">{role === 'tenant' ? 'Use the email your landlord saved on your tenant record. If your email does not match, ask the landlord to update it and resend your invitation.' : `Your landlord or property manager must first register your ${roleName} profile and email address. Use the invitation email to connect.`}</p>}
      </>}
    </>}
    {(!createAccount || roleConfirmed) && <>
    <label>Email address<input ref={emailRef} required name="email" type="email" autoComplete="email" placeholder="you@example.com" defaultValue={existingAccountRole ? existingEmail : createAccount ? invitedEmail : ''} readOnly={Boolean(createAccount && invitedEmail)}/></label>
    <label>{existingAccountRole ? 'Existing account password' : 'Password'}<input required name="password" type={showPassword ? 'text' : 'password'} autoComplete={createAccount ? 'new-password' : 'current-password'} minLength={createAccount ? 8 : undefined} placeholder={existingAccountRole ? 'Enter the password you first used' : createAccount ? 'At least 8 characters' : 'Your password'}/></label>
    <label className="show-password"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)}/> Show password</label>
    {!createAccount && <button type="button" className="auth-toggle" onClick={() => onForgotPassword(emailRef.current?.value?.trim())}>Forgot password?</button>}
    {existingAccountRole && <p className="setup-note existing-account-next-step"><ShieldCheck size={15}/> Your current profiles stay active. The new profile will be added after administrator review.</p>}
    <div className="modal-footer auth-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={signing}><KeyRound size={15}/>{signing ? (createAccount && !existingAccountRole ? 'Creating…' : 'Signing in…') : (createAccount && !existingAccountRole ? 'Create account' : existingAccountRole ? 'Sign in and request profile' : 'Sign in')}</button></div>
    </>}
    {!createAccount ? <div className="auth-toggle-row">{!existingAccountRole && <button type="button" className="auth-toggle" onClick={() => { setRole(''); setRoleConfirmed(false); setCreateAccount(true); }}>Create an account / choose account type</button>}{existingAccountRole && <button type="button" className="auth-toggle" onClick={() => { setExistingAccountRole(''); setExistingEmail(''); setCreateAccount(true); }}>Back to registration</button>}</div> : roleConfirmed && !inviteRole ? <div className="auth-toggle-row"><button type="button" className="auth-toggle" onClick={() => setCreateAccount(false)}>Already have an account? Sign in</button></div> : null}
  </form></div>;
}
function AuthNoticeDialog({ notice, onClose, onResend, onUpdatePassword, signing }) {
  return <div className="modal-backdrop auth-notice-backdrop"><section className="modal auth-notice-card"><div className={`auth-notice-icon ${notice.kind}`}>{notice.kind === 'error' ? <X size={24}/> : <Check size={24}/>}</div><span className="eyebrow">YEMILAZ PROPERTIES</span><h2>{notice.kind === 'error' ? 'Confirmation link expired' : notice.kind === 'reset' ? 'Set a new password' : notice.kind === 'password-success' ? 'Password updated' : notice.kind === 'success' ? 'Your account is confirmed' : 'Check your email'}</h2><p>{notice.message}</p>{notice.kind === 'error' && notice.expired && <form onSubmit={onResend}><label>Email address<input required name="email" type="email" autoComplete="email" placeholder="The address used to register"/></label><button className="primary-button" disabled={signing}>{signing ? 'Sending…' : 'Resend confirmation email'}</button></form>}{notice.kind === 'reset' && <form onSubmit={onUpdatePassword}><label>New password<input required name="new_password" type="password" minLength="8" autoComplete="new-password"/></label><label>Confirm new password<input required name="confirm_password" type="password" minLength="8" autoComplete="new-password"/></label><button className="primary-button" disabled={signing}>{signing ? 'Updating…' : 'Update password'}</button></form>}<button type="button" className="secondary-button" onClick={onClose}>{notice.kind === 'success' ? 'Continue to Yemilaz Properties' : 'Close'}</button></section></div>;
}

function PlatformContactDirectory({ client, onSetStatus }) {
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('All roles');
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  async function refresh() {
    setLoading(true);
    const { data, error } = await client.rpc('list_platform_contacts');
    setLoading(false);
    if (error) setMessage('Could not load the private people directory. Confirm the platform contact directory migration has been applied.');
    else { setPeople(data || []); setMessage(''); }
  }

  useEffect(() => { refresh(); }, []);
  const roles = [...new Set(people.map((person) => person.role))].sort();
  const filtered = people.filter((person) => (role === 'All roles' || person.role === role)
    && `${person.full_name} ${person.email || ''} ${person.phone || ''} ${person.organization || ''} ${person.related_to || ''} ${person.property_label || ''}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => setCurrentPage(1), [query, role]);
  const pagedPeople = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">YEMILAZ PROPERTIES ADMINISTRATION</div><h1>People directory</h1><p>Review landlord, tenant, guarantor, agent, caretaker, and complainant contact details.</p></div><button className="secondary-button" onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh directory'}</button></div>
    <div className="admin-directory-note"><ShieldCheck size={18}/><span><b>Private administrator view</b><small>Contact details are visible only to platform administrators. Passwords and sign-in tokens are never shown here.</small></span></div>
    {message && <p className="setup-note">{message}</p>}
    <div className="panel management-panel admin-directory-panel"><div className="panel-heading"><div><h2>People <span className="count-badge">{filtered.length}</span></h2><span className="management-sub">{people.length} contact records across your portfolio</span></div><label className="filter-button admin-role-filter"><Filter size={14}/><select aria-label="Filter by role" value={role} onChange={(event) => setRole(event.target.value)}><option>All roles</option>{roles.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13}/></label></div>
      <label className="search-box wide-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, emails, phones, or properties…"/></label>
      <div className="table-wrap"><table><thead><tr><th>ROLE</th><th>NAME &amp; CONTACT</th><th>BUSINESS / RELATION</th><th>PROPERTY / ADDRESS</th><th>ACCOUNT</th><th>ADDED</th></tr></thead><tbody>{pagedPeople.map((person) => <tr key={person.person_key}><td><span className="invite-status">{person.role}</span></td><td><div className="directory-contact"><b>{person.full_name || 'Name not provided'}</b>{person.email ? <a href={`mailto:${person.email}`}>{person.email}</a> : <small>Email not provided</small>}{person.phone ? <a href={`tel:${person.phone}`}>{person.phone}</a> : <small>Phone not provided</small>}</div></td><td>{person.organization || '—'}{person.related_to && <small className="directory-subline">{person.related_to}</small>}</td><td>{person.property_label || '—'}</td><td>{person.user_id ? <div><span className={`invite-status ${person.account_status}`}>{person.account_status}</span>{person.suspension_reason&&<small className="directory-subline">{person.suspension_reason}</small>}<button className={person.account_status==='suspended'?'secondary-button compact-button':'danger-button'} onClick={async()=>{await onSetStatus(person);refresh();}}>{person.account_status==='suspended'?'Reactivate':'Suspend'}</button></div> : <small>No linked account yet</small>}</td><td>{person.created_at ? new Date(person.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td></tr>)}</tbody></table>{!loading && !filtered.length && <EmptyState title={people.length ? 'No people match this search' : 'No contact records yet'} text={people.length ? 'Try another name, email, phone number, or role.' : 'Registered landlord and tenant details will appear here.'}/>}</div><PaginationControls total={filtered.length} page={currentPage} setPage={setCurrentPage} label="administrator contacts"/>
    </div>
  </section>;
}

function PlatformAccessPage({ client }) {
  const [hours, setHours] = useState('24');
  const [invites, setInvites] = useState([]);
  const [newCode, setNewCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const { pageItems: pageInvites, controls: invitePagination } = usePaginatedItems(invites, 'landlord invitation records');
  async function refresh() {
    const { data, error } = await client.rpc('list_landlord_invites');
    if (error) setMessage('Could not load access-code history. Check that the invitation security update was applied.');
    else setInvites(data || []);
  }
  useEffect(() => { refresh(); }, []);
  async function generate(event) {
    event.preventDefault(); setBusy(true); setMessage(''); setNewCode('');
    const { data, error } = await client.rpc('generate_landlord_invite', { p_valid_hours: Number(hours) });
    setBusy(false);
    if (error) { setMessage('We could not create an access code. Confirm that your Yemilaz Properties administrator account is enabled.'); return; }
    const generated = Array.isArray(data) ? data[0] : data;
    setNewCode(generated?.invite_code || '');
    setMessage('New one-time access code created. Copy it now; it will not be shown again.');
    refresh();
  }
  async function revoke(id) {
    setBusy(true);
    const { error } = await client.rpc('revoke_landlord_invite', { p_invite_id: id });
    setBusy(false);
    setMessage(error ? 'We could not revoke that code.' : 'Unused access code revoked.');
    refresh();
  }
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">YEMILAZ PROPERTIES ADMINISTRATION</div><h1>Landlord access</h1><p>Create expiring, single-use codes for approved landlords. Only platform administrators can see this page.</p></div></div><div className="panel invite-panel"><h2>Generate a landlord code</h2><p>Each code works for one landlord registration, expires automatically, and can be revoked before use.</p><form className="invite-create" onSubmit={generate}><label>Code expiry<select value={hours} onChange={(event) => setHours(event.target.value)}><option value="1">1 hour</option><option value="24">24 hours</option><option value="72">3 days</option><option value="168">7 days</option></select></label><button className="primary-button" disabled={busy}>Generate secure code</button></form>{newCode && <div className="invite-code-result"><div><small>ONE-TIME LANDLORD CODE</small><code>{newCode}</code></div><button className="secondary-button" onClick={() => navigator.clipboard?.writeText(newCode).then(() => setMessage('Access code copied.'))}>Copy code</button></div>}{message && <p className="setup-note">{message}</p>}</div><div className="panel invite-history"><div className="panel-heading"><div><span className="eyebrow">ACCESS CONTROL</span><h2>Invitation history</h2></div><button className="secondary-button" onClick={refresh}>Refresh</button></div><div className="table-wrap"><table><thead><tr><th>CODE</th><th>STATUS</th><th>EXPIRES</th><th>USED</th><th/></tr></thead><tbody>{pageInvites.map((invite) => <tr key={invite.invite_id}><td><code>{invite.code_hint}</code></td><td><span className={`invite-status ${invite.status}`}>{invite.status}</span></td><td>{new Date(invite.expires_at).toLocaleString()}</td><td>{invite.redeemed_at ? new Date(invite.redeemed_at).toLocaleString() : '—'}</td><td>{invite.status === 'active' && <button className="danger-button" disabled={busy} onClick={() => revoke(invite.invite_id)}>Revoke</button>}</td></tr>)}</tbody></table>{!invites.length && <div className="empty-state">No landlord invitation codes yet.</div>}</div>{invitePagination}</div></section>;
}

const PLATFORM_WORK_PERMISSIONS = [
  { id: 'account_upgrades', title: 'Account upgrade reviews', detail: 'Review evidence and approve, decline, or return account-role requests.' },
  { id: 'listing_verification', title: 'Listing verification', detail: 'Review pending adverts and record verification decisions.' },
  { id: 'complaints_read', title: 'Complaint oversight (read only)', detail: 'Read platform complaint cases and replies without sending messages or resolving cases.' },
];

function PlatformStaffPage({ client }) {
  const [staff, setStaff] = useState([]);
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [editing, setEditing] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const { pageItems: pageStaff, controls: staffPagination } = usePaginatedItems(staff, 'platform staff');
  async function refresh() {
    const { data, error } = await client.rpc('list_platform_staff_permissions');
    if (error) setMessage(error.message); else { setStaff(data || []); setMessage(''); }
  }
  useEffect(() => { refresh(); }, []);
  function editMember(item) { setEditing(item.user_id); setEmail(item.email); setPermissions(item.permissions || []); setMessage(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function clearForm() { setEditing(''); setEmail(''); setPermissions([]); }
  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    const { error } = await client.rpc('set_platform_staff_permissions', { p_email: email.trim(), p_permissions: permissions });
    setBusy(false);
    if (error) setMessage(error.message); else { setMessage(permissions.length ? 'Staff access updated.' : 'Platform access removed.'); clearForm(); refresh(); }
  }
  function toggle(permission) { setPermissions((value) => value.includes(permission) ? value.filter((item) => item !== permission) : [...value, permission]); }
  return <section className="management platform-staff-page"><div className="welcome-row"><div><div className="eyebrow">OWNER CONTROLLED ACCESS</div><h1>Platform staff</h1><p>Assign the minimum admin work each staff account needs. You remain the only full platform administrator.</p></div><button className="secondary-button" onClick={refresh}>Refresh staff</button></div>
    <div className="panel platform-staff-form-card"><h2>{editing ? 'Update staff access' : 'Grant platform work access'}</h2><p>Staff must first register a Yemilaz account with this email. Access is checked by the database and can be removed here at any time.</p><form onSubmit={save}><label>Registered staff email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="staff@example.com" disabled={Boolean(editing)}/></label><fieldset><legend>Choose responsibilities</legend>{PLATFORM_WORK_PERMISSIONS.map((permission) => <label className="platform-permission-option" key={permission.id}><input type="checkbox" checked={permissions.includes(permission.id)} onChange={() => toggle(permission.id)}/><span><b>{permission.title}</b><small>{permission.detail}</small></span></label>)}</fieldset><div className="row-actions"><button className="primary-button" disabled={busy || permissions.length === 0}>{busy ? 'Saving…' : editing ? 'Save access changes' : 'Grant selected access'}</button>{editing && <button type="button" className="secondary-button" onClick={clearForm}>Cancel</button>}</div></form>{message && <p className="setup-note" role="status">{message}</p>}</div>
    <div className="panel platform-staff-list"><div className="panel-heading"><div><span className="eyebrow">CURRENT ASSIGNMENTS</span><h2>Staff access list</h2></div><span className="count-badge">{staff.length}</span></div>{staff.length ? <><div className="platform-staff-grid">{pageStaff.map((item) => <article className="platform-staff-card" key={item.user_id}><div className="platform-staff-person"><span className="platform-staff-avatar"><UserRound size={17}/></span><span><b>{item.full_name || item.email}</b><small>{item.email}</small></span></div><div className="platform-permission-tags">{(item.permissions || []).map((permission) => <span key={permission}>{PLATFORM_WORK_PERMISSIONS.find((option) => option.id === permission)?.title || permission}</span>)}</div><small className="platform-grant-date">Access granted {new Date(item.granted_at).toLocaleDateString('en-NG')}</small><div className="row-actions"><button className="secondary-button" onClick={() => editMember(item)}>Edit responsibilities</button><button className="danger-button" onClick={async () => { setBusy(true); const { error } = await client.rpc('set_platform_staff_permissions', { p_email: item.email, p_permissions: [] }); setBusy(false); setMessage(error?.message || 'Platform access removed.'); refresh(); }}>Remove access</button></div></article>)}</div>{staffPagination}</> : <div className="empty-state">No additional platform staff have been granted access yet.</div>}</div>
  </section>;
}

function ListingVerificationPage({ client }) {
  const [properties, setProperties] = useState([]);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const { pageItems: pageProperties, controls: verificationPagination } = usePaginatedItems(properties, 'listing verification requests');
  async function refresh() {
    const { data, error } = await client.from('properties').select('id,owner_id,name,address,city,state,country,verification_status,created_at').eq('verification_status', 'pending').order('created_at');
    if (error) setMessage(error.message); else { setProperties(data || []); setMessage(''); }
  }
  useEffect(() => { refresh(); }, []);
  async function decide(property, verification_status) {
    setBusyId(property.id);
    const { error } = await client.rpc('review_property_verification', { p_property_id: property.id, p_decision: verification_status });
    setBusyId('');
    if (error) setMessage(error.message); else { setMessage(verification_status === 'verified' ? 'Listing marked verified after review.' : 'Verification request declined.'); refresh(); }
  }
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">ADMIN REVIEW</div><h1>Listing verification</h1><p>Review ownership documents outside the public website, then record the decision here.</p></div><button className="secondary-button" onClick={refresh}>Refresh queue</button></div>{message && <p className="setup-note">{message}</p>}<div className="panel management-panel"><div className="table-wrap"><table><thead><tr><th>PROPERTY</th><th>ADDRESS</th><th>OWNER ID</th><th>REQUESTED</th><th>DECISION</th></tr></thead><tbody>{pageProperties.map((property) => <tr key={property.id}><td>{property.name}</td><td>{[property.address,property.city,property.state,property.country].filter(Boolean).join(', ')}</td><td><code>{property.owner_id}</code></td><td>{new Date(property.created_at).toLocaleDateString()}</td><td><div className="row-actions"><button className="primary-button compact-button" disabled={busyId === property.id} onClick={() => decide(property,'verified')}>Verify</button><button className="danger-button" disabled={busyId === property.id} onClick={() => decide(property,'rejected')}>Decline</button></div></td></tr>)}</tbody></table>{!properties.length && <EmptyState title="No verification requests" text="New requests from property managers will appear here."/>}</div>{verificationPagination}</div></section>;
}

function LandlordProfilePage({ profile, email, onSave, saving }) {
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">ACCOUNT SETTINGS</div><h1>Landlord profile</h1><p>Personalize the name, logo, colours and documents for your property account.</p></div></div><form key={`${profile?.user_id || 'profile-loading'}-${profile?.updated_at || ''}`} className="panel profile-form" onSubmit={onSave}><h2>Business and contacts</h2><p className="management-sub">Your records remain private to this signed-in account. Tenants and staff receive separate copies by email.</p><div className="form-row"><label>Landlord name<input required name="full_name" defaultValue={profile?.full_name || ''}/></label><label>Account email (delivery address)<input value={email || ''} readOnly/></label></div><div className="form-row"><label>Business phone<input name="phone" defaultValue={profile?.phone || ''}/></label><label>Business address<input name="business_address" defaultValue={profile?.business_address || ''}/></label></div><BrandingFields profile={profile}/><h2>Tenant complaint routing</h2><label className="checkbox-row"><input type="checkbox" name="allow_direct_tenant_complaints" defaultChecked={profile?.allow_direct_tenant_complaints !== false}/> Allow tenants to send complaints directly to me</label><p className="management-sub">Turn this off to route tenant complaints through their assigned agent or caretaker. Platform administrators can still review all complaints.</p><h2>Property wanted requests</h2><label className="checkbox-row"><input type="checkbox" name="receive_wanted_requests" defaultChecked={profile?.receive_wanted_requests !== false}/> Receive anonymous property requests</label><p className="management-sub">When enabled, you can view and respond to public requests for homes, apartments, land, and commercial property. Turn this off to stop receiving new requests in your property account.</p><h2>Lawyer and document templates</h2><div className="form-row"><label>Lawyer name<input name="lawyer_name" defaultValue={profile?.lawyer_name || ''}/></label><label>Lawyer email<input name="lawyer_email" type="email" defaultValue={profile?.lawyer_email || ''}/><small>When set, the lawyer receives an individual packet.</small></label></div><label>Agreement terms<textarea required name="agreement_terms" rows="5" defaultValue={profile?.agreement_terms || DEFAULT_AGREEMENT_TERMS}/><small>Starting text only. Have your lawyer review and adapt it to each tenancy and applicable local law.</small></label><label>Property rules<textarea required name="house_rules" rows="5" defaultValue={profile?.house_rules || DEFAULT_PROPERTY_RULES}/><small>Use for reasonable rules that apply to the listed property, including a home, shop, office, store, farm or land. Avoid rules that conflict with the signed agreement or local law.</small></label><div className="profile-actions"><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save landlord profile'}</button></div></form></section>;
}

function LocationFields() {
  const [countries, setCountries] = useState([{ name: 'Nigeria' }]);
  const [country, setCountry] = useState('Nigeria');
  const [city, setCity] = useState('Lagos');
  const [states, setStates] = useState([]);
  const [state, setState] = useState('Lagos');
  const [countriesAvailable, setCountriesAvailable] = useState(false);
  const [statesAvailable, setStatesAvailable] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('https://countriesnow.space/api/v0.1/countries/iso')
      .then((response) => { if (!response.ok) throw new Error('Could not load countries'); return response.json(); })
      .then((result) => { if (active && Array.isArray(result.data)) { setCountries(result.data.map((item) => ({ name: item.name })).sort((a, b) => a.name.localeCompare(b.name))); setCountriesAvailable(true); } })
      .catch(() => { if (active) setCountriesAvailable(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingStates(true); setStatesAvailable(false); setStates([]);
    fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ country }),
    }).then((response) => { if (!response.ok) throw new Error('Could not load regions'); return response.json(); })
      .then((result) => {
        if (!active) return;
        const names = (result.data?.states || []).map((item) => typeof item === 'string' ? item : item.name).filter(Boolean);
        setStates(names); setStatesAvailable(names.length > 0);
        if (names.length && !names.includes(state)) setState(country === 'Nigeria' && names.includes('Lagos') ? 'Lagos' : '');
      }).catch(() => { if (active) setStatesAvailable(false); })
      .finally(() => { if (active) setLoadingStates(false); });
    return () => { active = false; };
  }, [country]);

  return <div className="location-fields"><div className="form-row">
    <label>Country{countriesAvailable ? <select name="country" value={country} onChange={(event) => { setCountry(event.target.value); setState(''); setCity(''); }} required>{countries.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select> : <input name="country" value={country} onChange={(event) => { setCountry(event.target.value); setState(''); setCity(''); }} required/>}</label>
    <label>State / province{statesAvailable ? <select name="state" value={state} onChange={(event) => setState(event.target.value)} required><option value="">Select a state or province</option>{states.map((item) => <option key={item} value={item}>{item}</option>)}</select> : <input name="state" value={state} onChange={(event) => setState(event.target.value)} placeholder={loadingStates ? 'Loading regions…' : 'Enter state or province'} required/>}</label>
  </div><div className="form-row"><label>City / town<input name="city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="City or town"/></label><span className="location-note">{loadingStates ? 'Loading states and provinces…' : 'Choose a country to load its states or regions.'}</span></div></div>;
}

function PropertyCard({ property, onOpen, isFavourite, onFavourite }) {
  const images = property.image_urls?.length ? property.image_urls : [property.image_url].filter(Boolean);
  const [photoIndex, setPhotoIndex] = useState(0);
  const cover = images[photoIndex] || '/lagos-home.png';
  const statusLabel = property.status === 'occupied' ? 'Rented' : property.status === 'reserved' || property.status === 'under_offer' ? 'Reserved' : property.status === 'sold' ? 'Sold' : 'Available';
  const isResidential = /^(house|apartment|duplex|room|short-stay)/i.test(property.property_type || '');
  const pricePeriod = ({ year: 'year', month: 'month', week: 'week', day: 'day' })[property.price_period] || 'year';
  return <article className="property-card"><button className="property-open" onClick={onOpen || (() => {})} aria-label={`View details for ${property.name}`}><div className="property-image" style={{ backgroundImage: `url(${cover})` }} role="img" aria-label={`${property.name} property photo`}><span className="property-tag">For {property.listing_type === 'sale' ? 'sale' : 'rent / lease'}</span>{property.verification_status === 'verified' && <span className="verified-tag" title="Listing ownership reviewed">✓ Verified</span>}{statusLabel !== 'Available' && <span className="listing-status-tag">{statusLabel}</span>}{images.length > 1 && <span className="photo-count">{images.length} photos</span>}</div><div className="property-info"><span className="property-area">{[property.address, property.city, property.state, property.country].filter(Boolean).join(', ') || 'Nigeria'}</span><h3>{property.name}</h3><span className="property-type-label">{property.property_type || 'Property'}</span><div className="property-features">{property.property_size && <span>{property.property_size}</span>}{property.intended_use && <span>{property.intended_use}</span>}{isResidential && <><span><BedDouble size={15}/>{property.bedrooms || 0} beds</span><span><Home size={14}/>{property.bathrooms || 0} baths</span></>}</div><div className="property-price"><b>{currency(property.price)}</b><span>{property.listing_type === 'rent' ? `/ ${pricePeriod}` : ' asking price'}</span></div></div></button>{onFavourite && <button className={`favourite-button ${isFavourite ? 'saved' : ''}`} aria-label={isFavourite ? `Remove ${property.name} from saved properties` : `Save ${property.name}`} aria-pressed={Boolean(isFavourite)} onClick={onFavourite || (() => {})}><Heart size={17} fill={isFavourite ? 'currentColor' : 'none'}/></button>}</article>;
}

function PropertyGallery({ property }) {
  const images = property.image_urls?.length ? property.image_urls : [property.image_url].filter(Boolean);
  const [index, setIndex] = useState(0);
  return <div className="property-gallery"><img src={images[index] || '/lagos-home.png'} alt={`${property.name} photo ${index + 1} of ${Math.max(1, images.length)}`}/>{images.length > 1 && <div className="gallery-controls"><button type="button" aria-label="Previous image" onClick={() => setIndex((value) => (value - 1 + images.length) % images.length)}>Previous</button><span>{index + 1} / {images.length}</span><button type="button" aria-label="Next image" onClick={() => setIndex((value) => (value + 1) % images.length)}>Next</button></div>}</div>;
}

function ComplaintInbox({ records, activeComplaint, setActiveComplaint, messages, onSend, onResolution, currentUserId, onNew, allowNew = true, unreadCounts = {}, onOpenComplaint, readOnly = false }) {
  const ownProposal = activeComplaint?.resolution_proposed_by === currentUserId;
  const { pageItems: pageCases, controls: complaintPagination } = usePaginatedItems(records, 'complaints');
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">COMPLAINT MANAGEMENT</div><h1>Complaint room</h1><p>{readOnly ? 'Read-only review of platform complaint records and conversations.' : 'Keep a written record of each concern. A case is resolved only after the other participant approves.'}</p></div>{allowNew && !activeComplaint && <button className="primary-button" onClick={onNew}><Plus size={16}/> Lodge a complaint</button>}</div>{activeComplaint ? <div className="panel complaint-thread"><button className="text-button" onClick={() => setActiveComplaint(null)}>← All complaints</button><div className="panel-heading"><div><span className="eyebrow">CASE {activeComplaint.reference_code}</span><h2>{activeComplaint.subject}</h2><p>{activeComplaint.complainant_name} · {activeComplaint.property_address} · {activeComplaint.status}</p></div></div><p className="complaint-original">{activeComplaint.details}</p><div className="thread-messages">{messages.map((item) => <article className={`thread-message ${item.sender_id === currentUserId ? 'from-manager' : ''}`} key={item.id}><p>{item.message}</p><small>{item.sender_id === currentUserId ? 'You' : 'Other participant'} · {new Date(item.created_at).toLocaleString()}</small></article>)}{!messages.length && <p className="empty-state">No replies yet.</p>}</div>{!readOnly && activeComplaint.status !== 'resolved' && activeComplaint.status !== 'closed' && <><form className="thread-reply" onSubmit={onSend}><label htmlFor="complaint-message">Reply to this case</label><textarea id="complaint-message" name="message" required maxLength="5000" rows="3" placeholder="Write a clear, respectful reply…"/><button className="primary-button">Send reply</button></form><div className="resolution-actions">{activeComplaint.resolution_proposed_at && !ownProposal && <><button className="primary-button" onClick={() => onResolution('approve')}>Approve proposed resolution</button><button className="secondary-button" onClick={() => onResolution('rework')}>Request more work</button></>}{ownProposal && <p>Your resolution proposal is waiting for the other participant’s approval.</p>}{!activeComplaint.resolution_proposed_at && <button className="secondary-button" onClick={() => onResolution('propose')}>Propose resolution</button>}</div></>}</div> : <div className="panel management-panel"><p className="complaint-unread-help">A number shows how many complaint messages are waiting for you to check. It clears when you open that conversation.</p><div className="table-wrap"><table><thead><tr><th>REFERENCE</th><th>SUBJECT</th><th>COMPLAINANT</th><th>PROPERTY</th><th>STATUS</th><th>DATE</th><th/></tr></thead><tbody>{pageCases.map((item) => { const unread = unreadCounts[item.id] || 0; return <tr key={item.id}><td>{item.reference_code}</td><td>{item.subject}{unread > 0 && <span className="pending-message-badge">{unread} pending</span>}</td><td>{item.complainant_name}</td><td>{item.property_address}</td><td>{item.resolution_approved_at ? 'Resolved by both' : item.resolution_proposed_at ? 'Awaiting approval' : item.status}</td><td>{new Date(item.created_at).toLocaleDateString()}</td><td><button className="secondary-button compact-button" onClick={() => (onOpenComplaint || setActiveComplaint)(item)}>Open conversation{unread > 0 ? ` · ${unread} new` : ''}</button></td></tr>; })}</tbody></table>{!records.length && <EmptyState title="No linked complaints yet" text="Complaints linked to a property in your account will appear here."/>}</div>{complaintPagination}</div>}</section>;
}

function PortalNotificationCenter({ notices = [], onRead }) {
  const [open, setOpen] = useState(false);
  const unread = notices.filter((notice) => !notice.read_at);
  return <div className="portal-notification-center"><button type="button" className="secondary-button" onClick={() => setOpen((value) => !value)} aria-expanded={open}><Bell size={15}/> Notifications{unread.length > 0 && <span className="pending-message-badge">{unread.length}</span>}</button>{open && <div className="portal-notification-popover"><b>Recent notifications</b>{notices.slice(0, 8).map((notice) => <article className={notice.read_at ? '' : 'notification-unread'} key={notice.id}><span><strong>{notice.title}</strong><small>{notice.message.replace(/\bworkspaces\b/gi, 'portals').replace(/\bworkspace\b/gi, 'portal')}</small><small>{new Date(notice.created_at).toLocaleString()}</small></span>{!notice.read_at && <button type="button" className="text-button" onClick={() => onRead(notice)}>Mark read</button>}</article>)}{!notices.length && <p>No notifications yet. New messages and complaint replies will appear here.</p>}</div>}</div>;
}

function StaffPortal({ auth, role, availablePortals = [], onSwitchPortal, staff, tenants, properties, cases, activeComplaint, setActiveComplaint, messages, onSend, onResolution, onSubmitComplaint, notifications, onReadNotification, complaintUnreadCounts, onOpenComplaint, onSignOut, toast, onClearToast, canReviewUpgrades = false, onOpenUpgradeReview }) {
  const roleLabel = role === 'caretaker' ? 'Caretaker' : role === 'lawyer' ? 'Lawyer' : 'Agent';
  const roleDescription = role === 'caretaker'
    ? 'Coordinate property care, support the tenants assigned to you and keep the property manager informed. Your access is limited to the records and tasks linked to your role.'
    : role === 'lawyer'
      ? 'Coordinate property matters with the landlord and authorized team. Your access is limited to the records and conversations linked to your role.'
      : 'Support the property and tenant matters assigned to you. Keep communication and follow-up connected to the relevant property records.';
  const staffName = displayPersonName(staff?.full_name || auth.user_metadata?.full_name || roleLabel);
  const unreadCount = notifications.filter((item) => !item.read_at).length;
  const openCaseCount = cases.filter((item) => !['resolved','closed','completed'].includes(String(item.status || '').toLowerCase())).length;
  const focus = role === 'caretaker' ? 'Keep properties safe, maintained and ready for residents.' : role === 'lawyer' ? 'Keep agreement reviews and property matters organized.' : 'Keep property enquiries and tenant follow-ups moving.';
  const shortcuts = role === 'caretaker'
    ? [['Open care tasks','staff-caretaker-operations',Wrench],['View assigned properties','staff-properties',Building2],['Contact a tenant','staff-tenants',Users]]
    : role === 'lawyer'
      ? [['Review shared documents','staff-documents',FileText],['Open assigned matters','staff-complaints',ShieldCheck],['View tenant contacts','staff-tenants',Users]]
      : [['View tenant contacts','staff-tenants',Users],['Review property assignments','staff-properties',Building2],['Open messages','staff-private-messages',MessageCircle]];
  function jumpTo(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  return <div className="brand-site theme-jade staff-portal-shell"><header className="portal-header"><div className="portal-header-identity"><BrandLockup name="Yemilaz Properties" logo="horizon"/><span className="portal-role-chip">{roleLabel} portal</span></div><div className="portal-header-actions"><AccountPortalSwitcher roles={availablePortals} activeRole={role} onSelect={onSwitchPortal}/><button className="homepage-visibility-shortcut" onClick={() => window.location.assign(`${window.location.pathname}?portal=account&section=community`)}><Sparkles size={15}/><span>Community spotlight</span></button><PortalNotificationCenter notices={notifications} onRead={onReadNotification}/>{canReviewUpgrades&&<button className="secondary-button" onClick={onOpenUpgradeReview}><ShieldCheck size={14}/> Upgrade reviews</button>}<AccountProfilePhoto auth={auth}/><span className="portal-email" title={auth.email}>{auth.email}</span><button className="secondary-button portal-logout" onClick={onSignOut}><LogOut size={15}/> Sign out</button></div></header><main className="stakeholder-portal staff-portal">
    <section className={`staff-command-hero role-${role}`}><div className="staff-hero-content"><div className="staff-hero-kicker"><span className="staff-live-mark"><i/> YOUR PROPERTY TEAM</span><span className="staff-role-badge"><ShieldCheck size={13}/>{roleLabel} access</span></div><h1>Good day, {staffName.split(' ')[0]}</h1><p>{focus} Your role is connected to {properties.length} {properties.length === 1 ? 'property' : 'properties'} and {tenants.length} {tenants.length === 1 ? 'tenant record' : 'tenant records'}.</p><div className="staff-hero-actions">{shortcuts.map(([label,id,Icon],index)=><button key={id} className={index===0?'staff-hero-primary':'staff-hero-secondary'} onClick={()=>jumpTo(id)}><Icon size={16}/>{label}<ArrowRight size={14}/></button>)}</div></div><div className="staff-hero-aside"><div className="staff-monogram">{initials(staffName)}</div><span className="eyebrow">TODAY’S SNAPSHOT</span><div className="staff-hero-metrics"><article><Building2 size={15}/><span>Properties</span><b>{properties.length}</b></article><article><Users size={15}/><span>Tenant contacts</span><b>{tenants.length}</b></article><article><MessageCircle size={15}/><span>Open matters</span><b>{openCaseCount}</b></article><article><Bell size={15}/><span>New updates</span><b>{unreadCount}</b></article></div><small>{staff?.full_name ? `Profile: ${roleLabel}` : 'Your linked profile is being prepared'}</small></div></section>
    <div className="staff-section-intro"><span className="eyebrow">YOUR ROLE AT A GLANCE</span><h2>{role === 'caretaker' ? 'Property care, made clear' : role === 'lawyer' ? 'Your legal work, in one place' : 'Your property relationships'}</h2><p>{roleDescription}</p></div>
    <div className="tenant-profile-grid"><section className="panel tenant-profile-section"><span className="eyebrow">CONTACT DETAILS</span><h2>{staffName}</h2><p>{staff?.email || auth.email}</p><p>{staff?.phone || 'Ask your property manager to add a phone number.'}</p><p>{staff?.permanent_address || 'No address is on file.'}</p></section><section className="panel tenant-profile-section"><span className="eyebrow">YOUR RESPONSIBILITIES</span><h2>{roleLabel}</h2><p>{roleDescription}</p><div className="tenant-profile-facts"><span>Assigned properties <b>{properties.length}</b></span><span>Tenant contacts <b>{tenants.length}</b></span></div></section></div>
    <section id="staff-properties" className="panel tenant-profile-section"><div className="panel-heading"><div><span className="eyebrow">PROPERTY RECORDS</span><h2>Properties assigned to you</h2><p>Review the locations and property details connected to your role.</p></div></div>{properties.length ? <div className="property-grid">{properties.map((property) => <article className="panel tenant-profile-section staff-property-card" key={property.id}><span className="eyebrow">{property.property_type || 'PROPERTY'} · {property.status || 'ASSIGNED'}</span><h2>{property.name}</h2><p>{[property.address, property.city, property.state, property.country].filter(Boolean).join(', ') || 'Address not provided'}</p></article>)}</div> : <EmptyState title="No properties assigned yet" text="Your property manager will add the property records connected to your role here."/>}</section>
    <section id="staff-tenants" className="panel tenant-profile-section"><div className="panel-heading"><div><span className="eyebrow">TENANT RELATIONSHIPS</span><h2>Tenant contacts</h2><p>People associated with the properties you support. Use the private conversation area below for property-related messages.</p></div></div>{tenants.length ? <div className="table-wrap"><table><thead><tr><th>TENANT</th><th>EMAIL</th><th>PHONE</th><th>AGREEMENT</th><th>PROPERTY</th><th>CONTACT</th></tr></thead><tbody>{tenants.map((tenant) => <tr key={tenant.id}><td>{displayPersonName(tenant.full_name)}</td><td>{tenant.email || '—'}</td><td>{tenant.phone || '—'}</td><td>{dateLabel(tenant.lease_start)} – {dateLabel(tenant.lease_end)}</td><td>{properties.find((property) => property.id === tenant.property_id)?.name || 'Not allocated'}</td><td><span className="caretaker-contact-actions">{tenant.email&&<a href={`mailto:${tenant.email}`}>Email</a>}{tenant.phone&&<a href={`tel:${tenant.phone.replace(/[^+\d]/g,'')}`}>Call</a>}</span></td></tr>)}</tbody></table></div> : <EmptyState title="No tenant contacts assigned" text="Tenant records connected to your properties will appear here when your property manager assigns them."/>}</section>
    <StaffPaymentRegister auth={auth} staff={staff} tenants={tenants} properties={properties}/>
    <ParticipantDocumentLibrary auth={auth}/>
    {role === 'caretaker' && staff && <CaretakerOperations auth={auth} staff={staff} tenants={tenants} properties={properties}/>}
    <AccountUpgradePanel client={supabase} auth={auth} role={role} availableRoles={availablePortals} canReview={canReviewUpgrades} onOpenReview={onOpenUpgradeReview}/>
    {staff&&<PropertyMessagePanel auth={auth} staff={staff}/>}
    {['agent','caretaker','lawyer'].includes(role) && <div id="staff-complaints"><ComplaintInbox records={cases} activeComplaint={activeComplaint} setActiveComplaint={setActiveComplaint} messages={messages} onSend={onSend} onResolution={onResolution} currentUserId={auth.id} allowNew={false} unreadCounts={complaintUnreadCounts} onOpenComplaint={onOpenComplaint}/></div>}
    {toast && <div className="toast"><Check size={16}/>{toast}<button aria-label="Dismiss notification" onClick={onClearToast}><X size={15}/></button></div>}
  </main></div>;
}

function StaffPaymentTenantView({ tenant }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let active = true;
    if (!supabase || !tenant?.id) return () => { active = false; };
    supabase.from('staff_payment_records').select('id,staff_id,category,description,amount,paid_at,reference,created_at')
      .eq('tenant_id', tenant.id).eq('tenant_visible', true).order('paid_at', { ascending: false })
      .then(({ data, error }) => { if (active && !error) setRows(data || []); });
    return () => { active = false; };
  }, [tenant?.id]);
  if (!rows.length) return null;
  return <section className="panel tenant-profile-section"><span className="eyebrow">SHARED PAYMENT RECORDS</span><h2>Payments shared with you</h2><p>These are payment records the property team chose to share with your account. They are not rent charges.</p><div className="table-wrap"><table><thead><tr><th>DATE</th><th>TEAM MEMBER</th><th>TYPE</th><th>DESCRIPTION</th><th>AMOUNT</th><th>REFERENCE</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{dateLabel(row.paid_at)}</td><td>Property team</td><td>{row.category.replaceAll('_', ' ')}</td><td>{row.description}</td><td>{currency(row.amount)}</td><td>{row.reference || '—'}</td></tr>)}</tbody></table></div></section>;
}

function StaffPaymentRegister({ auth, staff, tenants, properties }) {
  const [rows, setRows] = useState([]);
  const { pageItems: paymentRows, controls: paymentPagination } = usePaginatedItems(rows, 'payment records');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  async function load() {
    if (!supabase || !staff?.id) return;
    const { data, error } = await supabase.from('staff_payment_records').select('*').eq('staff_id', staff.id).order('paid_at', { ascending: false });
    if (error) setFeedback(`Payment records are unavailable: ${error.message}`); else { setRows(data || []); setFeedback(''); }
  }
  useEffect(() => { load(); }, [staff?.id]);
  async function submit(event) {
    event.preventDefault();
    if (!staff?.id || !auth?.id) return;
    const form = event.currentTarget; const values = new FormData(form);
    const tenantId = String(values.get('tenant_id') || '') || null;
    const tenant = tenants.find((item) => item.id === tenantId);
    const amount = Number(values.get('amount'));
    if (!Number.isFinite(amount) || amount <= 0) { setFeedback('Enter a payment amount greater than zero.'); return; }
    if (values.get('tenant_visible') === 'on' && !tenantId) { setFeedback('Choose the tenant before sharing this record with them.'); return; }
    setBusy(true);
    const { error } = await supabase.from('staff_payment_records').insert({
      owner_id: staff.owner_id, staff_id: staff.id, recorded_by: auth.id, tenant_id: tenantId,
      property_id: tenant?.property_id || String(values.get('property_id') || '') || null,
      payer_name: String(values.get('payer_name') || '').trim() || null,
      category: values.get('category'), description: String(values.get('description') || '').trim(), amount,
      paid_at: values.get('paid_at') || localDateISO(), reference: String(values.get('reference') || '').trim() || null,
      tenant_visible: values.get('tenant_visible') === 'on',
    });
    setBusy(false);
    if (error) { setFeedback(`Payment could not be recorded: ${error.message}`); return; }
    form.reset();
    setFeedback('Payment received and recorded. Your landlord can now review it.');
    await load();
  }
  return <section id="staff-payment-records" className="panel tenant-profile-section staff-payment-register">
    <div className="panel-heading"><div><span className="eyebrow">PAYMENT RECORDS</span><h2>Payments received</h2><p>Record a payment you received for property related work. Your landlord can review every entry.</p></div></div>
    <form className="staff-payment-form" onSubmit={submit}>
      <div className="form-row"><label>Payment type<select name="category" defaultValue="other"><option value="management_fee">Management fee</option><option value="commission">Letting or sales commission</option><option value="maintenance_fee">Maintenance or service fee</option><option value="legal_fee">Legal fee</option><option value="viewing_fee">Viewing or inspection fee</option><option value="other">Other</option></select></label><label>Amount received (₦)<input type="number" name="amount" min="1" step="0.01" required placeholder="e.g. 25000"/></label></div>
      <div className="form-row"><label>Payment description<input name="description" required minLength="2" maxLength="500" placeholder="What was this payment for?"/></label><label>Date received<input type="date" name="paid_at" required defaultValue={localDateISO()}/></label></div>
      <div className="form-row"><label>Paid by <small>(optional)</small><input name="payer_name" maxLength="160" placeholder="Name of payer or organisation"/></label><label>Payment reference <small>(optional)</small><input name="reference" maxLength="160" placeholder="Transfer reference, receipt number, etc."/></label></div>
      <div className="form-row"><label>Related tenant <small>(optional)</small><select name="tenant_id" defaultValue=""><option value="">Not linked to a tenant</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.full_name} · {properties.find((property) => property.id === tenant.property_id)?.name || 'Property not allocated'}</option>)}</select></label><label>Property <small>(optional)</small><select name="property_id" defaultValue=""><option value="">Not linked to a property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select></label></div>
      <label className="staff-payment-visibility"><input type="checkbox" name="tenant_visible"/> Share this record with the linked tenant</label>
      <p className="setup-note">Tenant sharing is optional. When enabled, the linked tenant can view this payment record in their portal. It does not create a rent charge or change the tenancy ledger.</p>
      <button className="primary-button" disabled={busy}>{busy ? 'Saving payment…' : 'Record payment received'}</button>
    </form>
    {feedback && <p className="setup-note" role="status">{feedback}</p>}
    <h3 className="staff-payment-history-title">Your recorded payments</h3>
    {rows.length ? <><div className="table-wrap"><table><thead><tr><th>DATE</th><th>TYPE</th><th>DESCRIPTION</th><th>AMOUNT</th><th>TENANT</th><th>VISIBILITY</th></tr></thead><tbody>{paymentRows.map((row) => <tr key={row.id}><td>{dateLabel(row.paid_at)}</td><td>{row.category.replaceAll('_', ' ')}</td><td>{row.description}</td><td>{currency(row.amount)}</td><td>{tenants.find((tenant) => tenant.id === row.tenant_id)?.full_name || '—'}</td><td>{row.tenant_visible ? 'Shared with tenant' : 'Private to landlord and team'}</td></tr>)}</tbody></table></div>{paymentPagination}</> : <EmptyState title="No payment records yet" text="Payments you receive for property related work will appear here."/>}
  </section>;
}

function CaretakerOperations({ auth, staff, tenants, properties }) {
  const [requests, setRequests] = useState([]); const [updates, setUpdates] = useState([]); const [inspections, setInspections] = useState([]); const [incidents, setIncidents] = useState([]);
  const {pageItems:pageWorkOrders,controls:workOrderPagination}=usePaginatedItems(requests,'assigned maintenance requests');
  const [busy, setBusy] = useState(false); const [feedback, setFeedback] = useState(''); const [replyDrafts, setReplyDrafts] = useState({});
  const tenantIds = tenants.map((tenant) => tenant.id).filter(Boolean); const propertyIds = properties.map((property) => property.id).filter(Boolean);
  const ownerId = staff.owner_id; const checklistOptions = ['Entry and access points', 'Locks and security', 'Water and plumbing', 'Electrical fixtures', 'Walls, floors and ceilings', 'Windows and ventilation', 'Shared areas and grounds'];
  async function refresh() {
    if (!supabase || !staff?.id || !ownerId) return;
    const [maintenanceResult, inspectionResult, incidentResult] = await Promise.all([
      supabase.from('maintenance_requests').select('*').eq('owner_id', ownerId).or(`assigned_staff_id.eq.${staff.id}${propertyIds.length ? `,property_id.in.(${propertyIds.join(',')})` : ''}`).order('created_at', { ascending: false }).limit(100),
      supabase.from('property_inspections').select('*').eq('owner_id', ownerId).in('property_id', propertyIds.length ? propertyIds : ['00000000-0000-0000-0000-000000000000']).order('inspection_date', { ascending: false }).limit(100),
      supabase.from('property_incidents').select('*').eq('owner_id', ownerId).in('property_id', propertyIds.length ? propertyIds : ['00000000-0000-0000-0000-000000000000']).order('created_at', { ascending: false }).limit(100)
    ]);
    if (maintenanceResult.error) setFeedback(`Maintenance records are unavailable: ${maintenanceResult.error.message}`); else setRequests(maintenanceResult.data || []);
    if (!inspectionResult.error) setInspections(inspectionResult.data || []);
    if (!incidentResult.error) setIncidents(incidentResult.data || []);
    const requestIds = (maintenanceResult.data || []).map((item) => item.id);
    if (requestIds.length) { const result = await supabase.from('maintenance_request_updates').select('*').in('request_id', requestIds).order('created_at'); if (!result.error) setUpdates(result.data || []); }
    else setUpdates([]);
  }
  useEffect(() => { refresh(); }, [staff?.id, ownerId, propertyIds.join(',')]);
  async function updateMaintenance(event, item) {
    event.preventDefault(); const form = event.currentTarget; const fd = new FormData(form); const status = String(fd.get('status')); const note = String(fd.get('note') || '').trim();
    setBusy(true); const { error } = await supabase.rpc('update_caretaker_maintenance', { p_request_id: item.id, p_status: status, p_note: note || null });
    setBusy(false); if (error) setFeedback(error.message); else { setFeedback('Maintenance progress saved.'); form.reset(); refresh(); }
  }
  async function replyMaintenance(event, item) {
    event.preventDefault(); const body = (replyDrafts[item.id] || '').trim(); if (!body || !item.tenant_id) return;
    setBusy(true); const { error } = await supabase.rpc('update_caretaker_maintenance', { p_request_id: item.id, p_status: null, p_note: body }); setBusy(false);
    if (error) setFeedback(error.message); else { setReplyDrafts((all) => ({ ...all, [item.id]: '' })); setFeedback('Update sent to the tenant and property manager.'); refresh(); }
  }
  async function uploadPhotos(files, propertyId, folder) {
    const paths = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) throw new Error('Each photo must be 10 MB or smaller.');
      const path = `${ownerId}/staff/${staff.id}/${folder}/${propertyId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`;
      const { error } = await supabase.storage.from('property-documents').upload(path, file, { contentType: file.type }); if (error) throw error; paths.push(path);
    }
    return paths;
  }
  async function submitInspection(event) {
    event.preventDefault(); const form = event.currentTarget; const fd = new FormData(form); const propertyId = String(fd.get('property_id')); if (!propertyId) return;
    setBusy(true);
    try {
      const photoPaths = await uploadPhotos(fd.getAll('photos').filter((file) => file instanceof File && file.size), propertyId, 'inspections');
      const row = { owner_id: ownerId, property_id: propertyId, tenant_id: fd.get('tenant_id') || null, inspection_type: fd.get('inspection_type'), inspection_date: fd.get('inspection_date'), condition: fd.get('condition'), notes: String(fd.get('notes') || '').trim() || null, checklist: fd.getAll('checklist'), photo_paths: photoPaths, created_by: auth.id };
      const { error } = await supabase.from('property_inspections').insert(row); if (error) throw error;
      form.reset(); setFeedback('Inspection saved to the property record.'); refresh();
    } catch (error) { setFeedback(error.message || 'The inspection could not be saved.'); }
    setBusy(false);
  }
  async function submitIncident(event) {
    event.preventDefault(); const form = event.currentTarget; const fd = new FormData(form); const propertyId = String(fd.get('property_id')); if (!propertyId) return;
    setBusy(true);
    try {
      const photoPaths = await uploadPhotos(fd.getAll('photos').filter((file) => file instanceof File && file.size), propertyId, 'incidents');
      const { error } = await supabase.from('property_incidents').insert({ owner_id: ownerId, property_id: propertyId, reported_by: auth.id, title: String(fd.get('title')).trim(), severity: fd.get('severity'), occurred_at: fd.get('occurred_at'), description: String(fd.get('description')).trim(), photo_paths: photoPaths });
      if (error) throw error; form.reset(); setFeedback('Incident report submitted to the property manager.'); refresh();
    } catch (error) { setFeedback(error.message || 'The incident report could not be submitted.'); }
    setBusy(false);
  }
  const tasks = [...requests.filter((item) => !['completed', 'cancelled'].includes(item.status)).map((item) => ({ id: `m-${item.id}`, title: item.title, date: item.due_date || item.created_at?.slice(0, 10), kind: 'Maintenance', status: item.status })), ...inspections.filter((item) => item.inspection_date >= new Date().toISOString().slice(0, 10)).map((item) => ({ id: `i-${item.id}`, title: `${item.inspection_type.replaceAll('_', ' ')} inspection`, date: item.inspection_date, kind: 'Inspection', status: 'Scheduled' }))].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const activity = [...requests.map((item) => ({ id: `m-${item.id}`, title: `Maintenance: ${item.title}`, detail: `${item.status.replaceAll('_', ' ')} · ${dateLabel(item.updated_at?.slice(0, 10) || item.created_at?.slice(0, 10))}`, date: item.updated_at || item.created_at })), ...updates.map((item) => ({ id: `u-${item.id}`, title: 'Maintenance conversation update', detail: `${item.body} · ${dateLabel(item.created_at?.slice(0, 10))}`, date: item.created_at })), ...inspections.map((item) => ({ id: `i-${item.id}`, title: `${item.inspection_type.replaceAll('_', ' ')} inspection`, detail: `Inspection recorded · ${dateLabel(item.inspection_date)}`, date: item.inspection_date })), ...incidents.map((item) => ({ id: `x-${item.id}`, title: `Incident: ${item.title}`, detail: `${item.severity} · ${dateLabel(item.created_at?.slice(0, 10))}`, date: item.created_at }))].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);
  const openPhoto = async (path) => { const { data, error } = await supabase.storage.from('property-documents').createSignedUrl(path, 60); if (error) setFeedback(error.message); else window.open(data.signedUrl, '_blank', 'noopener,noreferrer'); };
  return <section id="staff-caretaker-operations" className="caretaker-tools" aria-label="Caretaker operations">
    <div className="caretaker-section-heading"><span className="eyebrow">PROPERTY OPERATIONS</span><h2>Care and follow-up</h2><p>Track open work, complete inspections and keep the property manager informed.</p></div>
    <section className="panel tenant-profile-section caretaker-tool-card"><div className="panel-heading"><div><span className="eyebrow">WORK ORDERS</span><h2>Maintenance assigned to you</h2><p>Update progress and keep tenants informed when a request is linked to their tenancy.</p></div><span className="count-badge">{requests.filter((item) => !['completed', 'cancelled'].includes(item.status)).length} open</span></div>
      {pageWorkOrders.map((item) => <article className="caretaker-work-order" key={item.id}><div className="caretaker-work-heading"><div><b>{item.title}</b><p>{item.description}</p><small>{item.priority} priority · {properties.find((property) => property.id === item.property_id)?.name || 'Assigned property'}{item.due_date ? ` · Due ${dateLabel(item.due_date)}` : ''}</small></div><span className={`status-pill ${item.status}`}>{item.status.replaceAll('_', ' ')}</span></div>{item.evidence_path && <button className="text-button" type="button" onClick={() => openPhoto(item.evidence_path)}>View submitted photo</button>}{updates.filter((update) => update.request_id === item.id).map((update) => <p className="caretaker-timeline-note" key={update.id}>{update.body}<small>{new Date(update.created_at).toLocaleString('en-NG')}</small></p>)}<form className="caretaker-update-form" onSubmit={(event) => updateMaintenance(event, item)}><label>Progress<select name="status" defaultValue={item.status}><option value="open">Open</option><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="waiting">Waiting for parts or access</option><option value="completed">Completed</option></select></label>{item.tenant_id && <label>Update for tenant (optional)<input name="note" maxLength="3000" placeholder="Share a concise progress update"/></label>}<button className="secondary-button" disabled={busy}>Save progress</button></form>{item.tenant_id && <form className="caretaker-reply-form" onSubmit={(event) => replyMaintenance(event, item)}><label htmlFor={`caretaker-reply-${item.id}`}>Reply to tenant</label><textarea id={`caretaker-reply-${item.id}`} rows="2" maxLength="3000" value={replyDrafts[item.id] || ''} onChange={(event) => setReplyDrafts((all) => ({ ...all, [item.id]: event.target.value }))}/><button className="text-button" disabled={busy}>Send reply</button></form>}</article>)}{workOrderPagination}{!requests.length && <p>No maintenance requests are assigned to your properties yet.</p>}
    </section>
    <section className="panel tenant-profile-section caretaker-tool-card"><div className="panel-heading"><div><span className="eyebrow">PROPERTY INSPECTIONS</span><h2>Record an inspection</h2><p>Use the checklist to document condition and any follow-up needed.</p></div></div><form className="caretaker-form" onSubmit={submitInspection}><div className="form-row"><label>Property<select name="property_id" required defaultValue=""><option value="" disabled>Select a property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select></label><label>Inspection type<select name="inspection_type"><option value="routine">Routine</option><option value="move_in">Move-in</option><option value="move_out">Move-out</option></select></label><label>Date<input type="date" name="inspection_date" required defaultValue={new Date().toISOString().slice(0, 10)}/></label></div><fieldset className="caretaker-checklist"><legend>Inspection checklist</legend>{checklistOptions.map((label) => <label key={label}><input type="checkbox" name="checklist" value={label}/>{label}</label>)}</fieldset><label>Overall condition<input name="condition" required maxLength="500" placeholder="e.g. Good condition; minor paint wear in the hallway"/></label><label>Notes and recommended follow-up<textarea name="notes" rows="3" maxLength="3000" placeholder="Record observations and any work that needs attention"/></label><label>Photos (optional)<input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple/><small>JPG, PNG or WebP; up to 10 MB each.</small></label><button className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save inspection'}</button></form>{inspections.slice(0, 5).map((item) => <article className="caretaker-history-row" key={item.id}><b>{item.inspection_type.replaceAll('_', ' ')} · {properties.find((property) => property.id === item.property_id)?.name}</b><small>{dateLabel(item.inspection_date)} · {item.condition}</small>{(item.photo_paths || []).map((path) => <button className="text-button" key={path} onClick={() => openPhoto(path)}>View inspection photo</button>)}</article>)}</section>
    <div className="caretaker-two-column">
      <section className="panel tenant-profile-section caretaker-tool-card"><div className="panel-heading"><div><span className="eyebrow">UPCOMING WORK</span><h2>Tasks and schedule</h2><p>Upcoming inspections and maintenance due dates.</p></div></div>{tasks.slice(0, 12).map((task) => <article className="caretaker-schedule-row" key={task.id}><span className="caretaker-date-chip">{task.date ? dateLabel(task.date) : 'No due date'}</span><div><b>{task.title}</b><small>{task.kind} · {task.status}</small></div></article>)}{!tasks.length && <p>No upcoming work is scheduled.</p>}</section>
      <section className="panel tenant-profile-section caretaker-tool-card"><div className="panel-heading"><div><span className="eyebrow">SAFETY & PROPERTY CARE</span><h2>Report an incident</h2><p>Record damage, a safety concern or another urgent property issue. Contact emergency services first if anyone is in immediate danger.</p></div></div><form className="caretaker-form" onSubmit={submitIncident}><label>Property<select name="property_id" required defaultValue=""><option value="" disabled>Select a property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select></label><div className="form-row"><label>Incident title<input name="title" required minLength="3" maxLength="160" placeholder="e.g. Damage to rear entrance"/></label><label>Severity<select name="severity"><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div><label>When did it happen?<input type="datetime-local" name="occurred_at" required defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}/></label><label>What happened?<textarea name="description" required minLength="10" maxLength="4000" rows="3"/></label><label>Photos (optional)<input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple/></label><button className="primary-button" disabled={busy}>{busy ? 'Submitting…' : 'Submit incident report'}</button></form>{incidents.slice(0, 5).map((item) => <article className="caretaker-history-row" key={item.id}><b>{item.title}</b><small>{item.severity} · {dateLabel(item.created_at?.slice(0, 10))}</small>{(item.photo_paths || []).map((path) => <button className="text-button" key={path} onClick={() => openPhoto(path)}>View incident photo</button>)}</article>)}</section>
    </div>
    <section className="panel tenant-profile-section caretaker-tool-card"><div className="panel-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Property activity history</h2><p>A recent timeline of maintenance, inspections and incident reports recorded for your assignments.</p></div></div>{activity.map((item) => <article className="caretaker-history-row" key={item.id}><b>{item.title}</b><small>{item.detail}</small></article>)}{!activity.length && <p>Updates to your assigned property records will appear here.</p>}</section>
    {feedback && <p className="setup-note" role="status">{feedback}</p>}
  </section>;
}

function PaginationControls({ total, page, setPage, pageSize = 10, label = 'records' }) {
  const [jumpValue, setJumpValue] = useState('');
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstPage + index);
  if (total <= pageSize) return null;
  function jump(event) {
    event.preventDefault();
    const target = Number(jumpValue);
    if (Number.isInteger(target) && target >= 1 && target <= pageCount) { setPage(target); setJumpValue(''); }
  }
  return <nav className="pagination-controls" aria-label={`Pagination for ${label}`}>
    <span className="pagination-count">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
    <div className="pagination-pages"><button type="button" className="pagination-step" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</button>
      {pages.map((number) => <button type="button" key={number} className={`pagination-page${number === page ? ' current' : ''}`} aria-current={number === page ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button>)}
      <button type="button" className="pagination-step" onClick={() => setPage(Math.min(pageCount, page + 1))} disabled={page === pageCount}>Next</button>
    </div>
    {pageCount > 5 && <form className="pagination-jump" onSubmit={jump}><label>Go to page<input type="number" min="1" max={pageCount} value={jumpValue} onChange={(event) => setJumpValue(event.target.value)} aria-label={`Go to page, 1 to ${pageCount}`}/></label><button type="submit" disabled={!jumpValue}>Go</button></form>}
  </nav>;
}

function usePaginatedItems(items, label, pageSize = 10) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [items.length]);
  return {
    pageItems: items.slice((page - 1) * pageSize, page * pageSize),
    controls: <PaginationControls total={items.length} page={page} setPage={setPage} pageSize={pageSize} label={label}/>,
  };
}

function ParticipantDocumentLibrary({ auth }) {
  const [documents, setDocuments] = useState([]); const [sortBy, setSortBy] = useState('newest'); const [feedback, setFeedback] = useState(''); const [page, setPage] = useState(1);
  async function load() {
    if (!supabase || !auth?.email) return;
    const { data, error } = await supabase.from('property_documents').select('id,title,storage_path,document_category,created_at,tenant_id').contains('recipient_emails', [auth.email.toLowerCase()]).order('created_at', { ascending: false }).limit(250);
    if (error) setFeedback(`Documents are temporarily unavailable: ${error.message}`); else { setDocuments(data || []); setFeedback(''); }
  }
  useEffect(() => { load(); }, [auth?.id, auth?.email]);
  async function download(path) {
    const { data, error } = await supabase.storage.from('property-documents').createSignedUrl(path, 60, { download: true });
    if (error) setFeedback(error.message); else window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }
  const sorted = [...documents].sort((a, b) => sortBy === 'title' ? a.title.localeCompare(b.title) : sortBy === 'oldest' ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at));
  const pageDocuments = sorted.slice((page - 1) * 10, page * 10);
  return <section id="staff-documents" className="panel tenant-profile-section"><div className="panel-heading"><div><span className="eyebrow">SHARED DOCUMENTS</span><h2>Documents for your assignments</h2><p>Files shared with your account are stored here for reference and download.</p></div><label>Sort<select aria-label="Sort documents" value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select></label></div>{pageDocuments.map((file) => <article className="tenant-document-row" key={file.id}><div><b>{file.title}</b><small>{file.document_category?.replaceAll('_', ' ')} · {dateLabel(file.created_at?.slice(0, 10))}</small></div><button className="secondary-button" onClick={() => download(file.storage_path)}><Download size={15}/> Download PDF</button></article>)}<PaginationControls total={sorted.length} page={page} setPage={setPage} label="assignment documents"/>{!sorted.length && !feedback && <p>No documents have been shared with your account yet.</p>}{feedback && <p className="setup-note" role="status">{feedback}</p>}</section>;
}

function TenantOperations({ auth, tenant, properties }) {
  const [items,setItems]=useState([]),[documents,setDocuments]=useState([]),[sharedFiles,setSharedFiles]=useState([]),[charges,setCharges]=useState([]),[notices,setNotices]=useState([]),[inspections,setInspections]=useState([]),[updates,setUpdates]=useState([]),[staff,setStaff]=useState([]),[profileRequests,setProfileRequests]=useState([]);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[fileSort,setFileSort]=useState('newest'),[docFilter,setDocFilter]=useState('all'),[replyDrafts,setReplyDrafts]=useState({});
  async function refresh(){
    if(!supabase||!tenant)return;
    const renewalSync = await supabase.rpc('ensure_my_due_rent_charges', { p_tenant_id: tenant.id });
    const [maintenance,signatures,files,rent,propertyNotices,inspectionRows,maintenanceUpdates,staffRows,requests]=await Promise.all([
      supabase.from('maintenance_requests').select('*').eq('tenant_id',tenant.id).order('created_at',{ascending:false}),
      supabase.from('tenancy_signatures').select('*').eq('tenant_id',tenant.id).order('signed_at',{ascending:false}),
      supabase.from('property_documents').select('*').eq('tenant_id',tenant.id).order('created_at',{ascending:false}),
      supabase.from('service_charges').select('*').eq('tenant_id',tenant.id).order('due_date',{ascending:true}),
      supabase.from('property_notices').select('*').eq('owner_id',tenant.owner_id).order('created_at',{ascending:false}).limit(50),
      supabase.from('property_inspections').select('*').eq('owner_id',tenant.owner_id).or(`tenant_id.eq.${tenant.id},and(tenant_id.is.null,property_id.eq.${tenant.property_id||'00000000-0000-0000-0000-000000000000'})`).gte('inspection_date',new Date().toISOString().slice(0,10)).order('inspection_date'),
      supabase.from('maintenance_request_updates').select('*').eq('tenant_id',tenant.id).order('created_at'),
      supabase.from('staff').select('id,full_name').eq('owner_id',tenant.owner_id),
      supabase.from('tenant_profile_requests').select('*').eq('tenant_id',tenant.id).order('created_at',{ascending:false})
    ]);
    if(renewalSync.error)setMessage('We could not refresh the lease renewal charge. Please contact your property manager if your lease has expired.');
    if(maintenance.error)setMessage(`Maintenance history unavailable: ${maintenance.error.message}`);else setItems(maintenance.data||[]);
    if(!signatures.error)setDocuments(signatures.data||[]);if(!files.error)setSharedFiles(files.data||[]);if(!rent.error)setCharges(rent.data||[]);if(!propertyNotices.error)setNotices(propertyNotices.data||[]);if(!inspectionRows.error)setInspections(inspectionRows.data||[]);if(!maintenanceUpdates.error)setUpdates(maintenanceUpdates.data||[]);if(!staffRows.error)setStaff(staffRows.data||[]);if(!requests.error)setProfileRequests(requests.data||[]);
  }
  useEffect(()=>{refresh();},[tenant?.id]);
  async function submit(event){event.preventDefault();if(!tenant||!auth)return;const form=event.currentTarget,values=new FormData(form),evidence=values.get('evidence');setBusy(true);let evidencePath=null;let uploadError=null;
    if(evidence instanceof File&&evidence.size){if(evidence.size>10*1024*1024){setBusy(false);setMessage('Photo must be 10 MB or smaller.');return;}evidencePath=`${tenant.owner_id}/maintenance/${tenant.id}/${crypto.randomUUID()}-${evidence.name.replace(/[^\w.-]/g,'_')}`;const upload=await supabase.storage.from('maintenance-evidence').upload(evidencePath,evidence,{contentType:evidence.type});uploadError=upload.error;if(uploadError)evidencePath=null;}
    const {data,error}=await supabase.from('maintenance_requests').insert({owner_id:tenant.owner_id,tenant_id:tenant.id,property_id:tenant.property_id,created_by:auth.id,requester_role:'tenant',title:String(values.get('title')).trim(),description:String(values.get('description')).trim(),priority:values.get('priority'),evidence_path:evidencePath}).select().single();
    if(!error){const initial=await supabase.from('maintenance_request_updates').insert({owner_id:tenant.owner_id,request_id:data.id,tenant_id:tenant.id,author_id:auth.id,body:'Maintenance request submitted.'});if(initial.error)setMessage(`Request saved. Timeline could not be initialized: ${initial.error.message}`);else setMessage(uploadError?`Request sent. Photo upload failed: ${uploadError.message}`:'Maintenance request sent to your property manager.');form.reset();await refresh();}else{if(evidencePath)await supabase.storage.from('maintenance-evidence').remove([evidencePath]);setMessage(error.message);}setBusy(false);
  }
  async function reply(event,item){event.preventDefault();const body=(replyDrafts[item.id]||'').trim();if(!body)return;setBusy(true);const {error}=await supabase.from('maintenance_request_updates').insert({owner_id:tenant.owner_id,request_id:item.id,tenant_id:tenant.id,author_id:auth.id,body});setBusy(false);if(error)setMessage(error.message);else{setReplyDrafts((all)=>({...all,[item.id]:''}));setMessage('Update sent to your property manager.');refresh();}}
  async function requestProfile(event){event.preventDefault();const form=event.currentTarget,values=new FormData(form);setBusy(true);const {error}=await supabase.from('tenant_profile_requests').insert({owner_id:tenant.owner_id,tenant_id:tenant.id,requester_id:auth.id,field_name:values.get('field_name'),requested_value:String(values.get('requested_value')).trim(),note:String(values.get('note')||'').trim()||null});setBusy(false);if(error)setMessage(error.message);else{setMessage('Correction request sent to your landlord for review.');form.reset();refresh();}}
  async function signDocument(document){const signature=window.prompt('Type your full legal name to sign this document snapshot.');if(!signature?.trim())return;const {error}=await supabase.from('tenancy_signatures').insert({tenant_id:tenant.id,owner_id:tenant.owner_id,document_type:document.document_type,document_version:document.document_version,document_text:document.document_text,signer_id:auth.id,signer_role:'tenant',signer_name:tenant.full_name,signature_text:signature.trim()});if(error)setMessage(error.message);else{setMessage('Your signature and the current timestamp have been recorded.');refresh();}}
  if(!tenant)return null;
  async function openShared(path){const {data,error}=await supabase.storage.from('property-documents').createSignedUrl(path,60,{download:true});if(error)setMessage(error.message);else window.open(data.signedUrl,'_blank','noopener,noreferrer');}
  async function openEvidence(path){const {data,error}=await supabase.storage.from('maintenance-evidence').createSignedUrl(path,60);if(error)setMessage(error.message);else window.open(data.signedUrl,'_blank','noopener,noreferrer');}
  const today=localDateISO(),renewalCutoff=addDaysISO(today,30),unpaid=charges.filter(c=>!['paid','voided','waived'].includes(c.status)),overdue=unpaid.filter(c=>c.due_date&&c.due_date<today),openRepairs=items.filter(item=>!['completed','cancelled'].includes(item.status)),upcoming=inspections.filter(i=>i.inspection_date>=today),leaseEnded=tenant.lease_end&&tenant.lease_end<today,renewalDue=tenant.lease_end&&tenant.lease_end>=today&&tenant.lease_end<=renewalCutoff;
  const sortedSharedFiles=[...sharedFiles].filter(f=>docFilter==='all'||f.document_category===docFilter).sort((a,b)=>fileSort==='title'?a.title.localeCompare(b.title):fileSort==='oldest'?a.created_at.localeCompare(b.created_at):b.created_at.localeCompare(a.created_at));
  const {pageItems:pageCharges,controls:chargePagination}=usePaginatedItems(charges,'rent and charge history');
  const {pageItems:pageNotices,controls:noticePagination}=usePaginatedItems(notices,'property notices');
  const {pageItems:pageMaintenance,controls:maintenancePagination}=usePaginatedItems(items,'maintenance requests');
  const {pageItems:pageSharedFiles,controls:sharedFilePagination}=usePaginatedItems(sortedSharedFiles,'shared property files');
  const {pageItems:pageProfileRequests,controls:profileRequestPagination}=usePaginatedItems(profileRequests,'profile requests');
  const {pageItems:pageSignatures,controls:tenantSignaturePagination}=usePaginatedItems(documents,'tenancy documents');
  const categories=[...new Set(sharedFiles.map(f=>f.document_category).filter(Boolean))];
  return <>
    {(overdue.length>0||leaseEnded||renewalDue)&&<section className={`panel tenancy-alert-panel ${overdue.length>0||leaseEnded?'has-urgent-alert':''}`} aria-live="polite"><span className="eyebrow">TENANCY REMINDERS</span><h2>{overdue.length>0?'Action may be needed':leaseEnded?'Lease end date passed':'Lease renewal coming up'}</h2>{overdue.length>0&&<p><b>{currency(overdue.reduce((sum,c)=>sum+Number(c.amount||0),0))}</b> in charges is past its recorded due date. Please contact your property manager if you have paid or need to discuss the balance.</p>}{leaseEnded&&<p>Your recorded lease end date was {dateLabel(tenant.lease_end)}. Contact your property manager to confirm your renewal or next steps.</p>}{renewalDue&&<p>Your lease is due to end on {dateLabel(tenant.lease_end)}. Please contact your property manager to discuss renewal before that date.</p>}</section>}
    <section className="tenant-summary-grid">{[[Wallet,'Outstanding charges',currency(unpaid.reduce((sum,c)=>sum+Number(c.amount||0),0)),`${unpaid.length} unpaid or upcoming items`],[Wrench,'Open maintenance',openRepairs.length,`${items.length} total requests`],[CalendarDays,'Upcoming inspections',upcoming.length,upcoming[0]?`Next: ${dateLabel(upcoming[0].inspection_date)}`:'No inspections scheduled']].map(([Icon,label,value,note])=><article className="panel tenant-summary-card" key={label}><span><Icon size={18}/></span><b>{value}</b><strong>{label}</strong><small>{note}</small></article>)}</section>
    <section className="panel tenant-profile-section"><div className="panel-heading"><div><span className="eyebrow">ACCOUNT ACTIVITY</span><h2>Rent and charge history</h2><p>When your lease reaches its end date, an unpaid renewal charge is added here for the next rent period. It appears in outstanding charges until your property manager records it as paid or updates the tenancy. Contact your property manager if the amount or renewal needs correction. Online payments are not available in this portal; receipts shared with you are available in your property documents.</p></div></div>{charges.length?<><div className="table-wrap"><table><thead><tr><th>CHARGE</th><th>DUE</th><th>PAID</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{pageCharges.map(c=><tr key={c.id}><td>{c.description||c.category||'Property charge'}</td><td>{dateLabel(c.due_date)}</td><td>{dateLabel(c.paid_at?.slice(0,10))}</td><td>{currency(c.amount)}</td><td><span className={`status-pill status-${c.status}`}>{c.status}</span></td></tr>)}</tbody></table></div>{chargePagination}</>:<p>No charges have been recorded for this property account yet.</p>}</section>
    {notices.length>0&&<section className="panel tenant-profile-section"><span className="eyebrow">FROM YOUR PROPERTY MANAGER</span><h2>Property notices</h2>{pageNotices.map(n=><article className="tenant-notice" key={n.id}><div><b>{n.title}</b><small>{n.priority} · {dateLabel(n.created_at?.slice(0,10))}</small></div><p>{n.body}</p></article>)}{noticePagination}</section>}
    <PropertyMessagePanel auth={auth} tenant={tenant}/>
    <StaffPaymentTenantView tenant={tenant}/>
    <section className="panel tenant-profile-section tenant-maintenance"><div className="panel-heading"><div><span className="eyebrow">PROPERTY CARE</span><h2>Maintenance requests</h2><p>Track progress and reply to the assigned team here.</p></div></div><form onSubmit={submit}><div className="form-row"><label>Issue title<input required name="title" minLength="3" maxLength="160" placeholder="e.g. Water leak in bathroom"/></label><label>Priority<select name="priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div><label>Describe the issue<textarea name="description" required minLength="10" maxLength="4000" rows="3"/></label><label>Photo evidence (optional)<input type="file" name="evidence" accept="image/jpeg,image/png,image/webp"/><small>JPG, PNG or WebP, up to 10 MB.</small></label><button className="primary-button" disabled={busy}>{busy?'Sending…':'Send maintenance request'}</button></form>{message&&<p className="setup-note" role="status">{message}</p>}<div className="tenant-request-list">{pageMaintenance.map(item=><article key={item.id}><div className="tenant-maintenance-heading"><b>{item.title}</b><span className="status-pill">{item.status.replaceAll('_',' ')}</span></div><span>{item.description}</span><small>{item.priority} priority · {dateLabel(item.created_at?.slice(0,10))}{item.due_date?` · Target ${dateLabel(item.due_date)}`:''}{item.assigned_staff_id?` · Assigned to ${staff.find(s=>s.id===item.assigned_staff_id)?.full_name||'property team'}`:''}</small>{item.evidence_path&&<button className="text-button" onClick={()=>openEvidence(item.evidence_path)}>View photo evidence</button>}{updates.filter(u=>u.request_id===item.id).map(u=><div className="maintenance-update" key={u.id}><p>{u.body}</p><small>{u.author_id===auth.id?'You · ':'Property team · '}{new Date(u.created_at).toLocaleString()}</small></div>)}<form className="maintenance-reply" onSubmit={e=>reply(e,item)}><label htmlFor={`maintenance-reply-${item.id}`}>Add an update</label><textarea id={`maintenance-reply-${item.id}`} rows="2" maxLength="3000" required value={replyDrafts[item.id]||''} onChange={e=>setReplyDrafts(all=>({...all,[item.id]:e.target.value}))}/><button className="secondary-button" disabled={busy}>Send update</button></form></article>)}</div>{maintenancePagination}{!items.length&&<p>No maintenance requests yet.</p>}</section>
    <section className="panel tenant-profile-section"><div className="panel-heading"><div><span className="eyebrow">IMPORTANT DATES</span><h2>Inspections and lease dates</h2></div></div><div className="tenant-date-list">{tenant.lease_start&&<article><b>Lease started</b><span>{dateLabel(tenant.lease_start)}</span></article>}{tenant.lease_end&&<article><b>Lease ends</b><span>{dateLabel(tenant.lease_end)}</span></article>}{upcoming.map(i=><article key={i.id}><b>{i.inspection_type?.replaceAll('_',' ')||'Property inspection'}</b><span>{dateLabel(i.inspection_date)} · {i.notes||i.condition}</span></article>)}{!tenant.lease_start&&!tenant.lease_end&&!upcoming.length&&<p>No upcoming dates are recorded.</p>}</div></section>
    <section className="panel tenant-profile-section"><div className="panel-heading"><div><span className="eyebrow">SHARED PROPERTY FILES</span><h2>Documents from your landlord</h2></div><div className="tenant-document-filters"><label>Category<select aria-label="Filter property documents" value={docFilter} onChange={e=>setDocFilter(e.target.value)}><option value="all">All categories</option>{categories.map(c=><option value={c} key={c}>{c.replaceAll('_',' ')}</option>)}</select></label><label>Sort<select aria-label="Sort property documents" value={fileSort} onChange={e=>setFileSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select></label></div></div>{pageSharedFiles.map(file=><article className="tenant-document-row" key={file.id}><div><b>{file.title}</b><small>{file.document_category?.replaceAll('_',' ')||'Shared file'} · {dateLabel(file.created_at?.slice(0,10))}</small></div><button className="secondary-button" onClick={()=>openShared(file.storage_path)}><Download size={15}/> Download</button></article>)}{sharedFilePagination}{!sortedSharedFiles.length&&<p>No files match this filter, or no documents have been shared yet.</p>}</section>
    <section className="panel tenant-profile-section"><span className="eyebrow">PROFILE DETAILS</span><h2>Request a profile correction</h2><p>For your security, your landlord reviews and approves changes to your tenancy record.</p><form className="maintenance-reply" onSubmit={requestProfile}><div className="form-row"><label>Field to update<select name="field_name"><option value="phone">Phone number</option><option value="full_name">Full name</option><option value="permanent_address">Permanent address</option></select></label><label>Correct information<input name="requested_value" required minLength="2" maxLength="500"/></label></div><label>Note (optional)<textarea name="note" rows="2" maxLength="1000"/></label><button className="secondary-button" disabled={busy}>Request correction</button></form>{pageProfileRequests.map(r=><article className="tenant-notice" key={r.id}><b>{r.field_name.replaceAll('_',' ')}: {r.requested_value}</b><small>{r.status} · {dateLabel(r.created_at?.slice(0,10))}{r.response?` · ${r.response}`:''}</small></article>)}{profileRequestPagination}</section>
    <section className="panel tenant-profile-section"><span className="eyebrow">TENANCY DOCUMENTS</span><h2>Review and sign</h2>{pageSignatures.map(document=><article className="tenant-document-row" key={document.id}><div><b>{document.document_type.replaceAll('_',' ')}</b><small>Version {document.document_version} · {document.signer_role==='landlord'?'Landlord has signed':'Signed by you'} · {new Date(document.signed_at).toLocaleDateString()}</small><details><summary>Read document</summary><pre className="document-snapshot">{document.document_text}</pre></details></div>{document.signer_role==='landlord'&&!documents.some(item=>item.document_type===document.document_type&&item.document_version===document.document_version&&item.signer_id===auth.id)&&<button className="primary-button" onClick={()=>signDocument(document)}>Review &amp; sign</button>}</article>)}{tenantSignaturePagination}{!documents.length&&<p>Your landlord has not shared a document for signature yet.</p>}<p className="setup-note">Typed signature and timestamp records are provided; this is not a certified electronic-signature service.</p></section>
  </>;
}

function PropertyMessagePanel({ auth, tenant = null, staff = null, ownerIdOverride = null, title = 'Contact your property team', description = 'Send a private message to a contact linked to your property.' }) {
  const [contacts,setContacts]=useState([]);const [recipient,setRecipient]=useState('');const [items,setItems]=useState([]);const [body,setBody]=useState('');const [feedback,setFeedback]=useState('');const [busy,setBusy]=useState(false);
  const ownerId=tenant?.owner_id||staff?.owner_id||ownerIdOverride;const tenantId=tenant?.id||null;
  async function loadContacts(){const {data,error}=await supabase.rpc('list_property_conversation_contacts');if(error){setFeedback(error.message);return;}const rows=(data||[]).filter((item)=>item.user_id!==auth.id);setContacts(rows);setRecipient((current)=>rows.some((item)=>item.user_id===current)?current:rows[0]?.user_id||'');}
  async function loadMessages(){const {data,error}=await supabase.from('property_messages').select('*').or(`sender_id.eq.${auth.id},recipient_id.eq.${auth.id},owner_id.eq.${ownerId||'00000000-0000-0000-0000-000000000000'}`).order('created_at');if(error){setFeedback(error.message);return;}setItems((data||[]).filter((item)=>(item.sender_id===recipient&&item.recipient_id===auth.id)||(item.recipient_id===recipient&&item.sender_id===auth.id)||((ownerIdOverride===auth.id||!tenant&&!staff)&&item.owner_id===auth.id&&(item.sender_id===recipient||item.recipient_id===recipient))));}
  useEffect(()=>{loadContacts();const timer=window.setInterval(loadContacts,12000);return()=>window.clearInterval(timer);},[auth.id,ownerId]);
  useEffect(()=>{if(!recipient){setItems([]);return;}loadMessages();const timer=window.setInterval(loadMessages,12000);return()=>window.clearInterval(timer);},[recipient,auth.id]);
  async function send(event){event.preventDefault();const contact=contacts.find((item)=>item.user_id===recipient);if(!body.trim()||!ownerId||!contact)return;setBusy(true);const {error}=await supabase.from('property_messages').insert({owner_id:ownerId,tenant_id:tenantId||contact.tenant_id||null,property_id:tenant?.property_id||contact.property_id||staff?.property_id||null,sender_id:auth.id,recipient_id:contact.user_id,body:body.trim()});setBusy(false);if(error)setFeedback(error.message);else{setBody('');setFeedback(`Message sent to ${contact.full_name}.`);loadMessages();}}
  const selected=contacts.find((item)=>item.user_id===recipient);
  return <section id="staff-private-messages" className="panel tenant-profile-section"><span className="eyebrow">PROPERTY TEAM COMMUNICATIONS</span><h2>{title}</h2><p>{description}</p><label>Choose a contact<select value={recipient} onChange={(event)=>setRecipient(event.target.value)}><option value="">Select a linked contact</option>{contacts.map((contact)=><option key={contact.user_id} value={contact.user_id}>{contact.full_name} · {contact.role}</option>)}</select></label><div className="message-thread">{items.map((item)=><article className={item.sender_id===auth.id?'message-mine':'message-theirs'} key={item.id}><p>{item.body}</p><small>{item.sender_id===auth.id?'You':selected?.full_name||'Contact'} · {new Date(item.created_at).toLocaleString()}</small></article>)}{!items.length&&<p>{selected?'No messages in this conversation yet.':'Select a linked contact to view the conversation.'}</p>}</div><form className="thread-reply" onSubmit={send}><label htmlFor="property-message">Your message</label><textarea id="property-message" value={body} onChange={(event)=>setBody(event.target.value)} required maxLength={5000} rows={3} placeholder="Write a message about your property team…"/><button className="primary-button" disabled={busy||!selected}>{busy?'Sending…':'Send message'}</button></form>{feedback&&<p className="setup-note" role="status">{feedback}</p>}</section>;
}

function MfaVerificationGate({onVerify,onSignOut}) { const [code,setCode]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');async function submit(event){event.preventDefault();setBusy(true);const message=await onVerify(code.trim());setBusy(false);if(message)setError(message);}return <main className="admin-access-screen"><section className="admin-access-card"><BrandLockup name="Yemilaz Properties"/><span className="admin-access-icon"><ShieldCheck/></span><span className="eyebrow">OPTIONAL ACCOUNT SECURITY</span><h1>Verify your sign-in</h1><p>Enter the current six-digit code from your authenticator app to continue.</p><form onSubmit={submit}><label>Authenticator code<input autoComplete="one-time-code" inputMode="numeric" minLength="6" maxLength="6" required value={code} onChange={e=>setCode(e.target.value)}/></label><button className="primary-button" disabled={busy}>{busy?'Checking…':'Verify and continue'}</button></form>{error&&<p role="alert">{error}</p>}<button className="secondary-button" onClick={onSignOut}>Sign out</button></section></main>; }

function PublicProfileInbox({ auth }) {
  const [messages, setMessages] = useState([]);
  const [openMessage, setOpenMessage] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [busyId, setBusyId] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  async function load() {
    if (!supabase || !auth?.id) return;
    const { data, error } = await supabase.from('public_profile_messages').select('id,sender_name,sender_email,sender_phone,subject,message,status,created_at,read_at').eq('profile_user_id', auth.id).order('created_at', { ascending: false }).limit(100);
    if (error) setFeedback('Visitor messaging is being set up. Check back after the profile messaging update is enabled.');
    else { setMessages(data || []); setFeedback(''); }
  }
  useEffect(() => { load(); }, [auth?.id]);
  async function markRead(message) {
    setBusyId(message.id);
    const { data, error } = await supabase.from('public_profile_messages').update({ status: 'read', read_at: new Date().toISOString() }).eq('profile_user_id', auth.id).eq('id', message.id).select('id,status,read_at').single();
    setBusyId('');
    if (error) setFeedback(error.message);
    else setMessages((current) => current.map((item) => item.id === data.id ? { ...item, ...data } : item));
  }
  async function archiveMessage(message) {
    setBusyId(message.id);
    const { error } = await supabase.from('public_profile_messages').update({ status: 'archived', read_at: message.read_at || new Date().toISOString() }).eq('profile_user_id', auth.id).eq('id', message.id);
    setBusyId('');
    if (error) setFeedback(error.message); else setMessages((current) => current.map((item) => item.id === message.id ? { ...item, status: 'archived', read_at: item.read_at || new Date().toISOString() } : item));
  }
  async function markReplied(message) {
    setBusyId(message.id);
    const { error } = await supabase.from('public_profile_messages').update({ status: 'replied', read_at: message.read_at || new Date().toISOString() }).eq('profile_user_id', auth.id).eq('id', message.id);
    setBusyId('');
    if (error) setFeedback(error.message); else setMessages((current) => current.map((item) => item.id === message.id ? { ...item, status: 'replied', read_at: item.read_at || new Date().toISOString() } : item));
  }
  const filteredMessages = messages.filter((message) => (filter === 'all' || message.status === filter) && (!search.trim() || `${message.subject} ${message.sender_name} ${message.sender_email} ${message.message}`.toLowerCase().includes(search.trim().toLowerCase())));
  const { pageItems: pageMessages, controls: messagePagination } = usePaginatedItems(filteredMessages, 'visitor messages');
  const newCount = messages.filter((message) => message.status === 'new').length;
  return <section className="public-profile-inbox" aria-labelledby="public-profile-inbox-title"><div className="public-profile-inbox-heading"><div><span className="eyebrow">VISITOR CONTACT</span><h3 id="public-profile-inbox-title">Messages to your profile</h3><p>Private enquiries from visitors to your homepage profile. {newCount ? `${newCount} new message${newCount === 1 ? '' : 's'} to review.` : 'You are up to date.'}</p></div><button type="button" className="text-button" onClick={load}><ArrowRight size={14}/> Refresh inbox</button></div>{messages.length > 0 && <div className="spotlight-inbox-tools"><label><Search size={15}/><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages or senders…" aria-label="Search visitor messages"/></label><div className="spotlight-inbox-filters" role="group" aria-label="Filter visitor messages">{[['all','All'],['new','New'],['read','Read'],['replied','Replied'],['archived','Archived']].map(([value,label])=><button type="button" key={value} className={filter===value?'active':''} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}{value==='new'&&newCount>0&&<i>{newCount}</i>}</button>)}</div></div>}{filteredMessages.length ? <div className="public-profile-message-list">{pageMessages.map((message) => <article key={message.id} className={`${message.status === 'new' ? 'is-new' : ''}${message.status === 'archived' ? 'is-archived' : ''}`}><div className="public-profile-message-title"><div><b>{message.subject}</b><span>From {message.sender_name} · {message.sender_email}</span></div><span className={`public-profile-message-status ${message.status}`}>{message.status}</span></div><p>{message.message}</p><small>{dateLabel(message.created_at?.slice(0, 10))}{message.sender_phone ? ` · ${message.sender_phone}` : ''}</small><div className="public-profile-message-actions"><button type="button" className="text-button" onClick={()=>{setOpenMessage(message);if(message.status==='new')markRead(message);}}>View message <ArrowRight size={14}/></button><a className="secondary-button compact-button" href={`mailto:${encodeURIComponent(message.sender_email)}?subject=${encodeURIComponent(`Re: ${message.subject} · Yemilaz Properties`)}`}>Reply by email</a>{message.status === 'new' && <button type="button" className="text-button" disabled={busyId === message.id} onClick={() => markRead(message)}>{busyId === message.id ? 'Saving…' : 'Mark read'}</button>}{!['replied','archived'].includes(message.status) && <button type="button" className="text-button" disabled={busyId === message.id} onClick={() => markReplied(message)}>{busyId === message.id ? 'Saving…' : 'Mark replied'}</button>}{message.status !== 'archived' ? <button type="button" className="text-button" disabled={busyId === message.id} onClick={() => archiveMessage(message)}>{busyId === message.id ? 'Saving…' : 'Archive'}</button> : <button type="button" className="text-button" disabled={busyId === message.id} onClick={() => markRead(message)}>{busyId === message.id ? 'Saving…' : 'Restore to inbox'}</button>}</div></article>)}</div> : <p className="public-profile-inbox-empty">{messages.length ? 'No messages match this filter. Try another search or filter.' : 'No visitor messages yet. New messages will appear here.'}</p>}{messagePagination}{feedback && <p className="public-profile-message" role="status">{feedback}</p>}{openMessage&&<div className="spotlight-message-overlay" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)setOpenMessage(null);}}><section className="spotlight-message-dialog" role="dialog" aria-modal="true" aria-labelledby="spotlight-message-title"><button type="button" className="spotlight-message-close" aria-label="Close message" onClick={()=>setOpenMessage(null)}>×</button><span className="eyebrow">PRIVATE VISITOR MESSAGE</span><h3 id="spotlight-message-title">{openMessage.subject}</h3><p className="spotlight-message-sender">From <b>{openMessage.sender_name}</b> · {openMessage.sender_email}{openMessage.sender_phone?` · ${openMessage.sender_phone}`:''}</p><p className="spotlight-message-body">{openMessage.message}</p><small>{dateLabel(openMessage.created_at?.slice(0,10))}</small><div className="public-profile-message-actions"><a className="primary-button compact-button" href={`mailto:${encodeURIComponent(openMessage.sender_email)}?subject=${encodeURIComponent(`Re: ${openMessage.subject} · Yemilaz Properties`)}`}>Reply by email</a><button type="button" className="text-button" onClick={()=>archiveMessage(openMessage)}>Archive</button></div></section></div>}</section>;
}

function CommunitySpotlightContent({ auth, role, tenant, staff }) {
  const ownerView = role === 'landlord';
  return <section className="management community-spotlight-management"><div className="community-management-hero"><div><span className="eyebrow">YOUR PUBLIC PROFILE · PRIVATE CONTROLS</span><h1>Community spotlight</h1><p>Choose how you appear to the Yemilaz property community. Your profile is optional, reviewed for standing eligibility, and always under your control.</p></div><div className="community-hero-mark"><Sparkles size={23}/><span>Visibility<br/>on your terms</span></div></div><div className="community-management-points"><article><span><ShieldCheck size={17}/></span><b>Earned eligibility</b><small>Profiles need Established standing (60+) to appear.</small></article><article><span><Eye size={17}/></span><b>Opt in or pause</b><small>You choose whether your public card is discoverable.</small></article><article><span><MessageCircle size={17}/></span><b>Private enquiries</b><small>Visitors can message you without seeing private details.</small></article></div><ProfileStandingCard auth={auth}/><PropertyMessagePanel auth={auth} tenant={tenant} staff={staff} ownerIdOverride={ownerView?auth.id:null} title={ownerView?'Property team conversations':'Contact your property team'} description={ownerView?'Review and coordinate private conversations with people linked to your property portfolio.':'Message your landlord and the authorised professionals assigned to your tenancy.'}/></section>;
}

function CommunitySpotlightPage({ auth, role, tenant, staff, notifications = [], onReadNotification, availablePortals, onSwitchPortal, onSignOut }) {
  return <div className="brand-site theme-jade community-portal-shell"><header className="portal-header"><div className="portal-header-identity"><BrandLockup name="Yemilaz Properties" logo="horizon"/><span className="portal-role-chip">Community profile</span></div><div className="portal-header-actions"><AccountPortalSwitcher roles={availablePortals} activeRole={role} onSelect={onSwitchPortal}/><PortalNotificationCenter notices={notifications} onRead={onReadNotification}/><AccountProfilePhoto auth={auth}/><span className="portal-email" title={auth.email}>{auth.email}</span><button type="button" className="secondary-button" onClick={() => window.location.assign(`${window.location.pathname}?portal=account`)}><ArrowLeft size={14}/> Back to portal</button><button type="button" className="primary-button community-signout portal-logout" onClick={onSignOut}><LogOut size={14}/> Sign out</button></div></header><main className="community-page-main"><CommunitySpotlightContent auth={auth} role={role} tenant={tenant} staff={staff}/></main><ScrollNavigation/><PropertyHelpAssistant/></div>;
}

function AdditionalAccountProfilePage({ auth, role, availablePortals, canReview, requestedRole, onSwitchPortal, onOpenReview, onSignOut }) {
  return <div className="brand-site theme-jade community-portal-shell additional-profile-shell"><header className="portal-header"><div className="portal-header-identity"><BrandLockup name="Yemilaz Properties" logo="horizon"/><span className="portal-role-chip">Additional profile request</span></div><div className="portal-header-actions"><AccountPortalSwitcher roles={availablePortals} activeRole={role} onSelect={onSwitchPortal}/><AccountProfilePhoto auth={auth}/><span className="portal-email" title={auth.email}>{auth.email}</span><button type="button" className="secondary-button" onClick={() => window.location.assign(`${window.location.pathname}?portal=account`)}><ArrowLeft size={14}/> Back to portal</button><button type="button" className="primary-button portal-logout" onClick={onSignOut}><LogOut size={14}/> Log out</button></div></header><main className="community-page-main"><div className="community-management-hero"><div><span className="eyebrow">ONE SIGN-IN · MULTIPLE APPROVED PROFILES</span><h1>Request an additional account profile</h1><p>Your existing profile stays active. Submit the profile you need with supporting information, and switch between approved profiles after review.</p></div><div className="community-hero-mark"><Users size={22}/><span>One account<br/>many roles</span></div></div><AccountUpgradePanel client={supabase} auth={auth} role={role} availableRoles={availablePortals} canReview={canReview} onOpenReview={onOpenReview} initialTargetRole={requestedRole}/></main><ScrollNavigation/><PropertyHelpAssistant/></div>;
}

function ProfileStandingCard({ auth }) {
  const [standing, setStanding] = useState(null);
  const [error, setError] = useState('');
  const [publicProfile, setPublicProfile] = useState({ is_visible: false, display_name: '', topic: '', tagline: '', show_phone: false, show_email: false, show_address: false, eligible: false, score: 0, level_label: '' });
  const [publicProfileMessage, setPublicProfileMessage] = useState('');
  const [savingPublicProfile, setSavingPublicProfile] = useState(false);
  async function load() {
    if (!supabase || !auth?.id) return;
    const [{ data, error: requestError }, { data: visibilityData, error: visibilityError }] = await Promise.all([
      supabase.rpc('get_my_profile_standing'),
      supabase.rpc('get_my_public_profile_settings'),
    ]);
    if (requestError) setError(requestError.message);
    else { setStanding(Array.isArray(data) ? data[0] : data); setError(''); }
    if (!visibilityError) setPublicProfile(Array.isArray(visibilityData) ? visibilityData[0] : visibilityData || { is_visible: false, display_name: '', topic: '', tagline: '', eligible: false, score: 0, level_label: '' });
    else setPublicProfileMessage(visibilityError.message);
  }
  useEffect(() => { load(); }, [auth?.id]);
  async function savePublicProfile(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSavingPublicProfile(true); setPublicProfileMessage('');
    const { error: saveError } = await supabase.rpc('save_my_public_profile_settings', {
      p_is_visible: form.get('public_visible') === 'on',
      p_display_name: form.get('public_display_name'),
      p_topic: form.get('public_topic'),
      p_tagline: form.get('public_tagline'),
      p_show_phone: form.get('show_phone') === 'on',
      p_show_email: form.get('show_email') === 'on',
      p_show_address: form.get('show_address') === 'on',
    });
    setSavingPublicProfile(false);
    if (saveError) { setPublicProfileMessage(saveError.message); return; }
    setPublicProfileMessage(form.get('public_visible') === 'on' ? 'Your profile is eligible for the rotating homepage spotlight.' : 'Your profile is hidden from the homepage spotlight.');
    await load();
  }
  const levels = [{ label: 'Getting started' }, { label: 'Building profile' }, { label: 'Established' }, { label: 'Trusted' }, { label: 'Exemplary' }];
  const level = standing?.score >= 90 ? 5 : standing?.score >= 75 ? 4 : standing?.score >= 60 ? 3 : standing?.score >= 40 ? 2 : 1;
  return <section className="panel profile-standing-card" aria-labelledby="profile-standing-title">
    <div className="profile-standing-head"><div><span className="eyebrow">ACCOUNT PROFILE</span><h2 id="profile-standing-title">Profile standing</h2><p>A transparent progress level based on verification, profile completeness and reviewed account history.</p></div>
      {standing && <div className="standing-score"><b>{standing.score}</b><span>/ 100</span><strong>Level {level} · {standing.level_label}</strong></div>}
    </div>
    {standing ? <>
      <div className="standing-meter" role="progressbar" aria-label="Profile standing score" aria-valuemin="0" aria-valuemax="100" aria-valuenow={standing.score}><span style={{ width: `${standing.score}%` }}/></div>
      <div className="standing-level-map">{levels.map((item, index) => <span key={item.label} className={level > index ? 'reached' : ''}><i>{level > index ? '✓' : index + 1}</i>{item.label}</span>)}</div>
      <div className="standing-factors"><span>{standing.email_verified ? 'Email verified' : 'Verify your email'}<b>{standing.email_verified ? 'Complete' : 'Needed'}</b></span><span>Profile details<b>{standing.profile_completion}% complete</b></span><span>Verified properties<b>{standing.total_properties ? `${standing.verified_properties} of ${standing.total_properties}` : 'No listings yet'}</b></span></div>
      <p className="standing-fairness-note">A complaint or report alone does not lower your standing. Only a reasoned administrator adjustment linked to a resolved or closed case can lower it. Scores are for account progress and review context, not a legal or financial decision.</p>
      {!!standing.adjustment_history?.length && <details className="standing-history"><summary>Administrator-reviewed history ({standing.adjustment_history.length})</summary>{standing.adjustment_history.map((action) => <p key={action.id}><b>{action.points > 0 ? '+' : ''}{action.points} points</b> · {action.reason}<small>{dateLabel(action.created_at?.slice(0, 10))}</small></p>)}</details>}
      <div className="spotlight-editor-layout"><form id="community-spotlight-settings" tabIndex={-1} className="public-profile-settings" onSubmit={savePublicProfile}>
        <div className="public-profile-settings-heading"><div><span className="eyebrow">HOMEPAGE VISIBILITY</span><h3>Community spotlight</h3><p>Choose whether your public profile can appear among a small, rotating selection of property community members.</p></div><span className={`public-profile-level ${publicProfile.eligible ? 'eligible' : ''}`}>{publicProfile.level_label || 'Level pending'}</span></div>
        {publicProfile.eligible || publicProfile.is_visible ? <>
          <label className="checkbox-row public-profile-optin"><input type="checkbox" name="public_visible" checked={Boolean(publicProfile.is_visible)} onChange={(event) => setPublicProfile((current) => ({ ...current, is_visible: event.target.checked, ...(!event.target.checked ? { show_phone: false, show_email: false, show_address: false } : {}) }))}/> Allow my profile to appear on the public homepage</label>
          {!publicProfile.eligible && publicProfile.is_visible && <div className="public-profile-threshold"><ShieldCheck size={17}/><p>Your profile is temporarily hidden because your standing is below Established. Turn off visibility here to remove your opt-in; it will not appear unless it qualifies again.</p></div>}
          <div className="form-row"><label>Public display name<input name="public_display_name" maxLength="80" required={publicProfile.is_visible && publicProfile.eligible} value={publicProfile.display_name || ''} onChange={(event) => setPublicProfile((current) => ({ ...current, display_name: event.target.value }))}/></label><label>Profile topic<input name="public_topic" maxLength="80" required={publicProfile.is_visible && publicProfile.eligible} value={publicProfile.topic || ''} onChange={(event) => setPublicProfile((current) => ({ ...current, topic: event.target.value }))}/></label></div>
          <label>Short introduction<textarea name="public_tagline" maxLength="180" rows="2" required={publicProfile.is_visible && publicProfile.eligible} value={publicProfile.tagline || ''} onChange={(event) => setPublicProfile((current) => ({ ...current, tagline: event.target.value }))}/><small className="spotlight-character-count">{(publicProfile.tagline || '').length}/180 characters</small></label>
          <fieldset className="public-contact-choices" disabled={!publicProfile.eligible || !publicProfile.is_visible}><legend>Contact details visitors may see</legend><p>Each option is private unless you select it. Visitors can always send you a message through the website.</p><label><input type="checkbox" name="show_phone" checked={Boolean(publicProfile.show_phone)} onChange={(event) => setPublicProfile((current) => ({ ...current, show_phone: event.target.checked }))}/> Show my phone number</label><label><input type="checkbox" name="show_email" checked={Boolean(publicProfile.show_email)} onChange={(event) => setPublicProfile((current) => ({ ...current, show_email: event.target.checked }))}/> Show my email address</label><label><input type="checkbox" name="show_address" checked={Boolean(publicProfile.show_address)} onChange={(event) => setPublicProfile((current) => ({ ...current, show_address: event.target.checked }))}/> Show my business or contact address</label></fieldset>
          <small className="public-profile-privacy">Your display name, topic, introduction, account type and standing label appear while visibility is on. Phone, email and address remain hidden unless you enable each option above. Property, tenant and account records stay private.</small>
          <button className="secondary-button" disabled={savingPublicProfile}>{savingPublicProfile ? 'Saving…' : 'Save visibility settings'}</button>
        </> : <><label className="checkbox-row public-profile-optin public-profile-locked"><input type="checkbox" disabled checked={false} readOnly/> Allow my profile to appear on the public homepage</label><div className="public-profile-threshold"><ShieldCheck size={17}/><p>Your score is <b>{standing.score}/100</b>. Reach <b>Established</b> standing (60 points) to unlock homepage visibility. Improve profile completeness, verify your email and properties, and maintain a positive account history.</p></div></>}
        {publicProfileMessage && <p className="public-profile-message" role="status">{publicProfileMessage}</p>}
      </form><aside className="spotlight-live-preview" aria-label="Live public profile preview"><div className="spotlight-preview-heading"><span className="eyebrow">HOMEPAGE CARD PREVIEW</span><span className={`spotlight-preview-status ${publicProfile.is_visible && publicProfile.eligible ? 'is-live' : ''}`}><i/>{publicProfile.is_visible && publicProfile.eligible ? 'Visible' : publicProfile.is_visible ? 'Below threshold' : 'Hidden'}</span></div><p className="spotlight-preview-caption">This is how your opted-in profile will appear to visitors.</p><article className="community-spotlight-card spotlight-preview-card"><span className="community-member-icon"><Users size={18}/></span><span className="community-member-role">{(standing?.account_role || 'Property member').replaceAll('_',' ')}</span><h3>{publicProfile.display_name || 'Your public name'}</h3><b>{publicProfile.topic || 'Your property focus'}</b><p>{publicProfile.tagline || 'Add a short introduction to help visitors understand how you contribute to the property community.'}</p><span className="community-member-level"><ShieldCheck size={13}/>{standing?.level_label || publicProfile.level_label || 'Profile'} standing</span>{(publicProfile.is_visible && (publicProfile.show_phone || publicProfile.show_email || publicProfile.show_address)) && <div className="community-member-contacts">{publicProfile.show_phone && <span><Phone size={13}/>{auth.user_metadata?.phone || 'Phone number visible'}</span>}{publicProfile.show_email && <span><Mail size={13}/>{auth.email}</span>}{publicProfile.show_address && <span><MapPin size={13}/>{auth.user_metadata?.permanent_address || 'Contact address visible'}</span>}</div>}<button type="button" className="primary-button community-message-button" disabled={!publicProfile.is_visible || !publicProfile.eligible}><MessageCircle size={14}/>{publicProfile.is_visible && publicProfile.eligible ? 'Message member' : 'Not shown to visitors'}</button></article><div className="spotlight-preview-privacy"><ShieldCheck size={15}/><span>Property, tenancy and private account records are never shown on this card.</span></div></aside></div>
    </> : <p className="setup-note" role={error ? 'alert' : 'status'}>{error ? `Profile standing is unavailable: ${error}` : 'Loading your account standing…'}</p>}
    <PublicProfileInbox auth={auth}/>
  </section>;
}

function ProfileStandingAdminPage({ client }) {
  const [profiles, setProfiles] = useState([]); const [complaints, setComplaints] = useState([]);
  const [selectedId, setSelectedId] = useState(''); const [points, setPoints] = useState('10');
  const [reason, setReason] = useState(''); const [complaintId, setComplaintId] = useState('');
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function load() {
    const [{ data, error }, complaintResult] = await Promise.all([
      client.rpc('list_profile_standings'),
      client.from('property_complaints').select('id,reference_code,subject,status,landlord_id,assigned_recipient_id,other_participant_id').in('status', ['resolved', 'closed']).order('created_at', { ascending: false }).limit(500),
    ]);
    if (error) setMessage(error.message); else { const result = data || []; setProfiles(result); if (!selectedId && result[0]) setSelectedId(result[0].user_id); }
    if (!complaintResult.error) setComplaints(complaintResult.data || []);
  }
  useEffect(() => { load(); }, []);
  const { pageItems, controls } = usePaginatedItems(profiles, 'profiles');
  const eligibleComplaints = complaints.filter((item) => item.landlord_id === selectedId || item.assigned_recipient_id === selectedId || item.other_participant_id === selectedId);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    const { error } = await client.rpc('adjust_profile_standing', { p_profile_user_id: selectedId, p_points: Number(points), p_reason: reason.trim(), p_complaint_id: Number(points) < 0 ? complaintId || null : null });
    setBusy(false);
    if (error) setMessage(error.message);
    else { setMessage('Profile standing adjustment recorded in the audit history.'); setReason(''); setComplaintId(''); await load(); }
  }
  return <section className="management"><div className="welcome-row"><div><span className="eyebrow">ACCOUNT QUALITY &amp; SAFEGUARDS</span><h1>Profile standing</h1><p>Review account completeness and verified listings. Record a reasoned adjustment only after reviewing the evidence and any linked complaint.</p></div></div>
    <div className="panel standing-admin-guidance"><ShieldCheck size={18}/><p><b>Fair review standard</b><br/>A complaint being filed, or the number of complaints against someone, never changes a score. Negative adjustments require a resolved or closed complaint involving that account and a written administrator finding.</p></div>
    <section className="panel management-panel"><h2>Account standing register</h2><div className="table-wrap"><table><thead><tr><th>PROFILE</th><th>ROLE</th><th>STANDING</th><th>EMAIL</th><th>PROFILE DETAILS</th><th>VERIFIED LISTINGS</th><th>ADMIN ADJUSTMENTS</th></tr></thead><tbody>{pageItems.map((profile) => <tr key={profile.user_id}><td><b>{profile.full_name}</b><small className="directory-subline">{profile.email}</small></td><td>{profile.account_role}</td><td><b>{profile.score}/100</b><small className="directory-subline">Level · {profile.level_label}</small></td><td>{profile.email_verified ? 'Verified' : 'Not verified'}</td><td>{profile.profile_completion}%</td><td>{profile.verified_properties} of {profile.total_properties}</td><td>{profile.adjustment_points > 0 ? '+' : ''}{profile.adjustment_points}</td></tr>)}</tbody></table>{!profiles.length && <EmptyState title="No account profiles available" text="Registered property and community accounts will appear here."/>}</div>{controls}</section>
    <form className="panel maintenance-create standing-adjustment-form" onSubmit={submit}><h2>Record a reviewed adjustment</h2><div className="form-row"><label>Account<select required value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setComplaintId(''); }}><option value="">Choose an account</option>{profiles.map((profile) => <option key={profile.user_id} value={profile.user_id}>{profile.full_name} · {profile.email} · {profile.account_role}</option>)}</select></label><label>Adjustment<select value={points} onChange={(event) => { setPoints(event.target.value); setComplaintId(''); }}><option value="5">+5 · Confirmed positive contribution</option><option value="10">+10 · Strong verified contribution</option><option value="20">+20 · Exceptional contribution</option><option value="-10">−10 · Confirmed policy breach</option><option value="-20">−20 · Serious confirmed breach</option></select></label></div>{Number(points) < 0 && <label>Resolved or closed complaint<select required value={complaintId} onChange={(event) => setComplaintId(event.target.value)}><option value="">Choose the reviewed complaint</option>{eligibleComplaints.map((item) => <option key={item.id} value={item.id}>{item.reference_code} · {item.subject} · {item.status}</option>)}</select><small>Only complaints involving this account and already marked resolved or closed can be linked.</small></label>}<label>Administrator finding and reason<textarea required minLength={12} maxLength={1000} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Record the evidence reviewed and why this adjustment is proportionate."/></label><button className="primary-button" disabled={busy || !selectedId || (Number(points) < 0 && !eligibleComplaints.some((item) => item.id === complaintId))}>{busy ? 'Saving review…' : 'Save reviewed adjustment'}</button>{message && <p className="setup-note" role="status">{message}</p>}</form>
  </section>;
}

function OperationsHub({ page, auth, tenants, properties, isAdmin, onRecordDocument }) {
  const [rows,setRows]=useState([]);const {pageItems:pageRows,controls:operationsPagination}=usePaginatedItems(rows, 'operation records');const [contacts,setContacts]=useState([]);const [busy,setBusy]=useState(false);const [feedback,setFeedback]=useState('');const [mfa,setMfa]=useState(false);const [mfaData,setMfaData]=useState(null);const [otp,setOtp]=useState('');const [from,setFrom]=useState('');const [to,setTo]=useState('');
  const tableByPage={'Audit history':'audit_events','Property documents':'property_documents','Inspections':'property_inspections','Property incidents':'property_incidents','Email delivery':'tenant_packet_deliveries','Property messages':'property_messages','Security & privacy':'privacy_requests','Property notices':'property_notices','Tenant profile requests':'tenant_profile_requests'};
  async function load(){const table=tableByPage[page];if(!table)return;let query=supabase.from(table).select('*').order('created_at',{ascending:false}).limit(250);if(page==='Property messages')query=query.or(`sender_id.eq.${auth.id},recipient_id.eq.${auth.id},owner_id.eq.${auth.id}`);const {data,error}=await query;if(error)setFeedback(error.message);else setRows(data||[]);}
  useEffect(()=>{load();if(page==='Property messages')supabase.rpc('list_property_conversation_contacts').then(({data,error})=>{if(error)setFeedback(error.message);else setContacts(data||[]);});if(page==='Security & privacy')supabase.from('account_security_preferences').select('mfa_opt_in').eq('user_id',auth.id).maybeSingle().then(({data})=>setMfa(!!data?.mfa_opt_in));},[page,auth?.id]);
  async function mfaStart(){setBusy(true);setFeedback('');const {data,error}=await supabase.auth.mfa.enroll({factorType:'totp',friendlyName:'Yemilaz Properties'});setBusy(false);if(error){setFeedback(error.message);return;}setMfaData(data);}
  async function mfaVerify(event){event.preventDefault();setBusy(true);const {data:challenge,error:challengeError}=await supabase.auth.mfa.challenge({factorId:mfaData.id});if(challengeError){setBusy(false);setFeedback(challengeError.message);return;}const {error}=await supabase.auth.mfa.verify({factorId:mfaData.id,challengeId:challenge.id,code:otp});if(error)setFeedback(error.message);else{await supabase.from('account_security_preferences').upsert({user_id:auth.id,mfa_opt_in:true,updated_at:new Date().toISOString()});setMfa(true);setMfaData(null);setFeedback('Optional two-step verification is enabled for your account.');}setBusy(false);}
  async function mfaDisable(){const {data,error}=await supabase.auth.mfa.listFactors();if(error){setFeedback(error.message);return;}for(const factor of data.totp||[])await supabase.auth.mfa.unenroll({factorId:factor.id});await supabase.from('account_security_preferences').upsert({user_id:auth.id,mfa_opt_in:false,updated_at:new Date().toISOString()});setMfa(false);setFeedback('Two-step verification is turned off.');}
  async function uploadDocument(event){event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);const file=fd.get('file');if(!(file instanceof File)||!file.size)return;if(file.size>20*1024*1024){setFeedback('Choose a document smaller than 20 MB.');return;}setBusy(true);const id=crypto.randomUUID();const path=`${auth.id}/${id}/${file.name.replace(/[^\w.-]/g,'_')}`;const {error:uploadError}=await supabase.storage.from('property-documents').upload(path,file,{contentType:file.type,upsert:false});if(uploadError){setBusy(false);setFeedback(uploadError.message);return;}const {error}=await supabase.from('property_documents').insert({owner_id:auth.id,property_id:fd.get('property_id')||null,tenant_id:fd.get('tenant_id')||null,uploaded_by:auth.id,title:String(fd.get('title')||file.name),storage_path:path,mime_type:file.type});setBusy(false);if(error){setFeedback(error.message);return;}form.reset();setFeedback('Private property document uploaded.');load();}
  async function addInspection(event){event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);setBusy(true);const paths=[];const photos=fd.getAll('inspection_photos').filter(file=>file instanceof File&&file.size);if(photos.some(file=>file.size>20*1024*1024)){setBusy(false);setFeedback('Each inspection photo must be smaller than 20 MB.');return;}for(const photo of photos){const path=`${auth.id}/inspections/${crypto.randomUUID()}-${photo.name.replace(/[^\w.-]/g,'_')}`;const {error:uploadError}=await supabase.storage.from('property-documents').upload(path,photo,{contentType:photo.type});if(uploadError){setBusy(false);setFeedback(uploadError.message);return;}paths.push(path);}const {data,error}=await supabase.from('property_inspections').insert({owner_id:auth.id,property_id:fd.get('property_id')||null,tenant_id:fd.get('tenant_id')||null,inspection_type:fd.get('inspection_type'),inspection_date:fd.get('inspection_date'),condition:fd.get('condition'),notes:fd.get('notes')||null,checklist:fd.getAll('checklist'),photo_paths:paths,created_by:auth.id}).select().single();setBusy(false);if(error)setFeedback(error.message);else{const tenant=tenants.find(item=>item.id===data.tenant_id);const pdf=await onRecordDocument({type:'inspection',title:'Property inspection report',summary:`${String(data.inspection_type).replaceAll('_',' ')} inspection recorded for ${tenant?.full_name||'the property'}.`,tenantId:data.tenant_id,propertyId:data.property_id,details:[{label:'Inspection date',value:data.inspection_date},{label:'Overall condition',value:data.condition},{label:'Checklist',value:(data.checklist||[]).join(', ')||'No checklist items selected'},...(data.notes?[{label:'Additional notes',value:data.notes}]:[])]});form.reset();setFeedback(pdf.ok?'Inspection report saved, emailed and added to property documents.':`Inspection saved. PDF/email copy needs attention: ${pdf.error}`);load();}}
  async function submitPrivacy(event){event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);setBusy(true);const {error}=await supabase.from('privacy_requests').insert({user_id:auth.id,full_name:String(fd.get('full_name')),email:auth.email,request_type:fd.get('request_type'),details:String(fd.get('details'))});setBusy(false);if(error)setFeedback(error.message);else{form.reset();setFeedback('Your privacy request has been submitted.');load();}}
  async function sendMessage(event){event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);const contact=contacts.find(item=>item.user_id===fd.get('recipient_id'));if(!contact)return;setBusy(true);const {error}=await supabase.from('property_messages').insert({owner_id:auth.id,tenant_id:contact.tenant_id,property_id:contact.property_id,sender_id:auth.id,recipient_id:contact.user_id,body:String(fd.get('body')).trim()});setBusy(false);if(error)setFeedback(error.message);else{form.reset();setFeedback('Message sent.');load();}}
  async function openFile(path,bucket='property-documents'){const {data,error}=await supabase.storage.from(bucket).createSignedUrl(path,60);if(error)setFeedback(error.message);else window.open(data.signedUrl,'_blank','noopener,noreferrer');}
  async function publishNotice(event){event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);const propertyId=fd.get('property_id')||null;const title=String(fd.get('title')).trim();const body=String(fd.get('body')).trim();setBusy(true);const {data,error}=await supabase.from('property_notices').insert({owner_id:auth.id,created_by:auth.id,property_id:propertyId,title,body,priority:fd.get('priority')}).select().single();setBusy(false);if(error)setFeedback(error.message);else{const linkedTenants=tenants.filter(tenant=>propertyId?tenant.property_id===propertyId:true);let deliveryError='';for(const tenant of linkedTenants){const pdf=await onRecordDocument({type:'property_notice',title:`Property notice: ${title}`,summary:body,tenantId:tenant.id,propertyId:tenant.property_id,details:[{label:'Notice priority',value:data.priority},{label:'Published',value:new Date(data.created_at||Date.now()).toLocaleDateString('en-NG')}]});if(!pdf.ok)deliveryError=pdf.error;}form.reset();setFeedback(deliveryError?`Notice published. PDF/email copy needs attention: ${deliveryError}`:'Notice published. Labelled PDF copies were emailed and saved for linked tenants.');load();}}
  async function reviewProfileRequest(request,approve){const response=window.prompt(approve?'Optional note for the tenant:':'Reason for declining this request:');if(response===null)return;setBusy(true);const {error}=await supabase.rpc('review_tenant_profile_request',{p_request_id:request.id,p_approve:approve,p_response:response});setBusy(false);if(error)setFeedback(error.message);else{setFeedback(approve?'Correction approved and tenant profile updated.':'Correction request declined.');load();}}
  const headings={'Audit history':'Audit history','Security & privacy':'Security and privacy','Property documents':'Property files','Inspections':'Property inspections','Property incidents':'Incident reports','Email delivery':'Document delivery history','Property messages':'Property messages','Property notices':'Property updates','Tenant profile requests':'Tenant profile corrections'};
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">OPERATIONS</div><h1>{headings[page]}</h1><p>{page==='Audit history'?'Review who changed important records and when.':page==='Security & privacy'?'Choose optional account security and submit a data request.':page==='Property documents'?'Store private tenancy, inspection, ownership and invoice files.':page==='Inspections'?'Record move-in, routine and move-out property condition checks.':page==='Property incidents'?'Review safety, damage and urgent property reports submitted by caretakers.':page==='Email delivery'?'See the status of tenant document email attempts.':page==='Property notices'?'Publish updates to everyone or tenants at a selected property.':page==='Tenant profile requests'?'Review requests from tenants to correct their profile details.':'Keep tenant and landlord conversations in a property-linked message thread.'}</p></div></div>
  {page==='Security & privacy'&&<><section className="panel operations-card"><h2>Optional two-step verification</h2><p>This extra sign-in step is optional. You can enable or disable it for this account.</p>{mfa?<button className="secondary-button" onClick={mfaDisable}>Turn off two-step verification</button>:!mfaData?<button className="primary-button" onClick={mfaStart} disabled={busy}>{busy?'Preparing…':'Enable two-step verification'}</button>:<div className="mfa-enrol"><p>Scan this QR code with an authenticator app, then enter its six-digit code.</p><img alt="Authenticator setup QR code" src={mfaData.totp.qr_code}/><code>{mfaData.totp.secret}</code><form onSubmit={mfaVerify}><label>Verification code<input value={otp} onChange={e=>setOtp(e.target.value)} inputMode="numeric" autoComplete="one-time-code" required minLength="6" maxLength="6"/></label><button className="primary-button" disabled={busy}>Verify and enable</button></form></div>}{mfa&&<span className="invite-status">Enabled on this account</span>}</section><section className="panel operations-card"><h2>Privacy request</h2><p>Request access to, correction of, or deletion of personal information associated with your account.</p><form className="maintenance-create" onSubmit={submitPrivacy}><label>Full name<input required name="full_name" defaultValue={auth.user_metadata?.full_name||''}/></label><label>Request type<select name="request_type"><option value="access">Access / copy of my information</option><option value="correction">Correct my information</option><option value="deletion">Delete my information</option><option value="other">Other privacy question</option></select></label><label>Details<textarea required name="details" minLength="10" maxLength="3000" rows="3"/></label><button className="primary-button" disabled={busy}>Submit request</button></form></section>{isAdmin&&<section className="panel operations-card"><h2>Administrator privacy-request queue</h2><div className="table-wrap"><table><thead><tr><th>REQUESTER</th><th>TYPE</th><th>DETAILS</th><th>STATUS</th><th>SUBMITTED</th></tr></thead><tbody>{pageRows.map(r=><tr key={r.id}><td>{r.full_name}<small className="directory-subline">{r.email}</small></td><td>{r.request_type}</td><td>{r.details}</td><td><select value={r.status} onChange={async e=>{const status=e.target.value;const {error}=await supabase.from('privacy_requests').update({status,resolved_at:status==='completed'?new Date().toISOString():null}).eq('id',r.id);if(error)setFeedback(error.message);else load();}}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="completed">Completed</option><option value="declined">Declined</option></select></td><td>{new Date(r.created_at).toLocaleDateString()}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No privacy requests" text="Submitted data requests will appear here."/>}</div></section>}</>}
  {page==='Property documents'&&<><form className="panel maintenance-create" onSubmit={uploadDocument}><h2>Upload a private file</h2><div className="form-row"><label>Document title<input name="title" placeholder="Tenancy agreement, inspection photos…"/></label><label>Property<select name="property_id"><option value="">General file</option>{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div><label>Share with tenant<select name="tenant_id"><option value="">Landlord only</option>{tenants.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select></label><label>PDF or image (max 20 MB)<input type="file" name="file" accept="application/pdf,image/jpeg,image/png,image/webp" required/></label><button className="primary-button" disabled={busy}>Upload document</button></form><div className="panel management-panel"><table><thead><tr><th>DOCUMENT</th><th>PROPERTY</th><th>SHARED WITH</th><th>DATE</th><th>FILE</th></tr></thead><tbody>{pageRows.map(r=><tr key={r.id}><td>{r.title}</td><td>{properties.find(p=>p.id===r.property_id)?.name||'General'}</td><td>{tenants.find(t=>t.id===r.tenant_id)?.full_name||'Landlord only'}</td><td>{dateLabel(r.created_at?.slice(0,10))}</td><td><button className="text-button" onClick={()=>openFile(r.storage_path)}>Open secure link</button></td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No files stored" text="Upload a private file above."/>}</div></>}
  {page==='Inspections'&&<><form className="panel maintenance-create" onSubmit={addInspection}><h2>Record inspection</h2><div className="form-row"><label>Property<select required name="property_id"><option value="">Choose a property</option>{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Tenant<select name="tenant_id"><option value="">Not linked to a tenant</option>{tenants.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select></label></div><div className="form-row"><label>Inspection type<select name="inspection_type"><option value="move_in">Move-in</option><option value="routine">Routine</option><option value="move_out">Move-out</option></select></label><label>Date<input type="date" name="inspection_date" required defaultValue={new Date().toISOString().slice(0,10)}/></label></div><fieldset className="inspection-checklist"><legend>Checklist</legend>{['Walls and ceilings','Floors and doors','Windows and locks','Water and plumbing','Electrical fittings','Kitchen and appliances','Bathroom and sanitation','Safety equipment','Keys and access'].map(item=><label key={item}><input type="checkbox" name="checklist" value={item}/>{item}</label>)}</fieldset><label>Overall condition<textarea name="condition" required minLength="3" maxLength="1000" rows="2" placeholder="Good, fair, needs repairs…"/></label><label>Notes and observations<textarea name="notes" maxLength="4000" rows="3"/></label><label>Inspection photos (optional, up to 20 MB each)<input type="file" name="inspection_photos" multiple accept="image/jpeg,image/png,image/webp"/></label><button className="primary-button" disabled={busy}>Save inspection</button></form><div className="panel management-panel"><table><thead><tr><th>PROPERTY</th><th>TENANT</th><th>TYPE</th><th>DATE</th><th>CHECKLIST / NOTES</th><th>PHOTOS</th></tr></thead><tbody>{pageRows.map(r=><tr key={r.id}><td>{properties.find(p=>p.id===r.property_id)?.name||'—'}</td><td>{tenants.find(t=>t.id===r.tenant_id)?.full_name||'—'}</td><td>{r.inspection_type.replaceAll('_',' ')}</td><td>{dateLabel(r.inspection_date)}</td><td>{r.condition}<small className="directory-subline">{(r.checklist||[]).join(', ')}{r.notes?` · ${r.notes}`:''}</small></td><td>{(r.photo_paths||[]).map((path,index)=><button key={path} className="text-button" onClick={()=>openFile(path)}>Photo {index+1}</button>)}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No inspections recorded" text="Create an inspection report above."/>}</div></>}
  {page==='Property incidents'&&<div className="panel management-panel"><table><thead><tr><th>REPORTED</th><th>PROPERTY</th><th>INCIDENT</th><th>SEVERITY</th><th>DETAILS</th><th>STATUS</th><th>PHOTOS</th></tr></thead><tbody>{pageRows.map(r=><tr key={r.id}><td>{dateLabel(r.created_at?.slice(0,10))}</td><td>{properties.find(p=>p.id===r.property_id)?.name||'—'}</td><td><b>{r.title}</b><small className="directory-subline">Occurred {new Date(r.occurred_at).toLocaleString('en-NG')}</small></td><td>{r.severity}</td><td>{r.description}</td><td><select value={r.status} onChange={async e=>{const status=e.target.value;const {error}=await supabase.from('property_incidents').update({status}).eq('id',r.id).eq('owner_id',auth.id);if(error)setFeedback(error.message);else{setFeedback('Incident status updated.');load();}}}><option value="reported">Reported</option><option value="reviewing">Reviewing</option><option value="action_required">Action required</option><option value="resolved">Resolved</option></select></td><td>{(r.photo_paths||[]).map((path,index)=><button key={path} className="text-button" onClick={()=>openFile(path)}>Photo {index+1}</button>)}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No incident reports" text="Caretaker safety and property incident reports will appear here."/>}</div>}  {page==='Property notices'&&<><form className="panel maintenance-create" onSubmit={publishNotice}><h2>Publish an update</h2><div className="form-row"><label>Title<input name="title" required minLength="3" maxLength="160" placeholder="e.g. Water supply maintenance"/></label><label>Priority<select name="priority"><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select></label></div><label>Applies to<select name="property_id"><option value="">All tenants</option>{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Notice<textarea name="body" required minLength="5" maxLength="5000" rows="4" placeholder="Share timing, access instructions, or other details."/></label><button className="primary-button" disabled={busy}>{busy?'Publishing…':'Publish notice'}</button></form><div className="panel management-panel"><table><thead><tr><th>NOTICE</th><th>PROPERTY</th><th>PRIORITY</th><th>DATE</th></tr></thead><tbody>{pageRows.map(r=><tr key={r.id}><td><b>{r.title}</b><small className="directory-subline">{r.body}</small></td><td>{properties.find(p=>p.id===r.property_id)?.name||'All tenants'}</td><td>{r.priority}</td><td>{dateLabel(r.created_at?.slice(0,10))}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No notices published" text="Publish a property update above; eligible tenants will receive an in-app notification."/>}</div></>}
  {page==='Tenant profile requests'&&<div className="panel management-panel"><table><thead><tr><th>TENANT</th><th>REQUESTED CHANGE</th><th>DETAILS</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{pageRows.map(r=><tr key={r.id}><td>{tenants.find(t=>t.id===r.tenant_id)?.full_name||r.tenant_id}<small className="directory-subline">{tenants.find(t=>t.id===r.tenant_id)?.email}</small></td><td>{r.field_name?.replaceAll('_',' ')}<small className="directory-subline">{r.requested_value}</small></td><td>{r.note||'—'}</td><td>{r.status}</td><td>{r.status==='pending'?<div className="inline-actions"><button className="secondary-button" disabled={busy} onClick={()=>reviewProfileRequest(r,true)}>Approve</button><button className="secondary-button" disabled={busy} onClick={()=>reviewProfileRequest(r,false)}>Decline</button></div>:'Reviewed'}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No correction requests" text="Tenant requests to correct their name, phone, or permanent address will appear here."/>}</div>}
  {page==='Audit history'&&<div className="panel management-panel"><table><thead><tr><th>DATE</th><th>RECORD</th><th>ACTION</th><th>RECORD ID</th><th>CHANGE SUMMARY</th></tr></thead><tbody>{pageRows.map(r=><tr key={r.id}><td>{new Date(r.created_at).toLocaleString()}</td><td>{r.table_name}</td><td>{r.action}</td><td>{r.record_id}</td><td>{Object.keys(r.new_data||r.old_data||{}).filter(k=>['name','full_name','status','amount','description','title'].includes(k)).map(k=>`${k}: ${(r.new_data||r.old_data)[k]}`).join(' · ')||'Record updated'}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No audit events" text="Changes to supported property, tenant, payment, staff and service records appear here after migration."/>}</div>}
  {page==='Email delivery'&&<div className="panel management-panel"><table><thead><tr><th>TENANT</th><th>RECIPIENT</th><th>STATUS</th><th>DETAIL</th><th>DATE</th></tr></thead><tbody>{pageRows.map(r=><tr key={r.id}><td>{r.tenant_name||r.tenant_id||'—'}</td><td>{r.recipient_email||r.email||'—'}</td><td>{r.status||r.delivery_status||'—'}</td><td>{r.error_message||r.error||r.message||'—'}</td><td>{dateLabel((r.created_at||r.sent_at||'').slice(0,10))}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No email attempts yet" text="Tenant document emails sent by the Node service will show their delivery status here when row security permits."/>}</div>}
  {page==='Property messages'&&<><form className="panel maintenance-create" onSubmit={sendMessage}><h2>Start or continue a conversation</h2><label>Property contact<select required name="recipient_id"><option value="">Choose a linked account</option>{contacts.map(c=><option key={c.user_id} value={c.user_id}>{c.full_name} · {c.role} · {c.email}</option>)}</select></label><label>Message<textarea required name="body" maxLength="5000" rows="3"/></label><button className="primary-button" disabled={busy||!contacts.length}>Send message</button>{!contacts.length&&<small>Only registered contacts with a linked website login can receive messages here.</small>}</form><div className="panel management-panel"><table><thead><tr><th>DATE</th><th>FROM</th><th>TO</th><th>MESSAGE</th></tr></thead><tbody>{pageRows.map(r=><tr key={r.id}><td>{new Date(r.created_at).toLocaleString()}</td><td>{r.sender_id===auth.id?'You':contacts.find(c=>c.user_id===r.sender_id)?.full_name||'Contact'}</td><td>{r.recipient_id===auth.id?'You':contacts.find(c=>c.user_id===r.recipient_id)?.full_name||'Contact'}</td><td>{r.body}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No messages" text="Messages with linked landlords, tenants, lawyers, agents and caretakers appear here."/>}</div></>}
  {operationsPagination}{feedback&&<p role="status" className="setup-note">{feedback}</p>}
  </section>;
}

function StakeholderPortal({ auth, role, availablePortals = [], onSwitchPortal, tenant, contacts, cases, activeComplaint, setActiveComplaint, messages, onSend, onResolution, properties, onSubmitComplaint, notifications, onReadNotification, complaintUnreadCounts, onOpenComplaint, onSignOut, toast, onClearToast, onDownloadDocuments, tenantDocsBusy, canReviewUpgrades = false, onOpenUpgradeReview }) {
  const [newComplaint, setNewComplaint] = useState(false);
  const isTenant = role === 'tenant';
  const property = tenant?.property_id ? properties.find((item) => item.id === tenant.property_id) : null;
  const roleLabel = isTenant ? 'Tenant' : portalRoleLabels[role] || (auth.user_metadata?.stakeholder_kind === 'property_seeker' ? 'Property seeker' : 'Property member');

  if (newComplaint) return <div className="brand-site theme-jade"><PublicComplaintRoom properties={properties} tenants={tenant ? [tenant] : []} recipients={contacts} roleDefault={isTenant ? 'Tenant' : ''} onBack={() => setNewComplaint(false)} onSubmit={async (event) => { const submitted = await onSubmitComplaint(event); if (submitted) setNewComplaint(false); }}/>{toast && <div className="toast"><Check size={16}/>{toast}<button aria-label="Dismiss notification" onClick={onClearToast}><X size={15}/></button></div>}</div>;

  return <div className={`brand-site theme-jade ${isTenant ? 'tenant-workspace-shell' : ''}`}>
    <header className="portal-header"><div className="portal-header-identity"><BrandLockup name="Yemilaz Properties" logo="horizon"/><span className="portal-role-chip">{roleLabel} portal</span></div><div className="portal-header-actions"><AccountPortalSwitcher roles={availablePortals} activeRole={role} onSelect={onSwitchPortal}/><button className="homepage-visibility-shortcut" onClick={() => window.location.assign(`${window.location.pathname}?portal=account&section=community`)}><Sparkles size={15}/><span>Community spotlight</span></button><PortalNotificationCenter notices={notifications} onRead={onReadNotification}/>{canReviewUpgrades&&<button className="secondary-button" onClick={onOpenUpgradeReview}><ShieldCheck size={14}/> Upgrade reviews</button>}<AccountProfilePhoto auth={auth}/><span className="portal-email" title={auth.email}>{auth.email}</span><button className="secondary-button portal-logout" onClick={onSignOut}><LogOut size={15}/> Log out</button></div></header>
    <main className={`stakeholder-portal ${isTenant ? 'tenant-workspace' : ''}`}>
      <section className="panel tenant-profile-card"><div><span className="eyebrow">{roleLabel.toUpperCase()} PORTAL</span><h1>Welcome, {displayPersonName(tenant?.full_name || auth.user_metadata?.full_name || 'Tenant')}</h1><p>Your property details, charges, documents and conversations in one place.</p></div>{isTenant && <div className="welcome-actions"><button className="primary-button" onClick={() => setNewComplaint(true)}><Plus size={16}/> Raise a property concern</button><button className="secondary-button" onClick={onDownloadDocuments} disabled={tenantDocsBusy}><Download size={15}/>{tenantDocsBusy ? 'Preparing documents…' : 'Download documents'}</button></div>}</section>
        {isTenant && <>
        <div className="tenant-profile-grid">
          <section className="panel tenant-profile-section"><span className="eyebrow">YOUR ACCOUNT</span><h2>{displayPersonName(tenant?.full_name || auth.user_metadata?.full_name || 'Tenant profile')}</h2><p>{tenant?.email || auth.email}</p><p>{tenant?.phone || 'Phone number not provided'}</p><p>{tenant?.permanent_address || 'Address not provided'}</p><div className="tenant-profile-facts"><span>Agreement starts <b>{dateLabel(tenant?.lease_start)}</b></span><span>Agreement ends <b>{dateLabel(tenant?.lease_end)}</b></span><span>Status <b>{tenant?.status || 'Profile not linked'}</b></span></div></section>
          <section className="panel tenant-profile-section"><span className="eyebrow">YOUR RENTAL PROPERTY</span><h2>{property?.name || 'Property not assigned'}</h2><p>{property ? [property.address, property.city, property.state, property.country].filter(Boolean).join(', ') : 'Your landlord can assign a property to your tenancy profile.'}</p>{tenant?.rent_amount != null && <p>Rent: <b>{currency(tenant.rent_amount)}</b></p>}<div className="tenant-profile-facts">{contacts.map((contact) => <span key={contact.id}>{contact.role === 'caretaker' ? 'Caretaker' : contact.role === 'lawyer' ? 'Lawyer' : contact.role === 'landlord' ? 'Landlord' : 'Agent'} <b>{contact.full_name}</b></span>)}</div></section>
        </div>
        {!tenant && <div className="panel tenant-profile-section" role="status"><span className="eyebrow">TENANCY LINK</span><h2>Your sign-in is active</h2><p>We could not find a tenancy record linked to <b>{auth.email}</b>. Ask your landlord to check that this is the email on your tenant record and resend your invitation if needed.</p></div>}
        {tenant && <TenantOperations auth={auth} tenant={tenant} properties={properties}/>}
      </>}
      <AccountUpgradePanel client={supabase} auth={auth} role={role} availableRoles={availablePortals} canReview={canReviewUpgrades} onOpenReview={onOpenUpgradeReview}/>
      <ComplaintInbox records={cases} activeComplaint={activeComplaint} setActiveComplaint={setActiveComplaint} messages={messages} onSend={onSend} onResolution={onResolution} currentUserId={auth.id} onNew={() => setNewComplaint(true)} unreadCounts={complaintUnreadCounts} onOpenComplaint={onOpenComplaint}/>
      {!isTenant && <section className="panel tenant-profile-section"><span className="eyebrow">YOUR ACCOUNT</span><h2>{auth.user_metadata?.stakeholder_kind === 'property_seeker' ? 'Property seeker profile' : 'Property community profile'}</h2><p>{auth.user_metadata?.full_name || auth.email}</p><p>{auth.user_metadata?.stakeholder_kind === 'property_seeker' ? 'Browse current listings from the website and use your account to follow property complaints or conversations you are invited to.' : 'Use the complaint room to follow cases connected to this account.'}</p></section>}
      {!isTenant && <ParticipantDocumentLibrary auth={auth}/>}
      {toast && <div className="toast"><Check size={16}/>{toast}<button aria-label="Dismiss notification" onClick={onClearToast}><X size={15}/></button></div>}
    </main>
  </div>;
}

function Metric({ icon: Icon, label, value, note, color }) {
  return <div className="metric-card"><div className="metric-top"><span className={`metric-icon ${color}`}><Icon size={18}/></span></div><div className="metric-value">{value}</div><div className="metric-label">{label}</div><div className="metric-note">{note}</div></div>;
}

function PropertyInsights({ properties, tenants, payments, onNavigate, onExport }) {
  const [reportFrom,setReportFrom]=useState('');const [reportTo,setReportTo]=useState('');const [reportProperty,setReportProperty]=useState('');const [maintenanceCosts,setMaintenanceCosts]=useState([]);
  useEffect(()=>{if(!supabase)return;supabase.from('maintenance_requests').select('property_id,actual_cost,created_at').not('actual_cost','is',null).then(({data})=>setMaintenanceCosts(data||[]));},[]);
  const reportProperties=properties.filter(property=>!reportProperty||property.id===reportProperty);
  const activeTenants = tenants.filter((tenant) => tenant.status === 'active'&&(!reportProperty||tenant.property_id===reportProperty));
  const occupied = reportProperties.filter((property) => property.status === 'occupied').length;
  const occupancy = reportProperties.length ? Math.round((occupied / reportProperties.length) * 100) : 0;
  const filteredPayments=payments.filter(payment=>{const day=(payment.paid_at||payment.due_date||payment.created_at||'').slice(0,10);return (!reportFrom||day>=reportFrom)&&(!reportTo||day<=reportTo)&&(!reportProperty||payment.property_id===reportProperty)});
  const filteredMaintenance=maintenanceCosts.filter(item=>{const day=(item.created_at||'').slice(0,10);return (!reportFrom||day>=reportFrom)&&(!reportTo||day<=reportTo)&&(!reportProperty||item.property_id===reportProperty)});
  const maintenanceTotal=filteredMaintenance.reduce((sum,item)=>sum+Number(item.actual_cost||0),0);
  const collected = filteredPayments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const outstanding = filteredPayments.filter((payment) => payment.status === 'unpaid').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const advertised = reportProperties.filter((property) => property.is_advertised).length;
  const statusGroups = [['Available', 'available'], ['Occupied', 'occupied'], ['Reserved', 'reserved'], ['Sold', 'sold']].map(([label, status]) => ({ label, count: reportProperties.filter((property) => property.status === status).length }));
  const propertyTypes = [...new Set(reportProperties.map((property) => property.property_type || 'Unspecified'))].map((label) => ({ label, count: reportProperties.filter((property) => (property.property_type || 'Unspecified') === label).length })).sort((a, b) => b.count - a.count).slice(0, 5);
  const attention = [
    ...reportProperties.filter((property) => property.status === 'available' && !property.is_advertised).map((property) => ({ title: property.name, detail: 'Available but not advertised', action: 'Properties' })),
    ...filteredPayments.filter((payment) => payment.status === 'unpaid').slice(0, 4).map((payment) => ({ title: payment.description, detail: `${currency(payment.amount)} outstanding`, action: 'Payments & charges' })),
    ...activeTenants.filter((tenant) => !tenant.property_id).map((tenant) => ({ title: tenant.full_name, detail: 'Tenant has no property allocation', action: 'Tenants' })),
  ].slice(0, 6);
  const maxStatus = Math.max(1, ...statusGroups.map((item) => item.count));
  const maxType = Math.max(1, ...propertyTypes.map((item) => item.count));
  return <section className="management insights-page"><div className="welcome-row"><div><div className="eyebrow">PORTFOLIO INSIGHTS</div><h1>Portfolio insights</h1><p>A live summary of your properties, leases, advertising and recorded payments.</p></div><div className="welcome-actions"><button className="secondary-button" onClick={onExport}><Download size={15}/> Export report</button><button className="secondary-button" onClick={() => onNavigate('Properties')}><Building2 size={15}/> Manage properties</button></div></div>
    <div className="metric-grid insights-metrics"><Metric icon={Building2} label="Properties" value={reportProperties.length} note={reportProperty?'Selected property':'In your saved portfolio'} color="lavender"/><Metric icon={Users} label="Active tenants" value={activeTenants.length} note="In selected portfolio" color="mint"/><Metric icon={Home} label="Occupancy rate" value={`${occupancy}%`} note={`${occupied} occupied of ${reportProperties.length} properties`} color="blue"/><Metric icon={Wrench} label="Maintenance costs" value={currency(maintenanceTotal)} note={`${filteredMaintenance.length} recorded jobs in range`} color="peach"/></div>
    <div className="panel report-filters"><div><span className="eyebrow">REPORT FILTERS</span><h2>Filter rent, arrears, occupancy and costs</h2></div><label>Property<select value={reportProperty} onChange={e=>setReportProperty(e.target.value)}><option value="">All properties</option>{properties.map(property=><option key={property.id} value={property.id}>{property.name}</option>)}</select></label><label>From<input type="date" value={reportFrom} onChange={e=>setReportFrom(e.target.value)}/></label><label>To<input type="date" value={reportTo} onChange={e=>setReportTo(e.target.value)}/></label><button className="secondary-button" onClick={()=>{setReportFrom('');setReportTo('');setReportProperty('');}}>Clear filters</button></div>
    <div className="insights-summary-row"><div className="panel insight-money"><span className="eyebrow">RECORDED PAYMENT ACTIVITY</span><div><span>Paid charges</span><b>{currency(collected)}</b></div><div><span>Unpaid charges</span><b>{currency(outstanding)}</b></div><small>{filteredPayments.length} payment records in selected date range</small><button className="text-button" onClick={() => onNavigate('Payments & charges')}>Open payments <ArrowRight size={14}/></button><small>Totals use payment and charge records saved in your property records.</small></div><div className="panel insight-chart"><div className="panel-heading"><div><span className="eyebrow">PORTFOLIO STATUS</span><h2>Property availability</h2></div><span className="count-badge">{properties.length}</span></div>{statusGroups.map((item) => <div className="insight-bar-row" key={item.label}><span>{item.label}</span><div className="insight-bar-track"><i style={{ width: `${Math.round((item.count / maxStatus) * 100)}%` }}/></div><b>{item.count}</b></div>)}{!properties.length && <p className="insight-empty">Add properties to see a portfolio breakdown.</p>}</div></div>
    <div className="insights-summary-row"><div className="panel insight-chart"><div className="panel-heading"><div><span className="eyebrow">PROPERTY MIX</span><h2>By property type</h2></div></div>{propertyTypes.length ? propertyTypes.map((item) => <div className="insight-bar-row" key={item.label}><span>{item.label}</span><div className="insight-bar-track"><i style={{ width: `${Math.round((item.count / maxType) * 100)}%` }}/></div><b>{item.count}</b></div>) : <p className="insight-empty">Property type insights appear when properties are added.</p>}</div><div className="panel insight-actions"><div className="panel-heading"><div><span className="eyebrow">NEXT STEPS</span><h2>Needs attention</h2></div></div>{attention.length ? attention.map((item, index) => <button className="insight-action-row" key={`${item.title}-${index}`} onClick={() => onNavigate(item.action)}><span><b>{item.title}</b><small>{item.detail}</small></span><ArrowUpRight size={15}/></button>) : <p className="insight-empty">No outstanding items found in your current records.</p>}</div></div>
    <div className="panel insight-properties"><div className="panel-heading"><div><span className="eyebrow">YOUR PORTFOLIO</span><h2>Property performance</h2></div><button className="text-button" onClick={() => onNavigate('Properties')}>View all <ArrowRight size={14}/></button></div>{reportProperties.length ? <div className="table-wrap"><table><thead><tr><th>PROPERTY</th><th>TYPE</th><th>STATUS</th><th>TENANTS</th><th>VIEWS</th><th>CHARGES PAID</th></tr></thead><tbody>{reportProperties.map((property) => { const assigned = tenants.filter((tenant) => tenant.property_id === property.id); const paid = filteredPayments.filter((payment) => payment.property_id === property.id && payment.status === 'paid').reduce((sum, payment) => sum + Number(payment.amount || 0), 0); return <tr key={property.id}><td>{property.name}</td><td>{property.property_type || '—'}</td><td><span className={`status ${property.status === 'occupied' ? 'active' : 'renewal'}`}><i/>{property.status || '—'}</span></td><td>{assigned.length}</td><td>{Number(property.view_count || 0).toLocaleString()}</td><td className="rent-cell">{currency(paid)}</td></tr>; })}</tbody></table></div> : <EmptyState title="No property data yet" text="Add a property to start building portfolio insights." action={() => onNavigate('Properties')}/>}</div>
  </section>;
}

function exportPortfolioCsv(properties, tenants, payments) {
  const rows = [['Record type','Name / description','Property','Status','Amount (NGN)','Date']];
  properties.forEach((item) => rows.push(['Property', item.name, [item.city,item.state,item.country].filter(Boolean).join(', '), item.status, item.price, '']));
  tenants.forEach((item) => rows.push(['Tenant', item.full_name, item.property_id || '', item.status, item.rent_amount, item.lease_start || '']));
  payments.forEach((item) => rows.push(['Payment', item.description, item.property_id || '', item.status, item.amount, item.paid_at || item.due_date || '']));
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"','""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `yemilaz-portfolio-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(url);
}

const UPGRADE_ROLE_OPTIONS = [
  ['landlord','Landlord / property owner'],['property_developer','Property developer'],['tenant','Tenant'],
  ['agent','Estate agent'],['caretaker','Caretaker'],['lawyer','Property lawyer'],
  ['property_seeker','Property seeker'],['complainant','Other complainant'],
];
const upgradeRoleLabel = (role) => UPGRADE_ROLE_OPTIONS.find(([id]) => id === role)?.[1] || String(role || 'Property member').replaceAll('_',' ');

function AccountUpgradePanel({ client, auth, role, availableRoles = [], canReview = false, onOpenReview, initialTargetRole = '' }) {
  const [requests,setRequests]=useState([]);const [busy,setBusy]=useState(false);const [feedback,setFeedback]=useState('');const [targetRole,setTargetRole]=useState(initialTargetRole);const refreshedRole=useRef(false);
  const {pageItems:pageUpgradeHistory,controls:upgradeHistoryPagination}=usePaginatedItems(requests,'account upgrade requests');
  const currentRole = auth.user_metadata?.stakeholder_kind === 'property_developer' ? 'property_developer'
    : auth.user_metadata?.stakeholder_kind === 'property_seeker' ? 'property_seeker' : role || 'stakeholder';
  const openRequest=requests.find((item)=>['pending','reviewing'].includes(item.status));
  async function load(){if(!client||!auth)return;const {data,error}=await client.from('account_upgrade_requests').select('*').eq('user_id',auth.id).order('created_at',{ascending:false});if(error)setFeedback(`Upgrade requests are unavailable. Apply migration 24 and try again. (${error.message})`);else{setRequests(data||[]);const approved=(data||[]).find((item)=>item.status==='approved'&&item.target_role!==role&&!(item.target_role==='property_developer'&&role==='landlord'));if(approved&&!refreshedRole.current){refreshedRole.current=true;await client.auth.refreshSession();}}}
  useEffect(()=>{load();},[auth?.id]);
  async function submit(event){event.preventDefault();if(!client||openRequest)return;const formElement=event.currentTarget;const form=new FormData(formElement);const files=[...form.getAll('evidence')].filter((item)=>item instanceof File&&item.size);if(!files.length){setFeedback('Attach at least one supporting document or image.');return;}if(files.some((file)=>file.size>15*1024*1024)){setFeedback('Each supporting file must be 15 MB or smaller.');return;}setBusy(true);setFeedback('');const requestId=crypto.randomUUID();const paths=[];for(let index=0;index<files.length;index++){const file=files[index];const safeName=file.name.replace(/[^\w.-]/g,'_').slice(-120)||`evidence-${index+1}`;const path=`${auth.id}/${requestId}/${index+1}-${safeName}`;const {error}=await client.storage.from('account-upgrade-evidence').upload(path,file,{contentType:file.type,upsert:false});if(error){if(paths.length)await client.storage.from('account-upgrade-evidence').remove(paths);setBusy(false);setFeedback(`Supporting file upload failed: ${error.message}`);return;}paths.push(path);}const targetRole=form.get('target_role');const {error}=await client.from('account_upgrade_requests').insert({id:requestId,user_id:auth.id,requester_email:auth.email,target_role:targetRole,justification:String(form.get('justification')||'').trim(),proposed_business_name:form.get('business_name')?String(form.get('business_name')).trim():null,evidence_paths:paths});setBusy(false);if(error){await client.storage.from('account-upgrade-evidence').remove(paths);setFeedback(error.code==='23505'?'You already have an upgrade request awaiting review.':error.message);return;}formElement.reset();setTargetRole('');setFeedback('Your request and supporting files were sent for review. Your existing profiles stay active while we review it.');await load();}
  const activeRoles=new Set(availableRoles.map((item)=>item.role));
  const availableTargets=UPGRADE_ROLE_OPTIONS.filter(([id])=>id!==currentRole&&!activeRoles.has(id));
  const requestedRoleAlreadyActive=Boolean(initialTargetRole&&activeRoles.has(initialTargetRole));
  useEffect(()=>{if(requestedRoleAlreadyActive){setTargetRole('');setFeedback(`You already have a ${upgradeRoleLabel(initialTargetRole)} profile. Use the profile switcher above to open it.`);}},[requestedRoleAlreadyActive,initialTargetRole]);
  const requestedRoleSupported=UPGRADE_ROLE_OPTIONS.some(([id])=>id===initialTargetRole);
  return <section className="management account-upgrade-page"><div className="welcome-row"><div><div className="eyebrow">ACCOUNT SETTINGS / ACCESS</div><h1>Account roles</h1><p>Add another approved profile when your responsibilities change. Existing approved roles and their records remain available.</p></div>{canReview&&<button className="secondary-button" onClick={onOpenReview}><ShieldCheck size={15}/> Review requests</button>}</div>
    <div className="panel upgrade-request-card"><div className="upgrade-request-intro"><span className="upgrade-request-icon"><UserRound size={20}/></span><div><h2>Request an additional account profile</h2><p>Choose the role you need, explain your property connection, and attach supporting evidence. After review, the new portal is added alongside your existing profiles.</p></div></div>
    {requestedRoleAlreadyActive?<div className="upgrade-open-status"><span className="invite-status approved">Already active</span><div><b>{upgradeRoleLabel(initialTargetRole)}</b><p>This profile already belongs to your account. Choose it from the profile switcher to continue.</p></div></div>:!requestedRoleSupported&&initialTargetRole?<div className="upgrade-open-status"><span className="invite-status reviewing">Not available yet</span><div><b>{upgradeRoleLabel(initialTargetRole)}</b><p>This profile type is not available for additional-profile requests yet. Contact support for help.</p></div></div>:openRequest?<div className="upgrade-open-status"><span className={`invite-status ${openRequest.status}`}>{openRequest.status}</span><div><b>{upgradeRoleLabel(openRequest.target_role)}</b><p>Submitted {new Date(openRequest.created_at).toLocaleString('en-NG')}. Your current profiles remain active while this request is reviewed.</p></div></div>:<form className="upgrade-request-form" onSubmit={submit}><div className="form-row"><label>Current profile<input readOnly value={upgradeRoleLabel(currentRole)}/></label><label>Add this profile<select required name="target_role" value={targetRole} onChange={(event)=>setTargetRole(event.target.value)}><option value="" disabled>Choose an account type</option>{availableTargets.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label></div>{['landlord','property_developer'].includes(targetRole)&&<label>Business / organization name<input required name="business_name" maxLength="160" placeholder="Business or property brand name"/></label>}<label>Why do you need this profile?<textarea name="justification" minLength="20" maxLength="4000" rows="4" required placeholder="Describe your role, property connection, and what access you need."/></label><label>Supporting documents <small>(PDF or image, up to 15 MB each)</small><input type="file" name="evidence" accept="application/pdf,image/jpeg,image/png,image/webp" multiple required/><small>Examples: proof of ownership or authorization, an appointment letter, lease or property reference. Remove account numbers and unrelated sensitive details where possible.</small></label><button className="primary-button" disabled={busy||!availableTargets.length}>{busy?'Sending request…':'Submit for review'}</button></form>}
    {feedback&&<p className="setup-note" role="status">{feedback}</p>}</div>
    <div className="panel management-panel upgrade-history"><div className="panel-heading"><div><span className="eyebrow">YOUR REQUEST HISTORY</span><h2>Previous requests</h2></div><button className="secondary-button" onClick={load}>Refresh</button></div><div className="table-wrap"><table><thead><tr><th>REQUESTED PROFILE</th><th>STATUS</th><th>SUBMITTED</th><th>REVIEW NOTES</th></tr></thead><tbody>{pageUpgradeHistory.map((item)=><tr key={item.id}><td>{upgradeRoleLabel(item.target_role)}</td><td><span className={`invite-status ${item.status}`}>{item.status}</span></td><td>{new Date(item.created_at).toLocaleDateString('en-NG')}</td><td>{item.reviewer_notes||'—'}</td></tr>)}</tbody></table>{!requests.length&&<EmptyState title="No account upgrade requests" text="When you need a different account type, submit a request above with supporting information."/>}</div>{upgradeHistoryPagination}</div>
    <p className="support-legal-note">Requests to become a tenant, agent, caretaker or lawyer can be approved only when a property owner has created the matching property or staff record using your sign-in email. Requests to manage properties require evidence reviewed by the platform.</p>
  </section>;
}

function PlatformUpgradeReview({ client, isAdmin = false, onBack, onManageStaff }) {
  const [requests,setRequests]=useState([]);const pendingRequests=requests.filter((item)=>['pending','reviewing'].includes(item.status));const {pageItems:pageRequests,controls:upgradePagination}=usePaginatedItems(pendingRequests, 'upgrade requests');const [reviewers,setReviewers]=useState([]);const [staffEmail,setStaffEmail]=useState('');const [feedback,setFeedback]=useState('');const [busyId,setBusyId]=useState('');
  async function load(){if(!client)return;const {data,error}=await client.from('account_upgrade_requests').select('*').order('created_at',{ascending:false});if(error)setFeedback(`Could not load the account upgrade queue: ${error.message}`);else setRequests(data||[]);if(isAdmin){const {data:reviewerRows,error:reviewerError}=await client.rpc('list_platform_account_reviewers');if(reviewerError)setFeedback(`Could not load review staff: ${reviewerError.message}`);else setReviewers(reviewerRows||[]);}}
  useEffect(()=>{load();},[isAdmin]);
  async function decide(item,decision,suppliedNote){let note=suppliedNote||'';if(decision==='declined'&&!note.trim()){note=window.prompt('Reason for declining this account upgrade:')??null;if(note===null)return;}if(decision==='declined'&&!note.trim()){setFeedback('Add a short reason before declining the request.');return;}setBusyId(item.id);const {error}=await client.rpc('review_account_upgrade',{p_request_id:item.id,p_decision:decision,p_notes:note});setBusyId('');if(error)setFeedback(`Could not update this request: ${error.message}`);else{setFeedback(decision==='approved'?'Profile approved. It will be added to the user’s account alongside their existing roles after refresh.':decision==='declined'?'Request declined.':'Request marked as reviewing.');await load();}}
  async function openEvidence(path){const {data,error}=await client.storage.from('account-upgrade-evidence').createSignedUrl(path,90,{download:true});if(error)setFeedback(error.message);else window.open(data.signedUrl,'_blank','noopener,noreferrer');}
  async function assignReviewer(event){event.preventDefault();const email=String(new FormData(event.currentTarget).get('email')||'').trim();const {error}=await client.rpc('set_platform_account_reviewer',{p_email:email,p_enabled:true});if(error)setFeedback(error.message);else{setFeedback('Platform staff reviewer assigned.');setStaffEmail('');await load();}}
  async function removeReviewer(email){const {error}=await client.rpc('set_platform_account_reviewer',{p_email:email,p_enabled:false});if(error)setFeedback(error.message);else{setFeedback('Reviewer access removed.');await load();}}
  return <section className="management account-upgrade-review"><div className="welcome-row"><div><div className="eyebrow">YEMILAZ PROPERTIES / PRIVATE REVIEW</div><h1>Account upgrade review</h1><p>Check the submitted property or role evidence before approving any access change.</p></div><div className="welcome-actions">{onBack&&<button className="secondary-button" onClick={onBack}>Back to property management</button>}<button className="secondary-button" onClick={load}>Refresh queue</button></div></div>{feedback&&<p role="status" className="setup-note">{feedback}</p>}
    {isAdmin&&<section className="panel reviewer-management"><div><span className="eyebrow">INTERNAL REVIEW ACCESS</span><h2>Manage platform staff</h2><p>Set staff responsibilities and remove access from one central place. Staff permissions are limited to the work you select.</p></div><button className="primary-button" onClick={onManageStaff}><Users size={15}/> Open platform staff</button></section>}
    <div className="upgrade-review-list">{pageRequests.map((item)=><article className="panel upgrade-review-card" key={item.id}><div className="upgrade-review-heading"><div><span className="eyebrow">{item.status.toUpperCase()} · {new Date(item.created_at).toLocaleDateString('en-NG')}</span><h2>{item.requester_name}</h2><a href={`mailto:${item.requester_email}`}>{item.requester_email}</a></div><span className="invite-status">{upgradeRoleLabel(item.previous_role)} → {upgradeRoleLabel(item.target_role)}</span></div><h3>Reason for request</h3><p className="upgrade-review-justification">{item.justification}</p>{item.proposed_business_name&&<p><b>Proposed business:</b> {item.proposed_business_name}</p>}<div className="upgrade-evidence-list"><b>Supporting evidence</b>{(item.evidence_paths||[]).map((path,index)=><button key={path} className="secondary-button" onClick={()=>openEvidence(path)}><FileText size={14}/> Open file {index+1}</button>)}</div><label>Reviewer note (optional)<textarea id={`review-note-${item.id}`} maxLength="3000" rows="2" placeholder="Decision context or follow-up required"/></label><div className="row-actions"><button className="secondary-button" disabled={busyId===item.id} onClick={()=>decide(item,'reviewing',document.getElementById(`review-note-${item.id}`)?.value||'')}>Mark reviewing</button><button className="primary-button" disabled={busyId===item.id} onClick={()=>decide(item,'approved',document.getElementById(`review-note-${item.id}`)?.value||'')}>Approve role</button><button className="danger-button" disabled={busyId===item.id} onClick={()=>decide(item,'declined',document.getElementById(`review-note-${item.id}`)?.value||'')}>Decline</button></div></article>)}{!requests.some((item)=>['pending','reviewing'].includes(item.status))&&<div className="panel"><EmptyState title="No account upgrades waiting" text="New requests and supporting evidence will appear here for authorized reviewers."/></div>}</div>{upgradePagination}
  </section>;
}

function NotificationsPage({ notices, onRead }) {
  const { pageItems, controls } = usePaginatedItems(notices, 'notifications');
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">ACCOUNT ACTIVITY</div><h1>Notifications</h1><p>New enquiries, viewing requests and property complaints for your property account.</p></div></div><div className="panel management-panel"><div className="activity-list">{pageItems.map((notice) => <article className={`activity-item ${notice.read_at ? '' : 'notification-unread'}`} key={notice.id}><span className="activity-icon purple"><Bell size={15}/></span><div className="activity-copy"><b>{notice.title}</b><span>{notice.message}</span><small>{new Date(notice.created_at).toLocaleString()}</small></div>{!notice.read_at && <button className="secondary-button compact-button" onClick={() => onRead(notice)}>Mark read</button>}</article>)}{!notices.length && <EmptyState title="You’re all caught up" text="New activity notifications will appear here."/>}</div>{controls}</div></section>;
}

function RentSchedulePage({ charges, tenants, onNavigate, onSetTransactionPaid }) {
  const today = new Date().toISOString().slice(0,10);
  const rows = charges.filter((charge) => charge.category === 'rent' && charge.status !== 'voided').sort((a,b) => (a.due_date || '').localeCompare(b.due_date || ''));
  const pending = rows.filter((row) => row.status === 'unpaid');
  const overdue = pending.filter((row) => row.due_date && row.due_date < today);
  const { pageItems: pageRows, controls: rentPagination } = usePaginatedItems(rows, 'rent schedule');
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">RENT MANAGEMENT</div><h1>Rent schedule</h1><p>Rent entries follow each tenancy’s start date, end date, amount and payment frequency. Record received payments as they come in.</p></div><button className="secondary-button" onClick={() => onNavigate('Payments & charges')}>Open payment ledger <ArrowRight size={15}/></button></div><div className="metric-grid"><Metric icon={CalendarDays} label="Scheduled charges" value={rows.length} note="Rent ledger entries" color="blue"/><Metric icon={Clock3} label="Due or upcoming" value={pending.length-overdue.length} note="Not yet marked paid" color="peach"/><Metric icon={Wallet} label="Overdue" value={overdue.length} note={currency(overdue.reduce((s,r)=>s+Number(r.amount||0),0))} color="lavender"/><Metric icon={Check} label="Paid" value={rows.filter((r)=>r.status==='paid').length} note="Rent payments recorded" color="mint"/></div><div className="panel management-panel"><div className="table-wrap"><table><thead><tr><th>TENANT</th><th>DESCRIPTION</th><th>DUE DATE</th><th>AMOUNT</th><th>STATUS</th><th>REMINDER</th><th>ACTION</th></tr></thead><tbody>{pageRows.map((row)=><tr key={row.id}><td>{tenants.find((t)=>t.id===row.tenant_id)?.full_name||'—'}</td><td>{row.description}</td><td>{dateLabel(row.due_date)}</td><td>{currency(row.amount)}</td><td><span className={`status ${row.status==='paid'?'active':row.status==='waived'?'active':row.due_date<today?'renewal':'active'}`}><i/>{row.status==='paid'?'Paid':row.status==='waived'?'Waived':row.due_date<today?'Overdue':'Unpaid'}</span></td><td>{row.status==='unpaid'&&tenants.find((t)=>t.id===row.tenant_id)?.email?<a className="secondary-button compact-button" href={`mailto:${encodeURIComponent(tenants.find((t)=>t.id===row.tenant_id).email)}?subject=${encodeURIComponent('Rent reminder · Yemilaz Properties')}&body=${encodeURIComponent(`Hello ${tenants.find((t)=>t.id===row.tenant_id).full_name}, this is a reminder that ${currency(row.amount)} rent is due on ${dateLabel(row.due_date)}. Please contact your landlord if you have questions.`)}`}>Email reminder</a>:'—'}</td><td>{row.status==='unpaid'?<button className="primary-button compact-button" onClick={()=>onSetTransactionPaid(row,'paid')}>Mark paid</button>:row.status==='paid'?<button className="secondary-button compact-button" onClick={()=>onSetTransactionPaid(row,'unpaid')}>Mark unpaid</button>:'—'}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No rent schedule yet" text="Register a tenant with a lease, rent amount and frequency to generate future rent charges."/>}</div>{rentPagination}</div></section>;
}

function MaintenancePage({ records, properties, tenants, staff, userId, onSave, onUpdate, onRecordDocument }) {
  const [busy, setBusy] = useState(false);
  const { pageItems: pageRecords, controls: maintenancePagination } = usePaginatedItems(records, 'maintenance requests');
  async function submit(event) { event.preventDefault(); const form=event.currentTarget; const values=new FormData(form); setBusy(true); const invoice=values.get('invoice'); const result=await onSave({owner_id:userId,created_by:userId,requester_role:'landlord',property_id:values.get('property_id')||null,tenant_id:values.get('tenant_id')||null,title:String(values.get('title')).trim(),description:String(values.get('description')).trim(),priority:values.get('priority'),assigned_staff_id:values.get('assigned_staff_id')||null,due_date:values.get('due_date')||null,vendor_name:values.get('vendor_name')||null,actual_cost:values.get('actual_cost')?Number(values.get('actual_cost')):null},invoice); setBusy(false); if(result)form.reset(); }
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">PROPERTY CARE</div><h1>Maintenance</h1><p>Log repairs, assign a caretaker or agent, track work, and record vendor costs.</p></div></div><form className="panel maintenance-create" onSubmit={submit}><h2>Log a maintenance request</h2><div className="form-row"><label>Issue title<input name="title" required minLength="3" maxLength="160" placeholder="e.g. Repair leaking kitchen tap"/></label><label>Priority<select name="priority"><option value="normal">Normal</option><option value="low">Low</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div><label>Description<textarea name="description" required minLength="10" maxLength="4000" rows="3" placeholder="Describe the issue and access arrangements"/></label><div className="form-row"><label>Property<select name="property_id"><option value="">Select property</option>{properties.map((p)=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label><label>Tenant<select name="tenant_id"><option value="">Not tenant reported</option>{tenants.map((t)=><option value={t.id} key={t.id}>{t.full_name}</option>)}</select></label></div><div className="form-row"><label>Assign to<select name="assigned_staff_id"><option value="">Unassigned</option>{staff.map((s)=><option value={s.id} key={s.id}>{s.full_name} · {s.role}</option>)}</select></label><label>Target date<input name="due_date" type="date"/></label></div><div className="form-row"><label>Vendor / contractor<input name="vendor_name" placeholder="Company or tradesperson"/></label><label>Estimated / actual cost (₦)<input name="actual_cost" type="number" min="0" step="0.01"/></label></div><label>Vendor invoice / work photo (optional, PDF or image)<input type="file" name="invoice" accept="application/pdf,image/jpeg,image/png,image/webp"/></label><button className="primary-button" disabled={busy}>{busy?'Saving…':'Create request'}</button></form><div className="panel management-panel"><div className="table-wrap"><table><thead><tr><th>ISSUE</th><th>PROPERTY</th><th>VENDOR / COST</th><th>ASSIGNED TO</th><th>PRIORITY</th><th>STATUS</th><th>UPDATE</th><th>INVOICE</th></tr></thead><tbody>{pageRecords.map((r)=><tr key={r.id}><td><b>{r.title}</b><small className="directory-subline">{r.description}</small></td><td>{properties.find((p)=>p.id===r.property_id)?.name||'—'}</td><td>{r.vendor_name||'—'}{r.actual_cost!=null&&<small className="directory-subline">{currency(r.actual_cost)}</small>}</td><td>{staff.find((s)=>s.id===r.assigned_staff_id)?.full_name||'Unassigned'}</td><td>{r.priority}</td><td>{r.status.replaceAll('_',' ')}</td><td><select value={r.status} onChange={(e)=>onUpdate(r,{status:e.target.value,completed_at:e.target.value==='completed'?new Date().toISOString():null})}><option value="open">Open</option><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="waiting">Waiting</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td><td>{r.invoice_path?<button className="text-button" onClick={async()=>{const {data,error}=await supabase.storage.from('maintenance-invoices').createSignedUrl(r.invoice_path,60);if(error)setToast(error.message);else window.open(data.signedUrl,'_blank','noopener,noreferrer');}}>Open file</button>:'—'}</td></tr>)}</tbody></table>{!records.length&&<EmptyState title="No maintenance requests" text="Log the first repair or property-care task above."/>}</div>{maintenancePagination}</div></section>;
}

function ViewingCalendarPage({ requests, onUpdate, properties }) {
  const ordered=[...requests].sort((a,b)=>(a.requested_at||'').localeCompare(b.requested_at||''));
  const { pageItems, controls } = usePaginatedItems(ordered, 'viewing requests');
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">VIEWINGS</div><h1>Viewing calendar</h1><p>One place to review requested, confirmed and completed property viewings.</p></div></div><div className="panel management-panel"><div className="viewing-calendar-list">{pageItems.map((item)=><article className="viewing-calendar-card" key={item.id}><div className="calendar-date"><CalendarDays size={19}/><b>{item.requested_at?new Date(item.requested_at).toLocaleDateString('en-NG',{day:'2-digit',month:'short'}):'TBC'}</b><small>{item.requested_at?new Date(item.requested_at).toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'}):''}</small></div><div><h3>{item.name} · {properties.find((p)=>p.id===item.property_id)?.name||item.property_name||'Property'}</h3><p>{item.email}{item.phone?` · ${item.phone}`:''}</p><span className="invite-status">{item.status}</span></div><select aria-label={`Update viewing for ${item.name}`} value={item.status} onChange={(e)=>onUpdate(item,e.target.value)}><option value="new">New</option><option value="confirmed">Confirmed</option><option value="declined">Declined</option><option value="completed">Completed</option></select></article>)}{!ordered.length&&<EmptyState title="No viewing requests" text="New requests from prospective visitors will appear here."/>}</div>{controls}</div></section>;
}

function TenancySignaturesPage({ tenants, profile, auth }) {
  const [docs,setDocs]=useState([]); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
  const { pageItems: pageDocs, controls: signaturePagination } = usePaginatedItems(docs, 'signature records');
  async function load(){if(!supabase)return;const {data,error}=await supabase.from('tenancy_signatures').select('*').order('signed_at',{ascending:false});if(error)setMessage(error.message);else setDocs(data||[]);}
  useEffect(()=>{load();},[]);
  async function create(event){event.preventDefault();const formElement=event.currentTarget;const form=new FormData(formElement);const tenant=tenants.find((t)=>t.id===form.get('tenant_id'));if(!tenant)return;setBusy(true);const type=form.get('document_type');const text=type==='house_rules'?(profile?.house_rules||DEFAULT_PROPERTY_RULES):type==='handover'?`Property handover checklist for ${tenant.full_name} at tenancy ${tenant.id}.`:(profile?.agreement_terms||DEFAULT_AGREEMENT_TERMS) ;const {error}=await supabase.from('tenancy_signatures').insert({tenant_id:tenant.id,owner_id:auth.id,document_type:type,document_text:text,signer_id:auth.id,signer_role:'landlord',signer_name:profile?.full_name||auth.email,signature_text:String(form.get('signature')).trim()});setBusy(false);if(error)setMessage(error.message);else{formElement.reset();setMessage('Your signature was recorded. The tenant can now review and sign from their account.');load();}}
  const types={tenancy_agreement:'Tenancy agreement',house_rules:'Property rules',handover:'Property handover'};
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">TENANCY DOCUMENTS</div><h1>Agreements &amp; signatures</h1><p>Save a versioned document snapshot and capture each party’s typed signature and timestamp.</p></div></div><form className="panel maintenance-create" onSubmit={create}><h2>Prepare a document for signature</h2><div className="form-row"><label>Tenant<select required name="tenant_id" defaultValue=""><option value="">Choose tenant</option>{tenants.map((t)=><option value={t.id} key={t.id}>{t.full_name}</option>)}</select></label><label>Document<select name="document_type"><option value="tenancy_agreement">Tenancy agreement</option><option value="house_rules">Property rules</option><option value="handover">Property handover</option></select></label></div><label>Landlord typed signature<input name="signature" required minLength="2" maxLength="120" placeholder={profile?.full_name||'Type your full name'}/></label><p className="setup-note">This records typed names and timestamps; it is not a certified digital-signature service. Review agreement wording with a qualified lawyer.</p><button className="primary-button" disabled={busy||!tenants.length}>{busy?'Saving…':'Sign and share with tenant'}</button>{message&&<p role="status" className="setup-note">{message}</p>}</form><div className="panel management-panel"><h2>Signature history</h2><div className="table-wrap"><table><thead><tr><th>TENANT</th><th>DOCUMENT</th><th>SIGNED BY</th><th>ROLE</th><th>DATE</th><th>DOCUMENT COPY</th></tr></thead><tbody>{pageDocs.map((d)=><tr key={d.id}><td>{tenants.find((t)=>t.id===d.tenant_id)?.full_name||'Tenant'}</td><td>{types[d.document_type]}</td><td>{d.signer_name}</td><td>{d.signer_role}</td><td>{new Date(d.signed_at).toLocaleString()}</td><td><details><summary>View snapshot</summary><pre className="document-snapshot">{d.document_text}</pre></details></td></tr>)}</tbody></table>{!docs.length&&<EmptyState title="No signatures yet" text="Prepare a document above to start the signature record."/>}</div>{signaturePagination}</div></section>;
}

function Activity({ icon: Icon, tone, title, text, time }) {
  return <div className="activity-item"><span className={`activity-icon ${tone}`}><Icon size={15}/></span><div className="activity-copy"><b>{title}</b><span>{text}</span><small>{time}</small></div></div>;
}

function WantedRequestDialog({ message, setMessage, onClose }) {
  const [propertyType, setPropertyType] = useState('Residential land / plot');
  async function submit(event) {
    event.preventDefault();
    if (!supabase) { setMessage('Request service is temporarily unavailable.'); return; }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const row = { requester_name: String(form.get('requester_name') || '').trim(), requester_email: String(form.get('requester_email') || '').trim(), requester_phone: String(form.get('requester_phone') || '').trim(), country: String(form.get('country') || 'Nigeria').trim(), state: String(form.get('state') || '').trim() || null, city: String(form.get('city') || '').trim(), property_type: form.get('property_type'), listing_type: form.get('listing_type'), budget: form.get('budget') ? Number(form.get('budget')) : null, bedrooms: form.get('bedrooms') ? Number(form.get('bedrooms')) : null, land_size: String(form.get('land_size') || '').trim() || null, details: String(form.get('details') || '').trim() };
    const { error } = await supabase.from('property_wanted_requests').insert(row);
    if (error) { setMessage('We could not send your request. Please check the details and try again.'); return; }
    setMessage('Your request has been shared with registered property professionals who opted in to receive requests. They can contact you directly.');
    formElement.reset();
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal wanted-request-modal" onSubmit={submit}><div className="modal-heading"><div><span className="eyebrow">PROPERTY REQUEST</span><h2>Tell us what you’re looking for</h2><p>Submit without an account. Your request and contact details are shared with registered property professionals who opted in.</p></div><button type="button" className="icon-button" aria-label="Close property request" onClick={onClose}><X size={19}/></button></div><div className="form-row"><label>Your name<input required name="requester_name" minLength="2" maxLength="120" autoComplete="name"/></label><label>Email address<input required name="requester_email" type="email" maxLength="254" autoComplete="email"/></label></div><label>Phone number<input required name="requester_phone" type="tel" minLength="5" maxLength="40" autoComplete="tel"/></label><div className="form-row"><label>Property type<select name="property_type" value={propertyType} onChange={(event) => setPropertyType(event.target.value)}><optgroup label="Residential"><option>House</option><option>Apartment</option><option>Duplex</option><option>Room</option><option>Short-stay accommodation</option></optgroup><optgroup label="Commercial"><option>Shop / Retail</option><option>Office</option><option>Store / Warehouse</option><option>Industrial / Workshop</option><option>Hotel / Guesthouse</option><option>Mixed-use building</option></optgroup><optgroup label="Land & agriculture"><option>Residential land / plot</option><option>Commercial land</option><option>Farmland</option><option>Farm estate</option></optgroup><optgroup label="Other"><option>Parking space</option><option>Event space</option><option>Other property</option></optgroup></select></label><label>Looking to<select name="listing_type"><option value="rent">Rent / lease</option><option value="sale">Buy</option></select></label></div><div className="form-row"><label>Country<input required name="country" defaultValue="Nigeria" maxLength="80"/></label><label>State<input name="state" maxLength="100" placeholder="e.g. Oyo"/></label></div><div className="form-row"><label>City or area<input required name="city" maxLength="100" placeholder="e.g. Ibadan"/></label><label>Maximum budget (₦)<input name="budget" type="number" min="0" step="1000"/></label></div>{/land|farm/i.test(propertyType) ? <label>Land or site size <small>(optional, include units)</small><input name="land_size" maxLength="100" placeholder="e.g. 600 sqm, 2 plots, 5 acres"/></label> : /^(house|apartment|duplex|room|short-stay)/i.test(propertyType) ? <label>Bedrooms needed <small>(optional)</small><input name="bedrooms" type="number" min="0" max="30"/></label> : null}<label>Describe what you need<textarea required name="details" minLength="10" maxLength="3000" rows="4" placeholder="Preferred location, size, permitted use, facilities, move-in date, or other requirements…"/></label><p className="complaint-privacy">Only registered landlords who keep request notifications enabled can see and respond to this request. You may be contacted using the details above.</p>{message && <p role="status" className="lead-feedback">{message}</p>}<div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Close</button><button className="primary-button" disabled={!supabase}>{supabase ? 'Send property request' : 'Service unavailable'}</button></div></form></div>;
}

function EditPersonModal({ person, staff = [], saving, onSave, onClose }) {
  const isTenant = person.kind === 'tenant';
  const isGuarantor = person.kind === 'guarantor';
  const focusTeam = isTenant && person.focusTeam;
  const heading = focusTeam ? 'Manage property team' : isTenant ? 'Edit tenant' : isGuarantor ? 'Edit guarantor' : `Edit ${person.role === 'caretaker' ? 'caretaker' : person.role === 'lawyer' ? 'lawyer' : 'agent'}`;
  const teamFields = <>
    <div className="form-section-title">Assigned property team <small>(optional)</small></div>
    <p className="team-assignment-help">Choose the people supporting this tenancy. Changes are shared with the tenant and affected team members by portal notification and email. Only staff with an email address appear here.</p>
    <div className="form-row"><label>Agent<select name="agent_id" defaultValue={person.agent_id || ''}><option value="">No agent assigned</option>{staff.filter((member)=>member.role==='agent'&&member.email).map((member)=><option key={member.id} value={member.id}>{member.full_name} · {member.email}</option>)}</select></label><label>Caretaker<select name="caretaker_id" defaultValue={person.caretaker_id || ''}><option value="">No caretaker assigned</option>{staff.filter((member)=>member.role==='caretaker'&&member.email).map((member)=><option key={member.id} value={member.id}>{member.full_name} · {member.email}</option>)}</select></label></div>
    <label>Lawyer<select name="lawyer_id" defaultValue={person.lawyer_id || ''}><option value="">No lawyer assigned</option>{staff.filter((member)=>member.role==='lawyer'&&member.email).map((member)=><option key={member.id} value={member.id}>{member.full_name} · {member.email}</option>)}</select></label>
  </>;
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className={`modal edit-person-modal ${focusTeam ? 'team-assignment-modal' : ''}`} onSubmit={onSave}>
    <div className="modal-heading"><div><span className="eyebrow">{focusTeam ? 'TENANT DIRECTORY' : 'PEOPLE DIRECTORY'}</span><h2>{heading}</h2><p>{focusTeam ? `Choose who supports ${person.full_name || 'this tenant'} and save the assignment.` : 'Update this contact in your property records.'}</p></div><button type="button" className="icon-button" aria-label="Close edit form" onClick={onClose}><X size={19}/></button></div>
    {focusTeam ? <>
      <input type="hidden" name="full_name" defaultValue={person.full_name || ''}/><input type="hidden" name="email" defaultValue={person.email || ''}/><input type="hidden" name="phone" defaultValue={person.phone || ''}/><input type="hidden" name="permanent_address" defaultValue={person.permanent_address || ''}/><input type="hidden" name="rent_amount" defaultValue={person.rent_amount || 0}/><input type="hidden" name="rent_frequency" defaultValue={person.rent_frequency || 'yearly'}/><input type="hidden" name="lease_start" defaultValue={person.lease_start || ''}/><input type="hidden" name="lease_end" defaultValue={person.lease_end || ''}/><input type="hidden" name="notes" defaultValue={person.notes || ''}/>
      <section className="team-assignment-focus"><div className="team-assignment-tenant"><span className="eyebrow">TENANT</span><b>{person.full_name}</b><small>{person.property_name || person.property || 'Property tenancy'}</small></div>{teamFields}</section>
    </> : <>
      <label>Full name<input required name="full_name" defaultValue={person.full_name}/></label>
      <div className="form-row"><label>Email<input name="email" type="email" defaultValue={person.email || ''}/></label><label>Phone<input name="phone" type="tel" defaultValue={person.phone || ''}/></label></div>
      {isTenant && <><label>Permanent address <small>(optional)</small><input name="permanent_address" defaultValue={person.permanent_address || ''} autoComplete="street-address"/></label><div className="form-section-title">Tenancy terms</div><div className="form-row"><label>Lease start<input required name="lease_start" type="date" defaultValue={person.lease_start || ''}/></label><label>Lease end<input required name="lease_end" type="date" defaultValue={person.lease_end || ''}/></label></div><div className="form-row"><label>Rent amount (₦)<input required name="rent_amount" type="number" min="0.01" step="0.01" defaultValue={person.rent_amount || 0}/></label><label>Rent frequency<select name="rent_frequency" defaultValue={person.rent_frequency || 'yearly'}><option value="yearly">Yearly</option><option value="quarterly">Quarterly</option><option value="monthly">Monthly</option></select></label></div>{teamFields}<label>Notes<input name="notes" defaultValue={person.notes || ''}/></label><p className="setup-note">Lease dates, amount and frequency control future scheduled rent. Existing payment history is preserved.</p><div className="form-section-title">Add charges to the tenant ledger</div><MoveInChargesEditor title="Additional tenant charges" intro="Add a new payment or outstanding charge, such as security or electricity. Existing receipts will not be changed."/></>}
      {isGuarantor && <><div className="form-row"><label>Relationship<input name="relationship" defaultValue={person.relationship || ''}/></label><label>Occupation<input name="occupation" defaultValue={person.occupation || ''}/></label></div><label>Address<input name="address" defaultValue={person.address || ''}/></label></>}
      {!isTenant && !isGuarantor && <><label>Role<select name="role" defaultValue={person.role || 'agent'}><option value="agent">Agent</option><option value="caretaker">Caretaker</option><option value="lawyer">Lawyer</option></select><small>Changing this updates the linked profile’s permissions.</small></label><label>Notes<input name="notes" defaultValue={person.notes || ''}/></label></>}
    </>}
    <div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : focusTeam ? 'Save team assignment' : 'Save changes'}</button></div>
  </form></div>;
}

function TransactionEditModal({ transaction, tenants, saving, onSave, onClose }) {
  const isRenewalRent = transaction.category === 'rent' && String(transaction.description || '').toLowerCase().startsWith('renewal rent');
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal" onSubmit={onSave}>
    <div className="modal-heading"><div><span className="eyebrow">PAYMENTS &amp; CHARGES</span><h2>Edit transaction</h2><p>Update the record. Voided transactions remain in the audit history.</p></div><button type="button" className="icon-button" onClick={onClose}><X size={19}/></button></div>
    <label>Description<input required name="description" defaultValue={transaction.description}/></label>
    <div className="form-row"><label>Tenant<select name="tenant_id" defaultValue={transaction.tenant_id || ''}><option value="">Property / general charge</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.full_name}</option>)}</select></label><label>Category<select name="category" defaultValue={transaction.category || 'other'}><option value="rent">Rent</option><option value="deposit">Deposit</option><option value="utilities">Utilities</option><option value="maintenance">Maintenance</option><option value="security">Security</option><option value="cleaning">Cleaning</option><option value="other">Other</option></select></label></div>
    <label>Amount (₦)<input required name="amount" type="number" min="0" step="0.01" defaultValue={transaction.amount}/></label>
    {isRenewalRent && <label>Renewal duration<select name="lease_extension_months" defaultValue={transaction.lease_extension_months || ''}><option value="">Use the original agreement term</option><option value="1">1 month</option><option value="3">3 months</option><option value="6">6 months</option><option value="9">9 months</option><option value="12">12 months</option><option value="18">18 months</option><option value="24">24 months</option></select><small>The lease end date is extended from its current value when this renewal is recorded as paid.</small></label>}
    <div className="form-row"><label>Payment period starts <small>(optional)</small><input name="period_start" type="date" defaultValue={transaction.period_start || ''}/></label><label>Payment period ends <small>(optional)</small><input name="period_end" type="date" min={transaction.period_start || undefined} defaultValue={transaction.period_end || ''}/></label></div>
    <div className="form-row"><label>Status<select name="status" defaultValue={transaction.status}><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="waived">Waived</option></select></label><label>Due date<input name="due_date" type="date" defaultValue={transaction.due_date || ''}/></label></div>
    <label>Paid date<input name="paid_at" type="date" defaultValue={transaction.paid_at || ''}/></label>
    <div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
  </form></div>;
}

function MoveInChargesEditor({ title = 'Other move-in charges', intro = 'Add any agreed security, electricity, cleaning or other charges. Each line is saved separately to the tenant’s ledger.' }) {
  const [charges, setCharges] = useState([]);
  const addCharge = () => setCharges((items) => [...items, {
    id: crypto.randomUUID(), category: 'utilities', description: '', amount: '', status: 'paid',
    paidAt: localDateISO(), dueDate: '', periodStart: '', periodEnd: '',
  }]);
  const updateCharge = (id, field, value) => setCharges((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const paidTotal = charges.reduce((total, item) => total + (item.status === 'paid' ? Number(item.amount || 0) : 0), 0);
  const outstandingTotal = charges.reduce((total, item) => total + (item.status === 'unpaid' ? Number(item.amount || 0) : 0), 0);
  return <section className="move-in-charges" aria-label="Additional move-in charges">
    <div className="move-in-charges-heading"><div><b>{title}</b><p>{intro}</p></div><button type="button" className="secondary-button compact-button" onClick={addCharge}><Plus size={14}/> Add charge</button></div>
    {charges.map((charge, index) => <div className="payment-entry-group move-in-charge-row" key={charge.id}>
      <div className="move-in-charge-title"><b>Additional charge {index + 1}</b><button type="button" className="text-button" onClick={() => setCharges((items) => items.filter((item) => item.id !== charge.id))}>Remove</button></div>
      <div className="form-row"><label>Charge type<select name="move_in_charge_category" value={charge.category} onChange={(event) => updateCharge(charge.id, 'category', event.target.value)}><option value="security">Security / caution</option><option value="utilities">Electricity / utilities</option><option value="cleaning">Cleaning</option><option value="maintenance">Maintenance</option><option value="other">Other</option></select></label><label>Description<input required name="move_in_charge_description" value={charge.description} onChange={(event) => updateCharge(charge.id, 'description', event.target.value)} placeholder="e.g. Electricity contribution"/></label></div>
      <div className="form-row"><label>Amount (₦)<input required name="move_in_charge_amount" type="number" min="0.01" step="0.01" value={charge.amount} onChange={(event) => updateCharge(charge.id, 'amount', event.target.value)} placeholder="0.00"/></label><label>Status<select name="move_in_charge_status" value={charge.status} onChange={(event) => updateCharge(charge.id, 'status', event.target.value)}><option value="paid">Paid</option><option value="unpaid">Unpaid / outstanding</option></select></label></div>
      <div className="form-row"><label>Payment period starts <small>(optional)</small><input name="move_in_charge_period_start" type="date" value={charge.periodStart} onChange={(event) => updateCharge(charge.id, 'periodStart', event.target.value)}/></label><label>Payment period ends <small>(optional)</small><input name="move_in_charge_period_end" type="date" min={charge.periodStart || undefined} value={charge.periodEnd} onChange={(event) => updateCharge(charge.id, 'periodEnd', event.target.value)}/></label></div>
      <label>{charge.status === 'paid' ? 'Date received' : 'Due date'}<input name="move_in_charge_date" type="date" value={charge.status === 'paid' ? charge.paidAt : charge.dueDate} onChange={(event) => updateCharge(charge.id, charge.status === 'paid' ? 'paidAt' : 'dueDate', event.target.value)}/></label>
    </div>)}
    {charges.length > 0 && <div className="move-in-charge-totals"><span>Additional charges paid <b>{currency(paidTotal)}</b></span><span>Additional charges outstanding <b>{currency(outstandingTotal)}</b></span></div>}
  </section>;
}

function ManagementPage({ page, tenants, records, query, setQuery, openModal, onDeleteProperty, onEditPerson, onDeletePerson, onToggleAdvertisement, onRequestVerification, onUpdateViewingStatus, onUpdateListingReport, onMarkProfileMessageRead, onUpdatePropertyStatus, onAllocate, onRecordPayment, onEditTransaction, onVoidTransaction, onSetTransactionPaid, onDeleteTransaction, transactionActionId, onSendPacket, sendingTenant, onDownloadPdfs, downloadingTenant, hasPaid }) {
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => setCurrentPage(1), [page, query, paymentStatusFilter]);
  const copy = {
    Properties: ['Property portfolio', 'Delete properties, manage availability, and choose which available homes appear on the dashboard.'],
    Tenants: ['Tenant directory', 'Register tenants, record payments, assign their property team, and manage lease records.'],
    'Payments & charges': ['Payments & service charges', 'Record every rent payment, deposit, utility, maintenance and other property charge.'],
    Guarantors: ['Guarantor records', 'Keep tenant guarantor details available when you need them.'],
    'Staff payments': ['Payments received by your team', 'Review payments recorded by assigned agents, caretakers, lawyers and other property staff. Tenant visibility is controlled on each record.'],
    Caretakers: ['Caretaker directory', 'Coordinate on-site teams across your properties.'],
    Lawyers: ['Lawyer directory', 'Connect your legal adviser with the tenants and property team involved in your portfolio.'],
    Agents: ['Agent directory', 'Your trusted partners for letting and sales.'],
    Enquiries: ['Listing enquiries', 'Follow up with people interested in your advertised properties.'],
    'Public profile enquiries': ['Messages from profile visitors', 'Read website messages sent to your public profile. Reply securely by email; direct contact details are shown only when you chose to display them.'],
    'Short-let requests': ['Short-stay enquiries', 'Review requested stay dates and booking details for advertised short stays. Confirm each stay directly with the guest before treating it as booked.'],
    'Property requests': ['Property wanted requests', 'Anonymous visitors can describe what they need. Requests are visible to landlords who opted in under Landlord profile.'],
    'Viewing requests': ['Viewing requests', 'Review the preferred dates submitted by prospective visitors.'],
    'Listing reports': ['Listing reports', 'Review visitor reports about inaccurate or suspicious advertisements.'],
  }[page] || ['Portfolio overview', 'Your properties at a glance.'];
  const columns = {
    Properties: [['Property', 'name'], ['Type', 'property_type'], ['City', 'city'], ['State / province', 'state'], ['Country', 'country'], ['Listing', 'listing_type'], ['Price', 'price'], ['Views', 'view_count'], ['Availability', 'status'], ['Verification', 'verification_status']],
    'Payments & charges': [['Description', 'description'], ['Tenant', 'tenant_name'], ['Category', 'category'], ['Amount', 'amount'], ['Due date', 'due_date'], ['Paid date', 'paid_at'], ['Evidence', 'evidence_path'], ['Status', 'status']],
    Guarantors: [['Name', 'full_name'], ['Phone', 'phone'], ['Email', 'email'], ['Relationship', 'relationship']],
    Caretakers: [['Name', 'full_name'], ['Phone', 'phone'], ['Email', 'email'], ['Notes', 'notes']],
    Lawyers: [['Name', 'full_name'], ['Phone', 'phone'], ['Email', 'email'], ['Notes', 'notes']],
    Agents: [['Name', 'full_name'], ['Phone', 'phone'], ['Email', 'email'], ['Notes', 'notes']],
    'Staff payments': [['Team member', 'staff_name'], ['Paid by', 'payer_name'], ['Tenant', 'tenant_name'], ['Property', 'property_name'], ['Payment type', 'category'], ['Description', 'description'], ['Amount', 'amount'], ['Date received', 'paid_at'], ['Tenant visibility', 'tenant_visible']],
    Enquiries: [['Property', 'property_name'], ['Name', 'name'], ['Email', 'email'], ['Phone', 'phone'], ['Message', 'message'], ['Received', 'created_at']],
    'Public profile enquiries': [['Name', 'sender_name'], ['Email', 'sender_email'], ['Phone', 'sender_phone'], ['Subject', 'subject'], ['Message', 'message'], ['Received', 'created_at'], ['Status', 'status']],
    'Short-let requests': [['Property', 'property_name'], ['Guest', 'name'], ['Email', 'email'], ['Phone', 'phone'], ['Stay request', 'message'], ['Received', 'created_at']],
    'Property requests': [['Name', 'requester_name'], ['Email', 'requester_email'], ['Phone', 'requester_phone'], ['Looking for', 'property_type'], ['Purpose', 'listing_type'], ['Location', 'request_location'], ['Land size', 'land_size'], ['Bedrooms', 'bedrooms'], ['Budget', 'budget'], ['Details', 'details'], ['Received', 'created_at']],
    'Viewing requests': [['Property', 'property_name'], ['Name', 'name'], ['Email', 'email'], ['Phone', 'phone'], ['Requested time', 'requested_at'], ['Status', 'status']],
    'Listing reports': [['Property', 'property_name'], ['Reason', 'reason'], ['Details', 'details'], ['Reporter', 'reporter_email'], ['Status', 'status'], ['Received', 'created_at']],
  }[page] || [];
  const filtered = records.filter((record) => {
    if (page === 'Payments & charges' && paymentStatusFilter !== 'all' && record.status !== paymentStatusFilter) return false;
    const tenantName = tenants.find((tenant) => tenant.id === record.tenant_id)?.full_name || '';
    return `${Object.values(record).join(' ')} ${tenantName}`.toLowerCase().includes(query.toLowerCase());
  });
  const filteredTenants = tenants.filter((tenant) => `${tenant.name} ${tenant.property}`.toLowerCase().includes(query.toLowerCase()));
  const pagedRecords = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const pagedTenants = filteredTenants.slice((currentPage - 1) * 10, currentPage * 10);
  const value = (key, item, record) => {
    if (key === 'price' || key === 'amount') return currency(item);
    if (key === 'budget') return item ? currency(item) : 'Flexible';
    if (key === 'request_location') return [record.city, record.state, record.country].filter(Boolean).join(', ');
    if (key === 'tenant_name') return tenants.find((tenant) => tenant.id === item.tenant_id)?.full_name || 'General/property charge';
    if (key === 'status') return item === 'available' ? 'Available' : item === 'occupied' ? 'Rented' : item === 'reserved' || item === 'under_offer' ? 'Reserved' : item === 'sold' ? 'Sold' : item === 'paid' ? 'Paid' : item === 'unpaid' ? 'Unpaid' : item === 'waived' ? 'Waived' : item === 'voided' ? 'Voided' : item || '—';
    if (key === 'listing_type') return item === 'sale' ? 'Buy' : item === 'rent' ? 'Rent' : item || '—';
    if (key === 'created_at' || key === 'requested_at') return item ? new Date(item).toLocaleString() : '—';
    if (key === 'paid_at' || key === 'due_date') return item ? dateLabel(item) : '—';
    if (key === 'tenant_visible') return item ? 'Shared with tenant' : 'Landlord and staff only';
    if (key === 'category') return String(item || 'other').replaceAll('_', ' ');
    return item || '—';
  };
  const canAdd = ['Tenants','Properties','Payments & charges','Guarantors','Caretakers','Agents','Lawyers'].includes(page);
  const renderCell = (record, key) => page === 'Payments & charges' && key === 'evidence_path' ? record.evidence_path ? <button className="text-button" onClick={async()=>{const {data,error}=await supabase.storage.from('payment-evidence').createSignedUrl(record.evidence_path,60);if(error)window.alert(`Could not open payment evidence: ${error.message}`);else window.open(data.signedUrl,'_blank','noopener,noreferrer');}}>View evidence</button> : '—' : page === 'Viewing requests' && key === 'status' ? <select aria-label={`Update viewing request for ${record.name}`} value={record.status} onChange={(event) => onUpdateViewingStatus(record, event.target.value)}><option value="new">New</option><option value="confirmed">Confirmed</option><option value="declined">Declined</option><option value="completed">Completed</option></select> : page === 'Listing reports' && key === 'status' ? <select aria-label={`Update report status for ${record.property_name}`} value={record.status} onChange={(event) => onUpdateListingReport(record, event.target.value)}><option value="new">New</option><option value="reviewed">Reviewed</option><option value="actioned">Actioned</option><option value="dismissed">Dismissed</option></select> : page === 'Properties' && key === 'status' ? <select aria-label={`Update status for ${record.name}`} value={record.status} onChange={(event) => onUpdatePropertyStatus(record, event.target.value)}><option value="available">Available</option><option value="reserved">Reserved</option><option value="occupied">Rented</option><option value="sold">Sold</option></select> : value(key, key === 'tenant_name' ? record : record[key], record);
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">{page.toUpperCase()}</div><h1>{copy[0]}</h1><p>{copy[1]}</p></div>{canAdd && <button className="primary-button" onClick={openModal}><Plus size={17}/>{page === 'Tenants' ? 'Register a tenant' : page === 'Properties' ? 'Add a property' : page === 'Payments & charges' ? 'Record a payment' : 'Add a record'}</button>}</div>
    <div className="panel management-panel"><div className="panel-heading"><div><h2>{page}</h2><span className="management-sub">{page === 'Tenants' ? `${tenants.length} tenant records` : `${filtered.length} of ${records.length} records`}</span></div>{page === 'Payments & charges' && <div className="payment-filter-wrap"><button className="filter-button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}><Filter size={15}/>{paymentStatusFilter === 'all' ? 'Filters' : paymentStatusFilter[0].toUpperCase() + paymentStatusFilter.slice(1)}<ChevronDown size={13}/></button>{filtersOpen && <div className="payment-filter-menu" role="group" aria-label="Filter payment records">{[['all','All charges'],['unpaid','Unpaid'],['paid','Paid'],['voided','Voided'],['waived','Waived']].map(([value,label])=><button type="button" key={value} className={paymentStatusFilter===value?'selected':''} onClick={()=>{setPaymentStatusFilter(value);setFiltersOpen(false);}}>{label}{paymentStatusFilter===value&&<Check size={14}/>}</button>)}</div>}</div>}</div><label className="search-box wide-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${page.toLowerCase()}...`}/></label>
      {page === 'Tenants' ? <><div className="table-wrap"><table><thead><tr><th>TENANT</th><th>PROPERTY / ASSIGNED TEAM</th><th>LEASE START</th><th>STATUS</th><th>RENT</th><th>PAYMENT</th><th>ACTION</th></tr></thead><tbody>{pagedTenants.map((tenant, index) => <tr key={tenant.id}><td><div className="tenant-cell"><div className={`tenant-avatar avatar-${index % 4}`}>{tenant.initials}</div><b>{tenant.name}</b></div></td><td>{tenant.property}<small className="directory-subline">{tenant.assignedTeam || 'No assigned team member'}</small></td><td>{tenant.date}</td><td><span className={`status ${tenant.displayStatus === 'Active' ? 'active' : 'renewal'}`}><i/>{tenant.displayStatus}</span></td><td className="rent-cell">{tenant.rent}</td><td>{hasPaid(tenant.id) ? 'Payment recorded' : 'No payment'}</td><td><div className="row-actions"><button className="secondary-button compact-button" onClick={() => hasPaid(tenant.id) ? onAllocate(tenant) : onRecordPayment()}>{tenant.property_id ? 'Change property' : hasPaid(tenant.id) ? 'Allocate' : 'Record payment'}</button><button className="secondary-button compact-button" disabled={sendingTenant === tenant.id} onClick={() => onSendPacket(tenant.id)}>{sendingTenant === tenant.id ? 'Sending…' : 'Send PDFs'}</button><button className="secondary-button compact-button" disabled={downloadingTenant === tenant.id} onClick={() => onDownloadPdfs(tenant.id)}>{downloadingTenant === tenant.id ? 'Generating…' : 'Download PDFs'}</button><button className="secondary-button compact-button team-assign-button" onClick={() => onEditPerson(tenant, 'tenant', true)}><Users size={14}/>Manage team</button><button className="secondary-button compact-button" onClick={() => onEditPerson(tenant, 'tenant')}>Edit</button><button className="danger-button" onClick={() => onDeletePerson(tenant, 'tenant')}><Trash2 size={15}/><span>Delete</span></button></div></td></tr>)}</tbody></table>{filteredTenants.length === 0 && <EmptyState title="No tenants yet" text="Register a tenant to start recording leases and payments."/>}</div><PaginationControls total={filteredTenants.length} page={currentPage} setPage={setCurrentPage} label="tenants"/></>
      : filtered.length ? <><div className="table-wrap"><table><thead><tr>{columns.map(([label]) => <th key={label}>{label.toUpperCase()}</th>)}{['Properties','Guarantors','Caretakers','Agents','Lawyers','Property requests','Payments & charges','Short-let requests','Public profile enquiries'].includes(page) && <th>ACTION</th>}</tr></thead><tbody>{pagedRecords.map((record, index) => <tr key={record.id || index}>{columns.map(([label, key]) => <td key={key}>{renderCell(record, key)}</td>)}{page === 'Payments & charges' && <td><div className="row-actions payment-row-actions">{record.status === 'unpaid' && <button className="primary-button compact-button" disabled={transactionActionId === record.id} onClick={() => onSetTransactionPaid(record, 'paid')}>{transactionActionId === record.id ? 'Saving…' : 'Mark paid'}</button>}{record.status === 'paid' && <button className="secondary-button compact-button" disabled={transactionActionId === record.id} onClick={() => onSetTransactionPaid(record, 'unpaid')}>{transactionActionId === record.id ? 'Saving…' : 'Mark unpaid'}</button>}<button className="secondary-button compact-button" disabled={record.status === 'voided' || transactionActionId === record.id} onClick={() => onEditTransaction(record)}>Edit</button><button className="danger-button" disabled={record.status === 'voided' || transactionActionId === record.id} onClick={() => onVoidTransaction(record)}><span>{record.status === 'voided' ? 'Voided' : transactionActionId === record.id ? 'Saving…' : 'Void'}</span></button>{record.status === 'unpaid' && <button className="danger-button" disabled={transactionActionId === record.id} onClick={() => onDeleteTransaction(record)}><Trash2 size={14}/><span>Delete</span></button>}</div></td>}{['Guarantors','Caretakers','Agents','Lawyers'].includes(page) && <td><div className="row-actions"><button className="secondary-button compact-button" onClick={() => onEditPerson(record, page === 'Guarantors' ? 'guarantor' : 'staff')}>Edit</button><button className="danger-button" onClick={() => onDeletePerson(record, page === 'Guarantors' ? 'guarantor' : 'staff')}><Trash2 size={15}/><span>Delete</span></button></div></td>}{page === 'Public profile enquiries' && <td><div className="row-actions"><a className="secondary-button compact-button" href={`mailto:${encodeURIComponent(record.sender_email)}?subject=${encodeURIComponent(`Re: ${record.subject} · Yemilaz Properties`)}`}>Reply by email</a>{record.status === 'new' && <button className="secondary-button compact-button" onClick={() => onMarkProfileMessageRead(record)}>Mark reviewed</button>}</div></td>}{(page === 'Property requests' || page === 'Short-let requests') && <td><div className="row-actions"><a className="secondary-button compact-button" href={`mailto:${encodeURIComponent(page === 'Property requests' ? record.requester_email : record.email)}?subject=${encodeURIComponent(page === 'Short-let requests' ? 'Your short-let enquiry on Yemilaz Properties' : 'Your property request on Yemilaz Properties')}`}>Email {page === 'Short-let requests' ? 'guest' : 'requester'}</a></div></td>}{page === 'Properties' && <td><div className="row-actions"><button className="secondary-button compact-button" disabled={record.status !== 'available'} onClick={() => onToggleAdvertisement(record)}>{record.is_advertised ? 'Hide ad' : 'Advertise'}</button><button className="secondary-button compact-button" disabled={record.verification_status === 'verified' || record.verification_status === 'pending'} onClick={() => onRequestVerification(record)}>{record.verification_status === 'verified' ? 'Verified' : record.verification_status === 'pending' ? 'Review pending' : 'Request verification'}</button><button className="danger-button" title={`Delete ${record.name}`} onClick={() => onDeleteProperty(record)}><Trash2 size={15}/><span>Delete</span></button></div></td>}</tr>)}</tbody></table></div><PaginationControls total={filtered.length} page={currentPage} setPage={setCurrentPage} label={page.toLowerCase()}/></>
      : <EmptyState title={page === 'Property requests' ? 'No property requests yet' : `No ${page.toLowerCase()} yet`} text={page === 'Properties' ? 'Add a property, then choose whether to advertise it on the dashboard.' : page === 'Payments & charges' ? 'Record rent, deposit and service payments here.' : page === 'Property requests' ? 'New requests from visitors will appear here while your account is opted in under Landlord profile.' : `Add your first ${page.toLowerCase()} record to get started.`} action={canAdd ? openModal : undefined}/>}</div>
    </section>;
}

function EmptyState({ title, text, action }) {
  return <div className="empty-management"><span><Building2 size={23}/></span><h3>{title}</h3><p>{text}</p>{action && <button className="secondary-button" onClick={action}><Plus size={15}/> Add a record</button>}</div>;
}

createRoot(document.getElementById('root')).render(<App/>);
