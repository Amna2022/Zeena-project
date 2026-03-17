document.addEventListener("DOMContentLoaded", () => {
  const booking = JSON.parse(localStorage.getItem("zeena_selected_booking") || "null");

  if (!booking) {
    window.location.href = "./artist-dashboard.html";
    return;
  }

  function formatDateTime(isoString) {
    if (!isoString) return { date: "—", time: "—" };

    const d = new Date(isoString);

    const date = d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const time = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit"
    });

    return { date, time };
  }

  const clientName = booking.client?.name || "—";
  const designChoice = booking.design_choice || "—";
  const clientPhone = booking.client?.whatsapp || "";
  const startDateTime = booking.timeslot?.start_datetime || "";

  const { date, time } = formatDateTime(startDateTime);

  document.getElementById("d_client").textContent = clientName;
  document.getElementById("d_date").textContent = date;
  document.getElementById("d_time").textContent = time;
  document.getElementById("d_design").textContent = designChoice;

  const reasonEl = document.getElementById("declineReason");
  const confirmBtn = document.getElementById("confirmDeclineBtn");

  // default message
  reasonEl.value =
    "Thank you for your booking request. Unfortunately, I’m not available at this time. Please choose another available slot and I’ll be happy to help.";

  confirmBtn?.addEventListener("click", () => {
    const reason = (reasonEl.value || "").trim();
    if (!reason) {
      reasonEl.focus();
      return;
    }

    const digits = String(clientPhone).replace(/\D/g, "");

    const msg = encodeURIComponent(
      `Hi ${clientName},\n\n${reason}\n\nThank you for understanding.\nZeena`
    );

    const waUrl = digits
      ? `https://wa.me/${digits}?text=${msg}`
      : null;

    if (waUrl) {
      window.open(waUrl, "_blank");
    }

    window.location.href = "./artist-decline-confirmed.html";
  });
});