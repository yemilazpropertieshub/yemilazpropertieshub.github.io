import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BedDouble, Building2, CalendarDays, Check, ChevronDown,
  CircleHelp, Clock3, FileText, Filter, Home, KeyRound, LayoutDashboard, LogOut, UserRound,
  Menu, MoreHorizontal, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles,
  Trash2, Users, Wallet, X, MapPin, Heart, Bell, Wrench, Download, PenLine,
} from 'lucide-react';
import './style.css';

const supabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  : null;
const currency = (value) => `₦${Number(value || 0).toLocaleString('en-NG')}`;
const dateLabel = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-NG', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';
const initials = (name = '') => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const brandName = (value = 'Yemilaz Properties') => String(value).trim() || 'Yemilaz Properties';

function BrandSymbol({ logo = 'horizon', className = '' }) {
  return <svg className={className} viewBox="0 0 146 146" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="1" width="144" height="144" rx="30" fill="var(--brand-soft,#e8f0ed)" stroke="none"/>
    {logo === 'estate' && <><path d="M22 66 73 24l51 42" stroke="var(--brand-accent,#d0ad63)"/><path d="m48 65 25 26 25-26M73 91v35" strokeWidth="9"/></>}
    {logo === 'keystone' && <><path d="M20 126V72a53 53 0 0 1 106 0v54"/><path d="m49 68 24 25 24-25M73 93v33" stroke="var(--brand-accent,#d0ad63)" strokeWidth="7"/></>}
    {logo === 'monogram' && <><circle cx="73" cy="73" r="57"/><text x="73" y="94" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="Manrope,Arial,sans-serif" fontSize="48" fontWeight="700">YP</text><circle cx="119" cy="27" r="6" fill="var(--brand-accent,#d0ad63)" stroke="none"/></>}
    {logo === 'horizon' && <><path d="M22 111h102M31 107V73l27-22 27 22v34M58 51V35l20-16 20 16v91M85 107V75l24-20 22 20v32"/><path d="m48 80 10 10 11-10M58 90v17" stroke="var(--brand-accent,#d0ad63)" strokeWidth="5"/><circle cx="112" cy="36" r="7" fill="var(--brand-accent,#d0ad63)" stroke="none"/></>}
    {logo === 'doorway' && <><path d="M34 126V63a39 39 0 0 1 78 0v63" strokeWidth="10"/><path d="M52 126V65a21 21 0 0 1 42 0v61" stroke="var(--brand-accent,#d0ad63)"/><circle cx="84" cy="101" r="4" fill="currentColor" stroke="none"/></>}
    {logo === 'keyline' && <><path d="M29 119h88M39 115V68l34-27 34 27v47"/><path d="M54 115V78h38v37" stroke="var(--brand-accent,#d0ad63)"/><circle cx="102" cy="36" r="14"/><path d="M102 50v19m0 0h11m-11 0v9" stroke="var(--brand-accent,#d0ad63)"/></>}
    {logo === 'palm-estate' && <><path d="M23 119h100M35 115V76l38-31 38 31v39"/><path d="M73 45c-2-21 4-31 18-34-2 13-8 22-18 28m0 6C62 27 51 23 39 29c9 10 20 15 34 14m0 0c10-17 21-22 35-18-7 12-18 18-34 20" stroke="var(--brand-accent,#d0ad63)"/><path d="M56 115V82h34v33"/></>}
    {logo === 'estate-columns' && <><path d="M24 120h98M32 111V61h24v50M61 111V40h24v71M90 111V69h24v42"/><path d="M27 55h34M56 34h34M85 63h34M43 72v28m30-49v49m29-35v35" stroke="var(--brand-accent,#d0ad63)"/><path d="m61 18 12-9 12 9"/></>}
    {logo === 'diamond-yp' && <><path d="m73 12 61 61-61 61L12 73 73 12Z"/><path d="M44 103V44h16l27 37V44m15 59V44H85" stroke="var(--brand-accent,#d0ad63)" strokeWidth="8"/><circle cx="117" cy="29" r="5" fill="var(--brand-accent,#d0ad63)" stroke="none"/></>}
  </svg>;
}

function BrandLockup({ name, logo = 'horizon', className = '' }) {
  return <div className={`brand-lockup ${className}`}><BrandSymbol logo={logo}/><span><b>{brandName(name)}</b><small>PROPERTY MANAGEMENT</small></span></div>;
}

function BrandWatermark({ logo = 'horizon' }) {
  return <div className="brand-watermark" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <BrandSymbol key={index} logo={logo}/>)}</div>;
}

function BrandingFields({ profile, defaultBusinessName = 'Yemilaz Properties' }) {
  const [name, setName] = useState(profile?.business_name ?? defaultBusinessName);
  const [template, setTemplate] = useState(profile?.brand_template || 'jade');
  const [logo, setLogo] = useState(profile?.brand_logo || 'horizon');
  return <><div className="form-section-title">Your website identity</div>
    <label>Business / website name<input required name="business_name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Adeola Homes"/></label>
    <div className="form-row"><label>Professional colour template<select name="brand_template" value={template} onChange={(event) => setTemplate(event.target.value)}><option value="jade">Jade &amp; brass</option><option value="midnight">Midnight coast</option><option value="terracotta">Heritage clay</option><option value="plum">Orchid &amp; slate</option></select></label>
      <label>Choose a logo mark<select name="brand_logo" value={logo} onChange={(event) => setLogo(event.target.value)}><option value="horizon">Horizon homes</option><option value="estate">Estate monogram</option><option value="keystone">Keystone arch</option><option value="monogram">YP monogram</option><option value="doorway">Open doorway</option><option value="keyline">Keyline residence</option><option value="palm-estate">Palm estate</option><option value="estate-columns">Estate columns</option><option value="diamond-yp">Diamond YP</option></select></label></div>
    <div className={`brand-preview theme-${template}`}><BrandLockup name={name || 'Your property brand'} logo={logo}/><span>Shared platform · Yemilaz Properties</span></div>
  </>;
}

const nav = [
  { title: 'Workspace', links: [['Overview', LayoutDashboard], ['Properties', Building2], ['Property insights', Sparkles], ['Tenants', Users], ['Rent schedule', CalendarDays], ['Maintenance', Wrench], ['Documents & signatures', PenLine], ['Payments & charges', Wallet], ['Notifications', Bell], ['Enquiries', FileText], ['Property requests', FileText], ['Viewing requests', CalendarDays], ['Viewing calendar', CalendarDays], ['Listing reports', ShieldCheck], ['Complaints', CircleHelp]] },
  { title: 'People', links: [['Guarantors', ShieldCheck], ['Caretakers', KeyRound], ['Agents', Users], ['Lawyers', ShieldCheck], ['Property messages', Bell], ['Landlord profile', UserRound]] },
  { title: 'Operations & governance', links: [['Audit history', Clock3], ['Security & privacy', ShieldCheck], ['Property documents', FileText], ['Inspections', Check], ['Email delivery', Bell], ['Property notices', Bell], ['Tenant profile requests', UserRound]] },
];

function App() {
  const [page, setPage] = useState('Overview');
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
  const [authRegistrationRole, setAuthRegistrationRole] = useState('landlord');
  const [allocationTenant, setAllocationTenant] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All properties');
  const [auth, setAuth] = useState(null);
  const [accountRole, setAccountRole] = useState('landlord');
  const [stakeholderCases, setStakeholderCases] = useState([]);
  const [tenantAccount, setTenantAccount] = useState(null);
  const [staffAccount, setStaffAccount] = useState(null);
  const [staffAssignments, setStaffAssignments] = useState([]);
  const [tenantContacts, setTenantContacts] = useState([]);
  const [tenantDocuments, setTenantDocuments] = useState([]);
  const [tenantDocsBusy, setTenantDocsBusy] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [authNotice, setAuthNotice] = useState(null);
  const [signing, setSigning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingTenant, setSendingTenant] = useState(null);
  const [downloadingTenant, setDownloadingTenant] = useState(null);
  const [toast, setToast] = useState('');
  const [showComplaintRoom, setShowComplaintRoom] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [complaintMessages, setComplaintMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [mfaChallenge, setMfaChallenge] = useState(null);

  useEffect(() => {
    document.title = auth
      ? `${landlordProfile?.business_name || 'Yemilaz Properties'} · Yemilaz Properties`
      : 'Yemilaz Properties | Find your place';
  }, [auth, landlordProfile]);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
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
          : { kind: 'success', message: 'Your Yemilaz Properties landlord profile is confirmed. Welcome to your workspace.' });
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
        if (active) { setIsPlatformAdmin(admin === true); setAdminChecked(true); }
        const { data: profile } = await supabase.from('stakeholder_profiles').select('user_id,role,staff_id').eq('user_id', user.id).maybeSingle();
        if (active) setAccountRole(profile?.role || 'landlord');
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuth(session?.user || null);
      if (session?.user) {
        supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(async ({data,error})=>{if(error||data?.nextLevel!=='aal2'||data?.currentLevel==='aal2')return;const {data:factors}=await supabase.auth.mfa.listFactors();const factor=factors?.totp?.find(item=>item.status==='verified');if(!factor)return;const {data:challenge}=await supabase.auth.mfa.challenge({factorId:factor.id});if(challenge)setMfaChallenge({factorId:factor.id,challengeId:challenge.id});});
        setAdminChecked(false);
        supabase.rpc('is_platform_account_active').then(async ({ data: activeAccount }) => { if (activeAccount === false) { await supabase.auth.signOut(); setToast('This account is suspended. Contact Yemilaz Properties support.'); } });
        supabase.rpc('is_platform_admin').then(({ data }) => { setIsPlatformAdmin(data === true); setAdminChecked(true); });
        supabase.from('stakeholder_profiles').select('user_id,role,staff_id').eq('user_id', session.user.id).maybeSingle().then(({ data }) => setAccountRole(data?.role || 'landlord'));
      } else { setIsPlatformAdmin(false); setAccountRole('landlord'); setAdminChecked(true); setMfaChallenge(null); }
      if (event === 'SIGNED_IN' && new URLSearchParams(window.location.search).get('auth') === 'confirmed') {
        setAuthNotice({ kind: 'success', message: 'Your Yemilaz Properties profile is confirmed. Welcome to your workspace.' });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      if (event === 'PASSWORD_RECOVERY') setAuthNotice({ kind: 'reset', message: 'Choose a new password for your Yemilaz Properties account.' });
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    if (auth && accountRole === 'tenant') {
      setTenants([]); setPaymentRecords([]); setStaffRecords([]); setLandlordProfile(null); setStaffAccount(null); setStaffAssignments([]);
      const loadTenantProperty = async () => {
        const { data: tenant, error } = await supabase.from('tenants').select('property_id').ilike('email', auth.email).order('created_at', { ascending: false }).limit(1).maybeSingle();
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
        const { data: profile, error: profileError } = await supabase.from('stakeholder_profiles').select('staff_id').eq('user_id', auth.id).maybeSingle();
        if (!active) return;
        if (profileError || !profile?.staff_id) { setToast(profileError?.message || 'Your staff profile is not linked yet. Ask the landlord to resend your invitation.'); return; }
        const { data: staff, error: staffError } = await supabase.from('staff').select('id,owner_id,full_name,role,email,phone,permanent_address,property_id,notes').eq('id', profile.staff_id).maybeSingle();
        if (!active) return;
        if (staffError || !staff) { setToast(staffError?.message || 'Your staff record could not be found.'); return; }
        setStaffAccount(staff);
        const assignmentField = staff.role === 'agent' ? 'agent_id' : 'caretaker_id';
        const assignmentsQuery = supabase.from('tenants').select('id,full_name,email,phone,property_id,lease_start,lease_end,status').order('full_name');
        const { data: assignments, error: assignmentError } = staff.role === 'lawyer' ? await assignmentsQuery.eq('owner_id', staff.owner_id) : await assignmentsQuery.eq(assignmentField, staff.id);
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
    if (auth && accountRole === 'stakeholder') {
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
  }, [auth, accountRole]);

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
    if (!auth || !['stakeholder', 'tenant', 'agent', 'caretaker'].includes(accountRole) || !supabase) { setStakeholderCases([]); setTenantAccount(null); setTenantContacts([]); return; }
    const refresh = () => supabase.from('property_complaints').select('*').or(`authenticated_reporter_id.eq.${auth.id},other_participant_id.eq.${auth.id}`).order('created_at', { ascending: false })
      .then(({ data, error }) => { if (error) setToast(error.message); else setStakeholderCases(data || []); });
    if (accountRole === 'tenant') supabase.from('tenants').select('*').ilike('email', auth.email).order('created_at', { ascending: false }).limit(1).maybeSingle().then(async ({ data, error }) => {
      if (error) { setToast(error.message); return; }
      setTenantAccount(data || null);
      const { data: contacts, error: contactsError } = await supabase.rpc('list_tenant_complaint_recipients');
      if (contactsError) setToast(contactsError.message);
      else setTenantContacts((contacts || []).map((contact) => ({ ...contact, id: contact.user_id })));
    });
    refresh(); const timer = window.setInterval(refresh, 12000);
    return () => window.clearInterval(timer);
  }, [auth, accountRole]);

  async function registerLandlord(event) {
    event.preventDefault();
    if (!supabase) { setToast('Yemilaz Properties sign-up is temporarily unavailable. Please try again later.'); return; }
    setSigning(true);
    const form = new FormData(event.currentTarget);
    const accountRoleForSignup = form.get('account_role') || 'landlord';
    const inviteCode = String(form.get('invite_code') || '').trim().toLowerCase();
    if (accountRoleForSignup === 'landlord') {
      const { data: validInvite, error: inviteError } = await supabase.rpc('validate_landlord_invite', { p_invite_code: inviteCode });
      if (inviteError || !validInvite) {
        setSigning(false);
        setToast('That Yemilaz Properties access code is invalid, expired, or already used. Ask the platform administrator for a new code.');
        return;
      }
    }
    const { error } = await supabase.auth.signUp({
      email: form.get('email'), password: form.get('password'),
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}?auth=confirmed`,
        data: { account_role: accountRoleForSignup, stakeholder_kind: form.get('stakeholder_kind') || 'stakeholder', full_name: form.get('full_name'), phone: form.get('phone'), permanent_address: form.get('permanent_address'), business_name: form.get('business_name') || 'Yemilaz Properties', brand_template: form.get('brand_template') || 'jade', brand_logo: form.get('brand_logo') || 'horizon', invite_code: inviteCode },
      },
    });
    setSigning(false);
    if (error) setToast(/access code/i.test(error.message) ? 'That Yemilaz Properties access code is invalid, expired, or already used. Ask the platform administrator for a new code.' : /tenant record|matching staff invitation|email address/i.test(error.message) ? 'We could not match this signup to a landlord’s tenant or staff record. Open the latest invitation and use its email address.' : 'We could not create this Yemilaz Properties account. Check the details and try again.');
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
    const table = { Guarantors: 'guarantors', Caretakers: 'staff', Agents: 'staff', Lawyers: 'staff', Enquiries: 'property_enquiries', 'Property requests': 'property_wanted_requests', 'Viewing requests': 'property_viewing_requests', 'Viewing calendar': 'property_viewing_requests', 'Listing reports': 'property_listing_reports', Complaints: 'property_complaints', Maintenance: 'maintenance_requests' }[page];
    if (!table) { setRecords([]); return; }
    let request = supabase.from(table).select('*').order('created_at', { ascending: false });
    if (!['Complaints','Property requests'].includes(page)) request = request.eq('owner_id', auth.id);
    if (page === 'Caretakers') request = request.eq('role', 'caretaker');
    if (page === 'Agents') request = request.eq('role', 'agent');
    if (page === 'Lawyers') request = request.eq('role', 'lawyer');
    if (page === 'Complaints' && !isPlatformAdmin) request = request.eq('landlord_id', auth.id);
    request.then(({ data, error }) => { if (error) setToast(error.message); else setRecords((data || []).map((item) => ({ ...item, property_name: propertyRecords.find((property) => property.id === item.property_id)?.name || 'Property listing' }))); });
  }, [auth, page, propertyRecords, paymentRecords, isPlatformAdmin]);

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

  async function login(event, adminOnly = false) {
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
      if (adminError || isAdmin !== true) {
        await supabase.auth.signOut();
        setAuth(null); setIsPlatformAdmin(false); setAdminChecked(true);
        setToast('Access denied. This account is not an authorized platform administrator.');
      } else {
        setIsPlatformAdmin(true); setAdminChecked(true); setAuth(data.user); setAuthModal(false);
        setToast('Signed in to Yemilaz Properties administration.');
      }
    } else if (!error) { setAuth(data.user); setAuthModal(false); setToast('Signed in securely to the property portal.'); }
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
    if (!String(form.get('email') || '').trim() || !String(form.get('guarantor_email') || '').trim()) {
      setToast('Tenant and guarantor email addresses are required for individual PDF delivery.'); return;
    }
    if (!landlordProfile?.lawyer_email) { setToast('Add the lawyer’s email in Landlord profile before registering a tenant.'); return; }
    const hasSelectedCopyRecipient = [form.get('agent_id'), form.get('caretaker_id')].some((id) => staffRecords.some((person) => person.id === id && person.email));
    if (!hasSelectedCopyRecipient) { setToast('Select an agent or caretaker with an email address so they receive their own PDF copy.'); return; }
    if (propertyId && firstPayment <= 0) { setToast('Record a rent or deposit payment before allocating this property.'); return; }
    setSaving(true);
    const { data: tenant, error } = await supabase.from('tenants').insert({
      owner_id: auth.id, full_name: name, email: form.get('email') || null, phone: form.get('phone') || null,
      property_id: null, lease_start: leaseStart, lease_end: leaseEnd, rent_amount: amount,
      rent_frequency: form.get('rent_frequency'), deposit_amount: Number(form.get('deposit_amount') || 0),
      agent_id: form.get('agent_id') || null, caretaker_id: form.get('caretaker_id') || null,
      status: 'active', notes: form.get('notes') || null,
    }).select().single();
    if (error) { setSaving(false); setToast(error.message); return; }
    const { error: guarantorError } = await supabase.from('guarantors').insert({
      owner_id: auth.id, tenant_id: tenant.id, full_name: form.get('guarantor_name'),
      email: form.get('guarantor_email'), phone: form.get('guarantor_phone') || null,
      relationship: form.get('guarantor_relationship') || null, occupation: form.get('guarantor_occupation') || null,
      address: form.get('guarantor_address') || null,
    });
    if (guarantorError) { setSaving(false); setToast(`Tenant saved but guarantor details failed: ${guarantorError.message}`); setTenants((current) => [tenant, ...current]); return; }
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
    setTenants((current) => [{ ...tenant, property_id: propertyId }, ...current]);
    setSaving(false); setModal(false);
    await sendTenantPackets(tenant.id);
    await sendProfileInvitation('tenant', tenant.id);
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
      row = {
        tenant_id: tenant?.id || null, property_id: tenant?.property_id || null,
        description: form.get('description'), category: form.get('category'), amount: Number(form.get('amount')),
        due_date: form.get('due_date') || null, status,
        paid_at: status === 'paid' ? (form.get('paid_at') || new Date().toISOString().slice(0, 10)) : null,
      };
    } else if (page === 'Guarantors') {
      table = 'guarantors'; row = { full_name: form.get('full_name'), email: form.get('email') || null, phone: form.get('phone') || null, relationship: form.get('relationship') || null, address: form.get('address') || null, occupation: form.get('occupation') || null };
    } else {
      table = 'staff'; row = { full_name: form.get('full_name'), role: page === 'Caretakers' ? 'caretaker' : page === 'Lawyers' ? 'lawyer' : 'agent', email: form.get('email') || null, phone: form.get('phone') || null, notes: form.get('notes') || null };
    }
    setSaving(true);
    let { data, error } = await supabase.from(table).insert({ ...row, owner_id: auth.id }).select().single();
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
    if (page === 'Caretakers' || page === 'Agents' || page === 'Lawyers') {
      setToast('Record saved. Sending profile invitation…');
      if (data.email) await sendProfileInvitation(data.role, data.id);
      else setToast('Record saved. Add an email address to send a profile invitation.');
    } else setToast(page === 'Properties' ? (data.is_advertised ? 'Property saved and advertised on the dashboard.' : 'Property saved. You can advertise it from Properties.') : 'Record saved to your Yemilaz Properties workspace.');
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
  const displayedTenants = visibleTenants.filter((tenant) => `${tenant.name} ${tenant.property}`.toLowerCase().includes(query.toLowerCase()));
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
      const row = { tenant_id: tenant?.id || null, property_id: tenant?.property_id || editingPerson.property_id || null, description: form.get('description'), category: form.get('category'), amount: Number(form.get('amount')), due_date: form.get('due_date') || null, paid_at: status === 'paid' ? (form.get('paid_at') || new Date().toISOString().slice(0, 10)) : null, status, edited_at: new Date().toISOString(), edited_by: auth.id };
      setSaving(true);
      const { data, error } = await supabase.from('service_charges').update(row).eq('owner_id', auth.id).eq('id', editingPerson.id).select().single();
      setSaving(false);
      if (error) { setToast(error.message); return; }
      setPaymentRecords((current) => current.map((item) => item.id === data.id ? data : item));
      setEditingPerson(null); setToast('Transaction updated and saved.'); return;
    }
    const table = kind === 'tenant' ? 'tenants' : kind === 'guarantor' ? 'guarantors' : 'staff';
    const row = kind === 'tenant'
      ? { full_name: form.get('full_name'), email: form.get('email') || null, phone: form.get('phone') || null, rent_amount: Number(form.get('rent_amount') || 0), lease_start: form.get('lease_start') || null, lease_end: form.get('lease_end') || null, notes: form.get('notes') || null }
      : kind === 'guarantor'
        ? { full_name: form.get('full_name'), email: form.get('email') || null, phone: form.get('phone') || null, relationship: form.get('relationship') || null, occupation: form.get('occupation') || null, address: form.get('address') || null }
        : { full_name: form.get('full_name'), email: form.get('email') || null, phone: form.get('phone') || null, role: form.get('role') || editingPerson.role, notes: form.get('notes') || null };
    setSaving(true);
    const { data, error } = await supabase.from(table).update(row).eq('owner_id', auth.id).eq('id', editingPerson.id).select().single();
    setSaving(false);
    if (error) { setToast(error.message); return; }
    if (kind === 'tenant') setTenants((current) => current.map((item) => item.id === data.id ? { ...item, ...data } : item));
    else if (kind === 'staff') { setStaffRecords((current) => current.map((item) => item.id === data.id ? { ...item, ...data } : item)); setRecords((current) => current.map((item) => item.id === data.id ? { ...item, ...data } : item)); }
    else setRecords((current) => current.map((item) => item.id === data.id ? { ...item, ...data } : item));
    setEditingPerson(null); setToast('Contact details updated.');
  }

  async function voidTransaction(record) {
    if (!auth || !supabase || record.status === 'voided') return;
    const reason = window.prompt(`Why are you voiding “${record.description}”? This reason is kept in the transaction history.`);
    if (reason === null) return;
    if (!reason.trim()) { setToast('Enter a reason to void this transaction.'); return; }
    if (!window.confirm(`Void this transaction for ${currency(record.amount)}? It stays in your records and is excluded from payment totals.`)) return;
    const { data, error } = await supabase.from('service_charges').update({ status: 'voided', voided_at: new Date().toISOString(), voided_by: auth.id, void_reason: reason.trim() }).eq('owner_id', auth.id).eq('id', record.id).select().single();
    if (error) { setToast(error.message); return; }
    setPaymentRecords((current) => current.map((item) => item.id === data.id ? data : item));
    setToast('Transaction voided. Its history has been kept.');
  }

  async function deletePerson(record, kind) {
    const names = { tenant: 'tenant', guarantor: 'guarantor', staff: record.role === 'caretaker' ? 'caretaker' : record.role === 'lawyer' ? 'lawyer' : 'agent' };
    const label = names[kind];
    const warning = kind === 'tenant' ? ' This also removes linked payment and guarantor records.' : kind === 'staff' ? ' Tenant records will remain, but this person will be unassigned.' : '';
    if (!window.confirm(`Delete ${label} “${record.full_name}”?${warning}`)) return;
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

  const portal = new URLSearchParams(window.location.search).get('portal');
  if(mfaChallenge)return <MfaVerificationGate onVerify={async code=>{const {error}=await supabase.auth.mfa.verify({...mfaChallenge,code});if(error)return error.message;setMfaChallenge(null);return '';}} onSignOut={()=>supabase.auth.signOut()}/>;
  if (portal === 'admin' && auth && (!adminChecked || !isPlatformAdmin)) return <AdminAccessScreen checking={!adminChecked} onSignOut={() => supabase.auth.signOut()}/>;

  if (!auth) return <div className="brand-site theme-jade"><BrandWatermark logo="horizon"/>
    {portal === 'admin' || portal === 'account'
      ? <LoginPortal audience={portal} onSubmit={(event) => login(event, portal === 'admin')} onForgotPassword={requestPasswordReset} signing={signing} onRegister={(role) => { setAuthRegistrationRole(role); setAuthModal(true); }} onAdminSignIn={() => window.location.assign(`${window.location.pathname}?portal=admin`)} toast={toast} onClearToast={() => setToast('')}/>
      : showComplaintRoom ? <PublicComplaintRoom properties={dashboardAds} onBack={() => setShowComplaintRoom(false)} onSubmit={submitComplaint}/> : <PublicLanding properties={publicListings} onSignIn={() => { window.location.assign(`${window.location.pathname}?portal=account`); }} onAdminSignIn={() => { window.location.assign(`${window.location.pathname}?portal=admin`); }} onComplaint={() => setShowComplaintRoom(true)}/>}
    {authModal && <AuthDialog initialRole={authRegistrationRole} onSubmit={login} onSignUp={registerLandlord} onForgotPassword={requestPasswordReset} onClose={() => setAuthModal(false)} signing={signing}/>}
    {authNotice && <AuthNoticeDialog notice={authNotice} onClose={() => setAuthNotice(null)} onResend={resendConfirmation} onUpdatePassword={saveNewPassword} signing={signing}/>}
    {toast && <div className="toast"><Check size={16}/>{toast}<button onClick={() => setToast('')}><X size={15}/></button></div>}
  </div>;

  if (['agent', 'caretaker', 'lawyer'].includes(accountRole)) return <StaffPortal auth={auth} role={accountRole} staff={staffAccount} tenants={staffAssignments} properties={propertyRecords} cases={stakeholderCases} activeComplaint={activeComplaint} setActiveComplaint={setActiveComplaint} messages={complaintMessages} onSend={addComplaintMessage} onResolution={changeComplaintResolution} onSubmitComplaint={submitComplaint} notifications={notifications} onReadNotification={markNotificationRead} complaintUnreadCounts={complaintUnreadCounts} onOpenComplaint={(item) => { markComplaintNotificationsRead(item.id); setActiveComplaint(item); }} onSignOut={() => supabase.auth.signOut()} toast={toast} onClearToast={() => setToast('')}/>;
  if (['stakeholder', 'tenant'].includes(accountRole)) return <StakeholderPortal auth={auth} role={accountRole} tenant={tenantAccount} contacts={tenantContacts} cases={stakeholderCases} activeComplaint={activeComplaint} setActiveComplaint={setActiveComplaint} messages={complaintMessages} onSend={addComplaintMessage} onResolution={changeComplaintResolution} properties={propertyRecords} onSubmitComplaint={submitComplaint} notifications={notifications} onReadNotification={markNotificationRead} complaintUnreadCounts={complaintUnreadCounts} onOpenComplaint={(item) => { markComplaintNotificationsRead(item.id); setActiveComplaint(item); }} onSignOut={() => supabase.auth.signOut()} toast={toast} onClearToast={() => setToast('')} onDownloadDocuments={downloadTenantPortalDocuments} tenantDocsBusy={tenantDocsBusy}/>;

  return <>
    <div className={`app-shell theme-${landlordProfile?.brand_template || 'jade'}`}>
      <BrandWatermark logo={landlordProfile?.brand_logo || 'horizon'}/>
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="brand"><BrandLockup name={landlordProfile?.business_name || 'Yemilaz Properties'} logo={landlordProfile?.brand_logo || 'horizon'} className="workspace-brand"/><button className="mobile-close" onClick={() => setMenu(false)}><X size={19}/></button></div>
        <div className="workspace-pill"><div className="workspace-avatar">{initials(landlordProfile?.business_name || 'Y')}</div><span>{landlordProfile?.business_name || 'Landlord workspace'}</span><ChevronDown size={15}/></div>
        <div className="side-scroll">{[...nav, ...(isPlatformAdmin ? [{ title: 'Administration', links: [['Contact directory', Users], ['Landlord access', KeyRound], ['Listing verification', ShieldCheck]] }] : [])].map((group) => <div className="nav-group" key={group.title}><span className="nav-label">{group.title}</span>{group.links.map(([label, Icon]) => <button key={label} className={`nav-link ${page === label ? 'selected' : ''}`} onClick={() => { setPage(label); setMenu(false); }}><Icon size={18}/>{label}{label === 'Tenants' && auth && <span className="nav-count">{tenants.length}</span>}{label === 'Notifications' && notifications.some((notice) => !notice.read_at) && <span className="nav-count">{notifications.filter((notice) => !notice.read_at).length}</span>}</button>)}</div>)}</div>
        <div className="sidebar-bottom"><div className="upgrade-card"><Sparkles size={16}/><b>Property insights</b><p>See what’s happening across your portfolio.</p><button onClick={() => { setPage('Property insights'); setMenu(false); }}>Explore insights <ArrowRight size={14}/></button></div><div className="profile-row"><div className="profile-avatar">{auth ? initials(auth.email || 'YA') : 'YA'}</div><div><b>{auth?.email || 'Yemilaz Admin'}</b><small>{auth ? 'Property manager' : 'Preview workspace'}</small></div></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMenu(true)}><Menu size={19}/></button><div className="breadcrumb"><b>{landlordProfile?.business_name || 'Yemilaz Properties'}</b><span>/</span><b>{page}</b><small className="platform-context">Yemilaz Properties workspace</small></div><div className="top-actions"><button className="help-btn" onClick={() => setToast('How can we help? Email hello@yemilazproperties.com')}><CircleHelp size={17}/><span>Help centre</span></button><div className="top-divider"/>{auth ? <><button className="profile-avatar top-avatar" title={auth.email}>{initials(auth.email || 'YA')}</button><button className="top-logout" onClick={() => supabase.auth.signOut()}><LogOut size={15}/><span>Log out</span></button></> : <button className="sign-in" onClick={() => setAuthModal(true)}>Sign in</button>}</div></header>
        {['Audit history','Security & privacy','Property documents','Inspections','Email delivery','Property messages','Property notices','Tenant profile requests'].includes(page) ? <OperationsHub page={page} auth={auth} tenants={tenants} properties={propertyRecords} isAdmin={isPlatformAdmin}/> : page === 'Property insights' ? <PropertyInsights properties={propertyRecords} tenants={tenants} payments={paymentRecords} onNavigate={setPage} onExport={() => exportPortfolioCsv(propertyRecords, tenants, paymentRecords)}/> : page === 'Notifications' ? <NotificationsPage notices={notifications} onRead={markNotificationRead}/> : page === 'Rent schedule' ? <RentSchedulePage charges={paymentRecords} tenants={tenants} onNavigate={setPage}/> : page === 'Maintenance' ? <MaintenancePage records={records} properties={propertyRecords} tenants={tenants} staff={staffRecords} userId={auth?.id} onSave={async (row, invoice) => { const { data, error } = await supabase.from('maintenance_requests').insert(row).select().single(); if (error) { setToast(error.message); return false; } let saved=data; if(invoice instanceof File&&invoice.size){if(invoice.size>20*1024*1024){setToast('Invoice must be smaller than 20 MB. Request saved without the file.');}else{const path=`${auth.id}/${data.id}/${invoice.name.replace(/[^\w.-]/g,'_')}`;const {error:uploadError}=await supabase.storage.from('maintenance-invoices').upload(path,invoice,{contentType:invoice.type});if(uploadError)setToast(`Request saved, but invoice upload failed: ${uploadError.message}`);else{const updated=await supabase.from('maintenance_requests').update({invoice_path:path}).eq('id',data.id).select().single();if(!updated.error)saved=updated.data;}}}setRecords((current) => [saved, ...current]); setToast('Maintenance request recorded.'); return true; }} onUpdate={async (item, values) => { const { data, error } = await supabase.from('maintenance_requests').update(values).eq('id', item.id).eq('owner_id', auth.id).select().single(); if (error) setToast(error.message); else { setRecords((current) => current.map((row) => row.id === data.id ? data : row)); const note = values.resolution_notes?.trim() || `Request status updated to ${(values.status || item.status).replaceAll('_',' ')}.`; const updateResult = await supabase.from('maintenance_request_updates').insert({ owner_id: auth.id, request_id: item.id, tenant_id: item.tenant_id, author_id: auth.id, body: note }); if (updateResult.error) setToast(`Maintenance status saved, but tenant update could not be sent: ${updateResult.error.message}`); } }}/> : page === 'Documents & signatures' ? <TenancySignaturesPage tenants={tenants} profile={landlordProfile} auth={auth}/> : page === 'Viewing calendar' ? <ViewingCalendarPage requests={records} onUpdate={updateViewingStatus} properties={propertyRecords}/> : page === 'Overview' ? <>
          <section className="welcome-row"><div><div className="eyebrow">{new Date().toLocaleDateString('en-NG', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()} <span className="live-dot"/></div><h1>Good morning, {landlordProfile?.full_name?.split(' ')[0] || 'Landlord'} <span>✳</span></h1><p>Here’s what’s happening with your properties today.</p></div><button className="primary-button" onClick={() => { if (!auth) { setAuthModal(true); return; } setModal(true); }}><Plus size={17}/> Add a tenant</button></section>
          <section className="metric-grid"><Metric icon={Building2} label="Total properties" value={auth ? propertyRecords.length : '—'} note="Across your portfolio" color="lavender"/><Metric icon={Users} label="Active tenants" value={auth ? tenants.length : '—'} note="Lease records on file" color="mint"/><Metric icon={Wallet} label="Rent collected" value="—" note="Track recorded payments" color="peach"/><Metric icon={Clock3} label="Expiring soon" value="—" note="Lease dates on file" color="blue"/></section>
          <section className="content-grid"><div className="panel tenants-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR PORTFOLIO</span><h2>Recent tenants {auth && <span className="count-badge">{tenants.length}</span>}</h2></div><button className="text-button" onClick={() => setPage('Tenants')}>View all <ArrowRight size={15}/></button></div><div className="table-tools"><label className="search-box"><Search size={16}/><input placeholder="Search tenants..." value={query} onChange={(event) => setQuery(event.target.value)}/></label><button className="filter-button" onClick={() => setFilter(filter === 'All properties' ? 'Active only' : 'All properties')}><SlidersHorizontal size={15}/>{filter}<ChevronDown size={13}/></button></div><div className="table-wrap"><table><thead><tr><th>TENANT</th><th>PROPERTY</th><th>LEASE START</th><th>STATUS</th><th>ANNUAL RENT</th></tr></thead><tbody>{(auth ? displayedTenants : []).slice(0, 5).map((tenant, index) => <tr key={tenant.id}><td><div className="tenant-cell"><div className={`tenant-avatar avatar-${index % 4}`}>{tenant.initials}</div><b>{tenant.name}</b></div></td><td>{tenant.property}</td><td>{tenant.date}</td><td><span className={`status ${tenant.displayStatus === 'Active' ? 'active' : 'renewal'}`}><i/>{tenant.displayStatus}</span></td><td className="rent-cell">{tenant.rent}</td></tr>)}</tbody></table>{auth && displayedTenants.length === 0 && <div className="empty-state">No tenant records yet.</div>}{!auth && <div className="empty-state">Sign in to view your tenant records.</div>}</div><div className="panel-footer"><span>{auth ? `Showing ${Math.min(displayedTenants.length, 5)} of ${tenants.length} tenants` : 'Your tenant records appear after sign in'}</span><button onClick={() => setPage('Tenants')}>Manage tenants <ArrowUpRight size={14}/></button></div></div>
            <div className="right-column"><div className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow">THE LATEST</span><h2>Portfolio reminders</h2></div></div><div className="activity-list"><Activity icon={Check} tone="green" title="Properties ready to advertise" text={`${dashboardAds.length} available properties featured`} time="Dashboard listings"/><Activity icon={FileText} tone="purple" title="Payment records" text={`${paymentRecords.length} rent and service records`} time="Payments & charges"/><Activity icon={CalendarDays} tone="orange" title="Tenant allocations" text={`${tenants.filter((tenant) => tenant.property_id).length} properties allocated`} time="Tenant directory"/></div><button className="activity-link" onClick={() => setPage('Payments & charges')}>View payments <ArrowRight size={14}/></button></div><div className="reminder-card"><div className="reminder-icon"><Building2 size={17}/></div><div><span className="eyebrow">AVAILABLE LISTINGS</span><h3>{availableProperties.length} unallocated properties</h3><p>Advertise an available property from Properties.</p></div><ArrowUpRight className="reminder-arrow" size={17}/></div></div>
          </section>
          <section className="listings-section"><div className="listings-heading"><div><span className="eyebrow">AVAILABLE TO RENT OR BUY</span><h2>Dashboard advertisements</h2></div><button className="text-button" onClick={() => setPage('Properties')}>Manage properties <ArrowRight size={15}/></button></div>{dashboardAds.length ? <div className="property-grid">{dashboardAds.map((property) => <PropertyCard key={property.id} property={property}/>)}</div> : <div className="empty-management"><span><Building2 size={23}/></span><h3>No advertised properties yet</h3><p>Add an available property, then choose “Advertise” in Properties to show it here.</p><button className="secondary-button" onClick={() => { if (!auth) { setAuthModal(true); return; } setPage('Properties'); setModal(true); }}><Plus size={15}/> Add a property</button></div>}</section>
        </> : page === 'Landlord profile' ? <LandlordProfilePage profile={landlordProfile} email={auth.email} onSave={saveLandlordProfile} saving={saving}/> : page === 'Contact directory' && isPlatformAdmin ? <PlatformContactDirectory client={supabase} onSetStatus={setAccountStatus}/> : page === 'Landlord access' && isPlatformAdmin ? <PlatformAccessPage client={supabase}/> : page === 'Listing verification' && isPlatformAdmin ? <ListingVerificationPage client={supabase}/> : page === 'Complaints' ? showComplaintRoom ? <PublicComplaintRoom properties={propertyRecords} tenants={tenants} roleDefault="Landlord" onBack={() => setShowComplaintRoom(false)} onSubmit={submitComplaint}/> : <ComplaintInbox records={records} activeComplaint={activeComplaint} setActiveComplaint={setActiveComplaint} messages={complaintMessages} onSend={addComplaintMessage} onResolution={changeComplaintResolution} currentUserId={auth.id} onNew={() => setShowComplaintRoom(true)} unreadCounts={complaintUnreadCounts} onOpenComplaint={(item) => { markComplaintNotificationsRead(item.id); setActiveComplaint(item); }}/> : <ManagementPage
          page={page} tenants={visibleTenants} records={page === 'Properties' ? propertyRecords : page === 'Payments & charges' ? visiblePayments : records}
          query={query} setQuery={setQuery} openModal={() => { if (!auth) { setAuthModal(true); return; } setModal(true); }}
          onDeleteProperty={deleteProperty} onToggleAdvertisement={toggleAdvertisement}
          onEditPerson={(record, kind) => setEditingPerson({ ...record, kind })} onDeletePerson={deletePerson}
          onRequestVerification={requestListingVerification}
          onUpdateViewingStatus={updateViewingStatus}
          onUpdateListingReport={updateListingReport}
          onUpdatePropertyStatus={updatePropertyStatus}
          onAllocate={(tenant) => { if (!auth) { setAuthModal(true); return; } setAllocationTenant(tenant); }}
          onRecordPayment={() => setPage('Payments & charges')} onEditTransaction={(record) => setEditingPerson({ ...record, kind: 'charge' })} onVoidTransaction={voidTransaction} onSendPacket={sendTenantPackets} sendingTenant={sendingTenant}
          onDownloadPdfs={downloadTenantPdfs} downloadingTenant={downloadingTenant} hasPaid={paidForTenant}
        />}
        <footer className="site-footer"><span>© {new Date().getFullYear()} {landlordProfile?.business_name || 'Yemilaz Properties'}</span><span>A private property workspace on Yemilaz Properties.</span></footer>
      </main>
    </div>

    {modal && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(false)}><form className="modal" onSubmit={page === 'Tenants' || page === 'Overview' ? addTenant : saveOtherRecord}>
      <div className="modal-heading"><div><span className="eyebrow">PORTFOLIO MANAGEMENT</span><h2>{page === 'Tenants' || page === 'Overview' ? 'Register tenant' : `Add ${page === 'Payments & charges' ? 'payment or charge' : page === 'Properties' ? 'property' : page === 'Guarantors' ? 'guarantor' : page.slice(0, -1).toLowerCase()} record`}</h2><p>Save the details to your private Yemilaz Properties workspace.</p></div><button type="button" className="icon-button" onClick={() => setModal(false)}><X size={19}/></button></div>
      {(page === 'Tenants' || page === 'Overview') ? <>
        <label>Tenant’s full name<input required name="full_name" placeholder="e.g. Amara Okafor"/></label>
        <div className="form-row"><label>Tenant email<input required name="email" type="email"/></label><label>Tenant phone<input name="phone"/></label></div>
        <div className="form-row"><label>Lease start<input required name="lease_start" type="date"/></label><label>Lease end<input required name="lease_end" type="date"/></label></div>
        <div className="form-row"><label>Rent amount (₦)<input required name="rent_amount" type="number" min="0" step="0.01"/></label><label>Rent frequency<select name="rent_frequency"><option value="yearly">Yearly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></label></div>
        <div className="form-row"><label>First payment (₦)<input name="initial_payment" type="number" min="0" step="0.01" defaultValue="0"/><small>Enter a paid rent/deposit amount before allocating a property.</small></label><label>Payment type<select name="payment_type"><option value="rent">Rent</option><option value="deposit">Deposit</option></select></label></div>
        <div className="form-row"><label>Payment date<input name="payment_date" type="date"/></label><label>Allocate available property<select name="property_id" defaultValue=""><option value="">Leave unallocated</option>{availableProperties.map((property) => <option key={property.id} value={property.id}>{property.name} · {currency(property.price)}</option>)}</select><small>Allocation requires a first payment above zero.</small></label></div>
        <div className="form-section-title">Guarantor details · required for their copy</div>
        <label>Guarantor’s full name<input required name="guarantor_name"/></label>
        <div className="form-row"><label>Guarantor email<input required name="guarantor_email" type="email"/></label><label>Guarantor phone<input name="guarantor_phone"/></label></div>
        <div className="form-row"><label>Relationship<input name="guarantor_relationship"/></label><label>Occupation<input name="guarantor_occupation"/></label></div>
        <label>Guarantor address<input name="guarantor_address"/></label>
        <div className="form-section-title">People to receive their own copy</div>
        <p className="setup-note">Add the lawyer email in Landlord profile, then select at least one agent or caretaker with an email below.</p>
        <div className="form-row"><label>Agent<select name="agent_id" defaultValue=""><option value="">No agent</option>{staffRecords.filter((person) => person.role === 'agent' && person.email).map((person) => <option key={person.id} value={person.id}>{person.full_name} · {person.email}</option>)}</select></label><label>Caretaker<select name="caretaker_id" defaultValue=""><option value="">No caretaker</option>{staffRecords.filter((person) => person.role === 'caretaker' && person.email).map((person) => <option key={person.id} value={person.id}>{person.full_name} · {person.email}</option>)}</select></label></div>
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
        <label>Payment / charge description<input required name="description" placeholder="e.g. January rent or generator servicing"/></label>
        <div className="form-row"><label>Tenant<select name="tenant_id" defaultValue=""><option value="">Property / general charge</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.full_name}</option>)}</select></label><label>Category<select name="category"><option value="rent">Rent</option><option value="deposit">Deposit</option><option value="utilities">Utilities</option><option value="maintenance">Maintenance</option><option value="security">Security</option><option value="cleaning">Cleaning</option><option value="other">Other</option></select></label></div>
        <div className="form-row"><label>Amount (₦)<input required name="amount" type="number" min="0" step="0.01"/></label><label>Status<select name="status"><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="waived">Waived</option></select></label></div>
        <div className="form-row"><label>Due date<input name="due_date" type="date"/></label><label>Paid date<input name="paid_at" type="date"/></label></div><label>Payment evidence <small>(optional, private; up to 10 MB)</small><input name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"/></label>
      </> : page === 'Guarantors' ? <>
        <label>Guarantor’s full name<input required name="full_name"/></label><div className="form-row"><label>Phone<input name="phone"/></label><label>Email<input name="email" type="email"/></label></div><div className="form-row"><label>Relationship to tenant<input name="relationship"/></label><label>Occupation<input name="occupation"/></label></div><label>Address<input name="address"/></label>
      </> : <>
        <label>Full name<input required name="full_name"/></label><div className="form-row"><label>Phone<input name="phone"/></label><label>Email<input name="email" type="email"/></label></div><label>Notes<input name="notes" placeholder="Assigned properties or details"/></label>
      </>}
      <div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancel</button><button className="primary-button" disabled={saving}><Plus size={16}/>{saving ? 'Saving…' : 'Save record'}</button></div>
    </form></div>}

    {editingPerson?.kind === 'charge' && <TransactionEditModal transaction={editingPerson} tenants={tenants} saving={saving} onSave={savePersonEdit} onClose={() => setEditingPerson(null)}/>}
    {editingPerson && editingPerson.kind !== 'charge' && <EditPersonModal person={editingPerson} saving={saving} onSave={savePersonEdit} onClose={() => setEditingPerson(null)}/>}

    {allocationTenant && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setAllocationTenant(null)}><form className="modal" onSubmit={allocateProperty}><div className="modal-heading"><div><span className="eyebrow">PROPERTY ALLOCATION</span><h2>{allocationTenant.property_id ? 'Change tenant property' : 'Allocate a property'}</h2><p>{allocationTenant.full_name} · allocation is available after a rent or deposit payment is recorded.</p></div><button type="button" className="icon-button" onClick={() => setAllocationTenant(null)}><X size={19}/></button></div><label>Available property<select required name="property_id" defaultValue=""><option value="">Select a property</option>{availableProperties.map((property) => <option key={property.id} value={property.id}>{property.name} · {currency(property.price)}</option>)}</select></label>{!paidForTenant(allocationTenant.id) && <p className="setup-note">Record a paid rent or deposit under Payments & charges before allocating a property.</p>}<div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setAllocationTenant(null)}>Cancel</button><button className="primary-button" disabled={saving || !paidForTenant(allocationTenant.id)}>Allocate property</button></div></form></div>}

    {authNotice && <AuthNoticeDialog notice={authNotice} onClose={() => setAuthNotice(null)} onResend={resendConfirmation} onUpdatePassword={saveNewPassword} signing={signing}/>}
    {toast && <div className="toast"><Check size={16}/>{toast}<button onClick={() => setToast('')}><X size={15}/></button></div>}
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

function PublicLanding({ properties, onSignIn, onAdminSignIn, onComplaint }) {
  const [policyPage, setPolicyPage] = useState(() => window.location.hash === '#about-us' ? 'about-us' : window.location.hash.startsWith('#policy=') ? decodeURIComponent(window.location.hash.slice(8)) : '');
  useEffect(() => { const sync = () => setPolicyPage(window.location.hash === '#about-us' ? 'about-us' : window.location.hash.startsWith('#policy=') ? decodeURIComponent(window.location.hash.slice(8)) : ''); window.addEventListener('hashchange', sync); window.addEventListener('popstate', sync); return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('popstate', sync); }; }, []);
  useEffect(() => { const policy = PUBLIC_POLICIES.find((item) => item.id === policyPage); document.title = policy ? `${policy.title} | Yemilaz Properties` : policyPage === 'about-us' ? 'About us | Yemilaz Properties' : 'Yemilaz Properties | Find your place'; }, [policyPage]);
  function openPolicy(id) { window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#policy=${id}`); setPolicyPage(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function openAbout() { window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#about-us`); setPolicyPage('about-us'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function closePolicy() { window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#support`); setPolicyPage(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  const [filters, setFilters] = useState({ country: '', state: '', city: '', listing_type: '', property_type: '', min: '', max: '' });
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
    const title = selected ? `${selected.name} in ${selected.city || selected.state || selected.country} | Yemilaz Properties` : activePolicy ? `${activePolicy.title} | Yemilaz Properties` : policyPage === 'about-us' ? 'About us | Yemilaz Properties' : 'Yemilaz Properties | Find your place';
    document.title = title;
    let description = document.querySelector('meta[name="description"]');
    if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.append(description); }
    description.content = selected?.description || 'Browse thoughtfully selected homes to rent or buy across Nigeria and beyond with Yemilaz Properties.';
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
    const table = leadMode === 'viewing' ? 'property_viewing_requests' : leadMode === 'report' ? 'property_listing_reports' : 'property_enquiries';
    const row = leadMode === 'report'
      ? { property_id: selected.id, owner_id: selected.owner_id, reporter_email: form.get('email') || null, reason: form.get('reason'), details: form.get('details') || null }
      : leadMode === 'viewing'
        ? { property_id: selected.id, owner_id: selected.owner_id, name: form.get('name'), email: form.get('email'), phone: form.get('phone') || null, requested_at: new Date(form.get('requested_at')).toISOString(), note: form.get('message') || null }
        : { property_id: selected.id, owner_id: selected.owner_id, name: form.get('name'), email: form.get('email'), phone: form.get('phone') || null, message: form.get('message') };
    const { error } = await supabase.from(table).insert(row);
    if (error) { setLeadMessage('We could not submit your request. Please try again later.'); return; }
    setLeadMessage(leadMode === 'report' ? 'Thank you. Our team will review this report.' : 'Your request was added to the property manager’s private inbox.');
    setLeadMode('');
  }
  return <div className="public-site">
    <header className="public-nav"><a className="public-brand" href="#top" onClick={policyPage ? (event) => { event.preventDefault(); closePolicy(); } : undefined} aria-label="Yemilaz Properties home"><BrandLockup name="Yemilaz Properties" logo="horizon"/></a><nav aria-label="Main navigation">{policyPage ? <><button className="public-text-button" onClick={closePolicy}>Back to website</button><a href="#support" onClick={(event) => { event.preventDefault(); closePolicy(); }}>Help &amp; policies</a></> : <><a href="#homes">Find a home</a><a href="#about" onClick={(event) => { event.preventDefault(); openAbout(); }}>About us</a><a href="#support">Help &amp; policies</a><button className="public-text-button" onClick={onComplaint}>Complaint room</button></>}<button className="sign-in" onClick={onSignIn}><KeyRound size={15}/> Property portal</button></nav></header>
    <main id="top">
      {policyPage ? <>{policyPage === 'about-us' ? <section className="public-policy-page about-page"><button className="policy-back-link" onClick={closePolicy}><ArrowLeft size={15}/> Back to website</button><article><span className="public-eyebrow">PROPERTY, MADE PERSONAL</span><h1>About Yemilaz Properties</h1><p className="policy-intro">We help people find and manage property with clearer information, thoughtful service and practical tools for the people involved.</p><section><h2>What we do</h2><p>Yemilaz Properties is a property platform for discovering and managing a broad range of spaces, including homes, shops, offices, warehouses, land and farms offered for rent, lease or sale. The website brings property seekers and advertisers together and gives registered property teams a workspace for day-to-day coordination.</p></section><section><h2>How we work</h2><p>We aim to make property information easier to review and conversations easier to follow. Visitors can explore listings, send enquiries, request viewings or report a concern. Registered landlords and their authorized teams can manage property records, communicate with linked parties, handle maintenance and complaints, and share relevant documents through their accounts.</p></section><section><h2>Built around the people involved</h2><p>Property matters often involve more than an owner and a tenant. Our platform is designed to support landlords, tenants, agents, caretakers and other authorized participants, with access shaped by their role and property relationship. Private account information and case conversations are intended for the relevant participants and authorized administrators.</p></section><section><h2>Our approach</h2><p>We value clear records, respectful communication, responsible handling of personal information and careful verification before important property decisions. Listings and arrangements are provided by the relevant advertiser or property parties, so visitors should independently confirm property details, authority, costs and written terms before committing or paying.</p></section><section><h2>Get in touch</h2><p>For website support or general questions, email <a href="mailto:hello@yemilazproperties.com">hello@yemilazproperties.com</a>. For a property-specific issue, use the enquiry or complaint options so it can be directed to the appropriate people.</p></section></article></section> : PUBLIC_POLICIES.find((policy) => policy.id === policyPage) ? <section className="public-policy-page"><button className="policy-back-link" onClick={closePolicy}><ArrowLeft size={15}/> Back to Help, policies &amp; support</button>{PUBLIC_POLICIES.filter((policy) => policy.id === policyPage).map((policy) => <article key={policy.id}><span className="public-eyebrow">YEMILAZ PROPERTIES · WEBSITE INFORMATION</span><h1>{policy.title}</h1><p className="policy-intro">{policy.summary}</p>{policy.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}{policy.id === 'privacy' && <p className="policy-contact">Privacy questions or requests: <a href="mailto:hello@yemilazproperties.com">hello@yemilazproperties.com</a></p>}</article>)}<p className="support-legal-note">These general website guidelines are provided for information and do not replace the terms of a specific property agreement or advice from a qualified professional. Please have the policies reviewed for your business and local requirements before relying on them as formal legal documents.</p></section> : <section className="public-policy-page"><h1>Policy page not found</h1><p>Choose a policy from Help, policies &amp; support.</p><button className="secondary-button" onClick={closePolicy}>Back to Help, policies &amp; support</button></section>}</> : <>
      <section className="public-hero"><div className="public-hero-copy"><span className="public-eyebrow"><i/> PROPERTY, LAND &amp; SPACES IN NIGERIA &amp; BEYOND</span><h1>Find the right<br/><em>place to begin.</em></h1><p>Homes, shops, offices, warehouses, land and farms for rent or sale, with dependable property care.</p><div className="public-hero-actions"><a className="primary-button" href="#homes">Explore properties <ArrowRight size={16}/></a><button className="public-text-button" onClick={() => { setWantedOpen(true); setWantedMessage(''); }}>Can’t find it? Request a property</button><button className="public-text-button" onClick={onSignIn}>Landlord, tenant or staff? Sign in</button></div><div className="public-trust"><span><Check size={14}/> Properties for living and business</span><span><Check size={14}/> Rent and sale listings</span></div></div><div className="public-hero-photo"><img src="/lagos-home.png" alt="A contemporary property in Lagos"/><div className="hero-photo-kicker"><span className="hero-photo-kicker-icon"><Building2 size={17}/></span><span><b>Space for every next step</b><small>Homes, workspaces and land</small></span><span className="hero-photo-kicker-arrow"><ArrowUpRight size={16}/></span></div><div className="hero-photo-note"><span className="live-dot"/> YEMILAZ PROPERTIES <b>Property opportunities, thoughtfully managed.</b></div></div></section>
      <section className="public-listings" id="homes"><div className="public-section-heading"><div><span className="public-eyebrow">THE CURRENT COLLECTION</span><h2>Find a space that fits your plans.</h2><p>Browse homes, commercial spaces, land and farms by location, budget and property type. Reserved, rented and sold listings are clearly marked. Confirm fees and terms with the listing manager before any commitment.</p></div><span className="public-count">{filtered.length} advertised {filtered.length === 1 ? 'listing' : 'listings'}</span></div>
        <div className="listing-filters" role="search" aria-label="Filter property listings">{[['country','Country',countries],['state','State',states],['city','City',cities],['listing_type','Rent or sale',['rent','sale']],['property_type','Property type',[...new Set(properties.map((item) => item.property_type).filter(Boolean))]]].map(([key,label,options]) => <label key={key}>{label}<select aria-label={label} value={filters[key]} onChange={(event) => setFilters((value) => ({ ...value, [key]: event.target.value }))}><option value="">All</option>{options.map((option) => <option key={option} value={option}>{key === 'listing_type' ? option === 'rent' ? 'For rent' : 'For sale' : option}</option>)}</select></label>)}<label>Min price<input aria-label="Minimum price" inputMode="numeric" type="number" min="0" value={filters.min} onChange={(event) => setFilters((value) => ({ ...value, min: event.target.value }))}/></label><label>Max price<input aria-label="Maximum price" inputMode="numeric" type="number" min="0" value={filters.max} onChange={(event) => setFilters((value) => ({ ...value, max: event.target.value }))}/></label><button className="secondary-button" onClick={() => setFilters({ country:'',state:'',city:'',listing_type:'',property_type:'',min:'',max:'' })}>Clear filters</button></div>
        <div className="listing-view-tools"><span>{favourites.length} saved {favourites.length === 1 ? 'property' : 'properties'}</span><button className="secondary-button" onClick={() => setSavedOnly((value) => !value)}><Heart size={15}/>{savedOnly ? 'Show all properties' : 'Show saved properties'}</button><button className="secondary-button" onClick={() => { const searches=[{filters,name:`${filters.city||filters.state||filters.country||'All locations'} · ${filters.listing_type||'rent or sale'}`,savedAt:new Date().toISOString()},...savedSearches].slice(0,10); localStorage.setItem('yemilaz-saved-searches',JSON.stringify(searches)); setSavedSearches(searches); }}><Check size={15}/> Save this search</button>{savedSearches.length>0&&<select aria-label="Load a saved search" defaultValue="" onChange={(event)=>{const search=savedSearches[Number(event.target.value)];if(search){setFilters(search.filters);setSavedOnly(false);}}}><option value="">Load saved search ({savedSearches.length})</option>{savedSearches.map((search,index)=><option key={`${search.savedAt}-${index}`} value={index}>{search.name}</option>)}</select>}<button className="secondary-button" onClick={() => setMapMode((value) => !value)}><MapPin size={15}/>{mapMode ? 'Hide map' : 'Browse map'}</button></div>
        {mapMode && mapQuery && <iframe className="listing-map" title="Map of matching property locations" loading="lazy" src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}/>}
        {visibleListings.length ? <div className="property-grid">{visibleListings.map((property) => <PropertyCard key={property.id} property={property} onOpen={() => openProperty(property)} isFavourite={favourites.includes(property.id)} onFavourite={() => toggleFavourite(property.id)}/>)}</div> : <div className="public-empty"><Building2 size={25}/><h3>{savedOnly ? 'No saved properties match.' : 'No properties match those filters.'}</h3><p>{savedOnly ? 'Save a listing with the heart button to build your shortlist.' : 'Try broadening your search or clear the filters.'}</p></div>}</section>
      <section className="public-about" id="about"><div><span className="public-eyebrow">PROPERTY, MADE PERSONAL</span><h2>Good spaces.<br/>Thoughtful care.</h2></div><p>Yemilaz Properties brings landlords, tenants and trusted property professionals together with clarity, care and local expertise.</p><button className="about-signin" onClick={openAbout}>Read more about us <ArrowRight size={15}/></button></section>
      <section className="public-support" id="support"><span className="public-eyebrow">CLEAR INFORMATION BEFORE YOU COMMIT</span><h2>Help, policies &amp; support</h2><p className="support-intro">Please read these guidelines before enquiring, arranging a viewing, sharing personal information or making a property decision. Listing and tenancy arrangements are made with the relevant property owner or manager.</p><div className="support-grid">{PUBLIC_POLICIES.map((policy) => <article key={policy.id}><h3>{policy.title}</h3><p>{policy.summary}</p><button className="policy-more-link" onClick={() => openPolicy(policy.id)}>Read more <ArrowRight size={14}/></button></article>)}<article><h3>Contact support</h3><p>For questions about a listing, contact its advertiser through the enquiry option. For website or privacy support, email hello@yemilazproperties.com or use the complaint room.</p><button className="inline-link" onClick={onComplaint}>Open complaint room</button></article></div><details className="support-faq"><summary>Frequently asked questions · 10 answers</summary>
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
    <footer className="public-footer"><a className="public-brand" href="#top"><BrandLockup name="Yemilaz Properties" logo="horizon"/></a><button className="public-text-button" onClick={onComplaint}>Lodge a property complaint</button><a href="mailto:hello@yemilazproperties.com">Contact support</a><button className="public-text-button" onClick={onAdminSignIn}>Platform administration</button><span>© {new Date().getFullYear()} Yemilaz Properties</span></footer>
    {wantedOpen && <WantedRequestDialog message={wantedMessage} setMessage={setWantedMessage} onClose={() => setWantedOpen(false)}/>}
    {selected && <div className="modal-backdrop listing-detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && (closeProperty(), setLeadMode(''))}><section className="modal listing-detail" role="dialog" aria-modal="true" aria-labelledby="listing-detail-title"><div className="modal-heading"><div><span className="eyebrow">{selected.property_type || 'PROPERTY'} · {selected.listing_type === 'sale' ? 'FOR SALE' : 'FOR RENT / LEASE'}</span><h2 id="listing-detail-title">{selected.name}</h2><p><MapPin size={13}/>{[selected.address,selected.city,selected.state,selected.country].filter(Boolean).join(', ')}</p></div><button className="icon-button" aria-label="Close property details" onClick={closeProperty}><X size={18}/></button></div><PropertyGallery property={selected}/><div className="detail-price"><b>{currency(selected.price)}</b><span>{selected.listing_type === 'rent' ? `/ ${({year:'year',month:'month',week:'week',day:'day'}[selected.price_period] || 'year')}` : ' asking price'}</span></div><p className="fee-note">Before paying, confirm all agency fees, deposits, service charges, payment dates, and refund terms directly with the listing manager.</p><div className="property-features">{selected.property_size && <span>{selected.property_size}</span>}{selected.intended_use && <span>Suitable for {selected.intended_use}</span>}{/^(house|apartment|duplex|room|short-stay)/i.test(selected.property_type || '') && <><span><BedDouble size={15}/>{selected.bedrooms || 0} beds</span><span><Home size={14}/>{selected.bathrooms || 0} baths</span></>}<span>{selected.status === 'occupied' ? (selected.listing_type === 'sale' ? 'Unavailable' : 'Rented') : selected.status === 'reserved' || selected.status === 'under_offer' ? 'Reserved' : selected.status === 'sold' ? 'Sold' : 'Available'}</span></div><p className="listing-description">{selected.description || 'Contact the listing manager for more details.'}</p>{(selected.amenities || []).length > 0 && <div><b>Features and facilities</b><div className="amenity-list">{selected.amenities.map((amenity) => <span key={amenity}>{amenity}</span>)}</div></div>}<div className="listing-actions">{selected.status === 'available' ? <><button className="primary-button" onClick={() => setLeadMode('enquiry')}>Enquire</button><button className="secondary-button" onClick={() => setLeadMode('viewing')}>Request a viewing</button></> : <b className="listing-status-note">This listing is not currently available. Contact the listing manager about its status.</b>}<button className="text-button" onClick={() => setLeadMode('report')}>Report this listing</button><button className="secondary-button" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy listing link</button><a className="secondary-button" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${encodeURIComponent([selected.address,selected.city,selected.state,selected.country].filter(Boolean).join(', '))}`}><MapPin size={14}/> Map</a></div>
      {leadMessage && <p className="lead-feedback" role="status">{leadMessage}</p>}{leadMode && <form className="listing-lead-form" onSubmit={submitListingLead}><h3>{leadMode === 'report' ? 'Report a listing' : leadMode === 'viewing' ? 'Request a viewing' : 'Send an enquiry'}</h3>{leadMode !== 'report' && <div className="form-row"><label>Your name<input required name="name" autoComplete="name"/></label><label>Email<input required name="email" type="email" autoComplete="email"/></label></div>}{leadMode === 'report' && <><label>Your email (optional)<input name="email" type="email"/></label><label>Reason<select required name="reason"><option value="">Choose a reason</option><option>Incorrect information</option><option>Suspicious or fraudulent</option><option>Already rented or sold</option><option>Inappropriate content</option><option>Other</option></select></label></>}{leadMode !== 'report' && <label>Phone <small>Optional</small><input name="phone" type="tel" autoComplete="tel"/></label>}{leadMode === 'viewing' && <label>Preferred date and time<input required name="requested_at" type="datetime-local" min={new Date().toISOString().slice(0,16)}/></label>}<label>{leadMode === 'report' ? 'Details (optional)' : leadMode === 'viewing' ? 'Note (optional)' : 'Message'}<textarea name={leadMode === 'report' ? 'details' : 'message'} required={leadMode === 'enquiry'} rows="3" maxLength="2000"/></label><button className="primary-button" disabled={!supabase}>{supabase ? 'Send request' : 'Service unavailable'}</button></form>}</section></div>}
  </div>;
}

function PublicComplaintRoom({ properties, tenants = [], recipients = [], roleDefault = '', onBack, onSubmit }) {
  const [role, setRole] = useState(roleDefault);
  const [propertyId, setPropertyId] = useState('');
  return <div className="public-site complaint-site"><header className="public-nav"><button className="public-brand complaint-back" onClick={onBack}><BrandLockup name="Yemilaz Properties" logo="horizon"/></button><button className="sign-in" onClick={onBack}>Back to homes</button></header><main className="complaint-main"><div className="complaint-intro"><span className="public-eyebrow">A SHARED SPACE FOR PROPERTY CONCERNS</span><h1>Complaint room</h1><p>Landlords and tenants can open a case and continue the conversation in their private account. Create or sign in to a Tenant or complainant account before lodging if you need ongoing chat and two-party resolution approval.</p></div><form className="panel complaint-form" onSubmit={onSubmit}><div className="form-row"><label>Your full name<input required name="name" autoComplete="name"/></label><label>Email address<input required name="email" type="email" autoComplete="email"/></label></div><div className="form-row"><label>Phone number <small>(optional)</small><input name="phone" type="tel" autoComplete="tel"/></label><label>Your role<select required name="role" value={role} onChange={(event) => setRole(event.target.value)}><option value="">Select your connection</option><option>Landlord</option><option>Tenant</option><option>Agent</option><option>Caretaker</option><option>Buyer or seller</option><option>Other</option></select></label></div><label>Link an advertised property<select name="property_id" value={propertyId} required={role === 'Landlord' || role === 'Tenant'} onChange={(event) => setPropertyId(event.target.value)}><option value="">Not listed / enter address below</option>{properties.map((item) => <option key={item.id} value={item.id}>{item.name} · {[item.city,item.state].filter(Boolean).join(', ')}</option>)}</select></label>{role === 'Tenant' && (roleDefault === 'Tenant' || recipients.length > 0) && <label>Send complaint to<select name="recipient_email" required defaultValue=""><option value="">Choose landlord, assigned agent or caretaker</option>{recipients.filter((contact) => ['landlord','agent','caretaker'].includes(contact.role) && contact.email).map((contact) => <option key={contact.user_id || contact.id} value={contact.email}>{contact.full_name} · {contact.role}</option>)}</select><small>The recipient and platform administrators can access this conversation. If the landlord has disabled direct complaints, only assigned agents and caretakers are listed.</small>{roleDefault === 'Tenant' && recipients.length === 0 && <small role="alert">No eligible recipient is linked yet. Ask your landlord to enable direct complaints or assign an agent/caretaker who has a website account.</small>}</label>}{role === 'Landlord' && tenants.length > 0 && <label>Tenant involved<select name="other_participant_email" required={role === 'Landlord'} defaultValue=""><option value="">Choose a tenant</option>{tenants.filter((tenant) => tenant.email && (!propertyId || tenant.property_id === propertyId)).map((tenant) => <option key={tenant.id} value={tenant.email}>{tenant.full_name} · {tenant.email}</option>)}</select><small>They can join the conversation after creating a complaint account with this email address.</small></label>}<label>Property address or name<input required name="property" placeholder="Address, building or listing name"/></label><div className="form-row"><label>Issue type<select required name="category" defaultValue=""><option value="" disabled>Select a category</option><option>Repairs and maintenance</option><option>Rent or payment</option><option>Property access</option><option>Conduct or safety</option><option>Agreement or documentation</option><option>Other</option></select></label><label>Complaint subject<input required name="subject" maxLength="120"/></label></div><label>What happened?<textarea required name="details" rows="6" maxLength="5000" placeholder="Include relevant dates and what outcome you are seeking."/></label><p className="complaint-privacy">Complaints linked to a listed property appear in the manager’s private inbox. Anonymous submissions are intake only; sign in to continue the conversation.</p><button className="primary-button" type="submit" disabled={roleDefault === 'Tenant' && recipients.length === 0}><FileText size={16}/> Submit complaint</button></form></main><footer className="public-footer"><span>© {new Date().getFullYear()} Yemilaz Properties</span><span>We’ll handle your concern with care.</span></footer></div>;
}

function LoginPortal({ audience, onSubmit, onForgotPassword, signing, onRegister, onAdminSignIn, toast, onClearToast }) {
  const [showPassword, setShowPassword] = useState(false);
  const admin = audience === 'admin';
  return <main className={`login-portal-page ${admin ? 'admin-login-page' : 'member-login-page'}`}>
    <header className="login-portal-header"><a href="/" aria-label="Yemilaz Properties home"><BrandLockup name="Yemilaz Properties" logo="horizon"/></a><a className="login-home-link" href="/">Back to website</a></header>
    <div className="login-portal-layout"><section className="login-portal-story"><span className="public-eyebrow"><i/>{admin ? 'SECURE PLATFORM ACCESS' : 'YOUR PROPERTY COMMUNITY'}</span><h1>{admin ? 'Administration centre' : 'Property & resident portal'}</h1><p>{admin ? 'Secure workspace for approved Yemilaz Properties administrators.' : 'One secure place for landlords, tenants, lawyers, agents and caretakers to manage their property relationships.'}</p>{admin ? <div className="login-security-note"><ShieldCheck size={19}/><span><b>Administrator access only</b><small>Access is checked against the platform administrator list after sign-in.</small></span></div> : <div className="login-role-list"><span><Building2 size={16}/> Landlords</span><span><Users size={16}/> Tenants</span><span><KeyRound size={16}/> Lawyers, agents &amp; caretakers</span></div>}</section>
      <section className="login-form-card"><span className="eyebrow">{admin ? 'YEMILAZ PROPERTIES ADMINISTRATION' : 'YEMILAZ PROPERTIES'}</span><h2>{admin ? 'Administrator sign in' : 'Welcome back'}</h2><p>{admin ? 'Sign in with your authorized administrator account.' : 'Sign in to your private property workspace.'}</p><form onSubmit={onSubmit}><label>Email address<input required name="email" type="email" autoComplete="username" placeholder="you@example.com"/></label><label>Password<input required name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password"/></label><label className="show-password"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)}/> Show password</label><button type="button" className="auth-toggle login-forgot" onClick={(event) => { const form = event.currentTarget.form; onForgotPassword(form?.elements.email?.value?.trim()); }}>Forgot password?</button><button className="primary-button login-submit" disabled={signing}><KeyRound size={16}/>{signing ? 'Signing in…' : admin ? 'Sign in to administration' : 'Sign in to your portal'}</button></form>{!admin && <div className="login-register"><b>Create a property profile</b><p>Landlords register with an administrator access code. Tenants, agents and caretakers use the email registered for them by their landlord.</p><div className="login-register-buttons"><button className="secondary-button" onClick={() => onRegister('landlord')}>Register as landlord</button><button className="secondary-button" onClick={() => onRegister('tenant')}>Tenant</button><button className="secondary-button" onClick={() => onRegister('agent')}>Agent</button><button className="secondary-button" onClick={() => onRegister('caretaker')}>Caretaker</button><button className="secondary-button" onClick={() => onRegister('lawyer')}>Lawyer</button></div><div className="login-register-invited"><Check size={15}/> If you received an invitation, open its email link to finish setting up your profile.</div></div>}{admin && <div className="login-admin-help">Administrator accounts are created and authorized by the platform owner. Registration is not available from this page.</div>}</section></div>
    {!admin && <button className="login-admin-link" onClick={onAdminSignIn}>Platform administrator? Open the administration sign in</button>}
    {toast && <div className="toast"><Check size={16}/>{toast}<button onClick={onClearToast}><X size={15}/></button></div>}
  </main>;
}

function AdminAccessScreen({ checking, onSignOut }) {
  return <main className="admin-access-screen"><div className="admin-access-card"><BrandLockup name="Yemilaz Properties" logo="horizon"/><div className="admin-access-icon"><ShieldCheck size={25}/></div><span className="eyebrow">YEMILAZ PROPERTIES ADMINISTRATION</span><h1>{checking ? 'Verifying administrator access' : 'Administrator access required'}</h1><p>{checking ? 'Checking this account’s platform permissions…' : 'This account is not authorized to open the administration workspace. Sign out and use an approved administrator account.'}</p>{!checking && <button className="primary-button" onClick={onSignOut}><LogOut size={15}/> Sign out</button>}</div></main>;
}

function AuthDialog({ onSubmit, onSignUp, onForgotPassword, onClose, signing, initialRole = 'landlord' }) {
  const [showPassword, setShowPassword] = useState(false);
  const invitationParams = new URLSearchParams(window.location.search);
  const requestedJoinRole = invitationParams.get('join');
  const inviteRole = ['tenant', 'agent', 'caretaker', 'lawyer'].includes(requestedJoinRole) ? requestedJoinRole : null;
  const invitedEmail = inviteRole ? (invitationParams.get('email') || '') : '';
  const [createAccount, setCreateAccount] = useState(Boolean(inviteRole));
  const [role, setRole] = useState(inviteRole || initialRole);
  const emailRef = useRef(null);
  const roleName = role === 'landlord' ? 'landlord' : role === 'tenant' ? 'tenant' : role === 'agent' ? 'agent' : role === 'caretaker' ? 'caretaker' : role === 'lawyer' ? 'lawyer' : 'complaint';
  const signupDescription = inviteRole ? `You were invited as a ${roleName}. Use the email address from your invitation to connect your profile to the right property team.` : role === 'tenant' ? 'Use the email your landlord saved on your tenancy record.' : role === 'landlord' ? 'Create a private workspace for properties and tenants.' : 'Create an account to follow and reply to your property complaint.';
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal" onSubmit={createAccount ? onSignUp : onSubmit}><div className="modal-heading"><div><span className="eyebrow">YEMILAZ PROPERTIES</span><h2>{createAccount ? `Create ${roleName} profile` : 'Sign in'}</h2><p>{createAccount ? signupDescription : 'Access your private property workspace, tenant profile, or complaint conversations.'}</p></div><button type="button" className="icon-button" aria-label="Close sign in" onClick={onClose}><X size={19}/></button></div>{createAccount && <><input type="hidden" name="account_role" value={role === 'landlord' ? 'landlord' : 'stakeholder'}/><input type="hidden" name="stakeholder_kind" value={role}/><label>Your full name<input required name="full_name" autoComplete="name"/></label><div className="form-row"><label>Phone number<input required name="phone" type="tel" autoComplete="tel"/></label><label>Permanent address<input required name="permanent_address" autoComplete="street-address"/></label></div>{role === 'landlord' ? <><BrandingFields defaultBusinessName=""/><label>Yemilaz Properties access code<input required name="invite_code" autoComplete="one-time-code" placeholder="Enter your one-time invitation code"/><small>Landlord accounts require a current administrator-issued code.</small></label></> : <p className="setup-note">{role === 'tenant' ? 'Use the email your landlord saved on your tenant record.' : inviteRole ? `Your profile will be linked to the ${roleName} record registered by your landlord.` : role === 'agent' || role === 'caretaker' || role === 'lawyer' ? 'Use the exact email address your landlord registered for you.' : 'Complaint accounts can access only cases you submit or are invited to participate in.'}</p>}</>}<label>Email address<input ref={emailRef} required name="email" type="email" autoComplete="email" placeholder="you@example.com" defaultValue={createAccount ? invitedEmail : ''} readOnly={Boolean(createAccount && invitedEmail)}/></label><label>Password<input required name="password" type={showPassword ? 'text' : 'password'} autoComplete={createAccount ? 'new-password' : 'current-password'} minLength={createAccount ? 8 : undefined} placeholder={createAccount ? 'At least 8 characters' : 'Your password'}/></label><label className="show-password"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)}/> Show password</label>{!createAccount && <button type="button" className="auth-toggle" onClick={() => onForgotPassword(emailRef.current?.value?.trim())}>Forgot password?</button>}<div className="modal-footer auth-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={signing}><KeyRound size={15}/>{signing ? (createAccount ? 'Creating…' : 'Signing in…') : (createAccount ? 'Create account' : 'Sign in')}</button></div><div className="auth-toggle-row">{createAccount ? <button type="button" className="auth-toggle" onClick={() => setCreateAccount(false)}>Already have an account? Sign in</button> : <><button type="button" className="auth-toggle" onClick={() => { setRole('landlord'); setCreateAccount(true); }}>Register as landlord</button><button type="button" className="auth-toggle" onClick={() => { setRole('tenant'); setCreateAccount(true); }}>Tenant profile</button><button type="button" className="auth-toggle" onClick={() => { setRole('agent'); setCreateAccount(true); }}>Agent profile</button><button type="button" className="auth-toggle" onClick={() => { setRole('caretaker'); setCreateAccount(true); }}>Caretaker profile</button><button type="button" className="auth-toggle" onClick={() => { setRole('lawyer'); setCreateAccount(true); }}>Lawyer profile</button><button type="button" className="auth-toggle" onClick={() => { setRole('stakeholder'); setCreateAccount(true); }}>Other complainant</button></>}</div></form></div>;
}

function AuthNoticeDialog({ notice, onClose, onResend, onUpdatePassword, signing }) {
  return <div className="modal-backdrop auth-notice-backdrop"><section className="modal auth-notice-card"><div className={`auth-notice-icon ${notice.kind}`}>{notice.kind === 'error' ? <X size={24}/> : <Check size={24}/>}</div><span className="eyebrow">YEMILAZ PROPERTIES</span><h2>{notice.kind === 'error' ? 'Confirmation link expired' : notice.kind === 'reset' ? 'Set a new password' : notice.kind === 'password-success' ? 'Password updated' : notice.kind === 'success' ? 'Your account is confirmed' : 'Check your email'}</h2><p>{notice.message}</p>{notice.kind === 'error' && notice.expired && <form onSubmit={onResend}><label>Email address<input required name="email" type="email" autoComplete="email" placeholder="The address used to register"/></label><button className="primary-button" disabled={signing}>{signing ? 'Sending…' : 'Resend confirmation email'}</button></form>}{notice.kind === 'reset' && <form onSubmit={onUpdatePassword}><label>New password<input required name="new_password" type="password" minLength="8" autoComplete="new-password"/></label><label>Confirm new password<input required name="confirm_password" type="password" minLength="8" autoComplete="new-password"/></label><button className="primary-button" disabled={signing}>{signing ? 'Updating…' : 'Update password'}</button></form>}<button type="button" className="secondary-button" onClick={onClose}>{notice.kind === 'success' ? 'Continue to Yemilaz Properties' : 'Close'}</button></section></div>;
}

function PlatformContactDirectory({ client, onSetStatus }) {
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('All roles');
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
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">YEMILAZ PROPERTIES ADMINISTRATION</div><h1>People directory</h1><p>Review landlord, tenant, guarantor, agent, caretaker, and complainant contact details.</p></div><button className="secondary-button" onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh directory'}</button></div>
    <div className="admin-directory-note"><ShieldCheck size={18}/><span><b>Private administrator view</b><small>Contact details are visible only to platform administrators. Passwords and sign-in tokens are never shown here.</small></span></div>
    {message && <p className="setup-note">{message}</p>}
    <div className="panel management-panel admin-directory-panel"><div className="panel-heading"><div><h2>People <span className="count-badge">{filtered.length}</span></h2><span className="management-sub">{people.length} contact records across your workspace</span></div><label className="filter-button admin-role-filter"><Filter size={14}/><select aria-label="Filter by role" value={role} onChange={(event) => setRole(event.target.value)}><option>All roles</option>{roles.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13}/></label></div>
      <label className="search-box wide-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, emails, phones, or properties…"/></label>
      <div className="table-wrap"><table><thead><tr><th>ROLE</th><th>NAME &amp; CONTACT</th><th>BUSINESS / RELATION</th><th>PROPERTY / ADDRESS</th><th>ACCOUNT</th><th>ADDED</th></tr></thead><tbody>{filtered.map((person) => <tr key={person.person_key}><td><span className="invite-status">{person.role}</span></td><td><div className="directory-contact"><b>{person.full_name || 'Name not provided'}</b>{person.email ? <a href={`mailto:${person.email}`}>{person.email}</a> : <small>Email not provided</small>}{person.phone ? <a href={`tel:${person.phone}`}>{person.phone}</a> : <small>Phone not provided</small>}</div></td><td>{person.organization || '—'}{person.related_to && <small className="directory-subline">{person.related_to}</small>}</td><td>{person.property_label || '—'}</td><td>{person.user_id ? <div><span className={`invite-status ${person.account_status}`}>{person.account_status}</span>{person.suspension_reason&&<small className="directory-subline">{person.suspension_reason}</small>}<button className={person.account_status==='suspended'?'secondary-button compact-button':'danger-button'} onClick={async()=>{await onSetStatus(person);refresh();}}>{person.account_status==='suspended'?'Reactivate':'Suspend'}</button></div> : <small>No linked account yet</small>}</td><td>{person.created_at ? new Date(person.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td></tr>)}</tbody></table>{!loading && !filtered.length && <EmptyState title={people.length ? 'No people match this search' : 'No contact records yet'} text={people.length ? 'Try another name, email, phone number, or role.' : 'Registered landlord and tenant details will appear here.'}/>}</div>
    </div>
  </section>;
}

function PlatformAccessPage({ client }) {
  const [hours, setHours] = useState('24');
  const [invites, setInvites] = useState([]);
  const [newCode, setNewCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
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
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">YEMILAZ PROPERTIES ADMINISTRATION</div><h1>Landlord access</h1><p>Create expiring, single-use codes for approved landlords. Only platform administrators can see this page.</p></div></div><div className="panel invite-panel"><h2>Generate a landlord code</h2><p>Each code works for one landlord registration, expires automatically, and can be revoked before use.</p><form className="invite-create" onSubmit={generate}><label>Code expiry<select value={hours} onChange={(event) => setHours(event.target.value)}><option value="1">1 hour</option><option value="24">24 hours</option><option value="72">3 days</option><option value="168">7 days</option></select></label><button className="primary-button" disabled={busy}>Generate secure code</button></form>{newCode && <div className="invite-code-result"><div><small>ONE-TIME LANDLORD CODE</small><code>{newCode}</code></div><button className="secondary-button" onClick={() => navigator.clipboard?.writeText(newCode).then(() => setMessage('Access code copied.'))}>Copy code</button></div>}{message && <p className="setup-note">{message}</p>}</div><div className="panel invite-history"><div className="panel-heading"><div><span className="eyebrow">ACCESS CONTROL</span><h2>Invitation history</h2></div><button className="secondary-button" onClick={refresh}>Refresh</button></div><div className="table-wrap"><table><thead><tr><th>CODE</th><th>STATUS</th><th>EXPIRES</th><th>USED</th><th/></tr></thead><tbody>{invites.map((invite) => <tr key={invite.invite_id}><td><code>{invite.code_hint}</code></td><td><span className={`invite-status ${invite.status}`}>{invite.status}</span></td><td>{new Date(invite.expires_at).toLocaleString()}</td><td>{invite.redeemed_at ? new Date(invite.redeemed_at).toLocaleString() : '—'}</td><td>{invite.status === 'active' && <button className="danger-button" disabled={busy} onClick={() => revoke(invite.invite_id)}>Revoke</button>}</td></tr>)}</tbody></table>{!invites.length && <div className="empty-state">No landlord invitation codes yet.</div>}</div></div></section>;
}

function ListingVerificationPage({ client }) {
  const [properties, setProperties] = useState([]);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  async function refresh() {
    const { data, error } = await client.from('properties').select('id,owner_id,name,address,city,state,country,verification_status,created_at').eq('verification_status', 'pending').order('created_at');
    if (error) setMessage(error.message); else { setProperties(data || []); setMessage(''); }
  }
  useEffect(() => { refresh(); }, []);
  async function decide(property, verification_status) {
    setBusyId(property.id);
    const { error } = await client.from('properties').update({ verification_status }).eq('id', property.id);
    setBusyId('');
    if (error) setMessage(error.message); else { setMessage(verification_status === 'verified' ? 'Listing marked verified after review.' : 'Verification request declined.'); refresh(); }
  }
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">ADMIN REVIEW</div><h1>Listing verification</h1><p>Review ownership documents outside the public website, then record the decision here.</p></div><button className="secondary-button" onClick={refresh}>Refresh queue</button></div>{message && <p className="setup-note">{message}</p>}<div className="panel management-panel"><div className="table-wrap"><table><thead><tr><th>PROPERTY</th><th>ADDRESS</th><th>OWNER ID</th><th>REQUESTED</th><th>DECISION</th></tr></thead><tbody>{properties.map((property) => <tr key={property.id}><td>{property.name}</td><td>{[property.address,property.city,property.state,property.country].filter(Boolean).join(', ')}</td><td><code>{property.owner_id}</code></td><td>{new Date(property.created_at).toLocaleDateString()}</td><td><div className="row-actions"><button className="primary-button compact-button" disabled={busyId === property.id} onClick={() => decide(property,'verified')}>Verify</button><button className="danger-button" disabled={busyId === property.id} onClick={() => decide(property,'rejected')}>Decline</button></div></td></tr>)}</tbody></table>{!properties.length && <EmptyState title="No verification requests" text="New requests from property managers will appear here."/>}</div></div></section>;
}

function LandlordProfilePage({ profile, email, onSave, saving }) {
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">ACCOUNT SETTINGS</div><h1>Landlord profile</h1><p>Personalize the name, logo, colours and documents for your private workspace.</p></div></div><form key={`${profile?.user_id || 'profile-loading'}-${profile?.updated_at || ''}`} className="panel profile-form" onSubmit={onSave}><h2>Business and contacts</h2><p className="management-sub">Your records remain private to this signed-in account. Tenants and staff receive separate copies by email.</p><div className="form-row"><label>Landlord name<input required name="full_name" defaultValue={profile?.full_name || ''}/></label><label>Account email (delivery address)<input value={email || ''} readOnly/></label></div><div className="form-row"><label>Business phone<input name="phone" defaultValue={profile?.phone || ''}/></label><label>Business address<input name="business_address" defaultValue={profile?.business_address || ''}/></label></div><BrandingFields profile={profile}/><h2>Tenant complaint routing</h2><label className="checkbox-row"><input type="checkbox" name="allow_direct_tenant_complaints" defaultChecked={profile?.allow_direct_tenant_complaints !== false}/> Allow tenants to send complaints directly to me</label><p className="management-sub">Turn this off to route tenant complaints through their assigned agent or caretaker. Platform administrators can still review all complaints.</p><h2>Property wanted requests</h2><label className="checkbox-row"><input type="checkbox" name="receive_wanted_requests" defaultChecked={profile?.receive_wanted_requests !== false}/> Receive anonymous property requests</label><p className="management-sub">When enabled, you can view and respond to public requests for homes, apartments, land, and commercial property. Turn this off to stop receiving new requests in your workspace.</p><h2>Lawyer and document templates</h2><div className="form-row"><label>Lawyer name<input name="lawyer_name" defaultValue={profile?.lawyer_name || ''}/></label><label>Lawyer email<input name="lawyer_email" type="email" defaultValue={profile?.lawyer_email || ''}/><small>When set, the lawyer receives an individual packet.</small></label></div><label>Agreement terms<textarea required name="agreement_terms" rows="5" defaultValue={profile?.agreement_terms || ''}/><small>Starting text only. Have your lawyer review and adapt it to each tenancy and applicable local law.</small></label><label>Property rules<textarea required name="house_rules" rows="5" defaultValue={profile?.house_rules || ''}/><small>Use for reasonable rules that apply to the listed property, including a home, shop, office, store, farm or land. Avoid rules that conflict with the signed agreement or local law.</small></label><div className="profile-actions"><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save landlord profile'}</button></div></form></section>;
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

function ComplaintInbox({ records, activeComplaint, setActiveComplaint, messages, onSend, onResolution, currentUserId, onNew, allowNew = true, unreadCounts = {}, onOpenComplaint }) {
  const ownProposal = activeComplaint?.resolution_proposed_by === currentUserId;
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">PRIVATE CASE WORKSPACE</div><h1>Complaint room</h1><p>Keep a written record of each concern. A case is resolved only after the other participant approves.</p></div>{allowNew && !activeComplaint && <button className="primary-button" onClick={onNew}><Plus size={16}/> Lodge a complaint</button>}</div>{activeComplaint ? <div className="panel complaint-thread"><button className="text-button" onClick={() => setActiveComplaint(null)}>← All complaints</button><div className="panel-heading"><div><span className="eyebrow">CASE {activeComplaint.reference_code}</span><h2>{activeComplaint.subject}</h2><p>{activeComplaint.complainant_name} · {activeComplaint.property_address} · {activeComplaint.status}</p></div></div><p className="complaint-original">{activeComplaint.details}</p><div className="thread-messages">{messages.map((item) => <article className={`thread-message ${item.sender_id === currentUserId ? 'from-manager' : ''}`} key={item.id}><p>{item.message}</p><small>{item.sender_id === currentUserId ? 'You' : 'Other participant'} · {new Date(item.created_at).toLocaleString()}</small></article>)}{!messages.length && <p className="empty-state">No replies yet. Send a message to continue the conversation.</p>}</div>{activeComplaint.status !== 'resolved' && activeComplaint.status !== 'closed' && <><form className="thread-reply" onSubmit={onSend}><label htmlFor="complaint-message">Reply to this case</label><textarea id="complaint-message" name="message" required maxLength="5000" rows="3" placeholder="Write a clear, respectful reply…"/><button className="primary-button">Send reply</button></form><div className="resolution-actions">{activeComplaint.resolution_proposed_at && !ownProposal && <><button className="primary-button" onClick={() => onResolution('approve')}>Approve proposed resolution</button><button className="secondary-button" onClick={() => onResolution('rework')}>Request more work</button></>}{ownProposal && <p>Your resolution proposal is waiting for the other participant’s approval.</p>}{!activeComplaint.resolution_proposed_at && <button className="secondary-button" onClick={() => onResolution('propose')}>Propose resolution</button>}</div></>}</div> : <div className="panel management-panel"><p className="complaint-unread-help">A number shows how many complaint messages are waiting for you to check. It clears when you open that conversation.</p><div className="table-wrap"><table><thead><tr><th>REFERENCE</th><th>SUBJECT</th><th>COMPLAINANT</th><th>PROPERTY</th><th>STATUS</th><th>DATE</th><th/></tr></thead><tbody>{records.map((item) => { const unread = unreadCounts[item.id] || 0; return <tr key={item.id}><td>{item.reference_code}</td><td>{item.subject}{unread > 0 && <span className="pending-message-badge">{unread} pending</span>}</td><td>{item.complainant_name}</td><td>{item.property_address}</td><td>{item.resolution_approved_at ? 'Resolved by both' : item.resolution_proposed_at ? 'Awaiting approval' : item.status}</td><td>{new Date(item.created_at).toLocaleDateString()}</td><td><button className="secondary-button compact-button" onClick={() => (onOpenComplaint || setActiveComplaint)(item)}>Open conversation{unread > 0 ? ` · ${unread} new` : ''}</button></td></tr>; })}</tbody></table>{!records.length && <EmptyState title="No linked complaints yet" text="Complaints linked to a property in your account will appear here."/>}</div></div>}</section>;
}

function PortalNotificationCenter({ notices = [], onRead }) {
  const [open, setOpen] = useState(false);
  const unread = notices.filter((notice) => !notice.read_at);
  return <div className="portal-notification-center"><button type="button" className="secondary-button" onClick={() => setOpen((value) => !value)} aria-expanded={open}><Bell size={15}/> Notifications{unread.length > 0 && <span className="pending-message-badge">{unread.length}</span>}</button>{open && <div className="portal-notification-popover"><b>Recent notifications</b>{notices.slice(0, 8).map((notice) => <article className={notice.read_at ? '' : 'notification-unread'} key={notice.id}><span><strong>{notice.title}</strong><small>{notice.message}</small><small>{new Date(notice.created_at).toLocaleString()}</small></span>{!notice.read_at && <button type="button" className="text-button" onClick={() => onRead(notice)}>Mark read</button>}</article>)}{!notices.length && <p>No notifications yet. New messages and complaint replies will appear here.</p>}</div>}</div>;
}

function StaffPortal({ auth, role, staff, tenants, properties, cases, activeComplaint, setActiveComplaint, messages, onSend, onResolution, onSubmitComplaint, notifications, onReadNotification, complaintUnreadCounts, onOpenComplaint, onSignOut, toast, onClearToast }) {
  const roleLabel = role === 'caretaker' ? 'Caretaker' : role === 'lawyer' ? 'Lawyer' : 'Agent';
  const roleDescription = role === 'lawyer' ? 'Message the landlord, tenants, agents and caretakers linked to this property portfolio.' : 'Use this account only for your own assigned work. Contact the landlord if you need your assignments or registered details updated.';
  return <div className="brand-site theme-jade"><header className="portal-header"><BrandLockup name="Yemilaz Properties" logo="horizon"/><div><PortalNotificationCenter notices={notifications} onRead={onReadNotification}/><span>{auth.email}</span><button className="secondary-button" onClick={onSignOut}>Sign out</button></div></header><main className="stakeholder-portal">
    <section className="panel tenant-profile-card"><div><span className="eyebrow">{roleLabel.toUpperCase()} PROFILE</span><h1>Welcome, {staff?.full_name || auth.user_metadata?.full_name || roleLabel}</h1><p>Your personal property workspace and assignments are shown here.</p></div></section>
    <div className="tenant-profile-grid"><section className="panel tenant-profile-section"><span className="eyebrow">YOUR CONTACT DETAILS</span><h2>{staff?.full_name || 'Profile details loading'}</h2><p>{staff?.email || auth.email}</p><p>{staff?.phone || 'Add a phone number through your property manager.'}</p><p>{staff?.permanent_address || 'Permanent address not provided.'}</p></section><section className="panel tenant-profile-section"><span className="eyebrow">YOUR ROLE</span><h2>{roleLabel}</h2><p>{roleDescription}</p><div className="tenant-profile-facts"><span>Assigned properties <b>{properties.length}</b></span><span>Assigned tenants <b>{tenants.length}</b></span></div></section></div>
    <section className="panel tenant-profile-section"><div className="panel-heading"><div><span className="eyebrow">PROPERTY WORKSPACE</span><h2>Assigned properties</h2></div></div>{properties.length ? <div className="property-grid">{properties.map((property) => <article className="panel tenant-profile-section" key={property.id}><span className="eyebrow">{property.status || 'Property'}</span><h2>{property.name}</h2><p>{[property.address, property.city, property.state, property.country].filter(Boolean).join(', ') || 'Address not provided'}</p></article>)}</div> : <p>No properties have been assigned to you yet.</p>}</section>
    <section className="panel tenant-profile-section"><div className="panel-heading"><div><span className="eyebrow">YOUR ASSIGNMENTS</span><h2>Tenants you support</h2></div></div>{tenants.length ? <div className="table-wrap"><table><thead><tr><th>TENANT</th><th>EMAIL</th><th>PHONE</th><th>LEASE</th><th>PROPERTY</th></tr></thead><tbody>{tenants.map((tenant) => <tr key={tenant.id}><td>{tenant.full_name}</td><td>{tenant.email || '—'}</td><td>{tenant.phone || '—'}</td><td>{dateLabel(tenant.lease_start)} – {dateLabel(tenant.lease_end)}</td><td>{properties.find((property) => property.id === tenant.property_id)?.name || 'Not allocated'}</td></tr>)}</tbody></table></div> : <EmptyState title="No tenants assigned" text="Your landlord can assign you to tenants from the tenant directory."/>}</section>
    <ParticipantDocumentLibrary auth={auth}/>
    {staff&&<PropertyMessagePanel auth={auth} staff={staff}/>}
    {['agent','caretaker','lawyer'].includes(role) && <ComplaintInbox records={cases} activeComplaint={activeComplaint} setActiveComplaint={setActiveComplaint} messages={messages} onSend={onSend} onResolution={onResolution} currentUserId={auth.id} allowNew={false} unreadCounts={complaintUnreadCounts} onOpenComplaint={onOpenComplaint}/>}
    {toast && <div className="toast"><Check size={16}/>{toast}<button aria-label="Dismiss notification" onClick={onClearToast}><X size={15}/></button></div>}
  </main></div>;
}

function ParticipantDocumentLibrary({ auth }) {
  const [documents, setDocuments] = useState([]); const [sortBy, setSortBy] = useState('newest'); const [feedback, setFeedback] = useState('');
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
  return <section className="panel tenant-profile-section"><div className="panel-heading"><div><span className="eyebrow">YOUR PROPERTY FILES</span><h2>Documents shared with you</h2><p>PDFs sent for your role are kept here for later download.</p></div><label>Sort<select aria-label="Sort documents" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select></label></div>{sorted.map((file) => <article className="tenant-document-row" key={file.id}><div><b>{file.title}</b><small>{file.document_category?.replaceAll('_', ' ')} · {dateLabel(file.created_at?.slice(0, 10))}</small></div><button className="secondary-button" onClick={() => download(file.storage_path)}><Download size={15}/> Download PDF</button></article>)}{!sorted.length && !feedback && <p>No emailed documents are available for this account yet.</p>}{feedback && <p className="setup-note" role="status">{feedback}</p>}</section>;
}

function TenantOperations({ auth, tenant, properties }) {
  const [items,setItems]=useState([]),[documents,setDocuments]=useState([]),[sharedFiles,setSharedFiles]=useState([]),[charges,setCharges]=useState([]),[notices,setNotices]=useState([]),[inspections,setInspections]=useState([]),[updates,setUpdates]=useState([]),[staff,setStaff]=useState([]),[profileRequests,setProfileRequests]=useState([]);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[fileSort,setFileSort]=useState('newest'),[docFilter,setDocFilter]=useState('all'),[replyDrafts,setReplyDrafts]=useState({});
  async function refresh(){
    if(!supabase||!tenant)return;
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
  const today=new Date().toISOString().slice(0,10),unpaid=charges.filter(c=>!['paid','voided','waived'].includes(c.status)),openRepairs=items.filter(item=>!['completed','cancelled'].includes(item.status)),upcoming=inspections.filter(i=>i.inspection_date>=today);
  const sortedSharedFiles=[...sharedFiles].filter(f=>docFilter==='all'||f.document_category===docFilter).sort((a,b)=>fileSort==='title'?a.title.localeCompare(b.title):fileSort==='oldest'?a.created_at.localeCompare(b.created_at):b.created_at.localeCompare(a.created_at));
  const categories=[...new Set(sharedFiles.map(f=>f.document_category).filter(Boolean))];
  return <>
    <section className="tenant-summary-grid">{[[Wallet,'Outstanding charges',currency(unpaid.reduce((sum,c)=>sum+Number(c.amount||0),0)),`${unpaid.length} unpaid or upcoming items`],[Wrench,'Open maintenance',openRepairs.length,`${items.length} total requests`],[CalendarDays,'Upcoming inspections',upcoming.length,upcoming[0]?`Next: ${dateLabel(upcoming[0].inspection_date)}`:'No inspections scheduled']].map(([Icon,label,value,note])=><article className="panel tenant-summary-card" key={label}><span><Icon size={18}/></span><b>{value}</b><strong>{label}</strong><small>{note}</small></article>)}</section>
    <section className="panel tenant-profile-section"><div className="panel-heading"><div><span className="eyebrow">RENT &amp; CHARGES</span><h2>Payment history</h2><p>See charges recorded by your landlord. Payments are recorded by the property manager; this portal does not collect online payments. Receipts shared with you are available in your property documents.</p></div></div>{charges.length?<div className="table-wrap"><table><thead><tr><th>CHARGE</th><th>DUE</th><th>PAID</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{charges.map(c=><tr key={c.id}><td>{c.description||c.category||'Property charge'}</td><td>{dateLabel(c.due_date)}</td><td>{dateLabel(c.paid_at?.slice(0,10))}</td><td>{currency(c.amount)}</td><td><span className={`status-pill status-${c.status}`}>{c.status}</span></td></tr>)}</tbody></table></div>:<p>No rent or charges have been recorded for this tenancy yet.</p>}</section>
    {notices.length>0&&<section className="panel tenant-profile-section"><span className="eyebrow">FROM YOUR PROPERTY MANAGER</span><h2>Property notices</h2>{notices.map(n=><article className="tenant-notice" key={n.id}><div><b>{n.title}</b><small>{n.priority} · {dateLabel(n.created_at?.slice(0,10))}</small></div><p>{n.body}</p></article>)}</section>}
    <PropertyMessagePanel auth={auth} tenant={tenant}/>
    <section className="panel tenant-profile-section tenant-maintenance"><div className="panel-heading"><div><span className="eyebrow">PROPERTY CARE</span><h2>Maintenance requests</h2><p>Track progress and reply to the assigned team here.</p></div></div><form onSubmit={submit}><div className="form-row"><label>Issue title<input required name="title" minLength="3" maxLength="160" placeholder="e.g. Water leak in bathroom"/></label><label>Priority<select name="priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div><label>Describe the issue<textarea name="description" required minLength="10" maxLength="4000" rows="3"/></label><label>Photo evidence (optional)<input type="file" name="evidence" accept="image/jpeg,image/png,image/webp"/><small>JPG, PNG or WebP, up to 10 MB.</small></label><button className="primary-button" disabled={busy}>{busy?'Sending…':'Send maintenance request'}</button></form>{message&&<p className="setup-note" role="status">{message}</p>}<div className="tenant-request-list">{items.map(item=><article key={item.id}><div className="tenant-maintenance-heading"><b>{item.title}</b><span className="status-pill">{item.status.replaceAll('_',' ')}</span></div><span>{item.description}</span><small>{item.priority} priority · {dateLabel(item.created_at?.slice(0,10))}{item.due_date?` · Target ${dateLabel(item.due_date)}`:''}{item.assigned_staff_id?` · Assigned to ${staff.find(s=>s.id===item.assigned_staff_id)?.full_name||'property team'}`:''}</small>{item.evidence_path&&<button className="text-button" onClick={()=>openEvidence(item.evidence_path)}>View photo evidence</button>}{updates.filter(u=>u.request_id===item.id).map(u=><div className="maintenance-update" key={u.id}><p>{u.body}</p><small>{u.author_id===auth.id?'You · ':'Property team · '}{new Date(u.created_at).toLocaleString()}</small></div>)}<form className="maintenance-reply" onSubmit={e=>reply(e,item)}><label htmlFor={`maintenance-reply-${item.id}`}>Add an update</label><textarea id={`maintenance-reply-${item.id}`} rows="2" maxLength="3000" required value={replyDrafts[item.id]||''} onChange={e=>setReplyDrafts(all=>({...all,[item.id]:e.target.value}))}/><button className="secondary-button" disabled={busy}>Send update</button></form></article>)}</div>{!items.length&&<p>No maintenance requests yet.</p>}</section>
    <section className="panel tenant-profile-section"><div className="panel-heading"><div><span className="eyebrow">IMPORTANT DATES</span><h2>Inspections and lease dates</h2></div></div><div className="tenant-date-list">{tenant.lease_start&&<article><b>Lease started</b><span>{dateLabel(tenant.lease_start)}</span></article>}{tenant.lease_end&&<article><b>Lease ends</b><span>{dateLabel(tenant.lease_end)}</span></article>}{upcoming.map(i=><article key={i.id}><b>{i.inspection_type?.replaceAll('_',' ')||'Property inspection'}</b><span>{dateLabel(i.inspection_date)} · {i.notes||i.condition}</span></article>)}{!tenant.lease_start&&!tenant.lease_end&&!upcoming.length&&<p>No upcoming dates are recorded.</p>}</div></section>
    <section className="panel tenant-profile-section"><div className="panel-heading"><div><span className="eyebrow">SHARED PROPERTY FILES</span><h2>Documents from your landlord</h2></div><div className="tenant-document-filters"><label>Category<select aria-label="Filter property documents" value={docFilter} onChange={e=>setDocFilter(e.target.value)}><option value="all">All categories</option>{categories.map(c=><option value={c} key={c}>{c.replaceAll('_',' ')}</option>)}</select></label><label>Sort<select aria-label="Sort property documents" value={fileSort} onChange={e=>setFileSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select></label></div></div>{sortedSharedFiles.map(file=><article className="tenant-document-row" key={file.id}><div><b>{file.title}</b><small>{file.document_category?.replaceAll('_',' ')||'Shared file'} · {dateLabel(file.created_at?.slice(0,10))}</small></div><button className="secondary-button" onClick={()=>openShared(file.storage_path)}><Download size={15}/> Download</button></article>)}{!sortedSharedFiles.length&&<p>No files match this filter, or no documents have been shared yet.</p>}</section>
    <section className="panel tenant-profile-section"><span className="eyebrow">PROFILE DETAILS</span><h2>Request a profile correction</h2><p>For your security, your landlord reviews and approves changes to your tenancy record.</p><form className="maintenance-reply" onSubmit={requestProfile}><div className="form-row"><label>Field to update<select name="field_name"><option value="phone">Phone number</option><option value="full_name">Full name</option><option value="permanent_address">Permanent address</option></select></label><label>Correct information<input name="requested_value" required minLength="2" maxLength="500"/></label></div><label>Note (optional)<textarea name="note" rows="2" maxLength="1000"/></label><button className="secondary-button" disabled={busy}>Request correction</button></form>{profileRequests.map(r=><article className="tenant-notice" key={r.id}><b>{r.field_name.replaceAll('_',' ')}: {r.requested_value}</b><small>{r.status} · {dateLabel(r.created_at?.slice(0,10))}{r.response?` · ${r.response}`:''}</small></article>)}</section>
    <section className="panel tenant-profile-section"><span className="eyebrow">TENANCY DOCUMENTS</span><h2>Review and sign</h2>{documents.map(document=><article className="tenant-document-row" key={document.id}><div><b>{document.document_type.replaceAll('_',' ')}</b><small>Version {document.document_version} · {document.signer_role==='landlord'?'Landlord has signed':'Signed by you'} · {new Date(document.signed_at).toLocaleDateString()}</small><details><summary>Read document</summary><pre className="document-snapshot">{document.document_text}</pre></details></div>{document.signer_role==='landlord'&&!documents.some(item=>item.document_type===document.document_type&&item.document_version===document.document_version&&item.signer_id===auth.id)&&<button className="primary-button" onClick={()=>signDocument(document)}>Review &amp; sign</button>}</article>)}{!documents.length&&<p>Your landlord has not shared a document for signature yet.</p>}<p className="setup-note">Typed signature and timestamp records are provided; this is not a certified electronic-signature service.</p></section>
  </>;
}

function PropertyMessagePanel({ auth, tenant = null, staff = null }) {
  const [contacts,setContacts]=useState([]);const [recipient,setRecipient]=useState('');const [items,setItems]=useState([]);const [body,setBody]=useState('');const [feedback,setFeedback]=useState('');const [busy,setBusy]=useState(false);
  const ownerId=tenant?.owner_id||staff?.owner_id;const tenantId=tenant?.id||null;
  async function loadContacts(){const {data,error}=await supabase.rpc('list_property_conversation_contacts');if(error){setFeedback(error.message);return;}const rows=(data||[]).filter((item)=>item.user_id!==auth.id);setContacts(rows);setRecipient((current)=>rows.some((item)=>item.user_id===current)?current:rows[0]?.user_id||'');}
  async function loadMessages(){const {data,error}=await supabase.from('property_messages').select('*').or(`sender_id.eq.${auth.id},recipient_id.eq.${auth.id}`).order('created_at');if(error){setFeedback(error.message);return;}setItems((data||[]).filter((item)=>item.sender_id===recipient||item.recipient_id===recipient));}
  useEffect(()=>{loadContacts();const timer=window.setInterval(loadContacts,12000);return()=>window.clearInterval(timer);},[auth.id,ownerId]);
  useEffect(()=>{if(!recipient){setItems([]);return;}loadMessages();const timer=window.setInterval(loadMessages,12000);return()=>window.clearInterval(timer);},[recipient,auth.id]);
  async function send(event){event.preventDefault();const contact=contacts.find((item)=>item.user_id===recipient);if(!body.trim()||!ownerId||!contact)return;setBusy(true);const {error}=await supabase.from('property_messages').insert({owner_id:ownerId,tenant_id:tenantId||contact.tenant_id||null,property_id:tenant?.property_id||contact.property_id||staff?.property_id||null,sender_id:auth.id,recipient_id:contact.user_id,body:body.trim()});setBusy(false);if(error)setFeedback(error.message);else{setBody('');setFeedback(`Message sent to ${contact.full_name}.`);loadMessages();}}
  const selected=contacts.find((item)=>item.user_id===recipient);
  return <section className="panel tenant-profile-section"><span className="eyebrow">PRIVATE PROPERTY MESSAGES</span><h2>Property conversations</h2><label>Conversation with<select value={recipient} onChange={(event)=>setRecipient(event.target.value)}><option value="">Choose a linked contact</option>{contacts.map((contact)=><option key={contact.user_id} value={contact.user_id}>{contact.full_name} · {contact.role}</option>)}</select></label><div className="message-thread">{items.map((item)=><article className={item.sender_id===auth.id?'message-mine':'message-theirs'} key={item.id}><p>{item.body}</p><small>{item.sender_id===auth.id?'You':selected?.full_name||'Contact'} · {new Date(item.created_at).toLocaleString()}</small></article>)}{!items.length&&<p>{selected?'No messages in this conversation yet.':'No linked contacts are available for messaging yet.'}</p>}</div><form className="thread-reply" onSubmit={send}><label htmlFor="property-message">Your message</label><textarea id="property-message" value={body} onChange={(event)=>setBody(event.target.value)} required maxLength={5000} rows={3}/><button className="primary-button" disabled={busy||!selected}>{busy?'Sending…':'Send message'}</button></form>{feedback&&<p className="setup-note" role="status">{feedback}</p>}</section>;
}

function MfaVerificationGate({onVerify,onSignOut}) { const [code,setCode]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');async function submit(event){event.preventDefault();setBusy(true);const message=await onVerify(code.trim());setBusy(false);if(message)setError(message);}return <main className="admin-access-screen"><section className="admin-access-card"><span className="admin-access-icon"><ShieldCheck/></span><span className="eyebrow">OPTIONAL ACCOUNT SECURITY</span><h1>Verify your sign-in</h1><p>Enter the current six-digit code from your authenticator app to continue.</p><form onSubmit={submit}><label>Authenticator code<input autoComplete="one-time-code" inputMode="numeric" minLength="6" maxLength="6" required value={code} onChange={e=>setCode(e.target.value)}/></label><button className="primary-button" disabled={busy}>{busy?'Checking…':'Verify and continue'}</button></form>{error&&<p role="alert">{error}</p>}<button className="secondary-button" onClick={onSignOut}>Sign out</button></section></main>; }

function OperationsHub({ page, auth, tenants, properties, isAdmin }) {
  const [rows,setRows]=useState([]);const [contacts,setContacts]=useState([]);const [busy,setBusy]=useState(false);const [feedback,setFeedback]=useState('');const [mfa,setMfa]=useState(false);const [mfaData,setMfaData]=useState(null);const [otp,setOtp]=useState('');const [from,setFrom]=useState('');const [to,setTo]=useState('');
  const tableByPage={'Audit history':'audit_events','Property documents':'property_documents','Inspections':'property_inspections','Email delivery':'tenant_packet_deliveries','Property messages':'property_messages','Security & privacy':'privacy_requests','Property notices':'property_notices','Tenant profile requests':'tenant_profile_requests'};
  async function load(){const table=tableByPage[page];if(!table)return;let query=supabase.from(table).select('*').order('created_at',{ascending:false}).limit(250);if(page==='Property messages')query=query.or(`sender_id.eq.${auth.id},recipient_id.eq.${auth.id},owner_id.eq.${auth.id}`);const {data,error}=await query;if(error)setFeedback(error.message);else setRows(data||[]);}
  useEffect(()=>{load();if(page==='Property messages')supabase.rpc('list_property_conversation_contacts').then(({data,error})=>{if(error)setFeedback(error.message);else setContacts(data||[]);});if(page==='Security & privacy')supabase.from('account_security_preferences').select('mfa_opt_in').eq('user_id',auth.id).maybeSingle().then(({data})=>setMfa(!!data?.mfa_opt_in));},[page,auth?.id]);
  async function mfaStart(){setBusy(true);setFeedback('');const {data,error}=await supabase.auth.mfa.enroll({factorType:'totp',friendlyName:'Yemilaz Properties'});setBusy(false);if(error){setFeedback(error.message);return;}setMfaData(data);}
  async function mfaVerify(event){event.preventDefault();setBusy(true);const {data:challenge,error:challengeError}=await supabase.auth.mfa.challenge({factorId:mfaData.id});if(challengeError){setBusy(false);setFeedback(challengeError.message);return;}const {error}=await supabase.auth.mfa.verify({factorId:mfaData.id,challengeId:challenge.id,code:otp});if(error)setFeedback(error.message);else{await supabase.from('account_security_preferences').upsert({user_id:auth.id,mfa_opt_in:true,updated_at:new Date().toISOString()});setMfa(true);setMfaData(null);setFeedback('Optional two-step verification is enabled for your account.');}setBusy(false);}
  async function mfaDisable(){const {data,error}=await supabase.auth.mfa.listFactors();if(error){setFeedback(error.message);return;}for(const factor of data.totp||[])await supabase.auth.mfa.unenroll({factorId:factor.id});await supabase.from('account_security_preferences').upsert({user_id:auth.id,mfa_opt_in:false,updated_at:new Date().toISOString()});setMfa(false);setFeedback('Two-step verification is turned off.');}
  async function uploadDocument(event){event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);const file=fd.get('file');if(!(file instanceof File)||!file.size)return;if(file.size>20*1024*1024){setFeedback('Choose a document smaller than 20 MB.');return;}setBusy(true);const id=crypto.randomUUID();const path=`${auth.id}/${id}/${file.name.replace(/[^\w.-]/g,'_')}`;const {error:uploadError}=await supabase.storage.from('property-documents').upload(path,file,{contentType:file.type,upsert:false});if(uploadError){setBusy(false);setFeedback(uploadError.message);return;}const {error}=await supabase.from('property_documents').insert({owner_id:auth.id,property_id:fd.get('property_id')||null,tenant_id:fd.get('tenant_id')||null,uploaded_by:auth.id,title:String(fd.get('title')||file.name),storage_path:path,mime_type:file.type});setBusy(false);if(error){setFeedback(error.message);return;}form.reset();setFeedback('Private property document uploaded.');load();}
  async function addInspection(event){event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);setBusy(true);const paths=[];const photos=fd.getAll('inspection_photos').filter(file=>file instanceof File&&file.size);if(photos.some(file=>file.size>20*1024*1024)){setBusy(false);setFeedback('Each inspection photo must be smaller than 20 MB.');return;}for(const photo of photos){const path=`${auth.id}/inspections/${crypto.randomUUID()}-${photo.name.replace(/[^\w.-]/g,'_')}`;const {error:uploadError}=await supabase.storage.from('property-documents').upload(path,photo,{contentType:photo.type});if(uploadError){setBusy(false);setFeedback(uploadError.message);return;}paths.push(path);}const {error}=await supabase.from('property_inspections').insert({owner_id:auth.id,property_id:fd.get('property_id')||null,tenant_id:fd.get('tenant_id')||null,inspection_type:fd.get('inspection_type'),inspection_date:fd.get('inspection_date'),condition:fd.get('condition'),notes:fd.get('notes')||null,checklist:fd.getAll('checklist'),photo_paths:paths,created_by:auth.id});setBusy(false);if(error)setFeedback(error.message);else{form.reset();setFeedback('Inspection recorded.');load();}}
  async function submitPrivacy(event){event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);setBusy(true);const {error}=await supabase.from('privacy_requests').insert({user_id:auth.id,full_name:String(fd.get('full_name')),email:auth.email,request_type:fd.get('request_type'),details:String(fd.get('details'))});setBusy(false);if(error)setFeedback(error.message);else{form.reset();setFeedback('Your privacy request has been submitted.');load();}}
  async function sendMessage(event){event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);const contact=contacts.find(item=>item.user_id===fd.get('recipient_id'));if(!contact)return;setBusy(true);const {error}=await supabase.from('property_messages').insert({owner_id:auth.id,tenant_id:contact.tenant_id,property_id:contact.property_id,sender_id:auth.id,recipient_id:contact.user_id,body:String(fd.get('body')).trim()});setBusy(false);if(error)setFeedback(error.message);else{form.reset();setFeedback('Message sent.');load();}}
  async function openFile(path,bucket='property-documents'){const {data,error}=await supabase.storage.from(bucket).createSignedUrl(path,60);if(error)setFeedback(error.message);else window.open(data.signedUrl,'_blank','noopener,noreferrer');}
  async function publishNotice(event){event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);setBusy(true);const {error}=await supabase.from('property_notices').insert({owner_id:auth.id,created_by:auth.id,property_id:fd.get('property_id')||null,title:String(fd.get('title')).trim(),body:String(fd.get('body')).trim(),priority:fd.get('priority')});setBusy(false);if(error)setFeedback(error.message);else{form.reset();setFeedback('Notice published. Linked tenants have been notified.');load();}}
  async function reviewProfileRequest(request,approve){const response=window.prompt(approve?'Optional note for the tenant:':'Reason for declining this request:');if(response===null)return;setBusy(true);const {error}=await supabase.rpc('review_tenant_profile_request',{p_request_id:request.id,p_approve:approve,p_response:response});setBusy(false);if(error)setFeedback(error.message);else{setFeedback(approve?'Correction approved and tenant profile updated.':'Correction request declined.');load();}}
  const headings={'Audit history':'Audit history','Security & privacy':'Security and privacy','Property documents':'Private property documents','Inspections':'Property inspections','Email delivery':'Email delivery history','Property messages':'Property message centre','Property notices':'Property notices','Tenant profile requests':'Tenant profile correction requests'};
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">WORKSPACE / OPERATIONS</div><h1>{headings[page]}</h1><p>{page==='Audit history'?'Review who changed important records and when.':page==='Security & privacy'?'Choose optional account security and submit a data request.':page==='Property documents'?'Store private tenancy, inspection, ownership and invoice files.':page==='Inspections'?'Record move-in, routine and move-out property condition checks.':page==='Email delivery'?'See the status of tenant document email attempts.':page==='Property notices'?'Publish updates to everyone or tenants at a selected property.':page==='Tenant profile requests'?'Review requests from tenants to correct their profile details.':'Keep tenant and landlord conversations in a property-linked message thread.'}</p></div></div>
  {page==='Security & privacy'&&<><section className="panel operations-card"><h2>Optional two-step verification</h2><p>This extra sign-in step is optional. You can enable or disable it for this account.</p>{mfa?<button className="secondary-button" onClick={mfaDisable}>Turn off two-step verification</button>:!mfaData?<button className="primary-button" onClick={mfaStart} disabled={busy}>{busy?'Preparing…':'Enable two-step verification'}</button>:<div className="mfa-enrol"><p>Scan this QR code with an authenticator app, then enter its six-digit code.</p><img alt="Authenticator setup QR code" src={mfaData.totp.qr_code}/><code>{mfaData.totp.secret}</code><form onSubmit={mfaVerify}><label>Verification code<input value={otp} onChange={e=>setOtp(e.target.value)} inputMode="numeric" autoComplete="one-time-code" required minLength="6" maxLength="6"/></label><button className="primary-button" disabled={busy}>Verify and enable</button></form></div>}{mfa&&<span className="invite-status">Enabled on this account</span>}</section><section className="panel operations-card"><h2>Privacy request</h2><p>Request access to, correction of, or deletion of personal information associated with your account.</p><form className="maintenance-create" onSubmit={submitPrivacy}><label>Full name<input required name="full_name" defaultValue={auth.user_metadata?.full_name||''}/></label><label>Request type<select name="request_type"><option value="access">Access / copy of my information</option><option value="correction">Correct my information</option><option value="deletion">Delete my information</option><option value="other">Other privacy question</option></select></label><label>Details<textarea required name="details" minLength="10" maxLength="3000" rows="3"/></label><button className="primary-button" disabled={busy}>Submit request</button></form></section>{isAdmin&&<section className="panel operations-card"><h2>Administrator privacy-request queue</h2><div className="table-wrap"><table><thead><tr><th>REQUESTER</th><th>TYPE</th><th>DETAILS</th><th>STATUS</th><th>SUBMITTED</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.full_name}<small className="directory-subline">{r.email}</small></td><td>{r.request_type}</td><td>{r.details}</td><td><select value={r.status} onChange={async e=>{const status=e.target.value;const {error}=await supabase.from('privacy_requests').update({status,resolved_at:status==='completed'?new Date().toISOString():null}).eq('id',r.id);if(error)setFeedback(error.message);else load();}}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="completed">Completed</option><option value="declined">Declined</option></select></td><td>{new Date(r.created_at).toLocaleDateString()}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No privacy requests" text="Submitted data requests will appear here."/>}</div></section>}</>}
  {page==='Property documents'&&<><form className="panel maintenance-create" onSubmit={uploadDocument}><h2>Upload a private file</h2><div className="form-row"><label>Document title<input name="title" placeholder="Tenancy agreement, inspection photos…"/></label><label>Property<select name="property_id"><option value="">General file</option>{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div><label>Share with tenant<select name="tenant_id"><option value="">Landlord only</option>{tenants.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select></label><label>PDF or image (max 20 MB)<input type="file" name="file" accept="application/pdf,image/jpeg,image/png,image/webp" required/></label><button className="primary-button" disabled={busy}>Upload document</button></form><div className="panel management-panel"><table><thead><tr><th>DOCUMENT</th><th>PROPERTY</th><th>SHARED WITH</th><th>DATE</th><th>FILE</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.title}</td><td>{properties.find(p=>p.id===r.property_id)?.name||'General'}</td><td>{tenants.find(t=>t.id===r.tenant_id)?.full_name||'Landlord only'}</td><td>{dateLabel(r.created_at?.slice(0,10))}</td><td><button className="text-button" onClick={()=>openFile(r.storage_path)}>Open secure link</button></td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No files stored" text="Upload a private file above."/>}</div></>}
  {page==='Inspections'&&<><form className="panel maintenance-create" onSubmit={addInspection}><h2>Record inspection</h2><div className="form-row"><label>Property<select required name="property_id"><option value="">Choose a property</option>{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Tenant<select name="tenant_id"><option value="">Not linked to a tenant</option>{tenants.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select></label></div><div className="form-row"><label>Inspection type<select name="inspection_type"><option value="move_in">Move-in</option><option value="routine">Routine</option><option value="move_out">Move-out</option></select></label><label>Date<input type="date" name="inspection_date" required defaultValue={new Date().toISOString().slice(0,10)}/></label></div><fieldset className="inspection-checklist"><legend>Checklist</legend>{['Walls and ceilings','Floors and doors','Windows and locks','Water and plumbing','Electrical fittings','Kitchen and appliances','Bathroom and sanitation','Safety equipment','Keys and access'].map(item=><label key={item}><input type="checkbox" name="checklist" value={item}/>{item}</label>)}</fieldset><label>Overall condition<textarea name="condition" required minLength="3" maxLength="1000" rows="2" placeholder="Good, fair, needs repairs…"/></label><label>Notes and observations<textarea name="notes" maxLength="4000" rows="3"/></label><label>Inspection photos (optional, up to 20 MB each)<input type="file" name="inspection_photos" multiple accept="image/jpeg,image/png,image/webp"/></label><button className="primary-button" disabled={busy}>Save inspection</button></form><div className="panel management-panel"><table><thead><tr><th>PROPERTY</th><th>TENANT</th><th>TYPE</th><th>DATE</th><th>CHECKLIST / NOTES</th><th>PHOTOS</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{properties.find(p=>p.id===r.property_id)?.name||'—'}</td><td>{tenants.find(t=>t.id===r.tenant_id)?.full_name||'—'}</td><td>{r.inspection_type.replaceAll('_',' ')}</td><td>{dateLabel(r.inspection_date)}</td><td>{r.condition}<small className="directory-subline">{(r.checklist||[]).join(', ')}{r.notes?` · ${r.notes}`:''}</small></td><td>{(r.photo_paths||[]).map((path,index)=><button key={path} className="text-button" onClick={()=>openFile(path)}>Photo {index+1}</button>)}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No inspections recorded" text="Create an inspection report above."/>}</div></>}
  {page==='Property notices'&&<><form className="panel maintenance-create" onSubmit={publishNotice}><h2>Publish an update</h2><div className="form-row"><label>Title<input name="title" required minLength="3" maxLength="160" placeholder="e.g. Water supply maintenance"/></label><label>Priority<select name="priority"><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select></label></div><label>Applies to<select name="property_id"><option value="">All tenants</option>{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Notice<textarea name="body" required minLength="5" maxLength="5000" rows="4" placeholder="Share timing, access instructions, or other details."/></label><button className="primary-button" disabled={busy}>{busy?'Publishing…':'Publish notice'}</button></form><div className="panel management-panel"><table><thead><tr><th>NOTICE</th><th>PROPERTY</th><th>PRIORITY</th><th>DATE</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><b>{r.title}</b><small className="directory-subline">{r.body}</small></td><td>{properties.find(p=>p.id===r.property_id)?.name||'All tenants'}</td><td>{r.priority}</td><td>{dateLabel(r.created_at?.slice(0,10))}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No notices published" text="Publish a property update above; eligible tenants will receive an in-app notification."/>}</div></>}
  {page==='Tenant profile requests'&&<div className="panel management-panel"><table><thead><tr><th>TENANT</th><th>REQUESTED CHANGE</th><th>DETAILS</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{tenants.find(t=>t.id===r.tenant_id)?.full_name||r.tenant_id}<small className="directory-subline">{tenants.find(t=>t.id===r.tenant_id)?.email}</small></td><td>{r.field_name?.replaceAll('_',' ')}<small className="directory-subline">{r.requested_value}</small></td><td>{r.note||'—'}</td><td>{r.status}</td><td>{r.status==='pending'?<div className="inline-actions"><button className="secondary-button" disabled={busy} onClick={()=>reviewProfileRequest(r,true)}>Approve</button><button className="secondary-button" disabled={busy} onClick={()=>reviewProfileRequest(r,false)}>Decline</button></div>:'Reviewed'}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No correction requests" text="Tenant requests to correct their name, phone, or permanent address will appear here."/>}</div>}
  {page==='Audit history'&&<div className="panel management-panel"><table><thead><tr><th>DATE</th><th>RECORD</th><th>ACTION</th><th>RECORD ID</th><th>CHANGE SUMMARY</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{new Date(r.created_at).toLocaleString()}</td><td>{r.table_name}</td><td>{r.action}</td><td>{r.record_id}</td><td>{Object.keys(r.new_data||r.old_data||{}).filter(k=>['name','full_name','status','amount','description','title'].includes(k)).map(k=>`${k}: ${(r.new_data||r.old_data)[k]}`).join(' · ')||'Record updated'}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No audit events" text="Changes to supported property, tenant, payment, staff and service records appear here after migration."/>}</div>}
  {page==='Email delivery'&&<div className="panel management-panel"><table><thead><tr><th>TENANT</th><th>RECIPIENT</th><th>STATUS</th><th>DETAIL</th><th>DATE</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.tenant_name||r.tenant_id||'—'}</td><td>{r.recipient_email||r.email||'—'}</td><td>{r.status||r.delivery_status||'—'}</td><td>{r.error_message||r.error||r.message||'—'}</td><td>{dateLabel((r.created_at||r.sent_at||'').slice(0,10))}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No email attempts yet" text="Tenant document emails sent by the Node service will show their delivery status here when row security permits."/>}</div>}
  {page==='Property messages'&&<><form className="panel maintenance-create" onSubmit={sendMessage}><h2>Start or continue a conversation</h2><label>Property contact<select required name="recipient_id"><option value="">Choose a linked account</option>{contacts.map(c=><option key={c.user_id} value={c.user_id}>{c.full_name} · {c.role} · {c.email}</option>)}</select></label><label>Message<textarea required name="body" maxLength="5000" rows="3"/></label><button className="primary-button" disabled={busy||!contacts.length}>Send message</button>{!contacts.length&&<small>Only registered contacts with a linked website login can receive messages here.</small>}</form><div className="panel management-panel"><table><thead><tr><th>DATE</th><th>FROM</th><th>TO</th><th>MESSAGE</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{new Date(r.created_at).toLocaleString()}</td><td>{r.sender_id===auth.id?'You':contacts.find(c=>c.user_id===r.sender_id)?.full_name||'Contact'}</td><td>{r.recipient_id===auth.id?'You':contacts.find(c=>c.user_id===r.recipient_id)?.full_name||'Contact'}</td><td>{r.body}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No messages" text="Messages with linked landlords, tenants, lawyers, agents and caretakers appear here."/>}</div></>}
  {feedback&&<p role="status" className="setup-note">{feedback}</p>}
  </section>;
}

function StakeholderPortal({ auth, role, tenant, contacts, cases, activeComplaint, setActiveComplaint, messages, onSend, onResolution, properties, onSubmitComplaint, notifications, onReadNotification, complaintUnreadCounts, onOpenComplaint, onSignOut, toast, onClearToast, onDownloadDocuments, tenantDocsBusy }) {
  const [newComplaint, setNewComplaint] = useState(false);
  const isTenant = role === 'tenant';
  const property = tenant?.property_id ? properties.find((item) => item.id === tenant.property_id) : null;
  const roleLabel = isTenant ? 'Tenant' : 'Property member';

  if (newComplaint) return <div className="brand-site theme-jade"><PublicComplaintRoom properties={properties} tenants={tenant ? [tenant] : []} recipients={contacts} roleDefault={isTenant ? 'Tenant' : ''} onBack={() => setNewComplaint(false)} onSubmit={async (event) => { const submitted = await onSubmitComplaint(event); if (submitted) setNewComplaint(false); }}/>{toast && <div className="toast"><Check size={16}/>{toast}<button aria-label="Dismiss notification" onClick={onClearToast}><X size={15}/></button></div>}</div>;

  return <div className="brand-site theme-jade">
    <header className="portal-header"><BrandLockup name="Yemilaz Properties" logo="horizon"/><div><PortalNotificationCenter notices={notifications} onRead={onReadNotification}/><span>{auth.email}</span><button className="secondary-button" onClick={onSignOut}><LogOut size={15}/> Log out</button></div></header>
    <main className="stakeholder-portal">
      <section className="panel tenant-profile-card"><div><span className="eyebrow">{roleLabel.toUpperCase()} PORTAL</span><h1>Welcome, {tenant?.full_name || auth.user_metadata?.full_name || 'Tenant'}</h1><p>Your property information, messages, complaints and tenancy documents are here.</p></div>{isTenant && <div className="welcome-actions"><button className="primary-button" onClick={() => setNewComplaint(true)}><Plus size={16}/> Lodge a complaint</button><button className="secondary-button" onClick={onDownloadDocuments} disabled={tenantDocsBusy}><Download size={15}/>{tenantDocsBusy ? 'Preparing PDFs…' : 'Download tenancy PDFs'}</button></div>}</section>
      {isTenant && <>
        <div className="tenant-profile-grid">
          <section className="panel tenant-profile-section"><span className="eyebrow">YOUR TENANCY PROFILE</span><h2>{tenant?.full_name || auth.user_metadata?.full_name || 'Tenant profile'}</h2><p>{tenant?.email || auth.email}</p><p>{tenant?.phone || 'Phone number not on file'}</p><p>{tenant?.permanent_address || 'Permanent address not on file'}</p><div className="tenant-profile-facts"><span>Lease start <b>{dateLabel(tenant?.lease_start)}</b></span><span>Lease end <b>{dateLabel(tenant?.lease_end)}</b></span><span>Status <b>{tenant?.status || 'Profile not linked'}</b></span></div></section>
          <section className="panel tenant-profile-section"><span className="eyebrow">YOUR PROPERTY</span><h2>{property?.name || 'Property not assigned'}</h2><p>{property ? [property.address, property.city, property.state, property.country].filter(Boolean).join(', ') : 'Your landlord can assign a property to your tenancy profile.'}</p>{tenant?.rent_amount != null && <p>Rent: <b>{currency(tenant.rent_amount)}</b></p>}<div className="tenant-profile-facts">{contacts.map((contact) => <span key={contact.id}>{contact.role === 'caretaker' ? 'Caretaker' : contact.role === 'lawyer' ? 'Lawyer' : contact.role === 'landlord' ? 'Landlord' : 'Agent'} <b>{contact.full_name}</b></span>)}</div></section>
        </div>
        {!tenant && <div className="panel tenant-profile-section" role="status"><span className="eyebrow">TENANCY LINK</span><h2>Your sign-in is active</h2><p>We could not find a tenancy record linked to <b>{auth.email}</b>. Ask your landlord to check that this is the email on your tenant record and resend your invitation if needed.</p></div>}
        {tenant && <TenantOperations auth={auth} tenant={tenant} properties={properties}/>}
      </>}
      <ComplaintInbox records={cases} activeComplaint={activeComplaint} setActiveComplaint={setActiveComplaint} messages={messages} onSend={onSend} onResolution={onResolution} currentUserId={auth.id} onNew={() => setNewComplaint(true)} unreadCounts={complaintUnreadCounts} onOpenComplaint={onOpenComplaint}/>
      {!isTenant && <section className="panel tenant-profile-section"><span className="eyebrow">YOUR ACCOUNT</span><h2>Property community profile</h2><p>{auth.user_metadata?.full_name || auth.email}</p><p>Use the complaint room to follow cases connected to this account.</p></section>}
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
  return <section className="management insights-page"><div className="welcome-row"><div><div className="eyebrow">WORKSPACE / PORTFOLIO INSIGHTS</div><h1>Property insights</h1><p>A live summary of your properties, leases, advertising, and recorded payments.</p></div><div className="welcome-actions"><button className="secondary-button" onClick={onExport}><Download size={15}/> Export report</button><button className="secondary-button" onClick={() => onNavigate('Properties')}><Building2 size={15}/> Manage properties</button></div></div>
    <div className="metric-grid insights-metrics"><Metric icon={Building2} label="Properties" value={reportProperties.length} note={reportProperty?'Selected property':'In your saved portfolio'} color="lavender"/><Metric icon={Users} label="Active tenants" value={activeTenants.length} note="In selected portfolio" color="mint"/><Metric icon={Home} label="Occupancy rate" value={`${occupancy}%`} note={`${occupied} occupied of ${reportProperties.length} properties`} color="blue"/><Metric icon={Wrench} label="Maintenance costs" value={currency(maintenanceTotal)} note={`${filteredMaintenance.length} recorded jobs in range`} color="peach"/></div>
    <div className="panel report-filters"><div><span className="eyebrow">REPORT FILTERS</span><h2>Filter rent, arrears, occupancy and costs</h2></div><label>Property<select value={reportProperty} onChange={e=>setReportProperty(e.target.value)}><option value="">All properties</option>{properties.map(property=><option key={property.id} value={property.id}>{property.name}</option>)}</select></label><label>From<input type="date" value={reportFrom} onChange={e=>setReportFrom(e.target.value)}/></label><label>To<input type="date" value={reportTo} onChange={e=>setReportTo(e.target.value)}/></label><button className="secondary-button" onClick={()=>{setReportFrom('');setReportTo('');setReportProperty('');}}>Clear filters</button></div>
    <div className="insights-summary-row"><div className="panel insight-money"><span className="eyebrow">RECORDED PAYMENT ACTIVITY</span><div><span>Paid charges</span><b>{currency(collected)}</b></div><div><span>Unpaid charges</span><b>{currency(outstanding)}</b></div><small>{filteredPayments.length} payment records in selected date range</small><button className="text-button" onClick={() => onNavigate('Payments & charges')}>Open payments <ArrowRight size={14}/></button><small>Totals use payment and charge records saved in this workspace.</small></div><div className="panel insight-chart"><div className="panel-heading"><div><span className="eyebrow">PORTFOLIO STATUS</span><h2>Property availability</h2></div><span className="count-badge">{properties.length}</span></div>{statusGroups.map((item) => <div className="insight-bar-row" key={item.label}><span>{item.label}</span><div className="insight-bar-track"><i style={{ width: `${Math.round((item.count / maxStatus) * 100)}%` }}/></div><b>{item.count}</b></div>)}{!properties.length && <p className="insight-empty">Add properties to see a portfolio breakdown.</p>}</div></div>
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

function NotificationsPage({ notices, onRead }) {
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">WORKSPACE / ACTIVITY</div><h1>Notifications</h1><p>New enquiries, viewing requests and property complaints for your workspace.</p></div></div><div className="panel management-panel"><div className="activity-list">{notices.map((notice) => <article className={`activity-item ${notice.read_at ? '' : 'notification-unread'}`} key={notice.id}><span className="activity-icon purple"><Bell size={15}/></span><div className="activity-copy"><b>{notice.title}</b><span>{notice.message}</span><small>{new Date(notice.created_at).toLocaleString()}</small></div>{!notice.read_at && <button className="secondary-button compact-button" onClick={() => onRead(notice)}>Mark read</button>}</article>)}{!notices.length && <EmptyState title="You’re all caught up" text="New activity notifications will appear here."/>}</div></div></section>;
}

function RentSchedulePage({ charges, tenants, onNavigate }) {
  const today = new Date().toISOString().slice(0,10);
  const rows = charges.filter((charge) => charge.category === 'rent' && charge.status !== 'voided').sort((a,b) => (a.due_date || '').localeCompare(b.due_date || ''));
  const pending = rows.filter((row) => row.status === 'unpaid');
  const overdue = pending.filter((row) => row.due_date && row.due_date < today);
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">WORKSPACE / RENT</div><h1>Rent schedule</h1><p>Recurring rent charges are created from each tenant’s lease and frequency. Follow up on outstanding rent directly.</p></div><button className="secondary-button" onClick={() => onNavigate('Payments & charges')}>Open payment ledger <ArrowRight size={15}/></button></div><div className="metric-grid"><Metric icon={CalendarDays} label="Scheduled charges" value={rows.length} note="Rent ledger entries" color="blue"/><Metric icon={Clock3} label="Due or upcoming" value={pending.length-overdue.length} note="Not yet marked paid" color="peach"/><Metric icon={Wallet} label="Overdue" value={overdue.length} note={currency(overdue.reduce((s,r)=>s+Number(r.amount||0),0))} color="lavender"/><Metric icon={Check} label="Paid" value={rows.filter((r)=>r.status==='paid').length} note="Rent payments recorded" color="mint"/></div><div className="panel management-panel"><div className="table-wrap"><table><thead><tr><th>TENANT</th><th>DESCRIPTION</th><th>DUE DATE</th><th>AMOUNT</th><th>STATUS</th><th>REMINDER</th></tr></thead><tbody>{rows.map((row)=><tr key={row.id}><td>{tenants.find((t)=>t.id===row.tenant_id)?.full_name||'—'}</td><td>{row.description}</td><td>{dateLabel(row.due_date)}</td><td>{currency(row.amount)}</td><td><span className={`status ${row.status==='paid'?'active':row.due_date<today?'renewal':'active'}`}><i/>{row.status==='paid'?'Paid':row.due_date<today?'Overdue':'Upcoming'}</span></td><td>{row.status==='unpaid'&&tenants.find((t)=>t.id===row.tenant_id)?.email?<a className="secondary-button compact-button" href={`mailto:${encodeURIComponent(tenants.find((t)=>t.id===row.tenant_id).email)}?subject=${encodeURIComponent('Rent reminder · Yemilaz Properties')}&body=${encodeURIComponent(`Hello ${tenants.find((t)=>t.id===row.tenant_id).full_name}, this is a reminder that ${currency(row.amount)} rent is due on ${dateLabel(row.due_date)}. Please contact your landlord if you have questions.`)}`}>Email reminder</a>:'—'}</td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="No rent schedule yet" text="Register a tenant with a lease, rent amount and frequency to generate future rent charges."/>}</div></div></section>;
}

function MaintenancePage({ records, properties, tenants, staff, userId, onSave, onUpdate }) {
  const [busy, setBusy] = useState(false);
  async function submit(event) { event.preventDefault(); const form=event.currentTarget; const values=new FormData(form); setBusy(true); const invoice=values.get('invoice'); const result=await onSave({owner_id:userId,created_by:userId,requester_role:'landlord',property_id:values.get('property_id')||null,tenant_id:values.get('tenant_id')||null,title:String(values.get('title')).trim(),description:String(values.get('description')).trim(),priority:values.get('priority'),assigned_staff_id:values.get('assigned_staff_id')||null,due_date:values.get('due_date')||null,vendor_name:values.get('vendor_name')||null,actual_cost:values.get('actual_cost')?Number(values.get('actual_cost')):null},invoice); setBusy(false); if(result)form.reset(); }
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">WORKSPACE / PROPERTY CARE</div><h1>Maintenance</h1><p>Log repairs, assign a caretaker or agent, track work, and record vendor costs.</p></div></div><form className="panel maintenance-create" onSubmit={submit}><h2>Log a maintenance request</h2><div className="form-row"><label>Issue title<input name="title" required minLength="3" maxLength="160" placeholder="e.g. Repair leaking kitchen tap"/></label><label>Priority<select name="priority"><option value="normal">Normal</option><option value="low">Low</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div><label>Description<textarea name="description" required minLength="10" maxLength="4000" rows="3" placeholder="Describe the issue and access arrangements"/></label><div className="form-row"><label>Property<select name="property_id"><option value="">Select property</option>{properties.map((p)=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label><label>Tenant<select name="tenant_id"><option value="">Not tenant reported</option>{tenants.map((t)=><option value={t.id} key={t.id}>{t.full_name}</option>)}</select></label></div><div className="form-row"><label>Assign to<select name="assigned_staff_id"><option value="">Unassigned</option>{staff.map((s)=><option value={s.id} key={s.id}>{s.full_name} · {s.role}</option>)}</select></label><label>Target date<input name="due_date" type="date"/></label></div><div className="form-row"><label>Vendor / contractor<input name="vendor_name" placeholder="Company or tradesperson"/></label><label>Estimated / actual cost (₦)<input name="actual_cost" type="number" min="0" step="0.01"/></label></div><label>Vendor invoice / work photo (optional, PDF or image)<input type="file" name="invoice" accept="application/pdf,image/jpeg,image/png,image/webp"/></label><button className="primary-button" disabled={busy}>{busy?'Saving…':'Create request'}</button></form><div className="panel management-panel"><div className="table-wrap"><table><thead><tr><th>ISSUE</th><th>PROPERTY</th><th>VENDOR / COST</th><th>ASSIGNED TO</th><th>PRIORITY</th><th>STATUS</th><th>UPDATE</th><th>INVOICE</th></tr></thead><tbody>{records.map((r)=><tr key={r.id}><td><b>{r.title}</b><small className="directory-subline">{r.description}</small></td><td>{properties.find((p)=>p.id===r.property_id)?.name||'—'}</td><td>{r.vendor_name||'—'}{r.actual_cost!=null&&<small className="directory-subline">{currency(r.actual_cost)}</small>}</td><td>{staff.find((s)=>s.id===r.assigned_staff_id)?.full_name||'Unassigned'}</td><td>{r.priority}</td><td>{r.status.replaceAll('_',' ')}</td><td><select value={r.status} onChange={(e)=>onUpdate(r,{status:e.target.value,completed_at:e.target.value==='completed'?new Date().toISOString():null})}><option value="open">Open</option><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="waiting">Waiting</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td><td>{r.invoice_path?<button className="text-button" onClick={async()=>{const {data,error}=await supabase.storage.from('maintenance-invoices').createSignedUrl(r.invoice_path,60);if(error)setToast(error.message);else window.open(data.signedUrl,'_blank','noopener,noreferrer');}}>Open file</button>:'—'}</td></tr>)}</tbody></table>{!records.length&&<EmptyState title="No maintenance requests" text="Log the first repair or property-care task above."/>}</div></div></section>;
}

function ViewingCalendarPage({ requests, onUpdate, properties }) {
  const ordered=[...requests].sort((a,b)=>(a.requested_at||'').localeCompare(b.requested_at||''));
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">WORKSPACE / VIEWINGS</div><h1>Viewing calendar</h1><p>One place to review requested, confirmed and completed property viewings.</p></div></div><div className="panel management-panel"><div className="viewing-calendar-list">{ordered.map((item)=><article className="viewing-calendar-card" key={item.id}><div className="calendar-date"><CalendarDays size={19}/><b>{item.requested_at?new Date(item.requested_at).toLocaleDateString('en-NG',{day:'2-digit',month:'short'}):'TBC'}</b><small>{item.requested_at?new Date(item.requested_at).toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'}):''}</small></div><div><h3>{item.name} · {properties.find((p)=>p.id===item.property_id)?.name||item.property_name||'Property'}</h3><p>{item.email}{item.phone?` · ${item.phone}`:''}</p><span className="invite-status">{item.status}</span></div><select aria-label={`Update viewing for ${item.name}`} value={item.status} onChange={(e)=>onUpdate(item,e.target.value)}><option value="new">New</option><option value="confirmed">Confirmed</option><option value="declined">Declined</option><option value="completed">Completed</option></select></article>)}{!ordered.length&&<EmptyState title="No viewing requests" text="New requests from prospective visitors will appear here."/>}</div></div></section>;
}

function TenancySignaturesPage({ tenants, profile, auth }) {
  const [docs,setDocs]=useState([]); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
  async function load(){if(!supabase)return;const {data,error}=await supabase.from('tenancy_signatures').select('*').order('signed_at',{ascending:false});if(error)setMessage(error.message);else setDocs(data||[]);}
  useEffect(()=>{load();},[]);
  async function create(event){event.preventDefault();const formElement=event.currentTarget;const form=new FormData(formElement);const tenant=tenants.find((t)=>t.id===form.get('tenant_id'));if(!tenant)return;setBusy(true);const type=form.get('document_type');const text=type==='house_rules'?(profile?.house_rules||'Use the premises only for the purpose permitted by the signed agreement and applicable requirements. Keep the premises and shared areas reasonably clean and unobstructed. Take reasonable care of supplied fixtures and equipment. Obtain required written approval before structural work or a material change of use. Report damage, faults, hazards and security concerns promptly. Use utilities responsibly, store items only in approved areas, and follow applicable safety, waste and community requirements. These rules apply alongside the signed agreement and local law; the agreement and applicable law take precedence.'):type==='handover'?`Property handover checklist for ${tenant.full_name} at tenancy ${tenant.id}.`:(profile?.agreement_template||'Tenancy agreement terms to be reviewed and completed by the parties.') ;const {error}=await supabase.from('tenancy_signatures').insert({tenant_id:tenant.id,owner_id:auth.id,document_type:type,document_text:text,signer_id:auth.id,signer_role:'landlord',signer_name:profile?.full_name||auth.email,signature_text:String(form.get('signature')).trim()});setBusy(false);if(error)setMessage(error.message);else{formElement.reset();setMessage('Your signature was recorded. The tenant can now review and sign from their account.');load();}}
  const types={tenancy_agreement:'Tenancy agreement',house_rules:'Property rules',handover:'Property handover'};
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">WORKSPACE / TENANCY DOCUMENTS</div><h1>Documents &amp; signatures</h1><p>Save a versioned document snapshot and capture each party’s typed signature and timestamp.</p></div></div><form className="panel maintenance-create" onSubmit={create}><h2>Prepare a document for signature</h2><div className="form-row"><label>Tenant<select required name="tenant_id" defaultValue=""><option value="">Choose tenant</option>{tenants.map((t)=><option value={t.id} key={t.id}>{t.full_name}</option>)}</select></label><label>Document<select name="document_type"><option value="tenancy_agreement">Tenancy agreement</option><option value="house_rules">Property rules</option><option value="handover">Property handover</option></select></label></div><label>Landlord typed signature<input name="signature" required minLength="2" maxLength="120" placeholder={profile?.full_name||'Type your full name'}/></label><p className="setup-note">This records typed names and timestamps; it is not a certified digital-signature service. Review agreement wording with a qualified lawyer.</p><button className="primary-button" disabled={busy||!tenants.length}>{busy?'Saving…':'Sign and share with tenant'}</button>{message&&<p role="status" className="setup-note">{message}</p>}</form><div className="panel management-panel"><h2>Signature history</h2><div className="table-wrap"><table><thead><tr><th>TENANT</th><th>DOCUMENT</th><th>SIGNED BY</th><th>ROLE</th><th>DATE</th><th>DOCUMENT COPY</th></tr></thead><tbody>{docs.map((d)=><tr key={d.id}><td>{tenants.find((t)=>t.id===d.tenant_id)?.full_name||'Tenant'}</td><td>{types[d.document_type]}</td><td>{d.signer_name}</td><td>{d.signer_role}</td><td>{new Date(d.signed_at).toLocaleString()}</td><td><details><summary>View snapshot</summary><pre className="document-snapshot">{d.document_text}</pre></details></td></tr>)}</tbody></table>{!docs.length&&<EmptyState title="No signatures yet" text="Prepare a document above to start the signature record."/>}</div></div></section>;
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

function EditPersonModal({ person, saving, onSave, onClose }) {
  const isTenant = person.kind === 'tenant';
  const isGuarantor = person.kind === 'guarantor';
  const heading = isTenant ? 'Edit tenant' : isGuarantor ? 'Edit guarantor' : `Edit ${person.role === 'caretaker' ? 'caretaker' : person.role === 'lawyer' ? 'lawyer' : 'agent'}`;
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal" onSubmit={onSave}>
    <div className="modal-heading"><div><span className="eyebrow">PEOPLE DIRECTORY</span><h2>{heading}</h2><p>Update this contact in your landlord workspace.</p></div><button type="button" className="icon-button" aria-label="Close edit form" onClick={onClose}><X size={19}/></button></div>
    <label>Full name<input required name="full_name" defaultValue={person.full_name}/></label>
    <div className="form-row"><label>Email<input name="email" type="email" defaultValue={person.email || ''}/></label><label>Phone<input name="phone" defaultValue={person.phone || ''}/></label></div>
    {isTenant && <><div className="form-row"><label>Lease start<input name="lease_start" type="date" defaultValue={person.lease_start || ''}/></label><label>Lease end<input name="lease_end" type="date" defaultValue={person.lease_end || ''}/></label></div><label>Rent amount (₦)<input name="rent_amount" type="number" min="0" step="0.01" defaultValue={person.rent_amount || 0}/></label><label>Notes<input name="notes" defaultValue={person.notes || ''}/></label><p className="setup-note">Property allocation and payment history are preserved.</p></>}
    {isGuarantor && <><div className="form-row"><label>Relationship<input name="relationship" defaultValue={person.relationship || ''}/></label><label>Occupation<input name="occupation" defaultValue={person.occupation || ''}/></label></div><label>Address<input name="address" defaultValue={person.address || ''}/></label></>}
    {!isTenant && !isGuarantor && <><label>Role<select name="role" defaultValue={person.role || 'agent'}><option value="agent">Agent</option><option value="caretaker">Caretaker</option><option value="lawyer">Lawyer</option></select><small>Changing this updates the linked profile’s access and workspace.</small></label><label>Notes<input name="notes" defaultValue={person.notes || ''}/></label></>}
    <div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
  </form></div>;
}

function TransactionEditModal({ transaction, tenants, saving, onSave, onClose }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal" onSubmit={onSave}>
    <div className="modal-heading"><div><span className="eyebrow">PAYMENTS &amp; CHARGES</span><h2>Edit transaction</h2><p>Update the record. Voided transactions remain in the audit history.</p></div><button type="button" className="icon-button" onClick={onClose}><X size={19}/></button></div>
    <label>Description<input required name="description" defaultValue={transaction.description}/></label>
    <div className="form-row"><label>Tenant<select name="tenant_id" defaultValue={transaction.tenant_id || ''}><option value="">Property / general charge</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.full_name}</option>)}</select></label><label>Category<select name="category" defaultValue={transaction.category || 'other'}><option value="rent">Rent</option><option value="deposit">Deposit</option><option value="utilities">Utilities</option><option value="maintenance">Maintenance</option><option value="security">Security</option><option value="cleaning">Cleaning</option><option value="other">Other</option></select></label></div>
    <label>Amount (₦)<input required name="amount" type="number" min="0" step="0.01" defaultValue={transaction.amount}/></label>
    <div className="form-row"><label>Status<select name="status" defaultValue={transaction.status}><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="waived">Waived</option></select></label><label>Due date<input name="due_date" type="date" defaultValue={transaction.due_date || ''}/></label></div>
    <label>Paid date<input name="paid_at" type="date" defaultValue={transaction.paid_at || ''}/></label>
    <div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
  </form></div>;
}

function ManagementPage({ page, tenants, records, query, setQuery, openModal, onDeleteProperty, onEditPerson, onDeletePerson, onToggleAdvertisement, onRequestVerification, onUpdateViewingStatus, onUpdateListingReport, onUpdatePropertyStatus, onAllocate, onRecordPayment, onEditTransaction, onVoidTransaction, onSendPacket, sendingTenant, onDownloadPdfs, downloadingTenant, hasPaid }) {
  const copy = {
    Properties: ['Property portfolio', 'Delete properties, manage availability, and choose which available homes appear on the dashboard.'],
    Tenants: ['Tenant directory', 'Register tenants, record payments, and allocate available properties after payment.'],
    'Payments & charges': ['Payments & service charges', 'Record every rent payment, deposit, utility, maintenance and other property charge.'],
    Guarantors: ['Guarantor records', 'Keep tenant guarantor details available when you need them.'],
    Caretakers: ['Caretaker directory', 'Coordinate on-site teams across your properties.'],
    Lawyers: ['Lawyer directory', 'Connect your legal adviser with the tenants and property team involved in your portfolio.'],
    Agents: ['Agent directory', 'Your trusted partners for letting and sales.'],
    Enquiries: ['Property enquiries', 'Follow up with people interested in your advertised properties.'],
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
    Enquiries: [['Property', 'property_name'], ['Name', 'name'], ['Email', 'email'], ['Phone', 'phone'], ['Message', 'message'], ['Received', 'created_at']],
    'Property requests': [['Name', 'requester_name'], ['Email', 'requester_email'], ['Phone', 'requester_phone'], ['Looking for', 'property_type'], ['Purpose', 'listing_type'], ['Location', 'request_location'], ['Land size', 'land_size'], ['Bedrooms', 'bedrooms'], ['Budget', 'budget'], ['Details', 'details'], ['Received', 'created_at']],
    'Viewing requests': [['Property', 'property_name'], ['Name', 'name'], ['Email', 'email'], ['Phone', 'phone'], ['Requested time', 'requested_at'], ['Status', 'status']],
    'Listing reports': [['Property', 'property_name'], ['Reason', 'reason'], ['Details', 'details'], ['Reporter', 'reporter_email'], ['Status', 'status'], ['Received', 'created_at']],
  }[page] || [];
  const filtered = records.filter((record) => {
    const tenantName = tenants.find((tenant) => tenant.id === record.tenant_id)?.full_name || '';
    return `${Object.values(record).join(' ')} ${tenantName}`.toLowerCase().includes(query.toLowerCase());
  });
  const value = (key, item, record) => {
    if (key === 'price' || key === 'amount') return currency(item);
    if (key === 'budget') return item ? currency(item) : 'Flexible';
    if (key === 'request_location') return [record.city, record.state, record.country].filter(Boolean).join(', ');
    if (key === 'tenant_name') return tenants.find((tenant) => tenant.id === item.tenant_id)?.full_name || 'General/property charge';
    if (key === 'status') return item === 'available' ? 'Available' : item === 'occupied' ? 'Rented' : item === 'reserved' || item === 'under_offer' ? 'Reserved' : item === 'sold' ? 'Sold' : item === 'paid' ? 'Paid' : item === 'unpaid' ? 'Unpaid' : item === 'waived' ? 'Waived' : item === 'voided' ? 'Voided' : item || '—';
    if (key === 'listing_type') return item === 'sale' ? 'Buy' : item === 'rent' ? 'Rent' : item || '—';
    if (key === 'created_at' || key === 'requested_at') return item ? new Date(item).toLocaleString() : '—';
    if (key === 'paid_at' || key === 'due_date') return item ? dateLabel(item) : '—';
    return item || '—';
  };
  const canAdd = ['Tenants','Properties','Payments & charges','Guarantors','Caretakers','Agents','Lawyers'].includes(page);
  const renderCell = (record, key) => page === 'Payments & charges' && key === 'evidence_path' ? record.evidence_path ? <button className="text-button" onClick={async()=>{const {data,error}=await supabase.storage.from('payment-evidence').createSignedUrl(record.evidence_path,60);if(error)window.alert(`Could not open payment evidence: ${error.message}`);else window.open(data.signedUrl,'_blank','noopener,noreferrer');}}>View evidence</button> : '—' : page === 'Viewing requests' && key === 'status' ? <select aria-label={`Update viewing request for ${record.name}`} value={record.status} onChange={(event) => onUpdateViewingStatus(record, event.target.value)}><option value="new">New</option><option value="confirmed">Confirmed</option><option value="declined">Declined</option><option value="completed">Completed</option></select> : page === 'Listing reports' && key === 'status' ? <select aria-label={`Update report status for ${record.property_name}`} value={record.status} onChange={(event) => onUpdateListingReport(record, event.target.value)}><option value="new">New</option><option value="reviewed">Reviewed</option><option value="actioned">Actioned</option><option value="dismissed">Dismissed</option></select> : page === 'Properties' && key === 'status' ? <select aria-label={`Update status for ${record.name}`} value={record.status} onChange={(event) => onUpdatePropertyStatus(record, event.target.value)}><option value="available">Available</option><option value="reserved">Reserved</option><option value="occupied">Rented</option><option value="sold">Sold</option></select> : value(key, key === 'tenant_name' ? record : record[key], record);
  return <section className="management"><div className="welcome-row"><div><div className="eyebrow">WORKSPACE / {page.toUpperCase()}</div><h1>{copy[0]}</h1><p>{copy[1]}</p></div>{canAdd && <button className="primary-button" onClick={openModal}><Plus size={17}/>{page === 'Tenants' ? 'Register a tenant' : page === 'Properties' ? 'Add a property' : page === 'Payments & charges' ? 'Record a payment' : 'Add a record'}</button>}</div>
    <div className="panel management-panel"><div className="panel-heading"><div><h2>{page}</h2><span className="management-sub">{page === 'Tenants' ? `${tenants.length} tenant records` : `${records.length} records`}</span></div><button className="filter-button" onClick={onRecordPayment}><Filter size={15}/> Filters <ChevronDown size={13}/></button></div><label className="search-box wide-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${page.toLowerCase()}...`}/></label>
      {page === 'Tenants' ? <div className="table-wrap"><table><thead><tr><th>TENANT</th><th>PROPERTY</th><th>LEASE START</th><th>STATUS</th><th>RENT</th><th>PAYMENT</th><th>ACTION</th></tr></thead><tbody>{tenants.filter((tenant) => `${tenant.name} ${tenant.property}`.toLowerCase().includes(query.toLowerCase())).map((tenant, index) => <tr key={tenant.id}><td><div className="tenant-cell"><div className={`tenant-avatar avatar-${index % 4}`}>{tenant.initials}</div><b>{tenant.name}</b></div></td><td>{tenant.property}</td><td>{tenant.date}</td><td><span className={`status ${tenant.displayStatus === 'Active' ? 'active' : 'renewal'}`}><i/>{tenant.displayStatus}</span></td><td className="rent-cell">{tenant.rent}</td><td>{hasPaid(tenant.id) ? 'Payment recorded' : 'No payment'}</td><td><div className="row-actions"><button className="secondary-button compact-button" onClick={() => hasPaid(tenant.id) ? onAllocate(tenant) : onRecordPayment()}>{tenant.property_id ? 'Change property' : hasPaid(tenant.id) ? 'Allocate' : 'Record payment'}</button><button className="secondary-button compact-button" disabled={sendingTenant === tenant.id} onClick={() => onSendPacket(tenant.id)}>{sendingTenant === tenant.id ? 'Sending…' : 'Send PDFs'}</button><button className="secondary-button compact-button" disabled={downloadingTenant === tenant.id} onClick={() => onDownloadPdfs(tenant.id)}>{downloadingTenant === tenant.id ? 'Generating…' : 'Download PDFs'}</button><button className="secondary-button compact-button" onClick={() => onEditPerson(tenant, 'tenant')}>Edit</button><button className="danger-button" onClick={() => onDeletePerson(tenant, 'tenant')}><Trash2 size={15}/><span>Delete</span></button></div></td></tr>)}</tbody></table>{tenants.length === 0 && <EmptyState title="No tenants yet" text="Register a tenant to start recording leases and payments."/>}</div>
      : filtered.length ? <div className="table-wrap"><table><thead><tr>{columns.map(([label]) => <th key={label}>{label.toUpperCase()}</th>)}{['Properties','Guarantors','Caretakers','Agents','Lawyers','Property requests','Payments & charges'].includes(page) && <th>ACTION</th>}</tr></thead><tbody>{filtered.map((record, index) => <tr key={record.id || index}>{columns.map(([label, key]) => <td key={key}>{renderCell(record, key)}</td>)}{page === 'Payments & charges' && <td><div className="row-actions"><button className="secondary-button compact-button" disabled={record.status === 'voided'} onClick={() => onEditTransaction(record)}>Edit</button><button className="danger-button" disabled={record.status === 'voided'} onClick={() => onVoidTransaction(record)}><span>{record.status === 'voided' ? 'Voided' : 'Void'}</span></button></div></td>}{['Guarantors','Caretakers','Agents','Lawyers'].includes(page) && <td><div className="row-actions"><button className="secondary-button compact-button" onClick={() => onEditPerson(record, page === 'Guarantors' ? 'guarantor' : 'staff')}>Edit</button><button className="danger-button" onClick={() => onDeletePerson(record, page === 'Guarantors' ? 'guarantor' : 'staff')}><Trash2 size={15}/><span>Delete</span></button></div></td>}{page === 'Property requests' && <td><div className="row-actions"><a className="secondary-button compact-button" href={`mailto:${encodeURIComponent(record.requester_email)}?subject=${encodeURIComponent('Your property request on Yemilaz Properties')}`}>Email requester</a></div></td>}{page === 'Properties' && <td><div className="row-actions"><button className="secondary-button compact-button" disabled={record.status !== 'available'} onClick={() => onToggleAdvertisement(record)}>{record.is_advertised ? 'Hide ad' : 'Advertise'}</button><button className="secondary-button compact-button" disabled={record.verification_status === 'verified' || record.verification_status === 'pending'} onClick={() => onRequestVerification(record)}>{record.verification_status === 'verified' ? 'Verified' : record.verification_status === 'pending' ? 'Review pending' : 'Request verification'}</button><button className="danger-button" title={`Delete ${record.name}`} onClick={() => onDeleteProperty(record)}><Trash2 size={15}/><span>Delete</span></button></div></td>}</tr>)}</tbody></table></div>
      : <EmptyState title={page === 'Property requests' ? 'No property requests yet' : `No ${page.toLowerCase()} yet`} text={page === 'Properties' ? 'Add a property, then choose whether to advertise it on the dashboard.' : page === 'Payments & charges' ? 'Record rent, deposit and service payments here.' : page === 'Property requests' ? 'New requests from visitors will appear here while your account is opted in under Landlord profile.' : `Add your first ${page.toLowerCase()} record to get started.`} action={canAdd ? openModal : undefined}/>}</div>
    </section>;
}

function EmptyState({ title, text, action }) {
  return <div className="empty-management"><span><Building2 size={23}/></span><h3>{title}</h3><p>{text}</p>{action && <button className="secondary-button" onClick={action}><Plus size={15}/> Add a record</button>}</div>;
}

createRoot(document.getElementById('root')).render(<App/>);
