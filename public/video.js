const me = requireSession("/login");

if (me) {
  init();
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session");
  const session = sessionId ? await getSessionById(sessionId).catch(() => null) : null;

  if (!session || (session.tutorEmail !== me.email && session.tuteeEmail !== me.email)) {
    showError("This session doesn't exist, or you're not part of it.");
    return;
  }

  const partnerEmail = otherPartyEmail(session, me.email);
  const partnerName = otherPartyName(session, me.email) || partnerEmail;
  document.getElementById("call-partner-name").textContent = partnerName;
  document.getElementById("call-subject").textContent = session.subject || "General tutoring";
  document.getElementById("call-shell").style.display = "flex";

  document.getElementById("call-report-btn").addEventListener("click", async () => {
    const reason = prompt("What's wrong with this session? (optional, but helps staff reviewing it)");
    if (reason === null) return;
    try {
      await authFetchJson("/api/reports", {
        method: "POST",
        body: JSON.stringify({ chatId: session.chatId, type: "video_session", targetId: session.id, reason: reason.trim() || null }),
      });
      alert("Reported. Mr. Machado and Ms. Way have been notified, and this session is available for them to review.");
    } catch (err) {
      alert(err.message);
    }
  });

  const statusEl = document.getElementById("call-status");
  const waitingOverlay = document.getElementById("waiting-overlay");
  const localVideo = document.getElementById("local-video");
  const remoteVideo = document.getElementById("remote-video");

  // Clicking the small picture-in-picture window swaps it with the main view.
  let mainIsLocal = false;
  function updateVideoLayout() {
    localVideo.classList.toggle("video-slot-main", mainIsLocal);
    localVideo.classList.toggle("video-slot-pip", !mainIsLocal);
    remoteVideo.classList.toggle("video-slot-main", !mainIsLocal);
    remoteVideo.classList.toggle("video-slot-pip", mainIsLocal);
  }
  [localVideo, remoteVideo].forEach((videoEl) => {
    videoEl.addEventListener("click", () => {
      if (!videoEl.classList.contains("video-slot-pip")) return;
      mainIsLocal = !mainIsLocal;
      updateVideoLayout();
    });
  });

  let localStream;
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch (err) {
    showError("Couldn't access your camera or microphone. Check your browser permissions, or use the Zoom link for this session instead.", session.zoomLink);
    return;
  }
  localVideo.srcObject = localStream;

  const isCaller = me.email === session.tutorEmail;

  // Signals over Supabase Realtime (see CallSignalBridge.tsx) instead of a
  // plain BroadcastChannel, which only relays between tabs of the same
  // browser — useless for a tutor and tutee on two separate real devices.
  if (!window.createCallSignalChannel) {
    await new Promise((resolve) => window.addEventListener("call-signal-ready", resolve, { once: true }));
  }
  const callChannel = window.createCallSignalChannel(sessionId);

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  const queuedCandidates = [];
  let offerSent = false;

  pc.ontrack = (e) => {
    remoteVideo.srcObject = e.streams[0];
    statusEl.textContent = "Connected";
    waitingOverlay.style.display = "none";
    clearTimeout(connectFallbackTimer);
  };

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      callChannel.postMessage({ type: "ice", candidate: e.candidate.toJSON() });
    }
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
      statusEl.textContent = "Connection lost";
      waitingOverlay.style.display = "flex";
      document.getElementById("waiting-text").textContent = "Lost connection to the other person.";
      showZoomFallback(session.zoomLink);
    }
  };

  async function flushQueuedCandidates() {
    while (queuedCandidates.length) {
      try {
        await pc.addIceCandidate(queuedCandidates.shift());
      } catch (err) {
        // ignore malformed/late candidates
      }
    }
  }

  callChannel.onmessage = async (e) => {
    const data = e.data;
    if (data.type === "ready") {
      if (isCaller && !offerSent) {
        offerSent = true;
        clearInterval(readyInterval);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        callChannel.postMessage({ type: "offer", sdp: pc.localDescription.toJSON() });
      }
    } else if (data.type === "offer" && !isCaller) {
      clearInterval(readyInterval);
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      await flushQueuedCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      callChannel.postMessage({ type: "answer", sdp: pc.localDescription.toJSON() });
    } else if (data.type === "answer" && isCaller) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      await flushQueuedCandidates();
    } else if (data.type === "ice") {
      const candidate = new RTCIceCandidate(data.candidate);
      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          // ignore
        }
      } else {
        queuedCandidates.push(candidate);
      }
    } else if (data.type === "leave") {
      statusEl.textContent = "They left";
      waitingOverlay.style.display = "flex";
      document.getElementById("waiting-text").textContent = `${partnerName} left the call.`;
      remoteVideo.srcObject = null;
    }
  };

  statusEl.textContent = "Waiting…";
  const readyInterval = setInterval(() => callChannel.postMessage({ type: "ready" }), 2000);
  callChannel.postMessage({ type: "ready" });

  // If the embedded call can't establish a connection within 25s, offer the
  // Zoom link (set by the tutor when scheduling) as a fallback.
  const CONNECT_FALLBACK_MS = 25000;
  const connectFallbackTimer = setTimeout(() => {
    if (pc.connectionState === "connected") return;
    showZoomFallback(session.zoomLink);
  }, CONNECT_FALLBACK_MS);

  // ---- Controls ----

  const micBtn = document.getElementById("toggle-mic");
  const camBtn = document.getElementById("toggle-cam");
  const leaveBtn = document.getElementById("leave-call");

  micBtn.addEventListener("click", () => {
    const track = localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    micBtn.classList.toggle("active", !track.enabled);
    micBtn.setAttribute("aria-pressed", String(!track.enabled));
  });

  camBtn.addEventListener("click", () => {
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    camBtn.classList.toggle("active", !track.enabled);
    camBtn.setAttribute("aria-pressed", String(!track.enabled));
  });

  function leave() {
    clearTimeout(connectFallbackTimer);
    callChannel.postMessage({ type: "leave" });
    localStream.getTracks().forEach((t) => t.stop());
    pc.close();
    window.location.href = "/app?tab=chats";
  }

  leaveBtn.addEventListener("click", leave);
  window.addEventListener("beforeunload", () => {
    callChannel.postMessage({ type: "leave" });
  });
}

function showError(message, zoomLink) {
  document.getElementById("call-error-text").textContent = message;
  const zoomBtn = document.getElementById("call-error-zoom");
  if (zoomLink) {
    zoomBtn.href = zoomLink;
    zoomBtn.style.display = "inline-block";
  }
  document.getElementById("call-error").style.display = "flex";
}

function showZoomFallback(zoomLink) {
  const fallback = document.getElementById("zoom-fallback");
  const link = document.getElementById("zoom-fallback-link");
  if (zoomLink) {
    link.href = zoomLink;
    link.textContent = "Join via Zoom Instead";
  } else {
    link.removeAttribute("href");
    link.textContent = "No Zoom link was added for this session yet";
  }
  fallback.style.display = "flex";
}
