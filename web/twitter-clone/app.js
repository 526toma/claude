import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Firebase Init ──
const firebaseConfig = {
  apiKey: "AIzaSyDBXAHJ0XOxM0Hp633izVu59BRvIwkxoLI",
  authDomain: "grumpy-5ebb2.firebaseapp.com",
  projectId: "grumpy-5ebb2",
  storageBucket: "grumpy-5ebb2.firebasestorage.app",
  messagingSenderId: "130090012669",
  appId: "1:130090012669:web:d27d76ca7b18c07fa71394",
  measurementId: "G-54WY262X3S"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── Avatar Colors ──
const AVATAR_COLORS = ['#1d9bf0','#7856ff','#ff7a00','#00ba7c','#f91880','#ffad1f','#ff6b6b','#00c9ff'];
function getAvatarColor(uid) {
  if (!uid) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── State ──
let currentUser = null;
let currentUserData = null;
let feedUnsubscribe = null;
let previousTab = "home";
let viewingUserId = null;

// ── Auth State ──
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    currentUserData = await fetchUserData(user.uid);
    showApp();
    loadFeed();
    updateProfileUI();
  } else {
    currentUser = null;
    currentUserData = null;
    showAuth();
  }
});

// ── Auth Functions ──
window.loginUser = async () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  if (!email || !password) return showAuthError("メールとパスワードを入力してください");
  showLoading(true);
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    showAuthError(getAuthError(e.code));
  } finally {
    showLoading(false);
  }
};

window.registerUser = async () => {
  const name = document.getElementById("reg-name").value.trim();
  const username = document.getElementById("reg-username").value.trim().toLowerCase().replace(/\s+/g, "");
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  if (!name || !username || !email || !password) return showAuthError("すべての項目を入力してください");
  if (username.length < 2) return showAuthError("ユーザー名は2文字以上にしてください");
  showLoading(true);
  try {
    // Check username unique
    const q = query(collection(db, "users"), where("username", "==", username));
    const snap = await getDocs(q);
    if (!snap.empty) { showLoading(false); return showAuthError("このユーザー名はすでに使われています"); }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      displayName: name,
      username,
      email,
      createdAt: serverTimestamp(),
      tweetCount: 0,
      following: [],
      followers: []
    });
  } catch (e) {
    showAuthError(getAuthError(e.code));
  } finally {
    showLoading(false);
  }
};

window.logoutUser = async () => {
  closeProfileMenu();
  if (feedUnsubscribe) feedUnsubscribe();
  await signOut(auth);
};

window.toggleProfileMenu = () => {
  document.getElementById("profile-menu").classList.toggle("hidden");
};

window.closeProfileMenu = () => {
  document.getElementById("profile-menu").classList.add("hidden");
};

window.showLogin = () => {
  document.getElementById("login-form").classList.remove("hidden");
  document.getElementById("register-form").classList.add("hidden");
  hideAuthError();
};

window.showRegister = () => {
  document.getElementById("register-form").classList.remove("hidden");
  document.getElementById("login-form").classList.add("hidden");
  hideAuthError();
};

// ── Firestore Helpers ──
async function fetchUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// ── Feed ──
function loadFeed() {
  const feedEl = document.getElementById("feed");
  feedEl.innerHTML = '<div class="empty-state">読み込み中...</div>';
  if (feedUnsubscribe) feedUnsubscribe();
  const q = query(collection(db, "tweets"), orderBy("createdAt", "desc"), limit(50));
  feedUnsubscribe = onSnapshot(q, async (snap) => {
    if (snap.empty) {
      feedEl.innerHTML = '<div class="empty-state">ツイートがまだありません</div>';
      return;
    }
    feedEl.innerHTML = "";
    snap.forEach(d => {
      feedEl.appendChild(buildTweetCard(d.id, d.data()));
    });
  });
}

// ── Tweet ──
window.postTweet = async () => {
  const input = document.getElementById("tweet-input");
  const text = input.value.trim();
  if (!text || !currentUser) return;
  showLoading(true);
  try {
    await addDoc(collection(db, "tweets"), {
      uid: currentUser.uid,
      displayName: currentUserData?.displayName || currentUser.displayName || "匿名",
      username: currentUserData?.username || "user",
      text,
      likes: [],
      retweets: [],
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, "users", currentUser.uid), { tweetCount: increment(1) });
    input.value = "";
    updateCharCount();
    showToast("ツイートしました！");
  } catch (e) {
    showToast("エラーが発生しました");
  } finally {
    showLoading(false);
  }
};

// ── Like ──
window.toggleLike = async (tweetId, isLiked) => {
  if (!currentUser) return;
  const ref = doc(db, "tweets", tweetId);
  if (isLiked) {
    await updateDoc(ref, { likes: arrayRemove(currentUser.uid) });
  } else {
    await updateDoc(ref, { likes: arrayUnion(currentUser.uid) });
  }
};

// ── Comments ──
let commentTweetId = null;
let commentUnsub = null;

window.openComments = (tweetId) => {
  commentTweetId = tweetId;
  if (currentUser) {
    const av = document.getElementById("comment-avatar");
    av.textContent = (currentUserData?.displayName || "?")[0].toUpperCase();
    av.style.background = getAvatarColor(currentUser.uid);
  }
  document.getElementById("comment-modal").classList.remove("hidden");
  document.getElementById("comment-input").value = "";
  const listEl = document.getElementById("comment-list");
  listEl.innerHTML = '<div class="empty-state">読み込み中...</div>';
  if (commentUnsub) commentUnsub();
  const q = query(collection(db, "tweets", tweetId, "comments"), orderBy("createdAt", "asc"), limit(100));
  commentUnsub = onSnapshot(q, (snap) => {
    if (snap.empty) {
      listEl.innerHTML = '<div class="empty-state">まだコメントがありません</div>';
      return;
    }
    listEl.innerHTML = "";
    snap.forEach(d => {
      const c = d.data();
      const item = document.createElement("div");
      item.className = "comment-item";
      item.innerHTML = `
        <div class="tweet-avatar" style="background:${getAvatarColor(c.uid)};width:32px;height:32px;font-size:13px;flex-shrink:0">${(c.displayName||"?")[0].toUpperCase()}</div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="tweet-name">${escHtml(c.displayName)}</span>
            <span class="tweet-user">@${escHtml(c.username)}</span>
          </div>
          <div class="comment-text">${escHtml(c.text)}</div>
        </div>
      `;
      listEl.appendChild(item);
    });
    listEl.scrollTop = listEl.scrollHeight;
  });
};

window.closeComments = () => {
  document.getElementById("comment-modal").classList.add("hidden");
  if (commentUnsub) { commentUnsub(); commentUnsub = null; }
  commentTweetId = null;
};

window.postComment = async () => {
  const input = document.getElementById("comment-input");
  const text = input.value.trim();
  if (!text || !currentUser || !commentTweetId) return;
  const btn = document.getElementById("comment-submit");
  btn.disabled = true;
  try {
    await addDoc(collection(db, "tweets", commentTweetId, "comments"), {
      uid: currentUser.uid,
      displayName: currentUserData?.displayName || currentUser.displayName || "匿名",
      username: currentUserData?.username || "user",
      text,
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, "tweets", commentTweetId), { commentCount: increment(1) });
    input.value = "";
  } catch (e) {
    showToast("エラーが発生しました");
  } finally {
    btn.disabled = false;
  }
};

// ── Retweet ──
window.toggleRetweet = async (tweetId, isRetweeted) => {
  if (!currentUser) return;
  const ref = doc(db, "tweets", tweetId);
  if (isRetweeted) {
    await updateDoc(ref, { retweets: arrayRemove(currentUser.uid) });
  } else {
    await updateDoc(ref, { retweets: arrayUnion(currentUser.uid) });
  }
};

// ── Follow ──
let isFollowing = false;
window.toggleFollow = async () => {
  if (!currentUser || !viewingUserId || viewingUserId === currentUser.uid) return;
  const myRef = doc(db, "users", currentUser.uid);
  const theirRef = doc(db, "users", viewingUserId);
  if (isFollowing) {
    await updateDoc(myRef, { following: arrayRemove(viewingUserId) });
    await updateDoc(theirRef, { followers: arrayRemove(currentUser.uid) });
    isFollowing = false;
  } else {
    await updateDoc(myRef, { following: arrayUnion(viewingUserId) });
    await updateDoc(theirRef, { followers: arrayUnion(currentUser.uid) });
    isFollowing = true;
  }
  updateFollowBtn();
};

function updateFollowBtn() {
  const btn = document.getElementById("follow-btn");
  if (!btn) return;
  btn.textContent = isFollowing ? "フォロー中" : "フォローする";
  btn.classList.toggle("following", isFollowing);
}

// ── Build Tweet Card ──
function buildTweetCard(id, data) {
  const likes = data.likes || [];
  const retweets = data.retweets || [];
  const isLiked = currentUser && likes.includes(currentUser.uid);
  const isRetweeted = currentUser && retweets.includes(currentUser.uid);
  const initial = (data.displayName || "?")[0].toUpperCase();
  const time = data.createdAt ? formatTime(data.createdAt.toDate()) : "";

  const color = getAvatarColor(data.uid);
  const card = document.createElement("div");
  card.className = "tweet-card";
  card.innerHTML = `
    <div class="tweet-avatar" style="background:${color}" onclick="event.stopPropagation();showUserCard('${data.uid}')">${initial}</div>
    <div class="tweet-right">
      <div class="tweet-header">
        <span class="tweet-name" onclick="viewUserProfile('${data.uid}')">${escHtml(data.displayName)}</span>
        <span class="tweet-user">@${escHtml(data.username)}</span>
        <span class="tweet-time">· ${time}</span>
      </div>
      <div class="tweet-text">${escHtml(data.text)}</div>
      <div class="tweet-actions">
        <button class="action-btn" onclick="event.stopPropagation();openComments('${id}')">
          <svg viewBox="0 0 24 24"><path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828c0 .108.044.286.12.403.142.225.384.347.632.347.138 0 .277-.038.402-.118.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67c0-.414-.335-.75-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z"/></svg>
          ${data.commentCount || 0}
        </button>
        <button class="action-btn${isLiked ? " liked" : ""}" onclick="event.stopPropagation();toggleLike('${id}', ${isLiked})">
          <svg viewBox="0 0 24 24"><path d="${isLiked
            ? "M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.813-1.148 2.353-2.73 4.644-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z"
            : "M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.813-1.148 2.353-2.73 4.644-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12zM7.354 4.225c-2.08 0-3.903 1.988-3.903 4.255 0 5.74 7.035 11.596 8.55 11.658 1.52-.062 8.55-5.917 8.55-11.658 0-2.267-1.822-4.255-3.902-4.255-2.528 0-3.94 2.936-3.952 2.965-.23.562-1.156.562-1.387 0-.015-.03-1.426-2.965-3.955-2.965z"
          }"/></svg>
          ${likes.length}
        </button>
        <button class="action-btn${isRetweeted ? " retweeted" : ""}" onclick="event.stopPropagation();toggleRetweet('${id}', ${isRetweeted})">
          <svg viewBox="0 0 24 24"><path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"/></svg>
          ${retweets.length}
        </button>
      </div>
    </div>
  `;
  return card;
}

// ── User Card Popup ──
let userCardUid = null;
let ucardFollowing = false;

window.showUserCard = async (uid) => {
  if (!uid) return;
  userCardUid = uid;
  document.getElementById("user-card-modal").classList.remove("hidden");

  const data = await fetchUserData(uid);
  if (!data) return;

  const av = document.getElementById("ucard-avatar");
  av.textContent = (data.displayName || "?")[0].toUpperCase();
  av.style.background = getAvatarColor(uid);
  document.getElementById("ucard-name").textContent = data.displayName || "-";
  document.getElementById("ucard-username").textContent = "@" + (data.username || "-");
  document.getElementById("ucard-tweets").textContent = data.tweetCount || 0;
  document.getElementById("ucard-following").textContent = (data.following || []).length;
  document.getElementById("ucard-followers").textContent = (data.followers || []).length;

  const followBtn = document.getElementById("ucard-follow-btn");
  if (uid === currentUser?.uid) {
    followBtn.style.display = "none";
  } else {
    followBtn.style.display = "";
    const myData = await fetchUserData(currentUser.uid);
    ucardFollowing = (myData?.following || []).includes(uid);
    updateUcardFollowBtn();
  }
};

function updateUcardFollowBtn() {
  const btn = document.getElementById("ucard-follow-btn");
  if (!btn) return;
  btn.textContent = ucardFollowing ? "フォロー中" : "フォローする";
  btn.classList.toggle("following", ucardFollowing);
}

window.toggleFollowFromCard = async () => {
  if (!currentUser || !userCardUid || userCardUid === currentUser.uid) return;
  const myRef = doc(db, "users", currentUser.uid);
  const theirRef = doc(db, "users", userCardUid);
  if (ucardFollowing) {
    await updateDoc(myRef, { following: arrayRemove(userCardUid) });
    await updateDoc(theirRef, { followers: arrayRemove(currentUser.uid) });
    ucardFollowing = false;
  } else {
    await updateDoc(myRef, { following: arrayUnion(userCardUid) });
    await updateDoc(theirRef, { followers: arrayUnion(currentUser.uid) });
    ucardFollowing = true;
  }
  updateUcardFollowBtn();
  // Sync with followers count display
  const theirData = await fetchUserData(userCardUid);
  document.getElementById("ucard-followers").textContent = (theirData?.followers || []).length;
};

window.goToUserProfile = () => {
  closeUserCard();
  viewUserProfile(userCardUid);
};

window.closeUserCard = () => {
  document.getElementById("user-card-modal").classList.add("hidden");
  userCardUid = null;
};

// ── User Profile View ──
window.viewUserProfile = async (uid) => {
  if (!uid) return;
  viewingUserId = uid;
  previousTab = document.querySelector(".tab-content.active")?.id.replace("tab-", "") || "home";

  const userData = await fetchUserData(uid);
  if (!userData) return;

  const uAvatar = document.getElementById("user-avatar-large");
  uAvatar.textContent = (userData.displayName || "?")[0].toUpperCase();
  uAvatar.style.background = getAvatarColor(uid);
  document.getElementById("user-display-name").textContent = userData.displayName || "-";
  document.getElementById("user-username-display").textContent = "@" + (userData.username || "-");
  document.getElementById("user-tweet-count").textContent = userData.tweetCount || 0;
  document.getElementById("user-following-count").textContent = (userData.following || []).length;
  document.getElementById("user-followers-count").textContent = (userData.followers || []).length;

  // Follow state
  if (uid === currentUser?.uid) {
    document.getElementById("follow-btn").style.display = "none";
  } else {
    document.getElementById("follow-btn").style.display = "";
    const myData = await fetchUserData(currentUser.uid);
    isFollowing = (myData?.following || []).includes(uid);
    updateFollowBtn();
  }

  // Load their tweets
  const tweetsEl = document.getElementById("user-profile-tweets");
  tweetsEl.innerHTML = '<div class="empty-state">読み込み中...</div>';
  const q = query(collection(db, "tweets"), where("uid", "==", uid), orderBy("createdAt", "desc"), limit(20));
  const snap = await getDocs(q);
  tweetsEl.innerHTML = "";
  if (snap.empty) {
    tweetsEl.innerHTML = '<div class="empty-state">ツイートがありません</div>';
  } else {
    snap.forEach(d => tweetsEl.appendChild(buildTweetCard(d.id, d.data())));
  }

  switchTabDirect("user-profile");
  document.getElementById("header-title").textContent = userData.displayName || "プロフィール";
};

window.goBack = () => {
  switchTabDirect(previousTab);
  updateHeaderTitle(previousTab);
};

// ── Search ──
window.searchUsers = async () => {
  const term = document.getElementById("search-input").value.trim().toLowerCase();
  const resultsEl = document.getElementById("search-results");
  if (!term) { resultsEl.innerHTML = ""; return; }
  const snap = await getDocs(collection(db, "users"));
  resultsEl.innerHTML = "";
  snap.forEach(d => {
    const u = d.data();
    if (u.username?.includes(term) || u.displayName?.toLowerCase().includes(term)) {
      const card = document.createElement("div");
      card.className = "user-card";
      card.innerHTML = `
        <div class="tweet-avatar" style="background:${getAvatarColor(u.uid)}">${(u.displayName||"?")[0].toUpperCase()}</div>
        <div class="user-card-info">
          <div class="user-card-name">${escHtml(u.displayName)}</div>
          <div class="user-card-handle">@${escHtml(u.username)}</div>
        </div>
      `;
      card.onclick = () => viewUserProfile(u.uid);
      resultsEl.appendChild(card);
    }
  });
  if (!resultsEl.children.length) {
    resultsEl.innerHTML = '<div class="empty-state">ユーザーが見つかりません</div>';
  }
};

// ── Profile UI ──
async function updateProfileUI() {
  if (!currentUser) return;
  const data = currentUserData || await fetchUserData(currentUser.uid);
  if (!data) return;
  currentUserData = data;
  const initial = (data.displayName || "?")[0].toUpperCase();
  const color = getAvatarColor(currentUser.uid);
  const setAvatar = (id) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = initial; el.style.background = color; }
  };
  setAvatar("compose-avatar");
  setAvatar("profile-avatar-large");
  setAvatar("header-avatar");
  setAvatar("menu-avatar");
  const menuName = document.getElementById("menu-name");
  const menuUser = document.getElementById("menu-username");
  if (menuName) menuName.textContent = data.displayName || "-";
  if (menuUser) menuUser.textContent = "@" + (data.username || "-");
  document.getElementById("profile-display-name").textContent = data.displayName || "-";
  document.getElementById("profile-username-display").textContent = "@" + (data.username || "-");
  document.getElementById("profile-tweet-count").textContent = data.tweetCount || 0;
  document.getElementById("profile-following-count").textContent = (data.following || []).length;
  document.getElementById("profile-followers-count").textContent = (data.followers || []).length;
  if (data.createdAt) {
    const d = data.createdAt.toDate();
    document.getElementById("profile-joined").textContent = `${d.getFullYear()}年${d.getMonth()+1}月に参加`;
  }

  // My tweets
  const tweetsEl = document.getElementById("profile-tweets");
  tweetsEl.innerHTML = "";
  const q = query(collection(db, "tweets"), where("uid", "==", currentUser.uid), orderBy("createdAt", "desc"), limit(20));
  const snap = await getDocs(q);
  snap.forEach(d => tweetsEl.appendChild(buildTweetCard(d.id, d.data())));
  if (snap.empty) tweetsEl.innerHTML = '<div class="empty-state">ツイートがありません</div>';
}

// ── Tabs ──
window.switchTab = (tab) => {
  if (tab === "profile") updateProfileUI();
  switchTabDirect(tab);
  updateHeaderTitle(tab);
};

function switchTabDirect(tab) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  document.getElementById("tab-" + tab)?.classList.add("active");
  document.getElementById("nav-" + tab)?.classList.add("active");
}

function updateHeaderTitle(tab) {
  const titles = { home: "ホーム", search: "検索", notifications: "通知", profile: "プロフィール" };
  document.getElementById("header-title").textContent = titles[tab] || "";
}

// ── Char Count ──
document.getElementById("tweet-input")?.addEventListener("input", updateCharCount);
function updateCharCount() {
  const val = document.getElementById("tweet-input").value;
  const remaining = 280 - val.length;
  const el = document.getElementById("char-count");
  el.textContent = remaining;
  el.className = "char-count" + (remaining < 20 ? " warn" : "") + (remaining < 0 ? " danger" : "");
  document.querySelector(".btn-tweet").disabled = val.trim().length === 0 || remaining < 0;
}

// ── UI Helpers ──
function showApp() {
  document.getElementById("auth-screen").classList.remove("active");
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.add("active");
  document.getElementById("app-screen").classList.remove("hidden");
}

function showAuth() {
  document.getElementById("app-screen").classList.remove("active");
  document.getElementById("app-screen").classList.add("hidden");
  document.getElementById("auth-screen").classList.add("active");
  document.getElementById("auth-screen").classList.remove("hidden");
}

function showLoading(show) {
  document.getElementById("loading").classList.toggle("hidden", !show);
}

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2600);
}

function showAuthError(msg) {
  const el = document.getElementById("auth-error");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideAuthError() {
  document.getElementById("auth-error").classList.add("hidden");
}

function escHtml(str) {
  if (!str) return "";
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function formatTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}秒`;
  if (diff < 3600) return `${Math.floor(diff/60)}分`;
  if (diff < 86400) return `${Math.floor(diff/3600)}時間`;
  return `${date.getMonth()+1}月${date.getDate()}日`;
}

function getAuthError(code) {
  const map = {
    "auth/invalid-email": "メールアドレスの形式が正しくありません",
    "auth/user-not-found": "ユーザーが見つかりません",
    "auth/wrong-password": "パスワードが間違っています",
    "auth/email-already-in-use": "このメールアドレスはすでに使われています",
    "auth/weak-password": "パスワードは6文字以上にしてください",
    "auth/invalid-credential": "メールアドレスまたはパスワードが正しくありません",
    "auth/too-many-requests": "しばらく待ってから再試行してください",
  };
  return map[code] || `エラーが発生しました (${code})`;
}
