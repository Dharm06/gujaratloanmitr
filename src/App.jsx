import { useState, useMemo, useEffect, useRef } from "react";

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function calcEMI(p, r, n) {
  const m = r / 12 / 100;
  if (m === 0) return p / n;
  return (p * m * Math.pow(1 + m, n)) / (Math.pow(1 + m, n) - 1);
}
function calcSchedule(p, r, n) {
  const emi = calcEMI(p, r, n);
  let bal = p;
  return Array.from({ length: n }, (_, i) => {
    const interest = bal * (r / 12 / 100);
    const principal = emi - interest;
    bal = Math.max(0, bal - principal);
    return { month: i + 1, emi: Math.round(emi), interest: Math.round(interest), principal: Math.round(principal), balance: Math.round(bal) };
  });
}
const fmt = n => "₹" + Math.round(n).toLocaleString("en-IN");
const fmtL = n => n >= 10000000 ? `₹${(n / 10000000).toFixed(0)}Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${(n / 1000).toFixed(0)}K`;
const formatRateRange = (rate, maxRate) => {
  const start = Number(rate) || 0;
  const end = Number(maxRate) || start;
  return start === end ? `${start}%` : `${start}% – ${end}%`;
};

// ─── BANK LOGOS ───────────────────────────────────────────────────────────────
const BASE = "https://raw.githubusercontent.com/praveenpuglia/indian-banks/main/assets/logos";
const LOGOS = { sbi: `${BASE}/sbin.svg`, hdfc: `${BASE}/hdfc.svg`, icici: `${BASE}/icic.svg`, bob: `${BASE}/barb.svg`, pnb: `${BASE}/punb.svg`, axis: `${BASE}/utib.svg`, kotak: `${BASE}/kkbk.svg`, indusind: `${BASE}/indb.svg`, union: `${BASE}/ubin.svg`, canara: `${BASE}/cnrb.svg`, yes: `${BASE}/yesb.svg`, federal: `${BASE}/fdrl.svg`, idfc: `${BASE}/idfb.svg`, ujjivan: `${BASE}/ujvn.svg` };

function BankLogo({ slug, name, size = 40 }) {
  const [err, setErr] = useState(false);
  if (!slug || !LOGOS[slug] || err) return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "rgba(184,134,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 900, color: "#B8860B", flexShrink: 0 }}>{name.charAt(0)}</div>
  );
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "#fff", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 4, boxSizing: "border-box", border: "1px solid rgba(0,0,0,0.08)" }}>
      <img src={LOGOS[slug]} alt={name} onError={() => setErr(true)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
}

function LoanTypeLogo({ type, size = 20, style = {} }) {
  const meta = LOAN_META[type];
  const src = meta?.logo;
  if (!src) return <span style={{ fontSize: size * 0.9, ...style }}>{meta?.icon || "🏦"}</span>;
  return <img src={src} alt={meta?.label || type} style={{ width: size, height: size, objectFit: "contain", display: "block", ...style }} />;
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ active, setPage, isGu }) {
  const items = [
    { id: "home", icon: "🏠", label: isGu ? "હોમ" : "Home" },
    { id: "compare", icon: "🔍", label: isGu ? "સરખાવો" : "Compare" },
    { id: "emi", icon: "🧮", label: "EMI" },
    { id: "schemes", icon: "🏛️", label: isGu ? "યોજના" : "Schemes" },
    { id: "dsas", icon: "🤝", label: isGu ? "DSA" : "DSA Profiles" },
    { id: "news", icon: "📰", label: isGu ? "સમાચાર" : "News" },
  ];
  return (
    <div className="mobile-nav" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(255,255,255,0.98)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(184,134,11,0.15)", padding: "10px 0 20px", display: "flex", justifyContent: "space-around", zIndex: 50, boxShadow: "0 -4px 20px rgba(0,0,0,0.04)" }}>
      {items.map(nav => (
        <button key={nav.id} onClick={() => setPage(nav.id)} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "2px 8px" }}>
          <span style={{ fontSize: 22 }}>{nav.icon}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: active === nav.id ? "#B8860B" : "rgba(43,33,21,0.35)", whiteSpace: "nowrap" }}>{nav.label}</span>
          {active === nav.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#B8860B" }} />}
        </button>
      ))}
    </div>
  );
}

function DesktopChrome({ active, setPage, isGu, setShowSearch }) {
  const items = [
    { id: "home", icon: "⌂", label: isGu ? "હોમ" : "Overview" },
    { id: "compare", icon: "⌕", label: isGu ? "સરખાવો" : "Compare Loans" },
    { id: "emi", icon: "∑", label: "EMI Calculator" },
    { id: "schemes", icon: "▣", label: isGu ? "યોજના" : "Government Schemes" },
    { id: "dsas", icon: "♙", label: isGu ? "DSA" : "DSA Profiles" },
    { id: "news", icon: "◈", label: isGu ? "સમાચાર" : "News & Alerts" },
  ];
  return (
    <aside className="desktop-sidebar">
      <div className="desktop-menu-label">{isGu ? "મુખ્ય મેનુ" : "MAIN MENU"}</div>
      <nav>
        {items.map(item => (
          <button className={`desktop-nav-item ${active === item.id ? "active" : ""}`} key={item.id} onClick={() => setPage(item.id)}>
            <span className="desktop-nav-icon">{item.icon}</span><span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="desktop-sidebar-card">
        <span className="desktop-sidebar-card-icon">✓</span>
        <strong>Indicative information</strong>
        <p>Rates and charges are indicative and may change. Please confirm current terms directly with the lender before applying.</p>
      </div>
      <div className="desktop-sidebar-footer">ગુજરાત માટે બનાવેલ<br /><span>Secure · Simple · Transparent</span></div>
    </aside>
  );
}

function AdminPage({ lang, setLang, bankData, setBankData, schemes, setSchemes, dsaProfiles, setDsaProfiles, nbfcs, setNbfcs }) {
  const [authenticated, setAuthenticated] = useState(() => Boolean(sessionStorage.getItem("adminToken")));
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [loanType, setLoanType] = useState("home");
  const [bankId, setBankId] = useState(bankData.home?.[0]?.id);
  const [schemeId, setSchemeId] = useState(schemes[0]?.id || "");
  const [schemeStatus, setSchemeStatus] = useState("");
  const [dsaId, setDsaId] = useState(dsaProfiles[0]?.id || "");
  const [dsaStatus, setDsaStatus] = useState("");
  const [nbfcStatus, setNbfcStatus] = useState("");
  const [newNbfc, setNewNbfc] = useState({ name: "", short: "", loanType: "home", rate: "10", maxRate: "12", fee: "2", approval: "70", maxLoan: "1000000", tenure: "1-5 yrs", city: "" });
  const isGu = lang === "gu";
  const banks = bankData[loanType] || [];
  const selected = banks.find(bank => bank.id === Number(bankId)) || banks[0];

  const login = async (event) => {
    event.preventDefault();
    setLoginError("");
    const response = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setLoginError(result.error || "Unable to sign in");
      return;
    }
    const result = await response.json();
    sessionStorage.setItem("adminToken", result.token);
    setAuthenticated(true);
    setPassword("");
  };

  useEffect(() => {
    fetch("/api/rates")
      .then(response => {
        if (!response.ok) throw new Error(`Rates API returned ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data.rates)) return;
        setBankData(current => ({
          ...current,
          ...Object.fromEntries(Object.entries(current).map(([loanType, banks]) => [loanType, banks.map(bank => {
            const saved = data.rates.find(rate => rate.loan_type === loanType && rate.bank_id === bank.id);
            return saved ? { ...bank, rate: Number(saved.rate), maxRate: Number(saved.max_rate), fee: Number(saved.fee) } : bank;
          })])),
        }));
      })
      .catch(error => console.warn("Saved rates unavailable; showing default rates.", error));
  }, []);

  useEffect(() => {
    fetch("/api/nbfcs")
      .then(response => {
        if (!response.ok) throw new Error(`NBFC API returned ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data.nbfcs)) {
          setNbfcs(data.nbfcs);
          setBankData(current => ({
            ...current,
            ...Object.fromEntries(Object.entries(LOAN_META).map(([type]) => {
              const existing = current[type] || [];
              const additions = data.nbfcs.filter(nbfc => nbfc.loanType === type && !existing.some(bank => bank.id === nbfc.id));
              return [type, [...existing, ...additions]];
            })),
          }));
        }
      })
      .catch(error => console.warn("Saved NBFCs unavailable; showing the built-in lenders.", error));
  }, []);

  useEffect(() => {
    fetch("/api/dsas", { headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } })
      .then(response => {
        if (!response.ok) throw new Error(`DSA API returned ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data.profiles) && data.profiles.length > 0) {
          setDsaProfiles(current => [...current.filter(profile => !data.profiles.some(saved => saved.id === profile.id)), ...data.profiles]);
        }
      })
      .catch(error => console.warn("Saved DSA profiles unavailable; showing default profiles.", error));
  }, []);

  useEffect(() => {
    fetch("/api/schemes")
      .then(response => {
        if (!response.ok) throw new Error(`Schemes API returned ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data.schemes) && data.schemes.length > 0) {
          setSchemes(current => {
            const savedById = new Map(data.schemes.map(scheme => [scheme.id, scheme]));
            return [...current.map(scheme => savedById.get(scheme.id) || scheme), ...data.schemes.filter(scheme => !current.some(existing => existing.id === scheme.id))];
          });
        }
      })
      .catch(error => console.warn("Saved schemes unavailable; showing default schemes.", error));
  }, []);

  useEffect(() => {
    setBankId(bankData[loanType]?.[0]?.id);
  }, [loanType, bankData]);

  const updateSelected = (field, value) => {
    if (!selected) return;
    setBankData(current => ({
      ...current,
      [loanType]: current[loanType].map(bank => bank.id === selected.id ? { ...bank, [field]: Number(value) } : bank),
    }));
  };

  const saveRates = async () => {
    setSaveStatus("Saving...");
    const rates = Object.entries(bankData).flatMap(([loanType, banks]) => banks.map(bank => ({
      loanType,
      bankId: bank.id,
      rate: bank.rate,
      maxRate: bank.maxRate,
      fee: bank.fee,
    })));
    const response = await fetch("/api/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("adminToken")}` },
      body: JSON.stringify({ rates }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setSaveStatus(result.error || "Unable to save rates");
      return;
    }
    setSaveStatus("Rates saved for all users");
  };

  const selectedScheme = schemes.find(scheme => scheme.id === schemeId) || schemes[0];
  const updateScheme = (field, value) => {
    if (!selectedScheme) return;
    setSchemes(current => current.map(scheme => scheme.id === selectedScheme.id ? { ...scheme, [field]: value } : scheme));
  };
  const addScheme = () => {
    const id = `scheme-${Date.now()}`;
    const scheme = {
      id, name: "New Government Scheme", nameGu: "", icon: "🏛️", color: "#B8860B",
      tag: "Business", tagGu: "", deadline: null, oneLiner: "", oneLinerGu: "",
      limit: "", limitGu: "", rate: "", rateGu: "", fee: "", feeGu: "",
      whyGood: [], whyGoodGu: [], categories: [], eligibility: [], eligibilityGu: [],
      whereToApply: "", whereToApplyGu: "",
    };
    setSchemes(current => [...current, scheme]);
    setSchemeId(id);
  };
  const saveSchemes = async () => {
    setSchemeStatus("Saving...");
    const response = await fetch("/api/schemes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("adminToken")}` },
      body: JSON.stringify({ schemes }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setSchemeStatus(result.error || "Unable to save schemes");
      return;
    }
    setSchemeStatus("Government schemes saved for all users");
  };
  const selectedDsa = dsaProfiles.find(profile => profile.id === dsaId) || dsaProfiles[0];
  const updateDsa = (field, value) => {
    if (!selectedDsa) return;
    setDsaProfiles(current => current.map(profile => profile.id === selectedDsa.id ? { ...profile, [field]: value } : profile));
  };
  const addDsa = () => {
    const id = `dsa-${Date.now()}`;
    setDsaProfiles(current => [...current, { id, name: "New DSA", photo: "", workspacePhoto1: "", workspacePhoto2: "", designation: "Loan Advisor", city: "", phone: "", email: "", experience: "", description: "", specializations: "", languages: "Gujarati, Hindi, English", published: true }]);
    setDsaId(id);
  };
  const saveDsas = async () => {
    setDsaStatus("Saving...");
    const response = await fetch("/api/dsas", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("adminToken")}` },
      body: JSON.stringify({ profiles: dsaProfiles }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setDsaStatus(result.error || "Unable to save DSA profiles");
      return;
    }
    setDsaStatus("DSA profiles published for all users");
  };
  const removeDsa = async () => {
    if (!selectedDsa || !window.confirm(`Remove ${selectedDsa.name} from DSA profiles?`)) return;
    setDsaStatus("Removing...");
    const response = await fetch(`/api/dsas?id=${encodeURIComponent(selectedDsa.id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken")}` },
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setDsaStatus(result.error || "Unable to remove DSA profile");
      return;
    }
    const remaining = dsaProfiles.filter(profile => profile.id !== selectedDsa.id);
    setDsaProfiles(remaining);
    setDsaId(remaining[0]?.id || "");
    setDsaStatus("DSA profile removed");
  };
  const saveNbfc = async (event) => {
    event.preventDefault();
    setNbfcStatus("Saving...");
    const response = await fetch("/api/nbfcs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("adminToken")}` },
      body: JSON.stringify({ nbfc: newNbfc }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setNbfcStatus(result.error || "Unable to save NBFC");
      return;
    }
    const result = await response.json();
    const saved = result.nbfc;
    setNbfcs(current => [...current.filter(item => item.id !== saved.id), saved]);
    setBankData(current => ({ ...current, [saved.loanType]: [...(current[saved.loanType] || []).filter(bank => bank.id !== saved.id), saved] }));
    setNewNbfc(current => ({ ...current, name: "", short: "" }));
    setNbfcStatus("NBFC added and published");
  };
  const removeNbfc = async (nbfc) => {
    if (!window.confirm(`Remove ${nbfc.name}?`)) return;
    setNbfcStatus("Removing...");
    const response = await fetch(`/api/nbfcs?id=${encodeURIComponent(nbfc.id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken")}` } });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setNbfcStatus(result.error || "Unable to remove NBFC");
      return;
    }
    setNbfcs(current => current.filter(item => item.id !== nbfc.id));
    setBankData(current => ({ ...current, [nbfc.loanType]: (current[nbfc.loanType] || []).filter(bank => bank.id !== nbfc.id) }));
    setNbfcStatus("NBFC removed");
  };

  if (!authenticated) return (
    <div className="loan-page admin-login-page" style={S.page}>
      <div className="admin-login-card">
        <div className="desktop-brand-mark">₹</div>
        <p className="admin-login-eyebrow">PRIVATE AREA</p>
        <h2>Admin sign in</h2>
        <p>Enter the administrator password to manage published loan rates.</p>
        <form onSubmit={login}>
          <label>Password<input autoFocus required type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter admin password" /></label>
          {loginError && <div className="admin-login-error">{loginError}</div>}
          <button type="submit" style={{ width: "100%", padding: 14, ...S.orange, fontSize: 14 }}>Sign in securely →</button>
        </form>
        <p className="admin-login-note">Admin access is separate from the customer app.</p>
      </div>
      <style>{`.admin-login-page{display:flex;align-items:center;justify-content:center;min-height:100vh!important;background:linear-gradient(135deg,#fbf8f1,#f2ead7)!important;padding:24px!important}.admin-login-card{width:min(100%,430px);background:#fff;border:1px solid rgba(184,134,11,.18);border-radius:22px;padding:34px;box-shadow:0 18px 45px rgba(80,55,10,.12)}.admin-login-card .desktop-brand-mark{margin:0 auto 18px}.admin-login-eyebrow{text-align:center;color:#B8860B;font-size:10px;font-weight:800;letter-spacing:1.5px;margin:0}.admin-login-card h2{text-align:center;color:#2B2115;font-size:25px;margin:8px 0}.admin-login-card>p:not(.admin-login-eyebrow):not(.admin-login-note){text-align:center;color:rgba(43,33,21,.55);font-size:13px;line-height:1.6;margin:0 0 24px}.admin-login-card label{display:block;color:rgba(43,33,21,.65);font-size:12px;font-weight:700}.admin-login-card input{display:block;width:100%;margin:7px 0 14px;padding:13px;border:1px solid rgba(184,134,11,.22);border-radius:10px;font-size:14px;outline:none}.admin-login-error{color:#b42318;background:#fff0ee;border:1px solid #ffd2cc;border-radius:9px;padding:9px 11px;font-size:12px;margin:-3px 0 12px}.admin-login-note{text-align:center;color:rgba(43,33,21,.4);font-size:11px;margin:18px 0 0}@media(min-width:768px){.admin-login-card{width:460px;padding:42px}}`}</style>
    </div>
  );

  return (
    <div className="loan-page" style={S.page}>
      <div style={{ ...S.header, paddingBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div><p style={{ color: "#B8860B", fontSize: 10, fontWeight: 800, letterSpacing: 1.4, margin: 0 }}>CONTROL CENTER</p><h2 style={{ color: "#2B2115", fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>Admin Dashboard</h2></div>
        </div>
      </div>
      <div style={{ padding: "18px 16px" }}>
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 14, padding: 14, marginBottom: 18 }}>
          <p style={{ color: "#B8860B", fontSize: 13, fontWeight: 800, margin: "0 0 5px" }}>Direct publishing</p>
          <p style={{ color: "rgba(43,33,21,0.65)", fontSize: 12, lineHeight: 1.55, margin: 0 }}>Save changes to publish updated rates immediately for every user.</p>
        </div>
        <div style={{ ...S.card, marginBottom: 14 }}>
          <h3 style={{ color: "#2B2115", fontSize: 15, margin: "0 0 14px" }}>Edit bank rate</h3>
          <label style={{ display: "block", color: "rgba(43,33,21,0.55)", fontSize: 11, fontWeight: 700, marginBottom: 5 }}>LOAN TYPE</label>
          <select value={loanType} onChange={e => setLoanType(e.target.value)} style={{ width: "100%", padding: 12, marginBottom: 12, border: "1px solid rgba(184,134,11,0.2)", borderRadius: 10, background: "#fff" }}>
            {Object.entries(LOAN_META).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
          <label style={{ display: "block", color: "rgba(43,33,21,0.55)", fontSize: 11, fontWeight: 700, marginBottom: 5 }}>BANK</label>
          <select value={selected?.id || ""} onChange={e => setBankId(e.target.value)} style={{ width: "100%", padding: 12, marginBottom: 16, border: "1px solid rgba(184,134,11,0.2)", borderRadius: 10, background: "#fff" }}>
            {banks.map(bank => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
          </select>
          {selected && <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[["rate", "Starting rate %"], ["maxRate", "Maximum rate %"], ["fee", "Processing fee %"]].map(([field, label]) => (
              <label key={field} style={{ color: "rgba(43,33,21,0.55)", fontSize: 10, fontWeight: 700 }}>{label}<input type="number" step="0.01" min="0" value={selected[field]} onChange={e => updateSelected(field, e.target.value)} style={{ display: "block", width: "100%", marginTop: 6, padding: "11px 8px", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 9, color: "#2B2115", fontSize: 13 }} /></label>
            ))}
          </div>}
        </div>
        <button onClick={saveRates} style={{ width: "100%", padding: 14, ...S.orange, fontSize: 14 }}>Save rates for everyone</button>
        {saveStatus && <p style={{ color: saveStatus === "Saving..." ? "#B8860B" : "#16803c", fontSize: 11, textAlign: "center", margin: "12px 0 0" }}>{saveStatus}</p>}
        <div style={{ ...S.card, marginTop: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <h3 style={{ color: "#2B2115", fontSize: 15, margin: 0 }}>Government schemes</h3>
            <button onClick={addScheme} style={{ ...S.orange, padding: "8px 10px", fontSize: 11 }}>+ Add scheme</button>
          </div>
          <select value={selectedScheme?.id || ""} onChange={event => setSchemeId(event.target.value)} style={{ width: "100%", padding: 12, marginBottom: 12, border: "1px solid rgba(184,134,11,0.2)", borderRadius: 10, background: "#fff" }}>
            {schemes.map(scheme => <option key={scheme.id} value={scheme.id}>{scheme.name}</option>)}
          </select>
          {selectedScheme && <div style={{ display: "grid", gap: 10 }}>
            {[
              ["name", "Scheme name"], ["nameGu", "Gujarati name"], ["tag", "Category"], ["oneLiner", "Short description"],
              ["limit", "Loan limit / benefit"], ["rate", "Interest / benefit rate"], ["fee", "Fee"], ["deadline", "Deadline"],
              ["whereToApply", "Where to apply"],
            ].map(([field, label]) => (
              <label key={field} style={{ color: "rgba(43,33,21,0.55)", fontSize: 10, fontWeight: 700 }}>
                {label}
                <input value={selectedScheme[field] || ""} onChange={event => updateScheme(field, event.target.value)} style={{ display: "block", width: "100%", marginTop: 5, padding: "10px", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 9, color: "#2B2115", fontSize: 12 }} />
              </label>
            ))}
          </div>}
          <button onClick={saveSchemes} style={{ width: "100%", padding: 13, marginTop: 14, ...S.orange, fontSize: 13 }}>Publish schemes for everyone</button>
          {schemeStatus && <p style={{ color: schemeStatus === "Saving..." ? "#B8860B" : "#16803c", fontSize: 11, textAlign: "center", margin: "10px 0 0" }}>{schemeStatus}</p>}
        </div>
        <div style={{ ...S.card, marginTop: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <h3 style={{ color: "#2B2115", fontSize: 15, margin: 0 }}>DSA profiles</h3>
            <button onClick={addDsa} style={{ ...S.orange, padding: "8px 10px", fontSize: 11 }}>+ Add DSA</button>
          </div>
          <p style={{ color: "rgba(43,33,21,0.55)", fontSize: 11, lineHeight: 1.5, margin: "0 0 12px" }}>Add image URLs for the profile photo and two workspace photos. Only published profiles appear publicly.</p>
          <select value={selectedDsa?.id || ""} onChange={event => setDsaId(event.target.value)} style={{ width: "100%", padding: 12, marginBottom: 12, border: "1px solid rgba(184,134,11,0.2)", borderRadius: 10, background: "#fff" }}>
            {dsaProfiles.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
          </select>
          {selectedDsa && <div style={{ display: "grid", gap: 10 }}>
            {[
              ["name", "Full name"], ["designation", "Designation"], ["city", "City / service area"], ["phone", "Phone"], ["email", "Email"], ["experience", "Experience"], ["specializations", "Loan specializations"], ["languages", "Languages"], ["photo", "Profile photo URL"], ["workspacePhoto1", "Workspace photo 1 URL"], ["workspacePhoto2", "Workspace photo 2 URL"], ["description", "Professional description"],
            ].map(([field, label]) => (
              <label key={field} style={{ color: "rgba(43,33,21,0.55)", fontSize: 10, fontWeight: 700 }}>{label}
                {field === "description" ? <textarea value={selectedDsa[field] || ""} onChange={event => updateDsa(field, event.target.value)} rows={4} style={{ display: "block", width: "100%", marginTop: 5, padding: 10, border: "1px solid rgba(184,134,11,0.2)", borderRadius: 9, color: "#2B2115", fontSize: 12, resize: "vertical" }} /> : <input value={selectedDsa[field] || ""} onChange={event => updateDsa(field, event.target.value)} style={{ display: "block", width: "100%", marginTop: 5, padding: "10px", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 9, color: "#2B2115", fontSize: 12 }} />}
              </label>
            ))}
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(43,33,21,0.65)", fontSize: 11, fontWeight: 700 }}>
              <input type="checkbox" checked={selectedDsa.published !== false} onChange={event => updateDsa("published", event.target.checked)} /> Publish this profile
            </label>
          </div>}
          <button onClick={saveDsas} style={{ width: "100%", padding: 13, marginTop: 14, ...S.orange, fontSize: 13 }}>Publish DSA profiles</button>
          {selectedDsa && <button onClick={removeDsa} style={{ width: "100%", padding: 12, marginTop: 8, background: "#fff", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 12, color: "#B42318", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Remove selected DSA</button>}
          {dsaStatus && <p style={{ color: dsaStatus === "Saving..." ? "#B8860B" : "#16803c", fontSize: 11, textAlign: "center", margin: "10px 0 0" }}>{dsaStatus}</p>}
        </div>
        <div style={{ ...S.card, marginTop: 22 }}>
          <h3 style={{ color: "#2B2115", fontSize: 15, margin: "0 0 5px" }}>Add NBFC lender</h3>
          <p style={{ color: "rgba(43,33,21,0.55)", fontSize: 11, lineHeight: 1.5, margin: "0 0 14px" }}>Add a lender to one loan category. The lender will appear in comparison and search after publishing.</p>
          <form onSubmit={saveNbfc} style={{ display: "grid", gap: 10 }}>
            {[
              ["name", "NBFC name"], ["short", "Short name"], ["city", "City / service area"], ["tenure", "Tenure"],
            ].map(([field, label]) => <label key={field} style={{ color: "rgba(43,33,21,0.55)", fontSize: 10, fontWeight: 700 }}>{label}<input required={field === "name"} value={newNbfc[field]} onChange={event => setNewNbfc(current => ({ ...current, [field]: event.target.value }))} style={{ display: "block", width: "100%", marginTop: 5, padding: 10, border: "1px solid rgba(184,134,11,0.2)", borderRadius: 9 }} /></label>)}
            <label style={{ color: "rgba(43,33,21,0.55)", fontSize: 10, fontWeight: 700 }}>Loan category<select value={newNbfc.loanType} onChange={event => setNewNbfc(current => ({ ...current, loanType: event.target.value }))} style={{ display: "block", width: "100%", marginTop: 5, padding: 10, border: "1px solid rgba(184,134,11,0.2)", borderRadius: 9, background: "#fff" }}>{Object.entries(LOAN_META).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>{[["rate", "Starting rate %"], ["maxRate", "Maximum rate %"], ["fee", "Fee %"], ["approval", "Approval %"], ["maxLoan", "Max loan ₹"]].map(([field, label]) => <label key={field} style={{ color: "rgba(43,33,21,0.55)", fontSize: 9, fontWeight: 700 }}>{label}<input type="number" min="0" step="0.01" value={newNbfc[field]} onChange={event => setNewNbfc(current => ({ ...current, [field]: event.target.value }))} style={{ display: "block", width: "100%", marginTop: 5, padding: 9, border: "1px solid rgba(184,134,11,0.2)", borderRadius: 9 }} /></label>)}</div>
            <button type="submit" style={{ ...S.orange, padding: 13, fontSize: 13 }}>Add NBFC for everyone</button>
          </form>
          {nbfcs.length > 0 && <div style={{ display: "grid", gap: 7, marginTop: 14 }}>{nbfcs.map(nbfc => <div key={nbfc.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#fff", borderRadius: 9, border: "1px solid rgba(184,134,11,0.12)" }}><span style={{ flex: 1, color: "#2B2115", fontSize: 11, fontWeight: 700 }}>{nbfc.name}<small style={{ display: "block", color: "rgba(43,33,21,0.45)", fontWeight: 400 }}>{LOAN_META[nbfc.loanType]?.label}</small></span><button type="button" onClick={() => removeNbfc(nbfc)} style={{ border: "1px solid rgba(220,38,38,0.25)", background: "#fff", color: "#B42318", borderRadius: 7, padding: "5px 8px", fontSize: 10, cursor: "pointer" }}>Remove</button></div>)}</div>}
          {nbfcStatus && <p style={{ color: nbfcStatus === "Saving..." || nbfcStatus === "Removing..." ? "#B8860B" : "#16803c", fontSize: 11, textAlign: "center", margin: "10px 0 0" }}>{nbfcStatus}</p>}
        </div>
      </div>
    </div>
  );
}

function DesktopHeader({ isGu, setLang, setShowSearch }) {
  return (
    <header className="desktop-header">
      <div>
        <span className="desktop-eyebrow">PERSONAL FINANCE</span>
        <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>Financial snapshot</span>
          <span style={{ fontSize: 11, padding: "5px 8px", borderRadius: 999, background: "rgba(184,134,11,0.12)", color: "#B8860B", fontWeight: 800, letterSpacing: 0.5 }}>LIVE</span>
        </h1>
      </div>
      <div className="desktop-header-actions">
        <button className="desktop-search" onClick={() => setShowSearch(true)}><span>⌕</span>{isGu ? "લોન, બેંક અથવા योजना શોધો..." : "Search loans, banks or schemes..."}</button>
      </div>
    </header>
  );
}

function TickerBar({ items }) {
  if (!items || items.length === 0) return null;
  const list = [...items, ...items];
  return (
    <div className="ticker-bar" aria-live="polite">
      <div className="ticker-track">
        {list.map((item, index) => (
          <span key={`${item}-${index}`} className="ticker-item">{item}</span>
        ))}
      </div>
      <style>{`
        .ticker-bar {
          position: sticky;
          top: 0;
          z-index: 18;
          background: linear-gradient(90deg, rgba(184, 134, 11, 0.12), rgba(184, 134, 11, 0.03), rgba(184, 134, 11, 0.12));
          border-top: 1px solid rgba(184, 134, 11, 0.12);
          border-bottom: 1px solid rgba(184, 134, 11, 0.12);
          overflow: hidden;
          white-space: nowrap;
        }
        .ticker-track {
          display: inline-flex;
          align-items: center;
          gap: 36px;
          min-width: max-content;
          padding: 8px 0;
          animation: tickerScroll 40s linear infinite;
        }
        .ticker-item {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(43, 33, 21, 0.76);
        }
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ─── LOAN META ────────────────────────────────────────────────────────────────
const LOAN_META = {
  home: { label: "Home Loan", labelGu: "હોમ લોન", icon: "🏠", logo: "/homeloanlogo.png", defaultRate: 8.50, minAmt: 500000, maxAmt: 50000000, defaultAmt: 3000000, maxTenure: 30 },
  mortgage: { label: "Mortgage Loan", labelGu: "મોર્ગેજ લોન", icon: "🏦", logo: "/laploan.png", defaultRate: 9.75, minAmt: 1000000, maxAmt: 100000000, defaultAmt: 5000000, maxTenure: 15 },
  sme: { label: "SME / Business", labelGu: "SME લોન", icon: "🏢", logo: "/bussinessloanlogo.png", defaultRate: 9.50, minAmt: 500000, maxAmt: 50000000, defaultAmt: 2000000, maxTenure: 15 },
  personal: { label: "Personal Loan", labelGu: "પર્સનલ લોન", icon: "💰", logo: "/persnolloanlogo.png", defaultRate: 10.50, minAmt: 50000, maxAmt: 5000000, defaultAmt: 500000, maxTenure: 7 },
  car: { label: "Car Loan", labelGu: "કાર લોન", icon: "🚗", logo: "/carloan.png", defaultRate: 9.00, minAmt: 100000, maxAmt: 10000000, defaultAmt: 700000, maxTenure: 7 },
  commercial: { label: "Commercial Vehicle", labelGu: "કોમર્શિયલ વાહન", icon: "🚚", logo: "/carloan.png", defaultRate: 10.00, minAmt: 100000, maxAmt: 15000000, defaultAmt: 1200000, maxTenure: 7 },
  education: { label: "Education Loan", labelGu: "એજ્યુકેશન લોન", icon: "🎓", logo: "/bussinessloanlogo.png", defaultRate: 8.50, minAmt: 50000, maxAmt: 3000000, defaultAmt: 500000, maxTenure: 15 },
  usedcommercial: { label: "Used Commercial Vehicle", labelGu: "જૂનું કોમર્શિયલ વાહન", icon: "🚛", logo: "/carloan.png", defaultRate: 12.00, minAmt: 100000, maxAmt: 10000000, defaultAmt: 800000, maxTenure: 6 },
};

// ─── BANK DATA ────────────────────────────────────────────────────────────────
const BANK_DATA = {
  home: [
    { id: 1, name: "Bank of Baroda", short: "BOB", slug: "bob", type: "govt", rate: 7.45, maxRate: 10.50, fee: 0.25, approval: 77, maxLoan: 45000000, tenure: "5-30 yrs", tag: "Lowest Fee", tagColor: "#F59E0B" },
    { id: 2, name: "State Bank of India", short: "SBI", slug: "sbi", type: "govt", rate: 7.50, maxRate: 9.85, fee: 0.35, approval: 82, maxLoan: 50000000, tenure: "5-30 yrs", tag: "Most Popular", tagColor: "#10B981" },
    { id: 3, name: "ICICI Bank", short: "ICICI", slug: "icici", type: "private", rate: 7.45, maxRate: 10.05, fee: 0.50, approval: 74, maxLoan: 35000000, tenure: "5-30 yrs", tag: null, tagColor: null },
    { id: 4, name: "Punjab National Bank", short: "PNB", slug: "pnb", type: "govt", rate: 7.55, maxRate: 10.25, fee: 0.35, approval: 75, maxLoan: 40000000, tenure: "5-30 yrs", tag: null, tagColor: null },
    { id: 5, name: "Union Bank", short: "UBI", slug: "union", type: "govt", rate: 7.60, maxRate: 10.30, fee: 0.25, approval: 73, maxLoan: 35000000, tenure: "5-30 yrs", tag: null, tagColor: null },
    { id: 6, name: "Canara Bank", short: "Canara", slug: "canara", type: "govt", rate: 7.65, maxRate: 10.40, fee: 0.50, approval: 72, maxLoan: 40000000, tenure: "5-30 yrs", tag: null, tagColor: null },
    { id: 7, name: "HDFC Bank", short: "HDFC", slug: "hdfc", type: "private", rate: 7.75, maxRate: 9.40, fee: 0.50, approval: 79, maxLoan: 40000000, tenure: "5-30 yrs", tag: "Fast Approval", tagColor: "#3B82F6" },
    { id: 8, name: "Axis Bank", short: "Axis", slug: "axis", type: "private", rate: 8.75, maxRate: 10.30, fee: 1.0, approval: 71, maxLoan: 30000000, tenure: "5-30 yrs", tag: null, tagColor: null },
    { id: 9, name: "Kotak Mahindra", short: "Kotak", slug: "kotak", type: "private", rate: 8.75, maxRate: 9.60, fee: 0.50, approval: 68, maxLoan: 30000000, tenure: "5-30 yrs", tag: null, tagColor: null },
    { id: 10, name: "LIC Housing Finance", short: "LIC HF", slug: null, type: "nbfc", rate: 8.50, maxRate: 9.75, fee: 0.25, approval: 80, maxLoan: 35000000, tenure: "5-30 yrs", tag: "Trusted", tagColor: "#8B5CF6" },
    { id: 11, name: "Bajaj Housing Finance", short: "Bajaj HF", slug: null, type: "nbfc", rate: 8.55, maxRate: 12.00, fee: 0.50, approval: 85, maxLoan: 25000000, tenure: "5-30 yrs", tag: "High Approval", tagColor: "#EC4899" },
    { id: 12, name: "PNB Housing Finance", short: "PNB HF", slug: null, type: "nbfc", rate: 8.50, maxRate: 11.45, fee: 0.50, approval: 76, maxLoan: 30000000, tenure: "5-30 yrs", tag: null, tagColor: null },
    { id: 13, name: "IndusInd Bank", short: "IndusInd", slug: "indusind", type: "private", rate: 8.75, maxRate: 10.50, fee: 0.50, approval: 66, maxLoan: 25000000, tenure: "5-30 yrs", tag: null, tagColor: null },
    { id: 14, name: "L&T Finance", short: "L&T", slug: null, type: "nbfc", rate: 8.65, maxRate: 12.50, fee: 1.0, approval: 76, maxLoan: 50000000, tenure: "5-30 yrs", tag: null, tagColor: null },
    { id: 15, name: "AU Small Finance Bank", short: "AU SFB", slug: null, type: "smallfinance", rate: 10.50, maxRate: 14.00, fee: 1.0, approval: 91, maxLoan: 15000000, tenure: "3-20 yrs", tag: "Easy Approval", tagColor: "#10B981" },
  ],
  personal: [
    { id: 1, name: "Kotak Mahindra", short: "Kotak", slug: "kotak", type: "private", rate: 9.98, maxRate: 16.99, fee: 2.5, approval: 69, maxLoan: 4000000, tenure: "1-5 yrs", tag: "Lowest Rate", tagColor: "#10B981" },
    { id: 2, name: "HDFC Bank", short: "HDFC", slug: "hdfc", type: "private", rate: 9.99, maxRate: 24.00, fee: 2.5, approval: 72, maxLoan: 4000000, tenure: "1-5 yrs", tag: "Fast Disbursal", tagColor: "#3B82F6" },
    { id: 3, name: "ICICI Bank", short: "ICICI", slug: "icici", type: "private", rate: 9.99, maxRate: 16.00, fee: 2.0, approval: 70, maxLoan: 5000000, tenure: "1-6 yrs", tag: null, tagColor: null },
    { id: 4, name: "State Bank of India", short: "SBI", slug: "sbi", type: "govt", rate: 10.05, maxRate: 15.05, fee: 1.0, approval: 68, maxLoan: 3500000, tenure: "1-6 yrs", tag: "Govt Trust", tagColor: "#10B981" },
    { id: 5, name: "Bajaj Finance", short: "Bajaj", slug: null, type: "nbfc", rate: 10.00, maxRate: 31.00, fee: 3.0, approval: 88, maxLoan: 4000000, tenure: "1-8 yrs", tag: "Highest Approval", tagColor: "#EC4899" },
    { id: 6, name: "Axis Bank", short: "Axis", slug: "axis", type: "private", rate: 10.49, maxRate: 22.00, fee: 2.0, approval: 67, maxLoan: 4000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 7, name: "Punjab National Bank", short: "PNB", slug: "pnb", type: "govt", rate: 10.40, maxRate: 16.95, fee: 1.0, approval: 65, maxLoan: 2000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 8, name: "Tata Capital", short: "Tata", slug: null, type: "nbfc", rate: 10.99, maxRate: 28.00, fee: 2.75, approval: 80, maxLoan: 3500000, tenure: "1-6 yrs", tag: null, tagColor: null },
    { id: 9, name: "IDFC First Bank", short: "IDFC", slug: "idfc", type: "private", rate: 10.49, maxRate: 24.00, fee: 3.5, approval: 71, maxLoan: 1000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 10, name: "IndusInd Bank", short: "IndusInd", slug: "indusind", type: "private", rate: 10.49, maxRate: 26.00, fee: 3.0, approval: 65, maxLoan: 3000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 11, name: "HDB Financial", short: "HDB", slug: null, type: "nbfc", rate: 12.00, maxRate: 36.00, fee: 2.0, approval: 82, maxLoan: 2000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 12, name: "AU Small Finance Bank", short: "AU SFB", slug: null, type: "smallfinance", rate: 12.00, maxRate: 22.00, fee: 2.0, approval: 90, maxLoan: 1000000, tenure: "1-5 yrs", tag: "Easy Approval", tagColor: "#10B981" },
    { id: 13, name: "Ujjivan Small Finance", short: "Ujjivan", slug: "ujjivan", type: "smallfinance", rate: 11.49, maxRate: 24.00, fee: 1.0, approval: 88, maxLoan: 500000, tenure: "1-4 yrs", tag: null, tagColor: null },
    { id: 14, name: "Bank of Baroda", short: "BOB", slug: "bob", type: "govt", rate: 10.85, maxRate: 16.60, fee: 1.0, approval: 63, maxLoan: 1500000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 15, name: "Yes Bank", short: "Yes", slug: "yes", type: "private", rate: 10.49, maxRate: 20.00, fee: 2.0, approval: 62, maxLoan: 4000000, tenure: "1-5 yrs", tag: null, tagColor: null },
  ],
  sme: [
    { id: 1, name: "State Bank of India", short: "SBI", slug: "sbi", type: "govt", rate: 8.80, maxRate: 14.00, fee: 1.0, approval: 75, maxLoan: 50000000, tenure: "1-15 yrs", tag: "Best for SME", tagColor: "#10B981" },
    { id: 2, name: "Bank of Baroda", short: "BOB", slug: "bob", type: "govt", rate: 9.25, maxRate: 14.50, fee: 0.50, approval: 72, maxLoan: 50000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 3, name: "Punjab National Bank", short: "PNB", slug: "pnb", type: "govt", rate: 9.35, maxRate: 15.00, fee: 0.75, approval: 70, maxLoan: 50000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 4, name: "HDFC Bank", short: "HDFC", slug: "hdfc", type: "private", rate: 10.75, maxRate: 22.50, fee: 2.0, approval: 74, maxLoan: 5000000, tenure: "1-15 yrs", tag: "Fast Processing", tagColor: "#3B82F6" },
    { id: 5, name: "ICICI Bank", short: "ICICI", slug: "icici", type: "private", rate: 11.00, maxRate: 18.00, fee: 2.0, approval: 72, maxLoan: 20000000, tenure: "1-10 yrs", tag: null, tagColor: null },
    { id: 6, name: "Bajaj Finance", short: "Bajaj", slug: null, type: "nbfc", rate: 13.50, maxRate: 30.00, fee: 3.0, approval: 87, maxLoan: 20000000, tenure: "1-8 yrs", tag: "Highest Approval", tagColor: "#EC4899" },
    { id: 7, name: "Lendingkart", short: "Lendingkart", slug: null, type: "nbfc", rate: 11.99, maxRate: 21.00, fee: 2.5, approval: 85, maxLoan: 20000000, tenure: "1-3 yrs", tag: "Digital Fast", tagColor: "#8B5CF6" },
    { id: 8, name: "Axis Bank", short: "Axis", slug: "axis", type: "private", rate: 11.25, maxRate: 20.00, fee: 2.0, approval: 68, maxLoan: 15000000, tenure: "1-10 yrs", tag: null, tagColor: null },
    { id: 9, name: "AU Small Finance Bank", short: "AU SFB", slug: null, type: "smallfinance", rate: 12.00, maxRate: 21.00, fee: 2.0, approval: 90, maxLoan: 5000000, tenure: "1-7 yrs", tag: "Easy Approval", tagColor: "#10B981" },
    { id: 10, name: "Union Bank", short: "UBI", slug: "union", type: "govt", rate: 9.40, maxRate: 14.75, fee: 0.50, approval: 68, maxLoan: 50000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 11, name: "Canara Bank", short: "Canara", slug: "canara", type: "govt", rate: 9.45, maxRate: 15.25, fee: 0.50, approval: 67, maxLoan: 40000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 12, name: "Tata Capital", short: "Tata", slug: null, type: "nbfc", rate: 12.00, maxRate: 25.00, fee: 2.0, approval: 80, maxLoan: 15000000, tenure: "1-7 yrs", tag: null, tagColor: null },
    { id: 13, name: "Kotak Mahindra", short: "Kotak", slug: "kotak", type: "private", rate: 11.50, maxRate: 19.00, fee: 2.0, approval: 65, maxLoan: 15000000, tenure: "1-10 yrs", tag: null, tagColor: null },
    { id: 14, name: "IDFC First Bank", short: "IDFC", slug: "idfc", type: "private", rate: 10.50, maxRate: 22.00, fee: 3.0, approval: 70, maxLoan: 10000000, tenure: "1-10 yrs", tag: null, tagColor: null },
    { id: 15, name: "Fullerton India", short: "Fullerton", slug: null, type: "nbfc", rate: 11.99, maxRate: 21.00, fee: 3.0, approval: 78, maxLoan: 5000000, tenure: "1-5 yrs", tag: null, tagColor: null },
  ],
  vehicle4w: [
    { id: 1, name: "ICICI Bank", short: "ICICI", slug: "icici", type: "private", rate: 8.50, maxRate: 10.50, fee: 1.0, approval: 77, maxLoan: 10000000, tenure: "1-7 yrs", tag: "Lowest Rate", tagColor: "#10B981" },
    { id: 2, name: "State Bank of India", short: "SBI", slug: "sbi", type: "govt", rate: 8.75, maxRate: 10.25, fee: 0.50, approval: 78, maxLoan: 10000000, tenure: "1-7 yrs", tag: null, tagColor: null },
    { id: 3, name: "Bank of Baroda", short: "BOB", slug: "bob", type: "govt", rate: 8.80, maxRate: 10.80, fee: 0.50, approval: 74, maxLoan: 10000000, tenure: "1-7 yrs", tag: null, tagColor: null },
    { id: 4, name: "HDFC Bank", short: "HDFC", slug: "hdfc", type: "private", rate: 9.00, maxRate: 11.50, fee: 1.0, approval: 80, maxLoan: 10000000, tenure: "1-7 yrs", tag: "Fast Disbursal", tagColor: "#3B82F6" },
    { id: 5, name: "Kotak Mahindra", short: "Kotak", slug: "kotak", type: "private", rate: 9.00, maxRate: 11.00, fee: 1.0, approval: 70, maxLoan: 10000000, tenure: "1-7 yrs", tag: null, tagColor: null },
    { id: 6, name: "Bajaj Finance", short: "Bajaj", slug: null, type: "nbfc", rate: 9.50, maxRate: 15.00, fee: 2.0, approval: 87, maxLoan: 10000000, tenure: "1-7 yrs", tag: "High Approval", tagColor: "#EC4899" },
    { id: 7, name: "Shriram Finance", short: "Shriram", slug: null, type: "nbfc", rate: 10.00, maxRate: 18.00, fee: 2.0, approval: 85, maxLoan: 5000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 8, name: "Axis Bank", short: "Axis", slug: "axis", type: "private", rate: 9.25, maxRate: 11.25, fee: 1.0, approval: 72, maxLoan: 8000000, tenure: "1-7 yrs", tag: null, tagColor: null },
    { id: 9, name: "Punjab National Bank", short: "PNB", slug: "pnb", type: "govt", rate: 8.85, maxRate: 10.75, fee: 0.50, approval: 72, maxLoan: 8000000, tenure: "1-7 yrs", tag: null, tagColor: null },
    { id: 10, name: "Mahindra Finance", short: "Mahindra", slug: null, type: "nbfc", rate: 10.00, maxRate: 18.00, fee: 2.0, approval: 82, maxLoan: 5000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 11, name: "AU Small Finance Bank", short: "AU SFB", slug: null, type: "smallfinance", rate: 11.00, maxRate: 16.00, fee: 2.0, approval: 91, maxLoan: 3000000, tenure: "1-5 yrs", tag: "Easy Approval", tagColor: "#10B981" },
    { id: 12, name: "IndusInd Bank", short: "IndusInd", slug: "indusind", type: "private", rate: 9.00, maxRate: 12.00, fee: 1.5, approval: 68, maxLoan: 8000000, tenure: "1-7 yrs", tag: null, tagColor: null },
    { id: 13, name: "Federal Bank", short: "Federal", slug: "federal", type: "private", rate: 9.00, maxRate: 11.25, fee: 1.0, approval: 67, maxLoan: 5000000, tenure: "1-7 yrs", tag: null, tagColor: null },
    { id: 14, name: "Tata Capital", short: "Tata", slug: null, type: "nbfc", rate: 10.49, maxRate: 16.00, fee: 2.0, approval: 80, maxLoan: 8000000, tenure: "1-7 yrs", tag: null, tagColor: null },
    { id: 15, name: "Yes Bank", short: "Yes", slug: "yes", type: "private", rate: 9.00, maxRate: 12.00, fee: 1.5, approval: 65, maxLoan: 6000000, tenure: "1-7 yrs", tag: null, tagColor: null },
  ],
  usedcar: [
    { id: 1, name: "State Bank of India", short: "SBI", slug: "sbi", type: "govt", rate: 9.25, maxRate: 13.00, fee: 0.50, approval: 74, maxLoan: 2000000, tenure: "1-5 yrs", tag: "Lowest Rate", tagColor: "#10B981" },
    { id: 2, name: "HDFC Bank", short: "HDFC", slug: "hdfc", type: "private", rate: 9.40, maxRate: 13.55, fee: 1.0, approval: 78, maxLoan: 2500000, tenure: "1-5 yrs", tag: "Fast Approval", tagColor: "#3B82F6" },
    { id: 3, name: "ICICI Bank", short: "ICICI", slug: "icici", type: "private", rate: 9.50, maxRate: 14.00, fee: 1.0, approval: 75, maxLoan: 2500000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 4, name: "Bank of Baroda", short: "BOB", slug: "bob", type: "govt", rate: 9.55, maxRate: 12.50, fee: 0.50, approval: 72, maxLoan: 2000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 5, name: "Axis Bank", short: "Axis", slug: "axis", type: "private", rate: 10.00, maxRate: 14.00, fee: 1.0, approval: 70, maxLoan: 2000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 6, name: "Mahindra Finance", short: "Mahindra", slug: null, type: "nbfc", rate: 10.50, maxRate: 18.00, fee: 2.0, approval: 85, maxLoan: 1500000, tenure: "1-5 yrs", tag: "High Approval", tagColor: "#EC4899" },
    { id: 7, name: "Shriram Finance", short: "Shriram", slug: null, type: "nbfc", rate: 11.00, maxRate: 19.00, fee: 2.0, approval: 87, maxLoan: 2000000, tenure: "1-5 yrs", tag: "Used Car Expert", tagColor: "#F59E0B" },
    { id: 8, name: "Kotak Mahindra", short: "Kotak", slug: "kotak", type: "private", rate: 10.00, maxRate: 15.00, fee: 1.5, approval: 68, maxLoan: 2000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 9, name: "IndusInd Bank", short: "IndusInd", slug: "indusind", type: "private", rate: 10.00, maxRate: 15.00, fee: 1.5, approval: 66, maxLoan: 2000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 10, name: "Punjab National Bank", short: "PNB", slug: "pnb", type: "govt", rate: 9.60, maxRate: 13.00, fee: 0.50, approval: 69, maxLoan: 1500000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 11, name: "AU Small Finance Bank", short: "AU SFB", slug: null, type: "smallfinance", rate: 12.00, maxRate: 18.00, fee: 2.0, approval: 91, maxLoan: 1000000, tenure: "1-4 yrs", tag: "Easy Approval", tagColor: "#10B981" },
    { id: 12, name: "Canara Bank", short: "Canara", slug: "canara", type: "govt", rate: 9.70, maxRate: 13.50, fee: 0.50, approval: 68, maxLoan: 1500000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 13, name: "Federal Bank", short: "Federal", slug: "federal", type: "private", rate: 10.00, maxRate: 14.00, fee: 1.0, approval: 65, maxLoan: 1500000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 14, name: "HDB Financial", short: "HDB", slug: null, type: "nbfc", rate: 12.00, maxRate: 22.00, fee: 2.0, approval: 83, maxLoan: 1500000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 15, name: "Tata Capital", short: "Tata", slug: null, type: "nbfc", rate: 11.49, maxRate: 18.00, fee: 2.0, approval: 80, maxLoan: 2000000, tenure: "1-5 yrs", tag: null, tagColor: null },
  ],
  vehicle2w: [
    { id: 1, name: "Bajaj Auto Finance", short: "Bajaj Auto", slug: null, type: "nbfc", rate: 9.00, maxRate: 15.00, fee: 1.0, approval: 88, maxLoan: 500000, tenure: "1-4 yrs", tag: "Highest Approval", tagColor: "#EC4899" },
    { id: 2, name: "TVS Credit", short: "TVS", slug: null, type: "nbfc", rate: 9.50, maxRate: 16.00, fee: 1.0, approval: 85, maxLoan: 400000, tenure: "1-4 yrs", tag: null, tagColor: null },
    { id: 3, name: "ICICI Bank", short: "ICICI", slug: "icici", type: "private", rate: 10.25, maxRate: 26.10, fee: 4.0, approval: 75, maxLoan: 500000, tenure: "1-5 yrs", tag: "Lowest Bank Rate", tagColor: "#3B82F6" },
    { id: 4, name: "State Bank of India", short: "SBI", slug: "sbi", type: "govt", rate: 11.70, maxRate: 15.70, fee: 0.50, approval: 75, maxLoan: 300000, tenure: "1-5 yrs", tag: "EV Discount", tagColor: "#10B981" },
    { id: 5, name: "HeroFin Corp", short: "HeroFin", slug: null, type: "nbfc", rate: 10.00, maxRate: 18.00, fee: 1.5, approval: 84, maxLoan: 300000, tenure: "1-4 yrs", tag: null, tagColor: null },
    { id: 6, name: "Bank of Baroda", short: "BOB", slug: "bob", type: "govt", rate: 11.80, maxRate: 14.50, fee: 0.50, approval: 72, maxLoan: 300000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 7, name: "Mahindra Finance", short: "Mahindra", slug: null, type: "nbfc", rate: 10.00, maxRate: 18.00, fee: 2.0, approval: 82, maxLoan: 300000, tenure: "1-4 yrs", tag: null, tagColor: null },
    { id: 8, name: "HDFC Bank", short: "HDFC", slug: "hdfc", type: "private", rate: 14.50, maxRate: 18.00, fee: 2.5, approval: 78, maxLoan: 500000, tenure: "1-5 yrs", tag: "100% Funding", tagColor: "#8B5CF6" },
    { id: 9, name: "Axis Bank", short: "Axis", slug: "axis", type: "private", rate: 14.00, maxRate: 19.00, fee: 2.0, approval: 70, maxLoan: 400000, tenure: "1-4 yrs", tag: null, tagColor: null },
    { id: 10, name: "Kotak Mahindra", short: "Kotak", slug: "kotak", type: "private", rate: 13.00, maxRate: 18.00, fee: 2.0, approval: 67, maxLoan: 400000, tenure: "1-4 yrs", tag: null, tagColor: null },
    { id: 11, name: "Punjab National Bank", short: "PNB", slug: "pnb", type: "govt", rate: 12.00, maxRate: 15.00, fee: 0.50, approval: 70, maxLoan: 300000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 12, name: "IndusInd Bank", short: "IndusInd", slug: "indusind", type: "private", rate: 12.00, maxRate: 20.00, fee: 2.0, approval: 68, maxLoan: 300000, tenure: "1-4 yrs", tag: null, tagColor: null },
    { id: 13, name: "AU Small Finance Bank", short: "AU SFB", slug: null, type: "smallfinance", rate: 12.00, maxRate: 18.00, fee: 2.0, approval: 91, maxLoan: 200000, tenure: "1-3 yrs", tag: "Easy Approval", tagColor: "#10B981" },
    { id: 14, name: "Federal Bank", short: "Federal", slug: "federal", type: "private", rate: 12.50, maxRate: 17.00, fee: 1.5, approval: 65, maxLoan: 300000, tenure: "1-4 yrs", tag: null, tagColor: null },
    { id: 15, name: "Yes Bank", short: "Yes", slug: "yes", type: "private", rate: 13.00, maxRate: 19.00, fee: 2.0, approval: 64, maxLoan: 300000, tenure: "1-4 yrs", tag: null, tagColor: null },
  ],
  gold: [
    { id: 1, name: "Muthoot Finance", short: "Muthoot", slug: null, type: "nbfc", rate: 8.00, maxRate: 24.00, fee: 0.50, approval: 95, maxLoan: 20000000, tenure: "3m-3 yrs", tag: "Instant Loan", tagColor: "#F59E0B" },
    { id: 2, name: "State Bank of India", short: "SBI", slug: "sbi", type: "govt", rate: 8.75, maxRate: 9.60, fee: 0.25, approval: 88, maxLoan: 5000000, tenure: "6m-3 yrs", tag: "Lowest Rate", tagColor: "#10B981" },
    { id: 3, name: "Manappuram Finance", short: "Manappuram", slug: null, type: "nbfc", rate: 9.90, maxRate: 26.00, fee: 0.50, approval: 94, maxLoan: 10000000, tenure: "3m-3 yrs", tag: null, tagColor: null },
    { id: 4, name: "Bank of Baroda", short: "BOB", slug: "bob", type: "govt", rate: 8.80, maxRate: 10.00, fee: 0.25, approval: 85, maxLoan: 4000000, tenure: "6m-3 yrs", tag: null, tagColor: null },
    { id: 5, name: "IIFL Finance", short: "IIFL", slug: null, type: "nbfc", rate: 11.88, maxRate: 18.00, fee: 0.50, approval: 92, maxLoan: 20000000, tenure: "3m-2 yrs", tag: null, tagColor: null },
    { id: 6, name: "Punjab National Bank", short: "PNB", slug: "pnb", type: "govt", rate: 8.90, maxRate: 10.20, fee: 0.25, approval: 84, maxLoan: 5000000, tenure: "6m-3 yrs", tag: null, tagColor: null },
    { id: 7, name: "Canara Bank", short: "Canara", slug: "canara", type: "govt", rate: 9.00, maxRate: 10.40, fee: 0.25, approval: 83, maxLoan: 4000000, tenure: "6m-3 yrs", tag: null, tagColor: null },
    { id: 8, name: "Federal Bank", short: "Federal", slug: "federal", type: "private", rate: 9.49, maxRate: 14.00, fee: 0.50, approval: 80, maxLoan: 3000000, tenure: "6m-2 yrs", tag: null, tagColor: null },
    { id: 9, name: "ICICI Bank", short: "ICICI", slug: "icici", type: "private", rate: 10.00, maxRate: 16.00, fee: 1.0, approval: 78, maxLoan: 5000000, tenure: "6m-1 yr", tag: null, tagColor: null },
    { id: 10, name: "Union Bank", short: "Union", slug: "union", type: "govt", rate: 9.00, maxRate: 10.40, fee: 0.25, approval: 82, maxLoan: 3000000, tenure: "6m-3 yrs", tag: null, tagColor: null },
    { id: 11, name: "AU Small Finance Bank", short: "AU SFB", slug: null, type: "smallfinance", rate: 10.00, maxRate: 18.00, fee: 1.0, approval: 91, maxLoan: 2000000, tenure: "6m-2 yrs", tag: null, tagColor: null },
    { id: 12, name: "HDFC Bank", short: "HDFC", slug: "hdfc", type: "private", rate: 16.00, maxRate: 17.50, fee: 1.0, approval: 75, maxLoan: 5000000, tenure: "6m-4 yrs", tag: null, tagColor: null },
    { id: 13, name: "Axis Bank", short: "Axis", slug: "axis", type: "private", rate: 13.50, maxRate: 16.95, fee: 1.0, approval: 72, maxLoan: 2000000, tenure: "6m-3 yrs", tag: null, tagColor: null },
    { id: 14, name: "IndusInd Bank", short: "IndusInd", slug: "indusind", type: "private", rate: 10.00, maxRate: 16.00, fee: 1.0, approval: 70, maxLoan: 2000000, tenure: "6m-2 yrs", tag: null, tagColor: null },
    { id: 15, name: "Muthoot FinCorp", short: "MF Corp", slug: null, type: "nbfc", rate: 9.95, maxRate: 24.00, fee: 0.50, approval: 93, maxLoan: 15000000, tenure: "3m-3 yrs", tag: null, tagColor: null },
  ],
  lap: [
    { id: 1, name: "PNB Housing Finance", short: "PNB HF", slug: null, type: "nbfc", rate: 9.25, maxRate: 13.00, fee: 0.50, approval: 78, maxLoan: 50000000, tenure: "1-15 yrs", tag: "Lowest Rate", tagColor: "#10B981" },
    { id: 2, name: "HDFC Bank", short: "HDFC", slug: "hdfc", type: "private", rate: 9.50, maxRate: 11.00, fee: 1.0, approval: 78, maxLoan: 100000000, tenure: "1-15 yrs", tag: "Fast Processing", tagColor: "#3B82F6" },
    { id: 3, name: "State Bank of India", short: "SBI", slug: "sbi", type: "govt", rate: 9.60, maxRate: 11.50, fee: 0.50, approval: 76, maxLoan: 75000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 4, name: "L&T Finance", short: "L&T", slug: null, type: "nbfc", rate: 9.50, maxRate: 13.50, fee: 1.0, approval: 76, maxLoan: 75000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 5, name: "Kotak Mahindra", short: "Kotak", slug: "kotak", type: "private", rate: 9.50, maxRate: 11.50, fee: 1.0, approval: 70, maxLoan: 50000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 6, name: "Bajaj Housing Finance", short: "Bajaj HF", slug: null, type: "nbfc", rate: 9.75, maxRate: 14.00, fee: 1.0, approval: 85, maxLoan: 75000000, tenure: "1-15 yrs", tag: "High Approval", tagColor: "#EC4899" },
    { id: 7, name: "ICICI Bank", short: "ICICI", slug: "icici", type: "private", rate: 9.85, maxRate: 11.50, fee: 1.0, approval: 75, maxLoan: 75000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 8, name: "Bank of Baroda", short: "BOB", slug: "bob", type: "govt", rate: 9.75, maxRate: 12.00, fee: 0.50, approval: 73, maxLoan: 75000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 9, name: "Tata Capital", short: "Tata", slug: null, type: "nbfc", rate: 10.10, maxRate: 14.00, fee: 1.5, approval: 80, maxLoan: 50000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 10, name: "Punjab National Bank", short: "PNB", slug: "pnb", type: "govt", rate: 9.80, maxRate: 12.25, fee: 0.50, approval: 71, maxLoan: 50000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 11, name: "Axis Bank", short: "Axis", slug: "axis", type: "private", rate: 10.50, maxRate: 12.50, fee: 1.0, approval: 72, maxLoan: 50000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 12, name: "Union Bank", short: "UBI", slug: "union", type: "govt", rate: 9.85, maxRate: 12.00, fee: 0.50, approval: 70, maxLoan: 50000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 13, name: "IndusInd Bank", short: "IndusInd", slug: "indusind", type: "private", rate: 10.00, maxRate: 12.00, fee: 1.0, approval: 68, maxLoan: 40000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 14, name: "IDFC First Bank", short: "IDFC", slug: "idfc", type: "private", rate: 9.75, maxRate: 12.50, fee: 1.5, approval: 67, maxLoan: 30000000, tenure: "1-15 yrs", tag: null, tagColor: null },
    { id: 15, name: "AU Small Finance Bank", short: "AU SFB", slug: null, type: "smallfinance", rate: 12.00, maxRate: 18.00, fee: 1.5, approval: 90, maxLoan: 20000000, tenure: "1-10 yrs", tag: "Easy Approval", tagColor: "#10B981" },
  ],
  kisan: [
    { id: 1, name: "State Bank of India", short: "SBI", slug: "sbi", type: "govt", rate: 7.00, maxRate: 9.00, fee: 0.0, approval: 82, maxLoan: 3000000, tenure: "1-5 yrs", tag: "Subsidised", tagColor: "#10B981" },
    { id: 2, name: "Bank of Baroda", short: "BOB", slug: "bob", type: "govt", rate: 7.00, maxRate: 9.25, fee: 0.0, approval: 80, maxLoan: 3000000, tenure: "1-5 yrs", tag: "Zero Fee", tagColor: "#F59E0B" },
    { id: 3, name: "Punjab National Bank", short: "PNB", slug: "pnb", type: "govt", rate: 7.00, maxRate: 9.50, fee: 0.0, approval: 78, maxLoan: 3000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 4, name: "Canara Bank", short: "Canara", slug: "canara", type: "govt", rate: 7.00, maxRate: 9.25, fee: 0.0, approval: 77, maxLoan: 3000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 5, name: "Union Bank", short: "Union", slug: "union", type: "govt", rate: 7.00, maxRate: 9.30, fee: 0.0, approval: 76, maxLoan: 2000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 6, name: "HDFC Bank", short: "HDFC", slug: "hdfc", type: "private", rate: 9.00, maxRate: 13.00, fee: 1.0, approval: 72, maxLoan: 5000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 7, name: "ICICI Bank", short: "ICICI", slug: "icici", type: "private", rate: 9.00, maxRate: 12.00, fee: 1.0, approval: 70, maxLoan: 5000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 8, name: "Mahindra Finance", short: "Mahindra", slug: null, type: "nbfc", rate: 10.00, maxRate: 18.00, fee: 2.0, approval: 85, maxLoan: 3000000, tenure: "1-5 yrs", tag: "Rural Expert", tagColor: "#8B5CF6" },
    { id: 9, name: "Axis Bank", short: "Axis", slug: "axis", type: "private", rate: 9.50, maxRate: 13.00, fee: 1.0, approval: 67, maxLoan: 4000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 10, name: "Ujjivan Small Finance", short: "Ujjivan", slug: "ujjivan", type: "smallfinance", rate: 11.49, maxRate: 20.00, fee: 1.0, approval: 88, maxLoan: 1000000, tenure: "1-4 yrs", tag: "Easy Approval", tagColor: "#10B981" },
    { id: 11, name: "Satin Creditcare", short: "Satin", slug: null, type: "nbfc", rate: 11.00, maxRate: 19.00, fee: 1.5, approval: 83, maxLoan: 500000, tenure: "1-3 yrs", tag: null, tagColor: null },
    { id: 12, name: "AU Small Finance Bank", short: "AU SFB", slug: null, type: "smallfinance", rate: 12.00, maxRate: 18.00, fee: 1.5, approval: 87, maxLoan: 1000000, tenure: "1-4 yrs", tag: null, tagColor: null },
    { id: 13, name: "Federal Bank", short: "Federal", slug: "federal", type: "private", rate: 9.50, maxRate: 13.50, fee: 0.50, approval: 68, maxLoan: 3000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 14, name: "Bajaj Finance", short: "Bajaj", slug: null, type: "nbfc", rate: 12.00, maxRate: 20.00, fee: 2.0, approval: 84, maxLoan: 5000000, tenure: "1-5 yrs", tag: null, tagColor: null },
    { id: 15, name: "IndusInd Bank", short: "IndusInd", slug: "indusind", type: "private", rate: 9.75, maxRate: 14.00, fee: 1.0, approval: 65, maxLoan: 3000000, tenure: "1-5 yrs", tag: null, tagColor: null },
  ],
};

const NBFC_DIRECTORY = [
  "UGRO Capital", "Nido Home Finance", "InCred", "Muthoot Finance", "MAS Financial Services",
  "Clix Capital", "Grihasakti", "Cholamandalam Finance", "Kogta Financial", "TruHome Finance",
  "Rathi Group", "Hiranandani Financial", "Aavas Financiers", "Aadhar Housing Finance",
  "HomeFirst Finance", "IKF Finance", "SRG Housing Finance", "AU Small Finance Bank",
  "Aditya Birla Finance", "Hero FinCorp", "Ujjivan Small Finance Bank", "Jana Small Finance Bank",
  "DCB Bank", "Tata Capital", "Credit Saison", "Equitas Small Finance Bank", "Protium Finance",
  "NeoGrowth Credit", "Ratnaafin Capital", "Utkarsh Small Finance Bank", "IIFL Finance", "Bandhan Bank",
];

// Keep the requested loan categories backed by the closest existing lender data.
BANK_DATA.mortgage = BANK_DATA.lap.map(bank => ({ ...bank }));
BANK_DATA.car = BANK_DATA.vehicle4w.map(bank => ({ ...bank }));
BANK_DATA.commercial = BANK_DATA.vehicle4w.map(bank => ({ ...bank }));
BANK_DATA.education = BANK_DATA.personal.map(bank => ({ ...bank }));
BANK_DATA.usedcommercial = BANK_DATA.usedcar.map(bank => ({ ...bank }));

// ─── GOVERNMENT SCHEMES ───────────────────────────────────────────────────────
const GOVT_SCHEMES = [
  {
    id: "mudra", name: "PM Mudra Yojana", nameGu: "PM મુદ્રા યોજના", icon: "🏛️", color: "#B8860B",
    tag: "Business", tagGu: "ધંધો", deadline: null,
    oneLiner: "No collateral loan for small businesses. Zero fee at govt banks.",
    oneLinerGu: "નાના ઉદ્યોગ માટે ગીરો વિના લોન. સ્ટેટ બેંકમાં ફી શૂન્ય.",
    limit: "Up to ₹20 Lakh", limitGu: "₹20 લાખ સુધી", rate: "8.05% onwards", rateGu: "8.05% થી", fee: "Zero at Govt Banks", feeGu: "સ.બ. શૂ.",
    whyGood: ["No collateral needed for loans under ₹10L", "Government backed — banks cannot refuse eligible applicants", "Zero processing fee at SBI, BOB, PNB", "Helps build your CIBIL score from scratch"],
    whyGoodGu: ["₹10L સુધી ગીરો જરૂરી નહીં", "સ. ગેરન્ટી — બેંક ના ન પાડી શકે", "SBI, BOB, PNB માં ફી શૂ.", "CIBIL સ્કોર ઝીરોથી બનાવો"],
    categories: [{ name: "Shishu", nameGu: "શિશુ", amt: "Up to ₹50,000", amtGu: "₹50,000 સુધી" }, { name: "Kishore", nameGu: "કિશોર", amt: "₹50K – ₹5L", amtGu: "₹50K – ₹5L" }, { name: "Tarun Plus", nameGu: "તરુણ પ્લસ", amt: "₹5L – ₹20L", amtGu: "₹5L – ₹20L" }],
    eligibility: ["Indian citizen 18-65 yrs", "Any non-farm small business", "No existing loan default", "Udyam registration preferred"],
    eligibilityGu: ["18-65 ભા. ના.", "કોઈ પણ બિ.-ખ. ધ.", "કોઈ ડ. નહીં", "ઉ. ન. પ."],
    whereToApply: "Any nationalized bank, RRB, or MFI branch. Apply online at udyamimitra.in",
    whereToApplyGu: "કોઈ પણ ર. બ., RRB, MFI. ઓ. udyamimitra.in",
  },
  {
    id: "pmay", name: "PM Awas Yojana 2.0", nameGu: "PM આ. યો. 2.0", icon: "🏠", color: "#3B82F6",
    tag: "Home", tagGu: "ઘર", deadline: "31 March 2026",
    oneLiner: "₹2.5 lakh interest subsidy for first-time home buyers. Deadline: 31 March 2026!",
    oneLinerGu: "પ. ઘ. ₹2.5 લ. સ. — 31 March 2026 છ.!",
    limit: "Subsidy up to ₹2.5L", limitGu: "₹2.5L સ.", rate: "6.5% effective", rateGu: "6.5% અ. દ.", fee: "Minimal", feeGu: "ન.",
    whyGood: ["₹2.5 lakh direct subsidy on home loan interest", "Applicable for MIG income groups (₹6L-₹18L/year)", "Can combine with any bank home loan", "First-time buyer only — one lifetime benefit"],
    whyGoodGu: ["₹2.5 લ. સ. સ. વ. .", "MIG (₹6L-₹18L/ઊ.) .", "ક. બ. ." , "પ. ઘ. — .,  ." ],
    categories: [{ name: "EWS/LIG", nameGu: "EWS/LIG", amt: "Income < ₹6L/yr", amtGu: "< ₹6L/ઊ" }, { name: "MIG-I", nameGu: "MIG-I", amt: "₹6L – ₹12L", amtGu: "₹6L – ₹12L" }, { name: "MIG-II", nameGu: "MIG-II", amt: "₹12L – ₹18L", amtGu: "₹12L – ₹18L" }],
    eligibility: ["Annual family income up to ₹18 Lakh", "No pucca house owned anywhere in India", "First time home buyer", "Aadhar card mandatory"],
    eligibilityGu: ["ઊ. ₹18L સ.", "ક. પ. ઘ. ." , "પ. ઘ. .", "આ. ."],
    whereToApply: "Apply through any bank or housing finance company while taking home loan. Ask your bank specifically for PMAY subsidy.",
    whereToApplyGu: "હ. લ. સ. ક. બ. . PM Awas .",
  },
  {
    id: "vishwakarma", name: "PM Vishwakarma Yojana", nameGu: "PM વિ. Yojana", icon: "🔨", color: "#EC4899",
    tag: "Artisan", tagGu: "ક.", deadline: null,
    oneLiner: "Loan + training for traditional craftsmen & artisans. Carpenters, blacksmiths, tailors & 16 more trades.",
    oneLinerGu: "ક. + .",
    limit: "Up to ₹3 Lakh", limitGu: "₹3 લ. સ.", rate: "5% (Subsidised)", rateGu: "5% (સ.)", fee: "Zero", feeGu: "શૂ.",
    whyGood: ["Lowest interest rate — just 5%", "Free skill training + toolkit worth ₹15,000", "Digital payment incentives included", "Covers 18 traditional trades — carpenters, weavers, potters, etc."],
    whyGoodGu: ["સ. ઓ. — ફ. 5%", "ફ. .",  ".", "18 .: ., ., ." ],
    categories: [{ name: "Stage 1", nameGu: "." , amt: "Up to ₹1 Lakh", amtGu: "₹1L" }, { name: "Stage 2", nameGu: ".", amt: "Up to ₹2 Lakh", amtGu: "₹2L" }, { name: "Toolkit Grant", nameGu: ".", amt: "₹15,000 Free", amtGu: "₹15K ." }],
    eligibility: ["Artisan / craftsman in 18 specified trades", "Age 18+ and working in traditional trade", "Not a govt employee or income taxpayer", "One person per family"],
    eligibilityGu: ["18 .: .", "18+ .", ".", "1 ." ],
    whereToApply: "Register at pmvishwakarma.gov.in or visit nearest Common Service Centre (CSC) / Jan Seva Kendra.",
    whereToApplyGu: "pmvishwakarma.gov.in ., Jan Seva Kendra .",
  },
  {
    id: "svanidhi", name: "PM SVANidhi (Street Vendor)", nameGu: "PM SVANidhi", icon: "🛒", color: "#F97316",
    tag: "Street Vendor", tagGu: ".", deadline: null,
    oneLiner: "Micro loan starting ₹10,000 for street vendors, hawkers, thela walas. No guarantor needed.",
    oneLinerGu: "₹10,000 . —. .",
    limit: "₹10K → ₹20K → ₹50K", limitGu: "₹10K → ₹20K → ₹50K", rate: "7% effective", rateGu: "7%", fee: "Zero", feeGu: ".",
    whyGood: ["Start with just ₹10,000 — no guarantor, no collateral", "Repay on time → next loan auto-approved at higher amount", "₹1200/year cashback for digital payments", "Helps build formal credit history"],
    whyGoodGu: [".", ".", ".", "."],
    categories: [{ name: "1st Loan", nameGu: ".", amt: "₹10,000", amtGu: "₹10K" }, { name: "2nd Loan", nameGu: ".", amt: "₹20,000", amtGu: "₹20K" }, { name: "3rd Loan", nameGu: ".", amt: "₹50,000", amtGu: "₹50K" }],
    eligibility: ["Street vendors / hawkers / thela walas", "Have vending certificate or town vending committee ID", "No minimum income requirement", "Urban areas only"],
    eligibilityGu: [".", ".", ".", "."],
    whereToApply: "Visit nearest Municipal office (Nagarpalika) or apply via SBI, BOB. Can also apply online at pmsvanidhi.mohua.gov.in",
    whereToApplyGu: "ના. (Municipal), SBI, BOB. .: pmsvanidhi.mohua.gov.in",
  },
  {
    id: "pmegp", name: "PMEGP (Employment Generation)", nameGu: "PMEGP", icon: "⚙️", color: "#8B5CF6",
    tag: "Employment", tagGu: ".", deadline: null,
    oneLiner: "15-35% government subsidy on business loan. Manufacturing up to ₹50L, Services up to ₹20L.",
    oneLinerGu: "15-35% ., ₹50L, ₹20L.",
    limit: "Mfg: ₹50L | Service: ₹20L", limitGu: ".", rate: "11-12% approx", rateGu: "~11-12%", fee: "Nominal", feeGu: ".",
    whyGood: ["15% subsidy in urban, 25% in rural areas — free money!", "SC/ST and women get 35% subsidy", "Loan from any bank, subsidy from government", "No need to repay the subsidy amount"],
    whyGoodGu: [".", "SC/ST .", ".", "."],
    categories: [{ name: "Urban", nameGu: ".", amt: "15% subsidy", amtGu: "15%" }, { name: "Rural", nameGu: ".", amt: "25% subsidy", amtGu: "25%" }, { name: "SC/ST/Women", nameGu: ".", amt: "35% subsidy", amtGu: "35%" }],
    eligibility: ["Age above 18 years", "Minimum 8th standard pass", "New project only (not expansion)", "No existing government subsidy on any loan"],
    eligibilityGu: ["18+ .", "8 . .", ".", "."],
    whereToApply: "Apply through KVIC (Khadi and Village Industries Commission) office or nearest bank. Apply online at kviconline.gov.in/pmegpeportal",
    whereToApplyGu: "KVIC ., ., kviconline.gov.in/pmegpeportal",
  },
  {
    id: "standup", name: "Stand Up India", nameGu: "Stand Up India", icon: "💪", color: "#10B981",
    tag: "SC/ST/Women", tagGu: ".", deadline: null,
    oneLiner: "₹10 Lakh to ₹1 Crore loan for SC/ST and women entrepreneurs to start new businesses.",
    oneLinerGu: "SC/ST . ₹10L-₹1Cr.",
    limit: "₹10 Lakh to ₹1 Crore", limitGu: "₹10L – ₹1Cr", rate: "Base rate + 3%", rateGu: "B.R. + 3%", fee: "Minimal", feeGu: ".",
    whyGood: ["At least one SC/ST and one woman borrower per bank branch — guaranteed!", "For greenfield (new) enterprises only", "Composite loan — working capital + term loan together", "Government ensures banks actually give these loans"],
    whyGoodGu: [".", ".", ".", "."],
    categories: [{ name: "SC/ST", nameGu: ".", amt: "₹10L – ₹1Cr", amtGu: "₹10L – ₹1Cr" }, { name: "Women", nameGu: ".", amt: "₹10L – ₹1Cr", amtGu: "₹10L – ₹1Cr" }, { name: "All Sectors", nameGu: ".", amt: "Manufacturing & Service", amtGu: ". & ." }],
    eligibility: ["SC/ST or women entrepreneur", "Age above 18 years", "Greenfield (new) enterprise only", "No NPA in any bank"],
    eligibilityGu: ["SC/ST .", "18+ .", ".", "No NPA"],
    whereToApply: "Visit any scheduled commercial bank branch and specifically ask for Stand Up India loan. Also: standupmitra.in",
    whereToApplyGu: "ક. .  .,  standupmitra.in",
  },
];

// ─── NEWS DATA ────────────────────────────────────────────────────────────────
const NEWS = [
  { id: 1, type: "fraud", urgent: true, tag: "Digital Fraud", tagColor: "#EF4444", time: "3 hours ago", timeGu: "3 ક. પ.", readMin: 4,
    title: "⚠️ Surat man loses ₹8 lakh in 'Digital Arrest' scam — police warn of 500+ cases in Gujarat this year",
    titleGu: "⚠️ સ. ₹8 લ. 'ડ. .' — 500+ ." ,
    summary: "Fraudsters called posing as CBI officers. Said his Aadhar was used in drug trafficking. Kept him on video call for 14 hours. Transferred all savings before realising it was completely fake. Police say never pay money to anyone claiming to be a government officer on a video call.",
    summaryGu: "." ,
    warning: "CBI/ED/Police NEVER arrest you on video call. NEVER transfer money under pressure. Hang up and call 1930.",
    warningGu: "CBI/ED/Police .", shareText: "⚠️ Digital Arrest scam alert — Surat ma ₹8 lakh gone! Share karo badha ne: gujaratloanmitra.com/news/digital-arrest" },
  { id: 2, type: "govt", urgent: false, tag: "Govt Scheme", tagColor: "#10B981", time: "Yesterday", timeGu: "ગ.ક.", readMin: 5,
    title: "🏛️ PM Mudra Yojana limit doubled to ₹20 Lakh — small business owners in Gujarat can apply now",
    titleGu: "🏛️ PM . ₹20 .",
    summary: "Government doubled Mudra Tarun Plus loan limit from ₹10L to ₹20L. No collateral needed for loans under ₹10L. Processing fee is zero at government banks. Any Indian citizen with a small non-farm business can apply at nearest bank branch.",
    summaryGu: ".", warning: null, warningGu: null,
    shareText: "🏛️ Mudra loan limit ₹20 Lakh thi! Tamara business mate apply karo. gujaratloanmitra.com/news/mudra-20lakh" },
  { id: 3, type: "fraud", urgent: true, tag: "RBI Alert", tagColor: "#EF4444", time: "2 days ago", timeGu: "2 .", readMin: 3,
    title: "⚠️ 94 fake loan apps removed from Play Store — RBI releases full list, check if you have any",
    titleGu: "⚠️ 94 . — RBI ." ,
    summary: "RBI has banned 94 loan apps that were stealing Aadhar, PAN, contact list and photos from users' phones. These apps then threatened and blackmailed users. If you have any unknown loan app, delete it immediately and change all banking passwords.",
    summaryGu: ".",
    warning: "Only use loan apps from RBI-registered lenders. Always check RBI website before downloading any finance app.",
    warningGu: "RBI .", shareText: "⚠️ 94 fake loan apps RBI ne ban karya! Delete karo. gujaratloanmitra.com/news/fake-apps" },
  { id: 4, type: "govt", urgent: false, tag: "PMAY", tagColor: "#3B82F6", time: "3 days ago", timeGu: "3 .", readMin: 6,
    title: "🏠 PM Awas Yojana 2.0 — ₹2.5 lakh subsidy for middle class home buyers, last date 31 March 2026",
    titleGu: "🏠 PMAY 2.0 — ₹2.5 . — 31 . 2026",
    summary: "PMAY 2.0 subsidy open for families earning ₹6L-18L per year. First time home buyers get ₹2.5 lakh interest subsidy. Apply through your bank while taking home loan — specifically ask for PMAY subsidy. Required documents: Aadhar, income proof, no prior pucca house ownership certificate.",
    summaryGu: ".", warning: null, warningGu: null,
    shareText: "🏠 PMAY 2.0 — ₹2.5 lakh subsidy, 31 March deadline! gujaratloanmitra.com/news/pmay" },
  { id: 5, type: "fraud", urgent: false, tag: "Police Alert", tagColor: "#F59E0B", time: "4 days ago", timeGu: "4 .", readMin: 4,
    title: "📱 WhatsApp pe 'Loan Approved' message aavyo? — Rajkot police warns these 5 signs mean it's a scam",
    titleGu: "📱 WhatsApp 'Loan Approved'? — . 5 .",
    summary: "Rajkot police arrested 3 men running fake loan scheme over WhatsApp. They sent 'loan approved' messages, then asked for processing fee upfront. Collected ₹45 lakh from 180 victims across Gujarat. Real banks NEVER ask money before disbursing a loan.",
    summaryGu: ".",
    warning: "Real lenders NEVER ask processing fee before loan disbursement. Report at cybercrime.gov.in or call 1930.",
    warningGu: ".", shareText: "📱 WhatsApp loan scam — 5 warning signs! gujaratloanmitra.com/news/whatsapp-loan-scam" },
  { id: 6, type: "govt", urgent: false, tag: "Vishwakarma", tagColor: "#EC4899", time: "5 days ago", timeGu: "5 .", readMin: 5,
    title: "🔨 PM Vishwakarma Yojana — 5% loan + free toolkit for carpenters, tailors, weavers & 15 more trades",
    titleGu: "🔨 PM . — 5% + . .",
    summary: "PM Vishwakarma scheme covers 18 traditional trades including carpenters, blacksmiths, tailors, weavers, potters and more. Benefits: 5% interest loan up to ₹3L, free skill training, free toolkit worth ₹15,000 and digital payment cashback. Apply at nearest Jan Seva Kendra.",
    summaryGu: ".", warning: null, warningGu: null,
    shareText: "🔨 PM Vishwakarma — carpenters, tailors, weavers mate 5% loan + free toolkit! gujaratloanmitra.com/news/vishwakarma" },
  { id: 7, type: "fraud", urgent: false, tag: "SIM Swap Alert", tagColor: "#EF4444", time: "1 week ago", timeGu: "1 .", readMin: 3,
    title: "🔴 New OTP fraud — scammers pose as bank employees for 'SIM update', then drain your account — Ahmedabad",
    titleGu: "🔴 OTP . — . — .",
    summary: "New SIM swap fraud reported in Ahmedabad. Scammers call posing as bank employees, say your SIM needs security update and ask for OTP. Once they get OTP, they swap your SIM and drain your account. 23 cases registered this month alone.",
    summaryGu: ".",
    warning: "Your bank will NEVER call and ask for OTP. If someone asks for OTP on call — hang up immediately and call your bank directly.",
    warningGu: ".", shareText: "🔴 SIM Swap fraud — Ahmedabad alert! Share family sathe. gujaratloanmitra.com/news/sim-swap" },
  { id: 8, type: "govt", urgent: false, tag: "SVANidhi", tagColor: "#F97316", time: "1 week ago", timeGu: "1 .", readMin: 4,
    title: "🛒 PM SVANidhi — ₹10,000 loan without guarantor for thela walas, hawkers and street vendors",
    titleGu: "🛒 PM SVANidhi — ₹10,000 . .",
    summary: "PM SVANidhi gives micro loans to street vendors starting at ₹10,000 with no guarantor and no collateral. Pay back on time and automatically get ₹20,000 next, then ₹50,000. Also get ₹1200 per year cashback for using digital payments. Apply at nearest Municipal office or SBI/BOB branch.",
    summaryGu: ".", warning: null, warningGu: null,
    shareText: "🛒 SVANidhi — ₹10,000 loan without guarantor for street vendors! gujaratloanmitra.com/news/svanidhi" },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: "100vh", background: "#FBF8F1", fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 430, margin: "0 auto", paddingBottom: 80 },
  header: { background: "linear-gradient(180deg,#FFFFFF,#FBF8F1)", padding: "14px 16px 0", position: "sticky", top: 0, zIndex: 20 },
  card: { background: "rgba(184,134,11,0.035)", border: "1px solid rgba(184,134,11,0.15)", borderRadius: 16, padding: "14px" },
  orange: { background: "linear-gradient(135deg,#D4AF37,#9C7A1E)", border: "none", borderRadius: 14, color: "#fff", fontWeight: 700, cursor: "pointer" },
  tag: (color) => ({ background: `${color}22`, color, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }),
};

// ─── SEARCH MODAL ─────────────────────────────────────────────────────────────
function SearchModal({ onClose, setPage, setCompareType, lang, profiles }) {
  const [q, setQ] = useState("");
  const isGu = lang === "gu";
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const allItems = [
    ...Object.entries(LOAN_META).map(([k, v]) => ({ label: v.label, labelGu: v.labelGu, icon: v.logo || v.icon, type: "loan", key: k })),
    ...Object.entries(BANK_DATA).flatMap(([loanType, banks]) => banks.map(bank => ({
      label: bank.name,
      labelGu: bank.name,
      icon: "🏦",
      type: "bank",
      key: bank.slug || bank.name,
      loanType,
      searchTerms: [bank.name, bank.short, bank.slug].filter(Boolean).join(" "),
    }))).filter((bank, i, all) => all.findIndex(item => item.label === bank.label) === i),
    ...NBFC_DIRECTORY
      .filter(name => !Object.values(BANK_DATA).flat().some(bank => bank.name.toLowerCase() === name.toLowerCase()))
      .map(name => ({
        label: name,
        labelGu: name,
        icon: "🏦",
        type: "bank",
        key: name,
        loanType: "home",
        searchTerms: name,
      })),
    ...GOVT_SCHEMES.map(s => ({ label: s.name, labelGu: s.nameGu, icon: s.icon, type: "scheme", key: s.id })),
    ...profiles.map(profile => ({
      label: profile.name,
      labelGu: profile.name,
      icon: profile.photo || "🤝",
      type: "dsa",
      key: profile.id,
      searchTerms: [profile.name, profile.designation, profile.city, profile.specializations, profile.languages].filter(Boolean).join(" "),
    })),
  ];

  const results = q.length > 1 ? allItems.filter(item => {
    const query = q.trim().toLowerCase();
    return item.label.toLowerCase().includes(query)
      || item.labelGu?.toLowerCase().includes(query)
      || item.searchTerms?.toLowerCase().includes(query);
  }) : [];

  const handleSelect = (item) => {
    if (item.type === "loan") { setCompareType(item.key); setPage("compare"); }
    else if (item.type === "scheme") { setPage("schemes"); }
    else if (item.type === "dsa") { setPage("dsas"); }
    else {
      if (item.loanType) setCompareType(item.loanType);
      setPage("compare");
    }
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,15,5,0.55)", zIndex: 200, display: "flex", flexDirection: "column", padding: "16px" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, background: "#FFFFFF", border: "1px solid rgba(184,134,11,0.3)", borderRadius: 14, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <span style={{ fontSize: 18 }}>🔍</span>
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder={isGu ? "." : "Search loans, banks, schemes..."} style={{ background: "none", border: "none", color: "#2B2115", fontSize: 16, outline: "none", fontFamily: "inherit", flex: 1 }} />
        </div>
        <button onClick={onClose} style={{ background: "#FFFFFF", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 14, padding: "0 16px", color: "#2B2115", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{isGu ? "." : "Cancel"}</button>
      </div>

      {q.length < 2 && (
        <div>
          <p style={{ color: "rgba(43,33,21,0.5)", fontSize: 12, fontWeight: 600, margin: "0 0 12px" }}>{isGu ? "." : "Quick Links"}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(LOAN_META).map(([k, v]) => (
              <button key={k} onClick={() => { setCompareType(k); setPage("compare"); onClose(); }} style={{ background: "#FFFFFF", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 20, padding: "7px 14px", color: "rgba(43,33,21,0.75)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <LoanTypeLogo type={k} size={16} />
                {isGu ? v.labelGu : v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {results.map((item, i) => (
            <button key={i} onClick={() => handleSelect(item)} style={{ background: "#FFFFFF", border: "1px solid rgba(184,134,11,0.15)", borderRadius: 14, padding: "14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
              {item.type === "loan" ? <LoanTypeLogo type={item.key} size={24} /> : item.type === "dsa" && item.icon.startsWith("http") ? <img src={item.icon} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "50%" }} /> : <span style={{ fontSize: 24 }}>{item.icon}</span>}
              <div>
                <p style={{ color: "#2B2115", fontSize: 14, fontWeight: 600, margin: 0 }}>{isGu ? item.labelGu : item.label}</p>
                <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 11, margin: "2px 0 0", textTransform: "capitalize" }}>{item.type}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {q.length >= 2 && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: 40, margin: "0 0 12px" }}>🔍</p>
          <p style={{ color: "rgba(43,33,21,0.5)", fontSize: 14 }}>{isGu ? "." : `No results for "${q}"`}</p>
        </div>
      )}
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ name, lang, setLang, setPage, setCompareType, showSearch, setShowSearch, news }) {
  const isGu = lang === "gu";
  const topRates = [
    { type: "home", bank: "SBI", rate: "7.50%", icon: "🏠" }, { type: "personal", bank: "HDFC", rate: "9.99%", icon: "💰" },
    { type: "gold", bank: "Muthoot", rate: "8.00%", icon: "💎" }, { type: "vehicle4w", bank: "ICICI", rate: "8.50%", icon: "🚗" },
    { type: "usedcar", bank: "SBI", rate: "9.25%", icon: "🚙" }, { type: "kisan", bank: "SBI", rate: "7.00%", icon: "🌾" },
  ];
  return (
    <div className="loan-page" style={S.page}>
      <div style={{ ...S.header, paddingBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 12 }}>
        </div>
        <button onClick={() => setShowSearch(true)} style={{ width: "100%", background: "linear-gradient(180deg, #FFFFFF 0%, #FFFDF8 100%)", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", boxShadow: "0 8px 18px rgba(184,134,11,0.08)" }}>
          <span style={{ fontSize: 16, display: "inline-flex", width: 24, height: 24, borderRadius: 8, background: "rgba(184,134,11,0.08)", alignItems: "center", justifyContent: "center" }}>🔍</span>
          <span style={{ color: "rgba(43,33,21,0.45)", fontSize: 13 }}>{isGu ? "." : "Search loan, bank, scheme..."}</span>
        </button>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        {/* Trust bar */}
        <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "8px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>✅</span>
          <span style={{ color: "#0F8F5E", fontSize: 11, fontWeight: 600 }}>{isGu ? "." : "Indicative rates only. Lender terms, fees and eligibility may change."}</span>
        </div>

        {/* Loan types */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ color: "#2B2115", fontSize: 14, fontWeight: 800, margin: 0 }}>{isGu ? "." : "Loan Types"}</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 20 }}>
          {Object.entries(LOAN_META).map(([key, val]) => (
            <button key={key} onClick={() => { setCompareType(key); setPage("compare"); }} style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FFFDF8 100%)", border: "1px solid rgba(184,134,11,0.15)", borderRadius: 14, padding: "10px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, boxShadow: "0 8px 18px rgba(184,134,11,0.04)", transition: "all 0.2s ease" }}>
              <LoanTypeLogo type={key} size={22} />
              <span style={{ color: "rgba(43,33,21,0.65)", fontSize: 8, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>{isGu ? val.labelGu : val.label}</span>
            </button>
          ))}
        </div>

        {/* Govt Schemes banner */}
        <div onClick={() => setPage("schemes")} style={{ background: "linear-gradient(135deg,rgba(212,175,55,0.16),rgba(16,185,129,0.08))", border: "1px solid rgba(184,134,11,0.3)", borderRadius: 16, padding: "14px 16px", marginBottom: 20, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(184,134,11,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🏛️</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#2B2115", fontSize: 14, fontWeight: 800, margin: "0 0 3px" }}>{isGu ? "." : "Government Schemes"}</p>
            <p style={{ color: "rgba(43,33,21,0.5)", fontSize: 12, margin: 0 }}>{isGu ? "." : "Mudra • PMAY • Vishwakarma • SVANidhi • PMEGP"}</p>
          </div>
          <span style={{ color: "#B8860B", fontSize: 20 }}>›</span>
        </div>

        {/* Today's best rates */}
        <h3 style={{ color: "#2B2115", fontSize: 14, fontWeight: 800, margin: "0 0 12px" }}>{isGu ? "." : "Today's Best Rates"}</h3>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none", marginBottom: 20 }}>
          {topRates.map((r, i) => (
            <div key={i} onClick={() => { setCompareType(r.type); setPage("compare"); }} style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FFFDF8 100%)", border: "1px solid rgba(184,134,11,0.15)", borderRadius: 14, padding: "12px", minWidth: 100, cursor: "pointer", flexShrink: 0, boxShadow: "0 8px 20px rgba(184,134,11,0.06)" }}>
              <LoanTypeLogo type={r.type} size={22} />
              <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 9, margin: "6px 0 2px", fontWeight: 600 }}>{r.bank}</p>
              <p style={{ color: "#B8860B", fontSize: 18, fontWeight: 800, margin: 0 }}>{r.rate}</p>
              <p style={{ color: "rgba(43,33,21,0.35)", fontSize: 8, margin: "2px 0 0" }}>{isGu ? "." : "onwards"}</p>
            </div>
          ))}
        </div>

        {/* News preview */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ color: "#2B2115", fontSize: 14, fontWeight: 800, margin: 0 }}>{isGu ? "." : "Latest News & Alerts"}</h3>
          <button onClick={() => setPage("news")} style={{ background: "none", border: "none", color: "#B8860B", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{isGu ? "." : "See all →"}</button>
        </div>
        {news.slice(0, 3).map((item, i) => (
          <div key={i} onClick={() => setPage("news")} style={{ background: "#FFFFFF", border: `1px solid ${item.urgent ? "rgba(239,68,68,0.25)" : "rgba(184,134,11,0.15)"}`, borderLeft: `3px solid ${item.tagColor}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, cursor: "pointer" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={S.tag(item.tagColor)}>{item.tag}</span>
              <span style={{ color: "rgba(43,33,21,0.3)", fontSize: 10 }}>{isGu ? item.timeGu : item.time}</span>
            </div>
            <p style={{ color: "#2B2115", fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{isGu ? item.titleGu : item.title}</p>
          </div>
        ))}
      </div>
      <style>{`::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

// ─── COMPARE PAGE ─────────────────────────────────────────────────────────────
function ComparePage({ lang, setLang, initType, setPage, setDetailBank, bankData }) {
  const [activeType, setActiveType] = useState(initType || "home");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("rate");
  const [expanded, setExpanded] = useState(null);
  const [showCibil, setShowCibil] = useState(false);
  const [showApprovalInfo, setShowApprovalInfo] = useState(false);
  const [selectedBankIds, setSelectedBankIds] = useState([]);
  const isGu = lang === "gu";

  useEffect(() => { setActiveTab("all"); setExpanded(null); setSelectedBankIds([]); }, [activeType]);

  const banks = (bankData[activeType] || [])
    .filter(b => activeTab === "all" || b.type === activeTab)
    .sort((a, b) => sortBy === "rate" ? a.rate - b.rate : sortBy === "fee" ? a.fee - b.fee : b.approval - a.approval);

  const getAC = r => r >= 80 ? "#0F8F5E" : r >= 70 ? "#B8860B" : "#EF4444";
  const selectedBanks = banks.filter(bank => selectedBankIds.includes(bank.id));
  const toggleCompareBank = (bankId) => {
    setSelectedBankIds(current => current.includes(bankId)
      ? current.filter(id => id !== bankId)
      : current.length < 2 ? [...current, bankId] : current);
  };

  return (
    <div className="loan-page" style={S.page}>
      <div style={{ ...S.header }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, paddingBottom: 2 }}>
          <button onClick={() => setPage("home")} style={{ background: "#FFFFFF", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 10, width: 36, height: 36, color: "#2B2115", fontSize: 18, cursor: "pointer" }}>←</button>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: "#2B2115", fontSize: 17, fontWeight: 800, margin: 0 }}>{LOAN_META[activeType]?.icon} {isGu ? LOAN_META[activeType]?.labelGu : LOAN_META[activeType]?.label}</h2>
            <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 10, margin: 0 }}>{banks.length} {isGu ? "." : "banks"} • Feb 2026 • <span style={{ color: "#0F8F5E" }}>✅ RBI data</span></p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
          {Object.entries(LOAN_META).map(([k, v]) => (
            <button key={k} onClick={() => setActiveType(k)} style={{ display: "flex", alignItems: "center", gap: 4, background: activeType === k ? "rgba(184,134,11,0.14)" : "#FFFFFF", border: `1.5px solid ${activeType === k ? "rgba(184,134,11,0.4)" : "rgba(184,134,11,0.12)"}`, borderRadius: 20, padding: "5px 11px", cursor: "pointer", flexShrink: 0 }}>
              <span style={{ fontSize: 13 }}>{v.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: activeType === k ? "#B8860B" : "rgba(43,33,21,0.45)", whiteSpace: "nowrap" }}>{isGu ? v.labelGu : v.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, paddingBottom: 10, overflowX: "auto", scrollbarWidth: "none" }}>
          {[{ id: "rate", l: isGu ? "." : "Lowest Rate" }, { id: "fee", l: isGu ? "." : "Lowest Fee" }, { id: "approval", l: isGu ? "." : "Best Approval" }].map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id)} style={{ background: sortBy === s.id ? "#B8860B" : "#FFFFFF", border: sortBy === s.id ? "none" : "1px solid rgba(184,134,11,0.15)", borderRadius: 20, padding: "6px 13px", color: sortBy === s.id ? "#fff" : "rgba(43,33,21,0.55)", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{s.l}</button>
          ))}
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(184,134,11,0.15)" }}>
          {[{ id: "all", l: isGu ? "." : "All" }, { id: "govt", l: isGu ? "." : "Govt" }, { id: "private", l: isGu ? "." : "Private" }, { id: "nbfc", l: "NBFC" }, { id: "smallfinance", l: isGu ? "." : "Small Fin" }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, background: "none", border: "none", padding: "8px 2px 10px", color: activeTab === t.id ? "#B8860B" : "rgba(43,33,21,0.4)", fontSize: 9.5, fontWeight: 700, cursor: "pointer", borderBottom: activeTab === t.id ? "2px solid #B8860B" : "2px solid transparent", whiteSpace: "nowrap" }}>{t.l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 16px 0" }}>
        <div onClick={() => setShowCibil(true)} style={{ ...S.card, background: "linear-gradient(135deg,rgba(139,92,246,0.1),rgba(184,134,11,0.06))", border: "1px solid rgba(139,92,246,0.2)", marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>📊</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#2B2115", fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{isGu ? "." : "Check CIBIL Score — Get Better Rates!"}</p>
            <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 10, margin: 0 }}>{isGu ? "." : "750+ score = 0.25-0.5% lower interest rate"}</p>
          </div>
          <div style={{ background: "linear-gradient(135deg,#8B5CF6,#6D4FC7)", borderRadius: 10, padding: "7px 12px", color: "#fff", fontSize: 10, fontWeight: 700 }}>{isGu ? "." : "Free"}</div>
        </div>

        {/* Approval Rate info */}
        <div onClick={() => setShowApprovalInfo(!showApprovalInfo)} style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>ℹ️</span>
          <p style={{ color: "#0F8F5E", fontSize: 11, fontWeight: 600, margin: 0, flex: 1 }}>{isGu ? "." : "What does Approval Rate mean?"}</p>
          <span style={{ color: "#0F8F5E", fontSize: 14 }}>{showApprovalInfo ? "↑" : "↓"}</span>
        </div>
        {showApprovalInfo && (
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(184,134,11,0.15)", borderRadius: 10, padding: "12px 14px", marginBottom: 12, animation: "fadeIn 0.2s ease" }}>
            <p style={{ color: "rgba(43,33,21,0.75)", fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              {isGu ? "." : "Approval Rate = out of 100 eligible applicants who applied, how many got approved. Example: SBI 82% means 82 out of 100 eligible people got their loan. Higher = easier to get loan. Data based on RBI published stats."}
            </p>
          </div>
        )}

        <div style={{ background: selectedBanks.length === 2 ? "rgba(16,185,129,0.08)" : "rgba(184,134,11,0.06)", border: `1px solid ${selectedBanks.length === 2 ? "rgba(16,185,129,0.25)" : "rgba(184,134,11,0.18)"}`, borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
          <p style={{ color: selectedBanks.length === 2 ? "#0F8F5E" : "#B8860B", fontSize: 11, fontWeight: 700, margin: 0 }}>
            {selectedBanks.length === 2
              ? "Two banks selected — compare their rates, fees and approval below."
              : `Select ${2 - selectedBanks.length} more bank${selectedBanks.length === 1 ? "" : "s"} to compare.`}
          </p>
        </div>

        {selectedBanks.length === 2 && (
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(184,134,11,0.22)", borderRadius: 16, padding: 12, marginBottom: 14, boxShadow: "0 8px 20px rgba(184,134,11,0.07)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {selectedBanks.map(bank => (
                <div key={bank.id} style={{ border: "1px solid rgba(184,134,11,0.15)", borderRadius: 12, padding: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                    <BankLogo slug={bank.slug} name={bank.name} size={28} />
                    <strong style={{ color: "#2B2115", fontSize: 11, lineHeight: 1.2 }}>{bank.name}</strong>
                  </div>
                  {[["Rate", formatRateRange(bank.rate, bank.maxRate)], ["Fee", bank.fee === 0 ? "Zero" : `${bank.fee}%`], ["Approval", `${bank.approval}%`], ["Max loan", fmtL(bank.maxLoan)]].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 6, padding: "5px 0", borderTop: "1px solid rgba(184,134,11,0.1)" }}>
                      <span style={{ color: "rgba(43,33,21,0.45)", fontSize: 9 }}>{label}</span>
                      <span style={{ color: "#2B2115", fontSize: 10, fontWeight: 800 }}>{value}</span>
                    </div>
                  ))}
                  <button onClick={() => toggleCompareBank(bank.id)} style={{ width: "100%", marginTop: 8, padding: "6px", background: "rgba(184,134,11,0.08)", border: "none", borderRadius: 8, color: "#B8860B", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {banks.map(bank => (
            <div key={bank.id} onClick={() => setExpanded(expanded === bank.id ? null : bank.id)} style={{ background: expanded === bank.id ? "rgba(184,134,11,0.06)" : "#FFFFFF", border: `1px solid ${expanded === bank.id ? "rgba(184,134,11,0.3)" : "rgba(184,134,11,0.15)"}`, borderRadius: 16, padding: "14px", cursor: "pointer", transition: "all 0.2s", boxShadow: expanded === bank.id ? "0 4px 16px rgba(184,134,11,0.08)" : "0 1px 4px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <BankLogo slug={bank.slug} name={bank.name} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <h3 style={{ color: "#2B2115", fontSize: 13, fontWeight: 800, margin: 0 }}>{bank.name}</h3>
                    {bank.tag && <span style={S.tag(bank.tagColor)}>{bank.tag}</span>}
                  </div>
                  <p style={{ color: "rgba(43,33,21,0.4)", fontSize: 10, margin: "2px 0 0", textTransform: "capitalize" }}>{bank.type === "govt" ? (isGu ? "." : "Govt Bank") : bank.type === "private" ? (isGu ? "." : "Private Bank") : bank.type === "nbfc" ? "NBFC" : (isGu ? "." : "Small Finance")}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={e => { e.stopPropagation(); toggleCompareBank(bank.id); }} style={{ padding: "6px 8px", background: selectedBankIds.includes(bank.id) ? "#B8860B" : "rgba(184,134,11,0.08)", border: "1px solid rgba(184,134,11,0.18)", borderRadius: 8, color: selectedBankIds.includes(bank.id) ? "#fff" : "#B8860B", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
                    {selectedBankIds.includes(bank.id) ? "Selected" : "Compare"}
                  </button>
                  <span style={{ color: "rgba(43,33,21,0.25)", fontSize: 16, transform: expanded === bank.id ? "rotate(180deg)" : "none", transition: "0.2s" }}>⌄</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div style={{ background: "rgba(184,134,11,0.05)", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                  <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 8, margin: "0 0 3px", fontWeight: 600 }}>{isGu ? "." : "Rate"}</p>
                  <p style={{ color: "#B8860B", fontSize: 17, fontWeight: 800, margin: 0 }}>{formatRateRange(bank.rate, bank.maxRate)}</p>
                  <p style={{ color: "rgba(43,33,21,0.3)", fontSize: 8, margin: 0 }}>{isGu ? "." : "interest range"}</p>
                </div>
                <div style={{ background: "rgba(59,130,246,0.06)", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                  <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 8, margin: "0 0 3px", fontWeight: 600 }}>{isGu ? "." : "Fee"}</p>
                  <p style={{ color: "#3B82F6", fontSize: 17, fontWeight: 800, margin: 0 }}>{bank.fee === 0 ? "Zero" : bank.fee + "%"}</p>
                  <p style={{ color: "rgba(43,33,21,0.3)", fontSize: 8, margin: 0 }}>{isGu ? "." : "of loan"}</p>
                </div>
                <div style={{ background: `${getAC(bank.approval)}11`, border: `1px solid ${getAC(bank.approval)}33`, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                  <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 8, margin: "0 0 3px", fontWeight: 600 }}>{isGu ? "." : "Approval"}</p>
                  <p style={{ color: getAC(bank.approval), fontSize: 17, fontWeight: 800, margin: 0 }}>{bank.approval}%</p>
                  <p style={{ color: "rgba(43,33,21,0.3)", fontSize: 7, margin: 0 }}>RBI ✓</p>
                </div>
              </div>
              {expanded === bank.id && (
                <div style={{ marginTop: 12, animation: "fadeIn 0.2s ease" }}>
                  <div style={{ borderTop: "1px solid rgba(184,134,11,0.15)", paddingTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div><p style={{ color: "rgba(43,33,21,0.4)", fontSize: 9, margin: "0 0 2px" }}>{isGu ? "." : "Max Loan"}</p><p style={{ color: "#2B2115", fontSize: 13, fontWeight: 700, margin: 0 }}>{fmtL(bank.maxLoan)}</p></div>
                    <div><p style={{ color: "rgba(43,33,21,0.4)", fontSize: 9, margin: "0 0 2px" }}>{isGu ? "." : "Tenure"}</p><p style={{ color: "#2B2115", fontSize: 13, fontWeight: 700, margin: 0 }}>{bank.tenure}</p></div>
                    <div><p style={{ color: "rgba(43,33,21,0.4)", fontSize: 9, margin: "0 0 2px" }}>{isGu ? "." : "Rate Range"}</p><p style={{ color: "#2B2115", fontSize: 13, fontWeight: 700, margin: 0 }}>{formatRateRange(bank.rate, bank.maxRate)}</p></div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={e => { e.stopPropagation(); setDetailBank({ ...bank, loanType: activeType }); setPage("detail"); }} style={{ flex: 1, padding: "12px", ...S.orange, fontSize: 13 }}>
                      {isGu ? "." : "Apply & EMI →"}
                    </button>
                    <button style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 12, color: "rgba(43,33,21,0.65)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🔖</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <p style={{ textAlign: "center", color: "rgba(43,33,21,0.3)", fontSize: 10, padding: "8px 0" }}>Source: RBI • BankBazaar • Paisabazaar | Updated Feb 2026</p>
        </div>
      </div>

      {/* CIBIL popup */}
      {showCibil && (
        <div onClick={() => setShowCibil(false)} style={{ position: "fixed", inset: 0, background: "rgba(20,15,5,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 430, animation: "slideUp 0.3s ease", boxShadow: "0 -8px 30px rgba(0,0,0,0.12)" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(184,134,11,0.2)", margin: "0 auto 24px" }} />
            <div style={{ width: 68, height: 68, borderRadius: 18, background: "rgba(139,92,246,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 14px" }}>📊</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <span style={{ background: "rgba(184,134,11,0.12)", color: "#B8860B", fontSize: 11, fontWeight: 800, padding: "4px 16px", borderRadius: 20, border: "1px solid rgba(184,134,11,0.3)" }}>🚀 {isGu ? "." : "COMING SOON"}</span>
            </div>
            <h2 style={{ color: "#2B2115", fontSize: 20, fontWeight: 800, textAlign: "center", margin: "0 0 10px" }}>CIBIL Score Check</h2>
            <p style={{ color: "rgba(43,33,21,0.55)", fontSize: 13, textAlign: "center", lineHeight: 1.6, margin: "0 0 20px" }}>{isGu ? "." : "Free CIBIL check coming soon to Gujarat Loan Mitra! We're building it just for you."}</p>
            {[{ icon: "✅", t: isGu ? "." : "Free CIBIL score check" }, { icon: "🎯", t: isGu ? "." : "Best loan matched to your score" }, { icon: "📈", t: isGu ? "." : "Tips to improve your score" }].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 2 ? "1px solid rgba(184,134,11,0.12)" : "none" }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ color: "rgba(43,33,21,0.75)", fontSize: 13 }}>{item.t}</span>
              </div>
            ))}
            <button onClick={() => setShowCibil(false)} style={{ width: "100%", marginTop: 20, padding: "14px", ...S.orange, fontSize: 14 }}>{isGu ? "." : "Got it! 👍"}</button>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

// ─── BANK DETAIL PAGE ─────────────────────────────────────────────────────────
function DetailPage({ bank, lang, setPage }) {
  const [activeTab, setActiveTab] = useState("emi");
  const meta = LOAN_META[bank?.loanType || "home"];
  const [loanAmt, setLoanAmt] = useState(meta?.defaultAmt || 2000000);
  const [tenure, setTenure] = useState(10);
  const [calculatorMode, setCalculatorMode] = useState("loan");
  const [monthlyBudget, setMonthlyBudget] = useState(Math.round(calcEMI(meta.defaultAmt, meta.defaultRate, 120)));
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [bView, setBView] = useState("yearly");
  const [showApply, setShowApply] = useState(false);
  const [applyDone, setApplyDone] = useState(false);
  const [inquiry, setInquiry] = useState({ name: "", phone: "", city: "", employment: "", amount: String(loanAmt), tenure: String(tenure) });
  const isGu = lang === "gu";
  const rate = bank?.rate || 8.5;
  const tm = tenure * 12;
  const emi = Math.round(calcEMI(loanAmt, rate, tm));
  const total = emi * tm;
  const interest = total - loanAmt;
  const iP = Math.round((interest / total) * 100);
  const pP = 100 - iP;
  const schedule = useMemo(() => calcSchedule(loanAmt, rate, tm), [loanAmt, rate, tm]);
  const yearly = useMemo(() => Array.from({ length: tenure }, (_, y) => {
    const ms = schedule.slice(y * 12, (y + 1) * 12);
    return { year: y + 1, totalEMI: ms.reduce((s, m) => s + m.emi, 0), totalInterest: ms.reduce((s, m) => s + m.interest, 0), totalPrincipal: ms.reduce((s, m) => s + m.principal, 0), balance: ms[ms.length - 1]?.balance || 0 };
  }), [schedule, tenure]);
  const yr5pct = yearly.length >= 5 ? Math.round((yearly.slice(0, 5).reduce((s, y) => s + y.totalInterest, 0) / yearly.slice(0, 5).reduce((s, y) => s + y.totalEMI, 0)) * 100) : 60;

  const docs = {
    home: [{ icon: "🪪", doc: "Identity Proof", sub: "Aadhar / PAN / Passport" }, { icon: "🏠", doc: "Address Proof", sub: "Utility bill / Aadhar" }, { icon: "💼", doc: "Income Proof", sub: "3 months salary slip / ITR" }, { icon: "🏗️", doc: "Property Documents", sub: "Sale deed / Title deed" }, { icon: "🏦", doc: "Bank Statements", sub: "Last 6 months" }, { icon: "📸", doc: "Passport Photos", sub: "2 recent photos" }],
    personal: [{ icon: "🪪", doc: "Identity Proof", sub: "Aadhar / PAN" }, { icon: "🏠", doc: "Address Proof", sub: "Utility bill / Aadhar" }, { icon: "💼", doc: "Income Proof", sub: "3 months salary slip" }, { icon: "🏦", doc: "Bank Statements", sub: "Last 3 months" }, { icon: "📸", doc: "Photos", sub: "2 passport photos" }],
    sme: [{ icon: "🪪", doc: "Identity Proof", sub: "Aadhar / PAN" }, { icon: "📋", doc: "Business Registration", sub: "GST / Udyam Certificate" }, { icon: "💼", doc: "ITR / Financials", sub: "Last 2 years" }, { icon: "🏦", doc: "Bank Statements", sub: "Last 12 months" }, { icon: "🏗️", doc: "Collateral Documents", sub: "Property / Asset docs" }],
  };
  const docList = docs[bank?.loanType] || docs.personal;

  return (
    <div className="loan-page" style={S.page}>
      <div style={{ ...S.header, paddingBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setPage("compare")} style={{ background: "#FFFFFF", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 10, width: 36, height: 36, color: "#2B2115", fontSize: 18, cursor: "pointer" }}>←</button>
          <div style={{ flex: 1 }}>
            <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 10, margin: 0 }}>{isGu ? meta?.labelGu : meta?.label}</p>
            <h2 style={{ color: "#2B2115", fontSize: 17, fontWeight: 800, margin: 0 }}>{bank?.name}</h2>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ margin: "0 16px 14px", background: "linear-gradient(135deg,rgba(212,175,55,0.14),rgba(184,134,11,0.06))", border: "1px solid rgba(184,134,11,0.25)", borderRadius: 18, padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <BankLogo slug={bank?.slug} name={bank?.name || "B"} size={50} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              <h3 style={{ color: "#2B2115", fontSize: 15, fontWeight: 800, margin: 0 }}>{bank?.name}</h3>
              {bank?.tag && <span style={S.tag(bank.tagColor)}>{bank.tag}</span>}
            </div>
            <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 11, margin: 0 }}>{isGu ? "RBI ." : "RBI Regulated"}</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[{ l: isGu ? "." : "Rate Range", v: formatRateRange(bank?.rate, bank?.maxRate), s: isGu ? "." : "indicative", c: "#B8860B" }, { l: isGu ? "." : "Fee", v: bank?.fee === 0 ? "Zero" : `${bank?.fee}%`, s: isGu ? "." : "of loan", c: "#3B82F6" }, { l: isGu ? "." : "Approval", v: `${bank?.approval}%`, s: "RBI ✓", c: "#0F8F5E" }, { l: isGu ? "." : "Max Loan", v: fmtL(bank?.maxLoan || 0), s: isGu ? "." : "upto", c: "#8B5CF6" }].map((item, i) => (
            <div key={i} style={{ background: "#FFFFFF", borderRadius: 12, padding: "10px", border: "1px solid rgba(184,134,11,0.1)" }}>
              <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 9, margin: "0 0 3px", fontWeight: 600 }}>{item.l}</p>
              <p style={{ color: item.c, fontSize: 18, fontWeight: 800, margin: "0 0 2px" }}>{item.v}</p>
              <p style={{ color: "rgba(43,33,21,0.3)", fontSize: 8, margin: 0 }}>{item.s}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: "0 16px 14px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.18)", borderRadius: 12, padding: "11px 13px" }}>
        <p style={{ color: "#2456A6", fontSize: 11, fontWeight: 700, margin: "0 0 4px" }}>Important information</p>
        <p style={{ color: "rgba(43,33,21,0.65)", fontSize: 10, lineHeight: 1.55, margin: 0 }}>
          The rate, processing or application/login fee, insurance premium, documentation charges, taxes and other costs shown are indicative and may change without notice. The lender will confirm the applicable rate, charges, eligibility, tenure and final approval after reviewing your application. Please verify the complete loan terms with the lender before accepting any offer.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", margin: "0 16px 14px", background: "#FFFFFF", border: "1px solid rgba(184,134,11,0.15)", borderRadius: 14, padding: 4, gap: 4 }}>
        {[{ id: "emi", icon: "🧮", l: "EMI Calculator" }, { id: "docs", icon: "📋", l: isGu ? "." : "Documents" }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, cursor: "pointer", background: activeTab === t.id ? "linear-gradient(135deg,#D4AF37,#9C7A1E)" : "transparent", color: activeTab === t.id ? "#fff" : "rgba(43,33,21,0.45)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {t.icon} {t.l}
          </button>
        ))}
      </div>

      {activeTab === "emi" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ ...S.card, marginBottom: 14 }}>
            <h3 style={{ color: "#2B2115", fontSize: 14, fontWeight: 800, margin: "0 0 16px" }}>🧮 EMI {isGu ? "." : "Calculator"}</h3>
            {[
              { label: isGu ? "." : "Loan Amount", val: loanAmt, set: setLoanAmt, min: meta?.minAmt || 100000, max: meta?.maxAmt || 10000000, step: 50000, color: "#B8860B", display: fmt(loanAmt) },
              { label: isGu ? "." : "Tenure", val: tenure, set: setTenure, min: 1, max: meta?.maxTenure || 30, step: 1, color: "#0F8F5E", display: `${tenure} ${isGu ? "." : "yrs"}` },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: i === 0 ? 18 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "rgba(43,33,21,0.55)", fontSize: 12 }}>{item.label}</span>
                  <span style={{ color: item.color, fontSize: 14, fontWeight: 800 }}>{item.display}</span>
                </div>
                <input type="range" min={item.min} max={item.max} step={item.step} value={item.val} onChange={e => item.set(+e.target.value)} style={{ width: "100%", accentColor: item.color }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ color: "rgba(43,33,21,0.3)", fontSize: 10 }}>{item.min >= 100000 ? fmtL(item.min) : `${item.min}yr`}</span>
                  <span style={{ color: "rgba(43,33,21,0.3)", fontSize: 10 }}>{item.max >= 100000 ? fmtL(item.max) : `${item.max}yrs`}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
              <span>🔒</span>
              <span style={{ color: "rgba(43,33,21,0.55)", fontSize: 11 }}>{isGu ? "." : `${bank?.name} rate ${rate}% — auto-filled from comparison`}</span>
            </div>
          </div>

          <div style={{ background: "linear-gradient(135deg,rgba(212,175,55,0.16),rgba(184,134,11,0.07))", border: "1px solid rgba(184,134,11,0.3)", borderRadius: 18, padding: "20px", marginBottom: 14 }}>
            <p style={{ color: "rgba(43,33,21,0.5)", fontSize: 12, margin: "0 0 4px", textAlign: "center" }}>{isGu ? "." : "Monthly EMI"}</p>
            <p style={{ color: "#B8860B", fontSize: 42, fontWeight: 900, margin: "0 0 16px", textAlign: "center", letterSpacing: -1 }}>{fmt(emi)}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[{ l: isGu ? "." : "Total Payment", v: fmt(total), c: "#2B2115" }, { l: isGu ? "." : "Total Interest", v: fmt(interest), c: "#EF4444" }, { l: isGu ? "." : "Principal", v: fmt(loanAmt), c: "#0F8F5E" }].map((item, i) => (
                <div key={i} style={{ background: "#FFFFFF", borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
                  <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 9, margin: "0 0 2px" }}>{item.l}</p>
                  <p style={{ color: item.c, fontSize: 11, fontWeight: 800, margin: 0 }}>{item.v}</p>
                </div>
              ))}
            </div>
            <div style={{ borderRadius: 8, overflow: "hidden", height: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", height: "100%" }}>
                <div style={{ width: `${pP}%`, background: "#0F8F5E" }} />
                <div style={{ width: `${iP}%`, background: "#EF4444" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#0F8F5E", fontSize: 10 }}>● {isGu ? "." : "Principal"} {pP}%</span>
              <span style={{ color: "#EF4444", fontSize: 10 }}>● {isGu ? "." : "Interest"} {iP}%</span>
            </div>
          </div>

          <button onClick={() => setShowBreakdown(!showBreakdown)} style={{ width: "100%", padding: "13px", background: showBreakdown ? "rgba(59,130,246,0.1)" : "#FFFFFF", border: `1px solid ${showBreakdown ? "rgba(59,130,246,0.3)" : "rgba(184,134,11,0.15)"}`, borderRadius: 14, color: showBreakdown ? "#3B82F6" : "rgba(43,33,21,0.65)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
            📊 {isGu ? "." : "View EMI Breakdown"} <span style={{ transform: showBreakdown ? "rotate(180deg)" : "none", transition: "0.2s" }}>⌄</span>
          </button>

          {showBreakdown && (
            <div style={{ ...S.card, marginBottom: 14, animation: "fadeIn 0.3s ease" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {["yearly", "monthly"].map(v => (
                  <button key={v} onClick={() => setBView(v)} style={{ flex: 1, padding: "8px", border: "none", borderRadius: 10, cursor: "pointer", background: bView === v ? "#3B82F6" : "rgba(184,134,11,0.06)", color: bView === v ? "#fff" : "rgba(43,33,21,0.45)", fontSize: 12, fontWeight: 700 }}>
                    {v === "yearly" ? (isGu ? "." : "Yearly") : (isGu ? "." : "Monthly")}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "0.6fr 1fr 1fr 1fr", gap: 4, marginBottom: 8 }}>
                {[isGu ? "." : "Yr", "EMI", isGu ? "." : "Interest", isGu ? "." : "Balance"].map((h, i) => (
                  <span key={i} style={{ color: "rgba(43,33,21,0.35)", fontSize: 9, fontWeight: 700, textAlign: i > 0 ? "right" : "left" }}>{h}</span>
                ))}
              </div>
              <div style={{ maxHeight: 260, overflowY: "auto", scrollbarWidth: "none" }}>
                {(bView === "yearly" ? yearly : schedule.slice(0, 60)).map((row, i) => {
                  const isY = bView === "yearly";
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "0.6fr 1fr 1fr 1fr", gap: 4, padding: "8px 0", borderBottom: "1px solid rgba(184,134,11,0.08)" }}>
                      <span style={{ color: "#B8860B", fontSize: 11, fontWeight: 700 }}>{isY ? `Y${row.year}` : `M${row.month}`}</span>
                      <span style={{ color: "#2B2115", fontSize: 10, textAlign: "right" }}>{fmt(isY ? row.totalEMI : row.emi)}</span>
                      <span style={{ color: "#EF4444", fontSize: 10, textAlign: "right" }}>{fmt(isY ? row.totalInterest : row.interest)}</span>
                      <span style={{ color: "rgba(43,33,21,0.5)", fontSize: 10, textAlign: "right" }}>{fmt(row.balance)}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: "12px" }}>
                <p style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, margin: "0 0 4px" }}>💡 {isGu ? "." : "Did you know?"}</p>
                <p style={{ color: "rgba(43,33,21,0.6)", fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                  {isGu ? "." : `In the first 5 years, ${yr5pct}% of your EMI goes towards interest!`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "docs" && (
        <div style={{ padding: "0 16px", animation: "fadeIn 0.3s ease" }}>
          <div style={{ ...S.card, marginBottom: 14 }}>
            <h3 style={{ color: "#2B2115", fontSize: 14, fontWeight: 800, margin: "0 0 14px" }}>📋 {isGu ? "." : "Documents Required"}</h3>
            {docList.map((doc, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < docList.length - 1 ? "1px solid rgba(184,134,11,0.1)" : "none" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(184,134,11,0.08)", border: "1px solid rgba(184,134,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{doc.icon}</div>
                <div>
                  <p style={{ color: "#2B2115", fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{doc.doc}</p>
                  <p style={{ color: "rgba(43,33,21,0.4)", fontSize: 11, margin: 0 }}>{doc.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 14, padding: "14px", marginBottom: 14 }}>
            <p style={{ color: "#B8860B", fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>⚠️ {isGu ? "." : "Important Notes"}</p>
            {[isGu ? "." : "All documents must be self-attested (sign on each copy)", isGu ? "." : "Income proof must be from last 3 months", isGu ? "." : "Processing time: 7-15 working days"].map((n, i) => (
              <p key={i} style={{ color: "rgba(43,33,21,0.55)", fontSize: 11, margin: "0 0 4px", paddingLeft: 12, borderLeft: "2px solid rgba(245,158,11,0.35)" }}>{n}</p>
            ))}
          </div>
        </div>
      )}

      {/* Apply button */}
      <div className="inquiry-bar" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(184,134,11,0.15)", padding: "14px 16px 24px", boxShadow: "0 -4px 20px rgba(0,0,0,0.04)" }}>
        <button className="inquiry-cta" onClick={() => { setInquiry(v => ({ ...v, amount: String(loanAmt), tenure: String(tenure) })); setShowApply(true); }} style={{ width: "100%", padding: "15px", ...S.orange, fontSize: 15 }}>
          <span className="inquiry-cta-icon">💬</span>{isGu ? "." : "Send Loan Inquiry on WhatsApp"}<span className="inquiry-cta-arrow">→</span>
        </button>
      </div>

      {/* Apply modal */}
      {showApply && (
        <div onClick={() => { if (!applyDone) setShowApply(false); }} style={{ position: "fixed", inset: 0, background: "rgba(20,15,5,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 430, animation: "slideUp 0.3s ease", boxShadow: "0 -8px 30px rgba(0,0,0,0.12)" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(184,134,11,0.2)", margin: "0 auto 20px" }} />
            {!applyDone ? (
              <>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,rgba(212,175,55,0.2),rgba(184,134,11,0.1))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>🤝</div>
                <h2 style={{ color: "#2B2115", fontSize: 20, fontWeight: 800, textAlign: "center", margin: "0 0 8px" }}>{isGu ? "." : "Tell us about your loan"}</h2>
                <p style={{ color: "rgba(43,33,21,0.55)", fontSize: 13, textAlign: "center", lineHeight: 1.6, margin: "0 0 16px" }}>{bank?.name} • {meta?.label} • EMI: {fmt(emi)}/mo</p>
                <form onSubmit={e => {
                  e.preventDefault();
                  const message = [
                    "Hello Gujarat Loan Mitra, I want a loan inquiry.",
                    `Name: ${inquiry.name}`,
                    `Phone: ${inquiry.phone}`,
                    `City: ${inquiry.city}`,
                    `Employment: ${inquiry.employment}`,
                    `Loan type: ${meta?.label || "Loan"}`,
                    `Preferred bank: ${bank?.name || "Any bank"}`,
                    `Loan amount: ₹${Number(inquiry.amount).toLocaleString("en-IN")}`,
                    `Tenure: ${inquiry.tenure} years`,
                    `Rate viewed: ${bank?.rate || rate}%`,
                  ].join("\n");
                  window.location.href = `https://wa.me/917202046658?text=${encodeURIComponent(message)}`;
                }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[["name", "Full name", "text"], ["phone", "Mobile number", "tel"], ["city", "City / District", "text"]].map(([key, label, type]) => (
                    <input key={key} required type={type} value={inquiry[key]} onChange={e => setInquiry(v => ({ ...v, [key]: e.target.value }))} placeholder={label} style={{ width: "100%", padding: "12px 13px", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 10, fontSize: 13, outline: "none", color: "#2B2115" }} />
                  ))}
                  <select required value={inquiry.employment} onChange={e => setInquiry(v => ({ ...v, employment: e.target.value }))} style={{ width: "100%", padding: "12px 13px", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 10, fontSize: 13, color: inquiry.employment ? "#2B2115" : "rgba(43,33,21,0.45)", background: "#fff" }}>
                    <option value="">Employment type</option><option>Salaried</option><option>Self-employed / Business</option><option>Farmer</option><option>Other</option>
                  </select>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input required type="number" min="10000" value={inquiry.amount} onChange={e => setInquiry(v => ({ ...v, amount: e.target.value }))} placeholder="Loan amount (₹)" style={{ width: "100%", padding: "12px 13px", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 10, fontSize: 13, color: "#2B2115" }} />
                    <input required type="number" min="1" max={meta?.maxTenure || 30} value={inquiry.tenure} onChange={e => setInquiry(v => ({ ...v, tenure: e.target.value }))} placeholder="Tenure (years)" style={{ width: "100%", padding: "12px 13px", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 10, fontSize: 13, color: "#2B2115" }} />
                  </div>
                  <button className="whatsapp-submit" type="submit" style={{ width: "100%", padding: "15px", fontSize: 15, marginTop: 4 }}>💬 <span>Continue on WhatsApp</span><b>→</b></button>
                </form>
                <button onClick={() => setShowApply(false)} style={{ width: "100%", padding: "12px", background: "#FFFFFF", border: "1px solid rgba(184,134,11,0.15)", borderRadius: 12, color: "rgba(43,33,21,0.45)", fontSize: 13, cursor: "pointer" }}>{isGu ? "." : "Cancel"}</button>
              </>
            ) : (
              <>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                  <h2 style={{ color: "#2B2115", fontSize: 22, fontWeight: 800, margin: "0 0 12px" }}>{isGu ? "." : "Request Received!"}</h2>
                  <p style={{ color: "rgba(43,33,21,0.65)", fontSize: 14, lineHeight: 1.7, margin: "0 0 6px" }}>
                    {isGu ? "." : "Our team will call you within 24 hours to help with your"}
                  </p>
                  <p style={{ color: "#B8860B", fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>{bank?.name} {isGu ? "." : "loan application"}</p>
                  <div style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, padding: "16px", marginBottom: 24 }}>
                    <p style={{ color: "#0F8F5E", fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>🧡 {isGu ? "." : "Gujarat Loan Mitra Promise"}</p>
                    <p style={{ color: "rgba(43,33,21,0.65)", fontSize: 12, margin: 0, lineHeight: 1.6 }}>{isGu ? "." : "\"Loan na drek padave — aapde sathe chhe. Loan approved thay tyaa sudhi!\""}</p>
                  </div>
                  <button onClick={() => { setShowApply(false); setApplyDone(false); }} style={{ width: "100%", padding: "14px", ...S.orange, fontSize: 14 }}>{isGu ? "." : "Done 👍"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}::-webkit-scrollbar{display:none}input[type=range]{-webkit-appearance:none;height:6px;border-radius:3px;background:rgba(184,134,11,0.15);outline:none}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#B8860B;cursor:pointer;box-shadow:0 2px 8px rgba(184,134,11,0.35)}.inquiry-cta,.whatsapp-submit{display:flex;align-items:center;justify-content:center;gap:9px;min-height:52px;border-radius:14px;font-weight:800;letter-spacing:.05px;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,filter .18s ease}.inquiry-cta{box-shadow:0 8px 18px rgba(156,122,30,.22)}.inquiry-cta:hover,.whatsapp-submit:hover{transform:translateY(-2px);filter:brightness(1.04)}.inquiry-cta:active,.whatsapp-submit:active{transform:translateY(0)}.inquiry-cta-icon{font-size:19px}.inquiry-cta-arrow{font-size:20px;margin-left:2px}.whatsapp-submit{border:0;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;box-shadow:0 8px 18px rgba(18,140,126,.24)}.whatsapp-submit b{font-size:20px;font-weight:500;margin-left:2px}`}</style>
    </div>
  );
}

// ─── EMI PAGE ─────────────────────────────────────────────────────────────────
function EMIPage({ lang, setLang, setPage, setCompareType }) {
  const [selType, setSelType] = useState("home");
  const meta = LOAN_META[selType];
  const [loanAmt, setLoanAmt] = useState(meta.defaultAmt);
  const [rate, setRate] = useState(meta.defaultRate);
  const [tenure, setTenure] = useState(10);
  const [calculatorMode, setCalculatorMode] = useState("loan");
  const [monthlyBudget, setMonthlyBudget] = useState(Math.round(calcEMI(meta.defaultAmt, meta.defaultRate, 120)));
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [bView, setBView] = useState("yearly");
  const isGu = lang === "gu";

  const handleTypeChange = (k) => {
    setSelType(k);
    setRate(LOAN_META[k].defaultRate);
    setLoanAmt(LOAN_META[k].defaultAmt);
    setMonthlyBudget(Math.round(calcEMI(LOAN_META[k].defaultAmt, LOAN_META[k].defaultRate, 120)));
    setTenure(Math.min(tenure, LOAN_META[k].maxTenure));
  };

  const tm = tenure * 12;
  const reverseLoanAmount = rate === 0
    ? monthlyBudget * tm
    : monthlyBudget * (1 - Math.pow(1 + rate / 12 / 100, -tm)) / (rate / 12 / 100);
  const calculatedLoanAmount = calculatorMode === "reverse"
    ? Math.min(meta.maxAmt, Math.max(meta.minAmt, Math.round(reverseLoanAmount)))
    : loanAmt;
  const emi = Math.round(calcEMI(calculatedLoanAmount, rate, tm));
  const total = emi * tm;
  const interest = total - calculatedLoanAmount;
  const iP = Math.round((interest / total) * 100);
  const pP = 100 - iP;
  const schedule = useMemo(() => calcSchedule(calculatedLoanAmount, rate, tm), [calculatedLoanAmount, rate, tm]);
  const yearly = useMemo(() => Array.from({ length: tenure }, (_, y) => {
    const ms = schedule.slice(y * 12, (y + 1) * 12);
    return { year: y + 1, totalEMI: ms.reduce((s, m) => s + m.emi, 0), totalInterest: ms.reduce((s, m) => s + m.interest, 0), balance: ms[ms.length - 1]?.balance || 0 };
  }), [schedule, tenure]);
  const yr5pct = yearly.length >= 5 ? Math.round((yearly.slice(0, 5).reduce((s, y) => s + y.totalInterest, 0) / yearly.slice(0, 5).reduce((s, y) => s + y.totalEMI, 0)) * 100) : 60;

  return (
    <div className="loan-page" style={S.page}>
      <div style={{ ...S.header, paddingBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: "#2B2115", fontSize: 18, fontWeight: 800, margin: 0 }}>🧮 EMI {isGu ? "." : "Calculator"}</h2>
            <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 11, margin: 0 }}>{isGu ? "." : "Calculate EMI for any loan"}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 16px 0" }}>
        <p style={{ color: "rgba(43,33,21,0.55)", fontSize: 12, fontWeight: 600, margin: "0 0 10px" }}>{isGu ? "." : "Select Loan Type"}</p>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14, scrollbarWidth: "none" }}>
          {Object.entries(LOAN_META).map(([k, v]) => (
            <button key={k} onClick={() => handleTypeChange(k)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: selType === k ? "rgba(184,134,11,0.14)" : "#FFFFFF", border: `1.5px solid ${selType === k ? "rgba(184,134,11,0.4)" : "rgba(184,134,11,0.12)"}`, borderRadius: 12, padding: "8px 10px", cursor: "pointer", flexShrink: 0, minWidth: 58 }}>
              <LoanTypeLogo type={k} size={20} />
              <span style={{ fontSize: 8, fontWeight: 700, color: selType === k ? "#B8860B" : "rgba(43,33,21,0.45)", whiteSpace: "nowrap" }}>{isGu ? v.labelGu : v.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, padding: 4, background: "rgba(184,134,11,0.06)", borderRadius: 12, marginBottom: 14 }}>
          {[["loan", "Calculate EMI"], ["reverse", "Calculate eligible loan"]].map(([mode, label]) => (
            <button key={mode} onClick={() => setCalculatorMode(mode)} style={{ flex: 1, padding: "10px 8px", border: "none", borderRadius: 9, background: calculatorMode === mode ? "#B8860B" : "transparent", color: calculatorMode === mode ? "#fff" : "rgba(43,33,21,0.55)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ ...S.card, marginBottom: 14 }}>
          {[
            ...(calculatorMode === "loan"
              ? [{ label: "Loan Amount", val: loanAmt, set: setLoanAmt, min: meta.minAmt, max: meta.maxAmt, step: 10000, color: "#B8860B", display: fmt(loanAmt) }]
              : [{ label: "Monthly EMI budget", val: monthlyBudget, set: setMonthlyBudget, min: 1000, max: 300000, step: 500, color: "#B8860B", display: fmt(monthlyBudget) }]),
            { label: isGu ? "." : "Interest Rate", val: rate, set: setRate, min: 5, max: 30, step: 0.25, color: "#3B82F6", display: `${rate.toFixed(2)}%` },
            { label: isGu ? "." : "Tenure", val: tenure, set: setTenure, min: 1, max: meta.maxTenure, step: 1, color: "#0F8F5E", display: `${tenure} ${isGu ? "." : "yrs"} (${tm} months)` },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? 20 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "rgba(43,33,21,0.55)", fontSize: 12, fontWeight: 600 }}>{item.label}</span>
                <span style={{ color: item.color, fontSize: 14, fontWeight: 800 }}>{item.display}</span>
              </div>
              <input type="range" min={item.min} max={item.max} step={item.step} value={item.val} onChange={e => item.set(Number(e.target.value))} style={{ width: "100%", accentColor: item.color }} />
            </div>
          ))}
          {calculatorMode === "reverse" && <p style={{ color: "rgba(43,33,21,0.5)", fontSize: 11, margin: "14px 0 0", lineHeight: 1.5 }}>Based on this EMI budget, you may qualify for approximately <strong style={{ color: "#B8860B" }}>{fmt(calculatedLoanAmount)}</strong>.</p>}
        </div>

        <div style={{ background: "linear-gradient(135deg,rgba(212,175,55,0.16),rgba(184,134,11,0.07))", border: "1px solid rgba(184,134,11,0.3)", borderRadius: 18, padding: "20px", marginBottom: 14 }}>
          <p style={{ color: "rgba(43,33,21,0.5)", fontSize: 12, margin: "0 0 4px", textAlign: "center" }}>{isGu ? "." : "Monthly EMI"}</p>
          <p style={{ color: "#B8860B", fontSize: 44, fontWeight: 900, margin: "0 0 16px", textAlign: "center", letterSpacing: -1 }}>{fmt(emi)}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            {            [{ l: isGu ? "." : "Total", v: fmt(total), c: "#2B2115" }, { l: isGu ? "." : "Interest", v: fmt(interest), c: "#EF4444" }, { l: isGu ? "." : "Principal", v: fmt(calculatedLoanAmount), c: "#0F8F5E" }].map((item, i) => (
              <div key={i} style={{ background: "#FFFFFF", borderRadius: 10, padding: "10px 4px", textAlign: "center" }}>
                <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 9, margin: "0 0 2px" }}>{item.l}</p>
                <p style={{ color: item.c, fontSize: 11, fontWeight: 800, margin: 0 }}>{item.v}</p>
              </div>
            ))}
          </div>
          <div style={{ borderRadius: 8, overflow: "hidden", height: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", height: "100%" }}>
              <div style={{ width: `${pP}%`, background: "#0F8F5E" }} />
              <div style={{ width: `${iP}%`, background: "#EF4444" }} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#0F8F5E", fontSize: 10 }}>● {isGu ? "." : "Principal"} {pP}%</span>
            <span style={{ color: "#EF4444", fontSize: 10 }}>● {isGu ? "." : "Interest"} {iP}%</span>
          </div>
        </div>

        <button onClick={() => setShowBreakdown(!showBreakdown)} style={{ width: "100%", padding: "13px", background: showBreakdown ? "rgba(59,130,246,0.1)" : "#FFFFFF", border: `1px solid ${showBreakdown ? "rgba(59,130,246,0.3)" : "rgba(184,134,11,0.15)"}`, borderRadius: 14, color: showBreakdown ? "#3B82F6" : "rgba(43,33,21,0.65)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
          📊 {isGu ? "." : "View EMI Breakdown"} <span style={{ transform: showBreakdown ? "rotate(180deg)" : "none", transition: "0.2s" }}>⌄</span>
        </button>

        {showBreakdown && (
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["yearly", "monthly"].map(v => (
                <button key={v} onClick={() => setBView(v)} style={{ flex: 1, padding: "8px", border: "none", borderRadius: 10, cursor: "pointer", background: bView === v ? "#3B82F6" : "rgba(184,134,11,0.06)", color: bView === v ? "#fff" : "rgba(43,33,21,0.45)", fontSize: 12, fontWeight: 700 }}>
                  {v === "yearly" ? (isGu ? "." : "Yearly") : (isGu ? "." : "Monthly")}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "0.6fr 1fr 1fr 1fr", gap: 4, marginBottom: 8 }}>
              {[isGu ? "." : "Yr", "EMI", isGu ? "." : "Interest", isGu ? "." : "Balance"].map((h, i) => (
                <span key={i} style={{ color: "rgba(43,33,21,0.35)", fontSize: 9, fontWeight: 700, textAlign: i > 0 ? "right" : "left" }}>{h}</span>
              ))}
            </div>
            <div style={{ maxHeight: 280, overflowY: "auto", scrollbarWidth: "none" }}>
              {(bView === "yearly" ? yearly : schedule.slice(0, 60)).map((row, i) => {
                const isY = bView === "yearly";
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "0.6fr 1fr 1fr 1fr", gap: 4, padding: "8px 0", borderBottom: "1px solid rgba(184,134,11,0.08)" }}>
                    <span style={{ color: "#B8860B", fontSize: 11, fontWeight: 700 }}>{isY ? `Y${row.year}` : `M${row.month}`}</span>
                    <span style={{ color: "#2B2115", fontSize: 10, textAlign: "right" }}>{fmt(isY ? row.totalEMI : row.emi)}</span>
                    <span style={{ color: "#EF4444", fontSize: 10, textAlign: "right" }}>{fmt(isY ? row.totalInterest : row.interest)}</span>
                    <span style={{ color: "rgba(43,33,21,0.5)", fontSize: 10, textAlign: "right" }}>{fmt(row.balance)}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: "12px" }}>
              <p style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, margin: "0 0 4px" }}>💡 {isGu ? "." : "Did you know?"}</p>
              <p style={{ color: "rgba(43,33,21,0.6)", fontSize: 11, margin: 0, lineHeight: 1.5 }}>{isGu ? "." : `First 5 years — ${yr5pct}% of your EMI is interest!`}</p>
            </div>
          </div>
        )}

        <button onClick={() => { setCompareType(selType); setPage("compare"); }} style={{ width: "100%", padding: "14px", ...S.orange, fontSize: 14, marginBottom: 16 }}>
          {isGu ? "." : "Compare Banks for This Loan →"}
        </button>
      </div>
      <style>{`::-webkit-scrollbar{display:none}input[type=range]{-webkit-appearance:none;height:6px;border-radius:3px;background:rgba(184,134,11,0.15);outline:none}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#B8860B;cursor:pointer;box-shadow:0 2px 8px rgba(184,134,11,0.35)}`}</style>
    </div>
  );
}

// ─── SCHEMES PAGE ─────────────────────────────────────────────────────────────
function SchemesPage({ lang, setLang, schemes }) {
  const [expanded, setExpanded] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const isGu = lang === "gu";

  const filters = [
    { id: "all", l: isGu ? "બધા" : "All" },
    { id: "Business", l: isGu ? "ધ." : "Business" },
    { id: "Home", l: isGu ? "ઘ." : "Home" },
    { id: "Artisan", l: isGu ? "ક." : "Artisan" },
    { id: "Street Vendor", l: isGu ? "." : "Street Vendor" },
    { id: "Employment", l: isGu ? "ર." : "Employment" },
    { id: "SC/ST/Women", l: isGu ? "SC/ST" : "SC/ST/Women" },
  ];

  const filtered = activeFilter === "all" ? schemes : schemes.filter(s => s.tag === activeFilter);

  const handleShare = (scheme) => {
    const text = `${scheme.icon} ${isGu ? scheme.nameGu : scheme.name} — ${isGu ? scheme.oneLinerGu : scheme.oneLiner}\n\nGujaratLoanMitra.com/schemes/${scheme.id}`;
    if (navigator.share) navigator.share({ title: isGu ? scheme.nameGu : scheme.name, text }).catch(() => {});
    else { navigator.clipboard?.writeText(text).catch(() => {}); alert(isGu ? "." : "Copied to clipboard!"); }
  };

  return (
    <div className="loan-page" style={S.page}>
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: "#2B2115", fontSize: 20, fontWeight: 800, margin: 0 }}>🏛️ {isGu ? "સ." : "Government Schemes"}</h2>
            <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 11, margin: 0 }}>{isGu ? "." : "Know before you borrow — Gujarat's complete guide"}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{ background: activeFilter === f.id ? "#B8860B" : "#FFFFFF", border: activeFilter === f.id ? "none" : "1px solid rgba(184,134,11,0.15)", borderRadius: 20, padding: "6px 14px", color: activeFilter === f.id ? "#fff" : "rgba(43,33,21,0.55)", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{f.l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "8px 16px" }}>
        <div style={{ background: "rgba(184,134,11,0.07)", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>💡</span>
          <p style={{ color: "rgba(43,33,21,0.75)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            {isGu ? "." : "These schemes can save you ₹ lakhs. Many people miss them — don't be one of them!"}
          </p>
        </div>

        {filtered.map((scheme) => (
          <div key={scheme.id} style={{ background: expanded === scheme.id ? `${scheme.color}0d` : "#FFFFFF", border: `1.5px solid ${expanded === scheme.id ? scheme.color + "40" : "rgba(184,134,11,0.15)"}`, borderRadius: 18, padding: "16px", marginBottom: 12, transition: "all 0.2s" }}>
            <div onClick={() => setExpanded(expanded === scheme.id ? null : scheme.id)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 15, background: `${scheme.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{scheme.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                    <h3 style={{ color: "#2B2115", fontSize: 14, fontWeight: 800, margin: 0 }}>{isGu ? scheme.nameGu : scheme.name}</h3>
                    <span style={S.tag(scheme.color)}>{isGu ? scheme.tagGu : scheme.tag}</span>
                    {scheme.deadline && <span style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>⏰ {scheme.deadline}</span>}
                  </div>
                  <p style={{ color: "rgba(43,33,21,0.55)", fontSize: 11, margin: 0, lineHeight: 1.4 }}>{isGu ? scheme.oneLinerGu : scheme.oneLiner}</p>
                </div>
                <span style={{ color: "rgba(43,33,21,0.25)", fontSize: 16, transform: expanded === scheme.id ? "rotate(180deg)" : "none", transition: "0.2s", flexShrink: 0 }}>⌄</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[{ l: isGu ? "." : "Loan Limit", v: isGu ? scheme.limitGu : scheme.limit, c: "#B8860B" }, { l: isGu ? "." : "Interest", v: isGu ? scheme.rateGu : scheme.rate, c: "#3B82F6" }, { l: isGu ? "." : "Fee", v: isGu ? scheme.feeGu : scheme.fee, c: "#0F8F5E" }].map((item, j) => (
                  <div key={j} style={{ background: "rgba(184,134,11,0.05)", borderRadius: 10, padding: "8px", textAlign: "center" }}>
                    <p style={{ color: "rgba(43,33,21,0.4)", fontSize: 8, margin: "0 0 3px", fontWeight: 600 }}>{item.l}</p>
                    <p style={{ color: item.c, fontSize: 10, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{item.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {expanded === scheme.id && (
              <div style={{ marginTop: 14, animation: "fadeIn 0.2s ease" }}>
                <div style={{ borderTop: "1px solid rgba(184,134,11,0.15)", paddingTop: 14, marginBottom: 14 }}>
                  <p style={{ color: "rgba(43,33,21,0.55)", fontSize: 11, fontWeight: 700, margin: "0 0 10px" }}>🌟 {isGu ? "." : "Why this scheme is good for you"}</p>
                  {(isGu ? scheme.whyGoodGu : scheme.whyGood).map((point, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: `${scheme.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: scheme.color, flexShrink: 0 }}>{i + 1}</div>
                      <p style={{ color: "rgba(43,33,21,0.75)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>{point}</p>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <p style={{ color: "rgba(43,33,21,0.55)", fontSize: 11, fontWeight: 700, margin: "0 0 10px" }}>📋 {isGu ? "." : "Categories"}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {scheme.categories.map((cat, j) => (
                      <div key={j} style={{ background: `${scheme.color}15`, border: `1px solid ${scheme.color}35`, borderRadius: 10, padding: "8px 12px" }}>
                        <p style={{ color: scheme.color, fontSize: 11, fontWeight: 700, margin: "0 0 2px" }}>{isGu ? cat.nameGu : cat.name}</p>
                        <p style={{ color: "rgba(43,33,21,0.5)", fontSize: 10, margin: 0 }}>{isGu ? cat.amtGu : cat.amt}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <p style={{ color: "rgba(43,33,21,0.55)", fontSize: 11, fontWeight: 700, margin: "0 0 10px" }}>✅ {isGu ? "." : "Who is eligible?"}</p>
                  {(isGu ? scheme.eligibilityGu : scheme.eligibility).map((e, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                      <span style={{ color: "#0F8F5E", fontSize: 12, flexShrink: 0 }}>✓</span>
                      <span style={{ color: "rgba(43,33,21,0.75)", fontSize: 12, lineHeight: 1.4 }}>{e}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: "rgba(184,134,11,0.05)", borderRadius: 12, padding: "12px", marginBottom: 14 }}>
                  <p style={{ color: "rgba(43,33,21,0.55)", fontSize: 11, fontWeight: 700, margin: "0 0 6px" }}>📍 {isGu ? "." : "Where to apply"}</p>
                  <p style={{ color: "rgba(43,33,21,0.75)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>{isGu ? scheme.whereToApplyGu : scheme.whereToApply}</p>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button style={{ flex: 1, padding: "13px", ...S.orange, fontSize: 13 }}>
                    {isGu ? "." : "Apply Now →"}
                  </button>
                  <button onClick={() => handleShare(scheme)} style={{ padding: "13px 16px", background: "#FFFFFF", border: "1px solid rgba(184,134,11,0.2)", borderRadius: 12, color: "rgba(43,33,21,0.75)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    📤 {isGu ? "." : "Share"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

// ─── NEWS PAGE ────────────────────────────────────────────────────────────────
function DsaProfilesPage({ lang, profiles }) {
  const [selected, setSelected] = useState(null);
  const isGu = lang === "gu";
  return (
    <div className="loan-page" style={S.page}>
      <div style={S.header}>
        <h2 style={{ color: "#2B2115", fontSize: 20, fontWeight: 800, margin: 0 }}>🤝 {isGu ? "DSA સલાહકારો" : "DSA Loan Advisors"}</h2>
        <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 11, margin: "4px 0 0" }}>Connect with verified loan advisors in your area</p>
      </div>
      <div style={{ padding: "8px 16px" }}>
        {profiles.length === 0 && <div style={{ ...S.card, textAlign: "center", color: "rgba(43,33,21,0.55)", fontSize: 12 }}>DSA profiles will appear here when published by the admin.</div>}
        <div style={{ display: "grid", gap: 12 }}>
          {profiles.map(profile => (
            <button key={profile.id} onClick={() => setSelected(profile)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "#fff", border: "1px solid rgba(184,134,11,0.16)", borderRadius: 16, padding: 12, cursor: "pointer" }}>
              {profile.photo ? <img src={profile.photo} alt={profile.name} style={{ width: 62, height: 62, objectFit: "cover", borderRadius: "50%", border: "2px solid rgba(184,134,11,0.3)" }} /> : <div style={{ width: 62, height: 62, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(184,134,11,0.14)", color: "#B8860B", fontSize: 24, fontWeight: 800 }}>{profile.name?.charAt(0) || "D"}</div>}
              <span style={{ flex: 1 }}><strong style={{ display: "block", color: "#2B2115", fontSize: 14 }}>{profile.name}</strong><span style={{ display: "block", color: "rgba(43,33,21,0.55)", fontSize: 11, marginTop: 3 }}>{profile.designation || "Loan Advisor"}{profile.city ? ` · ${profile.city}` : ""}</span><span style={{ display: "block", color: "#B8860B", fontSize: 10, fontWeight: 700, marginTop: 5 }}>View profile →</span></span>
            </button>
          ))}
        </div>
      </div>
      {selected && <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(20,14,8,0.58)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={event => event.stopPropagation()} style={{ width: "min(100%, 560px)", maxHeight: "90vh", overflowY: "auto", background: "#FBF8F1", borderRadius: "22px 22px 0 0", padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><strong style={{ color: "#2B2115", fontSize: 16 }}>{selected.name}</strong><button onClick={() => setSelected(null)} style={{ border: "none", background: "rgba(43,33,21,0.08)", borderRadius: 20, width: 30, height: 30, cursor: "pointer" }}>×</button></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[selected.photo, selected.workspacePhoto1, selected.workspacePhoto2].filter(Boolean).map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={index === 0 ? `${selected.name} profile` : `${selected.name} workspace`} style={{ width: "100%", height: index === 0 ? 220 : 130, objectFit: "cover", borderRadius: 12, gridColumn: index === 0 ? "1 / -1" : "auto" }} />)}
          </div>
          <p style={{ color: "rgba(43,33,21,0.7)", fontSize: 12, lineHeight: 1.65, margin: "0 0 12px" }}>{selected.description || "Professional loan assistance for customers."}</p>
          <div style={{ display: "grid", gap: 7, color: "rgba(43,33,21,0.65)", fontSize: 11 }}>
            {selected.city && <span>📍 {selected.city}</span>}{selected.experience && <span>⭐ {selected.experience}</span>}{selected.specializations && <span>💼 {selected.specializations}</span>}{selected.languages && <span>🗣️ {selected.languages}</span>}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>{selected.phone && <a href={`tel:${selected.phone}`} style={{ ...S.orange, flex: 1, textAlign: "center", padding: 12, textDecoration: "none", fontSize: 12 }}>Call advisor</a>}{selected.email && <a href={`mailto:${selected.email}`} style={{ flex: 1, textAlign: "center", padding: 12, borderRadius: 10, background: "#fff", border: "1px solid rgba(184,134,11,0.25)", color: "#8B6817", textDecoration: "none", fontSize: 12 }}>Email advisor</a>}</div>
        </div>
      </div>}
    </div>
  );
}

function NewsPage({ lang, setLang, news }) {
  const [expandedNews, setExpandedNews] = useState(null);
  const [filter, setFilter] = useState("all");
  const isGu = lang === "gu";

  const filters = [
    { id: "all", l: isGu ? "બધા" : "All" },
    { id: "fraud", l: isGu ? "." : "Fraud Alerts" },
    { id: "govt", l: isGu ? "." : "Govt Schemes" },
  ];

  const filtered = filter === "all" ? news : news.filter(n => n.type === filter);

  const handleShare = (item) => {
    const text = item.shareText;
    if (navigator.share) navigator.share({ title: isGu ? item.titleGu : item.title, text }).catch(() => {});
    else { navigator.clipboard?.writeText(text).catch(() => {}); alert(isGu ? "." : "Share link copied!"); }
  };

  return (
    <div className="loan-page" style={S.page}>
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: "#2B2115", fontSize: 20, fontWeight: 800, margin: 0 }}>📰 {isGu ? "." : "News & Alerts"}</h2>
            <p style={{ color: "rgba(43,33,21,0.45)", fontSize: 11, margin: 0 }}>{isGu ? "." : "Gujarat's financial pulse — stay safe, stay smart"}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, paddingBottom: 12, scrollbarWidth: "none", overflowX: "auto" }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ background: filter === f.id ? "#B8860B" : "#FFFFFF", border: filter === f.id ? "none" : "1px solid rgba(184,134,11,0.15)", borderRadius: 20, padding: "6px 14px", color: filter === f.id ? "#fff" : "rgba(43,33,21,0.55)", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{f.l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "8px 16px" }}>
        {filter === "all" && (
          <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 20 }}>🚨</span>
            <div>
              <p style={{ color: "#EF4444", fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{isGu ? "." : "Gujarat Fraud Alert"}</p>
              <p style={{ color: "rgba(43,33,21,0.5)", fontSize: 11, margin: 0 }}>{isGu ? "." : "4 new scam alerts this week — share with family!"}</p>
            </div>
          </div>
        )}

        {filtered.map((item) => (
          <div key={item.id} style={{ background: "#FFFFFF", border: `1px solid ${item.urgent ? "rgba(239,68,68,0.25)" : "rgba(184,134,11,0.15)"}`, borderLeft: `3px solid ${item.tagColor}`, borderRadius: 14, padding: "14px", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <span style={S.tag(item.tagColor)}>{item.urgent ? "🔴 " : ""}{item.tag}</span>
              <span style={{ color: "rgba(43,33,21,0.35)", fontSize: 10 }}>{isGu ? item.timeGu : item.time}</span>
              <span style={{ color: "rgba(43,33,21,0.3)", fontSize: 10 }}>• {item.readMin}min</span>
            </div>
            <p style={{ color: "#2B2115", fontSize: 13, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.4 }}>{isGu ? item.titleGu : item.title}</p>

            {expandedNews === item.id && (
              <div style={{ animation: "fadeIn 0.2s ease" }}>
                <p style={{ color: "rgba(43,33,21,0.7)", fontSize: 12, margin: "0 0 10px", lineHeight: 1.7 }}>{isGu ? item.summaryGu : item.summary}</p>
                {item.warning && (
                  <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                    <p style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, margin: "0 0 4px" }}>⚠️ {isGu ? "." : "Safety Tip"}</p>
                    <p style={{ color: "rgba(43,33,21,0.7)", fontSize: 11, margin: 0, lineHeight: 1.5 }}>{isGu ? item.warningGu : item.warning}</p>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
              <button onClick={() => setExpandedNews(expandedNews === item.id ? null : item.id)} style={{ background: "none", border: "none", color: "rgba(43,33,21,0.45)", fontSize: 11, cursor: "pointer", padding: 0 }}>
                {expandedNews === item.id ? (isGu ? "." : "Show less ↑") : (isGu ? "." : "Read more ↓")}
              </button>
              <button onClick={() => handleShare(item)} style={{ background: "rgba(184,134,11,0.08)", border: "none", borderRadius: 20, padding: "6px 14px", color: "rgba(43,33,21,0.65)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                📤 {isGu ? "." : "Share"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [userName] = useState("Mitra");
  const [lang, setLang] = useState("en");
  const [page, setPage] = useState("home");
  const [compareType, setCompareType] = useState("home");
  const [detailBank, setDetailBank] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [news, setNews] = useState(NEWS);
  const [bankData, setBankData] = useState(BANK_DATA);
  const [schemes, setSchemes] = useState(GOVT_SCHEMES);
  const [dsaProfiles, setDsaProfiles] = useState([]);
  const [nbfcs, setNbfcs] = useState([]);
  const [hasSavedRates, setHasSavedRates] = useState(false);

  const tickerItems = useMemo(() => {
    const rateLines = Object.entries(bankData).flatMap(([loanType, banks]) => 
      banks.slice(0, 2).map(bank => `${LOAN_META[loanType]?.label ?? loanType}: ${bank.name} ${formatRateRange(bank.rate, bank.maxRate)}`)
    );
    const newsLines = Array.isArray(news) ? news.slice(0, 3).map(item => item.title || item.tag || "Latest update") : [];
    return rateLines.length > 0 ? rateLines : newsLines.length > 0 ? newsLines : ["Latest finance updates from Gujarat"]; 
  }, [bankData, news]);

  useEffect(() => {
    fetch("/api/news")
      .then(response => {
        if (!response.ok) throw new Error(`News API returned ${response.status}`);
        return response.json();
      })
      .then(data => { if (Array.isArray(data.items) && data.items.length > 0) setNews(data.items); })
      .catch(error => console.warn("Live news unavailable; showing verified fallback news.", error));
  }, []);

  useEffect(() => {
    fetch("/api/schemes")
      .then(response => {
        if (!response.ok) throw new Error(`Saved schemes API returned ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data.schemes) || data.schemes.length === 0) return;
        setSchemes(current => {
          const savedById = new Map(data.schemes.map(scheme => [scheme.id, scheme]));
          return [...current.map(scheme => savedById.get(scheme.id) || scheme), ...data.schemes.filter(scheme => !current.some(existing => existing.id === scheme.id))];
        });
      })
      .catch(error => console.warn("Saved schemes unavailable; showing default schemes.", error));
  }, []);

  useEffect(() => {
    fetch("/api/rates")
      .then(response => {
        if (!response.ok) throw new Error(`Saved rates API returned ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data.rates)) return;
        setHasSavedRates(data.rates.length > 0);
        setBankData(current => ({
          ...current,
          ...Object.fromEntries(Object.entries(current).map(([loanType, banks]) => [loanType, banks.map(bank => {
            const saved = data.rates.find(rate => rate.loan_type === loanType && rate.bank_id === bank.id);
            return saved ? { ...bank, rate: Number(saved.rate), maxRate: Number(saved.max_rate), fee: Number(saved.fee) } : bank;
          })])),
        }));
      })
      .catch(error => console.warn("Saved rates unavailable; showing default rates.", error));
  }, []);

  useEffect(() => {
    fetch("/api/nbfcs")
      .then(response => {
        if (!response.ok) throw new Error(`NBFC API returned ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data.nbfcs)) return;
        setNbfcs(data.nbfcs);
        setBankData(current => ({
          ...current,
          ...Object.fromEntries(Object.entries(LOAN_META).map(([type]) => {
            const existing = current[type] || [];
            const additions = data.nbfcs.filter(nbfc => nbfc.loanType === type && !existing.some(bank => bank.id === nbfc.id));
            return [type, [...existing, ...additions]];
          })),
        }));
      })
      .catch(error => console.warn("NBFC directory unavailable; showing built-in lenders.", error));
  }, []);

  useEffect(() => {
    fetch("/api/dsas")
      .then(response => {
        if (!response.ok) throw new Error(`DSA API returned ${response.status}`);
        return response.json();
      })
      .then(data => { if (Array.isArray(data.profiles)) setDsaProfiles(data.profiles.filter(profile => profile.published !== false)); })
      .catch(error => console.warn("DSA profiles unavailable; showing an empty directory.", error));
  }, []);

  useEffect(() => {
    if (hasSavedRates) return;
    console.info("Using default bank rates; live bank scraping is disabled.");
  }, [hasSavedRates]);

  const noNav = page === "detail";
  const isGu = lang === "gu";

  if (window.location.pathname === "/admin") {
    return <AdminPage lang={lang} setLang={setLang} bankData={bankData} setBankData={setBankData} schemes={schemes} setSchemes={setSchemes} dsaProfiles={dsaProfiles} setDsaProfiles={setDsaProfiles} nbfcs={nbfcs} setNbfcs={setNbfcs} />;
  }

  return (
    <div className="app-shell" style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#FBF8F1" }}>
      <DesktopChrome active={page} setPage={setPage} isGu={isGu} setShowSearch={setShowSearch} />
      <DesktopHeader isGu={isGu} setLang={setLang} setShowSearch={setShowSearch} />
      <TickerBar items={tickerItems} />
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} setPage={setPage} setCompareType={setCompareType} lang={lang} profiles={dsaProfiles} />}
      {page === "home" && <HomePage name={userName} lang={lang} setLang={setLang} setPage={setPage} setCompareType={setCompareType} showSearch={showSearch} setShowSearch={setShowSearch} news={news} />}
      {page === "compare" && <ComparePage lang={lang} setLang={setLang} initType={compareType} setPage={setPage} setDetailBank={setDetailBank} bankData={bankData} />}
      {page === "detail" && <DetailPage bank={detailBank} lang={lang} setPage={setPage} />}
      {page === "emi" && <EMIPage lang={lang} setLang={setLang} setPage={setPage} setCompareType={setCompareType} />}
      {page === "schemes" && <SchemesPage lang={lang} setLang={setLang} schemes={schemes} />}
      {page === "dsas" && <DsaProfilesPage lang={lang} profiles={dsaProfiles} />}
      {page === "news" && <NewsPage lang={lang} setLang={setLang} news={news} />}
      {!noNav && <BottomNav active={page} setPage={setPage} isGu={isGu} />}
      <style>{`*{box-sizing:border-box}html,body,#app{margin:0;min-height:100%;width:100%}button,input,select{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease,background .2s ease}button:hover{transform:translateY(-1px)}button:active{transform:translateY(0)}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid rgba(184,134,11,.2);outline-offset:2px}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}::-webkit-scrollbar{display:none}input[type=range]{-webkit-appearance:none;height:6px;border-radius:3px;background:rgba(184,134,11,0.15);outline:none}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#B8860B;cursor:pointer;box-shadow:0 2px 8px rgba(184,134,11,0.35)}.desktop-sidebar,.desktop-header{display:none}@media(min-width:768px){body{background:#f0ece3}.app-shell{position:relative;width:100%!important;max-width:none!important;margin:0!important;min-height:100vh!important;padding-left:250px;background:radial-gradient(circle at top,#fffdf9 0%,#FBF8F1 48%,#f4efe7 100%)!important;box-shadow:0 0 50px rgba(80,55,10,0.08)}.desktop-sidebar{display:block;position:fixed;left:0;top:0;width:250px;height:100vh;background:linear-gradient(180deg,#221b14 0%,#17120d 100%);color:#fff;padding:30px 18px;z-index:80;border-right:1px solid rgba(212,175,55,.12)}.desktop-header{display:flex;position:sticky;top:0;height:92px;align-items:center;justify-content:space-between;padding:0 42px;background:rgba(251,248,241,.94);border-bottom:1px solid rgba(184,134,11,.12);backdrop-filter:blur(10px);z-index:19}.desktop-header h1{font-size:24px;letter-spacing:-.4px;margin:5px 0 0;color:#2B2115}.desktop-eyebrow{font-size:10px;letter-spacing:1.6px;font-weight:800;color:#B8860B}.desktop-header-actions{display:flex;align-items:center;gap:12px}.desktop-search{width:280px;border:1px solid rgba(184,134,11,.18);border-radius:12px;background:linear-gradient(180deg,#fff 0%,#fffefb 100%);padding:11px 14px;color:rgba(43,33,21,.55);font-size:12px;text-align:left;cursor:pointer;box-shadow:0 8px 18px rgba(184,134,11,.05)}.desktop-search span{font-size:18px;color:#B8860B;margin-right:8px}.desktop-language{border:1px solid rgba(184,134,11,.25);background:#fff;border-radius:10px;padding:10px 13px;color:#8b6817;font-weight:800;cursor:pointer;box-shadow:0 8px 18px rgba(184,134,11,.05)}.desktop-avatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#D4AF37;color:#fff;font-weight:800;box-shadow:0 8px 18px rgba(184,134,11,.28)}.desktop-brand{display:flex;align-items:center;gap:11px;padding:0 10px 38px}.desktop-brand strong{display:block;font-size:18px;letter-spacing:-.3px}.desktop-brand span{display:block;color:#D4AF37;font-size:11px;margin-top:2px}.desktop-brand-mark{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#D4AF37,#9C7A1E);display:grid;place-items:center;font-size:22px;font-weight:900;box-shadow:0 10px 20px rgba(184,134,11,.25)}.desktop-menu-label{font-size:9px;letter-spacing:1.5px;color:rgba(255,255,255,.38);font-weight:800;padding:0 13px 10px}.desktop-nav-item{display:flex;align-items:center;width:100%;gap:13px;border:0;background:transparent;color:rgba(255,255,255,.6);padding:13px;border-radius:10px;margin:3px 0;font-size:12px;font-weight:700;text-align:left;cursor:pointer}.desktop-nav-item:hover,.desktop-nav-item.active{background:rgba(212,175,55,.16);color:#fff}.desktop-nav-item.active{box-shadow:inset 3px 0 #D4AF37}.desktop-nav-icon{width:22px;text-align:center;color:#D4AF37;font-size:21px}.desktop-sidebar-card{margin:45px 5px 0;padding:15px 13px;border:1px solid rgba(212,175,55,.22);border-radius:12px;background:linear-gradient(180deg,rgba(212,175,55,.12),rgba(212,175,55,.05));box-shadow:0 10px 22px rgba(212,175,55,.08)}.desktop-sidebar-card-icon{display:block;color:#D4AF37;font-size:18px;margin-bottom:8px}.desktop-sidebar-card strong{font-size:12px}.desktop-sidebar-card p{font-size:10px;line-height:1.5;color:rgba(255,255,255,.5);margin:6px 0 0}.desktop-sidebar-footer{position:absolute;bottom:28px;left:31px;font-size:10px;line-height:1.7;color:rgba(255,255,255,.45)}.desktop-sidebar-footer span{color:#D4AF37}.loan-page{max-width:none!important;padding:18px 42px 104px!important}.loan-page>div{max-width:100%!important}.loan-page [style*="grid-template-columns: repeat(5"]{grid-template-columns:repeat(9,1fr)!important}.loan-page [style*="grid-template-columns: 1fr 1fr 1fr"]{grid-template-columns:repeat(3,1fr)!important}.loan-page [style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:repeat(2,1fr)!important}.loan-page [style*="position: sticky"]{padding-left:0!important;padding-right:0!important}.mobile-nav{display:none!important}.app-shell>div[style*="position: fixed"]{max-width:calc(100% - 250px)!important}.app-shell>div[style*="position: fixed"]>div{max-width:900px!important}.inquiry-bar{padding:16px 42px 20px!important;background:rgba(251,248,241,.96)!important;border-top:1px solid rgba(184,134,11,.16)!important;display:flex;justify-content:flex-end}.inquiry-bar .inquiry-cta{width:min(100%,420px)!important;min-height:54px!important;font-size:14px!important}}`}</style>
    </div>
  );
}
