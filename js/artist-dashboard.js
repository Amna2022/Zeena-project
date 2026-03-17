function showSkeleton(listId){ // show loading skeleton

  const list = document.getElementById(listId); // get list
  if(!list) return;

  list.innerHTML = ` // fake loading items
    <li class="skeleton-item">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-text">
        <div class="skeleton-line long"></div>
        <div class="skeleton-line short"></div>
      </div>
    </li>

    <li class="skeleton-item">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-text">
        <div class="skeleton-line long"></div>
        <div class="skeleton-line short"></div>
      </div>
    </li>

    <li class="skeleton-item">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-text">
        <div class="skeleton-line long"></div>
        <div class="skeleton-line short"></div>
      </div>
    </li>
  `;
}



document.addEventListener("DOMContentLoaded", () => { // wait page load
  // protect page (must login)
  if (sessionStorage.getItem("zeena_artist_logged_in") !== "true") {
    window.location.href = "./artist-login.html"; // redirect if not logged in
    return;
  }

  // logout
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn?.addEventListener("click", () => {
    sessionStorage.removeItem("zeena_artist_logged_in"); // clear login
    sessionStorage.removeItem("zeena_artist_username");
    window.location.href = "./artist-login.html"; // go login
  });

  const API_BASE = "http://127.0.0.1:5000/api"; // backend url

  function formatDateTime(isoString) { // format date/time
    const d = new Date(isoString);

    const date = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short"
    });

    const time = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit"
    });

    return { date, time };
  }

  function escapeHtml(str = "") { // prevent html injection
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }

  function renderMessage(listEl, message){ // show empty/error msg

  listEl.innerHTML = `
    <li class="dash__empty">

      <div class="dash__emptyIcon">📅</div>

      <p class="dash__emptyTitle">
        ${message}
      </p>

      <p class="dash__emptyDesc">
        When a client sends a booking request,
        it will appear here.
      </p>

    </li>
  `;
}

  function renderBookings(listEl, bookings) { // show bookings
    if (!bookings || bookings.length === 0) {
      return;
    }

    listEl.innerHTML = bookings.map((b, i) => {
      const startDateTime = b.timeslot?.start_datetime || ""; // get datetime
      const { date, time } = formatDateTime(startDateTime);
      const clientName = b.client?.name || "No name";
      const status = String(b.status || "").toUpperCase();

      return `
        <li class="dash__item" data-index="${i}">
          <div class="dash__avatar" aria-hidden="true">👤</div>

          <div class="dash__info">
            <p class="dash__name">${escapeHtml(clientName)}</p>

            <div class="dash__meta">
              <span class="dash__metaItem">
                <span aria-hidden="true">📅</span>
                <span>${escapeHtml(date)}</span>
              </span>

              <span class="dash__metaItem">
                <span aria-hidden="true">🕒</span>
                <span>${escapeHtml(time)}</span>
              </span>
            </div>
          </div>

          <div class="dash__right">
            <span class="dash__badge">${escapeHtml(status)}</span>
            <span class="dash__chev" aria-hidden="true">➡️</span>
          </div>
        </li>
      `;
    }).join("");

    listEl.querySelectorAll(".dash__item").forEach((item) => {
      item.style.cursor = "pointer";

      item.addEventListener("click", () => {
        const i = item.dataset.index;
        const selected = bookings[i];
        if (!selected) return;

        localStorage.setItem("zeena_selected_booking", JSON.stringify(selected)); // save booking
        localStorage.setItem("zeena_selected_booking_id", selected.id); // save id

        window.location.href = "./artist-booking-details.html"; // go details
      });
    });
  }

  async function loadBookingGroup(status, listId, countId, emptyMessage) { // load group
    const listEl = document.getElementById(listId);
    const countEl = document.getElementById(countId);

    if (!listEl || !countEl) return;

    renderMessage(listEl, "Loading..."); // loading msg

    try {
      const res = await fetch(`${API_BASE}/bookings?status=${status}`); // fetch data

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const bookings = await res.json(); // parse data

      countEl.textContent = bookings.length; // update count

      if (bookings.length === 0) {
        renderMessage(listEl, emptyMessage); // no data
        return;
      }

      renderBookings(listEl, bookings); // show data

    } catch (err) {
      console.error(`Error loading ${status} bookings:`, err);
      countEl.textContent = "0";
      renderMessage(listEl, `Error loading ${status} bookings`); // error msg
    }
  }

  async function loadDashboard() { // load all dashboard

    showSkeleton("pendingRequestsList"); // show skeleton
    showSkeleton("acceptedRequestsList");
    showSkeleton("declinedRequestsList");
    showSkeleton("changeRequestsList");

    await new Promise(r => setTimeout(r, 3000)); // fake delay

    await Promise.all([
      loadBookingGroup("pending", "pendingRequestsList", "pendingCount", "No pending requests"),
      loadBookingGroup("accepted", "acceptedRequestsList", "acceptedCount", "No accepted bookings"),
      loadBookingGroup("declined", "declinedRequestsList", "declinedCount", "No declined bookings"),
      loadBookingGroup("change_requested", "changeRequestsList", "changeCount", "No change requests")
    ]);
  }

  loadDashboard(); // start
});