import { useEffect, useMemo, useState } from "react";
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

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(key)) ?? initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Unable to save ${key}:`, error);
    }
  }, [key, value]);
  return [value, setValue];
}

function App() {
  const [dark, setDark] = useStoredState("peernexus.theme", false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [posts, setPosts] = useStoredState("peernexus.posts", initialPosts);
  const [votes, setVotes] = useStoredState("peernexus.votes", {});
  const [feedFilter, setFeedFilter] = useStoredState("peernexus.feedFilter", "For you");
  const [bookmarks, setBookmarks] = useStoredState("peernexus.bookmarks", []);
  const [connections, setConnections] = useStoredState("peernexus.connections", []);
  const [mentorRequests, setMentorRequests] = useStoredState("peernexus.requests", []);
  const [notifications, setNotifications] = useStoredState("peernexus.notifications", []);
  const [communities, setCommunities] = useStoredState("peernexus.communities", ["Computer Engineering", "Design Club", "HackNexus 2025"]);
  const [session, setSession] = useStoredState("peernexus.demoSession", null);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState("");
  const [systemStatus, setSystemStatus] = useState("checking");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    async function checkApi() {
      try {
        const response = await fetch("/api/health");
        if (!response.ok) throw new Error("API health check failed.");
        if (active) setSystemStatus("online");
      } catch {
        if (active) setSystemStatus("offline");
      }
    }
    checkApi();
    const interval = window.setInterval(checkApi, 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setDialog({ type: "search" });
      }
      if (event.key === "Escape") {
        setDialog(null);
        setAccountOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function addNotification(message) {
    setNotifications((items) => [{ id: Date.now(), message }, ...items].slice(0, 15));
  }

  function requestMentorship(mentor, topic) {
    if (mentorRequests.some((request) => request.mentorId === mentor.id && request.status === "pending")) {
      notify(`You already have a pending request for ${mentor.name}.`);
      return;
    }
    setMentorRequests((items) => [{ id: Date.now(), mentorId: mentor.id, mentorName: mentor.name, topic, status: "pending" }, ...items]);
    addNotification(`Your mentorship request was sent to ${mentor.name}.`);
    notify(`Mentorship request sent to ${mentor.name}.`);
  }

  function toggleBookmark(postId) {
    const saved = bookmarks.includes(postId);
    setBookmarks((items) => saved ? items.filter((id) => id !== postId) : [...items, postId]);
    notify(saved ? "Removed from your bookmarks." : "Saved to your bookmarks.");
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
          <Route path="/login" element={<AuthPage notify={notify} setSession={setSession} />} />
          <Route path="/recruiter" element={<RecruiterPage notify={notify} />} />
          <Route path="/profile/:username" element={<PublicProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <div className="app-layout">
          <Sidebar mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} communities={communities} openDialog={setDialog} onSelectCommunity={(name) => {
            setFeedFilter(name === "Computer Engineering" ? "Department Groups" : name === "Design Club" ? "College Clubs" : "Hackathons");
            navigate("/");
          }} />
          {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
          <div className="main-column">
            <header className="topbar">
              <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
              <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{pageTitle(location.pathname)}</strong></div>
              <div className="topbar-actions">
                <button className="search-trigger" onClick={() => setDialog({ type: "search" })}><Search size={15} /><span>Search anything...</span><kbd><Command size={11} /> K</kbd></button>
                <button className="icon-button theme-button" onClick={() => setDark(!dark)} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
                <div className="notification-wrap">
                  <button className="icon-button notification-button" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications"><Bell size={17} />{notifications.length > 0 && <i />}</button>
                  {notificationsOpen && <div className="notification-popover"><div className="notification-heading"><strong>Notifications</strong>{notifications.length > 0 && <button onClick={() => setNotifications([])}>Clear</button>}</div>{notifications.length ? notifications.map((item) => <p key={item.id}>{item.message}</p>) : <p>You're all caught up.</p>}</div>}
                </div>
                <div className="account-menu-wrap"><button className="account-chip" onClick={() => setAccountOpen(!accountOpen)}><Avatar initials={session?.initials || "SK"} tone="blue" /><span>{session?.name || "Samira Khan"}</span><ChevronDown size={14} /></button>{accountOpen && <div className="account-popover"><strong>{session?.name || "Samira Khan"}</strong><small>{session?.email || "Computer Engineering · '26"}</small><button onClick={() => { setAccountOpen(false); navigate("/profile/samira-khan"); }}><Users size={14} /> View public profile</button><button onClick={() => { setAccountOpen(false); navigate("/login"); }}><Settings2 size={14} /> Account settings</button>{session && <button onClick={() => { setSession(null); setAccountOpen(false); navigate("/login"); notify("Signed out."); }}><LogOut size={14} /> Sign out</button>}</div>}</div>
              </div>
            </header>
            <main className="page-content">
              <Routes>
                <Route path="/" element={<FeedPage posts={posts} setPosts={setPosts} votes={votes} vote={vote} filter={feedFilter} setFilter={setFeedFilter} bookmarks={bookmarks} toggleBookmark={toggleBookmark} notify={notify} openDialog={setDialog} />} />
                <Route path="/skillswap" element={<SkillSwapPage notify={notify} openDialog={setDialog} requestMentorship={requestMentorship} mentorRequests={mentorRequests} connections={connections} setConnections={setConnections} addNotification={addNotification} />} />
                <Route path="/profilify" element={<ProfilifyPage notify={notify} />} />
                <Route path="/safety" element={<SafetyPage notify={notify} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <footer className="app-footer"><span>PeerNexus <span className="footer-dot">·</span> Built for campus, powered by community</span><span><span className={`status-dot ${systemStatus}`} /> {systemStatus === "online" ? "API connected" : systemStatus === "offline" ? "API offline · restart with npm run dev" : "Checking API…"}</span></footer>
          </div>
        </div>
      )}
      {dialog && <AppDialog dialog={dialog} close={() => setDialog(null)} navigate={navigate} notify={notify} setCommunities={setCommunities} />}
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

function Sidebar({ mobileOpen, closeMobile, communities, openDialog, onSelectCommunity }) {
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
      <div className="sidebar-label communities-label">YOUR COMMUNITIES <button aria-label="Add community" onClick={() => openDialog({ type: "community" })}><Plus size={14} /></button></div>
      <div className="community-links">{communities.map((community, index) => <button key={community} onClick={() => { onSelectCommunity(community); closeMobile(); }}><span className={`community-hash ${["indigo", "amber", "green"][index % 3]}`}><Hash size={13} /></span>{community}</button>)}</div>
      <div className="sidebar-spacer" />
      <div className="mentor-nudge"><span className="nudge-icon"><Sparkles size={16} /></span><strong>Grow together</strong><p>One good conversation can change your trajectory.</p><Link to="/skillswap">Find a mentor <ArrowRight size={13} /></Link></div>
      <div className="sidebar-bottom"><button className="help-link" onClick={() => openDialog({ type: "help" })}><CircleHelp size={16} /> Help & feedback</button><div className="profile-mini"><Avatar initials="SK" tone="blue" /><span><strong>Samira Khan</strong><small>Computer Engineering · '26</small></span><button aria-label="Profile settings" onClick={() => openDialog({ type: "profile" })}><MoreHorizontal size={18} /></button></div></div>
    </aside>
  );
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function FeedPage({ posts, setPosts, votes, vote, filter, setFilter, bookmarks, toggleBookmark, notify, openDialog }) {
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
          <div className="section-heading"><div><h2>Community pulse</h2><p>Ideas, questions, and opportunities from your campus.</p></div><button className="filter-button" onClick={() => openDialog({ type: "feed-filter", filter, setFilter })}><Settings2 size={15} /> Filters</button></div>
          <div className="feed-tabs">{categories.map((category) => <button key={category} onClick={() => setFilter(category)} className={filter === category ? "selected" : ""}>{category}</button>)}</div>
          {postComposer && <div className="composer card"><div className="composer-head"><Avatar initials="SK" tone="blue" /><strong>Start a conversation</strong><button className="icon-button" onClick={() => setPostComposer(false)} aria-label="Close composer"><X size={16} /></button></div><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Share an idea, ask a question, or find your people..." /><div className="composer-actions"><select aria-label="Post category" value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)}><option>Hackathons</option><option>Research Teams</option><option>College Clubs</option><option>Department Groups</option></select><button className="button button-primary button-small" onClick={publish}><Send size={14} /> Publish</button></div></div>}
          <div className="post-list">{shownPosts.length ? shownPosts.map((post) => <article className="post-card card" key={post.id}>
            <div className="vote-rail"><button onClick={() => vote(post.id, 1)} className={votes[post.id] === 1 ? "voted-up" : ""} aria-label="Upvote"><ArrowUp size={16} /></button><strong>{post.upvotes}</strong><button onClick={() => vote(post.id, -1)} className={votes[post.id] === -1 ? "voted-down" : ""} aria-label="Downvote"><ArrowDown size={16} /></button></div>
            <div className="post-body"><div className="post-meta"><span className={`category-pill category-${post.category.replaceAll(" ", "-").toLowerCase()}`}>{post.category}</span><span>{post.time}</span><button aria-label={`More actions for ${post.title}`} onClick={() => openDialog({ type: "post-actions", post, setPosts })}><MoreHorizontal size={17} /></button></div><h3>{post.title}</h3><p>{post.body}</p><div className="post-tags">{post.tags.map((tag) => <span key={tag}>#{tag.replaceAll(" ", "")}</span>)}</div><div className="post-footer"><div className="post-author"><Avatar initials={post.initials} tone={post.tone} size="avatar-small" /><span><strong>{post.author}</strong><small>{post.department}</small></span></div><div className="post-actions"><button onClick={() => setOpenComments(openComments === post.id ? null : post.id)}><MessageCircle size={15} /> {post.comments} replies</button><button onClick={() => toggleBookmark(post.id)} aria-label={bookmarks.includes(post.id) ? "Remove saved post" : "Save post"}><Bookmark size={15} fill={bookmarks.includes(post.id) ? "currentColor" : "none"} /></button></div></div>
              {openComments === post.id && <div className="comment-thread">{replies[post.id]?.map((reply, index) => <div className="comment-item" key={`${post.id}-${index}`}><Avatar initials="SK" tone="blue" size="avatar-small" /><p><strong>Samira Khan</strong> {reply}</p></div>)}{!replies[post.id]?.length && <div className="comment-item"><Avatar initials="PN" tone="peach" size="avatar-small" /><p><strong>Priya Nair</strong> This sounds great! I can connect you with someone from Design Club.</p></div>}<div className="comment-input"><input value={replyDraft} onChange={(event) => setReplyDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") publishReply(post.id); }} placeholder="Write a thoughtful reply..." /><button aria-label="Send reply" onClick={() => publishReply(post.id)}><Send size={15} /></button></div></div>}
            </div>
          </article>) : <div className="empty-state card"><Compass size={24} /><strong>Nothing here just yet</strong><span>Be the first to start a conversation in {filter}.</span><button className="button button-primary button-small" onClick={() => setPostComposer(true)}>Create a post</button></div>}</div>
          <button className="load-more" onClick={() => notify("You're all caught up.")}>You're all caught up <Check size={14} /></button>
        </section>
        <aside className="right-rail">
          <section className="rail-card card"><div className="rail-title"><h3>Your week</h3><button aria-label="View calendar" onClick={() => openDialog({ type: "calendar" })}><CalendarDays size={15} /></button></div><div className="week-row"><span className="week-date">MON <strong>19</strong></span><span className="week-event"><i className="event-dot purple" /><span><strong>React study circle</strong><small>4:30 PM · Library 2B</small></span></span></div><div className="week-row"><span className="week-date">WED <strong>21</strong></span><span className="week-event"><i className="event-dot orange" /><span><strong>Mentorship with Aarav</strong><small>6:30 PM · Online</small></span></span></div><div className="week-row"><span className="week-date">FRI <strong>23</strong></span><span className="week-event"><i className="event-dot green-dot" /><span><strong>Design Club review night</strong><small>5:00 PM · Innovation Lab</small></span></span></div><button className="rail-link rail-link-button" onClick={() => openDialog({ type: "calendar" })}>View your schedule <ArrowRight size={13} /></button></section>
          <section className="rail-card card people-card"><div className="rail-title"><div><h3>People to know</h3><p>Based on your interests</p></div><button aria-label="See all mentors" onClick={() => openDialog({ type: "people" })}><ArrowRight size={15} /></button></div>{mentors.slice(0, 2).map((mentor) => <div className="person-row" key={mentor.id}><Avatar initials={mentor.initials} tone={mentor.tone} /><span className="person-info"><strong>{mentor.name} <CheckCircle2 size={12} /></strong><small>{mentor.skills[0]} · {mentor.rating} ★</small></span><button onClick={() => openDialog({ type: "connect", mentor })} aria-label={`Connect with ${mentor.name}`}><Plus size={16} /></button></div>)}<Link to="/skillswap" className="rail-link">Explore SkillSwap <ArrowRight size={13} /></Link></section>
          <section className="mini-profile-card"><div className="mini-profile-top"><span className="mini-profile-label">YOUR PROFILE</span><Link to="/profile/samira-khan" aria-label="View public profile"><ArrowUp size={14} /></Link></div><div className="mini-profile-person"><Avatar initials="SK" tone="blue" /><div><strong>Samira Khan <CheckCircle2 size={13} /></strong><span>Computer Engineering · '26</span></div></div><div className="mini-stats"><div><strong>12</strong><span>Sessions</span></div><div><strong>4.9<span className="star">★</span></strong><span>Cred score</span></div><div><strong>8</strong><span>Skills</span></div></div><Link to="/profile/samira-khan" className="profile-link">View public profile <ArrowRight size={13} /></Link></section>
          <div className="rail-footer"><Link to="/safety">Community guidelines</Link><span>·</span><a href="mailto:hello@peernexus.app">Get support</a><span>·</span><span>v1.4.2</span></div>
        </aside>
      </div>
    </>
  );
}

function SkillSwapPage({ notify, openDialog, requestMentorship, mentorRequests, connections, setConnections, addNotification }) {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [rankedIds, setRankedIds] = useState(null);
  const [sortBy, setSortBy] = useState("match");
  const results = useMemo(() => {
    if (!submitted) return mentors;
    const terms = submitted.toLowerCase().split(/\W+/).filter((word) => word.length > 3);
    const ranked = [...mentors].map((mentor) => ({ ...mentor, match: Math.min(99, mentor.match + terms.filter((term) => mentor.skills.join(" ").toLowerCase().includes(term)).length * 2) }));
    if (rankedIds && sortBy === "match") return ranked.sort((a, b) => rankedIds.indexOf(a.id) - rankedIds.indexOf(b.id));
    return ranked.sort((a, b) => sortBy === "rating" ? b.rating - a.rating : b.match - a.match);
  }, [submitted, rankedIds, sortBy]);
  async function searchMentors(event, searchQuery = query) {
    event?.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSubmitted(searchQuery);
    setRankedIds(null);
    try {
      const response = await fetch("/api/mentors/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: searchQuery }) });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Mentor search is temporarily unavailable.");
      }
      const result = await response.json();
      setRankedIds(result.rankedMentorIds);
    } catch (error) {
      notify(error instanceof TypeError ? "Mentor search is offline. Start both services with npm run dev." : error.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const search = new URLSearchParams(location.search).get("q");
    if (search) {
      setQuery(search);
      searchMentors(null, search);
    }
  }, [location.search]);
  return (
    <>
      <PageHeading eyebrow="SKILLSWAP DIRECTORY" title="Find your next mentor" subtitle="Good things happen when knowledge moves both ways." action={<button className="button button-secondary" onClick={() => openDialog({ type: "mentor-profile" })}><Settings2 size={15} /> Edit my profile</button>} />
      <section className="skill-hero"><div className="skill-hero-content"><span className="banner-overline"><Sparkles size={13} /> PROFILIFY MATCH</span><h2>What would you like<br />to <em>learn today?</em></h2><p>Tell us what you're working on. We'll find the right person to help you get unstuck.</p><form className="mentor-search" onSubmit={searchMentors}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Debugging a React state bug..." /><button disabled={loading} aria-label="Search mentors"><ArrowRight size={16} /></button></form><div className="search-suggestions"><span>Try:</span>{["React state bugs", "ML pipeline setup", "Portfolio feedback"].map((suggestion) => <button key={suggestion} onClick={() => setQuery(suggestion)}>{suggestion}</button>)}</div></div><div className="skill-hero-art"><div className="match-ring"><span>AI</span><small>powered<br />matching</small></div><div className="match-orbit"><div className="match-avatar m1">AD</div><div className="match-avatar m2">PN</div><div className="match-avatar m3">KS</div><div className="match-spark">✦</div></div></div></section>
      <div className="profile-summary-grid"><div className="summary-card card"><div className="summary-label">YOUR CRED SCORE <CircleHelp size={13} /></div><div className="cred-score">4.9<span>/5</span><div className="cred-stars">★★★★★</div></div><small>Top 8% on your campus</small></div><div className="summary-card card"><div className="summary-label">MENTORSHIP SESSIONS</div><div className="summary-metric">12 <span>sessions</span></div><small>+3 this month <span className="positive">↗ 33%</span></small></div><div className="summary-card card"><div className="summary-label">VERIFIED SKILLS</div><div className="summary-metric">8 <span>skills</span></div><small><span className="skill-chip">React</span> <span className="skill-chip">Figma</span> +6</small></div><div className="summary-card streak-card"><div className="summary-label">LEARNING STREAK</div><div className="summary-metric">6 <span>days <Flame size={18} /></span></div><small>One more day to beat your best!</small></div></div>
      <div className="directory-heading"><div><h2>{submitted ? "Your mentor matches" : "Mentors you might love"}</h2><p>{submitted ? `Recommended for “${submitted}”` : "Verified people who are generous with what they know."}</p></div><label className="sort-control">Sort<select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort mentors"><option value="match">Best match</option><option value="rating">Highest rated</option></select><ChevronDown size={14} /></label></div>
      {mentorRequests.length > 0 && <section className="requests-panel card"><div className="requests-panel-heading"><strong>Your mentorship requests</strong><span>{mentorRequests.length} sent</span></div>{mentorRequests.slice(0, 3).map((request) => <div className="request-row" key={request.id}><span><strong>{request.mentorName}</strong><small>{request.topic || "General mentorship"} · {request.status}</small></span><span className={`request-status ${request.status}`}>{request.status}</span></div>)}</section>}
      <div className="mentor-grid">{results.map((mentor) => <MentorCard key={mentor.id} mentor={mentor} notify={notify} openDialog={openDialog} requestMentorship={requestMentorship} connected={connections.includes(mentor.id)} connect={() => {
        if (connections.includes(mentor.id)) return notify(`You are already connected with ${mentor.name}.`);
        setConnections((items) => [...items, mentor.id]);
        addNotification(`${mentor.name} was added to your network.`);
        notify(`Connection request sent to ${mentor.name}.`);
      }} />)}</div>
      <div className="cred-note"><ShieldCheck size={16} /><span><strong>Every mentor is verified.</strong> Sessions, reviews, and earned skills are tied to real campus identities.</span><Link to="/safety">How trust works <ArrowRight size={13} /></Link></div>
    </>
  );
}

function MentorCard({ mentor, openDialog, requestMentorship, connected, connect }) {
  return <article className="mentor-card card"><div className="mentor-card-top"><Avatar initials={mentor.initials} tone={mentor.tone} size="avatar-large" /><span className="match-badge"><Sparkles size={11} /> {mentor.match}% match</span><button className="icon-button mentor-more" aria-label={`More about ${mentor.name}`} onClick={() => openDialog({ type: "mentor-details", mentor, connect })}><MoreHorizontal size={17} /></button></div><h3>{mentor.name} <CheckCircle2 size={14} /></h3><p className="mentor-title">{mentor.title}</p><div className="mentor-rating"><Star size={13} fill="currentColor" /> <strong>{mentor.rating}</strong><span>({mentor.sessions} sessions)</span><i /> <span><ShieldCheck size={12} /> Verified</span></div><div className="mentor-skills">{mentor.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><div className="availability"><Clock3 size={14} /><span>Next available: <strong>{mentor.available}</strong></span></div><button className="button button-primary mentor-request" onClick={() => openDialog({ type: "mentorship-request", mentor, submit: (topic) => requestMentorship(mentor, topic) })}>{connected ? "Connected · Request session" : "Request a session"} <ArrowRight size={14} /></button></article>;
}

function ProfilifyPage({ notify }) {
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState(null);
  const [transcript, setTranscript] = useStoredState("peernexus.session.transcript", "Mentee: I can update a simple React counter, but I get confused when a state update depends on the previous value.\nMentor: Use the functional updater form, like setCount(current => current + 1), so React gives you the latest state value.\nMentee: I tried it in the task tracker and the counter now works when I click quickly. I still need to test what happens after a component re-renders.");
  const [activityNotes, setActivityNotes] = useStoredState("peernexus.session.activities", "Implemented a React counter with the functional state updater\nTested repeated clicks and recorded one re-render edge case");
  const [sessionAnalysis, setSessionAnalysis] = useStoredState("peernexus.session.analysis", null);
  const [aiProvider, setAiProvider] = useState("Checking AI…");
  const [quizOpen, setQuizOpen] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [quizQuestion, setQuizQuestion] = useState(0);
  const [credits, setCredits] = useStoredState("peernexus.session.credits", false);
  const [busy, setBusy] = useState(false);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const quizQuestions = sessionAnalysis?.quiz || [];
  useEffect(() => {
    fetch("/api/health").then((response) => {
      if (!response.ok) throw new Error("AI service is offline");
      return response.json();
    }).then((health) => setAiProvider(health.aiProvider === "gemini" ? `Gemini · ${health.model}` : "Local contextual AI")).catch(() => setAiProvider("AI service offline"));
  }, []);

  async function createPlan(event) {
    event.preventDefault();
    if (!prompt.trim()) return;
    setBusy(true);
    try {
      const activities = activityNotes.split(/\r?\n/).map((note) => note.trim()).filter(Boolean);
      const response = await fetch("/api/ai/roadmap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal: prompt, activities }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Profilify couldn't create a roadmap right now.");
      setPlan(result);
      setAiProvider(result.provider === "gemini" ? `Gemini · ${result.model}` : "Local contextual AI");
      if (result.notice) notify(result.notice);
    } catch (error) {
      notify(error instanceof TypeError ? "The PeerNexus API isn't running. Start the app with npm run dev." : error.message);
    } finally {
      setBusy(false);
    }
  }

  async function analyzeSession(event) {
    event.preventDefault();
    const activities = activityNotes.split(/\r?\n/).map((note) => note.trim()).filter(Boolean);
    if (!transcript.trim() && activities.length === 0) {
      notify("Add a conversation or activity before asking Profilify to analyze this session.");
      return;
    }
    setAnalysisBusy(true);
    try {
      const response = await fetch("/api/ai/session-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, activities }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Session analysis failed.");
      setSessionAnalysis(result);
      setQuizQuestion(0);
      setAnswer(null);
      setCredits(false);
      setAiProvider(result.provider === "gemini" ? `Gemini · ${result.model}` : result.provider === "local-contextual-fallback" ? "Local contextual AI · Gemini fallback" : "Local contextual AI");
      if (result.notice) notify(result.notice);
    } catch (error) {
      notify(error instanceof TypeError ? "The PeerNexus API isn't running. Start the app with npm run dev." : error.message);
    } finally {
      setAnalysisBusy(false);
    }
  }

  function submitQuiz() {
    if (answer === null) {
      notify("Choose an answer before submitting.");
      return;
    }
    if (answer !== quizQuestions[quizQuestion].answer) {
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
      <section className="ai-intro-card"><div className="ai-orb"><Sparkles size={25} /></div><div><div className="eyebrow">MEET PROFILIFY</div><h2>Clarity for your next chapter.</h2><p>Turn a big, fuzzy goal into small, doable steps. Profilify helps map your growth, spot the skills you're missing, and learn alongside your campus community.</p><div className="ai-trust"><ShieldCheck size={14} /> Your goals stay in this workspace · Analysis uses your session notes</div></div><span className={`ai-version ${aiProvider === "AI service offline" ? "ai-version-offline" : ""}`}><i /> {aiProvider}</span></section>
      <div className="ai-workspace-grid"><section className="roadmap-card card"><div className="module-heading"><span className="module-icon purple-icon"><Compass size={17} /></span><div><h3>Build a learning roadmap</h3><p>Where do you want to go next?</p></div></div><form onSubmit={createPlan} className="goal-form"><label htmlFor="goal-prompt">YOUR GOAL</label><textarea id="goal-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="e.g. I want to become confident building and shipping full-stack apps..." /><div className="prompt-chips">{["Land my first internship", "Learn machine learning", "Launch a side project"].map((item) => <button type="button" key={item} onClick={() => setPrompt(item)}>{item}</button>)}</div><button className="button button-primary" disabled={busy}>{busy ? "Building your roadmap..." : <><Sparkles size={15} /> Generate my roadmap</>}</button></form>
        {plan && <div className="roadmap-result"><div className="roadmap-result-top"><strong>{plan.title}<span className="generated-tag">{plan.provider === "gemini" ? "GEMINI" : "PERSONALIZED"}</span></strong><button onClick={async () => { try { await navigator.clipboard.writeText(`${plan.title}\n${plan.summary}\n${plan.roadmap.map((step) => `${step.title} (${step.timeframe}): ${step.detail}`).join("\n")}`); notify("Roadmap copied to clipboard."); } catch { notify("Clipboard access is unavailable in this browser."); } }} aria-label="Copy roadmap"><Copy size={14} /></button></div><p className="ai-result-summary">{plan.summary}</p>{plan.roadmap.map((step, index) => <RoadmapStep key={`${step.title}-${index}`} number={String(index + 1).padStart(2, "0")} title={step.title} meta={step.timeframe} text={step.detail} />)}<Link className="roadmap-mentor" to="/skillswap"><span><Avatar initials="AD" tone="lavender" size="avatar-small" /></span><span>Find a mentor who can help with this roadmap</span><ArrowRight size={14} /></Link></div>}
        <form className="session-analysis-form" onSubmit={analyzeSession}><div className="module-heading"><span className="module-icon green-icon"><MessageCircle size={16} /></span><div><h3>Analyze a mentorship session</h3><p>Profilify reads the actual conversation and mentee activity you provide.</p></div></div><label htmlFor="session-transcript">CONVERSATION TRANSCRIPT</label><textarea id="session-transcript" value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Paste the mentor and mentee conversation here..." /><label htmlFor="activity-notes">MENTEE ACTIVITIES · ONE PER LINE</label><textarea id="activity-notes" className="activity-textarea" value={activityNotes} onChange={(event) => setActivityNotes(event.target.value)} placeholder="What did they build, practice, or get stuck on?" /><button className="button button-primary" disabled={analysisBusy}>{analysisBusy ? "Reading conversation and activities..." : <><Sparkles size={15} /> Analyze session & build a quiz</>}</button></form>
        {sessionAnalysis && <div className="roadmap-result session-analysis-result"><div className="roadmap-result-top"><strong>{sessionAnalysis.title}<span className="generated-tag">{sessionAnalysis.provider === "gemini" ? "GEMINI ANALYSIS" : "CONTEXTUAL ANALYSIS"}</span></strong></div><p className="ai-result-summary">{sessionAnalysis.summary}</p>{sessionAnalysis.strengths?.map((strength, index) => <p className="analysis-evidence" key={index}><CheckCircle2 size={13} /> {strength}</p>)}<button className="button button-secondary button-small" onClick={() => { setQuizQuestion(0); setAnswer(null); setQuizOpen(true); }}>Take your session-specific quiz <ArrowRight size={13} /></button></div>}
      </section><aside className="ai-side-stack"><section className="skill-gap-card card"><div className="module-heading"><span className="module-icon amber-icon"><Lightbulb size={16} /></span><div><h3>Your skill-gap snapshot</h3><p>{plan ? `Personalized around: ${plan.goal}` : "Generate a roadmap to explore a goal"}</p></div></div>{plan ? plan.roadmap.slice(0, 3).map((step, index) => <div className="gap-item" key={step.title}><div><span>{step.title}</span><strong className={index === 0 ? "" : "gap-focus"}>{index === 0 ? "Start here" : "Next focus"}</strong></div><div className="gap-bar"><span className={index === 0 ? "" : "bar-focus"} style={{ width: `${82 - index * 19}%` }} /></div></div>) : <p className="skill-gap-empty">Your skill gaps will be based on the goal and activities you enter, not a fixed sample.</p>}</section><section className="quiz-card card"><div className="module-heading"><span className="module-icon green-icon"><FileText size={16} /></span><div><h3>Keep the learning</h3><p>Quiz generated from your session notes</p></div></div>{sessionAnalysis ? <><div className="quiz-session"><Avatar initials="AD" tone="lavender" size="avatar-small" /><span><strong>{sessionAnalysis.title}</strong><small>{quizQuestions.length} questions · {sessionAnalysis.provider === "gemini" ? "Gemini AI" : "Contextual AI"}</small></span><span className="completed-check"><Check size={12} /></span></div>{credits ? <div className="credits-unlocked"><CheckCircle2 size={15} /> Verified skill credits unlocked</div> : <button className="button button-secondary button-full" onClick={() => { setQuizQuestion(0); setAnswer(null); setQuizOpen(true); }}>Take your session quiz <ArrowRight size={14} /></button>}</> : <><p className="quiz-copy">Run a session analysis first. Profilify will use that specific conversation to write three knowledge-check questions.</p><button className="button button-secondary button-full" onClick={() => document.getElementById("session-transcript")?.focus()}>Add a conversation <ArrowRight size={14} /></button></>}</section></aside></div>
      {quizOpen && quizQuestions[quizQuestion] && <Modal title="Your mentorship knowledge check" subtitle={`${sessionAnalysis?.title || "Based on your session"} · Question ${quizQuestion + 1} of ${quizQuestions.length}`} close={() => setQuizOpen(false)}><div className="quiz-question"><span>SESSION-SPECIFIC QUESTION {quizQuestion + 1} OF {quizQuestions.length}</span><h3>{quizQuestions[quizQuestion].question}</h3><div className="quiz-options">{quizQuestions[quizQuestion].options.map((option, index) => <button key={option} onClick={() => setAnswer(index)} className={answer === index ? "chosen" : ""}><i>{String.fromCharCode(65 + index)}</i>{option}</button>)}</div><div className="quiz-progress"><span style={{ width: `${((quizQuestion + 1) / quizQuestions.length) * 100}%` }} /></div><button className="button button-primary button-full" onClick={submitQuiz}>{quizQuestion === quizQuestions.length - 1 ? "Finish quiz" : "Submit answer"} <ArrowRight size={14} /></button></div></Modal>}
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
  const [reviews, setReviews] = useStoredState("peernexus.reviews", []);
  function saveReview(context = "") {
    setReviews((items) => [{ id: Date.now(), session: "React state management", mentor: "Aarav Desai", rating, context, createdAt: new Date().toISOString() }, ...items]);
    setRating(0);
    setReflection("");
    setShowReflection(false);
  }
  function requestReview() {
    if (!rating) return notify("Choose a star rating to continue.");
    if (rating === 1) setShowReflection(true);
    else {
      saveReview();
      notify("Your session-verified review has been submitted.");
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
      saveReview(reflection.trim());
      notify("Thanks — your reflection has been securely added for review.");
    } catch (error) {
      notify(error instanceof TypeError ? "Review service is offline. Start both services with npm run dev." : error.message);
    }
  }
  return (
    <>
      <PageHeading eyebrow="TRUST IS A SHARED PRACTICE" title={<>Good mentorship starts<br />with <span className="title-spark">trust.</span></>} subtitle="Thoughtful guardrails make PeerNexus a safer place to learn, share, and grow." />
      <section className="safety-hero"><div className="safety-shield"><ShieldCheck size={26} /></div><div><span className="eyebrow">THE PEERNEXUS TRUST PROMISE</span><h2>Every review has context.<br /><em>Every contribution counts.</em></h2><p>Ratings only happen after a real, completed session. If something feels off, our review safeguards help us understand the full story before making a decision.</p></div><div className="trust-stat"><strong>100%</strong><span>session-linked<br />reviews</span></div></section>
      <div className="safety-content-grid"><section className="safety-rules card"><div className="section-heading"><div><h2>How we keep things fair</h2><p>Clear, simple safeguards for everyone.</p></div><span className="active-policy"><i /> ACTIVE</span></div><div className="safety-rule"><span className="rule-icon purple-icon"><LockKeyhole size={16} /></span><div><h3>Session-locked reviews</h3><p>Only people who completed a verified SkillSwap session can leave a rating. No random reviews, ever.</p></div><CheckCircle2 size={17} className="rule-check" /></div><div className="safety-rule"><span className="rule-icon amber-icon"><Sparkles size={16} /></span><div><h3>Contextual micro-reflection</h3><p>An unusual 1-star rating starts with a private reflection, not an automatic penalty. We ask for a little context so we can get it right.</p></div><CheckCircle2 size={17} className="rule-check" /></div><div className="safety-rule"><span className="rule-icon green-icon"><ShieldCheck size={16} /></span><div><h3>Human-centered review</h3><p>Low-effort or abusive patterns are flagged for human review. Automated checks support our team — they don't make the final call.</p></div><CheckCircle2 size={17} className="rule-check" /></div><div className="policy-footer"><ShieldCheck size={14} /> Your feedback is private until our team has reviewed it.</div></section>
        <aside className="review-demo card"><div className="demo-label"><span className="demo-pulse" /> INTERACTIVE DEMO</div><h3>Leave session feedback</h3><p>Your rating can only be submitted after a completed SkillSwap session.</p><div className="demo-session"><Avatar initials="AD" tone="lavender" size="avatar-small" /><span><strong>React state management</strong><small>With Aarav Desai · Completed May 16</small></span><CheckCircle2 size={15} /></div><div className="rating-label">HOW WAS YOUR SESSION?</div><div className="star-picker">{[1, 2, 3, 4, 5].map((star) => <button key={star} onClick={() => { setRating(star); setShowReflection(false); setReflectionSent(false); }} aria-label={`${star} star rating`}><Star size={22} fill={rating >= star ? "currentColor" : "none"} className={rating >= star ? "star-selected" : ""} /></button>)}</div>{showReflection ? <form className="reflection-form" onSubmit={submitReflection}><div className="reflection-note"><Sparkles size={14} /> We noticed this is different from your previous feedback. Your rating is safe — could you share a little context?</div><label htmlFor="reflection">WHAT COULD HAVE GONE BETTER?</label><textarea id="reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="A few words about what you hoped to get from the session..." /><button className="button button-primary button-full" disabled={reflectionSent}>{reflectionSent ? <><Check size={15} /> Reflection received</> : "Submit private reflection"}</button></form> : <button className="button button-primary button-full" onClick={requestReview}>Submit session rating <ArrowRight size={14} /></button>}<div className="demo-privacy"><LockKeyhole size={12} /> Only shared with our trust team if needed</div>{reviews.length > 0 && <p className="review-saved"><CheckCircle2 size={13} /> {reviews.length} saved session review{reviews.length === 1 ? "" : "s"} in this browser</p>}</aside>
      </div>
      <div className="safety-bottom-note"><div className="safety-note-icon"><BriefcaseBusiness size={17} /></div><div><strong>Need a hand with something?</strong><span>Our campus trust team is here to listen, no matter how big or small.</span></div><button className="button button-secondary" onClick={() => notify("Trust team support request started.")}>Contact the trust team <ArrowRight size={14} /></button></div>
    </>
  );
}

function AuthPage({ notify, setSession }) {
  const navigate = useNavigate();
  const [portal, setPortal] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const validEmail = academicEmail.test(email);
  function enterTeamDemo(role) {
    const profiles = {
      student: { name: "Samira Khan", initials: "SK", email: "samira@ltce.in", role: "Student" },
      faculty: { name: "Prof. Asha Rao", initials: "AR", email: "asha.rao@ltce.in", role: "Faculty" },
      admin: { name: "PeerNexus Team", initials: "PN", email: "team@ltce.in", role: "Campus admin" },
    };
    const profile = profiles[role];
    setSession({ ...profile, username: role === "admin" ? "peernexus-team" : role === "faculty" ? "asha-rao" : "samira-khan", demo: true });
    notify(`Signed in to the ${profile.role} demo workspace.`);
    navigate("/");
  }

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
    setSession({ name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), initials: email.slice(0, 2).toUpperCase(), email, role: portal === "admin" ? "Campus admin" : "Student", username: email.split("@")[0].toLowerCase(), demo: true });
    notify("Signed in to the local demo workspace. Changes are stored in this browser.");
    navigate("/");
  }
  return (
    <div className="auth-page">
      <div className="auth-left">
        <Link to="/" className="brand"><span className="brand-mark"><span /><span /><span /><span /></span><span>peer<span className="brand-strong">nexus</span></span><span className="beta-tag">BETA</span></Link>
        <div className="auth-story"><span className="auth-overline"><span /> YOUR CAMPUS, CLOSER</span><h1>Growth is better<br />when it's <em>shared.</em></h1><p>Find your people. Learn from each other. Build a future that feels like yours.</p><div className="auth-people"><div className="auth-avatar-stack"><Avatar initials="RS" tone="lavender" /><Avatar initials="AD" tone="blue" /><Avatar initials="PN" tone="peach" /><Avatar initials="SK" tone="mint" /></div><div><div className="auth-stars">★★★★★</div><span>Growing together at LTCE</span></div></div></div>
        <div className="auth-left-footer">© 2025 PeerNexus <span>·</span> Made for students, by students</div><div className="auth-decoration deco-one" /><div className="auth-decoration deco-two" />
      </div>
      <div className="auth-right">
        <div className="auth-top-link">Already part of the community? <Link to="/">Explore the demo <ArrowRight size={13} /></Link></div>
        <div className="auth-card">
          <div className="auth-card-heading"><span className="auth-welcome-tag"><Sparkles size={13} /> A BETTER WAY TO GROW</span><h2>{isSignup ? "Create your account" : "Welcome back"}</h2><p>Choose your portal to continue to PeerNexus.</p></div>
          <div className="portal-tabs"><button className={portal === "student" ? "selected" : ""} onClick={() => { setPortal("student"); setIsSignup(false); }}><GraduationCap size={15} /> Student / Faculty</button><button className={portal === "admin" ? "selected" : ""} onClick={() => { setPortal("admin"); setIsSignup(false); }}><LockKeyhole size={14} /> College Admin</button></div>
          <form className="auth-form" onSubmit={submit}>
            {portal === "recruiter" ? <div className="recruiter-info"><BriefcaseBusiness size={18} /><span><strong>Recruiter gateway</strong><small>Explore public portfolios and verified student skill ledgers.</small></span></div> : <><label htmlFor="auth-email">INSTITUTIONAL EMAIL</label><div className={`input-wrap ${emailTouched && !validEmail ? "input-error" : ""}`}><span>@</span><input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} onBlur={() => setEmailTouched(true)} placeholder="you@college.edu" autoComplete="email" /></div>{emailTouched && !validEmail && <span className="validation-hint">Use your campus email (e.g. @ltce.in, .ac.in, or .edu).</span>}{(portal === "admin" || isSignup || firebaseConfigured) && <><label htmlFor="auth-password">PASSWORD</label><div className="input-wrap"><LockKeyhole size={15} /><input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={isSignup ? "new-password" : "current-password"} /></div>{portal === "admin" && <div className="secure-note"><ShieldCheck size={13} /> Admin access is restricted to verified campus staff</div>}</>}</>}
            {portal === "recruiter" ? <button type="button" className="linkedin-button" onClick={() => notify("LinkedIn OAuth requires a configured LinkedIn application.")}><span className="linkedin-mark">in</span> Continue with LinkedIn <ArrowRight size={15} /></button> : <button className="button button-primary auth-submit">{isSignup ? "Create account" : portal === "admin" ? "Sign in securely" : "Continue with email"} <ArrowRight size={15} /></button>}
          </form>
          {portal === "student" && <div className="auth-signup">{isSignup ? "Already have an account?" : "New to PeerNexus?"} <button onClick={() => setIsSignup(!isSignup)}>{isSignup ? "Sign in" : "Create an account"}</button></div>}
          {portal !== "recruiter" && <section className="team-demo"><div><strong>PeerNexus team testing</strong><span>Enter an isolated sample role. Demo changes stay in this browser and do not use Firebase accounts.</span></div><div className="team-demo-actions"><button onClick={() => enterTeamDemo("student")}><GraduationCap size={14} /> Student</button><button onClick={() => enterTeamDemo("faculty")}><Users size={14} /> Faculty</button><button onClick={() => enterTeamDemo("admin")}><ShieldCheck size={14} /> Admin</button></div></section>}
          <div className="auth-divider"><span />or<span /></div><button className="recruiter-link" onClick={() => setPortal(portal === "recruiter" ? "student" : "recruiter")}><BriefcaseBusiness size={15} /> {portal === "recruiter" ? "Back to student portal" : "I'm a recruiter"} <ArrowRight size={14} /></button>
          <div className="auth-legal">By continuing, you agree to PeerNexus <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</div>
        </div>
        <div className="auth-status"><span className="status-dot" /> {firebaseConfigured ? "Secure campus authentication" : "Demo mode · changes stay in this browser"} <span>·</span><a href="mailto:support@peernexus.app">Need help?</a></div>
      </div>
    </div>
  );
}

function RecruiterPage({ notify }) {
  return <div className="recruiter-page"><div className="recruiter-top"><Link to="/" className="brand"><span className="brand-mark"><span /><span /><span /><span /></span><span>peer<span className="brand-strong">nexus</span></span><span className="beta-tag">BETA</span></Link><Link to="/login"><ArrowLeft size={14} /> Back to sign in</Link></div><div className="recruiter-content"><span className="auth-welcome-tag"><BriefcaseBusiness size={13} /> PEERNEXUS FOR TEAMS</span><h1>Meet the people<br />behind the <em>potential.</em></h1><p>A more human way to discover early-career talent. Explore proof-of-work, verified skills, and the peer mentorship that helped build them.</p><div className="recruiter-benefits"><span><ShieldCheck size={16} /> Verified skills, not just claims</span><span><FileText size={16} /> Real proof-of-work portfolios</span><span><Users size={16} /> See collaboration in context</span></div><div className="linkedin-signin"><div><span className="linkedin-mark">in</span><span><strong>Recruiter gateway</strong><small>Secure access through LinkedIn</small></span></div><button onClick={() => notify("LinkedIn OAuth integration is ready for your client credentials.")}>Continue with LinkedIn <ArrowRight size={15} /></button></div><div className="recruiter-preview"><div className="preview-head"><span>STUDENT PORTFOLIO PREVIEW</span><span className="verified-tag"><CheckCircle2 size={12} /> VERIFIED</span></div><div className="preview-person"><Avatar initials="SK" tone="blue" size="avatar-large" /><div><h3>Samira Khan <CheckCircle2 size={14} /></h3><p>Computer Engineering · LTCE '26</p></div><span className="open-profile"><Link2 size={14} /> PUBLIC</span></div><div className="preview-skills"><span>React</span><span>Product thinking</span><span>Peer mentor × 12</span><span>+5 verified skills</span></div><div className="proof-row"><div><span>PROOF OF WORK</span><strong>Campus Connect · Full-stack project</strong></div><div><span>PEER CRED SCORE</span><strong>4.9 <span className="auth-stars">★★★★★</span></strong></div></div></div><p className="recruiter-disclaimer">Student portfolios are shared publicly by choice. <a href="mailto:partnerships@peernexus.app">Talk to our team</a></p></div></div>;
}

function PublicProfile() {
  return <div className="public-profile-page"><div className="public-profile-top"><Link to="/" className="brand"><span className="brand-mark"><span /><span /><span /><span /></span><span>peer<span className="brand-strong">nexus</span></span></Link><span className="public-badge"><Link2 size={13} /> Public portfolio</span></div><div className="public-profile-content"><div className="public-profile-card card"><div className="public-cover" /><div className="public-profile-details"><Avatar initials="SK" tone="blue" size="avatar-profile" /><div className="public-profile-title"><span className="verified-tag"><CheckCircle2 size={12} /> VERIFIED STUDENT</span><h1>Samira Khan</h1><p>Computer Engineering · Lakeside Technical Campus · Class of 2026</p><span className="public-handle">@samira-khan</span></div><button className="button button-secondary" onClick={() => navigator.clipboard?.writeText(window.location.href)}><Copy size={14} /> Copy profile link</button></div><div className="public-metrics"><div><strong>12</strong><span>Mentorship sessions</span></div><div><strong>4.9 <span className="gold-star">★</span></strong><span>PeerNexus Cred Score</span></div><div><strong>8</strong><span>Verified skills</span></div><div><strong>6</strong><span>Proof-of-work projects</span></div></div></div><section className="public-section"><div className="public-section-title"><div><span className="eyebrow">BUILT, LEARNED, SHARED</span><h2>Proof of work</h2></div><span className="verified-tag"><ShieldCheck size={12} /> PEER-VERIFIED</span></div><div className="project-grid"><article className="project-card card"><span className="project-icon"><Laptop size={18} /></span><span className="project-date">APR 2025</span><h3>Campus Connect</h3><p>A full-stack student collaboration platform built to help clubs organize events and find teammates.</p><div className="project-tags"><span>React</span><span>Node.js</span><span>Firebase</span></div><div className="project-proof"><CheckCircle2 size={13} /> Verified by 3 peers</div></article><article className="project-card card"><span className="project-icon peach-project"><Zap size={18} /></span><span className="project-date">FEB 2025</span><h3>StudyFlow</h3><p>A shared focus timer and accountability space designed for student study groups.</p><div className="project-tags"><span>UI/UX</span><span>Figma</span><span>Community</span></div><div className="project-proof"><CheckCircle2 size={13} /> Verified by 2 peers</div></article></div></section><section className="public-section public-reviews"><div className="public-section-title"><div><span className="eyebrow">COMMUNITY VOICES</span><h2>Peer reviews</h2></div><span className="review-score">4.9 <span>★★★★★</span> <small>from 12 sessions</small></span></div><div className="review-quote card"><div className="quote-stars">★★★★★</div><p>“Samira explained component state in a way that finally clicked. She made space for all my questions and shared a great set of practice exercises.”</p><div className="review-author"><Avatar initials="AM" tone="peach" size="avatar-small" /><span><strong>Arjun M.</strong><small>React mentoring session · May 2025</small></span><span className="verified-tag"><CheckCircle2 size={11} /> SESSION VERIFIED</span></div></div></section></div><div className="public-profile-footer"><span>Verified with PeerNexus <ShieldCheck size={14} /></span><Link to="/recruiter">Recruiter gateway <ArrowRight size={13} /></Link></div></div>;
}

function AppDialog({ dialog, close, navigate, notify, setCommunities }) {
  const [value, setValue] = useState("");
  const title = {
    search: "Search PeerNexus",
    community: "Join your campus community",
    workspace: "LTCE Campus workspace",
    profile: "Your profile",
    help: "Help & feedback",
    "feed-filter": "Filter the community feed",
    "post-actions": "Post options",
    calendar: "Your upcoming events",
    people: "People to know",
    connect: `Connect with ${dialog.mentor?.name || "a mentor"}`,
    "mentor-details": dialog.mentor?.name || "Mentor profile",
    "mentorship-request": `Request a session with ${dialog.mentor?.name || "your mentor"}`,
    "mentor-profile": "Your mentor profile",
  }[dialog.type] || "PeerNexus";

  function go(path) {
    close();
    navigate(path);
  }

  function submitCommunity(event) {
    event.preventDefault();
    const name = value.trim();
    if (!name) return;
    setCommunities((items) => items.includes(name) ? items : [...items, name]);
    notify(`Joined ${name}.`);
    close();
  }

  function submitMentorship(event) {
    event.preventDefault();
    const topic = value.trim();
    if (topic.length < 5) {
      notify("Add a short note about what you would like to learn.");
      return;
    }
    dialog.submit(topic);
    close();
  }

  const content = (() => {
    switch (dialog.type) {
      case "search":
        return <><form className="dialog-form" onSubmit={(event) => { event.preventDefault(); const query = value.trim(); go(query ? `/skillswap?q=${encodeURIComponent(query)}` : "/skillswap"); }}><label htmlFor="global-search">SEARCH BY QUESTION, SKILL, OR TOPIC</label><div className="dialog-input-row"><Search size={16} /><input id="global-search" autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder="Try “help me with a React state bug”" /><button className="button button-primary button-small">Search</button></div></form><div className="dialog-quick-links"><button onClick={() => go("/")}>Community feed <ArrowRight size={13} /></button><button onClick={() => go("/skillswap")}>Mentors <ArrowRight size={13} /></button><button onClick={() => go("/profilify")}>AI learning studio <ArrowRight size={13} /></button></div></>;
      case "community":
        return <form className="dialog-form" onSubmit={submitCommunity}><p className="dialog-description">Add a campus group to your sidebar and open its related feed.</p><label htmlFor="community-name">COMMUNITY NAME</label><div className="dialog-input-row"><Hash size={15} /><input id="community-name" autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder="e.g. Robotics Club" /><button className="button button-primary button-small">Join</button></div></form>;
      case "workspace":
        return <><p className="dialog-description">You are viewing the Lakeside Technical Campus student workspace.</p><div className="dialog-list-row"><GraduationCap size={16} /><span><strong>LTCE Campus</strong><small>Student workspace · Demo data is saved in this browser</small></span><CheckCircle2 size={15} /></div><button className="button button-secondary button-full" onClick={() => go("/login")}>Switch or test another role</button></>;
      case "profile":
        return <><p className="dialog-description">Your public portfolio preview is available to recruiters. Manage your visible work and learning profile.</p><div className="dialog-list-row"><Avatar initials="SK" tone="blue" /><span><strong>Samira Khan</strong><small>Computer Engineering · LTCE '26</small></span></div><button className="button button-primary button-full" onClick={() => go("/profile/samira-khan")}>View public profile <ArrowRight size={14} /></button></>;
      case "help":
        return <form className="dialog-form" onSubmit={(event) => { event.preventDefault(); if (value.trim().length < 8) return notify("Please add a little detail so the team can help."); try { const existing = JSON.parse(localStorage.getItem("peernexus.feedback") || "[]"); localStorage.setItem("peernexus.feedback", JSON.stringify([{ message: value.trim(), createdAt: new Date().toISOString() }, ...existing])); notify("Thanks — your feedback is saved in this demo workspace."); close(); } catch (error) { console.error("Unable to save feedback:", error); notify("Feedback could not be saved in this browser."); } }}><p className="dialog-description">Tell the PeerNexus team what’s confusing or what you’d like us to improve.</p><label htmlFor="feedback-message">YOUR MESSAGE</label><textarea id="feedback-message" autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder="What happened? What did you expect to happen?" /><button className="button button-primary button-full">Save feedback</button></form>;
      case "feed-filter":
        return <div className="dialog-choice-list">{categories.map((category) => <button className={dialog.filter === category ? "selected" : ""} key={category} onClick={() => { dialog.setFilter(category); close(); }}><span>{category}</span>{dialog.filter === category && <Check size={15} />}</button>)}</div>;
      case "post-actions":
        return <div className="dialog-choice-list">{dialog.post.author === "Samira Khan" && <button onClick={() => { dialog.setPosts((items) => items.filter((post) => post.id !== dialog.post.id)); notify("Your post was removed."); close(); }}><X size={15} /><span>Delete my post</span></button>}<button onClick={() => { notify("Post reported to the campus moderation queue."); close(); }}><ShieldCheck size={15} /><span>Report for moderator review</span></button><button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/#post-${dialog.post.id}`).then(() => notify("Post link copied.")).catch(() => notify("Clipboard access is unavailable.")); close(); }}><Copy size={15} /><span>Copy post link</span></button></div>;
      case "calendar":
        return <div className="calendar-dialog-list">{[["MON 19", "React study circle", "4:30 PM · Library 2B"], ["WED 21", "Mentorship with Aarav", "6:30 PM · Online"], ["FRI 23", "Design Club review night", "5:00 PM · Innovation Lab"]].map(([day, event, time]) => <div className="calendar-dialog-event" key={event}><span className="week-date">{day}<strong><CalendarDays size={14} /></strong></span><span><strong>{event}</strong><small>{time}</small></span></div>)}</div>;
      case "people":
        return <div className="dialog-choice-list">{mentors.map((mentor) => <button key={mentor.id} onClick={() => go("/skillswap")}><Avatar initials={mentor.initials} tone={mentor.tone} size="avatar-small" /><span>{mentor.name}<small>{mentor.skills.join(" · ")}</small></span><ArrowRight size={14} /></button>)}</div>;
      case "connect":
        return <><div className="dialog-list-row"><Avatar initials={dialog.mentor.initials} tone={dialog.mentor.tone} /><span><strong>{dialog.mentor.name}</strong><small>{dialog.mentor.title}</small></span></div><p className="dialog-description">Add this verified mentor to your campus network and make it easier to reconnect.</p><button className="button button-primary button-full" onClick={() => { dialog.connect(); close(); }}>Send connection request <ArrowRight size={14} /></button></>;
      case "mentor-details":
        return <><div className="dialog-list-row"><Avatar initials={dialog.mentor.initials} tone={dialog.mentor.tone} size="avatar-large" /><span><strong>{dialog.mentor.name}</strong><small>{dialog.mentor.title}</small></span></div><p className="dialog-description">{dialog.mentor.sessions} completed sessions · {dialog.mentor.rating}/5 peer score · Next available {dialog.mentor.available}.</p><div className="mentor-skills dialog-mentor-skills">{dialog.mentor.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><button className="button button-secondary button-full" onClick={() => { dialog.connect(); close(); }}>Connect with mentor</button></>;
      case "mentorship-request":
        return <form className="dialog-form" onSubmit={submitMentorship}><p className="dialog-description">Tell {dialog.mentor.name} what you're working on. This helps them prepare a useful first session.</p><label htmlFor="session-topic">WHAT WOULD YOU LIKE HELP WITH?</label><textarea id="session-topic" autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder="e.g. I'm debugging stale state in a React task tracker..." /><button className="button button-primary button-full">Send session request <Send size={14} /></button></form>;
      case "mentor-profile":
        return <><p className="dialog-description">Your profile is visible to campus peers. Add your skills in the demo by editing the list below.</p><label className="dialog-static-label">YOUR CURRENT SKILLS</label><div className="mentor-skills dialog-mentor-skills">{["React", "Figma", "Peer mentoring"].map((skill) => <span key={skill}>{skill}</span>)}</div><button className="button button-primary button-full" onClick={() => { notify("Profile editor saved. Edit your public portfolio to add skills."); close(); }}>Done</button></>;
      default:
        return <p className="dialog-description">This action is not available in the demo workspace.</p>;
    }
  })();

  return <Modal title={title} subtitle={dialog.type === "search" ? "Jump to a feature or search for a mentor." : ""} close={close}>{content}</Modal>;
}

function Modal({ title, subtitle, close, children }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={close} aria-label="Close dialog"><X size={17} /></button></div>{children}</section></div>;
}

export default App;
