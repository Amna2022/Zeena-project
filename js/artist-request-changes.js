document.addEventListener("DOMContentLoaded", () => { // wait page load
  const booking = JSON.parse(localStorage.getItem("zeena_selected_booking")); // get booking

  if (!booking) {
    window.location.href = "./artist-dashboard.html"; // go back if no data
    return;
  }

  // show booking data
  document.getElementById("b_client").textContent = booking.name || "—";
  document.getElementById("b_date").textContent = booking.fullDate || booking.date || "—";
  document.getElementById("b_time").textContent = booking.time || "—";
  document.getElementById("b_design").textContent = booking.design || "—";

  const cancelBtn = document.getElementById("cancelBtn"); // cancel btn
  const sendBtn = document.getElementById("sendBtn"); // send btn
  const msg = document.getElementById("msg"); // message input

  cancelBtn?.addEventListener("click", () => {
    window.location.href = "./artist-booking-details.html"; // go back
  });

  sendBtn?.addEventListener("click", () => {
  const text = (msg.value || "").trim(); // get message
  if (!text) { msg.focus(); return; } // empty check

  booking.status = "CHANGE_REQUESTED"; // update status
  booking.changeRequestMessage = text; // save message
  localStorage.setItem("zeena_selected_booking", JSON.stringify(booking)); // save

  const digits = (booking.phone || "").replace(/\D/g, ""); // clean phone
  const waText = encodeURIComponent(text); // encode text
  const waUrl = `https://wa.me/${digits}?text=${waText}`; // whatsapp link

  window.open(waUrl, "_blank"); // open whatsapp

  window.location.href = "./artist-change-request-sent.html"; // go confirm page
});
});