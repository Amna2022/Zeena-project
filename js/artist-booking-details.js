document.addEventListener("DOMContentLoaded", () => { // wait page load
  const raw = localStorage.getItem("zeena_selected_booking"); // get saved booking
  if (!raw) return; // stop if no data

  let data;
  try {
    data = JSON.parse(raw); // parse booking
  } catch (e) {
    console.error("Invalid booking data", e); // invalid data
    return;
  }

  const API_BASE = "http://127.0.0.1:5000/api"; // backend url

  // ---------- Helpers ----------
  const setText = (id, value) => { // set text by id
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "";
  };

  const toggleActionButtons = (status) => { // show/hide action buttons
    const actionsEl = document.querySelector(".details__actions");
    if (!actionsEl) return;

    const allowedStatuses = ["pending", "change_requested"]; // allowed statuses

    if (allowedStatuses.includes(status)) {
      actionsEl.style.display = "flex"; // show buttons
    } else {
      actionsEl.style.display = "none"; // hide buttons
    }
  };

  function formatDateTime(isoString) { // format date and time
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

    return { date, time }; // return formatted values
  }

  function formatLocationType(value) { // format location type
    if (value === "client_home") return "At Client Home";
    if (value === "artist_place") return "At Artist Place";
    return value || "";
  }

  function formatPayment(value) { // format payment method
    if (!value) return "";
    if (value === "cash") return "Cash";
    if (value === "card_future") return "Card";
    return value;
  }

  function normalizeInstagramUrl(v) { // fix instagram link
    const s = String(v || "").trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s; // full url
    if (s.startsWith("instagram.com/")) return `https://${s}`; // add https
    if (s.startsWith("@")) return `https://instagram.com/${s.slice(1)}`; // remove @
    if (!s.includes("/") && !s.includes(".")) return `https://instagram.com/${s}`; // username only
    return "";
  }

  async function updateBookingStatus(newStatus, redirectPage) { // update booking status
    try {
      const res = await fetch(`${API_BASE}/bookings/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`); // request failed
      }

      const updated = await res.json(); // get updated booking

      data.status = updated.status || newStatus; // update local status
      localStorage.setItem("zeena_selected_booking", JSON.stringify(data)); // save again

      window.location.href = redirectPage; // go next page
    } catch (err) {
      console.error("Failed to update booking status:", err);
      alert("Could not update booking status. Please try again."); // show error
    }
  }

  // ---------- Read data from new API structure ----------
  const bookingStatus = data.status || "pending"; // booking status
  const clientName = data.client?.name || ""; // client name
  const clientPhone = data.client?.whatsapp || ""; // client phone
  const clientAddress = data.client?.address || "Not provided"; // client address
  const startDateTime = data.timeslot?.start_datetime || ""; // booking datetime

  const { date, time } = formatDateTime(startDateTime); // formatted values

  // ---------- Fill UI ----------
  const statusEl = document.querySelector(".details__status");
  if (statusEl) {
    statusEl.textContent = String(bookingStatus).toUpperCase(); // show status
  }

  toggleActionButtons(bookingStatus); // control button visibility

  setText("name", clientName); // show name
  setText("phone", clientPhone); // show phone
  setText("date", date); // show date
  setText("time", time); // show time
  setText("location", clientAddress); // show address
  setText("serviceLocation", formatLocationType(data.location_type)); // show service type
  setText("payment", formatPayment(data.payment_method)); // show payment
  setText("notes", data.notes || "No additional notes"); // show notes

  const img = document.getElementById("designImg");
  if (img) {
    img.src = data.image || "../assets/img/sample-henna.jpg"; // set image
    img.alt = data.design_choice || "Henna design preview"; // set alt text
  }

  // ---------- WhatsApp ----------
  const whatsappBtn = document.getElementById("whatsappBtn");
  if (whatsappBtn) {
    const digits = String(clientPhone).replace(/\D/g, ""); // numbers only
    whatsappBtn.href = digits ? `https://wa.me/${digits}` : "https://wa.me/"; // whatsapp link
    whatsappBtn.setAttribute("rel", "noopener noreferrer");
    whatsappBtn.setAttribute("target", "_blank"); // open new tab
  }

  // ---------- Instagram ----------
  const instagramBtn = document.getElementById("instagramBtn");
  if (instagramBtn) {
    const urlFromData =
      data.instagramUrl ||
      data.instagram ||
      data.igUrl ||
      ""; // get instagram from data

    const MY_IG_USERNAME = "moonyy8889"; // fallback username
    const fallbackUrl = `https://instagram.com/${MY_IG_USERNAME}`;

    const finalUrl = normalizeInstagramUrl(urlFromData) || fallbackUrl; // final link

    instagramBtn.href = finalUrl;
    instagramBtn.setAttribute("rel", "noopener noreferrer");
    instagramBtn.setAttribute("target", "_blank"); // open new tab
  }

  // ---------- Accept Button ----------
  document.querySelector(".btn.accept")?.addEventListener("click", () => {
    updateBookingStatus("accepted", "./artist-booking-confirmed.html"); // accept booking
  });

  // ---------- Request Changes Button ----------
  document.querySelector(".btn.change")?.addEventListener("click", () => {
    updateBookingStatus("change_requested", "./artist-request-changes.html"); // request changes
  });

  // ---------- Decline Button ----------
  document.getElementById("declineBtn")?.addEventListener("click", () => {
    updateBookingStatus("declined", "./artist-decline-booking.html"); // decline booking
  });
});