import React, { useState, useRef, useEffect } from 'react';
import { enhanceResumeWithGroq } from './groqChatbot';
import supabase from './supabaseClient';
import {
  User, Briefcase, GraduationCap, Code, Globe,
  MapPin, Phone, Mail, FileText, CheckCircle2, Download,
  Sparkles, Plus, X, Link, ExternalLink, Camera
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────
const emptyExp  = () => ({ company: '', position: '', start_date: '', end_date: '', description: '' });
const emptyEdu  = () => ({ institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', description: '' });
const emptyProj = () => ({ name: '', description: '', technologies: '', url: '' });
const emptyLang = () => ({ language: '', proficiency: 'Professional' });

const STEPS = ['Build Profile', 'AI Magic', 'Download Resume'];

// ── parse education: handles both jsonb array and plain text string ────────────
function parseEducation(raw) {
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length > 0) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    return [{ institution: raw.trim(), degree: '', field_of_study: '', start_date: '', end_date: '', description: '' }];
  }
  return null;
}

// ── check if an email is a generated temp address (from Dashboard) ────────────
const isTempEmail = (email) =>
  !email || /^user_\d+@nexus\.temp$/.test(email.trim());

// ── DynamicList ───────────────────────────────────────────────────────────────
const DynamicList = ({ items, setter, emptyFn, title, icon: Icon, renderItem }) => (
  <div className="form-card animate-slide-up">
    <div className="form-card-header">
      <div className="form-card-icon"><Icon size={20} /></div>
      <div className="form-card-title">{title}</div>
    </div>
    {items.map((item, idx) => (
      <div key={idx} className="list-item">
        <button className="btn-remove" onClick={() => setter(items.filter((_, i) => i !== idx))}>
          <X size={16} />
        </button>
        {renderItem(item, idx, (field, val) => {
          const next = [...items];
          next[idx] = { ...next[idx], [field]: val };
          setter(next);
        })}
      </div>
    ))}
    <button className="btn-add" onClick={() => setter([...items, emptyFn()])}>
      <Plus size={16} /> Add {title}
    </button>
  </div>
);

// ── TagsInput ─────────────────────────────────────────────────────────────────
const TagsInput = ({ tags, setTags }) => {
  const [val, setVal] = useState('');
  const add = () => {
    const t = val.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setVal('');
  };
  return (
    <div className="tags-container">
      {tags.map(t => (
        <span key={t} className="tag">
          {t}
          <button className="tag-remove" onClick={() => setTags(tags.filter(x => x !== t))}>
            <X size={14} />
          </button>
        </span>
      ))}
      <input
        className="tag-input"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder="Add a skill..."
      />
    </div>
  );
};

// ── Loading Overlay (self-contained with guaranteed full-screen styles) ────────
const LoadingOverlay = () => (
  <div style={{
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(247,248,252,0.96)',
    backdropFilter: 'blur(8px)',
    gap: 20,
  }}>
    {/* Animated ring spinner */}
    <div style={{
      width: 60,
      height: 60,
      borderRadius: '50%',
      border: '4px solid #EEF2FF',
      borderTopColor: '#4338CA',
      animation: 'spin 0.85s linear infinite',
    }} />
    <div style={{
      fontFamily: "'Sora', sans-serif",
      fontSize: 22,
      fontWeight: 800,
      color: '#0D1321',
      letterSpacing: '-0.03em',
    }}>
      Applying AI Magic 
    </div>
    <p style={{
      fontSize: 14,
      color: '#4A5568',
      maxWidth: 320,
      textAlign: 'center',
      lineHeight: 1.6,
      margin: 0,
    }}>
      Nexus AI is crafting your summary and polishing your bullet points…
    </p>

    {/* Progress dots */}
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#4338CA',
          animation: `pulse 1.4s ${i * 0.2}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  </div>
);

// ── main component ────────────────────────────────────────────────────────────
export default function ResumePage() {
  const [step, setStep]             = useState(0);
  const [loading, setLoading]       = useState(false);
  const [dbLoading, setDbLoading]   = useState(true);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving' | 'saved' | 'error'
  const [prefilled, setPrefilled]   = useState(false);
  const [error, setError]           = useState('');
  const [enhancedData, setEnhancedData] = useState(null);
  const [suggestions, setSuggestions]   = useState([]);
  const [photo, setPhoto]           = useState(null);
  const photoInputRef               = useRef(null);

  const [form, setForm] = useState({
    email:           '',
    full_name:       '',
    phone:           '',
    city:            '',
    country:         '',
    linkedin_url:    '',
    github_url:      '',
    portfolio_url:   '',
    headline:        '',
    summary:         '',
    work_experience: [emptyExp()],
    education:       [emptyEdu()],
    skills:          [],
    certifications:  [],
    languages:       [emptyLang()],
    projects:        [],
    location_name:   '',
  });

  const updateForm = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // ── load from users table on mount ────────────────────────────────────────
  useEffect(() => {
    const userId = localStorage.getItem('nexus_user_id');
    if (!userId) { setDbLoading(false); return; }

    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('users')
        .select(
          'email, full_name, phone, city, country, ' +
          'linkedin_url, github_url, portfolio_url, ' +
          'headline, summary, skills, ' +
          'work_experience, education, languages, projects, certifications, photo_url, location_name'
        )
        .eq('id', userId)
        .single();

      if (data && !fetchErr) {
        const sharedFilled =
          data.full_name || data.headline || data.summary ||
          (Array.isArray(data.skills) && data.skills.length > 0);

        const eduParsed = parseEducation(data.education);

        setForm(prev => ({
          ...prev,
          // shared with Dashboard
          full_name: data.full_name || prev.full_name,
          headline:  data.headline  || prev.headline,
          summary:   data.summary   || prev.summary,
          skills:    Array.isArray(data.skills) && data.skills.length
                       ? data.skills : prev.skills,

          // FIX: only prefill email if it's a real address (not a nexus.temp one)
          email: !isTempEmail(data.email) ? (data.email || prev.email) : prev.email,

          // resume-only
          phone:         data.phone         || prev.phone,
          city:          data.city          || prev.city,
          country:       data.country       || prev.country,
          linkedin_url:  data.linkedin_url  || prev.linkedin_url,
          github_url:    data.github_url    || prev.github_url,
          portfolio_url: data.portfolio_url || prev.portfolio_url,

          education: eduParsed || prev.education,

          work_experience: Array.isArray(data.work_experience) && data.work_experience.length
                             ? data.work_experience : prev.work_experience,

          languages: Array.isArray(data.languages) && data.languages.length
                       ? data.languages : prev.languages,

          projects: Array.isArray(data.projects) && data.projects.length
                      ? data.projects : prev.projects,

          certifications: Array.isArray(data.certifications) && data.certifications.length
                            ? data.certifications : prev.certifications,
          location_name: data.location_name || prev.location_name,
        }));

        if (data.photo_url) setPhoto(data.photo_url);
        if (sharedFilled) setPrefilled(true);
      }
      setDbLoading(false);
    })();
  }, []);

  // ── save to users table ───────────────────────────────────────────────────
  const saveToUsers = async (formSnapshot) => {
    setSaveStatus('saving');
    try {
      const payload = {
        full_name:       formSnapshot.full_name.trim(),
        headline:        formSnapshot.headline.trim(),
        summary:         formSnapshot.summary.trim(),
        skills:          formSnapshot.skills,
        phone:           formSnapshot.phone.trim(),
        city:            formSnapshot.city.trim(),
        country:         formSnapshot.country.trim(),
        linkedin_url:    formSnapshot.linkedin_url.trim(),
        github_url:      formSnapshot.github_url.trim(),
        portfolio_url:   formSnapshot.portfolio_url.trim(),
        education:       formSnapshot.education,
        work_experience: formSnapshot.work_experience,
        languages:       formSnapshot.languages,
        projects:        formSnapshot.projects,
        certifications:  formSnapshot.certifications,
        location_name:   formSnapshot.location_name.trim(),
        photo_url:       photo, // Save the base64 photo string
      };

      const userId = localStorage.getItem('nexus_user_id');

      if (userId) {
        // existing user — UPDATE, only write real email
        if (!isTempEmail(formSnapshot.email)) {
          payload.email = formSnapshot.email.trim();
        }
        const { error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', userId);
        if (error) throw error;

      } else {
        // brand-new user via Resume Builder — INSERT a fresh row
        payload.email         = formSnapshot.email.trim();
        payload.password_hash = 'temp';

        const { data, error } = await supabase
          .from('users')
          .insert(payload)
          .select('id')
          .single();

        if (error) throw error;
        if (data?.id) localStorage.setItem('nexus_user_id', data.id);
      }

      setSaveStatus('saved');
    } catch (e) {
      console.error('[ResumePage] saveToUsers error:', e.message ?? e);
      setSaveStatus('error');
    }
  };

  // ── photo ─────────────────────────────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── generate (AI + save) ──────────────────────────────────────────────────
  const handleGenerate = async () => {
    // FIX: validation now ignores temp email addresses from Dashboard accounts
    const nameOk  = !!form.full_name.trim();
    const emailOk = !!form.email.trim() && !isTempEmail(form.email);

    if (!nameOk) {
      setError('Full Name is required before generating your resume.');
      return;
    }
    if (!emailOk) {
      setError('A real email address is required. Please enter your email above.');
      return;
    }

    setError('');
    setLoading(true);
    setEnhancedData(null); // reset any previous result

    // Save in parallel — no await so it doesn't block the AI call
    saveToUsers(form);

    try {
      const result = await enhanceResumeWithGroq(form);

      if (result.success) {
        setEnhancedData(result.data);
        setSuggestions(result.data.skill_suggestions ?? []);
      } else {
        // AI failed — show error but still open preview with original data
        setError(`AI couldn't enhance the resume: ${result.error}. Showing your original data instead.`);
        // Set a fallback so the preview doesn't render blank
        setEnhancedData({
          enhanced_headline:      form.headline,
          enhanced_summary:       form.summary,
          enhanced_work_experience: form.work_experience,
          skill_suggestions:      [],
        });
      }
    } catch (e) {
      console.error('handleGenerate unexpected error:', e);
      setError(`Unexpected error: ${e.message}`);
      setEnhancedData({
        enhanced_headline:      form.headline,
        enhanced_summary:       form.summary,
        enhanced_work_experience: form.work_experience,
        skill_suggestions:      [],
      });
    } finally {
      setLoading(false);
      setStep(2);
    }
  };

  // ── PDF download ──────────────────────────────────────────────────────────
  const handleDownload = async () => {
    const element = document.getElementById('resume-document');
    if (!element) {
      alert('Resume document not found — please wait for the preview to load.');
      return;
    }
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().set({
        margin: 0,
        filename: `${(form.full_name || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`,
        image:    { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:    { unit: 'in', format: 'a4', orientation: 'portrait' },
      }).from(element).save();
    } catch (e) {
      console.error('PDF download error:', e);
      alert('PDF generation failed. Make sure html2pdf.js is installed.');
    }
  };

  // ── loading skeleton ──────────────────────────────────────────────────────
  if (dbLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', gap: 14, color: '#4A5568', fontSize: 15,
      }}>
        <div style={{
          width: 28, height: 28,
          border: '3px solid #EEF2FF', borderTopColor: '#4F46E5',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
        Loading your profile…
      </div>
    );
  }

  // ── is the logged-in user on a temp email? ────────────────────────────────
  const isLoggedIn     = !!localStorage.getItem('nexus_user_id');
  const hasTempEmail   = isLoggedIn && isTempEmail(form.email);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* Full-screen loading overlay — rendered outside the flow so it always covers */}
      {loading && <LoadingOverlay />}

      {/* inner nav — hidden by .resume-page-host CSS rule in App.jsx */}
      <nav className="nav">
        <div className="nav-brand" onClick={() => setStep(0)}>
          <div className="nav-logo"><Sparkles size={18} /></div>
          <div>
            <div className="nav-title">Nexus AI Resume</div>
            <div className="nav-subtitle">Powered by Nexus AI</div>
          </div>
        </div>
        <div className="steps-nav">
          {STEPS.map((s, i) => (
            <button
              key={s}
              className={`step-indicator ${step === i ? 'active' : ''} ${i < step ? 'completed' : ''}`}
              onClick={() => { if (i <= step || (i === 2 && enhancedData)) setStep(i); }}
            >
              {i < step && <CheckCircle2 size={16} />}
              {s}
            </button>
          ))}
        </div>
      </nav>

      {/* ── STEP 0 : FORM ── */}
      {step === 0 && (
        <div className="page-container animate-fade-in">
          <div className="page-header">
            <h1>Build your <span className="gradient-text">Professional Profile</span></h1>
            <p>Enter your details below. Our AI will optimise your bullet points and write a compelling summary.</p>
          </div>

          {/* Not logged in warning */}
          {!isLoggedIn && (
            <div style={{
              background: '#FFFBEB', border: '1px solid #FDE68A',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              fontSize: 13, color: '#B45309',
            }}>
              ⚠ You're not logged in — your resume won't be saved to your account.
            </div>
          )}

          {/* Temp email notice — shown when Dashboard account has no real email */}
          {hasTempEmail && (
            <div style={{
              background: '#FFF7ED', border: '1px solid #FED7AA',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              fontSize: 13, color: '#C2410C',
            }}>
              📧 Your account was created without a real email. Please enter your email
              address below so it can appear on your resume.
            </div>
          )}

          {/* Pre-filled from Dashboard banner */}
          {prefilled && (
            <div style={{
              background: '#F0FDFA', border: '1px solid #99F6E4',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, color: '#0D9488',
            }}>
              <CheckCircle2 size={16} />
              <span>
                <strong>Profile pre-filled</strong> from your Dashboard —
                review and complete any missing details below.
              </span>
            </div>
          )}

          {/* Save status */}
          {saveStatus === 'saved' && (
            <div style={{ fontSize: 12, color: '#059669', marginBottom: 12, textAlign: 'right' }}>
              ✓ Saved to your profile
            </div>
          )}
          {saveStatus === 'error' && (
            <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 12, textAlign: 'right' }}>
              ⚠ Could not save — check your connection
            </div>
          )}

          {/* ── Personal Info ── */}
          <div className="form-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="form-card-header">
              <div className="form-card-icon"><User size={20} /></div>
              <div className="form-card-title">Personal Information</div>
            </div>

            {/* Photo upload */}
            <div className="photo-upload-row">
              <div className="photo-preview" onClick={() => photoInputRef.current?.click()}>
                {photo
                  ? <img src={photo} alt="Profile" className="photo-img" />
                  : <div className="photo-placeholder"><Camera size={28} /><span>Upload Photo</span></div>
                }
              </div>
              <input
                ref={photoInputRef}
                type="file" accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              <div className="photo-upload-info">
                <p className="photo-label">
                  Profile Photo <span className="optional-badge">Optional</span>
                </p>
                <p className="photo-hint">
                  Recommended: square image, at least 200×200px.<br />
                  Appears in the top corner of your resume.
                </p>
                {photo && (
                  <button className="photo-remove-btn" onClick={() => setPhoto(null)}>
                    <X size={14} /> Remove photo
                  </button>
                )}
              </div>
            </div>

            {/* Name + Email */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  className="form-input"
                  value={form.full_name}
                  onChange={e => updateForm('full_name', e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Email *
                  {isLoggedIn && !hasTempEmail && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#0D9488',
                      background: '#F0FDFA', border: '1px solid #99F6E4',
                      borderRadius: 4, padding: '1px 6px',
                      textTransform: 'uppercase', letterSpacing: '.04em',
                    }}>
                      from account
                    </span>
                  )}
                </label>
                <input
                  className="form-input"
                  value={form.email}
                  // FIX: allow editing when email is empty or is a temp placeholder
                  readOnly={isLoggedIn && !hasTempEmail}
                  onChange={e => {
                    // always allow editing if temp or not logged in
                    if (!isLoggedIn || hasTempEmail) updateForm('email', e.target.value);
                  }}
                  placeholder="jane@example.com"
                  style={isLoggedIn && !hasTempEmail ? {
                    background: '#F8FAFC', color: '#64748B', cursor: 'default',
                  } : {}}
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="+1 234 567 890" />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" value={form.city} onChange={e => updateForm('city', e.target.value)} placeholder="New York" />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input className="form-input" value={form.country} onChange={e => updateForm('country', e.target.value)} placeholder="USA" />
              </div>
              <div className="form-group">
                <label className="form-label">Location Name (Optional)</label>
                <input className="form-input" value={form.location_name} onChange={e => updateForm('location_name', e.target.value)} placeholder="e.g. Silicon Valley" />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input className="form-input" value={form.linkedin_url} onChange={e => updateForm('linkedin_url', e.target.value)} placeholder="linkedin.com/in/..." />
              </div>
              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <input className="form-input" value={form.github_url} onChange={e => updateForm('github_url', e.target.value)} placeholder="github.com/..." />
              </div>
              <div className="form-group">
                <label className="form-label">Portfolio URL</label>
                <input className="form-input" value={form.portfolio_url} onChange={e => updateForm('portfolio_url', e.target.value)} placeholder="janedoe.dev" />
              </div>
            </div>
          </div>

          {/* ── Headline & Summary ── */}
          <div className="form-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="form-card-header">
              <div className="form-card-icon"><FileText size={20} /></div>
              <div className="form-card-title">Headline & Summary</div>
            </div>
            <div className="form-group">
              <label className="form-label">Professional Headline</label>
              <input
                className="form-input"
                value={form.headline}
                onChange={e => updateForm('headline', e.target.value)}
                placeholder="Senior Full Stack Engineer"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Summary <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>— rough draft, AI will perfect it</span></label>
              <textarea
                className="form-input"
                value={form.summary}
                onChange={e => updateForm('summary', e.target.value)}
                placeholder="Write a rough draft, AI will perfect it..."
              />
            </div>
          </div>

          {/* ── Work Experience ── */}
          <DynamicList
            title="Work Experience" icon={Briefcase}
            items={form.work_experience}
            setter={v => updateForm('work_experience', v)}
            emptyFn={emptyExp}
            renderItem={(item, i, update) => (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Company</label>
                    <input className="form-input" value={item.company} onChange={e => update('company', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Position</label>
                    <input className="form-input" value={item.position} onChange={e => update('position', e.target.value)} />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="form-input" value={item.start_date} onChange={e => update('start_date', e.target.value)} placeholder="Jan 2020" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="form-input" value={item.end_date} onChange={e => update('end_date', e.target.value)} placeholder="Present" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Responsibilities <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>— rough draft, AI will enhance</span></label>
                  <textarea
                    className="form-input"
                    value={item.description}
                    onChange={e => update('description', e.target.value)}
                    placeholder="- Built features... (AI will enhance this)"
                  />
                </div>
              </>
            )}
          />

          {/* ── Education ── */}
          <DynamicList
            title="Education" icon={GraduationCap}
            items={form.education}
            setter={v => updateForm('education', v)}
            emptyFn={emptyEdu}
            renderItem={(item, i, update) => (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Institution</label>
                    <input className="form-input" value={item.institution} onChange={e => update('institution', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Degree</label>
                    <input className="form-input" value={item.degree} onChange={e => update('degree', e.target.value)} />
                  </div>
                </div>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Field of Study</label>
                    <input className="form-input" value={item.field_of_study} onChange={e => update('field_of_study', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start</label>
                    <input className="form-input" value={item.start_date} onChange={e => update('start_date', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End</label>
                    <input className="form-input" value={item.end_date} onChange={e => update('end_date', e.target.value)} />
                  </div>
                </div>
              </>
            )}
          />

          {/* ── Skills ── */}
          <div className="form-card animate-slide-up">
            <div className="form-card-header">
              <div className="form-card-icon"><Code size={20} /></div>
              <div className="form-card-title">Skills</div>
            </div>
            <TagsInput tags={form.skills} setTags={v => updateForm('skills', v)} />
          </div>

          {/* ── Projects ── */}
          <DynamicList
            title="Projects" icon={Globe}
            items={form.projects}
            setter={v => updateForm('projects', v)}
            emptyFn={emptyProj}
            renderItem={(item, i, update) => (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Project Name</label>
                    <input className="form-input" value={item.name} onChange={e => update('name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">URL</label>
                    <input className="form-input" value={item.url} onChange={e => update('url', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Technologies</label>
                  <input className="form-input" value={item.technologies} onChange={e => update('technologies', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={item.description} onChange={e => update('description', e.target.value)} />
                </div>
              </>
            )}
          />

          {/* ── Certifications ── */}
          <div className="form-card animate-slide-up">
            <div className="form-card-header">
              <div className="form-card-icon"><CheckCircle2 size={20} /></div>
              <div className="form-card-title">Certifications</div>
            </div>
            <TagsInput tags={form.certifications} setTags={v => updateForm('certifications', v)} />
          </div>

          {/* ── Languages ── */}
          <DynamicList
            title="Languages" icon={Globe}
            items={form.languages}
            setter={v => updateForm('languages', v)}
            emptyFn={emptyLang}
            renderItem={(item, i, update) => (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <input className="form-input" value={item.language} onChange={e => update('language', e.target.value)} placeholder="English" />
                </div>
                <div className="form-group">
                  <label className="form-label">Proficiency</label>
                  <select className="form-input" value={item.proficiency} onChange={e => update('proficiency', e.target.value)}>
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Professional">Professional</option>
                    <option value="Limited">Limited</option>
                  </select>
                </div>
              </div>
            )}
          />

          {/* Error */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              color: '#DC2626', fontWeight: 600, fontSize: 14, textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            className="btn-primary animate-slide-up"
            onClick={handleGenerate}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Sparkles size={20} />
            {loading ? 'Generating…' : 'Generate AI Resume'}
          </button>
        </div>
      )}

      {/* ── STEP 2 : PREVIEW ── */}
      {step === 2 && !loading && (
        <div className="resume-preview-container animate-fade-in">

          {/* Sidebar controls */}
          <div className="preview-sidebar">
            <div className="form-card">
              <h3 style={{ marginBottom: 16 }}>Ready to export!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
                Your resume has been enhanced by Nexus AI and saved to your profile.
              </p>

              {/* Show any non-fatal error that fell through */}
              {error && (
                <div style={{
                  background: '#FFFBEB', border: '1px solid #FDE68A',
                  borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                  fontSize: 12, color: '#B45309',
                }}>
                  ⚠ {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="btn-primary" onClick={handleDownload}>
                  <Download size={18} /> Download PDF
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => { setStep(0); setError(''); }}
                  style={{ justifyContent: 'center' }}
                >
                  Back to Editor
                </button>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="suggestions-card">
                <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="var(--primary)" /> Suggested Skills
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {suggestions.map(s => (
                    <button
                      key={s}
                      className="suggestion-chip"
                      onClick={() => {
                        if (!form.skills.includes(s)) updateForm('skills', [...form.skills, s]);
                        setSuggestions(suggestions.filter(x => x !== s));
                      }}
                    >
                      <Plus size={12} /> {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Resume document ── */}
          <div className="resume-paper" id="resume-document">
            <header className="resume-header">
              <div className="resume-header-text">
                <h1 className="resume-name">{form.full_name || 'Your Name'}</h1>
                <div className="resume-headline">
                  {enhancedData?.enhanced_headline || form.headline || 'Professional Headline'}
                </div>
                <div className="resume-header-contact">
                  {/* FIX: only show email if it's a real address */}
                  {form.email && !isTempEmail(form.email) && (
                    <span><Mail size={10} /> {form.email}</span>
                  )}
                  {form.phone        && <span><Phone size={10} /> {form.phone}</span>}
                  {(form.city || form.country || form.location_name) && (
                    <span>
                      <MapPin size={10} /> {[form.city, form.country, form.location_name].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {form.linkedin_url  && <a href={form.linkedin_url}><Link size={10} /> LinkedIn</a>}
                  {form.github_url    && <a href={form.github_url}><Link size={10} /> GitHub</a>}
                  {form.portfolio_url && <a href={form.portfolio_url}><Globe size={10} /> Portfolio</a>}
                </div>
              </div>
              {photo && (
                <div className="resume-header-photo">
                  <img src={photo} alt={form.full_name} className="resume-photo-img" />
                </div>
              )}
            </header>

            <div className="resume-body">
              {/* Main column */}
              <div className="resume-main">

                {/* Summary */}
                {(enhancedData?.enhanced_summary || form.summary) && (
                  <section className="resume-section">
                    <h2 className="resume-section-title">
                      <span className="section-title-bar" />
                      Professional Summary
                    </h2>
                    <div className="resume-summary">
                      {enhancedData?.enhanced_summary || form.summary}
                    </div>
                  </section>
                )}

                {/* Work Experience */}
                {(() => {
                  const exp =
                    (enhancedData?.enhanced_work_experience?.length
                      ? enhancedData.enhanced_work_experience
                      : form.work_experience) ?? [];

                  return exp.length > 0 && exp[0].company ? (
                    <section className="resume-section">
                      <h2 className="resume-section-title">
                        <span className="section-title-bar" />
                        Work Experience
                      </h2>
                      <div className="resume-items">
                        {exp.map((e, i) => (
                          <div key={i} className="resume-item">
                            <div className="resume-item-header">
                              <div>
                                <h3 className="resume-item-title">{e.position}</h3>
                                <div className="resume-item-subtitle">{e.company}</div>
                              </div>
                              <span className="resume-item-date">
                                {e.start_date}{e.end_date ? ` — ${e.end_date}` : ''}
                              </span>
                            </div>
                            {e.description && (
                              <ul className="resume-item-desc">
                                {e.description.split('\n').filter(Boolean).map((pt, j) => (
                                  <li key={j}>{pt.replace(/^[-•*]\s*/, '')}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null;
                })()}

                {/* Projects */}
                {form.projects.length > 0 && form.projects[0].name && (
                  <section className="resume-section">
                    <h2 className="resume-section-title">
                      <span className="section-title-bar" />
                      Projects
                    </h2>
                    <div className="resume-items">
                      {form.projects.map((proj, i) => (
                        <div key={i} className="resume-item">
                          <div className="resume-item-header">
                            <div>
                              <h3 className="resume-item-title">
                                {proj.name}
                                {proj.url && (
                                  <a href={proj.url} className="resume-link">
                                    <ExternalLink size={10} /> Link
                                  </a>
                                )}
                              </h3>
                              <div className="resume-item-subtitle">{proj.technologies}</div>
                            </div>
                          </div>
                          {proj.description && (
                            <div className="resume-item-text">{proj.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar column */}
              <aside className="resume-sidebar">

                {/* Skills */}
                {form.skills.length > 0 && (
                  <section className="resume-section">
                    <h2 className="resume-section-title sidebar-title">Skills</h2>
                    <div className="resume-skills">
                      {form.skills.map(s => (
                        <span key={s} className="resume-skill-tag">{s}</span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Education */}
                {form.education.length > 0 && form.education[0].institution && (
                  <section className="resume-section">
                    <h2 className="resume-section-title sidebar-title">Education</h2>
                    <div className="resume-items">
                      {form.education.map((edu, i) => (
                        <div key={i} className="resume-item">
                          <h3 className="resume-item-title">
                            {edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}
                          </h3>
                          <div className="resume-item-subtitle">{edu.institution}</div>
                          <div className="resume-item-date" style={{ marginTop: 3 }}>
                            {edu.start_date}{edu.end_date ? ` — ${edu.end_date}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Languages */}
                {form.languages.length > 0 && form.languages[0].language && (
                  <section className="resume-section">
                    <h2 className="resume-section-title sidebar-title">Languages</h2>
                    <div className="resume-items">
                      {form.languages.map((lang, i) => (
                        <div key={i} className="resume-lang-item">
                          <span className="resume-lang-name">{lang.language}</span>
                          <span className="resume-lang-level">{lang.proficiency}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Certifications */}
                {form.certifications.length > 0 && (
                  <section className="resume-section">
                    <h2 className="resume-section-title sidebar-title">Certifications</h2>
                    <div className="resume-skills">
                      {form.certifications.map(c => (
                        <div key={c} className="resume-item" style={{ marginBottom: 4 }}>
                          <div className="resume-item-subtitle" style={{ fontSize: 11, color: 'var(--text-main)' }}>• {c}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}