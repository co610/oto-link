
/* =========================================
   OTO LINK
   Supabase Auth 共通認証処理
========================================= */

(function () {
  "use strict";

  const supabase = window.OTO_SUPABASE;

  if (!supabase) {
    console.error(
      "Supabaseが初期化されていません。読み込み順を確認してください。"
    );
    return;
  }

  let currentSession = null;
  let currentUser = null;

  /* =========================
     初期ログイン状態の取得
  ========================= */

  const ready = (async function () {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error("ログイン状態の取得に失敗しました:", error);
    }

    currentSession = session || null;
    currentUser = session?.user || null;

    return currentUser;
  })();

  /* =========================
     認証状態の変更を監視
  ========================= */

  supabase.auth.onAuthStateChange(function (event, session) {
    currentSession = session || null;
    currentUser = session?.user || null;

    if (event !== "INITIAL_SESSION") {
      updateHeaderAccount();
    }
  });

  /* =========================
     配列データ取得
  ========================= */

  function readArray(key) {
    try {
      const value = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error("データの読み込みに失敗しました:", error);
      return [];
    }
  }

  /* =========================
     ログインユーザー取得
  ========================= */

  async function getCurrentUser() {
    await ready;
    return currentUser;
  }

  async function getCurrentUserId() {
    await ready;
    return currentUser?.id || null;
  }

  async function isLoggedIn() {
    await ready;
    return !!currentUser;
  }

  /* =========================
     投稿の所有者確認
  ========================= */

  async function isOwner(post) {
    await ready;

    if (!post || !currentUser) {
      return false;
    }

    const ownerId = post.user_id || post.userId;

    return ownerId === currentUser.id;
  }

  /* =========================
     ログイン必須処理
  ========================= */

  async function requireUser() {
    await ready;

    if (!currentUser) {
      const returnTo =
        location.pathname.split("/").pop() +
        location.search;

      location.href =
        "login.html?returnTo=" +
        encodeURIComponent(returnTo);

      return null;
    }

    return currentUser;
  }

  /* =========================
     ログアウト
  ========================= */

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("ログアウトに失敗しました:", error);
      alert("ログアウトに失敗しました。もう一度お試しください。");
      return false;
    }

    currentSession = null;
    currentUser = null;

    location.href = "index.html";
    return true;
  }

  /* =========================
     HTMLエスケープ
  ========================= */

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      function (character) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[character];
      }
    );
  }

  /* =========================
     プロフィール取得
  ========================= */

  async function getProfile(userId) {
    if (!userId) {
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, data")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("プロフィール取得エラー:", error);
      return null;
    }

    return data?.data || null;
  }

  /* =========================
     ヘッダー表示更新
  ========================= */

  async function updateHeaderAccount() {
    await ready;

    const headerAccount = document.querySelector(
      ".header-account"
    );

    if (!headerAccount) {
      return;
    }

    if (!currentUser) {
      headerAccount.innerHTML = `
        <a href="login.html">ログイン</a>
        <a href="signup.html">新規登録</a>
      `;
      return;
    }

    const profile = await getProfile(currentUser.id);

    const displayName =
      profile?.name ||
      currentUser.user_metadata?.name ||
      currentUser.email?.split("@")[0] ||
      "マイアカウント";

    headerAccount.innerHTML = `
      <a href="profile-detail.html?id=${encodeURIComponent(currentUser.id)}">
        ${escapeHtml(displayName)}
      </a>
      <button type="button" data-oto-action="logout">
        ログアウト
      </button>
    `;
  }

  /* =========================
     ログアウトボタン処理
  ========================= */

  document.addEventListener("click", function (event) {
    const button = event.target.closest(
      '[data-oto-action="logout"]'
    );

    if (!button) {
      return;
    }

    event.preventDefault();
    logout();
  });

  /* =========================
     OTOAuth 公開
  ========================= */

  window.OTOAuth = Object.freeze({
    ready,
    readArray,
    getCurrentUser,
    getCurrentUserId,
    isLoggedIn,
    isOwner,
    requireUser,
    logout,
    escapeHtml,
    updateHeaderAccount,
    getProfile
  });

  /* 初期化完了後にヘッダーを更新 */
  ready.then(function () {
    updateHeaderAccount();
  });

})();
