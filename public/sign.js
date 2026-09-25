const me = requireSession("/login");

if (me) {
  const isTutor = me.role === "tutor";
  const studentLabel = isTutor ? "Tutor" : "Tutee";

  document.getElementById("sign-agreement-heading").textContent = "Sign your Peer Tutoring agreement";
  document.getElementById("sign-agreement-lead").textContent =
    `Read the agreement below, then have the ${studentLabel.toLowerCase()} and a parent/guardian each fill in their name and sign. This is required before you can use Peer Tutoring.`;
  document.getElementById("agreement-preview").src = isTutor ? "/legal/tutor-agreement.pdf" : "/legal/tutee-agreement.pdf";
  document.getElementById("guardian-block-legend").textContent = `${studentLabel}'s Parent/Guardian`;
  document.getElementById("student-block-legend").textContent = studentLabel;

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  document.getElementById("sign-date-display").textContent = today.toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const guardianPad = createSignaturePad("guardian-sig-canvas", "guardian-sig-clear");
  const studentPad = createSignaturePad("student-sig-canvas", "student-sig-clear");

  document.getElementById("sign-agreement-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("sign-agreement-error");
    errorEl.classList.remove("show");
    errorEl.textContent = "";

    const guardianName = document.getElementById("guardian-name-input").value.trim();
    const studentName = document.getElementById("student-name-input").value.trim();

    if (!guardianName) return showError("Enter the parent/guardian's full name.");
    if (!studentName) return showError(`Enter the ${studentLabel.toLowerCase()}'s full name.`);
    if (guardianPad.isEmpty()) return showError("The parent/guardian needs to sign.");
    if (studentPad.isEmpty()) return showError(`The ${studentLabel.toLowerCase()} needs to sign.`);

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.classList.add("show");
    }

    const submitBtn = document.getElementById("sign-agreement-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Signing…";

    try {
      const res = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: me.email,
          role: me.role,
          studentName,
          guardianName,
          signedDate: todayIso,
          studentSignaturePng: studentPad.toDataURL(),
          guardianSignaturePng: guardianPad.toDataURL(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = "peer-tutoring-agreement.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        window.location.href = "/app";
      }, 400);
    } catch (err) {
      showError(err.message || "Something went wrong. Please try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign & Continue";
    }
  });
}

// Minimal canvas signature pad: draws on mouse/touch drag, tracks whether
// any ink has been laid down (for validation), exports a PNG data URL.
function createSignaturePad(canvasId, clearBtnId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#00203d";
  let drawing = false;
  let hasInk = false;

  function pointFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const point = e.touches ? e.touches[0] : e;
    return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
  }

  function start(e) {
    e.preventDefault();
    drawing = true;
    hasInk = true;
    const { x, y } = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e) {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = pointFromEvent(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    drawing = false;
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);

  document.getElementById(clearBtnId).addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk = false;
  });

  return {
    isEmpty: () => !hasInk,
    toDataURL: () => canvas.toDataURL("image/png"),
  };
}
