import { useMemo, useState } from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bell, Bookmark, BriefcaseBusiness, CalendarDays,
  Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Command,
  Compass, Copy, FileText, Flame, GraduationCap, Hash, Home, Laptop, Lightbulb, Link2, LockKeyhole,
  LogOut, Menu, MessageCircle, MoreHorizontal, Plus, Search, Send, Settings2, ShieldCheck,
  Sparkles, Star, Sun, Moon, Users, X, Zap,
} from "lucide-react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, firebaseConfigured } from "./firebase.js";
import { initialPosts, mentors, navItems } from "./data.js";

const icons = { home: Home, users: Users, sparkles: Sparkles, shield: ShieldCheck };
const categories = ["For you", "Hackathons", "Research Teams", "College Clubs", "Department Groups"];
const academicEmail = /^[^\s@]+@(?:[^\s@]+\.)?(?:ltce\.in|[a-z0-9-]+\.ac\.in|[a-z0-9-]+\.edu)$/i;

function Avatar({ initials, tone = "lavender", size = "" }) {
  return <span className={`avatar avatar-${tone} ${size}`}>{initials}</span>;
}

function App() {
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [votes, setVotes] = useState({});
  const [feedFilter, setFeedFilter] = useState("For you");
  const [toast, setToast] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function vote(id, direction) {
    const previous = votes[id] || 0;
    const next = previous === direction ? 0 : direction;
    setVotes((current) => ({ ...current, [id]: next }));
    setPosts((items) => items.map((post) => post.id === id ? { ...post, upvotes: post.upvotes - previous + next } : post));
  }

  return (
    <div className={dark ? "app-shell dark" : "app-shell"}>
      {location.pathname === "/login" || location.pathname === "/recruiter" || location.pathname.startsWith("/profile/") ? (
        <Routes>
          <Route path="/login" element={<AuthPage notify={notify} />} />
          <Route path="/recruiter" element={<RecruiterPage notify={notify} />} />
          <Route path="/profile/:username" element={<PublicProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <div className="app-layout">
          <Sidebar mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} />
          {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
          <div className="main-column">
            <header className="topbar">
              <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
              <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{pageTitle(location.pathname)}</strong></div>
              <div className="topbar-actions">
                <button className="search-trigger" onClick={() => navigate("/skillswap")}><Search size={15} /><span>Search anything...</span><kbd><Command size={11} /> K</kbd></button>
                <button className="icon-button theme-button" onClick={() => setDark(!dark)} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
                <div className="notification-wrap">
                  <button className="icon-button notification-button" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications"><Bell size={17} /><i /></button>
                  {notificationsOpen && <div className="notification-popover"><strong>You're all caught up</strong><p>New mentor matches and community updates will show up here.</p></div>}
                </div>
                <button className="account-chip" onClick={() => navigate("/login")}><Avatar initials="SK" tone="blue" /><span>Samira Khan</span><ChevronDown size={14} /></button>
              </div>
            </header>
            <main className="page-content">
              <Routes>
                <Route path="/" element={<FeedPage posts={posts} setPosts={setPosts} votes={votes} vote={vote} filter={feedFilter} setFilter={setFeedFilter} notify={notify} />} />
                <Route path="/skillswap" element={<SkillSwapPage notify={notify} />} />
                <Route path="/profilify" element={<ProfilifyPage notify={notify} />} />
                <Route path="/safety" element={<SafetyPage notify={notify} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <footer className="app-footer"><span>PeerNexus <span className="footer-dot">·</span> Built for campus, powered by community</span><span><span className="status-dot" /> All systems normal</span></footer>
          </div>
        </div>
      )}
      {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
      {!firebaseConfigured && <span className="demo-indicator">Demo workspace</span>}
    </div>
  );
}

function pageTitle(path) {
  if (path === "/") return "Home";
  if (path.startsWith("/skillswap")) return "SkillSwap";
  if (path.startsWith("/profilify")) return "Profilify AI";
  if (path.startsWith("/safety")) return "Trust & Safety";
  return "Workspace";
}

function Sidebar({ mobileOpen, closeMobile }) {
  const location = useLocation();
  return (
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <Link to="/" className="brand" onClick={closeMobile}><span className="brand-mark"><span /><span /><span /><span /></span><span>peer<span className="brand-strong">nexus</span></span><span className="beta-tag">BETA</span></Link>
      <div className="workspace-switch"><span className="college-mark"><GraduationCap size={17} /></span><span><strong>LTCE Campus</strong><small>Student workspace</small></span><ChevronDown size={14} /></div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="main-nav">
        {navItems.map((item) => {
          const Icon = icons[item.icon];
          const active = location.pathname === item.path;
          return <Link key={item.path} to={item.path} onClick={closeMobile} className={`nav-link ${active ? "active" : ""}`}><Icon size={17} strokeWidth={active ? 2.1 : 1.8} /><span>{item.label}</span>{item.label === "Profilify AI" && <span className="nav-new">NEW</span>}</Link>;
        })}
      </nav>
      <div className="sidebar-label communities-label">YOUR COMMUNITIES <button aria-label="Add community"><Plus size={14} /></button></div>
      <div className="community-links"><Link to="/" onClick={closeMobile}><span className="community-hash indigo"><Hash size={13} /></span>Computer Engineering</Link><Link to="/" onClick={closeMobile}><span className="community-hash amber"><Hash size={13} /></span>Design Club</Link><Link to="/" onClick={closeMobile}><span className="community-hash green"><Hash size={13} /></span>HackNexus 2025</Link></div>
      <div className="sidebar-spacer" />
      <div className="mentor-nudge"><span className="nudge-icon"><Sparkles size={16} /></span><strong>Grow together</strong><p>One good conversation can change your trajectory.</p><Link to="/skillswap">Find a mentor <ArrowRight size={13} /></Link></div>
      <div className="sidebar-bottom"><Link to="/safety"><CircleHelp size={16} /> Help & feedback</Link><div className="profile-mini"><Avatar initials="SK" tone="blue" /><span><strong>Samira Khan</strong><small>Computer Engineering · '26</small></span><button aria-label="Profile settings"><MoreHorizontal size={18} /></button></div></div>
    </aside>
  );
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function FeedPage({ posts, setPosts, votes, vote, filter, setFilter, notify }) {
  const [postComposer, setPostComposer] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftCategory, setDraftCategory] = useState("Hackathons");
  const [openComments, setOpenComments] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replies, setReplies] = useState({});
  const shownPosts = filter === "For you" ? posts : posts.filter((post) => post.category === filter);
  function publish() {
    if (!draft.trim()) return;
    const post = {
      id: Date.now(),
      category: draftCategory,
      title: draft.trim().split("\n")[0].slice(0, 120),
      body: draft.trim(),
      author: "Samira Khan",
      initials: "SK",
      tone: "blue",
      department: "Computer Engineering",
      time: "just now",
      upvotes: 1,
      comments: 0,
      tags: ["Community"],
    };
    setPosts((items) => [post, ...items]);
    setFilter("For you");
    notify("Your post is live in the community.");
    setDraft("");
    setDraftCategory("Hackathons");
    setPostComposer(false);
  }
  function publishReply(postId) {
    if (!replyDraft.trim()) return;
    setReplies((items) => ({ ...items, [postId]: [...(items[postId] || []), replyDraft.trim()] }));
    setPosts((items) => items.map((post) => post.id === postId ? { ...post, comments: post.comments + 1 } : post));
    setReplyDraft("");
    notify("Reply added to the thread.");
  }
  return (
    <>
      <PageHeading eyebrow="MONDAY, MAY 19, 2025" title={<>Good morning, Samira <span className="wave">✦</span></>} subtitle="Your campus is buzzing. Here's what's happening around you." action={<button className="button button-primary" onClick={() => setPostComposer(true)}><Plus size={16} /> Start a conversation</button>} />
      <section className="welcome-banner"><div className="welcome-copy"><span className="banner-overline"><Sparkles size={13} /> YOUR WEEKLY MOMENTUM</span><h2>Small steps, shared<br />knowledge, <em>big futures.</em></h2><p>You've helped 3 peers this month. Keep that momentum going.</p><Link to="/profilify">See your growth <ArrowRight size={14} /></Link></div><div className="banner-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orb orb-core"><Sparkles size={23} /></div><div className="orb orb-a">✳</div><div className="orb orb-b"><Users size={15} /></div><div className="orb orb-c">✦</div><div className="banner-stat"><strong>+24%</strong><span>community growth</span></div></div></section>
      <div className="content-grid">
        <section className="feed-main">
          <div className="section-heading"><div><h2>Community pulse</h2><p>Ideas, questions, and opportunities from your campus.</p></div><button className="filter-button"><Settings2 size={15} /> Filters</button></div>
          <div className="feed-tabs">{categories.map((category) => <button key={category} onClick={() => setFilter(category)} className={filter === category ? "selected" : ""}>{category}</button>)}</div>
          {postComposer && <div className="composer card"><div className="composer-head"><Avatar initials="SK" tone="blue" /><strong>Start a conversation</strong><button className="icon-button" onClick={() => setPostComposer(false)} aria-label="Close composer"><X size={16} /></button></div><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Share an idea, ask a question, or find your people..." /><div className="composer-actions"><select aria-label="Post category" value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)}><option>Hackathons</option><option>Research Teams</option><option>College Clubs</option><option>Department Groups</option></select><button className="button button-primary button-small" onClick={publish}><Send size={14} /> Publish</button></div></div>}
          <div className="post-list">{shownPosts.length ? shownPosts.map((post) => <article className="post-card card" key={post.id}>
            <div className="vote-rail"><button onClick={() => vote(post.id, 1)} className={votes[post.id] === 1 ? "voted-up" : ""} aria-label="Upvote"><ArrowUp size={16} /></button><strong>{post.upvotes}</strong><button onClick={() => vote(post.id, -1)} className={votes[post.id] === -1 ? "voted-down" : ""} aria-label="Downvote"><ArrowDown size={16} /></button></div>
            <div className="post-body"><div className="post-meta"><span className={`category-pill category-${post.category.replaceAll(" ", "-").toLowerCase()}`}>{post.category}</span><span>{post.time}</span><button aria-label="More post actions"><MoreHorizontal size={17} /></button></div><h3>{post.title}</h3><p>{post.body}</p><div className="post-tags">{post.tags.map((tag) => <span key={tag}>#{tag.replaceAll(" ", "")}</span>)}</div><div className="post-footer"><div className="post-author"><Avatar initials={post.initials} tone={post.tone} size="avatar-small" /><span><strong>{post.author}</strong><small>{post.department}</small></span></div><div className="post-actions"><button onClick={() => setOpenComments(openComments === post.id ? null : post.id)}><MessageCircle size={15} /> {post.comments} replies</button><button onClick={() => notify("Saved to your bookmarks.")} aria-label="Save post"><Bookmark size={15} /></button></div></div>
              {openComments === post.id && <div className="comment-thread">{replies[post.id]?.map((reply, index) => <div className="comment-item" key={`${post.id}-${index}`}><Avatar initials="SK" tone="blue" size="avatar-small" /><p><strong>Samira Khan</strong> {reply}</p></div>)}{!replies[post.id]?.length && <div className="comment-item"><Avatar initials="PN" tone="peach" size="avatar-small" /><p><strong>Priya Nair</strong> This sounds great! I can connect you with someone from Design Club.</p></div>}<div className="comment-input"><input value={replyDraft} onChange={(event) => setReplyDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") publishReply(post.id); }} placeholder="Write a thoughtful reply..." /><button aria-label="Send reply" onClick={() => publishReply(post.id)}><Send size={15} /></button></div></div>}
            </div>
          </article>) : <div className="empty-state card"><Compass size={24} /><strong>Nothing here just yet</strong><span>Be the first to start a conversation in {filter}.</span><button className="button button-primary button-small" onClick={() => setPostComposer(true)}>Create a post</button></div>}</div>
          <button className="load-more" onClick={() => notify("You're all caught up.")}>You're all caught up <Check size={14} /></button>
        </section>
        <aside className="right-rail">
          <section className="rail-card card"><div className="rail-title"><h3>Your week</h3><button aria-label="View calendar"><CalendarDays size={15} /></button></div><div className="week-row"><span className="week-date">MON <strong>19</strong></span><span className="week-event"><i className="event-dot purple" /><span><strong>React study circle</strong><small>4:30 PM · Library 2B</small></span></span></div><div className="week-row"><span className="week-date">WED <strong>21</strong></span><span className="week-event"><i className="event-dot orange" /><span><strong>Mentorship with Aarav</strong><small>6:30 PM · Online</small></span></span></div><div className="week-row"><span className="week-date">FRI <strong>23</strong></span><span className="week-event"><i className="event-dot green-dot" /><span><strong>Design Club review night</strong><small>5:00 PM · Innovation Lab</small></span></span></div><Link className="rail-link" to="/skillswap">View your schedule <ArrowRight size={13} /></Link></section>
          <section className="rail-card card people-card"><div className="rail-title"><div><h3>People to know</h3><p>Based on your interests</p></div><button aria-label="See all mentors"><ArrowRight size={15} /></button></div>{mentors.slice(0, 2).map((mentor) => <div className="person-row" key={mentor.id}><Avatar initials={mentor.initials} tone={mentor.tone} /><span className="person-info"><strong>{mentor.name} <CheckCircle2 size={12} /></strong><small>{mentor.skills[0]} · {mentor.rating} ★</small></span><button onClick={() => notify(`Connection request sent to ${mentor.name}.`)} aria-label={`Connect with ${mentor.name}`}><Plus size={16} /></button></div>)}<Link to="/skillswap" className="rail-link">Explore SkillSwap <ArrowRight size={13} /></Link></section>
          <section className="mini-profile-card"><div className="mini-profile-top"><span className="mini-profile-label">YOUR PROFILE</span><Link to="/profile/samira-khan" aria-label="View public profile"><ArrowUp size={14} /></Link></div><div className="mini-profile-person"><Avatar initials="SK" tone="blue" /><div><strong>Samira Khan <CheckCircle2 size={13} /></strong><span>Computer Engineering · '26</span></div></div><div className="mini-stats"><div><strong>12</strong><span>Sessions</span></div><div><strong>4.9<span className="star">★</span></strong><span>Cred score</span></div><div><strong>8</strong><span>Skills</span></div></div><Link to="/profile/samira-khan" className="profile-link">View public profile <ArrowRight size={13} /></Link></section>
          <div className="rail-footer"><Link to="/safety">Community guidelines</Link><span>·</span><a href="mailto:hello@peernexus.app">Get support</a><span>·</span><span>v1.4.2</span></div>
        </aside>
      </div>
    </>
  );
}

function SkillSwapPage({ notify }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [rankedIds, setRankedIds] = useState(null);
  const results = useMemo(() => {
    if (!submitted) return mentors;
    const terms = submitted.toLowerCase().split(/\W+/).filter((word) => word.length > 3);
    const ranked = [...mentors].map((mentor) => ({ ...mentor, match: Math.min(99, mentor.match + terms.filter((term) => mentor.skills.join(" ").toLowerCase().includes(term)).length * 2) }));
    if (!rankedIds) return ranked.sort((a, b) => b.match - a.match);
    return ranked.sort((a, b) => rankedIds.indexOf(a.id) - rankedIds.indexOf(b.id));
  }, [submitted, rankedIds]);
  async function searchMentors(event) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSubmitted(query);
    setRankedIds(null);
    try {
      const response = await fetch("/api/mentors/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Mentor search is temporarily unavailable.");
      }
      const result = await response.json();
      setRankedIds(result.rankedMentorIds);
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <PageHeading eyebrow="SKILLSWAP DIRECTORY" title="Find your next mentor" subtitle="Good things happen when knowledge moves both ways." action={<button className="button button-secondary" onClick={() => notify("Your mentor profile is ready to update.")}><Settings2 size={15} /> Edit my profile</button>} />
      <section className="skill-hero"><div className="skill-hero-content"><span className="banner-overline"><Sparkles size={13} /> PROFILIFY MATCH</span><h2>What would you like<br />to <em>learn today?</em></h2><p>Tell us what you're working on. We'll find the right person to help you get unstuck.</p><form className="mentor-search" onSubmit={searchMentors}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Debugging a React state bug..." /><button disabled={loading} aria-label="Search mentors"><ArrowRight size={16} /></button></form><div className="search-suggestions"><span>Try:</span>{["React state bugs", "ML pipeline setup", "Portfolio feedback"].map((suggestion) => <button key={suggestion} onClick={() => setQuery(suggestion)}>{suggestion}</button>)}</div></div><div className="skill-hero-art"><div className="match-ring"><span>AI</span><small>powered<br />matching</small></div><div className="match-orbit"><div className="match-avatar m1">AD</div><div className="match-avatar m2">PN</div><div className="match-avatar m3">KS</div><div className="match-spark">✦</div></div></div></section>
      <div className="profile-summary-grid"><div className="summary-card card"><div className="summary-label">YOUR CRED SCORE <CircleHelp size={13} /></div><div className="cred-score">4.9<span>/5</span><div className="cred-stars">★★★★★</div></div><small>Top 8% on your campus</small></div><div className="summary-card card"><div className="summary-label">MENTORSHIP SESSIONS</div><div className="summary-metric">12 <span>sessions</span></div><small>+3 this month <span className="positive">↗ 33%</span></small></div><div className="summary-card card"><div className="summary-label">VERIFIED SKILLS</div><div className="summary-metric">8 <span>skills</span></div><small><span className="skill-chip">React</span> <span className="skill-chip">Figma</span> +6</small></div><div className="summary-card streak-card"><div className="summary-label">LEARNING STREAK</div><div className="summary-metric">6 <span>days <Flame size={18} /></span></div><small>One more day to beat your best!</small></div></div>
      <div className="directory-heading"><div><h2>{submitted ? "Your mentor matches" : "Mentors you might love"}</h2><p>{submitted ? `Recommended for “${submitted}”` : "Verified people who are generous with what they know."}</p></div><button className="sort-control">Best match <ChevronDown size={14} /></button></div>
      <div className="mentor-grid">{results.map((mentor) => <MentorCard key={mentor.id} mentor={mentor} notify={notify} />)}</div>
      <div className="cred-note"><ShieldCheck size={16} /><span><strong>Every mentor is verified.</strong> Sessions, reviews, and earned skills are tied to real campus identities.</span><Link to="/safety">How trust works <ArrowRight size={13} /></Link></div>
    </>
  );
}

function MentorCard({ mentor, notify }) {
  return <article className="mentor-card card"><div className="mentor-card-top"><Avatar initials={mentor.initials} tone={mentor.tone} size="avatar-large" /><span className="match-badge"><Sparkles size={11} /> {mentor.match}% match</span><button className="icon-button mentor-more" aria-label="More mentor details"><MoreHorizontal size={17} /></button></div><h3>{mentor.name} <CheckCircle2 size={14} /></h3><p className="mentor-title">{mentor.title}</p><div className="mentor-rating"><Star size={13} fill="currentColor" /> <strong>{mentor.rating}</strong><span>({mentor.sessions} sessions)</span><i /> <span><ShieldCheck size={12} /> Verified</span></div><div className="mentor-skills">{mentor.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><div className="availability"><Clock3 size={14} /><span>Next available: <strong>{mentor.available}</strong></span></div><button className="button button-primary mentor-request" onClick={() => notify(`Mentorship request sent to ${mentor.name}.`)}>Request a session <ArrowRight size={14} /></button></article>;
}

function ProfilifyPage({ notify }) {
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [quizQuestion, setQuizQuestion] = useState(0);
  const [credits, setCredits] = useState(false);
  const [busy, setBusy] = useState(false);
  const quizQuestions = [
    { prompt: "In React, what happens when you update state with a value derived from the previous state?", choices: ["The state updates synchronously in place", "React schedules an update and re-renders the component", "The component is unmounted and recreated"], correct: 1 },
    { prompt: "When several state updates depend on the previous value, which approach avoids stale state?", choices: ["Use a functional state updater", "Mutate the state object directly", "Read the state from a closure"], correct: 0 },
    { prompt: "When can React batch state updates made in an event handler?", choices: ["Only in class components", "Only when using useEffect", "React batches updates so the UI can render efficiently"], correct: 2 },
  ];
  async function createPlan(event) {
    event.preventDefault();
    if (!prompt.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/ai/roadmap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal: prompt }) });
      if (!response.ok) throw new Error("Profilify couldn't create a roadmap right now.");
      setPlan(true);
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }
  function submitQuiz() {
    if (answer === null) {
      notify("Choose an answer before submitting.");
      return;
    }
    if (answer !== quizQuestions[quizQuestion].correct) {
      setAnswer(null);
      notify("Not quite. Review your session notes and try this question again.");
      return;
    }
    if (quizQuestion < quizQuestions.length - 1) {
      setQuizQuestion((current) => current + 1);
      setAnswer(null);
      return;
    }
    setCredits(true);
    setQuizOpen(false);
    notify("Quiz passed! Verified skill credits unlocked.");
  }
  return (
    <>
      <PageHeading eyebrow="YOUR AI LEARNING STUDIO" title={<>Make your next move <span className="title-spark">✳</span></>} subtitle="A thoughtful co-pilot for the skills you're building and the person you're becoming." />
      <section className="ai-intro-card"><div className="ai-orb"><Sparkles size={25} /></div><div><div className="eyebrow">MEET PROFILIFY</div><h2>Clarity for your next chapter.</h2><p>Turn a big, fuzzy goal into small, doable steps. Profilify helps map your growth, spot the skills you're missing, and learn alongside your campus community.</p><div className="ai-trust"><ShieldCheck size={14} /> Your goals are private to you</div></div><span className="ai-version">AI CO-PILOT <i /> ONLINE</span></section>
      <div className="ai-workspace-grid"><section className="roadmap-card card"><div className="module-heading"><span className="module-icon purple-icon"><Compass size={17} /></span><div><h3>Build a learning roadmap</h3><p>Where do you want to go next?</p></div></div><form onSubmit={createPlan} className="goal-form"><label htmlFor="goal-prompt">YOUR GOAL</label><textarea id="goal-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="e.g. I want to become confident building and shipping full-stack apps..." /><div className="prompt-chips">{["Land my first internship", "Learn machine learning", "Launch a side project"].map((item) => <button type="button" key={item} onClick={() => setPrompt(item)}>{item}</button>)}</div><button className="button button-primary" disabled={busy}>{busy ? "Building your roadmap..." : <><Sparkles size={15} /> Generate my roadmap</>}</button></form>
        {plan && <div className="roadmap-result"><div className="roadmap-result-top"><strong>Your roadmap <span className="generated-tag">JUST FOR YOU</span></strong><button onClick={() => notify("Roadmap copied to clipboard.")} aria-label="Copy roadmap"><Copy size={14} /></button></div><RoadmapStep number="01" title="Find your starting point" meta="This week · 2–3 hours" text="Take stock of what you already know and where you'd like more confidence."/><RoadmapStep number="02" title="Learn by building" meta="Weeks 2–3 · 5 hours / week" text="Pick one focused project that makes your goal concrete. A mentor can help you choose."/><RoadmapStep number="03" title="Share what you've learned" meta="Week 4 · 1–2 hours" text="Write a short case study and ask a peer to review your work."/><button className="roadmap-mentor" onClick={() => notify("Finding a mentor who can support this roadmap…")}><span><Avatar initials="AD" tone="lavender" size="avatar-small" /></span><span>Make this roadmap real with a mentor</span><ArrowRight size={14} /></button></div>}
      </section><aside className="ai-side-stack"><section className="skill-gap-card card"><div className="module-heading"><span className="module-icon amber-icon"><Lightbulb size={16} /></span><div><h3>Your skill-gap snapshot</h3><p>Based on your goal to land an internship</p></div></div><div className="gap-item"><div><span>Problem solving</span><strong>Strong foundation</strong></div><div className="gap-bar"><span style={{ width: "76%" }} /></div></div><div className="gap-item"><div><span>System design</span><strong className="gap-focus">Worth exploring</strong></div><div className="gap-bar"><span className="bar-focus" style={{ width: "44%" }} /></div></div><div className="gap-item"><div><span>Technical storytelling</span><strong className="gap-focus">Room to grow</strong></div><div className="gap-bar"><span className="bar-focus" style={{ width: "32%" }} /></div></div><button className="text-action" onClick={() => notify("Personalized skill gap analysis refreshed.")}>Refresh analysis <ArrowRight size={13} /></button></section><section className="quiz-card card"><div className="module-heading"><span className="module-icon green-icon"><FileText size={16} /></span><div><h3>Keep the learning</h3><p>Post-session knowledge check</p></div></div><div className="quiz-session"><Avatar initials="AD" tone="lavender" size="avatar-small" /><span><strong>React state management</strong><small>With Aarav Desai · May 16</small></span><span className="completed-check"><Check size={12} /></span></div>{credits ? <div className="credits-unlocked"><CheckCircle2 size={15} /> Verified skill credits unlocked</div> : <><p className="quiz-copy">A quick 3-question reflection helps your new skills stick — and verifies your session credits.</p><button className="button button-secondary button-full" onClick={() => setQuizOpen(true)}>Take your 2-min quiz <ArrowRight size={14} /></button></>}</section></aside></div>
      {quizOpen && <Modal title="A quick knowledge check" subtitle="Based on your session with Aarav Desai" close={() => setQuizOpen(false)}><div className="quiz-question"><span>QUESTION {quizQuestion + 1} OF {quizQuestions.length}</span><h3>{quizQuestions[quizQuestion].prompt}</h3><div className="quiz-options">{quizQuestions[quizQuestion].choices.map((option, index) => <button key={option} onClick={() => setAnswer(index)} className={answer === index ? "chosen" : ""}><i>{String.fromCharCode(65 + index)}</i>{option}</button>)}</div><div className="quiz-progress"><span style={{ width: `${((quizQuestion + 1) / quizQuestions.length) * 100}%` }} /></div><button className="button button-primary button-full" onClick={submitQuiz}>{quizQuestion === quizQuestions.length - 1 ? "Finish quiz" : "Submit answer"} <ArrowRight size={14} /></button></div></Modal>}
    </>
  );
}

function RoadmapStep({ number, title, meta, text }) {
  return <div className="roadmap-step"><span className="step-number">{number}</span><div><div className="step-title-row"><strong>{title}</strong><span>{meta}</span></div><p>{text}</p></div></div>;
}

function SafetyPage({ notify }) {
  const [rating, setRating] = useState(0);
  const [reflection, setReflection] = useState("");
  const [reflectionSent, setReflectionSent] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  function requestReview() {
    if (!rating) return notify("Choose a star rating to continue.");
    if (rating === 1) setShowReflection(true);
    else {
      notify("Your session-verified review has been submitted.");
      setRating(0);
    }
  }
  async function submitReflection(event) {
    event.preventDefault();
    if (reflection.trim().length < 20) return notify("Please share at least 20 characters so we can understand the context.");
    try {
      const response = await fetch("/api/safety/reflection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reflection }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your reflection couldn't be submitted.");
      setReflectionSent(true);
      notify("Thanks — your reflection has been securely added for review.");
    } catch (error) {
      notify(error.message);
    }
  }
  return (
    <>
      <PageHeading eyebrow="TRUST IS A SHARED PRACTICE" title={<>Good mentorship starts<br />with <span className="title-spark">trust.</span></>} subtitle="Thoughtful guardrails make PeerNexus a safer place to learn, share, and grow." />
      <section className="safety-hero"><div className="safety-shield"><ShieldCheck size={26} /></div><div><span className="eyebrow">THE PEERNEXUS TRUST PROMISE</span><h2>Every review has context.<br /><em>Every contribution counts.</em></h2><p>Ratings only happen after a real, completed session. If something feels off, our review safeguards help us understand the full story before making a decision.</p></div><div className="trust-stat"><strong>100%</strong><span>session-linked<br />reviews</span></div></section>
      <div className="safety-content-grid"><section className="safety-rules card"><div className="section-heading"><div><h2>How we keep things fair</h2><p>Clear, simple safeguards for everyone.</p></div><span className="active-policy"><i /> ACTIVE</span></div><div className="safety-rule"><span className="rule-icon purple-icon"><LockKeyhole size={16} /></span><div><h3>Session-locked reviews</h3><p>Only people who completed a verified SkillSwap session can leave a rating. No random reviews, ever.</p></div><CheckCircle2 size={17} className="rule-check" /></div><div className="safety-rule"><span className="rule-icon amber-icon"><Sparkles size={16} /></span><div><h3>Contextual micro-reflection</h3><p>An unusual 1-star rating starts with a private reflection, not an automatic penalty. We ask for a little context so we can get it right.</p></div><CheckCircle2 size={17} className="rule-check" /></div><div className="safety-rule"><span className="rule-icon green-icon"><ShieldCheck size={16} /></span><div><h3>Human-centered review</h3><p>Low-effort or abusive patterns are flagged for human review. Automated checks support our team — they don't make the final call.</p></div><CheckCircle2 size={17} className="rule-check" /></div><div className="policy-footer"><ShieldCheck size={14} /> Your feedback is private until our team has reviewed it.</div></section>
        <aside className="review-demo card"><div className="demo-label"><span className="demo-pulse" /> INTERACTIVE DEMO</div><h3>Leave session feedback</h3><p>Your rating can only be submitted after a completed SkillSwap session.</p><div className="demo-session"><Avatar initials="AD" tone="lavender" size="avatar-small" /><span><strong>React state management</strong><small>With Aarav Desai · Completed May 16</small></span><CheckCircle2 size={15} /></div><div className="rating-label">HOW WAS YOUR SESSION?</div><div className="star-picker">{[1, 2, 3, 4, 5].map((star) => <button key={star} onClick={() => { setRating(star); setShowReflection(false); setReflectionSent(false); }} aria-label={`${star} star rating`}><Star size={22} fill={rating >= star ? "currentColor" : "none"} className={rating >= star ? "star-selected" : ""} /></button>)}</div>{showReflection ? <form className="reflection-form" onSubmit={submitReflection}><div className="reflection-note"><Sparkles size={14} /> We noticed this is different from your previous feedback. Your rating is safe — could you share a little context?</div><label htmlFor="reflection">WHAT COULD HAVE GONE BETTER?</label><textarea id="reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="A few words about what you hoped to get from the session..." /><button className="button button-primary button-full" disabled={reflectionSent}>{reflectionSent ? <><Check size={15} /> Reflection received</> : "Submit private reflection"}</button></form> : <button className="button button-primary button-full" onClick={requestReview}>Submit session rating <ArrowRight size={14} /></button>}<div className="demo-privacy"><LockKeyhole size={12} /> Only shared with our trust team if needed</div></aside>
      </div>
      <div className="safety-bottom-note"><div className="safety-note-icon"><BriefcaseBusiness size={17} /></div><div><strong>Need a hand with something?</strong><span>Our campus trust team is here to listen, no matter how big or small.</span></div><button className="button button-secondary" onClick={() => notify("Trust team support request started.")}>Contact the trust team <ArrowRight size={14} /></button></div>
    </>
  );
}

function AuthPage({ notify }) {
  const navigate = useNavigate();
  const [portal, setPortal] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const validEmail = academicEmail.test(email);
  async function submit(event) {
    event.preventDefault();
    if (portal !== "recruiter" && !validEmail) {
      setEmailTouched(true);
      return;
    }
    if (portal === "admin" && password.length < 8) return notify("Admin passwords must be at least 8 characters.");
    if (firebaseConfigured && auth) {
      try {
        if (isSignup && portal === "student") await createUserWithEmailAndPassword(auth, email, password);
        else await signInWithEmailAndPassword(auth, email, password);
        navigate("/");
      } catch (error) {
        const authErrors = {
          "auth/email-already-in-use": "An account already exists for this email. Try signing in instead.",
          "auth/invalid-credential": "The email or password is incorrect.",
          "auth/weak-password": "Choose a password with at least 6 characters.",
          "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
        };
        notify(authErrors[error.code] || "Authentication failed. Please check your details and try again.");
      }
      return;
    }
    notify(portal === "admin" ? "Admin authentication requires Firebase configuration and an approved campus account." : "Welcome to the PeerNexus demo workspace.");
  }
  return <div className="auth-page"><div className="auth-left"><Link to="/" className="brand"><span className="brand-mark"><span /><span /><span /><span /></span><span>peer<span className="brand-strong">nexus</span></span><span className="beta-tag">BETA</span></Link><div className="auth-story"><span className="auth-overline"><span /> YOUR CAMPUS, CLOSER</span><h1>Growth is better<br />when it's <em>shared.</em></h1><p>Find your people. Learn from each other. Build a future that feels like yours.</p><div className="auth-people"><div className="auth-avatar-stack"><Avatar initials="RS" tone="lavender" /><Avatar initials="AD" tone="blue" /><Avatar initials="PN" tone="peach" /><Avatar initials="SK" tone="mint" /></div><div><div className="auth-stars">★★★★★</div><span>Growing together at LTCE</span></div></div></div><div className="auth-left-footer">© 2025 PeerNexus <span>·</span> Made for students, by students</div><div className="auth-decoration deco-one" /><div className="auth-decoration deco-two" /></div>
    <div className="auth-right"><div className="auth-top-link">Already part of the community? <Link to="/">Explore the demo <ArrowRight size={13} /></Link></div>            <div className="auth-card"><div className="auth-card-heading"><span className="auth-welcome-tag"><Sparkles size={13} /> A BETTER WAY TO GROW</span><h2>{isSignup ? "Create your account" : "Welcome back"}</h2><p>Choose your portal to continue to PeerNexus.</p></div><div className="portal-tabs"><button className={portal === "student" ? "selected" : ""} onClick={() => { setPortal("student"); setIsSignup(false); }}><GraduationCap size={15} /> Student / Faculty</button><button className={portal === "admin" ? "selected" : ""} onClick={() => { setPortal("admin"); setIsSignup(false); }}><LockKeyhole size={14} /> College Admin</button></div><form className="auth-form" onSubmit={submit}>{portal === "recruiter" ? <div className="recruiter-info"><BriefcaseBusiness size={18} /><span><strong>Recruiter gateway</strong><small>Explore public portfolios and verified student skill ledgers.</small></span></div> : <><label htmlFor="auth-email">INSTITUTIONAL EMAIL</label><div className={`input-wrap ${emailTouched && !validEmail ? "input-error" : ""}`}><span>@</span><input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} onBlur={() => setEmailTouched(true)} placeholder="you@college.edu" autoComplete="email" /></div>{emailTouched && !validEmail && <span className="validation-hint">Use your campus email (e.g. @ltce.in, .ac.in, or .edu).</span>}<label htmlFor="auth-password">PASSWORD</label><div className="input-wrap"><LockKeyhole size={15} /><input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={isSignup ? "new-password" : "current-password"} /></div>{portal === "admin" && <div className="secure-note"><ShieldCheck size={13} /> Admin access requires an approved campus account</div>}</>}{portal === "recruiter" ? <button type="button" className="linkedin-button" onClick={() => notify("LinkedIn OAuth can be enabled by configuring your recruiter client ID.")}><span className="linkedin-mark">in</span> Continue with LinkedIn <ArrowRight size={15} /></button> : <button className="button button-primary auth-submit">{isSignup ? "Create account" : portal === "admin" ? "Sign in securely" : "Continue with email"} <ArrowRight size={15} /></button>}</form>{portal === "student" && <div className="auth-signup">{isSignup ? "Already have an account?" : "New to PeerNexus?"} <button onClick={() => setIsSignup(!isSignup)}>{isSignup ? "Sign in" : "Create an account"}</button></div>}<div className="auth-divider"><span />or<span /></div><button className="recruiter-link" onClick={() => setPortal(portal === "recruiter" ? "student" : "recruiter")}><BriefcaseBusiness size={15} /> {portal === "recruiter" ? "Back to student portal" : "I'm a recruiter"} <ArrowRight size={14} /></button><div className="auth-legal">By continuing, you agree to PeerNexus <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</div></div><div className="auth-status"><span className="status-dot" /> {firebaseConfigured ? "Secure campus authentication" : "Demo mode · Firebase not configured"} <span>·</span><a href="mailto:support@peernexus.app">Need help?</a></div></div>
  </div>;
}

function RecruiterPage({ notify }) {
  return <div className="recruiter-page"><div className="recruiter-top"><Link to="/" className="brand"><span className="brand-mark"><span /><span /><span /><span /></span><span>peer<span className="brand-strong">nexus</span></span><span className="beta-tag">BETA</span></Link><Link to="/login"><ArrowLeft size={14} /> Back to sign in</Link></div><div className="recruiter-content"><span className="auth-welcome-tag"><BriefcaseBusiness size={13} /> PEERNEXUS FOR TEAMS</span><h1>Meet the people<br />behind the <em>potential.</em></h1><p>A more human way to discover early-career talent. Explore proof-of-work, verified skills, and the peer mentorship that helped build them.</p><div className="recruiter-benefits"><span><ShieldCheck size={16} /> Verified skills, not just claims</span><span><FileText size={16} /> Real proof-of-work portfolios</span><span><Users size={16} /> See collaboration in context</span></div><div className="linkedin-signin"><div><span className="linkedin-mark">in</span><span><strong>Recruiter gateway</strong><small>Secure access through LinkedIn</small></span></div><button onClick={() => notify("LinkedIn OAuth integration is ready for your client credentials.")}>Continue with LinkedIn <ArrowRight size={15} /></button></div><div className="recruiter-preview"><div className="preview-head"><span>STUDENT PORTFOLIO PREVIEW</span><span className="verified-tag"><CheckCircle2 size={12} /> VERIFIED</span></div><div className="preview-person"><Avatar initials="SK" tone="blue" size="avatar-large" /><div><h3>Samira Khan <CheckCircle2 size={14} /></h3><p>Computer Engineering · LTCE '26</p></div><span className="open-profile"><Link2 size={14} /> PUBLIC</span></div><div className="preview-skills"><span>React</span><span>Product thinking</span><span>Peer mentor × 12</span><span>+5 verified skills</span></div><div className="proof-row"><div><span>PROOF OF WORK</span><strong>Campus Connect · Full-stack project</strong></div><div><span>PEER CRED SCORE</span><strong>4.9 <span className="auth-stars">★★★★★</span></strong></div></div></div><p className="recruiter-disclaimer">Student portfolios are shared publicly by choice. <a href="mailto:partnerships@peernexus.app">Talk to our team</a></p></div></div>;
}

function PublicProfile() {
  return <div className="public-profile-page"><div className="public-profile-top"><Link to="/" className="brand"><span className="brand-mark"><span /><span /><span /><span /></span><span>peer<span className="brand-strong">nexus</span></span></Link><span className="public-badge"><Link2 size={13} /> Public portfolio</span></div><div className="public-profile-content"><div className="public-profile-card card"><div className="public-cover" /><div className="public-profile-details"><Avatar initials="SK" tone="blue" size="avatar-profile" /><div className="public-profile-title"><span className="verified-tag"><CheckCircle2 size={12} /> VERIFIED STUDENT</span><h1>Samira Khan</h1><p>Computer Engineering · Lakeside Technical Campus · Class of 2026</p><span className="public-handle">@samira-khan</span></div><button className="button button-secondary" onClick={() => navigator.clipboard?.writeText(window.location.href)}><Copy size={14} /> Copy profile link</button></div><div className="public-metrics"><div><strong>12</strong><span>Mentorship sessions</span></div><div><strong>4.9 <span className="gold-star">★</span></strong><span>PeerNexus Cred Score</span></div><div><strong>8</strong><span>Verified skills</span></div><div><strong>6</strong><span>Proof-of-work projects</span></div></div></div><section className="public-section"><div className="public-section-title"><div><span className="eyebrow">BUILT, LEARNED, SHARED</span><h2>Proof of work</h2></div><span className="verified-tag"><ShieldCheck size={12} /> PEER-VERIFIED</span></div><div className="project-grid"><article className="project-card card"><span className="project-icon"><Laptop size={18} /></span><span className="project-date">APR 2025</span><h3>Campus Connect</h3><p>A full-stack student collaboration platform built to help clubs organize events and find teammates.</p><div className="project-tags"><span>React</span><span>Node.js</span><span>Firebase</span></div><div className="project-proof"><CheckCircle2 size={13} /> Verified by 3 peers</div></article><article className="project-card card"><span className="project-icon peach-project"><Zap size={18} /></span><span className="project-date">FEB 2025</span><h3>StudyFlow</h3><p>A shared focus timer and accountability space designed for student study groups.</p><div className="project-tags"><span>UI/UX</span><span>Figma</span><span>Community</span></div><div className="project-proof"><CheckCircle2 size={13} /> Verified by 2 peers</div></article></div></section><section className="public-section public-reviews"><div className="public-section-title"><div><span className="eyebrow">COMMUNITY VOICES</span><h2>Peer reviews</h2></div><span className="review-score">4.9 <span>★★★★★</span> <small>from 12 sessions</small></span></div><div className="review-quote card"><div className="quote-stars">★★★★★</div><p>“Samira explained component state in a way that finally clicked. She made space for all my questions and shared a great set of practice exercises.”</p><div className="review-author"><Avatar initials="AM" tone="peach" size="avatar-small" /><span><strong>Arjun M.</strong><small>React mentoring session · May 2025</small></span><span className="verified-tag"><CheckCircle2 size={11} /> SESSION VERIFIED</span></div></div></section></div><div className="public-profile-footer"><span>Verified with PeerNexus <ShieldCheck size={14} /></span><Link to="/recruiter">Recruiter gateway <ArrowRight size={13} /></Link></div></div>;
}

function Modal({ title, subtitle, close, children }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={close} aria-label="Close dialog"><X size={17} /></button></div>{children}</section></div>;
}

export default App;
