document.addEventListener("DOMContentLoaded", () => { // wait page load

  const backBtn = document.getElementById("backBtn"); // back button
  const homeBtn = document.getElementById("homeBtn"); // home button
  const downloadIcsBtn = document.getElementById("downloadIcsBtn"); // download calendar button

  // fallback values if no saved data
  const fallback = {
    clientName: "Client",
    clientPhone: "",
    dateText: "",
    timeText: "",
    addressText: "",
    locationType: "",
    paymentText: "",
    startISO: "",
    durationMinutes: 120
  };

  let booking = fallback; // default booking data

  try {
    const stored = localStorage.getItem("bookingConfirmed"); // get saved booking
    if (stored) {
      booking = { ...fallback, ...JSON.parse(stored) }; // merge saved + fallback
    }
  } catch (e) {
    booking = fallback; // use fallback if error
  }

  // show data on page
  setText("clientName", booking.clientName);
  setText("clientPhone", booking.clientPhone);
  setText("dateText", booking.dateText);
  setText("timeText", booking.timeText);
  setText("addressText", booking.addressText);
  setText("locationType", booking.locationType);
  setText("paymentText", booking.paymentText);

  // back button
  backBtn?.addEventListener("click", () => history.back());

  // go to home page
  homeBtn?.addEventListener("click", () => {
    window.location.href = "../index.html";
  });

  // download calendar file
  downloadIcsBtn?.addEventListener("click", () => {

    if (!booking.startISO) {
      alert("Calendar data is not available."); // no date data
      return;
    }

    const title = `Henna Appointment - ${booking.clientName || "Client"}`; // event title

    const location =
      `${booking.addressText || ""} ${
        booking.locationType ? "(" + booking.locationType + ")" : ""
      }`.trim(); // event location

    const description =
      `Client: ${booking.clientName || ""}\n` +
      `Phone: ${booking.clientPhone || ""}\n` +
      `Payment: ${booking.paymentText || ""}`; // event details

    const ics = buildIcsEvent({
      title,
      description,
      location,
      startISO: booking.startISO,
      durationMinutes: booking.durationMinutes ?? 120
    });

    downloadTextFile("booking.ics", ics, "text/calendar;charset=utf-8"); // download file
  });

});


function setText(id, value) { // set text in element
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}


function pad2(n) { // make number 2 digits
  return String(n).padStart(2, "0");
}


// convert date to ICS format
function toIcsUtcStamp(date) {

  const y = date.getUTCFullYear();
  const m = pad2(date.getUTCMonth() + 1);
  const d = pad2(date.getUTCDate());

  const hh = pad2(date.getUTCHours());
  const mm = pad2(date.getUTCMinutes());
  const ss = pad2(date.getUTCSeconds());

  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}


function escapeIcsText(s = "") { // fix special chars
  return String(s)
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}


function buildIcsEvent({ title, description, location, startISO, durationMinutes }) { // build calendar event

  const startLocal = new Date(startISO); // start time

  if (Number.isNaN(startLocal.getTime())) {
    throw new Error("Invalid startISO for ICS."); // invalid date
  }

  const endLocal = new Date(
    startLocal.getTime() + (durationMinutes ?? 60) * 60 * 1000
  ); // end time

  const dtStart = toIcsUtcStamp(startLocal); // start format
  const dtEnd = toIcsUtcStamp(endLocal); // end format
  const dtStamp = toIcsUtcStamp(new Date()); // created time

  const uid =
    (crypto?.randomUUID
      ? crypto.randomUUID()
      : "uid-" + Math.random().toString(16).slice(2)) + "@zeena"; // unique id

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zeena//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}


function downloadTextFile(filename, text, mime = "text/plain") { // download file

  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob); // make file url

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click(); // start download
  a.remove();

  URL.revokeObjectURL(url); // clear memory
}