// ─────────────────────────────────────────────────────────────────
//  BitSocial — script.js (Login)
//  Submission via <form> HTML nativo (POST server-side, padrão clínica).
//  Mantidos: toggle de senha e efeito de fundo geométrico.
// ─────────────────────────────────────────────────────────────────

// --- Toggle visibilidade da senha ---
function togglePassword(event) {
  const btn = event.currentTarget;
  const input = btn.closest(".password-field").querySelector("input");

  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "🙈";
  } else {
    input.type = "password";
    btn.textContent = "👁";
  }

  input.focus();
}

// --- Animação parallax do fundo geométrico ---
const bg = document.querySelector(".bg-geo");
if (bg) {
  window.addEventListener("mousemove", (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    const moveX = (x - 0.5) * -40;
    const moveY = (y - 0.5) * -40;
    bg.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });
}
