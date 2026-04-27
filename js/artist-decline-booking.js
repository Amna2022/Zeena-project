document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://127.0.0.1:5000/api";

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

  reasonEl.value =
    "Thank you for your booking request. Unfortunately, I’m not available at this time. Please choose another available slot and I’ll be happy to help.";

  confirmBtn?.addEventListener("click", async () => {
    const reason = (reasonEl.value || "").trim();

    if (!reason) {
      reasonEl.focus();
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Declining...";

    try {
      const res = await fetch(`${API_BASE}/bookings/${booking.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "declined"
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Decline failed:", errorText);
        alert("Could not decline this booking. Please try again.");
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Confirm Decline";
        return;
      }

      const updated = await res.json();

      booking.status = updated.status || "declined";
      booking.declineReason = reason;
      localStorage.setItem("zeena_selected_booking", JSON.stringify(booking));

      const digits = String(clientPhone).replace(/\D/g, "");

      const msg = encodeURIComponent(
        `Hi ${clientName},\n\n${reason}\n\nThank you for understanding.\nZeena`
      );

      if (digits) {
        window.open(`https://wa.me/${digits}?text=${msg}`, "_blank");
      }

      window.location.href = "./artist-decline-confirmed.html";

    } catch (err) {
      console.error("Decline error:", err);
      alert("Could not connect to the server. Please try again.");
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirm Decline";
    }
  });
});