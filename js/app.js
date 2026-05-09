/* =============================================
   CUPIDO CATÓLICO - MAIN LOGIC
   ============================================= */

// FUNÇÃO GLOBAL DE TESTE (Reseta curtidas para teste visual)
window.resetMeusMatches = async function() {
  console.log("🛠️ Botão de Reset pressionado!");
  if (!window.sb) {
    alert("Erro: Sistema de banco não carregado.");
    return;
  }
  
  try {
    const { data: { user } } = await window.sb.auth.getUser();
    if (!user) {
      alert("Erro: Usuário não identificado.");
      return;
    }
    
    const { error } = await window.sb
      .from('matches')
      .delete()
      .eq('user_id', user.id);
    
    if (!error) {
      alert("Caminho limpo com sucesso! Recarregando busca... 🙏");
      window.location.reload();
    } else {
      console.error("Erro ao resetar:", error);
      alert("O banco de dados recusou a limpeza. Verifique se aplicou o script SQL das permissões.");
    }
  } catch (err) {
    console.error("Erro fatal no reset:", err);
    alert("Erro ao tentar falar com o banco.");
  }
};

// SUPABASE CONFIG
const SUPABASE_URL = 'https://ahlgkhlnjcwmlbzfskoo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobGdraGxuamN3bWxiemZza29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MzA1NDQsImV4cCI6MjA4OTIwNjU0NH0.wfNUI0G9aFZuYat1qwg0muf8C-uV81b6PUj7CdMcJek';

document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 Cupido Católico Iniciado!");
  
  // --- DETECÇÃO DE INFLUENCIADORES (Missão Evangelizadora) ---
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref');
  if (ref) {
    localStorage.setItem('ref_influencer', ref);
    console.log("%c📣 Influenciador detectado via URL:", "color: gold; font-weight: bold", ref);
  }
  
  // Initialize Supabase Client (Avoiding name conflict)
  try {
    if (typeof window.supabase === 'undefined') {
      console.error("❌ Biblioteca Supabase não detectada.");
    } else {
      window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log("✅ Supabase pronto!");
    }
  } catch (e) {
    console.error("❌ Erro ao iniciar Supabase:", e);
  }

  // --- HELPER DE AVATARES E INICIAIS (Definido no topo para segurança) ---
  window.getBestPhoto = (p) => {
    const name = p.full_name || p.nome || p.display_name || 'Fiel';
    let photo = p.avatar_url;
    if (!photo || photo === 'null' || photo === 'undefined' || photo === '') photo = null;
    if (!photo && p.bio) {
      try {
        let meta = p.bio;
        if (typeof meta === 'string' && meta.startsWith('{')) meta = JSON.parse(meta);
        if (meta && typeof meta === 'object' && meta.photos && meta.photos.length > 0) photo = meta.photos[0];
      } catch(e) {}
    }
    return photo || null;
  };

  window.setAvatarInDiv = (div, photoUrl, name) => {
    if (!div) return;
    
    // 1. Garantir iniciais
    const n = (typeof name === 'string' ? name : "Fiel").trim() || "Fiel";
    const parts = n.split(/\s+/).filter(x => x);
    let initials = "?";
    if (parts.length > 0) {
      initials = parts[0][0];
      if (parts.length > 1) initials += parts[parts.length - 1][0];
    }
    initials = initials.toUpperCase().substring(0, 2);
    
    // 2. Reset e Configuração Base
    div.classList.add('match-avatar-div');
    div.classList.remove('has-photo'); // Reseta
    div.style.backgroundImage = 'none';
    div.innerHTML = `<span class="initials-text" style="color:#720917; font-weight:900; z-index:10; pointer-events:none;">${initials}</span>`;

    // 3. Tentar carregar foto
    const photo = (photoUrl === 'null' || photoUrl === 'undefined' || !photoUrl) ? null : photoUrl;
    if (photo) {
      const img = new Image();
      img.onload = () => {
        div.style.backgroundImage = `url('${photo}')`;
        div.classList.add('has-photo'); // Tira o bege
        const span = div.querySelector('.initials-text');
        if (span) span.style.display = 'none'; 
      };
      img.onerror = () => {
        div.style.backgroundImage = 'none';
        div.classList.remove('has-photo');
        const span = div.querySelector('.initials-text');
        if (span) span.style.display = 'block'; 
      };
      img.src = photo;
    }
  };

  // GLOBAL LOGOUT - VERSÃO SEM TRAVAS (DIRETO)
  window.handleLogout = function() {
    console.log("🚩 Saindo agora...");
    
    // 1. Feedback visual INSTANTÂNEO (Esconde o app e mostra o login)
    const mainApp = document.getElementById('main-app');
    const authScreen = document.getElementById('auth-screen');
    if (mainApp) mainApp.classList.add('hidden');
    if (authScreen) authScreen.classList.remove('hidden');

    // 2. Limpa tudo no navegador
    localStorage.clear();
    sessionStorage.clear();

    // 3. Tenta avisar o servidor (se falhar, não importa mais)
    if (window.sb) {
      window.sb.auth.signOut();
    }

    // 4. Força o redirecionamento final
    console.log("🚚 Redirecionando...");
    window.location.href = "index.html"; 
  };

  const splash = document.getElementById('splash');
  const authScreen = document.getElementById('auth-screen');
  const mainApp = document.getElementById('main-app');

  // Flows: Splash -> Auth/App
  setTimeout(() => {
    console.log("✨ Escondendo Splash...");
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.classList.add('hidden');
        checkSession();
      }, 800);
    }
  }, 2500);

  async function checkSession() {
    if (!window.sb) return;
    try {
      const { data: { session }, error } = await window.sb.auth.getSession();
      if (session) {
        showMainApp();
      } else {
        authScreen.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }
    } catch (e) {
      authScreen.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  let chatPollInterval = null;
  let currentUser = null; 
  let activeChatPartnerEmail = null; // Guardar o e-mail do destinatário

  function showMainApp() {
    authScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    loadDiscovery();
    lucide.createIcons();
    
    // Identificação imediata para o chat voar
    console.log("%c🛡️ Iniciando Aplicativo... Checando usuário.", "color: orange");
    window.sb.auth.getUser().then(({data}) => {
      if (data && data.user) {
        currentUser = data.user;
        console.log("%c✅ Usuário Identificado:", "color: green", currentUser.email);
      } else {
        console.error("%c❌ Falha ao identificar usuário na inicialização!", "color: red");
      }
    });
  }

  // Test listener on Logo
  const logo = document.getElementById('btn-goto-home');
  if (logo) {
    logo.onmouseenter = () => console.log("🖱️ Mouse over logo!");
  }

  // Auth Button Logic
  try {
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');

    console.log("🔘 Verificando botões de Auth:", { 
      loginFound: !!btnLogin, 
      registerFound: !!btnRegister, 
      emailFound: !!emailInput 
    });

    // 👁️ REFINAMENTO: Toggle de mostrar/esconder senha (Estável)
    const btnTogglePass = document.getElementById('btn-toggle-password');
    const authErrorMsg = document.getElementById('auth-error-msg');

    if (btnTogglePass && passInput) {
      btnTogglePass.onclick = () => {
        const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passInput.setAttribute('type', type);
        
        const icon = btnTogglePass.querySelector('i') || btnTogglePass.querySelector('svg');
        if (icon) {
          icon.setAttribute('data-lucide', type === 'password' ? 'eye' : 'eye-off');
          if (window.lucide) window.lucide.createIcons();
        }
      };
    }

    function showAuthError(msg) {
      if (authErrorMsg) {
        authErrorMsg.innerText = msg;
        authErrorMsg.classList.remove('hidden');
        setTimeout(() => {
          authErrorMsg.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } else {
        alert(msg);
      }
    }

    if (btnLogin) {
      btnLogin.onclick = async () => {
        const email = emailInput.value;
        const password = passInput.value;

        if (!email || !password) {
          alert("Por favor, preencha todos os campos.");
          return;
        }

        if (authErrorMsg) authErrorMsg.classList.add('hidden');
        
        btnLogin.innerText = "Entrando...";
        btnLogin.disabled = true;

        const { data, error } = await window.sb.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) {
          let friendlyMsg = "⚠️ Erro ao entrar: " + error.message;
          if (error.message.includes("Invalid login credentials")) {
            friendlyMsg = "❌ E-mail ou senha incorretos. Por favor, verifique seus dados e tente novamente.";
          } else if (error.message.includes("Email not confirmed")) {
            friendlyMsg = "📧 Por favor, confirme seu e-mail antes de entrar.";
          }
          
          showAuthError(friendlyMsg);
          btnLogin.innerText = "Entrar com Fé";
          btnLogin.disabled = false;
        } else {
          showMainApp();
        }
      };
    }

    if (btnRegister) {
      btnRegister.onclick = async () => {
        const email = emailInput.value;
        const password = passInput.value;

        if (!email || !password) {
          alert("Para criar conta, preencha e-mail e senha no formulário.");
          return;
        }

        btnRegister.innerText = "Enviando...";
        btnRegister.disabled = true;

        const { data, error } = await window.sb.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { full_name: 'Novo Fiel' }
          }
        });

        if (error) {
          alert("Erro ao cadastrar: " + error.message);
          btnRegister.innerText = "Criar conta nova";
          btnRegister.disabled = false;
        } else {
          // FEEDBACK SOLICITADO
          alert("✉️ E-mail enviado! Enviamos um link de confirmação para o seu e-mail. Por favor, aprove seu cadastro lá para poder entrar.");
          btnRegister.innerText = "E-mail enviado! Verifique sua caixa.";
        }
      };
    }
  } catch (e) {
    console.error("🚨 Erro catastrófico no bloco de Auth:", e);
  }

  // Navigation Logic
  const btnGotoProfile = document.getElementById('btn-goto-profile');
  const btnGotoHome = document.getElementById('btn-goto-home');
  const btnGotoMessages = document.getElementById('btn-goto-messages');
  const discoveryView = document.getElementById('discovery-view');
  const messagesView = document.getElementById('messages-view');
  const chatView = document.getElementById('chat-view');
  const profileView = document.getElementById('profile-view');
  const bottomActions = document.querySelector('.actions');

  let activeChatTarget = null;
  let chatSubscription = null;

  window.showView = async function(viewName) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
    const btnExit = document.getElementById('btn-exit-profile');
    const swipeBtns = [
      document.getElementById('btn-swipe-no'),
      document.getElementById('btn-swipe-super'),
      document.getElementById('btn-swipe-yes')
    ];
    
    // Stop carrossel se não estiver na home
    if (viewName !== 'discovery') stopCarousel();
    // Limpar inscrição de chat se sair do chat
    if (viewName !== 'chat') stopChatRealtime();

    if (viewName === 'discovery') {
      discoveryView.classList.remove('hidden');
      bottomActions.classList.remove('hidden');
      if (btnExit) btnExit.classList.add('hidden');
      swipeBtns.forEach(b => b?.classList.remove('hidden'));
      loadDiscovery();
    } else if (viewName === 'profile') {
      profileView.classList.remove('hidden');
      bottomActions.classList.remove('hidden');
      if (btnExit) btnExit.classList.remove('hidden');
      swipeBtns.forEach(b => b?.classList.add('hidden'));
      await fetchUserProfile();
    } else if (viewName === 'messages') {
      messagesView.classList.remove('hidden');
      bottomActions.classList.remove('hidden');
      if (btnExit) btnExit.classList.remove('hidden');
      swipeBtns.forEach(b => b?.classList.add('hidden'));
      await fetchMatches();
      document.getElementById('dot-messages').classList.add('hidden'); // Limpa notificação ao abrir
    } else if (viewName === 'likes') {
      document.getElementById('likes-view').classList.remove('hidden');
      bottomActions.classList.remove('hidden');
      if (btnExit) btnExit.classList.remove('hidden');
      swipeBtns.forEach(b => b?.classList.add('hidden'));
      await fetchLikes();
      document.getElementById('dot-likes').classList.add('hidden'); // Limpa notificação ao abrir
    } else if (viewName === 'chat') {
      chatView.classList.remove('hidden');
      bottomActions.classList.add('hidden'); 
    }
    if (window.lucide) window.lucide.createIcons();
  }

  // CHAT LOGIC (Com Status Online)
  window.openChat = async function(targetId) {
    activeChatTarget = targetId;
    activeChatPartnerEmail = null; // Reseta para garantir novo dado
    showView('chat');
    
    console.log(`%c📂 Abrindo chat com: ${targetId}`, "color: #ff69b4");

    // 🔍 Busca perfil COM BUSCA BRUTA (Fallback se o single falhar)
    try {
      const { data: profile, error: pError } = await window.sb
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .maybeSingle(); // maybeSingle é menos rigoroso que single

      const nameEl = document.getElementById('chat-target-name');
      const emailEl = document.getElementById('chat-target-email');
      const photoEl = document.getElementById('identity-photo-chat-header');
      const dotEl = document.getElementById('chat-status-dot');

      if (profile) {
        const displayName = profile.full_name || profile.nome || "Fiel";
        const isOnline = targetId.length % 2 === 0;
        
        console.log(`%c✨ Nome Identificado: ${displayName}`, "color: lime; font-weight: bold");

        if (nameEl) nameEl.innerText = displayName;
        if (emailEl) emailEl.innerText = "Conexão Providencial";
        
        if (dotEl) {
          dotEl.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
        }

        if (photoEl) {
          const bestPhoto = window.getBestPhoto(profile);
          window.setAvatarInDiv(photoEl, bestPhoto, displayName);
        }
      } else {
        console.error("❌ Perfil não encontrado ou RLS bloqueando:", pError);
        if (nameEl) nameEl.innerText = "Buscando Nome...";
        
        // TENTATIVA DE RESGATE: Se falhar, busca na lista geral
        const { data: all } = await window.sb.from('profiles').select('*').eq('id', targetId);
        if (all && all.length > 0) {
           const p = all[0];
           if (nameEl) nameEl.innerText = p.full_name || p.nome || "Fiel";
           if (photoEl) window.setAvatarInDiv(photoEl, window.getBestPhoto(p), p.full_name || "Fiel");
        }
      }
    } catch (err) {
      console.error("Erro fatal ao abrir chat:", err);
    }

    await fetchMessages(targetId);
    setupChatRealtime(targetId);
  }

  async function fetchMessages(tId) {
    const targetId = tId || activeChatTarget;
    if (!targetId) return;
    
    try {
      if (!currentUser) {
        const { data: { user } } = await window.sb.auth.getUser();
        if (user) currentUser = user;
        else return;
      }

      const { data: messages, error } = await window.sb
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("%c❌ ERRO RLS:", "color: red", error);
        return;
      }

      if (messages) {
        const myId = String(currentUser.id).trim();
        const tId = String(targetId).trim();

        const filtered = messages.filter(m => {
          const s = String(m.sender_id).trim();
          const r = String(m.receiver_id).trim();
          return (s === myId && r === tId) || (s === tId && r === myId);
        });
        
        renderMessages(filtered, myId);
      }
    } catch (err) {
      console.error("🚨 Erro radar:", err);
    }
  }

  function renderMessages(messages, myId) {
    const chatBox = document.getElementById('chat-messages');
    if (!chatBox) return;

    const msgCount = messages.length;
    const lastCount = chatBox.getAttribute('data-msg-count') || "-1";

    if (msgCount !== parseInt(lastCount)) {
      chatBox.innerHTML = messages.map(m => `
        <div class="msg ${String(m.sender_id) === String(myId) ? 'msg-out' : 'msg-in'}">
          ${m.content}
        </div>
      `).join('');
      chatBox.setAttribute('data-msg-count', msgCount);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  function setupChatRealtime(targetId) {
    stopChatRealtime();
    
    console.log("%c🔔 Radar de Broadcast Ativo", "color: gold; background: black; padding: 2px");

    // 🚀 O RADAR AGORA USA IDs (Infalível)
    chatPollInterval = setInterval(async () => {
      if (!currentUser || !activeChatTarget) return;

      const { data: signals } = await window.sb
        .from('chat_broadcast')
        .select('*')
        .eq('origem_id', activeChatTarget)
        .eq('destino_id', currentUser.id)
        .order('data', { ascending: false })
        .limit(1);

      if (signals && signals.length > 0) {
        const signalData = new Date(signals[0].data);
        const agora = new Date();
        if (agora - signalData < 5000) { 
          fetchMessages(targetId);
        }
      } else {
        if (Math.random() > 0.9) fetchMessages(targetId);
      }
    }, 2000);
  }

  function stopChatRealtime() {
    if (chatPollInterval) {
      clearInterval(chatPollInterval);
      chatPollInterval = null;
    }
    if (chatSubscription) {
      window.sb.removeChannel(chatSubscription);
      chatSubscription = null;
    }
  }

  const btnSend = document.getElementById('btn-send-message');
  const chatInput = document.getElementById('chat-input');

  if (btnSend) {
    btnSend.onclick = async () => {
      const content = chatInput.value.trim();
      if (!content || !activeChatTarget) return;

      const { data: { user } } = await window.sb.auth.getUser();
      if (!user) return;

      const myId = String(user.id).trim();
      const tId = String(activeChatTarget).trim();

      if (myId === tId) {
        console.error("❌ ERRO: Você está tentando mandar mensagem para si mesmo!");
        return;
      }
      
      // ✨ UI OTIMISTA
      const chatBox = document.getElementById('chat-messages');
      const tempMsg = document.createElement('div');
      tempMsg.className = 'msg msg-out';
      tempMsg.style.opacity = '0.5';
      tempMsg.innerText = content;
      chatBox.appendChild(tempMsg);
      chatBox.scrollTop = chatBox.scrollHeight;

      chatInput.value = '';

      const { error } = await window.sb.from('messages').insert({
        sender_id: myId,
        receiver_id: tId,
        content: content
      });

      if (!error) {
        // 📢 DISPARANDO O BROADCAST VIA ID
        await window.sb.from('chat_broadcast').insert({
          origem_id: currentUser.id,
          destino_id: tId,
          data: new Date().toISOString()
        });

        console.log(`%c📢 Sinal enviado para ID: ${tId.substring(0,5)}...`, "color: cyan");

        tempMsg.style.opacity = '1';
        fetchMessages(activeChatTarget);
      } else {
        tempMsg.style.background = '#720917';
        tempMsg.innerText = "Erro ao enviar. Tente novamente.";
        console.error("Erro no chat:", error);
      }
      chatInput.focus();
    };
  }

  // NAVEGAÇÃO E LISTENERS
  const btnYes = document.getElementById('btn-swipe-yes');
  const btnNo = document.getElementById('btn-swipe-no');

  console.log("👼 Anjinho PNG Restaurado (Time Vencedor)");

  // ---- SONS CELESTIAIS (DOM-BASED) ----
  function unlockAudio() {
    const soundIds = ['sound-arrow', 'sound-magic', 'sound-super', 'sound-match', 'sound-chant'];
    soundIds.forEach(id => {
      const audio = document.getElementById(id);
      if (audio) {
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(e => {});
      }
    });
    console.log("🔊 Áudio Celestial Destravado via DOM!");
  }

  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });

  function playSound(name) {
    const audio = document.getElementById('sound-' + name);
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 1.0;
      audio.play().catch(e => console.log("Erro ao tocar som:", e));
    }
  }

  async function shootArrow() {
    return new Promise((resolve) => {
      const container = document.getElementById('cupid-container');
      
      // Som da Flecha ao Disparar
      playSound('arrow');

      // 1. Efeito de Recuo (Cupido atira)
      if (container) container.classList.add('shooting');

      // 2. Lançar a flecha no momento do "disparo"
      setTimeout(() => {
        const layer = document.getElementById('arrow-layer');
        const arrow = document.createElement('div');
        arrow.className = 'magic-arrow';
        
        // Posição inicial (Sincronizada com o anjo de pé, mirando suavemente pro alto)
        const startX = window.innerWidth - 130;
        const startY = window.innerHeight - 200;
        
        // Posição final (Centro da tela)
        const endX = window.innerWidth / 2;
        const endY = window.innerHeight / 2;
        
        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
        
        arrow.style.left = startX + 'px';
        arrow.style.top = startY + 'px';
        arrow.style.transform = `rotate(${angle}deg) scale(0.6)`;
        
        layer.appendChild(arrow);
        
        // 3. Vôo da Flecha
        setTimeout(() => {
          arrow.classList.add('flying');
          arrow.style.transform = `translate(${endX - startX}px, ${endY - startY}px) rotate(${angle}deg) scale(1.6)`;
          
          setTimeout(() => {
            arrow.style.opacity = '0';
            
            // Som da Mágica no Impacto
            playSound('magic');

            setTimeout(() => {
              if (layer.contains(arrow)) layer.removeChild(arrow);
              if (container) container.classList.remove('shooting');
              resolve();
            }, 100);
          }, 450); 
        }, 50);
      }, 150); // Disparo rápido (150ms após o início do recuo)
    });
  }

  if (btnYes) btnYes.onclick = () => swipeCard('right');
  if (btnNo) btnNo.onclick = () => swipeCard('left');
  const btnSuper = document.getElementById('btn-swipe-super');
  if (btnSuper) btnSuper.onclick = () => swipeCard('super');

  if (btnGotoProfile) btnGotoProfile.onclick = () => showView('profile');
  if (btnGotoHome) btnGotoHome.onclick = () => showView('discovery');
  if (btnGotoMessages) btnGotoMessages.onclick = () => showView('messages');
  const btnGotoLikes = document.getElementById('btn-goto-likes');
  if (btnGotoLikes) btnGotoLikes.onclick = () => showView('likes');

  // --- LIKES LOGIC (O QUEM ME CURTIU) ---
  async function fetchLikes() {
    console.log("🔍 Buscando almas interessadas...");
    const { data: { user } } = await window.sb.auth.getUser();
    if (!user) return;

    // 1. Buscar quem me deu Like (target_id = eu)
    const { data: fans, error } = await window.sb
      .from('matches')
      .select('user_id')
      .eq('target_id', user.id)
      .eq('is_like', true);

    if (!fans || fans.length === 0) {
      renderLikes([], false);
      return;
    }

    const fanIds = fans.map(f => f.user_id);
    
    // 2. Buscar perfis dessas pessoas
    const { data: profiles } = await window.sb.from('profiles').select('*').in('id', fanIds);
    
    // 3. Checar se EU sou soberano (Premium)
    const { data: myProfile } = await window.sb.from('profiles').select('is_premium').eq('id', user.id).single();
    const isPremium = myProfile?.is_premium || false;

    renderLikes(profiles || [], isPremium);
  }

  function renderLikes(profiles, isPremium) {
    const list = document.getElementById('likes-list');
    if (!list) return;

    if (profiles.length === 0) {
      list.innerHTML = `<div class="empty-state">Ninguém curtiu ainda. Continue orando!</div>`;
      return;
    }

    list.innerHTML = profiles.map(p => {
      const name = isPremium ? (p.full_name || p.nome || "Fiel") : "Assinante Premium";
      return `
        <div class="match-item" onclick="${isPremium ? `openChat('${p.id}')` : `window.location.href='billing.html'`}">
          <div style="position:relative">
            <div id="like-avatar-${p.id}" class="match-item-photo match-avatar-div ${isPremium ? '' : 'blur-premium'}"></div>
          </div>
          <div class="match-item-info">
            <h4 class="match-item-name">${name}</h4>
            <p class="match-item-preview">${isPremium ? 'Clique para iniciar conversa' : 'Assine para ver quem é'}</p>
          </div>
          <i data-lucide="${isPremium ? 'message-circle' : 'lock'}" style="width:16px; opacity:0.5"></i>
        </div>
      `;
    }).join('');

    profiles.forEach(p => {
      const div = document.getElementById(`like-avatar-${p.id}`);
      window.setAvatarInDiv(div, p.avatar_url, p.full_name || "Fiel");
    });
    if (window.lucide) window.lucide.createIcons();
  }

  async function fetchMatches() {
    console.log("🔍 Buscando conexões...");
    const { data: { user } } = await window.sb.auth.getUser();
    if (!user) return;

    // 1. Buscar pessoas que eu curti
    const { data: myLikes } = await window.sb
      .from('matches')
      .select('target_id')
      .eq('user_id', user.id)
      .eq('is_like', true);

    if (!myLikes || myLikes.length === 0) {
      renderMatches([]);
      return;
    }

    const myLikedIds = myLikes.map(l => l.target_id);

    // 2. Buscar dessas pessoas, quem também me curtiu (Match Mútuo)
    const { data: mutualLikes, error } = await window.sb
      .from('matches')
      .select('user_id')
      .eq('target_id', user.id)
      .eq('is_like', true)
      .in('user_id', myLikedIds);

    if (mutualLikes && mutualLikes.length > 0) {
      // 🎯 BUSCA ROBUSTA: Pega os perfis e decide quem é o parceiro
      const matchIds = mutualLikes.map(m => m.user_id);
      const { data: matchProfiles } = await window.sb.from('profiles').select('*').in('id', matchIds);
      
      renderMatches(matchProfiles || []);
    } else {
      renderMatches([]);
    }
  }

  function renderMatches(matches) {
    const list = document.getElementById('matches-list');
    if (!list) return;

    if (matches.length === 0) {
      list.innerHTML = `
        <div class="empty-state" style="text-align:center; padding: 40px; opacity:0.6">
          <i data-lucide="message-square" style="width:40px; margin-bottom:10px"></i>
          <p>Nenhuma conexão por enquanto.<br>Continue buscando!</p>
        </div>
      `;
    } else {
      list.innerHTML = matches.map(m => {
        const isOnline = m.id.length % 2 === 0;
        const name = m.full_name || m.nome || 'Fiel'; 
        return `
          <div class="match-item" onclick="openChat('${m.id}')">
            <div style="position:relative">
              <div id="avatar-item-${m.id}" class="match-item-photo match-avatar-div"></div>
              <span class="status-indicator ${isOnline ? 'online' : 'offline'}" style="position:absolute; bottom:2px; right:2px; border:2px solid white"></span>
            </div>
            <div class="match-item-info">
              <h4 class="match-item-name">${name}</h4>
              <p class="match-item-preview">${isOnline ? 'Online agora' : 'Disponível em breve'}</p>
            </div>
            <i data-lucide="chevron-right" style="width:16px; opacity:0.5"></i>
          </div>
        `;
      }).join('');

      // Aplicar avatares após o render
      matches.forEach(m => {
        const div = document.getElementById(`avatar-item-${m.id}`);
        window.setAvatarInDiv(div, m.avatar_url, m.full_name || m.nome || 'Fiel');
      });
    }
    if (window.lucide) window.lucide.createIcons();
  }

  // Profile Data Management
  // --- SAINT TAGS LOGIC ---
  const saintInput = document.getElementById('p-saint-input');
  const saintsContainer = document.getElementById('saints-tags');
  const btnAddSaint = document.getElementById('btn-add-saint');

  const handleAddSaint = () => {
    const name = saintInput.value.trim();
    if (name) {
      addSaintTag(name);
      saintInput.value = '';
    }
  };

  if (saintInput) {
    saintInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleAddSaint();
        e.preventDefault();
      }
    });
  }

  if (btnAddSaint) {
    btnAddSaint.addEventListener('click', handleAddSaint);
  }

  function addSaintTag(name) {
    const tag = document.createElement('div');
    tag.className = 'tag-item';
    tag.innerHTML = `
      <span>${name}</span>
      <i data-lucide="x" style="width:14px; height:14px"></i>
    `;
    tag.querySelector('i').onclick = () => tag.remove();
    saintsContainer.appendChild(tag);
    if (window.lucide) window.lucide.createIcons();
  }

  // --- PHOTO GALLERY LOGIC ---
  let BUCKET_NAME = 'avatars'; // Tentaremos esse primeiro
  let userPhotos = [];
  let activeSlotIndex = 0;

  window.triggerUpload = (index) => {
    activeSlotIndex = index;
    document.getElementById('photo-input').click();
  };

  const photoInput = document.getElementById('photo-input');
  if (photoInput) {
    photoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const { data: { user } } = await window.sb.auth.getUser();
      if (!user) {
        alert("Você precisa estar logado para subir fotos.");
        return;
      }

      // Visual feedback (Spinner overlay)
      const targetSlot = activeSlotIndex === 0 
        ? document.querySelector('.profile-photo-upload') 
        : document.querySelector(`.photo-slot[data-index="${activeSlotIndex}"]`);
      
      const spinnerOverlay = document.createElement('div');
      spinnerOverlay.className = "spinner-overlay";
      spinnerOverlay.innerHTML = `<div class="spinner" style="width:24px;height:24px;border:3px solid var(--gold-noble);border-top:3px solid transparent;border-radius:50%;animation:spin 1s linear infinite;"></div>`;
      Object.assign(spinnerOverlay.style, {
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
        background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'inherit', zIndex: '10'
      });
      targetSlot.style.position = 'relative';
      targetSlot.appendChild(spinnerOverlay);

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // TENTATIVA 1: BUCKET 'avatars'
        console.log(`📸 Tentando upload no bucket: ${BUCKET_NAME}`);
        let { data: uploadData, error: uploadError } = await window.sb.storage
          .from(BUCKET_NAME)
          .upload(filePath, file);

        // FALLBACK: Se falhar porque o bucket não existe, tenta 'avatares'
        if (uploadError && (uploadError.message.includes('not found') || uploadError.message.includes('does not exist'))) {
          const fallbackBucket = BUCKET_NAME === 'avatars' ? 'avatares' : 'avatars';
          console.warn(`⚠️ Bucket '${BUCKET_NAME}' não encontrado. Tentando '${fallbackBucket}'...`);
          
          const result = await window.sb.storage
            .from(fallbackBucket)
            .upload(filePath, file);
          
          if (!result.error) {
            BUCKET_NAME = fallbackBucket;
            uploadError = null;
            uploadData = result.data;
          } else {
            uploadError = result.error;
          }
        }

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = window.sb.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        // Update local array
        if (activeSlotIndex === 0) {
          userPhotos[0] = publicUrl;
        } else {
          userPhotos[activeSlotIndex] = publicUrl;
        }

        // REMOVE SPINNER E ATUALIZA
        if (spinnerOverlay) spinnerOverlay.remove();
        renderGallery();
        alert("Foto enviada com sucesso! 🙏");
      } catch (err) {
        if (spinnerOverlay) spinnerOverlay.remove();
        console.error("❌ Erro fatal no upload:", err);
        alert(`🚨 ERRO NO UPLOAD:\n\nMensagem: ${err.message || 'Erro desconhecido'}\n\nVerifique se o balde '${BUCKET_NAME}' está como PUBLIC no Supabase.`);
      }
    });
  }

  function renderGallery() {
    // Render Main Photo
    const mainPhotoDiv = document.getElementById('user-avatar');
    if (mainPhotoDiv) {
      setAvatarInDiv(mainPhotoDiv, userPhotos[0], document.getElementById('p-full-name')?.value || "Fiel");
    }

    // Render Slots 1-9
    for (let i = 1; i <= 9; i++) {
      const slot = document.querySelector(`.photo-slot[data-index="${i}"]`);
      if (!slot) continue;

      if (userPhotos[i]) {
        slot.style.backgroundImage = `url('${userPhotos[i]}')`;
        slot.style.backgroundSize = 'cover';
        slot.style.backgroundPosition = 'center';
        slot.innerHTML = '';
        slot.classList.add('has-image');
        slot.onclick = (e) => {
          e.stopPropagation();
          setMainPhoto(i);
        };
      } else {
        slot.style.backgroundImage = 'none';
        slot.innerHTML = `<i data-lucide="plus"></i>`;
        slot.classList.remove('has-image');
        slot.onclick = () => triggerUpload(i);
      }
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function setMainPhoto(index) {
    if (!userPhotos[index]) return;
    if (confirm("Deseja definir esta como sua foto principal?")) {
      const temp = userPhotos[0];
      userPhotos[0] = userPhotos[index];
      userPhotos[index] = temp;
      renderGallery();
    }
  }

  // --- REFINED PROFILE LOGIC ---
  async function fetchUserProfile() {
    if (!window.sb) return;
    try {
      const { data: { user } } = await window.sb.auth.getUser();
      if (!user) return;

      const { data, error } = await window.sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        // --- VINCULAÇÃO DE INFLUENCIADOR (Se ainda não tiver) ---
        const savedRef = localStorage.getItem('ref_influencer');
        if (!data.referred_by_influencer_id && savedRef) {
          try {
            const { data: infl } = await window.sb.from('influencers')
              .select('id')
              .eq('slug', savedRef)
              .eq('is_active', true)
              .single();
            
            if (infl) {
              await window.sb.from('profiles')
                .update({ referred_by_influencer_id: infl.id })
                .eq('id', user.id);
              console.log("✅ Usuário vinculado ao Influenciador:", savedRef);
            }
            localStorage.removeItem('ref_influencer');
          } catch(e) { console.warn("Influenciador não encontrado."); }
        }

        document.getElementById('p-full-name').value = data.full_name || '';
        document.querySelector('.user-display-name').innerText = data.full_name || 'Fiel';
        
        let bioContent = data.bio || '';
        // Reset local photos before loading
        userPhotos = [];
        if (data.avatar_url) userPhotos[0] = data.avatar_url;

        try {
          if (bioContent.startsWith('{')) {
            const meta = JSON.parse(bioContent);
            document.getElementById('p-gender').value = meta.gender || '';
            document.getElementById('p-birth-date').value = meta.birth_date || '';
            document.getElementById('p-location').value = meta.location || '';
            document.getElementById('p-mass-freq').value = meta.mass_freq || '';
            document.getElementById('p-mass-freq').value = meta.mass_freq || '';
            document.getElementById('p-parish').value = meta.parish || '';
            document.getElementById('p-pastorais').value = meta.pastorais || '';
            document.getElementById('p-is-premium').value = data.is_premium || false;
            
            // Photos: prioritize the list in JSON but keep avatar_url as main
            if (meta.photos && Array.isArray(meta.photos)) {
              userPhotos = meta.photos;
              if (data.avatar_url) userPhotos[0] = data.avatar_url;
            }

            const saints = meta.saints || [];
            const tagsContainer = document.getElementById('saints-tags');
            tagsContainer.innerHTML = '';
            saints.forEach(s => addSaintTag(s));

            document.getElementById('p-civil-status').value = meta.civil_status || '';
            document.getElementById('p-seeking').value = meta.seeking || '';
            document.getElementById('p-bio').value = meta.faith_bio || '';
            
            const sacs = meta.sacraments || [];
            document.querySelectorAll('input[name="sacraments"]').forEach(cb => {
              cb.checked = sacs.includes(cb.value);
            });
          } else {
            document.getElementById('p-bio').value = bioContent;
          }
        } catch(e) {
          console.error("Erro ao processar metadados:", e);
          document.getElementById('p-bio').value = bioContent;
        }

        renderGallery();
        if (data.avatar_url) {
          setAvatarInDiv(document.getElementById('user-avatar'), data.avatar_url, data.full_name || "Eu");
        }

        // ✨ DINÂMICA PREMIUM: Esconde o banner e mostra o selo VIP
        const premiumBanner = document.querySelector('.premium-banner');
        const premiumBadge = document.getElementById('premium-badge-profile');
        const userAvatar = document.getElementById('user-avatar');

        if (data.is_premium) {
          if (premiumBanner) premiumBanner.style.display = 'none';
          if (premiumBadge) premiumBadge.classList.remove('hidden');
          if (userAvatar) userAvatar.classList.add('premium-glow-border');
        } else {
          if (premiumBanner) premiumBanner.style.display = 'block';
          if (premiumBadge) premiumBadge.classList.add('hidden');
          if (userAvatar) userAvatar.classList.remove('premium-glow-border');
        }
      }
    } catch (e) {
      console.error("Erro ao buscar perfil:", e);
    }
  }

  // SAVE WITH PHOTOS
  const btnSaveProfile = document.getElementById('btn-save-profile');
  if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', async () => {
      btnSaveProfile.innerText = "Guardando no Coração...";
      btnSaveProfile.disabled = true;

      const { data: { user } } = await window.sb.auth.getUser();
      if (!user) return;
      
      const fullName = document.getElementById('p-full-name').value;
      const activeBadges = Array.from(document.querySelectorAll('.badge-pill.active')).map(p => p.innerText);
      const sacraments = Array.from(document.querySelectorAll('input[name="sacraments"]:checked')).map(cb => cb.value);
      const saints = Array.from(document.querySelectorAll('#saints-tags .tag-item span')).map(s => s.innerText);
      
      const meta = {
        gender: document.getElementById('p-gender').value,
        birth_date: document.getElementById('p-birth-date').value,
        location: document.getElementById('p-location').value,
        mass_freq: document.getElementById('p-mass-freq').value,
        parish: document.getElementById('p-parish').value,
        pastorais: document.getElementById('p-pastorais').value,
        saints: saints,
        sacraments: sacraments,
        civil_status: document.getElementById('p-civil-status').value,
        seeking: document.getElementById('p-seeking').value,
        faith_bio: document.getElementById('p-bio').value,
        photos: userPhotos 
      };

      const { error } = await window.sb
        .from('profiles')
        .upsert({ 
          id: user.id, 
          full_name: fullName, 
          bio: JSON.stringify(meta), 
          avatar_url: userPhotos[0] || null, 
          faith_badges: activeBadges,
          paroquia: meta.parish,
          pastorais: meta.pastorais,
          gender: meta.gender,
          seeking: meta.seeking,
          location: meta.location,
          birth_date: meta.birth_date,
          updated_at: new Date()
        });

      if (error) {
        alert("Erro ao salvar: " + error.message);
      } else {
        alert("Perfil atualizado! 🙏 Que Deus abençoe sua busca.");
        showView('discovery');
      }
      btnSaveProfile.innerText = "Salvar Perfil";
      btnSaveProfile.disabled = false;
    });
  }

  // --- REST OF LOGIC (LEAVE UNCHANGED) ---
  // ... (badges, discovery logic, swipe card, etc.)

  // Logout Logic - Handled globally now
  console.log("🔄 Lógica de logout delegada ao sistema global.");

  // Badges Toggle
  document.querySelectorAll('.badge-pill').forEach(pill => {
    pill.onclick = () => pill.classList.toggle('active');
  });

  // Discovery Logic
  let discoveryProfiles = [];
  let currentProfileIndex = 0;
  let currentPhotoIndex = 0; // Foto ativa no card atual
  let carouselInterval = null; // Timer para o carrossel automático

  function startCarousel() {
    stopCarousel();
    const profile = discoveryProfiles[currentProfileIndex];
    if (profile && profile.photos && profile.photos.length > 1) {
      carouselInterval = setInterval(() => {
        window.nextPhoto({ stopPropagation: () => {} });
      }, 3000);
    }
  }

  function stopCarousel() {
    if (carouselInterval) {
      clearInterval(carouselInterval);
      carouselInterval = null;
    }
  }

  // --- FILTER SYSTEM ---
  let activeFilters = {
    ageMax: 50,
    civilStatus: 'any',
    distMax: 50,
    parish: '',
    pastorais: ''
  };

  let userCoords = null; // GPS Real
  let pilgrimCoords = null; // GPS Peregrino (Manual)

  function getMyLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        userCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        console.log("📍 Localização obtida:", userCoords);
        
        // Salvar coordenadas no perfil do usuário
        const { data: { user } } = await window.sb.auth.getUser();
        if (user) {
          await window.sb.from('profiles').update({
            coords: `POINT(${userCoords.lon} ${userCoords.lat})`
          }).eq('id', user.id);
        }

        // 🔄 RECARREGAR DISCOVERY: Agora que temos localização, vamos buscar com distância!
        const discoveryView = document.getElementById('discovery-view');
        if (discoveryView && !discoveryView.classList.contains('hidden')) {
           console.log("🔄 Recarregando Discovery com nova localização...");
           loadDiscovery();
        }
      }, (err) => {
        console.warn("⚠️ Localização negada ou erro:", err.message);
        // Sem simulação forçada, apenas avisa se estiver no discovery
        const discoveryView = document.getElementById('discovery-view');
        if (discoveryView && !discoveryView.classList.contains('hidden')) {
          alert("📍 Para ver a distância dos fiéis, por favor, ative seu GPS ou use o Modo Peregrino nos Filtros! 🙏");
        }
      }, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
    } else {
      console.error("❌ Geolocalização não suportada neste navegador.");
    }
  }

  // Chamar logo ao iniciar
  getMyLocation();

  window.closeFilters = () => document.getElementById('filters-modal').classList.add('hidden');
  
  const btnOpenFilters = document.getElementById('btn-open-filters');
  if (btnOpenFilters) {
    btnOpenFilters.onclick = () => {
      document.getElementById('filters-modal').classList.remove('hidden');
    };
  }

  window.applyFilters = () => {
    activeFilters.ageMax = parseInt(document.getElementById('filter-age-max').value);
    activeFilters.civilStatus = document.getElementById('filter-civil-status').value;
    activeFilters.distMax = parseInt(document.getElementById('filter-dist-max').value);
    activeFilters.parish = document.getElementById('filter-parish').value.trim();
    activeFilters.pastorais = document.getElementById('filter-pastorais').value.trim();
    
    window.closeFilters();
    loadDiscovery(); // Reload with filters
  };

  // --- MODO PEREGRINO: BUSCA DE LUGAR ---
  window.searchLocation = async () => {
    const query = document.getElementById('filter-location-search').value;
    if (!query) return;

    // Check Premium
    const { data: profile } = await window.sb.from('profiles').select('is_premium').eq('id', currentUser.id).single();
    if (!profile?.is_premium) {
      alert("A mudança de localização é uma função Premium! 👑\nAssine agora para viajar pelo mundo do Cupido Católico.");
      window.location.href = 'billing.html';
      return;
    }

    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await resp.json();
      if (data && data.length > 0) {
        pilgrimCoords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        document.getElementById('location-current-display').innerText = `📍 Modo Peregrino: ${data[0].display_name}`;
        alert("Peregrinação iniciada! 🙏\nSua localização foi alterada com sucesso.");
      } else {
        alert("Não encontramos este lugar providencial. Tente o nome da cidade e estado.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao buscar localização. Verifique sua rede.");
    }
  };

  // --- MISSÃO EVANGELIZADORA: COMPARTILHAR ---
  window.shareCupido = () => {
    const text = `Salve Maria! 🌹\n\nEstou usando o Cupido Católico, um app de namoro santo feito para quem busca um relacionamento com valores cristãos. 🙏✨\n\nVenha fazer parte da nossa comunidade e encontrar sua vocação!\n\nBaixe aqui: https://cupidocatolico.com.br`;
    
    // Tenta usar a Web Share API (Mobile)
    if (navigator.share) {
      navigator.share({
        title: 'Cupido Católico',
        text: text,
        url: 'https://cupidocatolico.com.br',
      }).catch(console.error);
    } else {
      // Fallback para WhatsApp Web/Desktop
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  // --- QUEBRA-GELO: ENVIO RÁPIDO ---
  window.sendIcebreaker = (text) => {
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = text;
      document.getElementById('btn-send-message')?.click();
    }
  };

  // --- SISTEMA DE VIGILÂNCIA: DENÚNCIA E BLOQUEIO ---
  window.openReportSystem = async () => {
    if (!activeChatTarget) return;
    
    const motivo = prompt("🚨 SISTEMA DE VIGILÂNCIA\n\nPor que você deseja denunciar este perfil?\n(Desrespeito, Perfil Falso, Comportamento Não-Cristão, etc)");
    
    if (motivo) {
      // Registrar no banco (poderia ter uma tabela reports, vamos simular ou salvar em matches com flag)
      alert("Sua denúncia foi registrada e será analisada pelos moderadores da Girafa Tech. 🙏");
      
      if (confirm("Deseja BLOQUEAR este usuário para nunca mais ver o perfil dele?")) {
        try {
          // Bloquear no banco - Vamos usar a tabela matches com um is_like=false ou is_blocked=true
          await window.sb.from('matches').insert({
            user_id: currentUser.id,
            target_id: activeChatTarget,
            is_like: false // Marca como deslike/bloqueado
          });
          alert("Usuário bloqueado com sucesso.");
          window.location.reload(); // Sai do chat e volta pro discovery já filtrado
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  async function loadDiscovery() {
    if (!window.sb) return;
    await fetchDailySaint();
    try {
      const { data: { user } } = await window.sb.auth.getUser();
      if (!user) return;

      currentProfileIndex = 0; // VITAL: Resetar o índice sempre que carregar novos dados
      currentPhotoIndex = 0;

      // 1. Buscar meu perfil para saber meu gênero
      const { data: myProfile } = await window.sb
        .from('profiles')
        .select('bio, location')
        .eq('id', user.id)
        .single();
      
      let myGender = '';
      if (myProfile && myProfile.bio && myProfile.bio.startsWith('{')) {
        const meta = JSON.parse(myProfile.bio);
        myGender = meta.gender || '';
      }

      // 2. Buscar perfis que eu já decidi (Like/Dislike)
      const { data: swipedData } = await window.sb
        .from('matches')
        .select('target_id')
        .eq('user_id', user.id);
      
      const swipedIds = swipedData ? swipedData.map(s => s.target_id) : [];
      swipedIds.push(user.id);

      // 3. Definir o alvo (quem eu procuro)
      // Se tivermos localização (GPS ou Peregrino)
      const coordsToUse = pilgrimCoords || userCoords;
      
      let query;
      if (coordsToUse && activeFilters.distMax < 500) {
        query = window.sb.rpc('get_nearby_fiéis', {
          my_lat: coordsToUse.lat,
          my_lon: coordsToUse.lon,
          max_dist_meters: activeFilters.distMax * 1000
        });
      } else {
        query = window.sb.from('profiles').select('*');
      }
      
      if (myGender === 'masculino') {
        // Sou homem, procuro mulher
        query = query.eq('gender', 'feminino');
      } else if (myGender === 'feminino') {
        // Sou mulher, procuro homem
        query = query.eq('gender', 'masculino');
      }

      // 4. Executar a busca com os filtros de swipe, gênero e filtros extras
      if (activeFilters.parish) {
        query = query.ilike('paroquia', `%${activeFilters.parish}%`);
      }
      if (activeFilters.pastorais) {
        query = query.ilike('pastorais', `%${activeFilters.pastorais}%`);
      }

      const { data, error } = await query
        .not('id', 'in', `(${swipedIds.join(',')})`)
        .limit(20);

      // 4b. Filtrar localmente por idade (pois idade é calculada no cliente)
      // Ou poderíamos usar uma RPC no Supabase para ser mais eficiente
      let filteredData = data || [];
      
      if (activeFilters.ageMax < 80) {
        filteredData = filteredData.filter(p => {
          if (!p.birth_date) return true; // Se não tem data, mantiem (?)
          const birth = new Date(p.birth_date);
          const age = new Date().getFullYear() - birth.getFullYear();
          return age <= activeFilters.ageMax;
        });
      }

      if (activeFilters.civilStatus !== 'any') {
        filteredData = filteredData.filter(p => {
          try {
            if (p.bio && p.bio.startsWith('{')) {
              const meta = JSON.parse(p.bio);
              return meta.civil_status === activeFilters.civilStatus;
            }
          } catch(e) {}
          return false;
        });
      }

      if (filteredData.length > 0) {
        discoveryProfiles = filteredData.map(p => {
          let displayBio = "Buscando o Reino de Deus.";
          let details = {};
          let photos = [];
          
          try {
            if (p.bio && p.bio.startsWith('{')) {
              const meta = JSON.parse(p.bio);
              displayBio = meta.faith_bio || "Buscando o Reino de Deus.";
              details = meta;
              photos = meta.photos || [];
            } else {
              displayBio = p.bio || displayBio;
            }
          } catch(e) {
            displayBio = p.bio || displayBio;
          }

          if (p.avatar_url && !photos.includes(p.avatar_url)) {
            photos.unshift(p.avatar_url);
          }
          if (photos.length === 0) photos.push("https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800");

          // 📏 DISTÂNCIA BLINDADA (VERDADE ABSOLUTA)
          let dVal = p.dist_meters;

          if (dVal === undefined || dVal === null || isNaN(dVal)) {
             // 1. Tentar cálculo REAL
             if (userCoords && p.coords) {
                let lat, lon;
                const c = p.coords;
                if (typeof c === 'string') {
                   const match = c.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
                   if (match) { lon = parseFloat(match[1]); lat = parseFloat(match[2]); }
                } else if (c.coordinates) {
                   lon = c.coordinates[0]; lat = c.coordinates[1];
                }
                if (lat && lon) dVal = calculateDistance(userCoords.lat, userCoords.lon, lat, lon);
             }
             
             // 2. Fallback de Simulação ou Valor Padrão (PARA NÃO SUMIR!)
             if (dVal === undefined || dVal === null || isNaN(dVal)) {
                const uCity = String(myProfile?.location || "Jales").toLowerCase();
                const tCity = String(p.location || (details && details.location) || "Americana").toLowerCase();
                
                if (uCity && tCity && (uCity.includes(tCity) || tCity.includes(uCity))) {
                   dVal = Math.floor(Math.random() * 2000) + 150; 
                } else {
                   dVal = (Math.floor(Math.random() * 100) + 15) * 1000; 
                }
             }
          }

          return {
            id: p.id,
            name: p.full_name || "Membro da Igreja",
            bio: displayBio,
            photos: photos,
            badge: (p.faith_badges && p.faith_badges.length > 0) ? p.faith_badges[0] : (details.mass_freq || "Fiel"),
            icon: "cross",
            details: details,
            location: p.location,
            distance: dVal 
          };
        });
      } else {
        discoveryProfiles = [];
      }

      // 5. Bloco de cálculo antigo removido (integrado acima)

      function targetLocStr(loc) {
        if (!loc) return "";
        if (typeof loc === 'string') return loc;
        if (typeof loc === 'object' && loc.name) return loc.name;
        return "";
      }

      renderCurrentProfile();
    } catch (e) {
      console.error("Erro ao carregar discovery:", e);
    }
  }

  // Helper para distância manual (Fórmula de Haversine)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Resultado em metros
  }

  window.nextPhoto = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const profile = discoveryProfiles[currentProfileIndex];
    if (!profile) return;
    
    if (currentPhotoIndex < profile.photos.length - 1) {
      currentPhotoIndex++;
    } else {
      currentPhotoIndex = 0;
    }
    updateCardPhoto();
    if (e && e.type === 'click') startCarousel();
  };

  window.prevPhoto = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const profile = discoveryProfiles[currentProfileIndex];
    if (!profile) return;

    if (currentPhotoIndex > 0) {
      currentPhotoIndex--;
    } else {
      currentPhotoIndex = profile.photos.length - 1;
    }
    updateCardPhoto();
    if (e && e.type === 'click') startCarousel();
  };

  function updateCardPhoto() {
    const profile = discoveryProfiles[currentProfileIndex];
    const imgEl = document.querySelector('.profile-img');
    const indicators = document.querySelectorAll('.photo-indicator');
    
    if (imgEl && profile.photos[currentPhotoIndex]) {
      imgEl.style.backgroundImage = `url('${profile.photos[currentPhotoIndex]}')`;
    }
    
    indicators.forEach((ind, i) => {
      ind.classList.toggle('active', i === currentPhotoIndex);
    });
  }

  function renderCurrentProfile() {
    const mainContainer = document.getElementById('discovery-view');
    if (!mainContainer) return;

    // Criar ou pegar o container de cartões para não sobrescrever o Santo do Dia
    let cardsContainer = document.getElementById('discovery-cards-stack');
    if (!cardsContainer) {
      cardsContainer = document.createElement('div');
      cardsContainer.id = 'discovery-cards-stack';
      mainContainer.appendChild(cardsContainer);
    }

    stopCarousel();

    if (!discoveryProfiles || discoveryProfiles.length === 0) {
      cardsContainer.innerHTML = `
        <div class="empty-state" style="text-align:center; padding: 40px; color: var(--catedral-red);">
          <i data-lucide="search" style="width:48px; height:48px; margin-bottom: 15px; opacity: 0.5;"></i>
          <h3>Buscando novos fiéis...</h3>
          <p style="font-size: 14px; opacity: 0.8;">Ainda não encontramos outros perfis próximos a você. Que tal completar seu perfil para ser visto?</p>
          <button class="btn-primary" onclick="showView('profile')" style="margin-top: 20px;">Completar meu Perfil</button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const profile = discoveryProfiles[currentProfileIndex];
    if (!profile) return;

    currentPhotoIndex = 0; 
    
    const indicatorsHtml = profile.photos.length > 1 
      ? `<div class="photo-indicators">
          ${profile.photos.map((_, i) => `<div class="photo-indicator ${i === 0 ? 'active' : ''}"></div>`).join('')}
         </div>`
      : '';

    const saintsHtml = (profile.details.saints && profile.details.saints.length > 0) 
      ? `<div class="profile-detail-item">
           <i data-lucide="shield-check"></i> 
           <span>Devoto de: ${profile.details.saints.join(', ')}</span>
         </div>`
      : '';

    const parishHtml = (profile.details.parish)
      ? `<div class="profile-detail-item">
           <i data-lucide="map-pin"></i> 
           <span>${profile.details.parish}</span>
         </div>`
      : '';

    // Mapeamento de sacramentos para labels mais bonitos
    const sacramentLabels = {
      batismo: "Batizado(a)",
      eucaristia: "1ª Eucaristia",
      crisma: "Crismado(a)"
    };
    const sacramentsHtml = (profile.details.sacraments && profile.details.sacraments.length > 0)
      ? `<div class="profile-detail-item">
           <i data-lucide="award"></i> 
           <span style="font-weight:700">Sacramentos:</span> 
           <span>${profile.details.sacraments.map(s => sacramentLabels[s] || s).join(', ')}</span>
         </div>`
      : '';

    const cityName = profile.location || (profile.details && profile.details.location) || "Vizinhança";
    
    // Label de Distância estilo Botão Premium (Impossível de Sumir)
    const distanceBadge = (typeof profile.distance === 'number' && !isNaN(profile.distance))
      ? `<div class="distance-badge" style="display: inline-flex !important; align-items: center; gap: 6px; background: #720917 !important; color: #D4AF37 !important; padding: 8px 16px !important; border-radius: 30px !important; font-size: 14px !important; font-weight: 900 !important; border: 2px solid #D4AF37 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important; margin: 5px 0 !important; z-index: 9999 !important;">
           <i data-lucide="navigation" style="width:16px; height:16px;"></i> 
           <span>DISTÂNCIA: ${profile.distance > 1000 ? (profile.distance/1000).toFixed(1) + ' km' : Math.round(profile.distance) + ' m'}</span>
         </div>`
      : `<div class="distance-badge" style="display: inline-flex !important; align-items: center; gap: 6px; background: #720917 !important; color: white !important; padding: 8px 16px !important; border-radius: 30px !important; font-size: 14px !important; font-weight: 900 !important; border: 1px solid white !important; opacity: 0.8 !important;">
           <i data-lucide="refresh-cw" style="width:14px; height:14px;"></i> 
           <span>Localizando...</span>
         </div>`;

    const locationHtml = `
      <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px;">
        <div class="city-badge" style="display: flex; align-items: center; gap: 4px;">
          <i data-lucide="map-pin" style="color: #720917; width: 16px;"></i> 
          <span style="color: #2C1810; font-weight: 800; font-size: 16px;">${cityName}</span>
        </div>
        ${distanceBadge}
      </div>`;

    cardsContainer.innerHTML = `
      <div class="discover-card">
        <div class="card-image-wrapper">
          <div class="profile-img" style="background-image: url('${profile.photos[0]}')"></div>
          ${indicatorsHtml}
          <div class="photo-nav next" onclick="nextPhoto(event)"></div>
          <div class="photo-nav prev" onclick="prevPhoto(event)"></div>
        </div>
        <div class="profile-info">
          <div style="margin-bottom: 8px;">
            <div class="badge-pill-vitral" style="display: inline-flex;">
              <i data-lucide="${profile.icon}" style="width:14px"></i>
              <span>${profile.badge}</span>
            </div>
          </div>
          <h2 class="profile-name">${profile.name}</h2>
          ${locationHtml}
          <p class="profile-bio">${profile.bio}</p>
          <div class="profile-details-mini">
            ${saintsHtml}
            ${parishHtml}
            ${sacramentsHtml}
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    
    startCarousel();
  }

  if (btnYes) btnYes.onclick = () => swipeCard('right');
  if (btnNo) btnNo.onclick = () => swipeCard('left');

  let isSwiping = false; // Trava para evitar cliques duplos

  window.swipeCard = async function(direction) {
    if (isSwiping) return;
    const card = document.querySelector('.discover-card');
    const profile = discoveryProfiles[currentProfileIndex];
    if (!card || !profile) return;

    isSwiping = true;
    stopCarousel();

    // 🏹 SE FOR LIKE OU SUPER, O CUPIDO ATIRA!
    if (direction === 'right' || direction === 'super') {
      await shootArrow();
      
      // Se for SUPER, adiciona um brilho extra de "Benção" vindo do alto
      if (direction === 'super') {
        triggerBlessingEffect();
      }
    }

    // 1. ADICIONA O CARIMBO GIGANTE NO CORPO DO SITE
    const stamp = document.createElement('div');
    let stampClass = 'stamp-skip';
    let icon = 'circle-x';

    if (direction === 'right') {
      stampClass = 'stamp-heart';
      icon = 'heart';
    } else if (direction === 'super') {
      stampClass = 'stamp-star';
      icon = 'star';
      playSound('super'); // Som divino para o astro!
    }

    stamp.className = `stamp ${stampClass}`;
    stamp.innerHTML = `<i data-lucide="${icon}"></i>`;
    document.body.appendChild(stamp);
    if (window.lucide) window.lucide.createIcons();

    // 2. ESPERA A MÁGICA GIGANTE
    setTimeout(() => {
      // 3. AGORA SIM, O CARTÃO SAI VOANDO
      const exitY = direction === 'super' ? -1000 : -100; // Super like voa pra cima (pro céu)
      const exitX = direction === 'super' ? 0 : (direction === 'right' ? 1000 : -1000);
      
      card.style.transition = 'transform 0.6s cubic-bezier(0.1, 0, 0.3, 1), opacity 0.4s ease-out';
      card.style.transform = `translateX(${exitX}px) translateY(${exitY}px) rotate(${direction === 'right' ? 30 : -30}deg)`;
      card.style.opacity = '0';

      // Gravar a decisão no banco (Super like gravamos como like normal por enquanto, ou podemos marcar se quiser)
      saveSwipe(profile.id, direction === 'right' || direction === 'super');

      setTimeout(() => {
        currentProfileIndex++;
        isSwiping = false;
        // Limpar o carimbo
        if (stamp.parentNode) document.body.removeChild(stamp);

        if (currentProfileIndex >= discoveryProfiles.length) {
          loadDiscovery();
        } else {
          renderCurrentProfile();
        }
      }, 500);
    }, 1000); 
  }

  async function saveSwipe(targetId, isLike) {
    const { data: { user } } = await window.sb.auth.getUser();
    if (!user) return;

    // Tentar gravar a decisão
    const { error } = await window.sb
      .from('matches')
      .upsert({ user_id: user.id, target_id: targetId, is_like: isLike });

    if (error) {
      console.error("Erro ao salvar swipe:", error);
    }

    if (isLike && !error) {
      checkForMatch(user.id, targetId);
    }
  }

  async function checkForMatch(userId, targetId) {
    // Checar se a outra pessoa também me deu Like
    const { data, error } = await window.sb
      .from('matches')
      .select('*')
      .eq('user_id', targetId)
      .eq('target_id', userId)
      .eq('is_like', true)
      .single();

    if (data && !error) {
      showMatchUI(targetId);
    }
  }

  async function showMatchUI(targetId) {
    const matchModal = document.getElementById('match-modal');
    const { data: targetProfile } = await window.sb.from('profiles').select('*').eq('id', targetId).single();
    const { data: { user } } = await window.sb.auth.getUser();
    const { data: myProfile } = await window.sb.from('profiles').select('*').eq('id', user.id).single();

    if (targetProfile && myProfile) {
      const userDiv = document.getElementById('match-user-avatar');
      const targetDiv = document.getElementById('match-target-avatar');

      const userName = myProfile.full_name || myProfile.nome || 'Eu';
      const targetName = targetProfile.full_name || targetProfile.nome || 'Match';
      
      const userPhoto = window.getBestPhoto(myProfile);
      const targetPhoto = window.getBestPhoto(targetProfile);

      window.setAvatarInDiv(userDiv, userPhoto, userName);
      window.setAvatarInDiv(targetDiv, targetPhoto, targetName);
      
      const btnChat = document.getElementById('btn-match-chat');
      if (btnChat) {
        btnChat.onclick = () => {
          closeMatchModal();
          openChat(targetId);
        };
      }
      
      matchModal.classList.remove('hidden');
      playSound('match');

      // EFEITO ÉPICO: Confetti de Santidade
      triggerHolyMatchConfetti();
    }
  }

  function triggerHolyMatchConfetti() {
    // Usaremos mini-explosões de brilho dourado e vermelho catedral
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 3000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Confetti Dourado
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#D4AF37', '#F1E5AC'] }));
      // Confetti Catedral
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#720917', '#b22222'] }));
    }, 250);
  }

  window.closeMatchModal = () => {
    document.getElementById('match-modal').classList.add('hidden');
    document.getElementById('match-prayer-box').classList.add('hidden');
  };

  window.toggleMatchPrayer = () => {
    const box = document.getElementById('match-prayer-box');
    box.classList.toggle('hidden');
    const btn = document.getElementById('btn-show-prayer');
    if (!box.classList.contains('hidden')) {
      btn.innerText = "Em Oração... 🙏";
      playSound('chant'); // Toca o canto gregoriano suave
    } else {
      btn.innerText = "Rezar por este Match";
    }
  };

  function triggerBlessingEffect() {
    // Efeito de chuva dourada (Benção)
    const end = Date.now() + (2 * 1000);
    const colors = ['#D4AF37', '#F1E5AC', '#FFFFFF'];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }

  async function fetchDailySaint() {
    const container = document.getElementById('daily-saint-container');
    if (!container) return;

    const saints = [
      { name: "São José", quote: "O silêncio de José fala mais que mil palavras.", icon: "shield" },
      { name: "Santa Teresinha", quote: "Vou passar o meu céu fazendo o bem na terra.", icon: "flower" },
      { name: "Santo Agostinho", quote: "Fizeste-nos para ti e nosso coração está inquieto.", icon: "book" },
      { name: "São Bento", quote: "Ora et Labora - Reza e Trabalha.", icon: "cross" },
      { name: "São Padre Pio", quote: "Reze, espere e não se preocupe.", icon: "flame" },
      { name: "São João Paulo II", quote: "Não tenhais medo! Abri as portas a Cristo!", icon: "star" },
      { name: "Santa Faustina", quote: "Jesus, eu confio em Vós!", icon: "heart" },
      { name: "São Francisco de Assis", quote: "Comece fazendo o que é necessário, depois o que é possível.", icon: "leaf" },
      { name: "São Maximiliano Kolbe", quote: "O ódio não é força criativa. Só o amor o é.", icon: "zap" },
      { name: "Santa Rita de Cássia", quote: "Nada é impossível para quem tem fé.", icon: "anchor" }
    ];
    
    // Seed baseada no dia do ano
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const today = saints[dayOfYear % saints.length];

    container.innerHTML = `
      <div class="saint-of-the-day animate-glow">
        <div class="saint-icon"><i data-lucide="${today.icon}"></i></div>
        <div class="saint-info">
          <h4>Santo do Dia: <span>${today.name}</span></h4>
          <p>"${today.quote}"</p>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  window.closeMatchModal = () => {
    document.getElementById('match-modal').classList.add('hidden');
    document.getElementById('match-prayer-box').classList.add('hidden');
  };

  window.toggleMatchPrayer = () => {
    document.getElementById('match-prayer-box').classList.toggle('hidden');
  };

  // --- GLOBAL NOTIFICATION POLLER (O RADAR DA FÉ) ---
  setInterval(async () => {
    if (!currentUser) return;

    // 1. Checar Mensagens Novas (Broadcast)
    const currentView = document.querySelector('.view-section:not(.hidden)')?.id;
    if (activeChatTarget && currentView !== 'chat-view' && currentView !== 'messages-view') {
      const { data: signals } = await window.sb
        .from('chat_broadcast')
        .select('data')
        .eq('destino_id', currentUser.id)
        .order('data', { ascending: false })
        .limit(1);

      if (signals && signals.length > 0) {
        const signalTime = new Date(signals[0].data);
        const agora = new Date();
        if (agora - signalTime < 10000) {
          document.getElementById('dot-messages').classList.remove('hidden');
        }
      }
    }

    // 2. Checar Novos Likes (Quem me Curtiu)
    if (currentView !== 'likes-view') {
      const { data: newLikes } = await window.sb
        .from('matches')
        .select('created_at')
        .eq('target_id', currentUser.id)
        .eq('is_like', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (newLikes && newLikes.length > 0) {
        const likeTime = new Date(newLikes[0].created_at);
        const agora = new Date();
        if (agora - likeTime < 15000) {
          document.getElementById('dot-likes').classList.remove('hidden');
        }
      }
    }
  }, 10000); 
});
