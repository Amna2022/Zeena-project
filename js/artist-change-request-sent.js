document.addEventListener("DOMContentLoaded", () => { // wait page load
  const booking = JSON.parse(localStorage.getItem("zeena_selected_booking")); // get booking

  if (!booking) {
    window.location.href = "./artist-dashboard.html"; // go back if no data
    return;
  }

  // show booking info
  document.getElementById("s_name").textContent = booking.name || "—";
  document.getElementById("s_date").textContent = booking.fullDate || booking.date || "—";
  document.getElementById("s_time").textContent = booking.time || "—";
  document.getElementById("s_msg").textContent = booking.changeRequestMessage || "—"; // show message
});